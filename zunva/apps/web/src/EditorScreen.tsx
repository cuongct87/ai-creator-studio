import {
  BLEND_MODES,
  canRedo,
  canUndo,
  closeMerge,
  createHistory,
  execute,
  pruneUnusedAssets,
  redo,
  undo,
  undoLabel,
  type Asset,
  type BlendMode,
  type HistoryState,
  type Id,
  type Layer,
  type LayerPatch,
  type Op,
  type TextAlign,
} from '@zunva/core';
import { DesignCanvas, FONT_FAMILIES, type BrushSettings, type DesignCanvasHandle } from '@zunva/editor-canvas';
import { createAutosave, detectImageType, type AutosaveStatus, type Platform, type ProjectStore } from '@zunva/platform';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useConfirm } from './ConfirmDialog';
import { pngToJpeg, type RenderPage } from './export-actions';
import { ExportSheet } from './ExportSheet';
import { imageSize, newId } from './create-project';
import {
  addImageOps,
  addShapeOps,
  addTextOps,
  coverPagePatch,
  arrangeOps,
  duplicateOps,
  layerLabel,
  removeOps,
  setBackgroundColorOps,
  SWATCHES,
  type Arrange,
  type ShapeKind,
} from './editor-actions';

type Panel = 'none' | 'shapes' | 'background' | 'layers';

const SAVE_TEXT: Record<AutosaveStatus, string> = {
  idle: 'Đã lưu',
  pending: 'Chưa lưu…',
  saving: 'Đang lưu…',
  saved: 'Đã lưu',
  error: 'Lỗi lưu',
};

/** Ảnh thu nhỏ cho "Tiếp tục thiết kế": cạnh dài 240 px, lưu trong kho với khóa `thumb_<id>`. */
export const thumbAssetId = (projectId: Id) => `thumb_${projectId}`;
const THUMB_SIDE = 240;

interface EditorProps {
  store: ProjectStore;
  platform: Platform;
  projectId: Id;
  onBack(): void;
}

/** Màn hình chỉnh sửa (G2 C4 + C6): canvas Konva của Kiro + thanh công cụ, bảng thuộc tính, lớp, lịch sử, tự lưu. */
export function EditorScreen({ store, platform, projectId, onBack }: EditorProps) {
  const [hist, setHist] = useState<HistoryState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selection, setSelection] = useState<Id[]>([]);
  const [textEditing, setTextEditing] = useState<Id | null>(null);
  /** Chế độ Tẩy (G2b) cho một lớp ảnh; null = chỉnh sửa bình thường. */
  const [brush, setBrush] = useState<BrushSettings | null>(null);
  const [exporting, setExporting] = useState(false);
  const [panel, setPanel] = useState<Panel>('none');
  const [urls, setUrls] = useState<Record<Id, string>>({});
  const [saveStatus, setSaveStatus] = useState<AutosaveStatus>('idle');
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<DesignCanvasHandle>(null);
  const urlsRef = useRef(urls);
  urlsRef.current = urls;
  const [dialog, ask] = useConfirm();
  const histRef = useRef<HistoryState | null>(null);
  histRef.current = hist;

  // ---------- ảnh thu nhỏ: làm lại sau mỗi lần lưu (tối đa 1 lần / 3 giây) ----------
  const thumbTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const makeThumb = useCallback(() => {
    if (thumbTimer.current) return;
    thumbTimer.current = setTimeout(() => {
      thumbTimer.current = null;
      const canvas = canvasRef.current;
      const page = histRef.current?.doc.pages[0];
      if (!canvas || !page) return;
      void canvas
        .exportPageImage(THUMB_SIDE / Math.max(page.width, page.height))
        .then((blob) => blob.arrayBuffer())
        .then((buf) => store.putAsset(thumbAssetId(projectId), 'image/png', new Uint8Array(buf)))
        .catch(() => undefined); // ảnh thu nhỏ chỉ để đẹp, lỗi thì bỏ qua
    }, 3000);
  }, [store, projectId]);

  const autosave = useMemo(
    () =>
      createAutosave(store, 800, {
        onState: (s) => {
          setSaveStatus(s.status);
          if (s.status === 'saved') makeThumb();
        },
      }),
    [store, makeThumb],
  );

  // ---------- mở dự án ----------
  useEffect(() => {
    let alive = true;
    void store.load(projectId).then(async (r) => {
      if (!alive) return;
      if (!r.ok) return setLoadError(r.error);
      // Bỏ mặt nạ của các nét tẩy cũ (lịch sử hoàn tác không lưu lại), rồi dọn ảnh không dự án nào dùng.
      const doc = pruneUnusedAssets(r.value);
      setHist(createHistory(doc));
      if (doc !== r.value) await store.save(doc);
      void store.collectUnusedAssets();
    });
    return () => {
      alive = false;
    };
  }, [store, projectId]);

  // ---------- tự lưu mỗi khi tài liệu đổi (bỏ qua lần mở đầu) ----------
  useEffect(() => {
    if (hist && hist.version > 0) autosave.schedule(hist.doc);
  }, [hist, autosave]);

  useEffect(
    () => () => {
      void autosave.dispose();
      if (thumbTimer.current) clearTimeout(thumbTimer.current);
      for (const url of Object.values(urlsRef.current)) URL.revokeObjectURL(url);
    },
    [autosave],
  );

  // ---------- URL của ảnh trong kho ----------
  const doc = hist?.doc ?? null;
  const page = doc?.pages[0] ?? null;
  useEffect(() => {
    if (!doc) return;
    const wanted = new Set(Object.keys(doc.assets));
    for (const p of doc.pages) if (p.background.imageAssetId) wanted.add(p.background.imageAssetId);
    for (const id of wanted) {
      if (urlsRef.current[id]) continue;
      void store.getAsset(id).then((r) => {
        if (!r.ok || urlsRef.current[id]) return;
        const url = URL.createObjectURL(new Blob([r.value.bytes.slice()], { type: r.value.mimeType }));
        setUrls((prev) => ({ ...prev, [id]: url }));
      });
    }
  }, [doc, store]);
  const assetUrl = useCallback((id: Id) => urls[id], [urls]);

  // ---------- lịch sử ----------
  const apply = useCallback((label: string, ops: Op[], mergeKey?: string) => {
    if (ops.length === 0) return;
    setHist((h) => {
      if (!h) return h;
      try {
        return execute(h, label, ops, mergeKey ? { mergeKey } : {});
      } catch (e) {
        setMessage(`Không làm được: ${e instanceof Error ? e.message : 'lỗi không rõ'}`);
        return h;
      }
    });
  }, []);
  const endGesture = useCallback(() => setHist((h) => (h ? closeMerge(h) : h)), []);

  const layers = page?.layers ?? [];
  const brushRef = useRef(brush);
  brushRef.current = brush;
  // Lớp đang tẩy bị xóa / hoàn tác mất → thoát chế độ tẩy.
  useEffect(() => {
    if (brush && !layers.some((l) => l.id === brush.layerId && l.type === 'image')) setBrush(null);
  }, [brush, layers]);
  const selected = useMemo(() => selection.filter((id) => layers.some((l) => l.id === id)), [selection, layers]);
  const single: Layer | null = selected.length === 1 ? (layers.find((l) => l.id === selected[0]) ?? null) : null;

  const patch = (layer: Layer, set: LayerPatch, label: string, mergeKey?: string) =>
    page && apply(label, [{ op: 'updateLayer', pageId: page.id, layerId: layer.id, set }], mergeKey);

  // ---------- thêm ảnh từ máy ----------
  async function pickAsset(): Promise<Asset | null> {
    const picked = await platform.images.pickImage();
    if (!picked.ok) {
      setMessage(picked.error);
      return null;
    }
    if (!picked.value) return null;
    const mimeType = detectImageType(picked.value.bytes) ?? picked.value.mimeType;
    const dims = await imageSize(picked.value.bytes, mimeType);
    if (!dims) {
      setMessage('Máy không đọc được ảnh này. Hãy thử ảnh JPG hoặc PNG khác.');
      return null;
    }
    const id = newId('img');
    const put = await store.putAsset(id, mimeType, picked.value.bytes);
    if (!put.ok) {
      setMessage(put.error);
      return null;
    }
    const url = URL.createObjectURL(new Blob([picked.value.bytes.slice()], { type: mimeType }));
    setUrls((prev) => ({ ...prev, [id]: url }));
    return { id, kind: 'image', mimeType, name: picked.value.name, hash: null, width: dims.width, height: dims.height };
  }

  async function withBusy(task: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      await task();
    } finally {
      setBusy(false);
    }
  }

  const addImage = () =>
    withBusy(async () => {
      if (!page) return;
      const asset = await pickAsset();
      if (!asset) return;
      const { ops, layerId } = addImageOps(page, asset, newId, false);
      apply('Thêm ảnh', ops);
      setSelection([layerId]);
    });

  const replaceImage = (layer: Layer) =>
    withBusy(async () => {
      if (!page || layer.type !== 'image') return;
      const asset = await pickAsset();
      if (!asset) return;
      apply('Thay ảnh', [
        { op: 'addAsset', asset },
        { op: 'updateLayer', pageId: page.id, layerId: layer.id, set: { assetId: asset.id, crop: null } },
      ]);
    });

  /** Lưu ảnh mặt nạ mới vào kho rồi gắn cho lớp ảnh: 1 bước hoàn tác (Tách nền, mỗi nét Tẩy). */
  async function putMask(layer: Layer, bytes: Uint8Array, label: string): Promise<void> {
    if (!page || layer.type !== 'image') return;
    const dims = await imageSize(bytes, 'image/png');
    if (!dims) {
      setMessage('Không đọc được vùng tẩy. Hãy thử lại.');
      return;
    }
    const id = newId('mask');
    const put = await store.putAsset(id, 'image/png', bytes);
    if (!put.ok) {
      setMessage(put.error);
      return;
    }
    const url = URL.createObjectURL(new Blob([bytes.slice()], { type: 'image/png' }));
    setUrls((prev) => ({ ...prev, [id]: url }));
    apply(label, [
      { op: 'addAsset', asset: { id, kind: 'image', mimeType: 'image/png', name: null, hash: null, width: dims.width, height: dims.height } },
      { op: 'updateLayer', pageId: page.id, layerId: layer.id, set: { maskAssetId: id } },
    ]);
  }

  /** Vẽ một trang ra ảnh để xuất (tạm: trang đang mở, qua màn vẽ; đợt K1 sẽ vẽ được mọi trang). */
  const renderPage: RenderPage = async (pageId, mimeType, pixelRatio) => {
    const canvas = canvasRef.current;
    if (!canvas || !page) throw new Error('Trang chưa sẵn sàng, hãy thử lại.');
    if (pageId !== page.id) throw new Error('Hiện chỉ xuất được trang đang mở.');
    const png = await canvas.exportPageImage(pixelRatio);
    return mimeType === 'image/jpeg' ? pngToJpeg(png) : png;
  };

  const segmentSubject = (layer: Layer) =>
    withBusy(async () => {
      const segmenter = platform.subject;
      if (!segmenter || layer.type !== 'image') return;
      setMessage('Đang tách nền…');
      const source = await store.getAsset(layer.assetId);
      if (!source.ok) {
        setMessage(source.error);
        return;
      }
      const result = await segmenter.segment(source.value.bytes);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      if (result.value === null) {
        setMessage('Không tìm thấy người hay vật chính trong ảnh này. Bạn có thể dùng Tẩy để tự xóa nền.');
        return;
      }
      await putMask(layer, result.value, 'Tách nền');
      setMessage(null);
    });

  const setBackgroundImage = () =>
    withBusy(async () => {
      if (!page) return;
      const asset = await pickAsset();
      if (!asset) return;
      apply('Ảnh nền', [
        { op: 'addAsset', asset },
        { op: 'updatePage', pageId: page.id, set: { background: { ...page.background, imageAssetId: asset.id } } },
      ]);
    });

  const back = () =>
    void withBusy(async () => {
      const saved = await autosave.flush();
      if (saved && !saved.ok) {
        const leave = await ask(`Chưa lưu được thay đổi: ${saved.error} Vẫn thoát?`, { confirmLabel: 'Thoát', danger: true });
        if (!leave) return;
      }
      onBack();
    });

  const removeSelected = async () => {
    if (!page || selected.length === 0) return;
    const ok = await ask(selected.length > 1 ? `Xóa ${selected.length} lớp đã chọn?` : `Xóa "${single ? layerLabel(single) : 'lớp'}"?`, {
      confirmLabel: 'Xóa',
      danger: true,
    });
    if (!ok) return;
    apply('Xóa lớp', removeOps(page, selected));
    setSelection([]);
  };

  // ---------- giao diện ----------
  if (loadError) {
    return (
      <div className="editor">
        <header className="editor-bar">
          <button type="button" onClick={onBack} aria-label="Quay lại trang chủ">
            ←
          </button>
          <h1 className="editor-title">Không mở được</h1>
        </header>
        <p className="notice" role="alert">
          {loadError}
        </p>
      </div>
    );
  }

  if (!hist || !doc || !page) {
    return (
      <div className="editor">
        <header className="editor-bar">
          <h1 className="editor-title">Đang mở…</h1>
        </header>
      </div>
    );
  }

  return (
    <div className="editor">
      <header className="editor-bar">
        <button type="button" onClick={back} aria-label="Quay lại trang chủ" disabled={busy}>
          ←
        </button>
        <div className="editor-heading">
          <h1 className="editor-title">{doc.name}</h1>
          <span className="muted small" aria-live="polite">
            {SAVE_TEXT[saveStatus]}
          </span>
        </div>
        <button
          type="button"
          aria-label={`Hoàn tác${undoLabel(hist) ? `: ${undoLabel(hist)}` : ''}`}
          disabled={!canUndo(hist)}
          onClick={() => setHist((h) => (h ? undo(h) : h))}
        >
          ↶
        </button>
        <button type="button" aria-label="Làm lại" disabled={!canRedo(hist)} onClick={() => setHist((h) => (h ? redo(h) : h))}>
          ↷
        </button>
        <button type="button" aria-label="Vừa màn hình" onClick={() => canvasRef.current?.fitToScreen()}>
          ⤢
        </button>
        <button type="button" className="primary" onClick={() => setExporting(true)}>
          Xuất
        </button>
      </header>

      <div className="editor-canvas" aria-label={`Trang ${page.width}×${page.height}, ${layers.length} lớp`} role="region">
        <DesignCanvas
          ref={canvasRef}
          document={doc}
          pageId={page.id}
          selection={selected}
          onSelect={(ids) => {
            setSelection(ids);
            if (ids.length > 0) setPanel('none');
          }}
          onOps={apply}
          onGestureEnd={endGesture}
          assetUrl={assetUrl}
          onTextEditing={setTextEditing}
          brush={brush}
          onMaskStroke={(layerId, png) => {
            const layer = histRef.current?.doc.pages[0]?.layers.find((l) => l.id === layerId);
            if (layer) void putMask(layer, png, brushRef.current?.mode === 'restore' ? 'Khôi phục' : 'Tẩy');
          }}
        />
      </div>

      {message && (
        <p className="notice editor-message" role="alert">
          {message}
        </p>
      )}

      {textEditing === null && brush !== null && (
        <div className="editor-panel">
          <EraserPanel value={brush} onChange={setBrush} onDone={() => setBrush(null)} />
        </div>
      )}
      {textEditing === null && brush === null && (
        <div className="editor-panel">
          {selected.length === 0 ? (
            <>
              {panel === 'shapes' && (
                <ShapesPanel
                  onPick={(shape) => {
                    const { ops, layerId } = addShapeOps(page, shape, newId);
                    apply('Thêm hình', ops);
                    setSelection([layerId]);
                    setPanel('none');
                  }}
                />
              )}
              {panel === 'background' && (
                <Section title="Nền trang">
                  <Swatches
                    value={page.background.color}
                    onPick={(c) => apply('Màu nền', setBackgroundColorOps(page, c), 'bg-color')}
                    onDone={endGesture}
                    label="Màu nền"
                  />
                  <div className="row">
                    <button type="button" disabled={busy} onClick={() => void setBackgroundImage()}>
                      Chọn ảnh nền
                    </button>
                    {page.background.imageAssetId && (
                      <button
                        type="button"
                        onClick={() =>
                          apply('Bỏ ảnh nền', [
                            { op: 'updatePage', pageId: page.id, set: { background: { ...page.background, imageAssetId: null } } },
                          ])
                        }
                      >
                        Bỏ ảnh nền
                      </button>
                    )}
                  </div>
                </Section>
              )}
              {panel === 'layers' && (
                <LayersPanel layers={layers} onSelect={(id) => setSelection([id])} />
              )}
              <nav className="toolbar" aria-label="Thêm vào trang">
                <ToolButton
                  icon="T"
                  label="Chữ"
                  onClick={() => {
                    const { ops, layerId } = addTextOps(page, newId, '#10263b');
                    apply('Thêm chữ', ops);
                    setSelection([layerId]);
                    setPanel('none');
                    // Mở ô gõ + bàn phím ngay, không phải chạm thêm (founder thử 12/11).
                    canvasRef.current?.startTextEdit(layerId);
                  }}
                />
                <ToolButton icon="▣" label="Ảnh" disabled={busy} onClick={() => void addImage()} />
                <ToolButton icon="◯" label="Hình" active={panel === 'shapes'} onClick={() => setPanel(panel === 'shapes' ? 'none' : 'shapes')} />
                <ToolButton icon="▦" label="Nền" active={panel === 'background'} onClick={() => setPanel(panel === 'background' ? 'none' : 'background')} />
                <ToolButton icon="≡" label="Lớp" active={panel === 'layers'} onClick={() => setPanel(panel === 'layers' ? 'none' : 'layers')} />
              </nav>
            </>
          ) : (
            <LayerProperties
              layers={layers}
              selected={selected}
              single={single}
              busy={busy}
              onPatch={(layer, set, label, key) => patch(layer, set, label, key)}
              onDone={endGesture}
              onArrange={(how) => single && apply('Đổi thứ tự lớp', arrangeOps(page, single.id, how))}
              onDuplicate={() => {
                const { ops, newIds } = duplicateOps(page, selected, newId);
                apply('Nhân đôi', ops);
                setSelection(newIds);
              }}
              onRemove={() => void removeSelected()}
              onReplaceImage={(layer) => void replaceImage(layer)}
              onCoverPage={(layer) => patch(layer, coverPagePatch(layer, page.width, page.height), 'Phủ kín trang')}
              onSegment={platform.subject ? (layer) => void segmentSubject(layer) : null}
              onErase={(layer) => setBrush({ layerId: layer.id, mode: 'erase', size: 48, softness: 0.5 })}
              onClose={() => setSelection([])}
            />
          )}
        </div>
      )}
      {exporting && (
        <ExportSheet doc={doc} pageIds={doc.pages.map((p) => p.id)} render={renderPage} platform={platform} onClose={() => setExporting(false)} />
      )}
      {dialog}
    </div>
  );
}

// ---------- các mảnh giao diện nhỏ ----------

function ToolButton({ icon, label, onClick, disabled, active }: { icon: string; label: string; onClick(): void; disabled?: boolean; active?: boolean }) {
  return (
    <button type="button" className={active ? 'tool active' : 'tool'} disabled={disabled} onClick={onClick} aria-pressed={active}>
      <span className="tool-icon" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="panel-section" aria-label={title}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Swatches({ value, onPick, onDone, label }: { value: string | null; onPick(color: string): void; onDone(): void; label: string }) {
  return (
    <div className="swatches" role="group" aria-label={label}>
      {SWATCHES.map((c) => (
        <button
          key={c}
          type="button"
          className="swatch-btn"
          style={{ background: c }}
          aria-label={`${label} ${c}`}
          aria-pressed={value?.toLowerCase() === c}
          onClick={() => {
            onPick(c);
            onDone();
          }}
        />
      ))}
      <label className="swatch-btn custom" title="Màu khác">
        <span className="visually-hidden">{label} khác</span>
        <input
          type="color"
          value={value && /^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'}
          onChange={(e) => onPick(e.target.value)}
          onBlur={onDone}
        />
      </label>
    </div>
  );
}

function ShapesPanel({ onPick }: { onPick(shape: ShapeKind): void }) {
  return (
    <Section title="Thêm hình">
      <div className="row">
        <button type="button" onClick={() => onPick('rect')}>
          ▭ Hình chữ nhật
        </button>
        <button type="button" onClick={() => onPick('ellipse')}>
          ◯ Hình tròn
        </button>
        <button type="button" onClick={() => onPick('line')}>
          ─ Đường kẻ
        </button>
      </div>
    </Section>
  );
}

function LayersPanel({ layers, onSelect }: { layers: readonly Layer[]; onSelect(id: Id): void }) {
  return (
    <Section title="Các lớp (trên cùng ở đầu)">
      {layers.length === 0 ? (
        <p className="muted small">Trang chưa có gì. Thêm chữ, ảnh hoặc hình ở thanh bên dưới.</p>
      ) : (
        <ul className="layer-list" aria-label="Danh sách lớp">
          {[...layers].reverse().map((l) => (
            <li key={l.id}>
              <button type="button" onClick={() => onSelect(l.id)}>
                {l.locked ? '🔒 ' : ''}
                {layerLabel(l)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

interface PropsPanel {
  layers: readonly Layer[];
  selected: readonly Id[];
  single: Layer | null;
  busy: boolean;
  onPatch(layer: Layer, set: LayerPatch, label: string, mergeKey?: string): void;
  onDone(): void;
  onArrange(how: Arrange): void;
  onDuplicate(): void;
  onRemove(): void;
  onReplaceImage(layer: Layer): void;
  onCoverPage(layer: Layer): void;
  /** Có khi nền tảng tách nền được (Android). */
  onSegment: ((layer: Layer) => void) | null;
  onErase(layer: Layer): void;
  onClose(): void;
}

function LayerProperties({ layers, selected, single, busy, onPatch, onDone, onArrange, onDuplicate, onRemove, onReplaceImage, onCoverPage, onSegment, onErase, onClose }: PropsPanel) {
  const index = single ? layers.findIndex((l) => l.id === single.id) : -1;
  return (
    <div className="props">
      <div className="props-head">
        <strong>{single ? layerLabel(single) : `${selected.length} lớp đã chọn`}</strong>
        <button type="button" onClick={onClose} aria-label="Bỏ chọn">
          Xong
        </button>
      </div>

      {single?.type === 'text' && <TextProps layer={single} onPatch={onPatch} onDone={onDone} />}
      {single?.type === 'shape' && (
        <Section title="Màu tô">
          <Swatches value={single.fill} onPick={(c) => onPatch(single, { fill: c }, 'Màu hình', `fill:${single.id}`)} onDone={onDone} label="Màu tô" />
        </Section>
      )}
      {single?.type === 'image' && (
        <Section title="Ảnh">
          <div className="row">
            <button type="button" disabled={busy} onClick={() => onReplaceImage(single)}>
              Thay ảnh
            </button>
            <button type="button" onClick={() => onCoverPage(single)}>
              Phủ kín trang
            </button>
            <button type="button" onClick={() => onPatch(single, { flipX: !single.flipX }, 'Lật ảnh')}>
              Lật ngang
            </button>
            <button type="button" onClick={() => onPatch(single, { flipY: !single.flipY }, 'Lật ảnh')}>
              Lật dọc
            </button>
          </div>
          <Slider
            label="Bo góc"
            value={single.cornerRadius}
            min={0}
            max={Math.round(Math.min(single.width, single.height) / 2)}
            onChange={(v) => onPatch(single, { cornerRadius: v }, 'Bo góc', `radius:${single.id}`)}
            onDone={onDone}
          />
          <Slider
            label="Mờ viền"
            value={Math.round(single.feather)}
            min={0}
            max={Math.round(Math.min(single.width, single.height) / 2)}
            onChange={(v) => onPatch(single, { feather: v }, 'Mờ viền', `feather:${single.id}`)}
            onDone={onDone}
          />
          <div className="row">
            <button type="button" onClick={() => onErase(single)}>
              Tẩy
            </button>
            {onSegment && (
              <button type="button" disabled={busy} onClick={() => onSegment(single)}>
                Tách nền
              </button>
            )}
            {single.maskAssetId !== null && (
              <button type="button" onClick={() => onPatch(single, { maskAssetId: null }, 'Bỏ hết vùng tẩy')}>
                Bỏ hết vùng tẩy
              </button>
            )}
          </div>
        </Section>
      )}

      {single && (
        <Slider
          label="Độ rõ"
          value={Math.round(single.opacity * 100)}
          min={5}
          max={100}
          suffix="%"
          onChange={(v) => onPatch(single, { opacity: v / 100 }, 'Độ rõ', `opacity:${single.id}`)}
          onDone={onDone}
        />
      )}
      {single && (
        <label className="field">
          <span>Hòa trộn</span>
          <select value={single.blendMode} onChange={(e) => onPatch(single, { blendMode: e.target.value as BlendMode }, 'Hòa trộn')}>
            {BLEND_MODES.map((m) => (
              <option key={m} value={m}>
                {BLEND_LABELS[m]}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="row props-actions">
        {single && (
          <>
            <button type="button" disabled={index === layers.length - 1} onClick={() => onArrange('up')} aria-label="Đưa lên trên">
              ↑ Lên
            </button>
            <button type="button" disabled={index === 0} onClick={() => onArrange('down')} aria-label="Đưa xuống dưới">
              ↓ Xuống
            </button>
            <button type="button" onClick={() => onPatch(single, { locked: !single.locked }, single.locked ? 'Mở khóa' : 'Khóa')}>
              {single.locked ? 'Mở khóa' : 'Khóa'}
            </button>
          </>
        )}
        <button type="button" onClick={onDuplicate}>
          Nhân đôi
        </button>
        <button type="button" className="danger" onClick={onRemove}>
          Xóa
        </button>
      </div>
    </div>
  );
}

function TextProps({ layer, onPatch, onDone }: { layer: Extract<Layer, { type: 'text' }>; onPatch: PropsPanel['onPatch']; onDone(): void }) {
  const ALIGNS: Array<[TextAlign, string]> = [
    ['left', 'Trái'],
    ['center', 'Giữa'],
    ['right', 'Phải'],
  ];
  return (
    <>
      <label className="field">
        <span>Nội dung (hoặc chạm 1 lần vào chữ đang chọn trên trang để gõ)</span>
        <textarea
          value={layer.text}
          rows={2}
          onChange={(e) => onPatch(layer, { text: e.target.value }, 'Sửa chữ', `text:${layer.id}`)}
          onBlur={onDone}
        />
      </label>
      <label className="field">
        <span>Phông chữ</span>
        <select value={layer.fontFamily} onChange={(e) => onPatch(layer, { fontFamily: e.target.value }, 'Đổi phông')}>
          {FONT_FAMILIES.map((f) => (
            <option key={f.id} value={f.id} style={{ fontFamily: f.id }}>
              {f.label}
            </option>
          ))}
        </select>
      </label>
      <div className="row">
        <button type="button" aria-label="Chữ nhỏ hơn" onClick={() => onPatch(layer, { fontSize: Math.max(8, Math.round(layer.fontSize * 0.9)) }, 'Cỡ chữ')}>
          A−
        </button>
        <span className="font-size" aria-label="Cỡ chữ">
          {Math.round(layer.fontSize)}
        </span>
        <button type="button" aria-label="Chữ to hơn" onClick={() => onPatch(layer, { fontSize: Math.min(2000, Math.round(layer.fontSize * 1.1) + 1) }, 'Cỡ chữ')}>
          A+
        </button>
        <button type="button" aria-pressed={layer.fontWeight >= 600} onClick={() => onPatch(layer, { fontWeight: layer.fontWeight >= 600 ? 400 : 700 }, 'Chữ đậm')}>
          <b>Đậm</b>
        </button>
        <button type="button" aria-pressed={layer.italic} onClick={() => onPatch(layer, { italic: !layer.italic }, 'Chữ nghiêng')}>
          <i>Nghiêng</i>
        </button>
      </div>
      <div className="row" role="group" aria-label="Canh lề">
        {ALIGNS.map(([a, label]) => (
          <button key={a} type="button" aria-pressed={layer.align === a} onClick={() => onPatch(layer, { align: a }, 'Canh lề')}>
            {label}
          </button>
        ))}
      </div>
      <Section title="Màu chữ">
        <Swatches value={layer.color} onPick={(c) => onPatch(layer, { color: c }, 'Màu chữ', `color:${layer.id}`)} onDone={onDone} label="Màu chữ" />
      </Section>
    </>
  );
}

/** Thanh công cụ chế độ Tẩy: 1 ngón tô lên ảnh, 2 ngón phóng to trang. */
function EraserPanel({ value, onChange, onDone }: { value: BrushSettings; onChange(next: BrushSettings): void; onDone(): void }) {
  return (
    <div className="props" aria-label="Chế độ tẩy">
      <div className="props-head">
        <strong>Tẩy ảnh</strong>
        <button type="button" onClick={onDone}>
          Xong
        </button>
      </div>
      <p className="muted small">Dùng 1 ngón tô lên ảnh. Dùng 2 ngón để phóng to chỗ nhỏ.</p>
      <div className="row" role="group" aria-label="Kiểu cọ">
        <button type="button" aria-pressed={value.mode === 'erase'} onClick={() => onChange({ ...value, mode: 'erase' })}>
          Tẩy
        </button>
        <button type="button" aria-pressed={value.mode === 'restore'} onClick={() => onChange({ ...value, mode: 'restore' })}>
          Khôi phục
        </button>
      </div>
      <Slider label="Cỡ cọ" value={value.size} min={8} max={160} onChange={(v) => onChange({ ...value, size: v })} onDone={() => {}} />
      <Slider
        label="Độ mềm"
        value={Math.round(value.softness * 100)}
        min={0}
        max={100}
        suffix="%"
        onChange={(v) => onChange({ ...value, softness: v / 100 })}
        onDone={() => {}}
      />
    </div>
  );
}

/** Tên kiểu hòa trộn cho người dùng (G2b R1). */
const BLEND_LABELS: Record<BlendMode, string> = {
  normal: 'Thường',
  multiply: 'Nhân (tối đi)',
  screen: 'Sáng (screen)',
  overlay: 'Phủ (overlay)',
  'soft-light': 'Ánh mềm',
  darken: 'Tối hơn',
  lighten: 'Sáng hơn',
  difference: 'Khác biệt',
  color: 'Màu',
  luminosity: 'Độ sáng',
};

function Slider({
  label,
  value,
  min,
  max,
  suffix = '',
  onChange,
  onDone,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix?: string;
  onChange(v: number): void;
  onDone(): void;
}) {
  return (
    <label className="field slider">
      <span>
        {label}: {value}
        {suffix}
      </span>
      <input
        type="range"
        min={min}
        max={Math.max(min, max)}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={onDone}
        onKeyUp={onDone}
        onBlur={onDone}
      />
    </label>
  );
}
