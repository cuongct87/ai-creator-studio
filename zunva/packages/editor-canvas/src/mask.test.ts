import { BLEND_MODES, createImageLayer } from '@zunva/core';
import { describe, expect, it } from 'vitest';
import { layerPoint } from './geometry';
import {
  blendToComposite,
  brushInnerRadius,
  brushRadiusInMask,
  compositeCanvasSize,
  compositeKey,
  type CompositeKeyInput,
  dabSpacing,
  featherPlan,
  grayToAlpha,
  layerLocalToMask,
  maskCanvasSize,
  needsComposite,
  pageToLayerLocal,
  rotateHandleOffset,
  rotateHandlePositions,
  strokePoints,
} from './mask';

describe('K1 kiểu hòa trộn', () => {
  it("'normal' → 'source-over', kiểu khác giữ nguyên tên", () => {
    expect(blendToComposite('normal')).toBe('source-over');
    for (const mode of BLEND_MODES) {
      if (mode !== 'normal') expect(blendToComposite(mode)).toBe(mode);
    }
    expect(blendToComposite('soft-light')).toBe('soft-light');
    expect(blendToComposite('luminosity')).toBe('luminosity');
  });
});

describe('K2 canvas phụ', () => {
  it('chỉ vẽ qua canvas phụ khi có mờ viền hoặc mặt nạ', () => {
    expect(needsComposite({ feather: 0, maskAssetId: null })).toBe(false);
    expect(needsComposite({ feather: 2, maskAssetId: null })).toBe(true);
    expect(needsComposite({ feather: 0, maskAssetId: 'asset_m' })).toBe(true);
  });

  it('kích thước canvas: giữ tỉ lệ, cạnh dài ≤ 2048 (ảnh) và ≤ 1024 (mặt nạ), không phóng to', () => {
    expect(compositeCanvasSize({ width: 4000, height: 1000 })).toEqual({ width: 2048, height: 512 });
    expect(compositeCanvasSize({ width: 300, height: 200 })).toEqual({ width: 300, height: 200 });
    expect(maskCanvasSize({ width: 1080, height: 1350 })).toEqual({ width: 819, height: 1024 });
    expect(maskCanvasSize({ width: 300, height: 200 })).toEqual({ width: 300, height: 200 });
    expect(maskCanvasSize({ width: 0, height: 0 })).toEqual({ width: 1, height: 1 });
  });

  it('khóa lưu đệm đổi khi một thông số đổi, giống nhau khi y nguyên', () => {
    const base: CompositeKeyInput = {
      assetId: 'asset_a',
      maskId: null,
      width: 600,
      height: 400,
      cornerRadius: 0,
      feather: 10,
      flipX: false,
      flipY: false,
      crop: null,
      canvas: { width: 600, height: 400 },
    };
    const key = compositeKey(base);
    expect(compositeKey({ ...base })).toBe(key);
    const changes: Partial<CompositeKeyInput>[] = [
      { assetId: 'asset_b' },
      { maskId: 'asset_m' },
      { width: 601 },
      { height: 401 },
      { cornerRadius: 8 },
      { feather: 11 },
      { flipX: true },
      { flipY: true },
      { crop: { x: 0, y: 0, width: 10, height: 10 } },
      { canvas: { width: 300, height: 200 } },
    ];
    for (const change of changes) expect(compositeKey({ ...base, ...change })).not.toBe(key);
  });

  it('mờ viền: thụt vào nửa độ mờ, theo tỉ lệ canvas, không quá nửa cạnh ngắn', () => {
    const layer = { width: 200, height: 100, feather: 20, cornerRadius: 0 };
    expect(featherPlan(layer, { width: 200, height: 100 })).toEqual({ inset: 10, blur: 10, radius: 0 });
    expect(featherPlan(layer, { width: 100, height: 50 })).toEqual({ inset: 5, blur: 5, radius: 0 });
    expect(featherPlan({ ...layer, feather: 0, cornerRadius: 30 }, { width: 200, height: 100 })).toEqual({ inset: 0, blur: 0, radius: 30 });
    expect(featherPlan({ ...layer, feather: 500 }, { width: 200, height: 100 })).toEqual({ inset: 25, blur: 25, radius: 0 });
  });

  it('mặt nạ xám → mặt nạ kênh trong suốt (trắng = giữ, đen = tẩy)', () => {
    const data = new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 255, 128, 128, 128, 255, 255, 255, 255, 0]);
    grayToAlpha(data);
    expect(Array.from(data)).toEqual([255, 255, 255, 255, 255, 255, 255, 0, 255, 255, 255, 128, 255, 255, 255, 0]);
  });
});

describe('K3/K4 tọa độ ngón → khung lớp → mặt nạ', () => {
  const layer = createImageLayer('img', 'asset_a', { x: 100, y: 50, width: 200, height: 100 });

  it('không xoay, không lật', () => {
    expect(pageToLayerLocal(layer, { x: 150, y: 80 })).toEqual({ x: 50, y: 30 });
  });

  it('lớp xoay 90°', () => {
    const rotated = { ...layer, rotation: 90 };
    // Điểm (50, 30) của khung nằm ở trang (100 − 30, 50 + 50) = (70, 100).
    const local = pageToLayerLocal(rotated, { x: 70, y: 100 });
    expect(local.x).toBeCloseTo(50, 9);
    expect(local.y).toBeCloseTo(30, 9);
  });

  it('lật ngang / lật dọc: mặt nạ đi theo ảnh', () => {
    expect(pageToLayerLocal({ ...layer, flipX: true }, { x: 150, y: 80 })).toEqual({ x: 150, y: 30 });
    expect(pageToLayerLocal({ ...layer, flipY: true }, { x: 150, y: 80 })).toEqual({ x: 50, y: 70 });
  });

  it('xoay bất kỳ: đi tới rồi đi về ra đúng điểm', () => {
    const rotated = { ...layer, rotation: 37 };
    const page = layerPoint(rotated, 123, 45);
    const back = pageToLayerLocal(rotated, page);
    expect(back.x).toBeCloseTo(123, 9);
    expect(back.y).toBeCloseTo(45, 9);
  });

  it('khung lớp → điểm ảnh mặt nạ', () => {
    expect(layerLocalToMask({ x: 50, y: 30 }, layer, { width: 1024, height: 512 })).toEqual({ x: 256, y: 153.6 });
  });

  it('cỡ cọ: px màn hình → px mặt nạ (theo mức phóng)', () => {
    expect(brushRadiusInMask(40, 0.5, { width: 200 }, { width: 200, height: 100 })).toBe(40);
    expect(brushRadiusInMask(40, 0.5, { width: 200 }, { width: 100, height: 50 })).toBe(20);
  });
});

describe('K3/K4 nét liền', () => {
  it('chèn điểm giữa hai lần chạm theo khoảng cách cọ, kết thúc đúng điểm cuối', () => {
    expect(strokePoints({ x: 0, y: 0 }, { x: 10, y: 0 }, 2.5)).toEqual([
      { x: 2.5, y: 0 },
      { x: 5, y: 0 },
      { x: 7.5, y: 0 },
      { x: 10, y: 0 },
    ]);
  });

  it('kéo nhanh: không có khoảng hở lớn hơn khoảng cách cọ', () => {
    const from = { x: 0, y: 0 };
    const pts = strokePoints(from, { x: 30, y: 40 }, 3);
    let prev = from;
    for (const p of pts) {
      expect(Math.hypot(p.x - prev.x, p.y - prev.y)).toBeLessThanOrEqual(3 + 1e-9);
      prev = p;
    }
    expect(pts[pts.length - 1]).toEqual({ x: 30, y: 40 });
  });

  it('không di chuyển: vẫn 1 điểm', () => {
    expect(strokePoints({ x: 5, y: 5 }, { x: 5, y: 5 }, 2)).toEqual([{ x: 5, y: 5 }]);
  });

  it('khoảng cách chấm cọ và mép mềm', () => {
    expect(dabSpacing(2)).toBe(1);
    expect(dabSpacing(20)).toBe(5);
    expect(brushInnerRadius(10, 0)).toBe(10);
    expect(brushInnerRadius(10, 1)).toBe(0);
    expect(brushInnerRadius(10, 0.3)).toBeCloseTo(7, 9);
    expect(brushInnerRadius(10, 2)).toBe(0);
  });
});

describe('K6 nút xoay trên lớp mỏng', () => {
  it('lớp đủ lớn trên màn hình: nút ở đúng góc', () => {
    expect(rotateHandleOffset(300, 200)).toBe(0);
    const spots = rotateHandlePositions({ x: 0, y: 0, width: 200, height: 100, rotation: 0 }, 1);
    expect(spots).toEqual([
      { x: 0, y: 0 },
      { x: 200, y: 0 },
      { x: 200, y: 100 },
      { x: 0, y: 100 },
    ]);
  });

  it('lớp mỏng (chữ 1 dòng): đẩy ra ngoài theo đường chéo, các nút cách nhau ≥ 44 px', () => {
    expect(rotateHandleOffset(300, 30)).toBe(29);
    const box = { x: 0, y: 0, width: 200, height: 20, rotation: 0 };
    const [tl, tr, br, bl] = rotateHandlePositions(box, 1);
    expect(tl).toEqual({ x: -34, y: -34 });
    expect(tr).toEqual({ x: 234, y: -34 });
    expect(br).toEqual({ x: 234, y: 54 });
    expect(bl).toEqual({ x: -34, y: 54 });
    // Nút trên / dưới cùng bên trái cách nhau ≥ 44 px.
    expect(bl.y - tl.y).toBeGreaterThanOrEqual(44);
    // Nút kéo dãn giữa cạnh trái ở (0, 10): vẫn cách nút xoay ≥ 44 px.
    expect(Math.hypot(tl.x - 0, tl.y - 10)).toBeGreaterThanOrEqual(44);
    expect(Math.hypot(bl.x - 0, bl.y - 10)).toBeGreaterThanOrEqual(44);
  });

  it('tính theo px màn hình: thu nhỏ trang thì đẩy xa hơn (theo px trang)', () => {
    // Màn hình: 100 × 10 px → đẩy 39 px màn hình = 78 px trang.
    const [tl] = rotateHandlePositions({ x: 0, y: 0, width: 200, height: 20, rotation: 0 }, 0.5);
    expect(tl).toEqual({ x: -78, y: -78 });
  });
});
