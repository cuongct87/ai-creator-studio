import { SCHEMA_VERSION } from './model';

/**
 * Nâng dữ liệu thiết kế cũ lên phiên bản hiện tại (SCHEMA_VERSION) trước khi kiểm tra.
 * Dùng khi mở dự án đã lưu trong máy và khi mở file .zunva.
 *
 * - Không sửa đối tượng đầu vào (trả bản mới).
 * - Dữ liệu đã đúng phiên bản hoặc không nhận ra: trả nguyên, để validateDocument báo lỗi nếu sai.
 *
 * v2 → v3 (G2b ghép ảnh): mọi lớp thêm `blendMode: 'normal'`; lớp ảnh thêm `feather: 0`, `maskAssetId: null`.
 */

/** Phiên bản dữ liệu mở được (cũ hơn thì tự nâng). */
export const READABLE_SCHEMA_VERSIONS: readonly number[] = [2, SCHEMA_VERSION];

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

function layerV2toV3(layer: unknown): unknown {
  if (!isObj(layer)) return layer;
  const withBlend: Obj = { blendMode: 'normal', ...layer };
  return layer['type'] === 'image' ? { feather: 0, maskAssetId: null, ...withBlend } : withBlend;
}

function pageV2toV3(page: unknown): unknown {
  if (!isObj(page) || !Array.isArray(page['layers'])) return page;
  return { ...page, layers: page['layers'].map(layerV2toV3) };
}

export function migrateDocument(input: unknown): unknown {
  if (!isObj(input)) return input;
  let doc = input;
  if (doc['schemaVersion'] === 2) {
    doc = {
      ...doc,
      schemaVersion: 3,
      pages: Array.isArray(doc['pages']) ? doc['pages'].map(pageV2toV3) : doc['pages'],
    };
  }
  return doc;
}
