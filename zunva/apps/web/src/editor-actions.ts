/**
 * Các thao tác của màn hình chỉnh sửa, viết thành hàm thuần trả về `Op[]` của lõi — để test được
 * và để mọi thay đổi đi qua lịch sử (hoàn tác/làm lại) ở một chỗ.
 */
import {
  createImageLayer,
  createShapeLayer,
  createTextLayer,
  type Asset,
  type Id,
  type Layer,
  type Op,
  type Page,
  type ShapeLayer,
} from '@zunva/core';

export type ShapeKind = ShapeLayer['shape'];
export type IdMaker = (prefix: string) => Id;

/** Tên hiện trong bảng Lớp. */
export function layerLabel(layer: Layer): string {
  if (layer.name) return layer.name;
  if (layer.type === 'text') {
    const t = layer.text.replace(/\s+/g, ' ').trim();
    return t === '' ? 'Chữ trống' : t.length > 28 ? `${t.slice(0, 27)}…` : t;
  }
  if (layer.type === 'image') return 'Ảnh';
  return layer.shape === 'ellipse' ? 'Hình tròn' : layer.shape === 'line' ? 'Đường kẻ' : 'Hình chữ nhật';
}

/** Thêm chữ giữa trang, cỡ chữ theo bề ngang trang (đọc được trên mọi khổ). */
export function addTextOps(page: Page, newId: IdMaker, color: string): { ops: Op[]; layerId: Id } {
  const fontSize = Math.max(24, Math.round(page.width / 14));
  const width = Math.round(page.width * 0.8);
  const height = Math.round(fontSize * 1.6);
  const layer = createTextLayer(newId('layer'), {
    x: Math.round((page.width - width) / 2),
    y: Math.round((page.height - height) / 2),
    width,
    height,
    text: 'Chữ mới',
    fontSize,
    color,
  });
  return { ops: [{ op: 'addLayer', pageId: page.id, index: page.layers.length, layer }], layerId: layer.id };
}

const SHAPE_FILL = '#f7b6cf';

export function addShapeOps(page: Page, shape: ShapeKind, newId: IdMaker): { ops: Op[]; layerId: Id } {
  const side = Math.round(Math.min(page.width, page.height) * 0.35);
  const isLine = shape === 'line';
  const width = isLine ? Math.round(page.width * 0.6) : side;
  const height = isLine ? Math.max(4, Math.round(page.width / 200)) : side;
  const layer = createShapeLayer(newId('layer'), {
    shape,
    x: Math.round((page.width - width) / 2),
    y: Math.round((page.height - height) / 2),
    width,
    height,
    fill: isLine ? '#10263b' : SHAPE_FILL,
    stroke: null,
    strokeWidth: 0,
  });
  return { ops: [{ op: 'addLayer', pageId: page.id, index: page.layers.length, layer }], layerId: layer.id };
}

/** Thêm ảnh vừa 60% trang, giữ tỉ lệ ảnh. Tài nguyên phải đã nằm trong kho. */
export function addImageOps(page: Page, asset: Asset, newId: IdMaker, alreadyInDoc: boolean): { ops: Op[]; layerId: Id } {
  const iw = asset.width ?? 1000;
  const ih = asset.height ?? 1000;
  const scale = Math.min((page.width * 0.6) / iw, (page.height * 0.6) / ih);
  const width = Math.max(1, Math.round(iw * scale));
  const height = Math.max(1, Math.round(ih * scale));
  const layer = createImageLayer(newId('layer'), asset.id, {
    x: Math.round((page.width - width) / 2),
    y: Math.round((page.height - height) / 2),
    width,
    height,
  });
  const ops: Op[] = alreadyInDoc ? [] : [{ op: 'addAsset', asset }];
  ops.push({ op: 'addLayer', pageId: page.id, index: page.layers.length, layer });
  return { ops, layerId: layer.id };
}

/** Nhân đôi các lớp đang chọn, lệch xuống phải một chút, đặt ngay trên bản gốc. */
export function duplicateOps(page: Page, ids: readonly Id[], newId: IdMaker): { ops: Op[]; newIds: Id[] } {
  const offset = Math.round(Math.min(page.width, page.height) * 0.03);
  const ops: Op[] = [];
  const newIds: Id[] = [];
  let inserted = 0;
  page.layers.forEach((layer, index) => {
    if (!ids.includes(layer.id)) return;
    const copy = { ...layer, id: newId('layer'), x: layer.x + offset, y: layer.y + offset, locked: false } as Layer;
    ops.push({ op: 'addLayer', pageId: page.id, index: index + 1 + inserted, layer: copy });
    newIds.push(copy.id);
    inserted++;
  });
  return { ops, newIds };
}

export function removeOps(page: Page, ids: readonly Id[]): Op[] {
  return page.layers.filter((l) => ids.includes(l.id)).map((l) => ({ op: 'removeLayer', pageId: page.id, layerId: l.id }));
}

export type Arrange = 'up' | 'down' | 'top' | 'bottom';

/** Đổi thứ tự một lớp. Trả [] nếu đã ở đầu/cuối. (Lớp cuối mảng = nằm trên cùng.) */
export function arrangeOps(page: Page, id: Id, how: Arrange): Op[] {
  const from = page.layers.findIndex((l) => l.id === id);
  if (from < 0) return [];
  const last = page.layers.length - 1;
  const to = how === 'up' ? Math.min(last, from + 1) : how === 'down' ? Math.max(0, from - 1) : how === 'top' ? last : 0;
  return to === from ? [] : [{ op: 'moveLayer', pageId: page.id, layerId: id, toIndex: to }];
}

export function setBackgroundColorOps(page: Page, color: string): Op[] {
  return [{ op: 'updatePage', pageId: page.id, set: { background: { ...page.background, color } } }];
}

/** Bảng màu nhanh: màu trung tính + màu pastel Artio + màu đậm cho chữ. */
export const SWATCHES: readonly string[] = [
  '#ffffff', '#000000', '#10263b', '#6b7785', '#f7b6cf', '#ad2459', '#e8f3fb', '#2b7bb9',
  '#fde7c8', '#c97a00', '#d9f2e6', '#1f7a4f', '#ece6fb', '#5b3fa0', '#fdecea', '#c0392b',
];
