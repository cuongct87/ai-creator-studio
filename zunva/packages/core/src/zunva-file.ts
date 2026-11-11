/**
 * File `.zunva`: lưu một thiết kế kèm toàn bộ ảnh/phông thành một file để gửi đi và mở lại.
 *
 * Bên trong là ZIP không nén:
 *   manifest.json   { format: "zunva", formatVersion: 1, schemaVersion: 2, createdAt, app }
 *   document.json   DesignDocument (schema v2)
 *   assets/<id>     nội dung từng tài nguyên; kiểu file lấy từ document.assets[id].mimeType
 *
 * Mở file lạ phải an toàn: mọi lỗi trả về danh sách lý do tiếng Việt, không ném lỗi, không
 * nhận tài liệu chưa qua `validateDocument`.
 */

import { PRODUCT_NAME } from './brand';
import type { DesignDocument, Id } from './model';
import { SCHEMA_VERSION } from './model';
import { validateDocument } from './validate';
import { readZip, utf8Decode, utf8Encode, writeZip } from './zip';

export const ZUNVA_FORMAT = 'zunva';
export const ZUNVA_FORMAT_VERSION = 1;
export const ZUNVA_EXTENSION = '.zunva';
export const ZUNVA_MIME_TYPE = 'application/octet-stream';
/** Giới hạn khi mở file: 300 MB, 2000 mục. */
export const ZUNVA_MAX_BYTES = 300 * 1024 * 1024;
export const ZUNVA_MAX_ENTRIES = 2000;

const MANIFEST = 'manifest.json';
const DOCUMENT = 'document.json';
const ASSET_PREFIX = 'assets/';
/** ID tài nguyên dùng làm tên file nên chỉ nhận chữ Latin, số, `_`, `-`. */
const SAFE_ASSET_ID = /^[A-Za-z0-9_-]{1,64}$/;
const TOO_LARGE = 'Thiết kế quá lớn để lưu thành một file (> 300 MB)';

export interface ZunvaManifest {
  format: typeof ZUNVA_FORMAT;
  formatVersion: number;
  schemaVersion: number;
  createdAt: number;
  app: string;
}

export interface ZunvaContent {
  document: DesignDocument;
  /** Nội dung từng tài nguyên, theo ID trong `document.assets`. */
  assets: Record<Id, Uint8Array>;
}

export type ZunvaResult<T> = { ok: true; value: T } | { ok: false; errors: string[] };

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function parseJson(bytes: Uint8Array, label: string, errors: string[]): unknown {
  const text = utf8Decode(bytes);
  if (text === null) {
    errors.push(`${label}: không phải chữ UTF-8 hợp lệ`);
    return undefined;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    errors.push(`${label}: không đọc được (JSON hỏng)`);
    return undefined;
  }
}

/**
 * Đóng gói thiết kế và tài nguyên thành byte của file `.zunva`.
 * Cùng thiết kế, cùng tài nguyên, cùng `now` → cùng byte (tiện so sánh, kiểm thử).
 */
export function packZunva(
  document: DesignDocument,
  assets: Readonly<Record<Id, Uint8Array>>,
  now: number,
): ZunvaResult<Uint8Array> {
  const checked = validateDocument(document);
  if (!checked.ok) return { ok: false, errors: checked.errors.map((e) => `Thiết kế không hợp lệ: ${e}`) };

  const errors: string[] = [];
  const ids = Object.keys(document.assets).sort();
  for (const id of ids) {
    if (!SAFE_ASSET_ID.test(id)) errors.push(`Tài nguyên "${id}": ID chỉ được dùng chữ Latin, số, _ và -`);
    if (!Object.hasOwn(assets, id)) errors.push(`Tài nguyên "${id}": thiếu nội dung`);
  }
  for (const id of Object.keys(assets)) {
    if (!Object.hasOwn(document.assets, id)) errors.push(`Tài nguyên "${id}": không có trong thiết kế`);
  }
  if (errors.length > 0) return { ok: false, errors };

  const manifest: ZunvaManifest = {
    format: ZUNVA_FORMAT,
    formatVersion: ZUNVA_FORMAT_VERSION,
    schemaVersion: SCHEMA_VERSION,
    createdAt: now,
    app: PRODUCT_NAME,
  };
  const entries = [
    { name: MANIFEST, data: utf8Encode(JSON.stringify(manifest)) },
    { name: DOCUMENT, data: utf8Encode(JSON.stringify(document)) },
    ...ids.map((id) => ({ name: ASSET_PREFIX + id, data: assets[id]! })),
  ];
  // Kiểm tra trên kích thước file thật (gồm cả phần đầu và mục lục ZIP), đúng ngưỡng mà
  // unpackZunva dùng, để file lưu được thì chắc chắn mở lại được.
  const total = entries.reduce((n, e) => n + e.data.length, 0);
  if (total > ZUNVA_MAX_BYTES) return { ok: false, errors: [TOO_LARGE] };
  const bytes = writeZip(entries, now);
  if (bytes.length > ZUNVA_MAX_BYTES) return { ok: false, errors: [TOO_LARGE] };
  return { ok: true, value: bytes };
}

function checkManifest(value: unknown, errors: string[]): void {
  if (!isObj(value)) {
    errors.push('manifest.json: sai cấu trúc');
    return;
  }
  if (value['format'] !== ZUNVA_FORMAT) {
    errors.push('Không phải file thiết kế .zunva');
    return;
  }
  const fv = value['formatVersion'];
  if (typeof fv !== 'number' || !Number.isInteger(fv) || fv < 1) {
    errors.push('manifest.json: thiếu phiên bản định dạng');
  } else if (fv > ZUNVA_FORMAT_VERSION) {
    errors.push('File được tạo bởi phiên bản app mới hơn. Hãy cập nhật app rồi mở lại.');
  }
  if (value['schemaVersion'] !== SCHEMA_VERSION) {
    errors.push(`manifest.json: phiên bản dữ liệu ${String(value['schemaVersion'])} chưa hỗ trợ`);
  }
}

/** Mở byte của file `.zunva`. Không bao giờ ném lỗi với dữ liệu lạ. */
export function unpackZunva(bytes: Uint8Array): ZunvaResult<ZunvaContent> {
  const zip = readZip(bytes, { maxEntries: ZUNVA_MAX_ENTRIES, maxTotalBytes: ZUNVA_MAX_BYTES });
  if (!zip.ok) return { ok: false, errors: [zip.error] };

  const errors: string[] = [];
  const seen = new Set<string>();
  let manifestBytes: Uint8Array | null = null;
  let documentBytes: Uint8Array | null = null;
  const assetFiles = new Map<string, Uint8Array>();

  for (const entry of zip.entries) {
    const name = entry.name;
    if (seen.has(name)) {
      errors.push(`Tên file bị trùng: "${name}"`);
      continue;
    }
    seen.add(name);
    if (name === MANIFEST) manifestBytes = entry.data;
    else if (name === DOCUMENT) documentBytes = entry.data;
    else if (name.startsWith(ASSET_PREFIX) && SAFE_ASSET_ID.test(name.slice(ASSET_PREFIX.length))) {
      assetFiles.set(name.slice(ASSET_PREFIX.length), entry.data);
    } else errors.push(`File lạ trong gói: "${name}"`);
  }
  if (manifestBytes === null) errors.push('Thiếu manifest.json — không phải file .zunva');
  if (documentBytes === null) errors.push('Thiếu document.json');
  if (errors.length > 0 || manifestBytes === null || documentBytes === null) return { ok: false, errors };

  // JSON hỏng thì parseJson đã ghi lỗi; không kiểm cấu trúc nữa để khỏi báo hai lỗi trùng ý.
  const manifest = parseJson(manifestBytes, 'manifest.json', errors);
  if (errors.length === 0) checkManifest(manifest, errors);
  if (errors.length > 0) return { ok: false, errors };

  const raw = parseJson(documentBytes, 'document.json', errors);
  if (errors.length > 0) return { ok: false, errors };
  const checked = validateDocument(raw);
  if (!checked.ok) return { ok: false, errors: checked.errors.map((e) => `Thiết kế không hợp lệ: ${e}`) };
  const document = checked.value;

  const assets: Record<Id, Uint8Array> = {};
  for (const id of Object.keys(document.assets)) {
    const data = assetFiles.get(id);
    if (data === undefined) errors.push(`Thiếu tài nguyên "${id}" mà thiết kế đang dùng`);
    else assets[id] = data;
  }
  for (const id of assetFiles.keys()) {
    if (!Object.hasOwn(document.assets, id)) errors.push(`Tài nguyên thừa "${id}" không có trong thiết kế`);
  }
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: { document, assets } };
}
