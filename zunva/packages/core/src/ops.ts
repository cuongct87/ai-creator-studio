import type { Asset, Background, DesignDocument, Id, ImageLayer, Layer, Page, ShapeLayer, TextLayer } from './model';
import { assetErrors, layerErrors, pageInfoErrors } from './validate';

/**
 * Thao tác (op) là đơn vị thay đổi nhỏ nhất, có thể đảo ngược.
 * Mọi thay đổi tài liệu đi qua op — dùng cho hoàn tác, tự lưu, và sau này đồng bộ
 * hoặc nhiều người cùng sửa. Op là dữ liệu thuần (JSON), gửi đi và lưu lại được.
 *
 * applyOp không sửa tài liệu cũ: trả về tài liệu mới (dùng chung phần không đổi)
 * cùng op đảo ngược.
 */

type LayerFields<T extends Layer> = Omit<T, 'id' | 'type'>;

/** Các trường có thể sửa của một lớp. Trường không thuộc loại lớp đó bị từ chối khi áp dụng. */
export type LayerPatch = Partial<LayerFields<TextLayer>> &
  Partial<LayerFields<ImageLayer>> &
  Partial<LayerFields<ShapeLayer>>;

export type PagePatch = Partial<{
  width: number;
  height: number;
  background: Background;
  duration: number | null;
}>;

export type Op =
  | { op: 'addLayer'; pageId: Id; index: number; layer: Layer }
  | { op: 'removeLayer'; pageId: Id; layerId: Id }
  | { op: 'updateLayer'; pageId: Id; layerId: Id; set: LayerPatch }
  | { op: 'moveLayer'; pageId: Id; layerId: Id; toIndex: number }
  | { op: 'addPage'; index: number; page: Page }
  | { op: 'removePage'; pageId: Id }
  | { op: 'updatePage'; pageId: Id; set: PagePatch }
  | { op: 'addAsset'; asset: Asset }
  | { op: 'removeAsset'; assetId: Id }
  | { op: 'rename'; name: string };

export class OpError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpError';
  }
}

export interface OpResult {
  doc: DesignDocument;
  inverse: Op;
}

/** Kiểm tra khóa là thuộc tính riêng (không lẫn `toString`, `constructor`… của JavaScript). */
const hasOwn = (o: object, key: string): boolean => Object.hasOwn(o, key);

const assetIdSet = (doc: DesignDocument): Set<string> => new Set(Object.keys(doc.assets));

/** Ném lỗi nếu phần tử mới không hợp lệ: chặn dữ liệu hỏng ngay khi thao tác, không chờ tới lúc lưu. */
function ensureValid(errors: string[]): void {
  if (errors.length > 0) throw new OpError(`Dữ liệu không hợp lệ: ${errors.slice(0, 3).join('; ')}`);
}

function pageIndex(doc: DesignDocument, pageId: Id): number {
  const i = doc.pages.findIndex((p) => p.id === pageId);
  if (i < 0) throw new OpError(`Không có trang "${pageId}"`);
  return i;
}

function layerIndex(page: Page, layerId: Id): number {
  const i = page.layers.findIndex((l) => l.id === layerId);
  if (i < 0) throw new OpError(`Trang "${page.id}" không có lớp "${layerId}"`);
  return i;
}

function idExists(doc: DesignDocument, id: Id): boolean {
  if (doc.id === id || hasOwn(doc.assets, id)) return true;
  return doc.pages.some((p) => p.id === id || p.layers.some((l) => l.id === id));
}

function withPage(doc: DesignDocument, index: number, page: Page): DesignDocument {
  const pages = doc.pages.slice();
  pages[index] = page;
  return { ...doc, pages };
}

function checkIndex(index: number, max: number, what: string): void {
  if (!Number.isInteger(index) || index < 0 || index > max) {
    throw new OpError(`Vị trí ${what} ${index} không hợp lệ (0 → ${max})`);
  }
}

function assetInUse(doc: DesignDocument, assetId: Id): boolean {
  return doc.pages.some(
    (p) =>
      p.background.imageAssetId === assetId ||
      p.layers.some((l) => l.type === 'image' && l.assetId === assetId),
  );
}

export function applyOp(doc: DesignDocument, op: Op): OpResult {
  switch (op.op) {
    case 'addLayer': {
      const pi = pageIndex(doc, op.pageId);
      const page = doc.pages[pi]!;
      checkIndex(op.index, page.layers.length, 'lớp');
      if (idExists(doc, op.layer.id)) throw new OpError(`ID "${op.layer.id}" đã tồn tại`);
      if (op.layer.type === 'image' && !hasOwn(doc.assets, op.layer.assetId)) {
        throw new OpError(`Không có tài nguyên "${op.layer.assetId}"`);
      }
      ensureValid(layerErrors(op.layer, assetIdSet(doc)));
      const layers = page.layers.slice();
      layers.splice(op.index, 0, op.layer);
      return {
        doc: withPage(doc, pi, { ...page, layers }),
        inverse: { op: 'removeLayer', pageId: op.pageId, layerId: op.layer.id },
      };
    }

    case 'removeLayer': {
      const pi = pageIndex(doc, op.pageId);
      const page = doc.pages[pi]!;
      const li = layerIndex(page, op.layerId);
      const layer = page.layers[li]!;
      const layers = page.layers.slice();
      layers.splice(li, 1);
      return {
        doc: withPage(doc, pi, { ...page, layers }),
        inverse: { op: 'addLayer', pageId: op.pageId, index: li, layer },
      };
    }

    case 'updateLayer': {
      const pi = pageIndex(doc, op.pageId);
      const page = doc.pages[pi]!;
      const li = layerIndex(page, op.layerId);
      const layer = page.layers[li]!;
      const prev: Record<string, unknown> = {};
      const current = layer as unknown as Record<string, unknown>;
      for (const key of Object.keys(op.set)) {
        if (key === 'id' || key === 'type' || !hasOwn(layer, key)) {
          throw new OpError(`Lớp "${layer.type}" không có trường "${key}" để sửa`);
        }
        prev[key] = current[key];
      }
      if (op.set.assetId !== undefined && !hasOwn(doc.assets, op.set.assetId)) {
        throw new OpError(`Không có tài nguyên "${op.set.assetId}"`);
      }
      const next = { ...layer, ...op.set } as Layer;
      ensureValid(layerErrors(next, assetIdSet(doc)));
      const layers = page.layers.slice();
      layers[li] = next;
      return {
        doc: withPage(doc, pi, { ...page, layers }),
        inverse: { op: 'updateLayer', pageId: op.pageId, layerId: op.layerId, set: prev as LayerPatch },
      };
    }

    case 'moveLayer': {
      const pi = pageIndex(doc, op.pageId);
      const page = doc.pages[pi]!;
      const from = layerIndex(page, op.layerId);
      checkIndex(op.toIndex, page.layers.length - 1, 'lớp');
      const layers = page.layers.slice();
      const [moved] = layers.splice(from, 1);
      layers.splice(op.toIndex, 0, moved!);
      return {
        doc: withPage(doc, pi, { ...page, layers }),
        inverse: { op: 'moveLayer', pageId: op.pageId, layerId: op.layerId, toIndex: from },
      };
    }

    case 'addPage': {
      checkIndex(op.index, doc.pages.length, 'trang');
      if (idExists(doc, op.page.id)) throw new OpError(`ID "${op.page.id}" đã tồn tại`);
      const seen = new Set<string>([op.page.id]);
      for (const l of op.page.layers) {
        if (seen.has(l.id) || idExists(doc, l.id)) throw new OpError(`ID "${l.id}" đã tồn tại`);
        seen.add(l.id);
      }
      ensureValid(pageInfoErrors(op.page, assetIdSet(doc)));
      for (const l of op.page.layers) ensureValid(layerErrors(l, assetIdSet(doc)));
      const pages = doc.pages.slice();
      pages.splice(op.index, 0, op.page);
      return { doc: { ...doc, pages }, inverse: { op: 'removePage', pageId: op.page.id } };
    }

    case 'removePage': {
      if (doc.pages.length <= 1) throw new OpError('Thiết kế phải còn ít nhất 1 trang');
      const pi = pageIndex(doc, op.pageId);
      const page = doc.pages[pi]!;
      const pages = doc.pages.slice();
      pages.splice(pi, 1);
      return { doc: { ...doc, pages }, inverse: { op: 'addPage', index: pi, page } };
    }

    case 'updatePage': {
      const pi = pageIndex(doc, op.pageId);
      const page = doc.pages[pi]!;
      const prev: Record<string, unknown> = {};
      const current = page as unknown as Record<string, unknown>;
      for (const key of Object.keys(op.set)) {
        if (!['width', 'height', 'background', 'duration'].includes(key)) {
          throw new OpError(`Trang không có trường "${key}" để sửa`);
        }
        prev[key] = current[key];
      }
      const nextPage = { ...page, ...op.set };
      ensureValid(pageInfoErrors(nextPage, assetIdSet(doc)));
      return {
        doc: withPage(doc, pi, nextPage),
        inverse: { op: 'updatePage', pageId: op.pageId, set: prev as PagePatch },
      };
    }

    case 'addAsset': {
      if (idExists(doc, op.asset.id)) throw new OpError(`ID "${op.asset.id}" đã tồn tại`);
      ensureValid(assetErrors(op.asset));
      return {
        doc: { ...doc, assets: { ...doc.assets, [op.asset.id]: op.asset } },
        inverse: { op: 'removeAsset', assetId: op.asset.id },
      };
    }

    case 'removeAsset': {
      const asset = hasOwn(doc.assets, op.assetId) ? doc.assets[op.assetId] : undefined;
      if (!asset) throw new OpError(`Không có tài nguyên "${op.assetId}"`);
      if (assetInUse(doc, op.assetId)) throw new OpError(`Tài nguyên "${op.assetId}" đang được dùng`);
      const assets = { ...doc.assets };
      delete assets[op.assetId];
      return { doc: { ...doc, assets }, inverse: { op: 'addAsset', asset } };
    }

    case 'rename': {
      if (typeof op.name !== 'string') throw new OpError('Tên thiết kế phải là chuỗi');
      return { doc: { ...doc, name: op.name }, inverse: { op: 'rename', name: doc.name } };
    }
  }
}
