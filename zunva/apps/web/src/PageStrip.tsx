import type { DesignDocument, Id } from '@zunva/core';
import { usePageThumbnails } from '@zunva/editor-canvas';

/** Dải trang (G3 R3): ảnh thu nhỏ từng trang, chạm để mở; nút thêm / nhân đôi / xóa / đổi chỗ. */
export function PageStrip({
  doc,
  currentId,
  assetUrl,
  onOpen,
  onAdd,
  onDuplicate,
  onRemove,
  onMove,
}: {
  doc: DesignDocument;
  currentId: Id;
  assetUrl(id: Id): string | undefined;
  onOpen(id: Id): void;
  onAdd(): void;
  onDuplicate(): void;
  onRemove(): void;
  onMove(step: -1 | 1): void;
}) {
  const thumbs = usePageThumbnails(doc, assetUrl, 120);
  const index = doc.pages.findIndex((p) => p.id === currentId);
  const total = doc.pages.length;
  return (
    <section className="page-strip" aria-label="Các trang">
      <ul className="page-thumbs" aria-label="Danh sách trang">
        {doc.pages.map((p, i) => (
          <li key={p.id}>
            <button
              type="button"
              className="page-thumb"
              aria-label={`Trang ${i + 1}`}
              aria-current={p.id === currentId ? 'page' : undefined}
              onClick={() => onOpen(p.id)}
              style={{ aspectRatio: `${p.width} / ${p.height}` }}
            >
              {thumbs[p.id] ? <img src={thumbs[p.id]} alt="" /> : <span aria-hidden="true">{i + 1}</span>}
            </button>
          </li>
        ))}
      </ul>
      <div className="row page-actions">
        <button type="button" onClick={onAdd}>
          + Trang
        </button>
        <button type="button" onClick={onDuplicate}>
          Nhân đôi trang
        </button>
        <button type="button" aria-label="Đưa trang lên trước" disabled={index <= 0} onClick={() => onMove(-1)}>
          ←
        </button>
        <button type="button" aria-label="Đưa trang ra sau" disabled={index >= total - 1} onClick={() => onMove(1)}>
          →
        </button>
        <button type="button" className="danger" disabled={total <= 1} onClick={onRemove}>
          Xóa trang
        </button>
      </div>
    </section>
  );
}
