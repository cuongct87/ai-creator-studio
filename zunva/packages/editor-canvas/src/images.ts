import { useCallback, useMemo, useRef, useState } from 'react';

/**
 * Loads images from URLs (usually blob: URLs from the project store) once, and re-renders the
 * canvas when they finish. Images that fail to load stay as a grey placeholder.
 */

interface Entry {
  image: HTMLImageElement;
  status: 'loading' | 'ready' | 'error';
  done: Promise<void>;
}

export interface ImageCache {
  /** The loaded image, or null while loading / on error / when url is undefined. */
  get(url: string | undefined): HTMLImageElement | null;
  /** Resolves when all urls have finished (loaded or failed). */
  whenLoaded(urls: readonly string[]): Promise<void>;
}

export function useImageCache(): ImageCache {
  const entries = useRef(new Map<string, Entry>());
  const [, setVersion] = useState(0);

  const load = useCallback((url: string): Entry => {
    const existing = entries.current.get(url);
    if (existing) return existing;
    const image = new Image();
    // Remote images must allow CORS, otherwise exporting the page would fail (tainted canvas).
    if (/^https?:/i.test(url)) image.crossOrigin = 'anonymous';
    const entry: Entry = { image, status: 'loading', done: Promise.resolve() };
    entry.done = new Promise<void>((resolve) => {
      image.onload = () => {
        entry.status = 'ready';
        setVersion((v) => v + 1);
        resolve();
      };
      image.onerror = () => {
        entry.status = 'error';
        setVersion((v) => v + 1);
        resolve();
      };
    });
    entries.current.set(url, entry);
    image.src = url;
    return entry;
  }, []);

  return useMemo<ImageCache>(
    () => ({
      get(url) {
        if (!url) return null;
        const entry = load(url);
        return entry.status === 'ready' ? entry.image : null;
      },
      whenLoaded(urls) {
        return Promise.all(urls.map((url) => load(url).done)).then(() => undefined);
      },
    }),
    [load],
  );
}
