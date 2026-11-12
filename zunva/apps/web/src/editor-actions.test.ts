import { describe, expect, it } from 'vitest';
import { applyOp, createDocument, createHistory, createPage, createTextLayer, execute, redo, undo, type DesignDocument, type Op } from '@zunva/core';
import { addImageOps, coverPagePatch, addShapeOps, addTextOps, arrangeOps, duplicateOps, layerLabel, removeOps, setBackgroundColorOps } from './editor-actions';

let n = 0;
const newId = (p: string) => `${p}_${++n}`;

function doc(): DesignDocument {
  return createDocument('doc', createPage('page', 1748, 2480), 0, { name: 'Thiệp cưới' });
}
const apply = (d: DesignDocument, ops: Op[]) => ops.reduce((acc, op) => applyOp(acc, op).doc, d);
const page = (d: DesignDocument) => d.pages[0]!;

describe('thao tác màn hình chỉnh sửa', () => {
  it('thêm chữ giữa trang, cỡ chữ theo khổ', () => {
    const d = doc();
    const { ops, layerId } = addTextOps(page(d), newId, '#10263b');
    const next = apply(d, ops);
    const layer = page(next).layers[0]!;
    expect(layer.id).toBe(layerId);
    expect(layer.type).toBe('text');
    if (layer.type !== 'text') return;
    expect(layer.fontSize).toBe(Math.round(1748 / 14));
    expect(layer.x + layer.width / 2).toBeCloseTo(1748 / 2, 0);
    expect(layerLabel(layer)).toBe('Chữ mới');
  });

  it('thêm hình chữ nhật, hình tròn, đường kẻ', () => {
    let d = doc();
    for (const shape of ['rect', 'ellipse', 'line'] as const) d = apply(d, addShapeOps(page(d), shape, newId).ops);
    expect(page(d).layers.map(layerLabel)).toEqual(['Hình chữ nhật', 'Hình tròn', 'Đường kẻ']);
  });

  it('thêm ảnh giữ tỉ lệ, chỉ thêm tài nguyên một lần', () => {
    const d = doc();
    const asset = { id: 'img_1', kind: 'image' as const, mimeType: 'image/png', name: null, hash: null, width: 4000, height: 3000 };
    const first = addImageOps(page(d), asset, newId, false);
    expect(first.ops[0]).toEqual({ op: 'addAsset', asset });
    const d1 = apply(d, first.ops);
    const img = page(d1).layers[0]!;
    expect(img.width / img.height).toBeCloseTo(4 / 3, 2);
    expect(img.width).toBeLessThanOrEqual(1748 * 0.6 + 1);
    const second = addImageOps(page(d1), asset, newId, true);
    expect(second.ops.map((o) => o.op)).toEqual(['addLayer']);
  });

  it('nhân đôi đặt ngay trên bản gốc, lệch một chút; xóa đúng lớp', () => {
    let d = doc();
    d = apply(d, addShapeOps(page(d), 'rect', newId).ops);
    d = apply(d, addTextOps(page(d), newId, '#000000').ops);
    const [rect, text] = page(d).layers;
    const dup = duplicateOps(page(d), [rect!.id], newId);
    d = apply(d, dup.ops);
    expect(page(d).layers.map((l) => l.id)).toEqual([rect!.id, dup.newIds[0], text!.id]);
    expect(page(d).layers[1]!.x).toBeGreaterThan(rect!.x);
    d = apply(d, removeOps(page(d), [rect!.id, text!.id]));
    expect(page(d).layers.map((l) => l.id)).toEqual([dup.newIds[0]]);
  });

  it('đổi thứ tự lớp; ở đầu/cuối thì không làm gì', () => {
    let d = doc();
    for (const s of ['rect', 'ellipse', 'line'] as const) d = apply(d, addShapeOps(page(d), s, newId).ops);
    const ids = page(d).layers.map((l) => l.id);
    expect(arrangeOps(page(d), ids[2]!, 'up')).toEqual([]);
    expect(arrangeOps(page(d), ids[0]!, 'down')).toEqual([]);
    d = apply(d, arrangeOps(page(d), ids[0]!, 'top'));
    expect(page(d).layers.map((l) => l.id)).toEqual([ids[1], ids[2], ids[0]]);
    d = apply(d, arrangeOps(page(d), ids[0]!, 'down'));
    expect(page(d).layers.map((l) => l.id)).toEqual([ids[1], ids[0], ids[2]]);
  });

  it('đổi màu nền và mọi thao tác hoàn tác/làm lại được qua lịch sử', () => {
    let h = createHistory(doc());
    h = execute(h, 'Thêm chữ', addTextOps(page(h.doc), newId, '#000').ops);
    h = execute(h, 'Màu nền', setBackgroundColorOps(page(h.doc), '#fdeef4'));
    expect(page(h.doc).background.color).toBe('#fdeef4');
    h = undo(h);
    expect(page(h.doc).background.color).toBe('#ffffff');
    h = undo(h);
    expect(page(h.doc).layers).toHaveLength(0);
    h = redo(redo(h));
    expect(page(h.doc).layers).toHaveLength(1);
    expect(page(h.doc).background.color).toBe('#fdeef4');
  });

  it('tên lớp chữ cắt gọn, gộp khoảng trắng', () => {
    const t = createTextLayer('t', { text: 'Trân trọng   kính mời quý khách đến dự lễ thành hôn' });
    expect(layerLabel(t)).toBe('Trân trọng kính mời quý khá…');
    expect(layerLabel({ ...t, text: '   ' })).toBe('Chữ trống');
    expect(layerLabel({ ...t, name: 'Tiêu đề' })).toBe('Tiêu đề');
  });
});

describe('phủ kín trang', () => {
  it('ảnh dọc trên trang dọc rộng hơn: phóng theo bề ngang, đặt giữa, thẳng', () => {
    expect(coverPagePatch({ width: 300, height: 600 }, 1748, 2480)).toEqual({ x: 0, y: -508, width: 1748, height: 3496, rotation: 0 });
  });
  it('ảnh ngang: phóng theo bề cao', () => {
    const p = coverPagePatch({ width: 400, height: 300 }, 1080, 1080);
    expect(p.height).toBe(1080);
    expect(p.width).toBe(1440);
    expect(p.x).toBe(-180);
    expect(p.y).toBe(0);
  });
});

