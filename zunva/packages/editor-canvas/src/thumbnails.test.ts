import { createPage, type Id, type Page } from '@zunva/core';
import { describe, expect, it } from 'vitest';
import { guideLabelSize, wallpaperGuideRects } from './guides';
import {
  DEFAULT_THUMB_SIDE,
  pickNextThumbnail,
  removedPageIds,
  renderDelay,
  stalePages,
  thumbnailPixelRatio,
} from './thumbnails';

describe('K2 tỉ lệ ảnh thu nhỏ', () => {
  it('cạnh dài thành maxSide (mặc định 160)', () => {
    expect(DEFAULT_THUMB_SIDE).toBe(160);
    expect(thumbnailPixelRatio({ width: 1080, height: 1350 })).toBeCloseTo(160 / 1350, 12);
    expect(thumbnailPixelRatio({ width: 2000, height: 1000 }, 200)).toBe(0.1);
  });

  it('khổ hoặc maxSide lạ thì không ra 0 / NaN', () => {
    expect(thumbnailPixelRatio({ width: 0, height: 0 })).toBe(1);
    expect(thumbnailPixelRatio({ width: 1600, height: 800 }, 0)).toBe(0.1);
    expect(thumbnailPixelRatio({ width: 1600, height: 800 }, Number.NaN)).toBe(0.1);
  });
});

describe('K2 chọn trang cần vẽ lại', () => {
  const a = createPage('a', 100, 100);
  const b = createPage('b', 100, 100);
  const c = createPage('c', 100, 100);

  it('trang mới và trang đã đổi (object mới) cần vẽ; trang y nguyên thì không', () => {
    const drawn = new Map<Id, Page>([
      ['a', a],
      ['b', b],
    ]);
    const b2: Page = { ...b, layers: [...b.layers] };
    expect(stalePages([a, b2, c], drawn).map((p) => p.id)).toEqual(['b', 'c']);
    expect(stalePages([a, b], drawn)).toEqual([]);
  });

  it('trang bị xóa', () => {
    expect(removedPageIds([a, c], ['a', 'b', 'c'])).toEqual(['b']);
    expect(removedPageIds([a], [])).toEqual([]);
  });

  it('tối đa 1 lần mỗi giây cho mỗi trang', () => {
    expect(renderDelay(undefined, 5000)).toBe(0);
    expect(renderDelay(4500, 5000)).toBe(500);
    expect(renderDelay(3000, 5000)).toBe(0);
  });

  it('ưu tiên trang vẽ được ngay theo thứ tự trang; không có thì chờ trang sớm nhất', () => {
    const now = 10_000;
    const last = new Map<Id, number>([
      ['a', 9_800],
      ['b', 9_500],
    ]);
    expect(pickNextThumbnail([a, b, c], last, now)).toEqual({ page: c, delay: 0 });
    expect(pickNextThumbnail([a, b], last, now)).toEqual({ page: b, delay: 500 });
    expect(pickNextThumbnail([], last, now)).toBeNull();
  });
});

describe('K3 vạch gợi ý hình nền', () => {
  it('đồng hồ 12–30%, biểu tượng 86–100%, toàn bề ngang', () => {
    const [clock, icons] = wallpaperGuideRects({ width: 1080, height: 2340 });
    expect(clock).toMatchObject({ kind: 'clock', label: 'Đồng hồ', x: 0, width: 1080 });
    expect(clock?.y).toBeCloseTo(280.8, 9);
    expect(clock?.height).toBeCloseTo(421.2, 9);
    expect(icons).toMatchObject({ kind: 'icons', label: 'Biểu tượng', x: 0, width: 1080 });
    expect(icons?.y).toBeCloseTo(2012.4, 9);
    expect((icons?.y ?? 0) + (icons?.height ?? 0)).toBeCloseTo(2340, 9);
  });

  it('cỡ chữ nhãn ~2,2% chiều cao, ít nhất 8', () => {
    expect(guideLabelSize({ height: 2340 })).toBe(51);
    expect(guideLabelSize({ height: 100 })).toBe(8);
  });
});
