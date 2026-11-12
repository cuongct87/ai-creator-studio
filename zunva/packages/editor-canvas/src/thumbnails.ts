import type { Id, Page } from '@zunva/core';

/**
 * Pure helpers for usePageThumbnails (G3 K2): which pages to redraw, at what scale, and when.
 * The core never mutates a page: a changed page is a new object, so "changed" = different reference.
 */

/** Longest side of a page thumbnail (px) when the caller does not choose. */
export const DEFAULT_THUMB_SIDE = 160;
/** At most one redraw per page per second (dragging / erasing changes the page every frame). */
export const THUMB_MIN_INTERVAL_MS = 1000;
/** A page whose images were not ready is redrawn at most this many extra times. */
export const THUMB_MAX_RETRIES = 5;

/** pixelRatio so the page's longest side becomes `maxSide` px (never 0 / NaN). */
export function thumbnailPixelRatio(page: Pick<Page, 'width' | 'height'>, maxSide = DEFAULT_THUMB_SIDE): number {
  const longest = Math.max(page.width, page.height);
  const side = Number.isFinite(maxSide) && maxSide > 0 ? maxSide : DEFAULT_THUMB_SIDE;
  if (!(longest > 0)) return 1;
  return side / longest;
}

/** Pages whose current object is not the one last drawn (new or changed), in page order. */
export function stalePages(pages: readonly Page[], drawn: ReadonlyMap<Id, Page>): Page[] {
  return pages.filter((p) => drawn.get(p.id) !== p);
}

/** Ids that have a thumbnail but are no longer in the document (deleted pages). */
export function removedPageIds(pages: readonly Pick<Page, 'id'>[], have: Iterable<Id>): Id[] {
  const alive = new Set(pages.map((p) => p.id));
  return [...have].filter((id) => !alive.has(id));
}

/** Milliseconds to wait before this page may be drawn again (0 = now). */
export function renderDelay(lastAt: number | undefined, now: number, interval = THUMB_MIN_INTERVAL_MS): number {
  if (lastAt === undefined) return 0;
  return Math.max(0, lastAt + interval - now);
}

/**
 * Next page to draw: the first stale page (page order) that may be drawn now; otherwise the one
 * that becomes allowed soonest, with how long to wait. null = nothing to do.
 */
export function pickNextThumbnail(
  stale: readonly Page[],
  lastAt: ReadonlyMap<Id, number>,
  now: number,
  interval = THUMB_MIN_INTERVAL_MS,
): { page: Page; delay: number } | null {
  let best: { page: Page; delay: number } | null = null;
  for (const page of stale) {
    const delay = renderDelay(lastAt.get(page.id), now, interval);
    if (delay === 0) return { page, delay };
    if (!best || delay < best.delay) best = { page, delay };
  }
  return best;
}
