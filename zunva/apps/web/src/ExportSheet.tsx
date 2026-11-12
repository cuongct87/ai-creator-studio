import type { DesignDocument, Id } from '@zunva/core';
import type { Platform, WallpaperTarget } from '@zunva/platform';
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
  currentPageId,
  render,
  platform,
  onClose,
}: {
  doc: DesignDocument;
  pageIds: readonly Id[];
  /** Trang đang mở (dùng cho "Đặt làm hình nền"). */
  currentPageId: Id;
  render: RenderPage;
  platform: Platform;
  onClose(): void;
}) {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [quality, setQuality] = useState<ExportQuality>('normal');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const working = status.kind === 'working';

  // Đổi định dạng / chất lượng sau khi đã xuất → xuất lại được (không kẹt ở nút "Chia sẻ").
  function choose(next: { format?: ExportFormat; quality?: ExportQuality }) {
    if (next.format) setFormat(next.format);
    if (next.quality) setQuality(next.quality);
    setStatus({ kind: 'idle' });
  }

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

  // Hình nền điện thoại (G3 R4): chỉ với dự án loại hình nền, trên nền tảng đặt được hình nền (Android).
  const wallpaper = doc.meta.kind === 'wallpaper' ? platform.wallpaper : undefined;
  async function setWallpaper(target: WallpaperTarget) {
    if (!wallpaper) return;
    setStatus({ kind: 'working', done: 0, total: 1 });
    try {
      const blob = await render(currentPageId, 'image/png', 1);
      const r = await wallpaper.set(new Uint8Array(await blob.arrayBuffer()), target);
      setStatus(
        r.ok
          ? { kind: 'done', result: { message: target === 'lock' ? 'Đã đặt hình nền màn hình khóa.' : target === 'home' ? 'Đã đặt hình nền màn hình chính.' : 'Đã đặt hình nền cả hai màn hình.', files: [] } }
          : { kind: 'error', message: r.error },
      );
    } catch (e) {
      setStatus({ kind: 'error', message: e instanceof Error && e.message ? e.message : 'Không đặt được hình nền.' });
    }
  }

  /** Máy tính (Windows): mở Explorer, chọn sẵn file vừa lưu. */
  async function reveal(uri: string) {
    const r = await platform.reveal?.(uri);
    if (r && !r.ok) setStatus({ kind: 'error', message: r.error });
  }

  async function share(result: ExportResult) {
    const sharer = platform.share;
    if (!sharer) return;
    const r = await sharer.share(result.files);
    if (!r.ok) setStatus({ kind: 'error', message: r.error });
  }

  const savedUri = status.kind === 'done' ? status.result.files[0]?.uri : undefined;

  return (
    <div className="dialog-backdrop" onClick={() => !working && onClose()}>
      <div className="dialog export-sheet" role="dialog" aria-modal="true" aria-labelledby="export-title" onClick={(e) => e.stopPropagation()}>
        <p id="export-title">
          <strong>Xuất thiết kế</strong>
          {pageIds.length > 1 && <span className="muted small"> · {pageIds.length} trang</span>}
        </p>

        <div className="export-formats" role="group" aria-label="Định dạng">
          {FORMATS.map(([id, label, hint]) => (
            <button key={id} type="button" aria-pressed={format === id} disabled={working} onClick={() => choose({ format: id })}>
              <span>{label}</span>
              <span className="muted small">{hint}</span>
            </button>
          ))}
        </div>

        {format !== 'pdf' && (
          <div className="row" role="group" aria-label="Chất lượng">
            <button type="button" aria-pressed={quality === 'normal'} disabled={working} onClick={() => choose({ quality: 'normal' })}>
              Thường
            </button>
            <button type="button" aria-pressed={quality === 'high'} disabled={working} onClick={() => choose({ quality: 'high' })}>
              Cao (gấp đôi)
            </button>
          </div>
        )}

        {wallpaper && (
          <div className="row" role="group" aria-label="Đặt làm hình nền">
            <span className="muted small">Đặt làm hình nền:</span>
            <button type="button" disabled={working} onClick={() => void setWallpaper('home')}>
              Màn hình chính
            </button>
            <button type="button" disabled={working} onClick={() => void setWallpaper('lock')}>
              Màn hình khóa
            </button>
            <button type="button" disabled={working} onClick={() => void setWallpaper('both')}>
              Cả hai
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
          {status.kind === 'done' && platform.share && status.result.files.length > 0 ? (
            <button type="button" className="primary" onClick={() => void share(status.result)}>
              Chia sẻ
            </button>
          ) : (
            <button type="button" className="primary" disabled={working} onClick={() => void start()}>
              {status.kind === 'done' ? 'Xuất lại' : 'Xuất'}
            </button>
          )}
          {savedUri && platform.reveal && (
            <button type="button" onClick={() => void reveal(savedUri)}>
              Mở thư mục
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
