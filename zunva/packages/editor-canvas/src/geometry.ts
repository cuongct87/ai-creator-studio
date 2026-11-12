import type { Crop, Id, Layer, LayerPatch, Op, TextLayer } from '@zunva/core';

/**
 * Pure calculations for the canvas (no Konva, no DOM), so they can be unit-tested in Node.
 *
 * Coordinate convention shared with every renderer (canvas, PNG, later PDF):
 * a layer is drawn as translate(x, y) → rotate(rotation°) → draw the box [0, width] × [0, height].
 * So (x, y) is the layer's own top-left corner, and rotation turns around that corner.
 */

export interface Size {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

/** Stage view: page pixel (px, py) is shown at screen (x + px·scale, y + py·scale). */
export interface View {
  scale: number;
  x: number;
  y: number;
}

/** What Konva reports for a node after a drag or a Transformer gesture. */
export interface NodeTransform {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

/** Crop in source-image pixels (what Konva's `crop` expects). */
export interface SourceCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Pinch-zoom limits relative to the "fit to screen" scale. */
export const ZOOM_MIN_FACTOR = 0.5;
export const ZOOM_MAX_FACTOR = 8;
/** Leave a small margin around the page when fitting. */
export const FIT_MARGIN = 0.92;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Round to 2 decimals so stored numbers stay short and stable. */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** View that shows the whole page centred in the viewport. */
export function fitPage(viewport: Size, page: Size, margin = FIT_MARGIN): View {
  if (!(viewport.width > 0 && viewport.height > 0 && page.width > 0 && page.height > 0)) {
    return { scale: 1, x: 0, y: 0 };
  }
  const scale = Math.min(viewport.width / page.width, viewport.height / page.height) * margin;
  return { scale, x: (viewport.width - page.width * scale) / 2, y: (viewport.height - page.height * scale) / 2 };
}

export function zoomLimits(fitScale: number): { min: number; max: number } {
  return { min: fitScale * ZOOM_MIN_FACTOR, max: fitScale * ZOOM_MAX_FACTOR };
}

export function screenToPage(view: View, point: Point): Point {
  return { x: (point.x - view.x) / view.scale, y: (point.y - view.y) / view.scale };
}

export function pageToScreen(view: View, point: Point): Point {
  return { x: view.x + point.x * view.scale, y: view.y + point.y * view.scale };
}

/** Zoom to `scale` while keeping the page point under `screenPoint` in place (mouse wheel). */
export function zoomAt(view: View, screenPoint: Point, scale: number): View {
  const p = screenToPage(view, screenPoint);
  return { scale, x: screenPoint.x - p.x * scale, y: screenPoint.y - p.y * scale };
}

export interface PinchStart {
  view: View;
  center: Point;
  distance: number;
}

/** Two-finger zoom: the page point under the starting centre follows the fingers' centre. */
export function pinchView(start: PinchStart, center: Point, distance: number, limits: { min: number; max: number }): View {
  const scale = clamp((start.view.scale * distance) / Math.max(1, start.distance), limits.min, limits.max);
  const p = screenToPage(start.view, start.center);
  return { scale, x: center.x - p.x * scale, y: center.y - p.y * scale };
}

/** Rotation in [0, 360), 2 decimals. */
export function normalizeRotation(degrees: number): number {
  const r = round2(((degrees % 360) + 360) % 360);
  return r >= 360 ? 0 : r;
}

/**
 * Converts a Konva node's transform (after Transformer) into layer fields.
 * Konva changes `scaleX/scaleY`; ZUNVA stores real width/height instead (scale stays 1).
 * Text: side handles change only the wrap width; corner handles also scale the font size.
 */
export function patchFromTransform(layer: Layer, t: NodeTransform): LayerPatch {
  const sx = Math.abs(t.scaleX);
  const sy = Math.abs(t.scaleY);
  const base: LayerPatch = { x: round2(t.x), y: round2(t.y), rotation: normalizeRotation(t.rotation) };
  if (layer.type === 'text') {
    const patch: LayerPatch = { ...base, width: round2(Math.max(1, layer.width * sx)) };
    if (Math.abs(sy - 1) > 1e-3) patch.fontSize = round2(Math.max(1, layer.fontSize * sy));
    return patch;
  }
  return {
    ...base,
    width: round2(Math.max(1, layer.width * sx)),
    height: round2(Math.max(1, layer.height * sy)),
  };
}

/** Keeps only the fields whose value really changes (avoids empty undo steps). */
export function changedFields(layer: Layer, patch: LayerPatch): LayerPatch {
  const current = layer as unknown as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (current[key] !== value) out[key] = value;
  }
  return out as LayerPatch;
}

export function isEmptyPatch(patch: LayerPatch): boolean {
  return Object.keys(patch).length === 0;
}

export function updateLayerOp(pageId: Id, layerId: Id, set: LayerPatch): Op {
  return { op: 'updateLayer', pageId, layerId, set };
}

/** Same key for every move event of one drag, so history merges them into ONE undo step. */
export function dragMergeKey(layerId: Id): string {
  return `drag:${layerId}`;
}

/** Key for a resize/rotate (or multi-layer move) of a set of layers. Order-independent. */
export function transformMergeKey(layerIds: readonly Id[]): string {
  return `transform:${[...layerIds].sort().join(',')}`;
}

/** Konva `fontStyle`: e.g. "700" or "italic 400" (weight 100 → 1000). */
export function konvaFontStyle(layer: Pick<TextLayer, 'fontWeight' | 'italic'>): string {
  const weight = Math.round(clamp(layer.fontWeight, 100, 1000));
  return layer.italic ? `italic ${weight}` : `${weight}`;
}

/** CSS font-family value for the HTML text editor. */
export function cssFontFamily(family: string): string {
  return `"${family.replace(/["\\]/g, '')}", sans-serif`;
}

/** Model crop (fractions 0 → 1 of the original image) → source pixels for Konva. */
export function cropToSource(crop: Crop | null, natural: Size): SourceCrop | null {
  if (!crop || !(natural.width > 0 && natural.height > 0)) return null;
  return {
    x: crop.x * natural.width,
    y: crop.y * natural.height,
    width: crop.width * natural.width,
    height: crop.height * natural.height,
  };
}

/** Source-pixel crop that fills `box` without stretching (CSS "cover"), centred. */
export function coverCrop(natural: Size, box: Size): SourceCrop {
  if (!(natural.width > 0 && natural.height > 0 && box.width > 0 && box.height > 0)) {
    return { x: 0, y: 0, width: Math.max(0, natural.width), height: Math.max(0, natural.height) };
  }
  const scale = Math.max(box.width / natural.width, box.height / natural.height);
  const width = box.width / scale;
  const height = box.height / scale;
  return { x: (natural.width - width) / 2, y: (natural.height - height) / 2, width, height };
}
