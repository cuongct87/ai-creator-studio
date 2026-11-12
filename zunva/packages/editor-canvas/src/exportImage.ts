import type { Id, Page } from '@zunva/core';
import type { Size } from './geometry';

/**
 * Pure helpers for renderPageImage (G3 K1): output size, limits, JPG background, quality,
 * which assets a page needs. No DOM: unit-tested in Node.
 */

/** Longest side of an exported image (browser canvas limit on phones). */
export const MAX_EXPORT_SIDE = 16384;
/** Waiting for fonts + images longer than this fails the export with a Vietnamese message. */
export const EXPORT_TIMEOUT_MS = 20_000;
/** JPG quality when the caller does not choose one. */
export const DEFAULT_JPEG_QUALITY = 0.92;

export type ExportMimeType = 'image/png' | 'image/jpeg';

/** Output pixels = page size × pixelRatio, rounded (≥ 1). Throws a Vietnamese RangeError when too big. */
export function exportSize(page: Pick<Page, 'width' | 'height'>, pixelRatio: number): Size {
  if (!Number.isFinite(pixelRatio) || pixelRatio <= 0) {
    throw new RangeError('Tỉ lệ xuất ảnh không hợp lệ (phải là số lớn hơn 0).');
  }
  const width = Math.max(1, Math.round(page.width * pixelRatio));
  const height = Math.max(1, Math.round(page.height * pixelRatio));
  const longest = Math.max(width, height);
  if (longest > MAX_EXPORT_SIDE) {
    throw new RangeError(`Ảnh xuất quá lớn (cạnh dài ${longest} px, tối đa ${MAX_EXPORT_SIDE} px). Hãy chọn chất lượng thấp hơn.`);
  }
  return { width, height };
}

/**
 * True when a CSS colour has no transparency. Understands #rgb, #rgba, #rrggbb, #rrggbbaa,
 * rgb()/rgba()/hsl()/hsla() (comma or slash syntax) and 'transparent'. Other names count as opaque.
 */
export function isOpaqueColor(color: string | null | undefined): boolean {
  const c = (color ?? '').trim().toLowerCase();
  if (c === '' || c === 'transparent' || c === 'none') return false;
  if (c.startsWith('#')) {
    const hex = c.slice(1);
    if (hex.length === 4) return hex[3] === 'f';
    if (hex.length === 8) return hex.slice(6) === 'ff';
    return hex.length === 3 || hex.length === 6;
  }
  const fn = /^(rgba?|hsla?)\((.*)\)$/.exec(c);
  if (fn) {
    const body = fn[2] ?? '';
    let alpha: string | undefined;
    if (body.includes('/')) alpha = body.split('/')[1];
    else {
      const parts = body.split(',');
      if (parts.length === 4) alpha = parts[3];
    }
    if (alpha === undefined) return true;
    const a = alpha.trim();
    const value = a.endsWith('%') ? Number.parseFloat(a) / 100 : Number.parseFloat(a);
    return Number.isFinite(value) && value >= 1;
  }
  return true;
}

/**
 * Colour painted under everything. JPG has no transparency: white under a page whose colour is
 * not fully opaque. PNG keeps transparency (null).
 */
export function exportUnderlay(mimeType: ExportMimeType, backgroundColor: string): string | null {
  if (mimeType !== 'image/jpeg') return null;
  return isOpaqueColor(backgroundColor) ? null : '#ffffff';
}

/** Encoder quality for canvas.toBlob: JPG 0..1 (default 0.92), PNG ignores it (undefined). */
export function encoderQuality(mimeType: ExportMimeType, quality: number | undefined): number | undefined {
  if (mimeType !== 'image/jpeg') return undefined;
  if (quality === undefined || !Number.isFinite(quality)) return DEFAULT_JPEG_QUALITY;
  return Math.min(1, Math.max(0, quality));
}

/** Every asset a page draws: background image, image layers and their masks (no duplicates). Hidden layers are skipped. */
export function pageAssetIds(page: Pick<Page, 'background' | 'layers'>): Id[] {
  const ids = new Set<Id>();
  if (page.background.imageAssetId) ids.add(page.background.imageAssetId);
  for (const layer of page.layers) {
    if (layer.type !== 'image' || layer.hidden) continue;
    ids.add(layer.assetId);
    if (layer.maskAssetId) ids.add(layer.maskAssetId);
  }
  return [...ids];
}

/** Size of the offscreen picture of a masked / feathered image when exporting at `pixelRatio`. */
export function exportPictureBox(layer: { width: number; height: number }, pixelRatio: number): Size {
  return { width: layer.width * pixelRatio, height: layer.height * pixelRatio };
}

/** Rejects with `message` if `promise` takes longer than `ms`. */
export function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}
