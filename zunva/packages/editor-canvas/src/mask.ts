import type { BlendMode, Id, ImageLayer, Layer } from '@zunva/core';
import type { Point, Size, SourceCrop } from './geometry';

/**
 * Pure calculations for G2b (blend modes, feathered / masked images, eraser brush).
 * No DOM, no Konva: unit-tested in Node.
 *
 * Mask convention: the mask covers the layer box (x, y, width, height) and is stored in the
 * image's own (un-flipped) orientation, so a flipped image keeps its erased parts. White = keep,
 * black = erased. While painting, the canvas uses an "alpha" copy of the mask (opaque = keep).
 */

/** Longest side of the offscreen canvas used to draw a masked / feathered image. */
export const MAX_COMPOSITE_SIDE = 2048;
/** Longest side of a mask PNG. */
export const MAX_MASK_SIDE = 1024;

/** Konva/canvas `globalCompositeOperation` for a layer blend mode. Names match CSS. */
export function blendToComposite(mode: BlendMode): 'source-over' | Exclude<BlendMode, 'normal'> {
  return mode === 'normal' ? 'source-over' : mode;
}

/** Canvas size (whole pixels, ≥ 1) with the same shape as `size`, longest side ≤ `maxSide`. */
export function fitCanvasSize(size: Size, maxSide: number): Size {
  const w = Math.max(1, size.width);
  const h = Math.max(1, size.height);
  const s = Math.min(1, maxSide / Math.max(w, h));
  return { width: Math.max(1, Math.round(w * s)), height: Math.max(1, Math.round(h * s)) };
}

/** Size of the mask canvas / PNG for a layer box (shape of the box, longest side ≤ 1024). */
export function maskCanvasSize(layer: Pick<Layer, 'width' | 'height'>): Size {
  return fitCanvasSize({ width: layer.width, height: layer.height }, MAX_MASK_SIDE);
}

/** Size of the offscreen composite canvas for an image layer (longest side ≤ 2048). */
export function compositeCanvasSize(layer: Pick<Layer, 'width' | 'height'>): Size {
  return fitCanvasSize({ width: layer.width, height: layer.height }, MAX_COMPOSITE_SIDE);
}

/** True when an image layer must be drawn through the offscreen canvas. */
export function needsComposite(layer: Pick<ImageLayer, 'feather' | 'maskAssetId'>): boolean {
  return layer.feather > 0 || layer.maskAssetId !== null;
}

export interface CompositeKeyInput {
  assetId: Id;
  /** null = no mask; 'stroke' style ids are fine too (any string). */
  maskId: string | null;
  width: number;
  height: number;
  cornerRadius: number;
  feather: number;
  flipX: boolean;
  flipY: boolean;
  crop: SourceCrop | null;
  canvas: Size;
}

/** Cache key: the offscreen canvas is rebuilt only when one of these changes. */
export function compositeKey(k: CompositeKeyInput): string {
  const crop = k.crop ? `${k.crop.x},${k.crop.y},${k.crop.width},${k.crop.height}` : '-';
  return [
    k.assetId,
    k.maskId ?? '-',
    k.width,
    k.height,
    k.cornerRadius,
    k.feather,
    k.flipX ? 1 : 0,
    k.flipY ? 1 : 0,
    crop,
    `${k.canvas.width}x${k.canvas.height}`,
  ].join('|');
}

/**
 * Feather drawing plan in canvas pixels: the keep-shape is a rounded rectangle inset by `inset`,
 * blurred by `blur` (CSS blur radius = standard deviation). Edge alpha fades from ~0 at the border
 * to ~1 at `feather` inside.
 */
export function featherPlan(
  layer: Pick<ImageLayer, 'width' | 'height' | 'feather' | 'cornerRadius'>,
  canvas: Size,
): { inset: number; blur: number; radius: number } {
  const scale = canvas.width / Math.max(1, layer.width);
  const shortSide = Math.min(canvas.width, canvas.height);
  const feather = Math.min(Math.max(0, layer.feather) * scale, shortSide / 2);
  const inset = Math.min(feather / 2, shortSide / 2 - 0.5);
  const radius = Math.max(0, Math.min(layer.cornerRadius * scale, shortSide / 2) - inset);
  return { inset: Math.max(0, inset), blur: feather / 2, radius };
}

type Box = Pick<Layer, 'x' | 'y' | 'width' | 'height' | 'rotation'>;

/**
 * Page point → point in the layer's own box (0..width, 0..height), undoing rotation and, for
 * images, the flip (so it lands on the mask, which follows the image).
 */
export function pageToLayerLocal(layer: Box & { flipX?: boolean; flipY?: boolean }, p: Point): Point {
  const a = (-layer.rotation * Math.PI) / 180;
  const dx = p.x - layer.x;
  const dy = p.y - layer.y;
  let u = dx * Math.cos(a) - dy * Math.sin(a);
  let v = dx * Math.sin(a) + dy * Math.cos(a);
  if (layer.flipX) u = layer.width - u;
  if (layer.flipY) v = layer.height - v;
  return { x: u, y: v };
}

/** Layer-box point → mask pixel. */
export function layerLocalToMask(local: Point, layer: Pick<Layer, 'width' | 'height'>, mask: Size): Point {
  return {
    x: (local.x / Math.max(1e-6, layer.width)) * mask.width,
    y: (local.y / Math.max(1e-6, layer.height)) * mask.height,
  };
}

/** Brush radius in mask pixels: `sizeScreenPx` is the brush diameter on screen. */
export function brushRadiusInMask(sizeScreenPx: number, viewScale: number, layer: Pick<Layer, 'width'>, mask: Size): number {
  const pagePx = sizeScreenPx / 2 / Math.max(1e-6, viewScale);
  return Math.max(0.5, (pagePx * mask.width) / Math.max(1e-6, layer.width));
}

/** Distance between brush dabs: a quarter of the radius (≥ 1 px) leaves no gaps. */
export function dabSpacing(radius: number): number {
  return Math.max(1, radius * 0.25);
}

/**
 * Dabs between two finger positions so a fast swipe draws a solid line (no holes).
 * Returns the points after `from`, up to and including `to`.
 */
export function strokePoints(from: Point, to: Point, spacing: number): Point[] {
  const d = Math.hypot(to.x - from.x, to.y - from.y);
  const step = Math.max(1e-6, spacing);
  const n = Math.max(1, Math.ceil(d / step));
  const out: Point[] = [];
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    out.push({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t });
  }
  return out;
}

/** Inner radius of the soft brush: softness 0 = hard edge, 1 = fades from the centre. */
export function brushInnerRadius(radius: number, softness: number): number {
  return radius * (1 - Math.min(1, Math.max(0, softness)));
}

/**
 * Grey mask pixels (RGBA, white = keep) → alpha mask (white pixels, alpha = brightness), in place.
 * The canvas "destination-in" step uses alpha, not brightness.
 */
export function grayToAlpha(data: Uint8ClampedArray): void {
  for (let i = 0; i + 3 < data.length; i += 4) {
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    const a = data[i + 3] ?? 255;
    // Rec. 601 brightness; a transparent source pixel counts as erased.
    const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
    data[i + 3] = Math.round((lum * a) / 255);
  }
}

/** Gap (screen px) the rotate handles need between each other and the side handles. */
export const HANDLE_MIN_GAP = 44;

/**
 * K6: how far (screen px, along each axis, outward on the corner diagonal) to push the corner
 * rotate handles so they stay ≥ 44 px apart on a thin layer (e.g. one line of text).
 */
export function rotateHandleOffset(screenWidth: number, screenHeight: number, minGap = HANDLE_MIN_GAP): number {
  return Math.max(0, (2 * minGap - Math.min(screenWidth, screenHeight)) / 2);
}

/**
 * Rotate-handle centres in page coordinates (top-left, top-right, bottom-right, bottom-left),
 * pushed outward when the layer is small on screen.
 */
export function rotateHandlePositions(layer: Box, viewScale: number, minGap = HANDLE_MIN_GAP): [Point, Point, Point, Point] {
  const s = Math.max(1e-6, viewScale);
  const d = rotateHandleOffset(layer.width * s, layer.height * s, minGap) / s;
  const a = (layer.rotation * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const at = (u: number, v: number): Point => ({ x: layer.x + u * cos - v * sin, y: layer.y + u * sin + v * cos });
  return [at(-d, -d), at(layer.width + d, -d), at(layer.width + d, layer.height + d), at(-d, layer.height + d)];
}
