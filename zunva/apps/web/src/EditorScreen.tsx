import type { DesignDocument, Id } from '@zunva/core';
import type { ProjectStore } from '@zunva/platform';
import { useEffect, useState } from 'react';

type State = { kind: 'loading' } | { kind: 'ready'; doc: DesignDocument } | { kind: 'error'; message: string };

/**
 * Màn hình chỉnh sửa — BẢN TẠM (G2 C3). Mở đúng dự án, hiện khổ trang và nút quay lại.
 * C4 thay phần thân bằng thanh công cụ + DesignCanvas của Kiro (`@zunva/editor-canvas`).
 */
export function EditorScreen({ store, projectId, onBack }: { store: ProjectStore; projectId: Id; onBack(): void }) {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let alive = true;
    void store.load(projectId).then((r) => {
      if (alive) setState(r.ok ? { kind: 'ready', doc: r.value } : { kind: 'error', message: r.error });
    });
    return () => {
      alive = false;
    };
  }, [store, projectId]);

  const page = state.kind === 'ready' ? state.doc.pages[0] : undefined;

  return (
    <div className="editor">
      <header className="editor-bar">
        <button type="button" onClick={onBack} aria-label="Quay lại trang chủ">
          ← Quay lại
        </button>
        <h1 className="editor-title">{state.kind === 'ready' ? state.doc.name : 'Đang mở…'}</h1>
      </header>

      {state.kind === 'error' && (
        <p className="notice" role="alert">
          {state.message}
        </p>
      )}

      {page && (
        <div className="editor-stage">
          <div
            className="page-preview"
            style={{ aspectRatio: `${page.width} / ${page.height}`, background: page.background.color }}
            aria-label={`Trang ${page.width}×${page.height}`}
            role="img"
          />
          <p className="muted small">
            Khổ {page.width}×{page.height} · {page.layers.length} lớp. Công cụ chỉnh sửa (chữ, ảnh, hình) đang được làm trong G2.
          </p>
        </div>
      )}
    </div>
  );
}
