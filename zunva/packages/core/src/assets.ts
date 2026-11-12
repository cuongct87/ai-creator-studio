import type { DesignDocument, Id } from './model';

/** Ảnh mà tài liệu thật sự đang dùng: ảnh của lớp, mặt nạ tẩy, ảnh nền trang. */
export function referencedAssetIds(doc: DesignDocument): Set<Id> {
  const used = new Set<Id>();
  for (const page of doc.pages) {
    if (page.background.imageAssetId !== null) used.add(page.background.imageAssetId);
    for (const layer of page.layers) {
      if (layer.type !== 'image') continue;
      used.add(layer.assetId);
      if (layer.maskAssetId !== null) used.add(layer.maskAssetId);
    }
  }
  return used;
}

/**
 * Bỏ khỏi `doc.assets` những ảnh không còn được dùng (ví dụ mặt nạ của các nét tẩy cũ).
 * Không có gì để bỏ thì trả đúng đối tượng cũ. Dùng lúc mở dự án (lịch sử hoàn tác chỉ nằm trong bộ nhớ).
 */
export function pruneUnusedAssets(doc: DesignDocument): DesignDocument {
  const used = referencedAssetIds(doc);
  const ids = Object.keys(doc.assets);
  if (ids.every((id) => used.has(id))) return doc;
  const assets: DesignDocument['assets'] = {};
  for (const id of ids) if (used.has(id)) assets[id] = doc.assets[id]!;
  return { ...doc, assets };
}
