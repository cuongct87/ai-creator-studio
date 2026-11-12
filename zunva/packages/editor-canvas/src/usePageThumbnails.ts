import type { DesignDocument, Id, Page } from '@zunva/core';
import { useEffect, useRef, useState } from 'react';
import { pageAssetIds } from './exportImage';
import { renderPageImage } from './renderPage';
import {
  DEFAULT_THUMB_SIDE,
  pickNextThumbnail,
  removedPageIds,
  stalePages,
  THUMB_MAX_RETRIES,
  thumbnailPixelRatio,
} from './thumbnails';

/**
 * Thumbnails of every page (blob: URLs, longest side `maxSide` px, default 160), for the page strip.
 * Only changed pages are redrawn, one at a time, at most once per second per page. Old URLs are
 * revoked when replaced, when a page is deleted and on unmount.
 */
export function usePageThumbnails(
  doc: DesignDocument,
  assetUrl: (id: Id) => string | undefined,
  maxSide: number = DEFAULT_THUMB_SIDE,
): Record<Id, string> {
  const [urls, setUrls] = useState<Record<Id, string>>({});

  const live = useRef({ doc, assetUrl, maxSide });
  live.current = { doc, assetUrl, maxSide };

  const alive = useRef(false);
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Page object last drawn (or being drawn) per page id. */
  const drawn = useRef(new Map<Id, Page>());
  const lastAt = useRef(new Map<Id, number>());
  const retries = useRef(new Map<Id, number>());
  const current = useRef(new Map<Id, string>());
  const drawnSide = useRef(maxSide);
  const pump = useRef<() => void>(() => undefined);

  const publish = () => {
    if (alive.current) setUrls(Object.fromEntries(current.current));
  };

  pump.current = () => {
    if (!alive.current || busy.current) return;
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const { doc: d, assetUrl: urlOf, maxSide: side } = live.current;
    const next = pickNextThumbnail(stalePages(d.pages, drawn.current), lastAt.current, Date.now());
    if (!next) return;
    if (next.delay > 0) {
      timer.current = setTimeout(() => pump.current(), next.delay);
      return;
    }

    const page = next.page;
    // A really new version of the page (not a retry of the same one): the retry budget starts again.
    if (drawn.current.has(page.id)) retries.current.delete(page.id);
    busy.current = true;
    drawn.current.set(page.id, page);
    lastAt.current.set(page.id, Date.now());
    // Images not available yet (still being read from storage) → draw grey now, try again later.
    const missing = pageAssetIds(page).some((id) => !urlOf(id));

    renderPageImage(d, page.id, { pixelRatio: thumbnailPixelRatio(page, side), mimeType: 'image/png', assetUrl: urlOf })
      .then((blob) => {
        if (!alive.current) return;
        if (!live.current.doc.pages.some((p) => p.id === page.id)) return;
        const url = URL.createObjectURL(blob);
        const old = current.current.get(page.id);
        current.current.set(page.id, url);
        if (old) URL.revokeObjectURL(old);
        publish();
      })
      .catch(() => {
        // Keep the previous thumbnail; the page is redrawn when it changes again.
      })
      .finally(() => {
        busy.current = false;
        if (missing && drawn.current.get(page.id) === page) {
          const n = (retries.current.get(page.id) ?? 0) + 1;
          retries.current.set(page.id, n);
          if (n <= THUMB_MAX_RETRIES) drawn.current.delete(page.id);
        }
        pump.current();
      });
  };

  // Mount / unmount: free every URL at the end.
  useEffect(() => {
    alive.current = true;
    const urlMap = current.current;
    const drawnMap = drawn.current;
    const lastMap = lastAt.current;
    const retryMap = retries.current;
    return () => {
      alive.current = false;
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      for (const url of urlMap.values()) URL.revokeObjectURL(url);
      urlMap.clear();
      drawnMap.clear();
      lastMap.clear();
      retryMap.clear();
    };
  }, []);

  // Document or size changed: drop deleted pages, then draw what is stale.
  useEffect(() => {
    if (drawnSide.current !== maxSide) {
      // New size: every page is stale (old pictures stay until replaced).
      drawnSide.current = maxSide;
      drawn.current.clear();
      lastAt.current.clear();
    }
    const gone = removedPageIds(doc.pages, current.current.keys());
    for (const id of gone) {
      const url = current.current.get(id);
      if (url) URL.revokeObjectURL(url);
      current.current.delete(id);
    }
    for (const id of removedPageIds(doc.pages, drawn.current.keys())) {
      drawn.current.delete(id);
      lastAt.current.delete(id);
      retries.current.delete(id);
    }
    if (gone.length > 0) publish();
    pump.current();
    // publish / pump only read refs and setUrls (stable), so doc and maxSide are the real triggers.
  }, [doc, maxSide]);

  return urls;
}
