import { createImageLayer, createPage, createTextLayer } from '@zunva/core';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_JPEG_QUALITY,
  encoderQuality,
  exportPictureBox,
  exportSize,
  exportUnderlay,
  isOpaqueColor,
  MAX_EXPORT_SIDE,
  pageAssetIds,
  withTimeout,
} from './exportImage';

describe('exportSize', () => {
  it('khổ trang × pixelRatio, làm tròn', () => {
    expect(exportSize({ width: 1080, height: 1350 }, 1)).toEqual({ width: 1080, height: 1350 });
    expect(exportSize({ width: 1080, height: 1350 }, 0.25)).toEqual({ width: 270, height: 338 });
    expect(exportSize({ width: 2480, height: 3508 }, 2)).toEqual({ width: 4960, height: 7016 });
    expect(exportSize({ width: 333, height: 100 }, 0.5)).toEqual({ width: 167, height: 50 });
  });

  it('không bao giờ nhỏ hơn 1 px', () => {
    expect(exportSize({ width: 10, height: 10 }, 0.01)).toEqual({ width: 1, height: 1 });
  });

  it('cạnh dài đúng 16384 được, vượt thì báo lỗi tiếng Việt', () => {
    expect(exportSize({ width: 8192, height: 4096 }, 2)).toEqual({ width: MAX_EXPORT_SIDE, height: 8192 });
    expect(() => exportSize({ width: 8193, height: 100 }, 2)).toThrow(RangeError);
    expect(() => exportSize({ width: 8193, height: 100 }, 2)).toThrow(/quá lớn/);
  });

  it('pixelRatio không hợp lệ thì báo lỗi', () => {
    for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => exportSize({ width: 100, height: 100 }, bad)).toThrow(RangeError);
    }
  });
});

describe('màu nền cho JPG', () => {
  it('nhận biết màu đục / trong suốt', () => {
    for (const c of ['#fff', '#ffffff', '#FFFFFFFF', '#abcf', 'rgb(1, 2, 3)', 'rgba(1,2,3,1)', 'rgb(1 2 3 / 100%)', 'hsl(10, 50%, 50%)', 'white']) {
      expect(isOpaqueColor(c)).toBe(true);
    }
    for (const c of ['transparent', '', '#0000', '#ffffff00', '#ffffff80', 'rgba(0,0,0,0)', 'rgba(255,255,255,0.5)', 'rgb(1 2 3 / 50%)', 'hsla(0, 0%, 0%, 0.2)']) {
      expect(isOpaqueColor(c)).toBe(false);
    }
    expect(isOpaqueColor(null)).toBe(false);
    expect(isOpaqueColor(undefined)).toBe(false);
  });

  it('JPG: nền trong suốt → tô trắng dưới cùng; nền đục → không cần', () => {
    expect(exportUnderlay('image/jpeg', 'transparent')).toBe('#ffffff');
    expect(exportUnderlay('image/jpeg', 'rgba(0,0,0,0.3)')).toBe('#ffffff');
    expect(exportUnderlay('image/jpeg', '#123456')).toBeNull();
  });

  it('PNG: giữ trong suốt', () => {
    expect(exportUnderlay('image/png', 'transparent')).toBeNull();
    expect(exportUnderlay('image/png', '#123456')).toBeNull();
  });
});

describe('chất lượng nén', () => {
  it('JPG mặc định 0,92, giới hạn 0..1; PNG bỏ qua', () => {
    expect(encoderQuality('image/jpeg', undefined)).toBe(DEFAULT_JPEG_QUALITY);
    expect(encoderQuality('image/jpeg', 0.7)).toBe(0.7);
    expect(encoderQuality('image/jpeg', 5)).toBe(1);
    expect(encoderQuality('image/jpeg', -1)).toBe(0);
    expect(encoderQuality('image/jpeg', Number.NaN)).toBe(DEFAULT_JPEG_QUALITY);
    expect(encoderQuality('image/png', 0.5)).toBeUndefined();
  });
});

describe('pageAssetIds', () => {
  it('ảnh nền, ảnh lớp và mặt nạ; không trùng; bỏ lớp ẩn', () => {
    const page = createPage('p1', 1080, 1350);
    page.background = { ...page.background, imageAssetId: 'bg' };
    page.layers.push(
      createImageLayer('l1', 'a1', { maskAssetId: 'm1' }),
      createImageLayer('l2', 'a1'),
      createImageLayer('l3', 'a3', { hidden: true, maskAssetId: 'm3' }),
      createTextLayer('t1', {}),
    );
    expect(pageAssetIds(page)).toEqual(['bg', 'a1', 'm1']);
  });

  it('trang trống: không cần tải gì', () => {
    expect(pageAssetIds(createPage('p1', 100, 100))).toEqual([]);
  });
});

describe('ảnh phụ khi xuất', () => {
  it('theo độ phân giải xuất', () => {
    expect(exportPictureBox({ width: 300, height: 200 }, 2)).toEqual({ width: 600, height: 400 });
    expect(exportPictureBox({ width: 300, height: 200 }, 0.25)).toEqual({ width: 75, height: 50 });
  });
});

describe('withTimeout', () => {
  it('xong kịp thì trả kết quả', async () => {
    await expect(withTimeout(Promise.resolve(7), 1000, 'hết giờ')).resolves.toBe(7);
  });

  it('quá giờ thì báo lỗi với câu đã cho', async () => {
    const never = new Promise<number>(() => undefined);
    await expect(withTimeout(never, 10, 'Hết thời gian chờ')).rejects.toThrow('Hết thời gian chờ');
  });

  it('lỗi gốc vẫn được chuyển ra', async () => {
    await expect(withTimeout(Promise.reject(new Error('hỏng')), 1000, 'hết giờ')).rejects.toThrow('hỏng');
  });
});
