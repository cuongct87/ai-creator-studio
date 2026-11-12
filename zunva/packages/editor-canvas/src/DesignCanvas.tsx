import type { DesignDocument, Id, ImageLayer, Layer, Op, ShapeLayer, TextLayer } from '@zunva/core';
import Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import {
  type ChangeEvent,
  type CSSProperties,
  type JSX,
  type KeyboardEvent as ReactKeyboardEvent,
  type Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
import { Arc, Circle, Ellipse, Group, Image as KImage, Layer as KLayer, Line, Rect, RegularPolygon, Stage, Text, Transformer } from 'react-konva';
import { fontsReady } from './fonts';
import {
  changedFields,
  clamp,
  coverCrop,
  cropToSource,
  cssFontFamily,
  dragMergeKey,
  type FingerPair,
  fitPage,
  isEmptyPatch,
  isTap,
  konvaFontStyle,
  layerCorners,
  patchFromTransform,
  type PinchStart,
  type Point,
  type PointerMark,
  pinchView,
  rotateAroundCenter,
  round1,
  roundPatch,
  screenToPage,
  transformMergeKey,
  twoFingerPatch,
  updateLayerOp,
  type View,
  zoomAt,
  zoomLimits,
} from './geometry';
import { useImageCache } from './images';

// Let a second finger start a pinch while the first finger is already dragging (as in G1-4).
Konva.hitOnDragEnabled = true;

export interface DesignCanvasProps {
  document: DesignDocument;
  pageId: Id;
  /** Selected layers. */
  selection: readonly Id[];
  /** Tap on a layer → [id]; tap on empty space → []. */
  onSelect(ids: Id[]): void;
  /** Every change made on the page. mergeKey: merges continuous drag steps into 1 undo step. */
  onOps(label: string, ops: Op[], mergeKey?: string): void;
  /** Finger lifted / drag ended: close the merge step (history.closeMerge). */
  onGestureEnd(): void;
  /** blob: URL of an asset; undefined = still loading → a grey box is drawn. */
  assetUrl(assetId: Id): string | undefined;
  /** Which text layer is being edited (so the outer frame can hide its toolbar). */
  onTextEditing?(layerId: Id | null): void;
  readonly?: boolean;
}

export interface DesignCanvasHandle {
  fitToScreen(): void;
  /** For G3 (PNG export): exactly the page frame, not the screen. Output = page size × pixelRatio. */
  exportPageImage(pixelRatio: number): Promise<Blob>;
  /**
   * Opens the text box (and the phone keyboard) on a text layer, e.g. right after the app adds
   * a new text layer. Works even if the layer appears on the page a moment later.
   */
  startTextEdit(layerId: Id): void;
}

type AnyEvent = KonvaEventObject<Event>;

interface Editing {
  id: Id;
  value: string;
  style: CSSProperties;
}

/** Two fingers on the page: either moving/zooming the page or scaling/rotating the selected layer. */
type TwoFingerGesture =
  | { kind: 'page'; start: PinchStart }
  | { kind: 'layer'; layer: Layer; start: FingerPair };

/** Finger on a corner rotate handle. */
interface RotateGesture {
  pointerId: number;
  layer: Layer;
  start: Point;
  cleanup: () => void;
}

const EMPTY_LAYERS: readonly Layer[] = [];
// Corners are rotate handles (drawn separately). The Transformer keeps only the side handles:
// text → left/right (wrap width only); images and shapes → all four sides (stretch one way).
const BOX_ANCHORS = ['top-center', 'middle-right', 'middle-left', 'bottom-center'];
const TEXT_ANCHORS = ['middle-left', 'middle-right'];
const ANCHOR_SIZE = 18;
/** Minimum finger target for handles, in screen pixels. */
const TOUCH_TARGET = 44;
/** Corner rotate handle: visible radius in screen pixels. */
const ROTATE_HANDLE_RADIUS = 12;
const ACCENT = '#0d8799';
const PLACEHOLDER_FILL = '#d0d5dd';
const MAX_EXPORT_SIDE = 16384;
/** Ignore the canvas "finger down" that closes the text box right after it opened. */
const EDIT_OPEN_GUARD_MS = 400;
/** Frames to wait for a just-added text layer to be drawn before opening its text box. */
const PENDING_EDIT_FRAMES = 30;

const LABEL_MOVE = 'Di chuyển';
const LABEL_TRANSFORM = 'Đổi cỡ / xoay';
const LABEL_ROTATE = 'Xoay';
const LABEL_EDIT_TEXT = 'Sửa chữ';

const WRAP_STYLE: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  touchAction: 'none',
};

const TEXTAREA_BASE: CSSProperties = {
  position: 'absolute',
  margin: 0,
  padding: 0,
  border: 0,
  outline: `1px dashed ${ACCENT}`,
  background: 'transparent',
  resize: 'none',
  overflow: 'hidden',
  whiteSpace: 'pre-wrap',
  overflowWrap: 'break-word',
  transformOrigin: 'left top',
  boxSizing: 'content-box',
  zIndex: 10,
};

// Top-right with the safe area: never hidden by the keyboard or the screen edge (G1-4 lesson).
const DONE_STYLE: CSSProperties = {
  position: 'absolute',
  top: 8,
  right: 'max(8px, env(safe-area-inset-right, 0px))',
  zIndex: 11,
  minWidth: 64,
  minHeight: 44,
  padding: '8px 16px',
  border: 0,
  borderRadius: 10,
  background: ACCENT,
  color: '#ffffff',
  font: 'inherit',
  fontWeight: 700,
};

/** Height Konva gives a text block (auto height), used to keep TextLayer.height in sync. */
function measureTextHeight(layer: TextLayer, text: string): number {
  const probe = new Konva.Text({
    text,
    fontFamily: layer.fontFamily,
    fontSize: layer.fontSize,
    fontStyle: konvaFontStyle(layer),
    width: layer.width,
    lineHeight: layer.lineHeight,
    letterSpacing: layer.letterSpacing,
    align: layer.align,
    wrap: 'word',
  });
  const height = probe.height();
  probe.destroy();
  return round1(Math.max(1, height));
}

/** Round "rotate" icon in screen pixels: white dot, accent ring arrow (↻). Hit area = 44 px circle. */
function RotateIcon(): JSX.Element {
  return (
    <>
      <Circle radius={TOUCH_TARGET / 2} fill="rgba(0,0,0,0)" />
      <Circle radius={ROTATE_HANDLE_RADIUS} fill="#ffffff" stroke={ACCENT} strokeWidth={1.5} shadowColor="#000000" shadowOpacity={0.2} shadowBlur={3} listening={false} />
      <Arc innerRadius={4.5} outerRadius={6.5} angle={280} rotation={40} fill={ACCENT} listening={false} />
      {/* Arrow head at the end of the arc (320°), pointing clockwise. */}
      <RegularPolygon sides={3} radius={3.2} x={4.2} y={-3.5} rotation={140} fill={ACCENT} listening={false} />
    </>
  );
}

/** Larger invisible hit area around each Transformer handle so fingers can grab it. */
function styleAnchor(anchor: Konva.Rect): void {
  const size = anchor.width();
  const pad = Math.max(0, (TOUCH_TARGET - size) / 2);
  anchor.hitFunc((ctx, shape) => {
    ctx.beginPath();
    ctx.rect(-pad, -pad, size + pad * 2, size + pad * 2);
    ctx.closePath();
    ctx.fillStrokeShape(shape);
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Không xuất được ảnh trang.'))), 'image/png');
  });
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * Draws one page of a DesignDocument with Konva. The canvas never keeps its own copy of the
 * document: it draws `document` and reports changes as core `Op`s (the outer frame runs them
 * through history, so undo/redo lives in one place).
 *
 * The parent must give this component a size (it fills 100% × 100% of its box).
 */
export function DesignCanvas(props: DesignCanvasProps & { ref?: Ref<DesignCanvasHandle> }): JSX.Element {
  const { document: doc, pageId, selection, onSelect, onOps, onGestureEnd, assetUrl, onTextEditing, readonly = false, ref } = props;
  const page = doc.pages.find((p) => p.id === pageId) ?? doc.pages[0] ?? null;
  const currentPageId = page?.id ?? pageId;
  const pageWidth = page?.width ?? 1;
  const pageHeight = page?.height ?? 1;
  const layers = page?.layers ?? EMPTY_LAYERS;
  const layerById = useMemo(() => new Map(layers.map((l) => [l.id, l])), [layers]);

  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const pageLayerRef = useRef<Konva.Layer>(null);
  const bgRef = useRef<Konva.Rect>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const nodes = useRef(new Map<Id, Konva.Node>());
  const refCallbacks = useRef(new Map<Id, (node: Konva.Node | null) => void>());
  const view = useRef<View>({ scale: 1, x: 0, y: 0 });
  const fitScale = useRef(1);
  const handlesRef = useRef<Konva.Group>(null);
  const twoFinger = useRef<TwoFingerGesture | null>(null);
  const rotating = useRef<RotateGesture | null>(null);
  /** True while we stop a one-finger drag because a second finger arrived (same undo step). */
  const stoppingForTwoFingers = useRef(false);
  /** Finger down on the already-selected text layer: a quick tap opens the text box (F1). */
  const tapDown = useRef<(PointerMark & { id: Id }) | null>(null);
  const editOpenedAt = useRef(0);
  const pendingEdit = useRef<{ id: Id; frames: number; raf: number } | null>(null);
  const dragFrame = useRef<{ raf: number; emit: () => void } | null>(null);
  const transformPending = useRef(false);
  const editingRef = useRef<Editing | null>(null);

  const [box, setBox] = useState({ width: 1, height: 1 });
  const [editing, setEditing] = useState<Editing | null>(null);
  const [fontsTick, setFontsTick] = useState(0);
  const images = useImageCache();

  editingRef.current = editing;
  /** Latest props for listeners that outlive one render (window pointer events, pending edit). */
  const live = useRef({ layerById, onOps, onGestureEnd, pageId: currentPageId });
  live.current = { layerById, onOps, onGestureEnd, pageId: currentPageId };

  // ---------- size of the drawing area ----------
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setBox({ width: Math.max(1, Math.floor(el.clientWidth)), height: Math.max(1, Math.floor(el.clientHeight)) });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ---------- view (zoom / pan), applied straight to the stage, not through React ----------
  const applyView = useCallback((next: View) => {
    view.current = next;
    const stage = stageRef.current;
    if (!stage) return;
    stage.scale({ x: next.scale, y: next.scale });
    stage.position({ x: next.x, y: next.y });
    // Rotate handles keep the same size on screen at any zoom.
    const inv = 1 / next.scale;
    handlesRef.current?.getChildren().forEach((h) => h.scale({ x: inv, y: inv }));
    stage.batchDraw();
  }, []);

  const fitToScreen = useCallback(() => {
    const next = fitPage({ width: box.width, height: box.height }, { width: pageWidth, height: pageHeight });
    fitScale.current = next.scale;
    applyView(next);
  }, [box.width, box.height, pageWidth, pageHeight, applyView]);

  // Refit when the area or the page size changes. The scene itself is never rebuilt (G1-4 lesson),
  // and not while typing (the phone keyboard resizes the area).
  useEffect(() => {
    if (editingRef.current) return;
    fitToScreen();
  }, [fitToScreen]);

  // ---------- fonts: redraw text once the real fonts are ready ----------
  useEffect(() => {
    let alive = true;
    const bump = () => {
      if (alive) setFontsTick((t) => t + 1);
    };
    void fontsReady().then(bump);
    const fontSet = typeof document !== 'undefined' ? document.fonts : undefined;
    fontSet?.addEventListener('loadingdone', bump);
    return () => {
      alive = false;
      fontSet?.removeEventListener('loadingdone', bump);
    };
  }, []);

  useEffect(
    () => () => {
      if (dragFrame.current) cancelAnimationFrame(dragFrame.current.raf);
      if (pendingEdit.current) cancelAnimationFrame(pendingEdit.current.raf);
      rotating.current?.cleanup();
    },
    [],
  );

  const register = useCallback((id: Id) => {
    let cb = refCallbacks.current.get(id);
    if (!cb) {
      cb = (node: Konva.Node | null) => {
        if (node) {
          nodes.current.set(id, node);
          if (editingRef.current?.id === id) node.hide();
        } else {
          nodes.current.delete(id);
        }
      };
      refCallbacks.current.set(id, cb);
    }
    return cb;
  }, []);

  // ---------- selection → Transformer ----------
  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;
    const attached: Konva.Node[] = [];
    if (!readonly && !editing) {
      for (const id of selection) {
        const layer = layerById.get(id);
        const node = nodes.current.get(id);
        if (layer && node && !layer.locked && !layer.hidden) attached.push(node);
      }
    }
    tr.nodes(attached);
    const hasText = selection.some((id) => layerById.get(id)?.type === 'text');
    tr.enabledAnchors(hasText ? TEXT_ANCHORS : BOX_ANCHORS);
    // Layer props change on every gesture frame (text height follows font size): refit the frame.
    tr.forceUpdate();
    tr.getLayer()?.batchDraw();
  }, [selection, layerById, editing, readonly, fontsTick]);

  const movableSelection = selection.filter((id) => {
    const l = layerById.get(id);
    return !!l && !l.locked && !l.hidden;
  });

  // ---------- tap to select ----------
  const select = (id: Id, e: AnyEvent) => {
    if (readonly || editingRef.current) return;
    e.cancelBubble = true;
    const additive = e.evt instanceof MouseEvent && e.evt.shiftKey;
    if (additive) {
      onSelect(selection.includes(id) ? selection.filter((x) => x !== id) : [...selection, id]);
    } else if (!(selection.length === 1 && selection[0] === id)) {
      onSelect([id]);
    }
  };

  const onStageTap = (e: AnyEvent) => {
    if (readonly || editingRef.current) return;
    const target = e.target;
    if ((target === stageRef.current || target.name() === 'page-bg') && selection.length > 0) onSelect([]);
  };

  // ---------- drag (move) ----------
  const flushDragEmit = () => {
    const pending = dragFrame.current;
    if (!pending) return;
    cancelAnimationFrame(pending.raf);
    dragFrame.current = null;
    pending.emit();
  };

  const scheduleDragEmit = (emit: () => void) => {
    if (dragFrame.current) {
      dragFrame.current.emit = emit;
      return;
    }
    const entry = { raf: 0, emit };
    entry.raf = requestAnimationFrame(() => {
      dragFrame.current = null;
      entry.emit();
    });
    dragFrame.current = entry;
  };

  const emitMove = (layer: Layer, node: Konva.Node) => {
    const patch = changedFields(layer, roundPatch({ x: node.x(), y: node.y() }));
    if (!isEmptyPatch(patch)) onOps(LABEL_MOVE, [updateLayerOp(currentPageId, layer.id, patch)], dragMergeKey(layer.id));
  };

  const isMultiDrag = (id: Id) => movableSelection.length > 1 && movableSelection.includes(id);

  const onDragStart = (layer: Layer) => {
    if (!selection.includes(layer.id)) onSelect([layer.id]);
  };

  const onDragMove = (layer: Layer) => {
    // Multi-layer moves are reported once at the end (one op per layer would pile up while dragging).
    if (isMultiDrag(layer.id)) return;
    const node = nodes.current.get(layer.id);
    if (node) scheduleDragEmit(() => emitMove(layerById.get(layer.id) ?? layer, node));
  };

  const onDragEnd = (layer: Layer) => {
    flushDragEmit();
    if (isMultiDrag(layer.id)) {
      const ops: Op[] = [];
      const ids: Id[] = [];
      for (const id of movableSelection) {
        const l = layerById.get(id);
        const node = nodes.current.get(id);
        if (!l || !node) continue;
        const patch = changedFields(l, roundPatch({ x: node.x(), y: node.y() }));
        if (isEmptyPatch(patch)) continue;
        ops.push(updateLayerOp(currentPageId, id, patch));
        ids.push(id);
      }
      if (ops.length > 0) onOps(LABEL_MOVE, ops, transformMergeKey(ids));
    } else {
      const node = nodes.current.get(layer.id);
      if (node) emitMove(layerById.get(layer.id) ?? layer, node);
    }
    // A second finger turned this drag into a two-finger gesture: keep the undo step open,
    // the two-finger gesture closes it when the fingers lift.
    if (!stoppingForTwoFingers.current) onGestureEnd();
  };

  // ---------- resize / rotate (Transformer) ----------
  const finishTransform = () => {
    const tr = trRef.current;
    if (!tr) return;
    const ops: Op[] = [];
    const ids: Id[] = [];
    for (const node of tr.nodes()) {
      const id = node.id();
      const layer = layerById.get(id);
      if (!layer) continue;
      let patch = patchFromTransform(layer, {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
      });
      // ZUNVA stores real sizes: put scale back to 1 before the new width/height arrive as props.
      node.scale({ x: 1, y: 1 });
      if (layer.type === 'text') {
        const next = { ...layer, ...patch } as TextLayer;
        patch = { ...patch, height: measureTextHeight(next, next.text) };
      }
      patch = changedFields(layer, patch);
      if (isEmptyPatch(patch)) continue;
      ops.push(updateLayerOp(currentPageId, id, patch));
      ids.push(id);
    }
    if (ops.length > 0) onOps(LABEL_TRANSFORM, ops, transformMergeKey(ids));
    onGestureEnd();
  };

  // The rotate handles do not follow a side-stretch live: hide them until it ends.
  const onTransformStart = () => {
    handlesRef.current?.hide();
  };

  // Konva fires transformend once per attached node: handle them together, once.
  const onTransformEnd = () => {
    handlesRef.current?.show();
    if (transformPending.current) return;
    transformPending.current = true;
    queueMicrotask(() => {
      transformPending.current = false;
      finishTransform();
    });
  };

  // ---------- pinch zoom and mouse-wheel zoom ----------
  const touchPoint = (t: Touch) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    return { x: t.clientX - (rect?.left ?? 0), y: t.clientY - (rect?.top ?? 0) };
  };

  /** The one layer two fingers act on: exactly one selected, unlocked, visible layer. */
  const gestureLayer = (): Layer | null => {
    if (readonly || editingRef.current || movableSelection.length !== 1) return null;
    const id = movableSelection[0];
    return id ? (layerById.get(id) ?? null) : null;
  };

  const emitTwoFinger = (base: Layer, now: FingerPair, start: FingerPair) => {
    let patch = twoFingerPatch(base, start, now);
    if (base.type === 'text') {
      const next = { ...base, ...patch } as TextLayer;
      patch = { ...patch, height: measureTextHeight(next, next.text) };
    }
    const current = layerById.get(base.id) ?? base;
    patch = changedFields(current, patch);
    // Same key as a one-finger drag of this layer: drag → second finger → lift = ONE undo step.
    if (!isEmptyPatch(patch)) onOps(LABEL_TRANSFORM, [updateLayerOp(currentPageId, base.id, patch)], dragMergeKey(base.id));
  };

  const onTouchMove = (e: AnyEvent) => {
    const touches = (e.evt as TouchEvent).touches;
    const stage = stageRef.current;
    const t1 = touches?.[0];
    const t2 = touches?.[1];
    if (!stage || !t1 || !t2 || rotating.current) return;
    e.evt.preventDefault();
    tapDown.current = null;
    const p1 = touchPoint(t1);
    const p2 = touchPoint(t2);

    // Stop one-finger drags (their last move is reported). Checked on every move: the second
    // finger's touch-down can start a new Konva drag after the gesture began.
    stoppingForTwoFingers.current = true;
    try {
      nodes.current.forEach((n) => {
        if (n.isDragging()) n.stopDrag();
      });
      if (stage.isDragging()) stage.stopDrag();
      const tr = trRef.current;
      if (tr?.isTransforming()) tr.stopTransform();
    } finally {
      stoppingForTwoFingers.current = false;
    }

    const gesture = twoFinger.current;
    if (!gesture) {
      const layer = gestureLayer();
      const node = layer ? nodes.current.get(layer.id) : undefined;
      if (layer && node) {
        // The node may be a few pixels ahead of the props (drag frame not drawn yet).
        const base = { ...layer, x: node.x(), y: node.y() } as Layer;
        twoFinger.current = {
          kind: 'layer',
          layer: base,
          start: [screenToPage(view.current, p1), screenToPage(view.current, p2)],
        };
      } else {
        twoFinger.current = {
          kind: 'page',
          start: { view: { ...view.current }, center: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }, distance: Math.hypot(p1.x - p2.x, p1.y - p2.y) },
        };
      }
      return;
    }

    if (gesture.kind === 'page') {
      const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      const distance = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      applyView(pinchView(gesture.start, center, distance, zoomLimits(fitScale.current)));
      return;
    }

    const now: FingerPair = [screenToPage(view.current, p1), screenToPage(view.current, p2)];
    scheduleDragEmit(() => emitTwoFinger(gesture.layer, now, gesture.start));
  };

  const onTouchEnd = (e: AnyEvent) => {
    const touches = (e.evt as TouchEvent).touches;
    if (touches && touches.length >= 2) return;
    const gesture = twoFinger.current;
    if (!gesture) return;
    twoFinger.current = null;
    if (gesture.kind === 'layer') flushDragEmit();
    // Also closes a one-finger drag that the second finger interrupted.
    onGestureEnd();
  };

  // ---------- corner handles: rotate around the centre (F4) ----------
  const clientToPage = (clientX: number, clientY: number): Point => {
    const rect = wrapRef.current?.getBoundingClientRect();
    return screenToPage(view.current, { x: clientX - (rect?.left ?? 0), y: clientY - (rect?.top ?? 0) });
  };

  const stopKonvaEvent = (e: AnyEvent) => {
    // Keep the stage from starting a page drag under the handle.
    e.cancelBubble = true;
  };

  const startRotate = (layer: Layer, e: KonvaEventObject<PointerEvent>) => {
    e.cancelBubble = true;
    if (readonly || editingRef.current || rotating.current || twoFinger.current) return;
    const evt = e.evt;
    const node = nodes.current.get(layer.id);
    const base = node ? ({ ...layer, x: node.x(), y: node.y() } as Layer) : layer;
    const pointerId = evt.pointerId;
    tapDown.current = null;

    const onMove = (ev: PointerEvent) => {
      const g = rotating.current;
      if (!g || ev.pointerId !== g.pointerId) return;
      ev.preventDefault();
      const point = clientToPage(ev.clientX, ev.clientY);
      scheduleDragEmit(() => {
        const l = live.current;
        const current = l.layerById.get(g.layer.id) ?? g.layer;
        const patch = changedFields(current, rotateAroundCenter(g.layer, g.start, point));
        if (!isEmptyPatch(patch)) l.onOps(LABEL_ROTATE, [updateLayerOp(l.pageId, g.layer.id, patch)], transformMergeKey([g.layer.id]));
      });
    };
    const onUp = (ev: PointerEvent) => {
      const g = rotating.current;
      if (!g || ev.pointerId !== g.pointerId) return;
      g.cleanup();
      flushDragEmit();
      live.current.onGestureEnd();
    };
    const cleanup = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      rotating.current = null;
    };
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    rotating.current = { pointerId, layer: base, start: clientToPage(evt.clientX, evt.clientY), cleanup };
  };

  const onWheel = (e: KonvaEventObject<WheelEvent>) => {
    const stage = stageRef.current;
    const p = stage?.getPointerPosition();
    if (!stage || !p) return;
    e.evt.preventDefault();
    const current = view.current;
    const limits = zoomLimits(fitScale.current);
    applyView(zoomAt(current, p, clamp(current.scale * (e.evt.deltaY > 0 ? 1 / 1.1 : 1.1), limits.min, limits.max)));
  };

  const onStageDragEnd = (e: AnyEvent) => {
    const stage = stageRef.current;
    if (stage && e.target === stage) view.current = { scale: stage.scaleX(), x: stage.x(), y: stage.y() };
  };

  // ---------- edit text in place (HTML textarea over the canvas → native keyboard, Telex/VNI) ----------
  /**
   * Opens the HTML text box. `sync` = called straight from a finger event: the box is mounted and
   * focused inside that event, so Android shows the keyboard. Returns false if the layer is not drawn yet.
   */
  const startEdit = (layer: TextLayer, sync = false): boolean => {
    if (readonly || layer.locked || layer.hidden || editingRef.current) return false;
    const node = nodes.current.get(layer.id);
    if (!node) return false;
    flushDragEmit();
    tapDown.current = null;
    const pos = node.getAbsolutePosition();
    const scale = node.getAbsoluteScale().x;
    const style: CSSProperties = {
      ...TEXTAREA_BASE,
      left: pos.x,
      top: pos.y,
      width: Math.max(24, layer.width * scale),
      minHeight: Math.max(24, node.height() * scale),
      fontSize: layer.fontSize * scale,
      fontFamily: cssFontFamily(layer.fontFamily),
      fontWeight: layer.fontWeight,
      fontStyle: layer.italic ? 'italic' : 'normal',
      lineHeight: layer.lineHeight,
      letterSpacing: layer.letterSpacing * scale,
      color: layer.color,
      textAlign: layer.align,
      opacity: layer.opacity,
      transform: `rotate(${node.getAbsoluteRotation()}deg)`,
    };
    node.hide();
    node.getLayer()?.batchDraw();
    const next: Editing = { id: layer.id, value: layer.text, style };
    editingRef.current = next;
    editOpenedAt.current = Date.now();
    if (sync) flushSync(() => setEditing(next));
    else setEditing(next);
    onTextEditing?.(layer.id);
    return true;
  };

  // startTextEdit(id) from the app: the new layer is usually drawn a frame or two later, so retry.
  const startEditRef = useRef(startEdit);
  startEditRef.current = startEdit;

  const tryPendingEdit = useCallback(() => {
    const pending = pendingEdit.current;
    if (!pending) return;
    cancelAnimationFrame(pending.raf);
    const layer = live.current.layerById.get(pending.id);
    if (layer && layer.type !== 'text') {
      pendingEdit.current = null;
      return;
    }
    if (layer && startEditRef.current(layer)) {
      pendingEdit.current = null;
      return;
    }
    if (pending.frames <= 0 || editingRef.current) {
      pendingEdit.current = null;
      return;
    }
    pending.frames -= 1;
    pending.raf = requestAnimationFrame(tryPendingEdit);
  }, []);

  const startTextEdit = useCallback(
    (layerId: Id) => {
      if (pendingEdit.current) cancelAnimationFrame(pendingEdit.current.raf);
      pendingEdit.current = { id: layerId, frames: PENDING_EDIT_FRAMES, raf: 0 };
      tryPendingEdit();
    },
    [tryPendingEdit],
  );

  useEffect(() => {
    tryPendingEdit();
  }, [layerById, tryPendingEdit]);

  // ---------- one tap on the already-selected text layer → edit (F1) ----------
  const onStagePointerDownTap = (e: KonvaEventObject<PointerEvent>) => {
    const evt = e.evt;
    tapDown.current = null;
    if (readonly || editingRef.current || !evt.isPrimary || twoFinger.current || rotating.current) return;
    const id = e.target.id();
    const layer = id ? layerById.get(id) : undefined;
    if (!layer || layer.type !== 'text' || layer.locked) return;
    // Only when this text was ALREADY the single selection before the finger went down.
    if (!(selection.length === 1 && selection[0] === id)) return;
    tapDown.current = { id, x: evt.clientX, y: evt.clientY, time: evt.timeStamp };
  };

  const onStagePointerUpTap = (e: KonvaEventObject<PointerEvent>) => {
    const down = tapDown.current;
    tapDown.current = null;
    const evt = e.evt;
    if (!down || twoFinger.current) return;
    if (!isTap(down, { x: evt.clientX, y: evt.clientY, time: evt.timeStamp })) return;
    const layer = layerById.get(down.id);
    if (layer?.type === 'text') startEdit(layer, true);
  };

  const finishEdit = () => {
    const current = editingRef.current;
    if (!current) return;
    editingRef.current = null;
    const node = nodes.current.get(current.id);
    node?.show();
    node?.getLayer()?.batchDraw();
    setEditing(null);
    onTextEditing?.(null);
    const layer = layerById.get(current.id);
    if (layer && layer.type === 'text' && layer.text !== current.value) {
      const patch = changedFields(layer, roundPatch({ text: current.value, height: measureTextHeight(layer, current.value) }));
      if (!isEmptyPatch(patch)) onOps(LABEL_EDIT_TEXT, [updateLayerOp(currentPageId, current.id, patch)]);
    }
  };

  const onStagePointerDown = () => {
    // The same tap that opened the box can still deliver a late "finger down" to the canvas.
    if (editingRef.current && Date.now() - editOpenedAt.current > EDIT_OPEN_GUARD_MS) finishEdit();
  };

  const onEditorChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
    setEditing((cur) => (cur ? { ...cur, value } : cur));
  };

  const onEditorKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    // Enter makes a new line (default). Escape finishes.
    if (e.key === 'Escape') finishEdit();
  };

  // ---------- export exactly the page frame ----------
  const exportPageImage = useCallback(
    async (pixelRatio: number): Promise<Blob> => {
      if (!Number.isFinite(pixelRatio) || pixelRatio <= 0) throw new RangeError('pixelRatio phải là số > 0');
      if (Math.max(pageWidth, pageHeight) * pixelRatio > MAX_EXPORT_SIDE) {
        throw new RangeError('Ảnh xuất quá lớn. Hãy chọn tỉ lệ nhỏ hơn.');
      }
      await fontsReady();
      const urls: string[] = [];
      for (const l of layers) {
        if (l.type !== 'image') continue;
        const url = assetUrl(l.assetId);
        if (url) urls.push(url);
      }
      const bgId = page?.background.imageAssetId;
      const bgUrl = bgId ? assetUrl(bgId) : undefined;
      if (bgUrl) urls.push(bgUrl);
      await images.whenLoaded(urls);
      // Let React draw the images that just finished loading.
      await nextFrame();
      await nextFrame();

      const stage = stageRef.current;
      const layer = pageLayerRef.current;
      if (!stage || !layer) throw new Error('Trang chưa sẵn sàng để xuất ảnh.');
      const scale = stage.scaleX();
      const editingNode = editingRef.current ? nodes.current.get(editingRef.current.id) : undefined;
      const bg = bgRef.current;
      editingNode?.show();
      bg?.strokeEnabled(false);
      try {
        const canvas = layer.toCanvas({
          x: stage.x(),
          y: stage.y(),
          width: pageWidth * scale,
          height: pageHeight * scale,
          pixelRatio: pixelRatio / scale,
        });
        return await canvasToBlob(canvas);
      } finally {
        if (editingRef.current) editingNode?.hide();
        bg?.strokeEnabled(true);
        layer.batchDraw();
      }
    },
    [pageWidth, pageHeight, layers, page, assetUrl, images],
  );

  useImperativeHandle(ref, () => ({ fitToScreen, exportPageImage, startTextEdit }), [fitToScreen, exportPageImage, startTextEdit]);

  // ---------- drawing ----------
  const common = (layer: Layer) => ({
    ref: register(layer.id),
    id: layer.id,
    x: layer.x,
    y: layer.y,
    rotation: layer.rotation,
    opacity: layer.opacity,
    visible: !layer.hidden,
    listening: !layer.hidden && !readonly,
    draggable: !readonly && !layer.locked && !editing,
    onClick: (e: AnyEvent) => select(layer.id, e),
    onTap: (e: AnyEvent) => select(layer.id, e),
    onDragStart: () => onDragStart(layer),
    onDragMove: () => onDragMove(layer),
    onDragEnd: () => onDragEnd(layer),
    onTransformStart,
    onTransformEnd,
  });

  const drawText = (layer: TextLayer) => (
    <Text
      // Remount when fonts finish loading so Konva re-measures with the real font.
      key={`${layer.id}:${fontsTick}`}
      {...common(layer)}
      text={layer.text}
      fontFamily={layer.fontFamily}
      fontSize={layer.fontSize}
      fontStyle={konvaFontStyle(layer)}
      fill={layer.color}
      width={layer.width}
      align={layer.align}
      lineHeight={layer.lineHeight}
      letterSpacing={layer.letterSpacing}
      wrap="word"
      perfectDrawEnabled={false}
      onDblClick={() => startEdit(layer, true)}
      onDblTap={() => startEdit(layer, true)}
    />
  );

  const drawShape = (layer: ShapeLayer) => {
    // A transparent fill keeps the inside tappable when the shape has no fill.
    const fill = layer.fill ?? 'rgba(0,0,0,0)';
    const stroke = layer.stroke && layer.strokeWidth > 0 ? { stroke: layer.stroke, strokeWidth: layer.strokeWidth } : { strokeEnabled: false };
    switch (layer.shape) {
      case 'rect':
        return (
          <Rect key={layer.id} {...common(layer)} width={layer.width} height={layer.height} fill={fill} cornerRadius={layer.cornerRadius} {...stroke} perfectDrawEnabled={false} />
        );
      case 'ellipse':
        // Offset so (x, y) stays the top-left corner, like every other layer.
        return (
          <Ellipse
            key={layer.id}
            {...common(layer)}
            radiusX={layer.width / 2}
            radiusY={layer.height / 2}
            offsetX={-layer.width / 2}
            offsetY={-layer.height / 2}
            fill={fill}
            {...stroke}
            perfectDrawEnabled={false}
          />
        );
      case 'line': {
        const width = layer.strokeWidth > 0 ? layer.strokeWidth : 4;
        return (
          <Line
            key={layer.id}
            {...common(layer)}
            points={[0, layer.height / 2, layer.width, layer.height / 2]}
            stroke={layer.stroke ?? layer.fill ?? '#0d1422'}
            strokeWidth={width}
            hitStrokeWidth={Math.max(24, width)}
            lineCap="round"
            perfectDrawEnabled={false}
          />
        );
      }
    }
  };

  const drawImage = (layer: ImageLayer) => {
    const image = images.get(assetUrl(layer.assetId));
    const crop = image ? cropToSource(layer.crop, { width: image.naturalWidth, height: image.naturalHeight }) : null;
    return (
      <Group key={layer.id} {...common(layer)}>
        {image ? (
          <KImage
            image={image}
            width={layer.width}
            height={layer.height}
            cornerRadius={layer.cornerRadius}
            {...(crop ? { crop } : {})}
            x={layer.flipX ? layer.width : 0}
            y={layer.flipY ? layer.height : 0}
            scaleX={layer.flipX ? -1 : 1}
            scaleY={layer.flipY ? -1 : 1}
            perfectDrawEnabled={false}
          />
        ) : (
          <Rect width={layer.width} height={layer.height} fill={PLACEHOLDER_FILL} cornerRadius={layer.cornerRadius} perfectDrawEnabled={false} />
        )}
      </Group>
    );
  };

  const drawLayer = (layer: Layer) => {
    switch (layer.type) {
      case 'text':
        return drawText(layer);
      case 'shape':
        return drawShape(layer);
      case 'image':
        return drawImage(layer);
    }
  };

  const bgAssetId = page?.background.imageAssetId ?? null;
  const bgImage = bgAssetId ? images.get(assetUrl(bgAssetId)) : null;

  // Corner rotate handles: only for exactly one selected, movable layer.
  const rotateTargetId = !readonly && !editing && movableSelection.length === 1 ? movableSelection[0] : undefined;
  const rotateTarget = rotateTargetId ? layerById.get(rotateTargetId) : undefined;
  const handleScale = 1 / view.current.scale;

  return (
    <div ref={wrapRef} style={WRAP_STYLE} aria-label="Trang thiết kế">
      <Stage
        ref={stageRef}
        width={box.width}
        height={box.height}
        draggable={!editing}
        onClick={onStageTap}
        onTap={onStageTap}
        onMouseDown={onStagePointerDown}
        onTouchStart={onStagePointerDown}
        onPointerDown={onStagePointerDownTap}
        onPointerUp={onStagePointerUpTap}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onWheel={onWheel}
        onDragEnd={onStageDragEnd}
      >
        <KLayer ref={pageLayerRef}>
          {page && (
            <>
              <Rect
                ref={bgRef}
                name="page-bg"
                width={page.width}
                height={page.height}
                fill={page.background.color}
                stroke="#c9d1dc"
                strokeWidth={1}
                strokeScaleEnabled={false}
                perfectDrawEnabled={false}
              />
              {bgImage && (
                <KImage
                  image={bgImage}
                  width={page.width}
                  height={page.height}
                  crop={coverCrop({ width: bgImage.naturalWidth, height: bgImage.naturalHeight }, { width: page.width, height: page.height })}
                  opacity={page.background.imageOpacity}
                  listening={false}
                  perfectDrawEnabled={false}
                />
              )}
              <Group clipX={0} clipY={0} clipWidth={page.width} clipHeight={page.height}>
                {layers.map(drawLayer)}
              </Group>
            </>
          )}
        </KLayer>
        <KLayer>
          <Transformer
            ref={trRef}
            visible={!readonly}
            flipEnabled={false}
            ignoreStroke
            // No round rotate handle above the box: the corner handles rotate (F4).
            rotateEnabled={false}
            padding={4}
            anchorSize={ANCHOR_SIZE}
            anchorCornerRadius={ANCHOR_SIZE / 2}
            anchorFill="#ffffff"
            anchorStroke={ACCENT}
            borderStroke={ACCENT}
            anchorStyleFunc={styleAnchor}
            boundBoxFunc={(oldBox, newBox) => (Math.abs(newBox.width) < 8 || Math.abs(newBox.height) < 8 ? oldBox : newBox)}
          />
          {rotateTarget && (
            <Group ref={handlesRef}>
              {layerCorners(rotateTarget).map((p, i) => (
                <Group
                  key={i}
                  x={p.x}
                  y={p.y}
                  scaleX={handleScale}
                  scaleY={handleScale}
                  onPointerDown={(e: KonvaEventObject<PointerEvent>) => startRotate(rotateTarget, e)}
                  onMouseDown={stopKonvaEvent}
                  onTouchStart={stopKonvaEvent}
                  onClick={stopKonvaEvent}
                  onTap={stopKonvaEvent}
                >
                  <RotateIcon />
                </Group>
              ))}
            </Group>
          )}
        </KLayer>
      </Stage>

      {editing && (
        <>
          <textarea
            style={editing.style}
            value={editing.value}
            aria-label="Sửa chữ"
            autoFocus
            spellCheck={false}
            onChange={onEditorChange}
            onBlur={finishEdit}
            onKeyDown={onEditorKeyDown}
          />
          <button type="button" style={DONE_STYLE} onPointerDown={(e) => e.preventDefault()} onClick={finishEdit}>
            Xong
          </button>
        </>
      )}
    </div>
  );
}
