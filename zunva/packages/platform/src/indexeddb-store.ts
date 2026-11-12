import { migrateDocument, validateDocument, type DesignDocument, type Id } from '@zunva/core';
import type { PlatformResult, ProjectStore, ProjectSummary, StorageInfo, StoredAsset } from './index';

/**
 * Kho dự án bằng IndexedDB gốc (không thư viện). G1-5.
 * - Kho `projects`: { id, updatedAt, doc } — doc là DesignDocument v2, không chứa ảnh.
 * - Kho `assets`: { id, mimeType, bytes } — ảnh/phông lưu riêng.
 * Mỗi thao tác ghi nằm trong đúng một giao dịch; chỉ báo xong khi giao dịch đã hoàn tất.
 */

export interface IndexedDbStoreOptions {
  /** Đồng hồ ghi `updatedAt` (truyền vào để test). Mặc định Date.now. */
  now?: () => number;
  /** IndexedDB dùng cho test (fake-indexeddb). Mặc định là `indexedDB` của trình duyệt. */
  indexedDB?: IDBFactory;
  /** navigator.storage; null = không dùng (test). */
  storage?: StorageManager | null;
}

export const STORE_MESSAGES = {
  noIndexedDb: 'Trình duyệt này không cho lưu dự án trên máy. Hãy dùng Chrome bản mới.',
  openFailed: 'Không mở được bộ nhớ dự án trên máy. Hãy tải lại trang.',
  quota: 'Máy hết chỗ lưu. Hãy xóa bớt dự án hoặc ảnh không dùng rồi thử lại.',
  listFailed: 'Không đọc được danh sách dự án. Hãy tải lại trang.',
  notFound: 'Không tìm thấy dự án này. Có thể nó đã bị xóa.',
  corrupt: 'Dự án này bị hỏng nên không mở được.',
  invalid: 'Thiết kế có dữ liệu sai nên chưa lưu',
  saveFailed: 'Không lưu được dự án. Hãy thử lại.',
  removeFailed: 'Không xóa được dự án. Hãy thử lại.',
  badAsset: 'Ảnh không hợp lệ nên chưa lưu.',
  assetSaveFailed: 'Không lưu được ảnh. Hãy thử lại.',
  assetNotFound: 'Không tìm thấy ảnh của dự án.',
  assetLoadFailed: 'Không đọc được ảnh của dự án.',
  noEstimate: 'Trình duyệt này không cho biết dung lượng còn trống.',
} as const;

const DB_VERSION = 1;
const PROJECTS = 'projects';
const ASSETS = 'assets';

interface ProjectRecord {
  id: Id;
  updatedAt: number;
  doc: DesignDocument;
}

interface AssetRecord {
  id: Id;
  mimeType: string;
  bytes: Uint8Array;
}

const fail = <T>(error: string): PlatformResult<T> => ({ ok: false, error });

function isQuotaError(e: unknown): boolean {
  const name = typeof e === 'object' && e !== null ? (e as { name?: unknown }).name : undefined;
  return name === 'QuotaExceededError';
}

function errorText(e: unknown, fallback: string): string {
  if (e instanceof StoreUnavailable) return e.message;
  return isQuotaError(e) ? STORE_MESSAGES.quota : fallback;
}

class StoreUnavailable extends Error {}

function openDatabase(factory: IDBFactory, name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let req: IDBOpenDBRequest;
    try {
      req = factory.open(name, DB_VERSION);
    } catch {
      reject(new StoreUnavailable(STORE_MESSAGES.openFailed));
      return;
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(PROJECTS)) db.createObjectStore(PROJECTS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(ASSETS)) db.createObjectStore(ASSETS, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(new StoreUnavailable(STORE_MESSAGES.openFailed));
  });
}

/**
 * Runs `body` in one transaction and resolves only after the transaction commits.
 * `body` must issue requests via callbacks (no `await` inside), so the transaction stays active.
 */
function inTransaction<T>(
  db: IDBDatabase,
  stores: string[],
  mode: IDBTransactionMode,
  body: (tx: IDBTransaction, done: (value: T) => void) => void,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let tx: IDBTransaction;
    try {
      tx = db.transaction(stores, mode);
    } catch (e) {
      reject(e);
      return;
    }
    let result: { value: T } | null = null;
    tx.oncomplete = () => (result ? resolve(result.value) : reject(new Error('transaction finished without result')));
    tx.onerror = () => reject(tx.error ?? new Error('transaction error'));
    tx.onabort = () => reject(tx.error ?? new Error('transaction aborted'));
    try {
      body(tx, (value) => {
        result = { value };
      });
    } catch (e) {
      try {
        tx.abort();
      } catch {
        // already finished
      }
      reject(e);
    }
  });
}

/** Every asset ID a document refers to (defensive: also reads layers of damaged documents). */
function assetIdsOf(doc: unknown): Set<string> {
  const ids = new Set<string>();
  if (typeof doc !== 'object' || doc === null) return ids;
  const d = doc as { assets?: unknown; pages?: unknown };
  if (typeof d.assets === 'object' && d.assets !== null) {
    for (const key of Object.keys(d.assets)) ids.add(key);
  }
  if (Array.isArray(d.pages)) {
    for (const page of d.pages as Array<{ background?: { imageAssetId?: unknown }; layers?: unknown }>) {
      const bg = page?.background?.imageAssetId;
      if (typeof bg === 'string') ids.add(bg);
      if (Array.isArray(page?.layers)) {
        for (const layer of page.layers as Array<{ assetId?: unknown; maskAssetId?: unknown }>) {
          if (typeof layer?.assetId === 'string') ids.add(layer.assetId);
          if (typeof layer?.maskAssetId === 'string') ids.add(layer.maskAssetId);
        }
      }
    }
  }
  return ids;
}

function invalidMessage(errors: string[]): string {
  const shown = errors.slice(0, 3).join('; ');
  const more = errors.length > 3 ? ` (và ${errors.length - 3} lỗi khác)` : '';
  return `${STORE_MESSAGES.invalid}: ${shown}${more}`;
}

function defaultStorage(): StorageManager | null {
  if (typeof navigator === 'undefined') return null;
  return navigator.storage ?? null;
}

export function createIndexedDbProjectStore(dbName = 'c87', options: IndexedDbStoreOptions = {}): ProjectStore {
  const now = options.now ?? Date.now;
  const factory = options.indexedDB ?? (typeof indexedDB === 'undefined' ? undefined : indexedDB);
  const storage = options.storage !== undefined ? options.storage : defaultStorage();
  let dbPromise: Promise<IDBDatabase> | null = null;
  let persistRequested = false;

  /** Ask once for persistent storage so the browser does not evict projects when space is low. */
  function requestPersistence(): void {
    if (persistRequested || !storage || typeof storage.persist !== 'function') return;
    persistRequested = true;
    Promise.resolve()
      .then(() => storage.persist())
      .catch(() => undefined);
  }

  function db(): Promise<IDBDatabase> {
    if (!factory) return Promise.reject(new StoreUnavailable(STORE_MESSAGES.noIndexedDb));
    if (!dbPromise) {
      const opening: Promise<IDBDatabase> = openDatabase(factory, dbName).then((database) => {
        // Tab khác nâng cấp cơ sở dữ liệu, hoặc trình duyệt tự đóng kết nối: đóng và quên
        // kết nối cũ để lần thao tác sau tự mở lại, không bắt người dùng tải lại trang.
        const forget = () => {
          if (dbPromise === opening) dbPromise = null;
        };
        database.onversionchange = () => {
          database.close();
          forget();
        };
        database.onclose = forget;
        return database;
      });
      dbPromise = opening;
      opening.catch(() => {
        if (dbPromise === opening) dbPromise = null;
      });
      requestPersistence();
    }
    return dbPromise;
  }

  return {
    async list() {
      try {
        const records = await inTransaction<ProjectRecord[]>(await db(), [PROJECTS], 'readonly', (tx, done) => {
          const req = tx.objectStore(PROJECTS).getAll();
          req.onsuccess = () => done(req.result as ProjectRecord[]);
        });
        const out: ProjectSummary[] = [];
        for (const rec of records) {
          // Damaged records are still listed (so the user can delete them), with safe defaults.
          const doc = rec.doc as Partial<DesignDocument> | undefined;
          out.push({
            id: rec.id,
            name: typeof doc?.name === 'string' && doc.name.trim() !== '' ? doc.name : '(Chưa đặt tên)',
            updatedAt: typeof rec.updatedAt === 'number' ? rec.updatedAt : 0,
            pageCount: Array.isArray(doc?.pages) ? doc.pages.length : 0,
          });
        }
        out.sort((a, b) => b.updatedAt - a.updatedAt || a.id.localeCompare(b.id));
        return { ok: true, value: out };
      } catch (e) {
        return fail(errorText(e, STORE_MESSAGES.listFailed));
      }
    },

    async load(id) {
      try {
        const rec = await inTransaction<ProjectRecord | undefined>(await db(), [PROJECTS], 'readonly', (tx, done) => {
          const req = tx.objectStore(PROJECTS).get(id);
          req.onsuccess = () => done(req.result as ProjectRecord | undefined);
        });
        if (!rec) return fail(STORE_MESSAGES.notFound);
        const checked = validateDocument(migrateDocument(rec.doc)); // dự án lưu trước G2b (v2) tự nâng lên v3
        if (!checked.ok) return fail(STORE_MESSAGES.corrupt);
        return { ok: true, value: checked.value };
      } catch (e) {
        return fail(errorText(e, STORE_MESSAGES.corrupt));
      }
    },

    async save(doc) {
      const before = validateDocument(doc);
      if (!before.ok) return fail(invalidMessage(before.errors));
      const stored: DesignDocument = { ...before.value, updatedAt: now() };
      const after = validateDocument(stored);
      if (!after.ok) return fail(invalidMessage(after.errors));
      try {
        const record: ProjectRecord = { id: stored.id, updatedAt: stored.updatedAt, doc: stored };
        await inTransaction<void>(await db(), [PROJECTS], 'readwrite', (tx, done) => {
          tx.objectStore(PROJECTS).put(record);
          done(undefined);
        });
        return { ok: true, value: stored };
      } catch (e) {
        return fail(errorText(e, STORE_MESSAGES.saveFailed));
      }
    },

    async remove(id) {
      try {
        await inTransaction<void>(await db(), [PROJECTS, ASSETS], 'readwrite', (tx, done) => {
          const projects = tx.objectStore(PROJECTS);
          const assets = tx.objectStore(ASSETS);
          const getReq = projects.get(id);
          getReq.onsuccess = () => {
            const removed = getReq.result as ProjectRecord | undefined;
            if (!removed) {
              done(undefined); // already gone: deleting twice is fine
              return;
            }
            projects.delete(id);
            // Ảnh thu nhỏ của "Tiếp tục thiết kế" (G2) đi theo dự án.
            assets.delete(`thumb_${id}`);
            const allReq = projects.getAll();
            allReq.onsuccess = () => {
              const stillUsed = new Set<string>();
              for (const other of allReq.result as ProjectRecord[]) {
                if (other.id === id) continue;
                for (const assetId of assetIdsOf(other.doc)) stillUsed.add(assetId);
              }
              for (const assetId of assetIdsOf(removed.doc)) {
                if (!stillUsed.has(assetId)) assets.delete(assetId);
              }
              done(undefined);
            };
          };
        });
        return { ok: true, value: undefined };
      } catch (e) {
        return fail(errorText(e, STORE_MESSAGES.removeFailed));
      }
    },

    async collectUnusedAssets() {
      try {
        const removed = await inTransaction<number>(await db(), [PROJECTS, ASSETS], 'readwrite', (tx, done) => {
          const allReq = tx.objectStore(PROJECTS).getAll();
          allReq.onsuccess = () => {
            const used = new Set<string>();
            for (const rec of allReq.result as ProjectRecord[]) {
              used.add(`thumb_${rec.id}`);
              for (const assetId of assetIdsOf(rec.doc)) used.add(assetId);
            }
            const assets = tx.objectStore(ASSETS);
            const keysReq = assets.getAllKeys();
            keysReq.onsuccess = () => {
              let count = 0;
              for (const key of keysReq.result) {
                if (typeof key === 'string' && !used.has(key)) {
                  assets.delete(key);
                  count++;
                }
              }
              done(count);
            };
          };
        });
        return { ok: true, value: removed };
      } catch (e) {
        return fail(errorText(e, STORE_MESSAGES.removeFailed));
      }
    },

    async putAsset(id, mimeType, bytes) {
      if (typeof id !== 'string' || id === '' || typeof mimeType !== 'string' || mimeType === '' || !(bytes instanceof Uint8Array)) {
        return fail(STORE_MESSAGES.badAsset);
      }
      try {
        const record: AssetRecord = { id, mimeType, bytes: bytes.slice() };
        await inTransaction<void>(await db(), [ASSETS], 'readwrite', (tx, done) => {
          tx.objectStore(ASSETS).put(record);
          done(undefined);
        });
        return { ok: true, value: undefined };
      } catch (e) {
        return fail(errorText(e, STORE_MESSAGES.assetSaveFailed));
      }
    },

    async getAsset(id) {
      try {
        const rec = await inTransaction<AssetRecord | undefined>(await db(), [ASSETS], 'readonly', (tx, done) => {
          const req = tx.objectStore(ASSETS).get(id);
          req.onsuccess = () => done(req.result as AssetRecord | undefined);
        });
        if (!rec || !(rec.bytes instanceof Uint8Array)) return fail(STORE_MESSAGES.assetNotFound);
        const asset: StoredAsset = { mimeType: rec.mimeType, bytes: new Uint8Array(rec.bytes) };
        return { ok: true, value: asset };
      } catch (e) {
        return fail(errorText(e, STORE_MESSAGES.assetLoadFailed));
      }
    },

    async storageInfo() {
      if (!storage || typeof storage.estimate !== 'function') return fail(STORE_MESSAGES.noEstimate);
      try {
        const est = await storage.estimate();
        const info: StorageInfo = { usedBytes: est.usage ?? 0, quotaBytes: est.quota ?? 0 };
        return { ok: true, value: info };
      } catch {
        return fail(STORE_MESSAGES.noEstimate);
      }
    },
  };
}
