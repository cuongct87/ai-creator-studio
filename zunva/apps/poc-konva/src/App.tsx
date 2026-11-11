import Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { type CSSProperties, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Circle, Group, Image as KImage, Layer, Rect, Stage, Star, Text, Transformer } from 'react-konva';
import { loadFonts } from './fonts';
import { useFps } from './fps';
import {
  buildScene,
  type Crop,
  type GroupItem,
  type ImageItem,
  type Item,
  type LeafItem,
  makePhotos,
  PAGE_LARGE,
  PAGE_SMALL,
  type PageSize,
  type Photos,
  type TextItem,
} from './scene';

// Let a second finger start a pinch while the first finger is already dragging.
Konva.hitOnDragEnabled = true;

type AnyEvent = KonvaEventObject<Event>;

interface Snapshot {
  page: PageSize;
  items: Item[];
}

interface Editing {
  id: string;
  value: string;
  style: CSSProperties;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const countLeaves = (items: Item[]) => items.reduce((n, it) => n + (it.type === 'group' ? it.children.length : 1), 0);

export function App() {
  const [status, setStatus] = useState<string>('loading');
  const photos = useRef<Photos | null>(null);

  useEffect(() => {
    let alive = true;
    loadFonts()
      .then(() => {
        photos.current = photos.current ?? makePhotos();
        if (alive) setStatus('ok');
      })
      .catch((err: unknown) => {
        if (alive) setStatus(err instanceof Error ? err.message : String(err));
      });
    return () => {
      alive = false;
    };
  }, []);

  if (status === 'loading') return <p className="message">Đang tải phông tiếng Việt…</p>;
  if (status !== 'ok' || !photos.current) return <p className="message">Lỗi: {status}</p>;
  return <Editor photos={photos.current} />;
}

function Editor({ photos }: { photos: Photos }) {
  const [page, setPage] = useState<PageSize>(PAGE_SMALL);
  const [items, setItems] = useState<Item[]>(() => buildScene(PAGE_SMALL));
  const [selected, setSelected] = useState<string[]>([]);
  const [multi, setMulti] = useState(false);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [cropId, setCropId] = useState<string | null>(null);
  const [history, setHistory] = useState({ past: 0, future: 0 });
  const [exportInfo, setExportInfo] = useState('');
  const [box, setBox] = useState({ width: 360, height: 500 });

  const past = useRef<Snapshot[]>([]);
  const future = useRef<Snapshot[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const cropRectRef = useRef<Konva.Rect>(null);
  const cropTrRef = useRef<Konva.Transformer>(null);
  const nodes = useRef(new Map<string, Konva.Node>());
  const fitScale = useRef(1);
  const pinch = useRef<{ dist: number; center: { x: number; y: number }; scale: number; pos: { x: number; y: number } } | null>(null);
  const editingRef = useRef<Editing | null>(null);
  const { stats, setInteracting, reset } = useFps();

  editingRef.current = editing;

  // ---------- history (POC: snapshot of the whole page; the real app uses commands from @zunva/core) ----------
  const commit = useCallback(
    (nextItems: Item[], nextPage: PageSize = page) => {
      past.current.push({ page, items });
      if (past.current.length > 50) past.current.shift();
      future.current = [];
      setItems(nextItems);
      setPage(nextPage);
      setHistory({ past: past.current.length, future: 0 });
    },
    [items, page],
  );

  const restore = (from: Snapshot[], to: Snapshot[]) => {
    const snap = from.pop();
    if (!snap) return;
    to.push({ page, items });
    setItems(snap.items);
    setPage(snap.page);
    setSelected([]);
    setCropId(null);
    setHistory({ past: past.current.length, future: future.current.length });
  };
  const undo = () => restore(past.current, future.current);
  const redo = () => restore(future.current, past.current);

  // ---------- stage size and fitting the page ----------
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setBox({ width: Math.floor(entry.contentRect.width), height: Math.floor(entry.contentRect.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fit = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const s = Math.min(box.width / page.width, box.height / page.height) * 0.92;
    fitScale.current = s;
    stage.scale({ x: s, y: s });
    stage.position({ x: (box.width - page.width * s) / 2, y: (box.height - page.height * s) / 2 });
    stage.batchDraw();
  }, [box.width, box.height, page.width, page.height]);

  useEffect(() => {
    fit();
  }, [fit]);

  // ---------- selection + transformer ----------
  const register = (id: string) => (node: Konva.Node | null) => {
    if (node) nodes.current.set(id, node);
    else nodes.current.delete(id);
  };

  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;
    const list = cropId || editing ? [] : selected.map((id) => nodes.current.get(id)).filter((n): n is Konva.Node => !!n);
    tr.nodes(list);
    tr.getLayer()?.batchDraw();
  }, [selected, items, cropId, editing]);

  const onSelect = (id: string, e: AnyEvent) => {
    if (cropId || editingRef.current) return;
    e.cancelBubble = true;
    const additive = multi || ('shiftKey' in e.evt && (e.evt as MouseEvent).shiftKey);
    setSelected((cur) => (additive ? (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]) : [id]));
  };

  const onStageClick = (e: AnyEvent) => {
    if (cropId) return;
    if (e.target === e.target.getStage() || e.target.name() === 'page-bg') setSelected([]);
  };

  /** Copies position/rotation/scale from Konva nodes into state after a drag or transform. */
  const syncFromNodes = (ids: string[]) => {
    let changed = false;
    const next = items.map((it): Item => {
      if (!ids.includes(it.id)) return it;
      const n = nodes.current.get(it.id);
      if (!n) return it;
      changed = true;
      if (it.type === 'text') {
        // Text keeps scale 1: resizing changes the wrap width and font size instead.
        const sx = n.scaleX();
        const sy = n.scaleY();
        n.scale({ x: 1, y: 1 });
        return { ...it, x: n.x(), y: n.y(), rotation: n.rotation(), width: Math.max(40, it.width * sx), fontSize: Math.max(8, it.fontSize * sy), scaleX: 1, scaleY: 1 };
      }
      return { ...it, x: n.x(), y: n.y(), rotation: n.rotation(), scaleX: n.scaleX(), scaleY: n.scaleY() };
    });
    if (changed) commit(next);
  };

  const handlers = (it: Item) => ({
    draggable: !cropId && !editing,
    onClick: (e: AnyEvent) => onSelect(it.id, e),
    onTap: (e: AnyEvent) => onSelect(it.id, e),
    onDragStart: () => setInteracting(true),
    onDragEnd: () => {
      setInteracting(false);
      syncFromNodes(selected.includes(it.id) ? selected : [it.id]);
    },
    onTransformStart: () => setInteracting(true),
    onTransformEnd: () => {
      setInteracting(false);
      syncFromNodes(selected.length ? selected : [it.id]);
    },
  });

  // ---------- pinch zoom (two fingers) and wheel zoom (desktop) ----------
  const zoomLimits = () => [fitScale.current * 0.5, fitScale.current * 8] as const;

  const touchPoint = (t: Touch) => {
    const r = wrapRef.current?.getBoundingClientRect();
    return { x: t.clientX - (r?.left ?? 0), y: t.clientY - (r?.top ?? 0) };
  };

  const onTouchMove = (e: AnyEvent) => {
    const touches = (e.evt as TouchEvent).touches;
    const stage = stageRef.current;
    const t1 = touches?.[0];
    const t2 = touches?.[1];
    if (!stage || !t1 || !t2) return;
    e.evt.preventDefault();
    nodes.current.forEach((n) => {
      if (n.isDragging()) n.stopDrag();
    });
    if (stage.isDragging()) stage.stopDrag();
    const p1 = touchPoint(t1);
    const p2 = touchPoint(t2);
    const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
    if (!pinch.current) {
      pinch.current = { dist, center, scale: stage.scaleX(), pos: stage.position() };
      setInteracting(true);
      return;
    }
    const start = pinch.current;
    const [min, max] = zoomLimits();
    const scale = clamp((start.scale * dist) / Math.max(1, start.dist), min, max);
    const pagePoint = { x: (start.center.x - start.pos.x) / start.scale, y: (start.center.y - start.pos.y) / start.scale };
    stage.scale({ x: scale, y: scale });
    stage.position({ x: center.x - pagePoint.x * scale, y: center.y - pagePoint.y * scale });
    stage.batchDraw();
  };

  const onTouchEnd = () => {
    if (!pinch.current) return;
    pinch.current = null;
    setInteracting(false);
  };

  const onWheel = (e: AnyEvent) => {
    const ev = e.evt as WheelEvent;
    const stage = stageRef.current;
    const p = stage?.getPointerPosition();
    if (!stage || !p) return;
    ev.preventDefault();
    const old = stage.scaleX();
    const [min, max] = zoomLimits();
    const scale = clamp(old * (ev.deltaY > 0 ? 1 / 1.1 : 1.1), min, max);
    const pt = { x: (p.x - stage.x()) / old, y: (p.y - stage.y()) / old };
    stage.scale({ x: scale, y: scale });
    stage.position({ x: p.x - pt.x * scale, y: p.y - pt.y * scale });
    stage.batchDraw();
  };

  // ---------- inline text editing (textarea over the canvas, so the phone keyboard/IME works natively) ----------
  const startEdit = (item: TextItem) => {
    if (cropId || editingRef.current) return;
    const node = nodes.current.get(item.id);
    if (!node) return;
    const pos = node.getAbsolutePosition();
    const scale = node.getAbsoluteScale().x;
    node.hide();
    node.getLayer()?.batchDraw();
    setSelected([]);
    setEditing({
      id: item.id,
      value: item.text,
      style: {
        left: pos.x,
        top: pos.y,
        width: item.width * scale,
        minHeight: node.height() * scale + 8,
        fontSize: item.fontSize * scale,
        fontFamily: `"${item.fontFamily}"`,
        fontWeight: item.fontStyle === 'bold' ? 700 : 400,
        lineHeight: item.lineHeight,
        color: item.fill,
        textAlign: item.align,
        transform: `rotate(${node.getAbsoluteRotation()}deg)`,
      },
    });
  };

  const finishEdit = () => {
    const current = editingRef.current;
    if (!current) return;
    editingRef.current = null;
    const node = nodes.current.get(current.id);
    node?.show();
    setEditing(null);
    const item = items.find((it) => it.id === current.id);
    if (item && item.type === 'text' && item.text !== current.value) {
      commit(items.map((it) => (it.id === current.id && it.type === 'text' ? { ...it, text: current.value } : it)));
    } else {
      node?.getLayer()?.batchDraw();
    }
    setSelected([current.id]);
  };

  // ---------- crop ----------
  const cropItem = items.find((it): it is ImageItem => it.id === cropId && it.type === 'image');

  useEffect(() => {
    const tr = cropTrRef.current;
    const rect = cropRectRef.current;
    if (!tr || !rect) return;
    tr.nodes([rect]);
    tr.getLayer()?.batchDraw();
  }, [cropId]);

  const applyCrop = () => {
    const rect = cropRectRef.current;
    const img = cropItem ? nodes.current.get(cropItem.id) : undefined;
    if (!cropItem || !rect || !img) return setCropId(null);
    const x1 = clamp(rect.x(), 0, cropItem.width);
    const y1 = clamp(rect.y(), 0, cropItem.height);
    const x2 = clamp(rect.x() + rect.width() * rect.scaleX(), 0, cropItem.width);
    const y2 = clamp(rect.y() + rect.height() * rect.scaleY(), 0, cropItem.height);
    const w = x2 - x1;
    const h = y2 - y1;
    if (w < 10 || h < 10) return setCropId(null);
    // Map the crop box (image-local units) to source pixels of the photo.
    const kx = cropItem.crop.width / cropItem.width;
    const ky = cropItem.crop.height / cropItem.height;
    const crop: Crop = { x: cropItem.crop.x + x1 * kx, y: cropItem.crop.y + y1 * ky, width: w * kx, height: h * ky };
    const origin = img.getTransform().point({ x: x1, y: y1 });
    commit(items.map((it) => (it.id === cropItem.id ? { ...cropItem, x: origin.x, y: origin.y, width: w, height: h, crop } : it)));
    setCropId(null);
    setSelected([cropItem.id]);
  };

  // ---------- group / ungroup ----------
  const selectedItems = items.filter((it) => selected.includes(it.id));
  const canGroup = selectedItems.length >= 2 && selectedItems.every((it) => it.type !== 'group');
  const selectedGroup = selectedItems.length === 1 && selectedItems[0]?.type === 'group' ? selectedItems[0] : undefined;
  const selectedImage = selectedItems.length === 1 && selectedItems[0]?.type === 'image' ? selectedItems[0] : undefined;

  const group = () => {
    const chosen = selectedItems.filter((it): it is LeafItem => it.type !== 'group');
    if (chosen.length < 2) return;
    const id = 'group-' + Date.now().toString(36);
    const g: GroupItem = { id, type: 'group', x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, children: chosen };
    const lastIndex = Math.max(...selected.map((sid) => items.findIndex((it) => it.id === sid)));
    const insertAt = items.slice(0, lastIndex).filter((it) => !selected.includes(it.id)).length;
    const rest = items.filter((it) => !selected.includes(it.id));
    rest.splice(insertAt, 0, g);
    commit(rest);
    setSelected([id]);
    setMulti(false);
  };

  const ungroup = () => {
    const g = selectedGroup;
    const gNode = g ? nodes.current.get(g.id) : undefined;
    if (!g || g.type !== 'group' || !gNode) return;
    const gT = gNode.getTransform();
    const children = g.children.map((child): LeafItem => {
      const cNode = nodes.current.get(child.id);
      if (!cNode) return child;
      const d = gT.copy().multiply(cNode.getTransform()).decompose();
      if (child.type === 'text') {
        return { ...child, x: d.x, y: d.y, rotation: d.rotation, width: child.width * d.scaleX, fontSize: child.fontSize * d.scaleY, scaleX: 1, scaleY: 1 };
      }
      return { ...child, x: d.x, y: d.y, rotation: d.rotation, scaleX: d.scaleX, scaleY: d.scaleY };
    });
    const next = [...items];
    next.splice(items.indexOf(g), 1, ...children);
    commit(next);
    setSelected(children.map((c) => c.id));
  };

  // ---------- page size + export ----------
  const switchPage = () => {
    const next = page.width === PAGE_SMALL.width ? PAGE_LARGE : PAGE_SMALL;
    setSelected([]);
    setCropId(null);
    commit(buildScene(next), next);
    reset();
  };

  const exportPng = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const t0 = performance.now();
    const tr = trRef.current;
    tr?.hide();
    const s = stage.scaleX();
    let canvas: HTMLCanvasElement;
    try {
      canvas = stage.toCanvas({ x: stage.x(), y: stage.y(), width: page.width * s, height: page.height * s, pixelRatio: 1 / s });
    } finally {
      tr?.show();
      stage.batchDraw();
    }
    canvas.toBlob((blob) => {
      if (!blob) return setExportInfo('Xuất PNG thất bại');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zunva-poc-${page.width}x${page.height}.png`;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setExportInfo(`PNG ${canvas.width}×${canvas.height} · ${(blob.size / 1024 / 1024).toFixed(1)} MB · ${Math.round(performance.now() - t0)} ms`);
    }, 'image/png');
  };

  // ---------- rendering ----------
  const leaf = (it: LeafItem, top: boolean) => {
    const base = { ref: register(it.id), x: it.x, y: it.y, rotation: it.rotation, scaleX: it.scaleX, scaleY: it.scaleY, perfectDrawEnabled: false };
    const h = top ? handlers(it) : {};
    switch (it.type) {
      case 'text':
        return (
          <Text
            key={it.id}
            {...base}
            {...h}
            text={it.text}
            fontFamily={it.fontFamily}
            fontSize={it.fontSize}
            fontStyle={it.fontStyle}
            fill={it.fill}
            width={it.width}
            align={it.align}
            lineHeight={it.lineHeight}
            onDblClick={() => top && startEdit(it)}
            onDblTap={() => top && startEdit(it)}
          />
        );
      case 'image':
        return <KImage key={it.id} {...base} {...h} image={photos[it.src]} width={it.width} height={it.height} crop={it.crop} />;
      case 'rect':
        return <Rect key={it.id} {...base} {...h} width={it.width} height={it.height} fill={it.fill} cornerRadius={it.cornerRadius} />;
      case 'circle':
        return <Circle key={it.id} {...base} {...h} radius={it.width / 2} fill={it.fill} />;
      case 'star':
        return <Star key={it.id} {...base} {...h} numPoints={5} innerRadius={it.width / 4} outerRadius={it.width / 2} fill={it.fill} />;
    }
  };

  const renderItem = (it: Item) =>
    it.type === 'group' ? (
      <Group key={it.id} ref={register(it.id)} x={it.x} y={it.y} rotation={it.rotation} scaleX={it.scaleX} scaleY={it.scaleY} {...handlers(it)}>
        {it.children.map((c) => leaf(c, false))}
      </Group>
    ) : (
      leaf(it, true)
    );

  const interactingFps = stats.minWhileInteracting;

  return (
    <div className="poc">
      <div className="toolbar">
        <button type="button" onClick={switchPage}>
          Khổ {page.width === PAGE_SMALL.width ? '1080×1350 → 1748×2480' : '1748×2480 → 1080×1350'}
        </button>
        <button type="button" className={multi ? 'on' : ''} aria-pressed={multi} onClick={() => setMulti((m) => !m)}>
          Chọn nhiều
        </button>
        <button type="button" disabled={!canGroup} onClick={group}>
          Nhóm
        </button>
        <button type="button" disabled={!selectedGroup} onClick={ungroup}>
          Bỏ nhóm
        </button>
        {cropId ? (
          <>
            <button type="button" className="on" onClick={applyCrop}>
              Áp dụng cắt
            </button>
            <button type="button" onClick={() => setCropId(null)}>
              Hủy cắt
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={!selectedImage}
            onClick={() => {
              if (!selectedImage) return;
              setCropId(selectedImage.id);
              setSelected([]);
            }}
          >
            Cắt ảnh
          </button>
        )}
        <button type="button" disabled={!history.past} onClick={undo}>
          ↶ Hoàn tác
        </button>
        <button type="button" disabled={!history.future} onClick={redo}>
          ↷ Làm lại
        </button>
        <button type="button" onClick={fit}>
          Vừa màn hình
        </button>
        <button type="button" onClick={exportPng}>
          Xuất PNG
        </button>
        <button type="button" onClick={reset}>
          Đo lại FPS
        </button>
      </div>

      <div className="stats" aria-live="polite">
        <span>
          FPS: <strong>{stats.now}</strong>
        </span>
        <span>
          Khi kéo/xoay/chụm: thấp nhất{' '}
          <strong className={interactingFps === null ? '' : interactingFps >= 30 ? 'good' : 'bad'}>{interactingFps ?? '–'}</strong> · TB{' '}
          <strong>{stats.avgWhileInteracting ?? '–'}</strong>
        </span>
        <span>
          Trang {page.width}×{page.height} · {countLeaves(items)} vật · DPR {window.devicePixelRatio.toFixed(2)}
        </span>
        {exportInfo && <span>{exportInfo}</span>}
      </div>

      <div className="stage-wrap" ref={wrapRef}>
        <Stage
          ref={stageRef}
          width={box.width}
          height={box.height}
          draggable={!editing && !cropId}
          onClick={onStageClick}
          onTap={onStageClick}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onWheel={onWheel}
          onDragStart={(e: AnyEvent) => {
            if (e.target === stageRef.current) setInteracting(true);
          }}
          onDragEnd={(e: AnyEvent) => {
            if (e.target === stageRef.current) setInteracting(false);
          }}
        >
          <Layer>
            <Rect name="page-bg" width={page.width} height={page.height} fill="#ffffff" stroke="#c9d1dc" strokeWidth={2} perfectDrawEnabled={false} />
            <Group clipX={0} clipY={0} clipWidth={page.width} clipHeight={page.height}>
              {items.map(renderItem)}
            </Group>
            {cropItem && (
              <Group x={cropItem.x} y={cropItem.y} rotation={cropItem.rotation} scaleX={cropItem.scaleX} scaleY={cropItem.scaleY}>
                <Rect width={cropItem.width} height={cropItem.height} fill="rgba(0,0,0,0.35)" listening={false} />
                <Rect
                  ref={cropRectRef}
                  width={cropItem.width}
                  height={cropItem.height}
                  stroke="#4dabf7"
                  strokeWidth={3}
                  strokeScaleEnabled={false}
                  dash={[12, 8]}
                  fill="rgba(77,171,247,0.08)"
                  draggable
                />
                <Transformer ref={cropTrRef} rotateEnabled={false} keepRatio={false} flipEnabled={false} anchorSize={16} />
              </Group>
            )}
            <Transformer
              ref={trRef}
              flipEnabled={false}
              anchorSize={16}
              rotateAnchorOffset={36}
              padding={4}
              boundBoxFunc={(oldBox, newBox) => (Math.abs(newBox.width) < 12 || Math.abs(newBox.height) < 12 ? oldBox : newBox)}
            />
          </Layer>
        </Stage>

        {editing && (
          <>
            <textarea
              className="text-editor"
              style={editing.style}
              value={editing.value}
              autoFocus
              spellCheck={false}
              onChange={(e) => {
                const value = e.target.value;
                setEditing((cur) => (cur ? { ...cur, value } : cur));
              }}
              onBlur={finishEdit}
              onKeyDown={(e) => {
                if (e.key === 'Escape') finishEdit();
              }}
            />
            <button type="button" className="editor-done" onPointerDown={(e) => e.preventDefault()} onClick={finishEdit}>
              Xong
            </button>
          </>
        )}
      </div>
    </div>
  );
}
