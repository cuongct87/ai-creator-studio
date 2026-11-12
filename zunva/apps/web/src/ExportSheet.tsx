import type { DesignDocument, Id } from '@zunva/core';
import type { Platform } from '@zunva/platform';
import { useState } from 'react';
import { runExport, type ExportFormat, type ExportQuality, type ExportResult, type RenderPage } from './export-actions';

type Status =
  | { kind: 'idle' }
  | { kind: 'working'; done: number; total: number }
  | { kind: 'done'; result: ExportResult }
  | { kind: 'error'; message: string };

const FORMATS: Array<[ExportFormat, string, string]> = [
  ['png', 'Ảnh PNG', 'Rõ nét nhất'],
  ['jpg', 'Ảnh JPG', 'Nhẹ, gửi Zalo/Facebook'],
  ['pdf', 'PDF để in', 'Đúng khổ giấy'],
];

/** Bảng "Xuất" (G3 R1): chọn định dạng, chất lượng → lưu → Chia sẻ. */
export function ExportSheet({
  doc,
  pageIds,
  render,
  platform,
  onClose,
}: {
  doc: DesignDocument;
  pageIds: readonly Id[];
  render: RenderPage;
  platform: Platform;
  onClose(): void;
}) {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [quality, setQuality] = useState<ExportQuality>('normal');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const working = status.kind === 'working';

  async function start() {
    setStatus({ kind: 'working', done: 0, total: pageIds.length });
    try {
      const r = await runExport({
        doc,
        pageIds,
        format,
        quality,
        render,
        platform,
        onProgress: (done, total) => setStatus({ kind: 'working', done, total }),
      });
      setStatus(r.ok ? { kind: 'done', result: r.value } : { kind: 'error', message: r.error });
    } catch (e) {
      setStatus({ kind: 'error', message: e instanceof Error && e.message ? e.message : 'Không xuất được. Hãy thử lại.' });
    }
  }

  async function share(result: ExportResult) {
    const sharer = platform.share;
    if (!sharer) return;
    const r = await sharer.share(result.files);
    if (!r.ok) setStatus({ kind: 'error', message: r.error });
  }

  return (
    <div className="dialog-backdrop" onClick={() => !working && onClose()}>
      <div className="dialog export-sheet" role="dialog" aria-modal="true" aria-labelledby="export-title" onClick={(e) => e.stopPropagation()}>
        <p id="export-title">
          <strong>Xuất thiết kế</strong>
          {pageIds.length > 1 && <span className="muted small"> · {pageIds.length} trang</span>}
        </p>

        <div className="export-formats" role="group" aria-label="Định dạng">
          {FORMATS.map(([id, label, hint]) => (
            <button key={id} type="button" aria-pressed={format === id} disabled={working} onClick={() => setFormat(id)}>
              <span>{label}</span>
              <span className="muted small">{hint}</span>
            </button>
          ))}
        </div>

        {format !== 'pdf' && (
          <div className="row" role="group" aria-label="Chất lượng">
            <button type="button" aria-pressed={quality === 'normal'} disabled={working} onClick={() => setQuality('normal')}>
              Thường
            </button>
            <button type="button" aria-pressed={quality === 'high'} disabled={working} onClick={() => setQuality('high')}>
              Cao (gấp đôi)
            </button>
          </div>
        )}

        {status.kind === 'working' && (
          <p className="muted small" role="status">
            Đang xuất{status.total > 1 ? ` trang ${Math.min(status.done + 1, status.total)}/${status.total}` : ''}…
          </p>
        )}
        {status.kind === 'done' && (
          <p className="notice" role="status">
            {status.result.message}
          </p>
        )}
        {status.kind === 'error' && (
          <p className="notice" role="alert">
            {status.message}
          </p>
        )}

        <div className="row">
          {status.kind === 'done' && platform.share ? (
            <button type="button" className="primary" onClick={() => void share(status.result)}>
              Chia sẻ
            </button>
          ) : (
            <button type="button" className="primary" disabled={working} onClick={() => void start()}>
              {status.kind === 'done' ? 'Xuất lại' : 'Xuất'}
            </button>
          )}
          <button type="button" disabled={working} onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
