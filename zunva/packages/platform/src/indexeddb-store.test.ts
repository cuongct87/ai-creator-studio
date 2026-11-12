import {
  createDocument,
  createIdGenerator,
  createImageLayer,
  createPage,
  createTextLayer,
  seededRandom,
  type DesignDocument,
} from '@zunva/core';
import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it } from 'vitest';
import { createIndexedDbProjectStore, STORE_MESSAGES } from './indexeddb-store';
import type { ProjectStore } from './index';

let clock = 1_000;
let store: ProjectStore;
let factory: IDBFactory;
const nextId = createIdGenerator(seededRandom(7));

function makeDoc(name = 'Thiệp cưới Hùng – Lan', assetIds: string[] = []): DesignDocument {
  const page = createPage(nextId('page'), 1080, 1350);
  page.layers.push(createTextLayer(nextId('layer'), { text: 'Trân trọng kính mời' }));
  const assets: DesignDocument['assets'] = {};
  for (const assetId of assetIds) {
    assets[assetId] = { id: assetId, kind: 'image', mimeType: 'image/png', name: null, hash: null, width: 10, height: 10 };
    page.layers.push(createImageLayer(nextId('layer'), assetId));
  }
  return createDocument(nextId('doc'), page, 500, { name, assets });
}

beforeEach(() => {
  clock = 1_000;
  factory = new IDBFactory();
  store = createIndexedDbProjectStore('test', { indexedDB: factory, now: () => clock, storage: null });
});

describe('ProjectStore (IndexedDB)', () => {
  it('lưu rồi đọc lại giống hệt, kho ghi updatedAt', async () => {
    const doc = makeDoc();
    clock = 5_000;
    const saved = await store.save(doc);
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(saved.value.updatedAt).toBe(5_000);

    // Fresh store on the same database: data really is on "disk", not in memory.
    const reopened = createIndexedDbProjectStore('test', { indexedDB: factory, storage: null });
    const loaded = await reopened.load(doc.id);
    expect(loaded).toEqual({ ok: true, value: { ...doc, updatedAt: 5_000 } });
  });

  it('danh sách xếp mới sửa trước, có tên và số trang', async () => {
    const a = makeDoc('A');
    const b = makeDoc('B');
    clock = 10;
    await store.save(a);
    clock = 20;
    await store.save(b);
    clock = 30;
    await store.save({ ...a, name: 'A đã sửa' });
    const list = await store.list();
    expect(list).toEqual({
      ok: true,
      value: [
        { id: a.id, name: 'A đã sửa', updatedAt: 30, pageCount: 1 },
        { id: b.id, name: 'B', updatedAt: 20, pageCount: 1 },
      ],
    });
  });

  it('xóa dự án', async () => {
    const doc = makeDoc();
    await store.save(doc);
    expect((await store.remove(doc.id)).ok).toBe(true);
    expect(await store.load(doc.id)).toEqual({ ok: false, error: STORE_MESSAGES.notFound });
    expect(await store.list()).toEqual({ ok: true, value: [] });
    // Deleting again is harmless.
    expect((await store.remove(doc.id)).ok).toBe(true);
  });

  it('từ chối tài liệu sai, không ghi gì', async () => {
    const bad = { ...makeDoc(), schemaVersion: 1 } as unknown as DesignDocument;
    const result = await store.save(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain(STORE_MESSAGES.invalid);
    expect(await store.list()).toEqual({ ok: true, value: [] });
  });

  it('dữ liệu hỏng trong kho: load báo lỗi dễ hiểu, list vẫn hiện để xóa được', async () => {
    const doc = makeDoc();
    await store.save(doc);
    // Corrupt the stored record directly (simulates a damaged database).
    await new Promise<void>((resolve, reject) => {
      const open = factory.open('test');
      open.onsuccess = () => {
        const tx = open.result.transaction('projects', 'readwrite');
        tx.objectStore('projects').put({ id: doc.id, updatedAt: 1, doc: { id: doc.id, pages: 'hỏng' } });
        tx.oncomplete = () => {
          open.result.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
    });
    expect(await store.load(doc.id)).toEqual({ ok: false, error: STORE_MESSAGES.corrupt });
    const list = await store.list();
    expect(list.ok && list.value).toEqual([{ id: doc.id, name: '(Chưa đặt tên)', updatedAt: 1, pageCount: 0 }]);
    expect((await store.remove(doc.id)).ok).toBe(true);
  });

  it('dự án lưu trước G2b (dữ liệu v2) vẫn mở được, tự nâng lên v3', async () => {
    const doc = makeDoc('Thiệp cưới cũ', ['img_old']);
    await store.putAsset('img_old', 'image/png', new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]));
    const old = JSON.parse(JSON.stringify(doc)) as Record<string, unknown> & { pages: Array<{ layers: Array<Record<string, unknown>> }> };
    old['schemaVersion'] = 2;
    for (const l of old.pages[0]!.layers) {
      delete l['blendMode'];
      delete l['feather'];
      delete l['maskAssetId'];
    }
    await new Promise<void>((resolve, reject) => {
      const open = factory.open('test');
      open.onupgradeneeded = () => {
        open.result.createObjectStore('projects', { keyPath: 'id' });
        open.result.createObjectStore('assets', { keyPath: 'id' });
      };
      open.onsuccess = () => {
        const tx = open.result.transaction('projects', 'readwrite');
        tx.objectStore('projects').put({ id: doc.id, updatedAt: 1, doc: old });
        tx.oncomplete = () => {
          open.result.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
    });
    const r = await store.load(doc.id);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.schemaVersion).toBe(3);
    expect(r.value.pages[0]!.layers.map((l) => l.blendMode)).toEqual(['normal', 'normal']);
    expect(r.value.pages[0]!.layers[1]).toMatchObject({ type: 'image', feather: 0, maskAssetId: null });
    // Lưu lại ghi bản v3.
    expect((await store.save(r.value)).ok).toBe(true);
  });

  it('không giới hạn 12 dự án: lưu được 200 dự án', async () => {
    const ids: string[] = [];
    for (let i = 0; i < 200; i++) {
      clock = 1_000 + i;
      const doc = makeDoc(`Dự án ${i}`);
      ids.push(doc.id);
      expect((await store.save(doc)).ok).toBe(true);
    }
    const list = await store.list();
    expect(list.ok).toBe(true);
    if (!list.ok) return;
    expect(list.value).toHaveLength(200);
    expect(list.value[0]?.name).toBe('Dự án 199');
    expect(new Set(list.value.map((p) => p.id))).toEqual(new Set(ids));
  });

  it('ảnh lưu riêng, đọc lại đúng từng byte', async () => {
    const bytes = new Uint8Array([137, 80, 78, 71, 0, 255, 7]);
    expect((await store.putAsset('asset_a', 'image/png', bytes)).ok).toBe(true);
    bytes[0] = 0; // changing the caller's array must not change the stored copy
    expect(await store.getAsset('asset_a')).toEqual({
      ok: true,
      value: { mimeType: 'image/png', bytes: new Uint8Array([137, 80, 78, 71, 0, 255, 7]) },
    });
    expect(await store.getAsset('khong_co')).toEqual({ ok: false, error: STORE_MESSAGES.assetNotFound });
  });

  it('xóa dự án không xóa nhầm ảnh mà dự án khác còn dùng', async () => {
    await store.putAsset('asset_shared', 'image/png', new Uint8Array([1]));
    await store.putAsset('asset_only_a', 'image/png', new Uint8Array([2]));
    const a = makeDoc('A', ['asset_shared', 'asset_only_a']);
    const b = makeDoc('B', ['asset_shared']);
    await store.save(a);
    await store.save(b);

    await store.remove(a.id);
    expect((await store.getAsset('asset_shared')).ok).toBe(true);
    expect((await store.getAsset('asset_only_a')).ok).toBe(false);

    await store.remove(b.id);
    expect((await store.getAsset('asset_shared')).ok).toBe(false);
  });

  it('ảnh sai bị từ chối', async () => {
    const r = await store.putAsset('', 'image/png', new Uint8Array([1]));
    expect(r).toEqual({ ok: false, error: STORE_MESSAGES.badAsset });
  });

  it('không có IndexedDB: báo lỗi tiếng Việt, không sập', async () => {
    // Node has no global indexedDB, so a store without the fake factory has nothing to open.
    expect(typeof globalThis.indexedDB).toBe('undefined');
    const noIdb = createIndexedDbProjectStore('x', { storage: null });
    expect(await noIdb.list()).toEqual({ ok: false, error: STORE_MESSAGES.noIndexedDb });
    expect(await noIdb.save(makeDoc())).toEqual({ ok: false, error: STORE_MESSAGES.noIndexedDb });
  });

  it('dung lượng: dùng navigator.storage.estimate, xin lưu bền một lần', async () => {
    let persistCalls = 0;
    const storage = {
      persist: async () => {
        persistCalls++;
        return true;
      },
      estimate: async () => ({ usage: 1234, quota: 99_999 }),
    } as unknown as StorageManager;
    const s = createIndexedDbProjectStore('quota', { indexedDB: factory, storage });
    await s.list();
    await s.list();
    expect(persistCalls).toBe(1);
    expect(await s.storageInfo()).toEqual({ ok: true, value: { usedBytes: 1234, quotaBytes: 99_999 } });
    expect(await store.storageInfo()).toEqual({ ok: false, error: STORE_MESSAGES.noEstimate });
  });
});
