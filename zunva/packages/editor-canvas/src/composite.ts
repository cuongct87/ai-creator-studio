import type { ImageLayer } from '@zunva/core';
import type { Point, Size, SourceCrop } from './geometry';
import { brushInnerRadius, featherPlan, grayToAlpha } from './mask';

/**
 * Browser-only drawing helpers for G2b (offscreen canvases). The maths lives in mask.ts (tested);
 * this file only talks to the 2D canvas API.
 */

export function createCanvas(size: Size): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size.width;
  c.height = size.height;
  return c;
}

function context(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Trình duyệt không vẽ được canvas 2D.');
  return ctx;
}

let filterSupport: boolean | null = null;

/** `ctx.filter = 'blur(..)'` works (WebView Chrome: yes). Without it the feather is skipped. */
export function canvasFilterSupported(): boolean {
  if (filterSupport !== null) return filterSupport;
  try {
    const ctx = createCanvas({ width: 1, height: 1 }).getContext('2d');
    if (!ctx || !('filter' in ctx)) {
      filterSupport = false;
    } else {
      ctx.filter = 'blur(2px)';
      filterSupport = ctx.filter === 'blur(2px)';
    }
  } catch {
    filterSupport = false;
  }
  return filterSupport;
}

/** Grey mask image (white = keep) → canvas whose alpha is the mask (what destination-in needs). */
export function alphaMaskFromImage(image: CanvasImageSource, size: Size): HTMLCanvasElement {
  const canvas = createCanvas(size);
  const ctx = context(canvas);
  ctx.drawImage(image, 0, 0, size.width, size.height);
  const data = ctx.getImageData(0, 0, size.width, size.height);
  grayToAlpha(data.data);
  ctx.putImageData(data, 0, 0);
  return canvas;
}

/** A fresh alpha mask: everything kept. */
export function fullAlphaMask(size: Size): HTMLCanvasElement {
  const canvas = createCanvas(size);
  const ctx = context(canvas);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size.width, size.height);
  return canvas;
}

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

export interface CompositeInput {
  layer: Pick<ImageLayer, 'width' | 'height' | 'cornerRadius' | 'feather' | 'flipX' | 'flipY'>;
  image: CanvasImageSource;
  crop: SourceCrop | null;
  /** Alpha mask in the image's own orientation (opaque = keep), or null. */
  mask: CanvasImageSource | null;
}

/**
 * Draws an image layer into `canvas` (reused when given):
 * 1. the image, flipped; 2. destination-in with the mask (flipped the same way, so it follows the
 * image); 3. destination-in with a rounded rectangle blurred by the feather (soft edge).
 */
export function renderComposite(input: CompositeInput, size: Size, canvas?: HTMLCanvasElement): HTMLCanvasElement {
  const out = canvas ?? createCanvas(size);
  if (out.width !== size.width) out.width = size.width;
  if (out.height !== size.height) out.height = size.height;
  const ctx = context(out);
  const { layer, image, crop, mask } = input;
  const { width: cw, height: ch } = size;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.filter = 'none';
  ctx.clearRect(0, 0, cw, ch);

  ctx.save();
  ctx.translate(layer.flipX ? cw : 0, layer.flipY ? ch : 0);
  ctx.scale(layer.flipX ? -1 : 1, layer.flipY ? -1 : 1);
  if (crop) ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, cw, ch);
  else ctx.drawImage(image, 0, 0, cw, ch);
  if (mask) {
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(mask, 0, 0, cw, ch);
  }
  ctx.restore();

  const plan = featherPlan(layer, size);
  const blur = plan.blur > 0 && canvasFilterSupported() ? plan.blur : 0;
  if (blur > 0 || plan.radius > 0) {
    const inset = blur > 0 ? plan.inset : 0;
    const radius = blur > 0 ? plan.radius : featherPlan({ ...layer, feather: 0 }, size).radius;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    if (blur > 0) ctx.filter = `blur(${blur}px)`;
    ctx.fillStyle = '#ffffff';
    roundedRectPath(ctx, inset, inset, cw - inset * 2, ch - inset * 2, radius);
    ctx.fill();
    ctx.restore();
    ctx.filter = 'none';
  }
  ctx.globalCompositeOperation = 'source-over';
  return out;
}

/** One round brush dab on the alpha mask. erase = remove alpha; restore = add it back. */
export function paintDab(mask: HTMLCanvasElement, at: Point, radius: number, softness: number, mode: 'erase' | 'restore'): void {
  const ctx = context(mask);
  const inner = brushInnerRadius(radius, softness);
  ctx.save();
  ctx.globalCompositeOperation = mode === 'erase' ? 'destination-out' : 'source-over';
  if (inner >= radius - 0.01) {
    ctx.fillStyle = '#ffffff';
  } else {
    const g = ctx.createRadialGradient(at.x, at.y, inner, at.x, at.y, radius);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
  }
  ctx.beginPath();
  ctx.arc(at.x, at.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Alpha mask → grey PNG bytes (white = keep, black = erased), as stored in the project. */
export async function alphaMaskToPng(mask: HTMLCanvasElement): Promise<Uint8Array> {
  const grey = createCanvas({ width: mask.width, height: mask.height });
  const ctx = context(grey);
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, grey.width, grey.height);
  ctx.drawImage(mask, 0, 0);
  const blob = await encodeCanvas(grey, 'image/png').catch(() => {
    throw new Error('Không lưu được vùng tẩy.');
  });
  return new Uint8Array(await blob.arrayBuffer());
}

/**
 * Canvas → ảnh (PNG/JPG) **ngay**, không chờ máy rảnh.
 * `HTMLCanvasElement.toBlob` của Chrome/WebView chỉ mã hóa khi luồng chính rảnh; lúc app đang vẽ
 * (Konva, tay nắm, ảnh thu nhỏ) nó có thể chờ vài giây (đo trên S24+: tạo mặt nạ tẩy mất 4 giây).
 * `OffscreenCanvas.convertToBlob` mã hóa luôn. Máy không có OffscreenCanvas thì dùng `toDataURL` (đồng bộ).
 */
export async function encodeCanvas(canvas: HTMLCanvasElement, mimeType: 'image/png' | 'image/jpeg', quality?: number): Promise<Blob> {
  if (typeof OffscreenCanvas !== 'undefined') {
    const off = new OffscreenCanvas(canvas.width, canvas.height);
    const ctx = off.getContext('2d');
    if (ctx) {
      ctx.drawImage(canvas, 0, 0);
      try {
        return await off.convertToBlob(quality === undefined ? { type: mimeType } : { type: mimeType, quality });
      } finally {
        // Trả bộ nhớ ngay (ảnh xuất có thể tới 8000 px).
        off.width = 0;
        off.height = 0;
      }
    }
  }
  const url = canvas.toDataURL(mimeType, quality);
  const comma = url.indexOf(',');
  const binary = atob(url.slice(comma + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}
