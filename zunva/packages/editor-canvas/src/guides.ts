import type { Page } from '@zunva/core';

/** Editor-only guide overlays (never exported). */
export type GuideKind = 'phone-wallpaper';

export interface GuideRect {
  kind: 'clock' | 'icons';
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Lock-screen clock: 12% → 30% of the page height. */
export const CLOCK_BAND = { from: 0.12, to: 0.3 } as const;
/** Bottom icon row: 86% → 100% of the page height. */
export const ICON_BAND = { from: 0.86, to: 1 } as const;
/** Label size relative to the page height. */
export const GUIDE_LABEL_RATIO = 0.022;
export const GUIDE_FILL_OPACITY = 0.18;

/** Phone wallpaper guide areas in page pixels, full page width. */
export function wallpaperGuideRects(page: Pick<Page, 'width' | 'height'>): GuideRect[] {
  const w = Math.max(0, page.width);
  const h = Math.max(0, page.height);
  const band = (kind: GuideRect['kind'], label: string, from: number, to: number): GuideRect => ({
    kind,
    label,
    x: 0,
    y: h * from,
    width: w,
    height: h * (to - from),
  });
  return [band('clock', 'Đồng hồ', CLOCK_BAND.from, CLOCK_BAND.to), band('icons', 'Biểu tượng', ICON_BAND.from, ICON_BAND.to)];
}

/** Label font size (page px) for the guides, at least 8. */
export function guideLabelSize(page: Pick<Page, 'height'>): number {
  return Math.max(8, Math.round(page.height * GUIDE_LABEL_RATIO));
}
