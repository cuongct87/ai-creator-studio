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
  angleFrom,
  isEmptyPatch,
  isTap,
  konvaFontStyle,
  layerCenter,
  layerCorners,
  normalizeRotation,
  pageToScreen,
  patchFromTransform,
  pinchView,
  rotateAroundCenter,
  roundPatch,
  screenToPage,
  snapRotation,
  transformMergeKey,
  twoFingerPatch,
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
    expect(normalizeRotation(359.99)).toBe(0);
    expect(normalizeRotation(12.36)).toBe(12.4);
  });
});

describe('F5 làm tròn số', () => {
  it('cỡ chữ số nguyên, vị trí/kích thước 0,1 px, góc 0,1°', () => {
    expect(roundPatch({ x: 10.123, y: -3.96, width: 300.04, height: 99.96, rotation: -0.04, fontSize: 101.18 })).toEqual({
      x: 10.1,
      y: -4,
      width: 300,
      height: 100,
      rotation: 0,
      fontSize: 101,
    });
    expect(roundPatch({ fontSize: 168.75 }).fontSize).toBe(169);
    expect(roundPatch({ fontSize: 0.2 }).fontSize).toBe(1);
    expect(roundPatch({ rotation: 370.26 }).rotation).toBe(10.3);
  });

  it('không đụng tới trường khác', () => {
    expect(roundPatch({ text: 'Xin chào', opacity: 0.333 })).toEqual({ text: 'Xin chào', opacity: 0.333 });
  });
});

describe('F4 hút góc', () => {
  it('lệch ≤ 5° thì hút về 0/90/180/270', () => {
    expect(snapRotation(4.9)).toBe(0);
    expect(snapRotation(-5)).toBe(0);
    expect(snapRotation(355.2)).toBe(0);
    expect(snapRotation(86)).toBe(90);
    expect(snapRotation(184)).toBe(180);
    expect(snapRotation(273.5)).toBe(270);
  });

  it('lệch > 5° thì giữ nguyên (làm tròn 0,1°)', () => {
    expect(snapRotation(5.2)).toBe(5.2);
    expect(snapRotation(45.04)).toBe(45);
    expect(snapRotation(-30)).toBe(330);
  });
});

describe('F4 xoay bằng tay nắm góc', () => {
  const box = { x: 100, y: 100, width: 200, height: 100, rotation: 0 };

  it('tâm và 4 góc tính đúng khi lớp đã xoay', () => {
    const rotated = { x: 100, y: 100, width: 200, height: 100, rotation: 90 };
    const c = layerCenter(rotated);
    expect(c.x).toBeCloseTo(50, 9);
    expect(c.y).toBeCloseTo(200, 9);
    const [tl, tr, br, bl] = layerCorners(rotated);
    expect(tl).toEqual({ x: 100, y: 100 });
    expect(tr.x).toBeCloseTo(100, 9);
    expect(tr.y).toBeCloseTo(300, 9);
    expect(br.x).toBeCloseTo(0, 9);
    expect(br.y).toBeCloseTo(300, 9);
    expect(bl.x).toBeCloseTo(0, 9);
    expect(bl.y).toBeCloseTo(100, 9);
  });

  it('góc của ngón so với tâm', () => {
    const c = { x: 0, y: 0 };
    expect(angleFrom(c, { x: 10, y: 0 })).toBeCloseTo(0, 9);
    expect(angleFrom(c, { x: 0, y: 10 })).toBeCloseTo(90, 9);
    expect(angleFrom(c, { x: -10, y: 0 })).toBeCloseTo(180, 9);
    expect(angleFrom(c, { x: 0, y: -10 })).toBeCloseTo(-90, 9);
  });

  it('kéo góc vòng 90° quanh tâm: xoay 90°, tâm đứng yên, không đổi cỡ', () => {
    const c = layerCenter(box); // (200, 150)
    const start = { x: 300, y: 50 }; // góc trên-phải
    // Quay điểm (300, 50) 90° quanh tâm (200, 150) → (300, 250).
    const patch = rotateAroundCenter(box, start, { x: 300, y: 250 });
    expect(patch.rotation).toBe(90);
    expect('width' in patch || 'height' in patch).toBe(false);
    const after = layerCenter({ ...box, ...patch } as typeof box);
    expect(after.x).toBeCloseTo(c.x, 1);
    expect(after.y).toBeCloseTo(c.y, 1);
  });

  it('kéo gần 0° thì hút về 0°', () => {
    const c = layerCenter(box);
    const start = { x: c.x + 100, y: c.y };
    const a = (3 * Math.PI) / 180;
    const patch = rotateAroundCenter(box, start, { x: c.x + 100 * Math.cos(a), y: c.y + 100 * Math.sin(a) });
    expect(patch).toEqual({ x: 100, y: 100, rotation: 0 });
  });
});

describe('F3 hai ngón trên lớp đang chọn', () => {
  it('tách ngón gấp đôi + quay 90°: cỡ ×2, xoay thêm 90°, theo trung điểm (lớp đã xoay sẵn 30°)', () => {
    const shape = createShapeLayer('s', { x: 100, y: 200, width: 200, height: 100 });
    const layer = { ...shape, rotation: 30 };
    const c0 = layerCenter(layer);
    // Hai ngón đặt ngang qua tâm, cách nhau 100.
    const start = [
      { x: c0.x - 50, y: c0.y },
      { x: c0.x + 50, y: c0.y },
    ] as const;
    // Sau: trung điểm dời (+40, -20), hai ngón dọc, cách nhau 200 (quay 90°).
    const m = { x: c0.x + 40, y: c0.y - 20 };
    const now = [
      { x: m.x, y: m.y - 100 },
      { x: m.x, y: m.y + 100 },
    ] as const;
    const patch = twoFingerPatch(layer, start, now);
    expect(patch.width).toBe(400);
    expect(patch.height).toBe(200);
    expect(patch.rotation).toBe(120);
    const c1 = layerCenter({ ...layer, ...patch } as typeof layer);
    expect(c1.x).toBeCloseTo(m.x, 0);
    expect(c1.y).toBeCloseTo(m.y, 0);
  });

  it('điểm của lớp dưới hai ngón đi theo hai ngón (không chỉ tâm)', () => {
    const layer = createShapeLayer('s', { x: 0, y: 0, width: 200, height: 200 });
    // Ngón ở góc trên-trái vùng lớp, không ở tâm. Giữ nguyên khoảng cách và góc, chỉ dời +50, +10.
    const start = [
      { x: 10, y: 10 },
      { x: 60, y: 10 },
    ] as const;
    const now = [
      { x: 60, y: 20 },
      { x: 110, y: 20 },
    ] as const;
    expect(twoFingerPatch(layer, start, now)).toEqual({ x: 50, y: 10, width: 200, height: 200, rotation: 0 });
  });

  it('chữ: cỡ chữ đổi theo tỉ lệ và là số nguyên', () => {
    const text = createTextLayer('t', { x: 0, y: 0, width: 600, fontSize: 64 });
    const layer = { ...text, height: 80 };
    const start = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ] as const;
    const now = [
      { x: 0, y: 0 },
      { x: 158.1, y: 0 },
    ] as const;
    const patch = twoFingerPatch(layer, start, now);
    expect(patch.fontSize).toBe(101); // 64 × 1,581 = 101,18 → 101
    expect(Number.isInteger(patch.fontSize)).toBe(true);
    expect(patch.width).toBe(948.6);
  });

  it('thu nhỏ không cho cạnh ngắn dưới 8 px', () => {
    const layer = createShapeLayer('s', { x: 0, y: 0, width: 200, height: 40 });
    const start = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ] as const;
    const now = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ] as const;
    const patch = twoFingerPatch(layer, start, now);
    expect(patch.height).toBe(8);
    expect(patch.width).toBe(40);
  });
});

describe('F1 phân biệt chạm và kéo', () => {
  const down = { x: 100, y: 100, time: 1000 };

  it('nhanh và gần như không lệch = chạm', () => {
    expect(isTap(down, { x: 104, y: 105, time: 1200 })).toBe(true);
    expect(isTap(down, { x: 100, y: 100, time: 1299 })).toBe(true);
  });

  it('lâu ≥ 300 ms hoặc lệch ≥ 10 px = không phải chạm', () => {
    expect(isTap(down, { x: 100, y: 100, time: 1300 })).toBe(false);
    expect(isTap(down, { x: 110, y: 100, time: 1100 })).toBe(false);
    expect(isTap(down, { x: 106, y: 108, time: 1100 })).toBe(false);
  });
});

describe('patchFromTransform', () => {
  const { shape, text } = makeDoc();

  it('hình: đổi scale thành kích thước thật', () => {
    expect(patchFromTransform(shape, { x: 10.123, y: 5, rotation: -30, scaleX: 2, scaleY: 0.5 })).toEqual({
      x: 10.1,
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
