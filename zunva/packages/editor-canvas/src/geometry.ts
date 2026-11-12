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

/** Round to 1 decimal (positions, sizes in page pixels; rotation in degrees). */
export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Rotation in [0, 360), 1 decimal. */
export function normalizeRotation(degrees: number): number {
  const r = round1(((degrees % 360) + 360) % 360);
  return r >= 360 ? 0 : r;
}

/** Snap tolerance for rotation (degrees) around 0° / 90° / 180° / 270°. */
export const ROTATION_SNAP_DEG = 5;

/** Rotation in [0, 360), pulled to the nearest right angle when within `tolerance` degrees. */
export function snapRotation(degrees: number, tolerance = ROTATION_SNAP_DEG): number {
  const r = ((degrees % 360) + 360) % 360;
  const nearest = Math.round(r / 90) * 90;
  return Math.abs(r - nearest) <= tolerance ? normalizeRotation(nearest) : normalizeRotation(r);
}

/**
 * Short, stable numbers in every emitted patch (founder saw font sizes like "101.18"):
 * fontSize → whole number, x/y/width/height → 0.1 px, rotation → 0.1° in [0, 360).
 */
export function roundPatch(patch: LayerPatch): LayerPatch {
  const out: Record<string, unknown> = { ...patch };
  for (const key of ['x', 'y', 'width', 'height'] as const) {
    const v = patch[key];
    if (typeof v === 'number') out[key] = round1(v);
  }
  if (typeof patch.rotation === 'number') out.rotation = normalizeRotation(patch.rotation);
  if (typeof patch.fontSize === 'number') out.fontSize = Math.max(1, Math.round(patch.fontSize));
  return out as LayerPatch;
}

/**
 * Converts a Konva node's transform (after Transformer) into layer fields.
 * Konva changes `scaleX/scaleY`; ZUNVA stores real width/height instead (scale stays 1).
 * Text: side handles change only the wrap width; a vertical scale (not used by the G2 handles,
 * kept for safety) also scales the font size.
 */
export function patchFromTransform(layer: Layer, t: NodeTransform): LayerPatch {
  const sx = Math.abs(t.scaleX);
  const sy = Math.abs(t.scaleY);
  const base: LayerPatch = { x: t.x, y: t.y, rotation: t.rotation };
  if (layer.type === 'text') {
    const patch: LayerPatch = { ...base, width: Math.max(1, layer.width * sx) };
    if (Math.abs(sy - 1) > 1e-3) patch.fontSize = Math.max(1, layer.fontSize * sy);
    return roundPatch(patch);
  }
  return roundPatch({
    ...base,
    width: Math.max(1, layer.width * sx),
    height: Math.max(1, layer.height * sy),
  });
}

// ---------- rotation and two-finger gestures (page coordinates) ----------

type Box = Pick<Layer, 'x' | 'y' | 'width' | 'height' | 'rotation'>;

function rotateVector(v: Point, degrees: number): Point {
  const a = (degrees * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  return { x: v.x * cos - v.y * sin, y: v.x * sin + v.y * cos };
}

/** Point (u, v) of the layer's own box, in page coordinates. */
export function layerPoint(layer: Box, u: number, v: number): Point {
  const r = rotateVector({ x: u, y: v }, layer.rotation);
  return { x: layer.x + r.x, y: layer.y + r.y };
}

/** Centre of the layer box in page coordinates. */
export function layerCenter(layer: Box): Point {
  return layerPoint(layer, layer.width / 2, layer.height / 2);
}

/** The 4 box corners in page coordinates: top-left, top-right, bottom-right, bottom-left. */
export function layerCorners(layer: Box): [Point, Point, Point, Point] {
  return [
    layerPoint(layer, 0, 0),
    layerPoint(layer, layer.width, 0),
    layerPoint(layer, layer.width, layer.height),
    layerPoint(layer, 0, layer.height),
  ];
}

/** Top-left (x, y) of a box of this size and rotation whose centre is `center`. */
export function topLeftFromCenter(center: Point, width: number, height: number, rotation: number): Point {
  const r = rotateVector({ x: width / 2, y: height / 2 }, rotation);
  return { x: center.x - r.x, y: center.y - r.y };
}

/** Direction from `center` to `point`, in degrees (0° = right, 90° = down, like Konva). */
export function angleFrom(center: Point, point: Point): number {
  return (Math.atan2(point.y - center.y, point.x - center.x) * 180) / Math.PI;
}

/**
 * Corner-handle rotation: turn the layer around its centre by how far the finger moved around
 * that centre (start → now), snapped to right angles. Size never changes.
 */
export function rotateAroundCenter(layer: Box, startPoint: Point, point: Point, tolerance = ROTATION_SNAP_DEG): LayerPatch {
  const center = layerCenter(layer);
  const rotation = snapRotation(layer.rotation + angleFrom(center, point) - angleFrom(center, startPoint), tolerance);
  const p = topLeftFromCenter(center, layer.width, layer.height, rotation);
  return roundPatch({ x: p.x, y: p.y, rotation });
}

/** Shortest side a layer may get from a two-finger gesture (page pixels). */
export const MIN_LAYER_SIDE = 8;

export type FingerPair = readonly [Point, Point];

/**
 * Two fingers on a selected layer (Instagram/Canva style): finger distance → scale,
 * finger angle → rotation, fingers' midpoint → position. The layer point under the
 * starting midpoint follows the current midpoint. Text scales its font size (whole number).
 * Rotation snaps to right angles within ROTATION_SNAP_DEG, like the corner handles.
 * The shorter side never goes under MIN_LAYER_SIDE.
 */
export function twoFingerPatch(layer: Layer, start: FingerPair, now: FingerPair): LayerPatch {
  const [s1, s2] = start;
  const [n1, n2] = now;
  const d0 = Math.hypot(s2.x - s1.x, s2.y - s1.y);
  const d = Math.hypot(n2.x - n1.x, n2.y - n1.y);
  const shortSide = Math.min(layer.width, layer.height);
  let k = d0 > 1e-6 ? d / d0 : 1;
  if (shortSide > 0) k = Math.max(k, MIN_LAYER_SIDE / shortSide);
  if (layer.type === 'text' && layer.fontSize > 0) k = Math.max(k, 1 / layer.fontSize);

  // Rotation follows the fingers but is pulled to 0°/90°/180°/270° when close, so a pinch that
  // only meant to resize does not leave the layer slightly crooked (founder test 12/11).
  const rotation = snapRotation(layer.rotation + angleFrom(n1, n2) - angleFrom(s1, s2));
  const delta = rotation - layer.rotation;
  const m0 = { x: (s1.x + s2.x) / 2, y: (s1.y + s2.y) / 2 };
  const m = { x: (n1.x + n2.x) / 2, y: (n1.y + n2.y) / 2 };
  const c = layerCenter(layer);
  const off = rotateVector({ x: (c.x - m0.x) * k, y: (c.y - m0.y) * k }, delta);
  const center = { x: m.x + off.x, y: m.y + off.y };

  const width = layer.width * k;
  const height = layer.height * k;
  const p = topLeftFromCenter(center, width, height, rotation);
  const patch: LayerPatch = { x: p.x, y: p.y, width, height, rotation };
  if (layer.type === 'text') patch.fontSize = layer.fontSize * k;
  return roundPatch(patch);
}

// ---------- tap vs drag ----------

export const TAP_MAX_MS = 300;
export const TAP_MAX_MOVE_PX = 10;

export interface PointerMark {
  x: number;
  y: number;
  /** Milliseconds (event timeStamp). */
  time: number;
}

/** True when finger down → up is a tap: shorter than 300 ms and moved less than 10 screen px. */
export function isTap(down: PointerMark, up: PointerMark): boolean {
  return up.time - down.time < TAP_MAX_MS && Math.hypot(up.x - down.x, up.y - down.y) < TAP_MAX_MOVE_PX;
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

/**
 * Background for the in-place text box so the text being typed stays readable on any photo:
 * light veil behind dark text, dark veil behind light text.
 */
export function editorBackdrop(color: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(color.trim());
  if (!m || !m[1]) return 'rgba(255,255,255,0.85)';
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? 'rgba(16,38,59,0.8)' : 'rgba(255,255,255,0.85)';
}
