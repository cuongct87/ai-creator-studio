import {
  canUndo,
  closeMerge,
  createDocument,
  createHistory,
  createPage,
  createShapeLayer,
  createTextLayer,
  execute,
  redo,
  undo,
  type DesignDocument,
  type ShapeLayer,
  type TextLayer,
} from '@zunva/core';
import { describe, expect, it } from 'vitest';
import {
  changedFields,
  coverCrop,
  cropToSource,
  cssFontFamily,
  dragMergeKey,
  fitPage,
  isEmptyPatch,
  konvaFontStyle,
  normalizeRotation,
  pageToScreen,
  patchFromTransform,
  pinchView,
  screenToPage,
  transformMergeKey,
  updateLayerOp,
  zoomAt,
  zoomLimits,
} from './geometry';

function makeDoc(): { doc: DesignDocument; shape: ShapeLayer; text: TextLayer } {
  const shape = createShapeLayer('layer_shape', { x: 0, y: 0, width: 300, height: 200 });
  const text = createTextLayer('layer_text', { x: 50, y: 60, width: 600, fontSize: 64 });
  const page = createPage('page_1', 1080, 1350);
  page.layers.push(shape, text);
  return { doc: createDocument('doc_1', page, 0), shape, text };
}

describe('fitPage', () => {
  it('canh giữa cả trang trong khung, chừa lề', () => {
    const v = fitPage({ width: 360, height: 600 }, { width: 1080, height: 1350 });
    const scale = (360 / 1080) * 0.92;
    expect(v.scale).toBeCloseTo(scale, 6);
    expect(v.x).toBeCloseTo((360 - 1080 * scale) / 2, 6);
    expect(v.y).toBeCloseTo((600 - 1350 * scale) / 2, 6);
  });

  it('khung chưa có kích thước thì không chia cho 0', () => {
    expect(fitPage({ width: 0, height: 0 }, { width: 1080, height: 1350 })).toEqual({ scale: 1, x: 0, y: 0 });
  });
});

describe('đổi tọa độ và phóng to', () => {
  it('screenToPage và pageToScreen là hai chiều ngược nhau', () => {
    const view = { scale: 0.4, x: 12, y: -30 };
    const p = { x: 500, y: 700 };
    const back = screenToPage(view, pageToScreen(view, p));
    expect(back.x).toBeCloseTo(p.x, 9);
    expect(back.y).toBeCloseTo(p.y, 9);
  });

  it('zoomAt giữ nguyên điểm dưới con trỏ', () => {
    const view = { scale: 0.5, x: 10, y: 20 };
    const cursor = { x: 100, y: 200 };
    const before = screenToPage(view, cursor);
    const zoomed = zoomAt(view, cursor, 2);
    const after = pageToScreen(zoomed, before);
    expect(after.x).toBeCloseTo(cursor.x, 9);
    expect(after.y).toBeCloseTo(cursor.y, 9);
  });

  it('chụm hai ngón: tách ngón gấp đôi thì phóng gấp đôi, có giới hạn', () => {
    const start = { view: { scale: 0.3, x: 0, y: 0 }, center: { x: 180, y: 300 }, distance: 100 };
    const limits = zoomLimits(0.3);
    const doubled = pinchView(start, start.center, 200, limits);
    expect(doubled.scale).toBeCloseTo(0.6, 9);
    const pagePoint = screenToPage(start.view, start.center);
    const onScreen = pageToScreen(doubled, pagePoint);
    expect(onScreen.x).toBeCloseTo(180, 9);
    expect(onScreen.y).toBeCloseTo(300, 9);
    expect(pinchView(start, start.center, 100_000, limits).scale).toBeCloseTo(limits.max, 9);
    expect(pinchView(start, start.center, 1, limits).scale).toBeCloseTo(limits.min, 9);
  });
});

describe('normalizeRotation', () => {
  it('đưa góc về [0, 360)', () => {
    expect(normalizeRotation(-90)).toBe(270);
    expect(normalizeRotation(450)).toBe(90);
    expect(normalizeRotation(359.999)).toBe(0);
    expect(normalizeRotation(12.346)).toBe(12.35);
  });
});

describe('patchFromTransform', () => {
  const { shape, text } = makeDoc();

  it('hình: đổi scale thành kích thước thật', () => {
    expect(patchFromTransform(shape, { x: 10.123, y: 5, rotation: -30, scaleX: 2, scaleY: 0.5 })).toEqual({
      x: 10.12,
      y: 5,
      rotation: 330,
      width: 600,
      height: 100,
    });
  });

  it('chữ: kéo tay nắm cạnh chỉ đổi bề rộng, không đổi cỡ chữ', () => {
    const patch = patchFromTransform(text, { x: 50, y: 60, rotation: 0, scaleX: 1.5, scaleY: 1 });
    expect(patch).toEqual({ x: 50, y: 60, rotation: 0, width: 900 });
    expect('fontSize' in patch).toBe(false);
  });

  it('chữ: kéo tay nắm góc đổi cả cỡ chữ', () => {
    expect(patchFromTransform(text, { x: 50, y: 60, rotation: 0, scaleX: 0.5, scaleY: 0.5 })).toEqual({
      x: 50,
      y: 60,
      rotation: 0,
      width: 300,
      fontSize: 32,
    });
  });

  it('không cho kích thước về 0', () => {
    const patch = patchFromTransform(shape, { x: 0, y: 0, rotation: 0, scaleX: 0, scaleY: 0 });
    expect(patch.width).toBe(1);
    expect(patch.height).toBe(1);
  });
});

describe('changedFields', () => {
  it('chỉ giữ trường thật sự đổi', () => {
    const { shape } = makeDoc();
    expect(changedFields(shape, { x: 0, y: 7 })).toEqual({ y: 7 });
    expect(isEmptyPatch(changedFields(shape, { x: 0, y: 0 }))).toBe(true);
  });
});

describe('phông và ảnh', () => {
  it('konvaFontStyle ghép độ đậm và nghiêng', () => {
    expect(konvaFontStyle({ fontWeight: 700, italic: false })).toBe('700');
    expect(konvaFontStyle({ fontWeight: 400, italic: true })).toBe('italic 400');
    expect(konvaFontStyle({ fontWeight: 50, italic: false })).toBe('100');
  });

  it('cssFontFamily bỏ dấu nháy lạ', () => {
    expect(cssFontFamily('Be Vietnam Pro')).toBe('"Be Vietnam Pro", sans-serif');
    expect(cssFontFamily('A"B')).toBe('"AB", sans-serif');
  });

  it('cropToSource đổi tỉ lệ 0→1 sang pixel ảnh gốc', () => {
    expect(cropToSource({ x: 0.25, y: 0.5, width: 0.5, height: 0.5 }, { width: 4000, height: 3000 })).toEqual({
      x: 1000,
      y: 1500,
      width: 2000,
      height: 1500,
    });
    expect(cropToSource(null, { width: 10, height: 10 })).toBeNull();
  });

  it('coverCrop lấp đầy khung, không kéo méo, canh giữa', () => {
    const c = coverCrop({ width: 4000, height: 3000 }, { width: 1080, height: 1350 });
    expect(c.width).toBeCloseTo(2400, 6);
    expect(c.height).toBeCloseTo(3000, 6);
    expect(c.x).toBeCloseTo(800, 6);
    expect(c.y).toBeCloseTo(0, 6);
    expect(c.width / c.height).toBeCloseTo(1080 / 1350, 9);
  });
});

describe('gộp lệnh với lịch sử của lõi', () => {
  it('kéo 120 lần cùng mergeKey = 1 bước hoàn tác', () => {
    const { doc, shape } = makeDoc();
    let h = createHistory(doc);
    for (let i = 1; i <= 120; i++) {
      h = execute(h, 'Di chuyển', [updateLayerOp('page_1', shape.id, { x: i, y: i * 2 })], { mergeKey: dragMergeKey(shape.id) });
    }
    h = closeMerge(h);
    expect(h.undoStack).toHaveLength(1);
    expect(h.doc.pages[0]?.layers[0]).toMatchObject({ x: 120, y: 240 });

    h = undo(h);
    expect(h.doc.pages[0]?.layers[0]).toMatchObject({ x: 0, y: 0 });
    expect(canUndo(h)).toBe(false);
    h = redo(h);
    expect(h.doc.pages[0]?.layers[0]).toMatchObject({ x: 120, y: 240 });
  });

  it('sau khi thả tay (closeMerge), lần kéo sau là bước mới', () => {
    const { doc, shape } = makeDoc();
    let h = createHistory(doc);
    h = execute(h, 'Di chuyển', [updateLayerOp('page_1', shape.id, { x: 10 })], { mergeKey: dragMergeKey(shape.id) });
    h = closeMerge(h);
    h = execute(h, 'Di chuyển', [updateLayerOp('page_1', shape.id, { x: 20 })], { mergeKey: dragMergeKey(shape.id) });
    expect(h.undoStack).toHaveLength(2);
  });

  it('đổi cỡ nhiều lớp cùng lúc: 1 bước, hoàn tác trả cả hai lớp', () => {
    const { doc, shape, text } = makeDoc();
    const key = transformMergeKey([text.id, shape.id]);
    expect(key).toBe(transformMergeKey([shape.id, text.id]));
    let h = createHistory(doc);
    h = execute(
      h,
      'Đổi cỡ / xoay',
      [updateLayerOp('page_1', shape.id, { width: 600 }), updateLayerOp('page_1', text.id, { width: 900, fontSize: 96 })],
      { mergeKey: key },
    );
    h = closeMerge(h);
    expect(h.undoStack).toHaveLength(1);
    h = undo(h);
    expect(h.doc.pages[0]?.layers[0]).toMatchObject({ width: 300 });
    expect(h.doc.pages[0]?.layers[1]).toMatchObject({ width: 600, fontSize: 64 });
  });
});
