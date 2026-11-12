import type { Id } from '@zunva/core';
import type { Platform, ProjectStore } from '@zunva/platform';
import { type ReactNode, useCallback, useMemo, useState } from 'react';
import { newId } from './create-project';
import { openTemplate, searchTemplates, TEMPLATE_KINDS } from './mau/dung-mau';
import { templateImageUrl, templateThumbUrl, type TemplateSpec } from './mau/kho-mau';

/** Đọc byte ảnh mẫu nằm sẵn trong app (web lẫn APK). */
async function fetchBytes(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

/** Chọn mẫu → tạo dự án bản sao → mở. Dùng chung cho tab Mẫu và trang chủ. */
export function useOpenTemplate(store: ProjectStore, platform: Platform, onOpen: (id: Id) => void) {
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const pick = useCallback(
    async (spec: TemplateSpec) => {
      if (busy) return;
      setBusy(spec.id);
      setMessage(null);
      try {
        const result = await openTemplate(store, spec, {
          newId,
          now: Date.now(),
          loadImage: fetchBytes,
          screen: platform.screenSize?.() ?? null,
        });
        if (result?.ok) onOpen(result.id);
        else if (result) setMessage(result.error);
      } finally {
        setBusy(null);
      }
    },
    [busy, store, platform, onOpen],
  );
  return { busy, message, pick };
}

interface GridProps {
  templates: readonly TemplateSpec[];
  busy: string | null;
  onPick(spec: TemplateSpec): void;
  /** Ô đứng đầu lưới (trang chủ: "Trang trắng"). */
  leading?: ReactNode;
}

/** Lưới ảnh thu nhỏ mẫu, 2 cột trên điện thoại. */
export function TemplateGrid({ templates, busy, onPick, leading }: GridProps) {
  // Chưa có ảnh thu nhỏ (đang dựng lại) thì hiện ảnh minh họa gốc.
  const [noThumb, setNoThumb] = useState<ReadonlySet<string>>(new Set());
  return (
    <ul className="template-grid" aria-label="Danh sách mẫu">
      {leading && <li>{leading}</li>}
      {templates.map((t) => (
        <li key={t.id}>
          <button type="button" className="template-card" disabled={busy !== null} aria-label={`Mẫu ${t.title}`} onClick={() => onPick(t)}>
            <span className="template-thumb">
              <img
                src={noThumb.has(t.id) ? templateImageUrl(t.id) : templateThumbUrl(t.id)}
                alt=""
                loading="lazy"
                onError={() => setNoThumb((prev) => (prev.has(t.id) ? prev : new Set(prev).add(t.id)))}
              />
              {busy === t.id && <span className="template-busy">Đang mở…</span>}
            </span>
            <span className="template-name">{t.title}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

interface TemplatesProps {
  store: ProjectStore;
  platform: Platform;
  onOpen(id: Id): void;
}

/** Tab "Mẫu" (G3 R2): lọc theo loại, ô tìm không dấu, chạm mẫu → dự án mới. */
export function Templates({ store, platform, onOpen }: TemplatesProps) {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<string | null>(null);
  const { busy, message, pick } = useOpenTemplate(store, platform, onOpen);
  const list = useMemo(() => searchTemplates(query, kind), [query, kind]);

  return (
    <div className="home templates">
      <h1>Mẫu</h1>
      <label className="search">
        <span className="visually-hidden">Tìm mẫu</span>
        <input type="search" value={query} placeholder="Tìm mẫu: thiệp cưới, cà phê…" onChange={(e) => setQuery(e.target.value)} enterKeyHint="search" />
      </label>

      <div className="chips" role="group" aria-label="Lọc theo loại">
        {[{ kind: null, label: 'Tất cả' }, ...TEMPLATE_KINDS].map((k) => (
          <button key={k.kind ?? 'all'} type="button" aria-pressed={kind === k.kind} onClick={() => setKind(k.kind)}>
            {k.label}
          </button>
        ))}
      </div>

      {message && (
        <p className="notice" role="alert">
          {message}
        </p>
      )}

      {list.length === 0 ? (
        <p className="muted small">Chưa có mẫu "{query.trim()}". Thử từ khác, hoặc tạo trang trắng ở Trang chủ.</p>
      ) : (
        <TemplateGrid templates={list} busy={busy} onPick={(t) => void pick(t)} />
      )}
    </div>
  );
}

interface PickerProps {
  store: ProjectStore;
  platform: Platform;
  kind: string;
  label: string;
  /** Kích thước trang trắng, hiện dưới ô "Trang trắng". */
  blankSize: string;
  blankDisabled: boolean;
  onBlank(): void;
  onClose(): void;
  onOpen(id: Id): void;
}

/** Trang chủ: bấm một loại → "Trang trắng" + các mẫu của loại đó. */
export function TemplatePicker({ store, platform, kind, label, blankSize, blankDisabled, onBlank, onClose, onOpen }: PickerProps) {
  const { busy, message, pick } = useOpenTemplate(store, platform, onOpen);
  const list = useMemo(() => searchTemplates('', kind), [kind]);
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet template-picker" role="dialog" aria-modal="true" aria-label={`Chọn mẫu ${label}`} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>{label}</h2>
          <button type="button" onClick={onClose}>
            Đóng
          </button>
        </div>
        {message && (
          <p className="notice" role="alert">
            {message}
          </p>
        )}
        <TemplateGrid
          templates={list}
          busy={busy}
          onPick={(t) => void pick(t)}
          leading={
            <button type="button" className="template-card" aria-label="Trang trắng" disabled={blankDisabled || busy !== null} onClick={onBlank}>
              <span className="template-thumb blank" aria-hidden="true">
                +
              </span>
              <span className="template-name">Trang trắng</span>
              <span className="muted small">{blankSize}</span>
            </button>
          }
        />
      </div>
    </div>
  );
}
