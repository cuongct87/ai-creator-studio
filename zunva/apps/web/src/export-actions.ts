/**
 * Xuất thiết kế (G3 R1): ảnh PNG/JPG từng trang hoặc một file PDF để in.
 * Không phụ thuộc màn hình: nhận hàm `render` vẽ một trang ra ảnh, nên test được.
 */
import { buildPdf, type DesignDocument, type Id } from '@zunva/core';
import type { FileToShare, Platform, PlatformResult } from '@zunva/platform';

export type ExportFormat = 'png' | 'jpg' | 'pdf';
export type ExportQuality = 'normal' | 'high';

/** Cạnh dài tối đa của ảnh xuất (đủ in khổ lớn, không làm điện thoại hết bộ nhớ). */
export const MAX_EXPORT_SIDE = 8000;
export const JPEG_QUALITY = 0.92;

export type RenderPage = (pageId: Id, mimeType: 'image/png' | 'image/jpeg', pixelRatio: number) => Promise<Blob>;

/** Tỉ lệ vẽ: Thường = đúng khổ trang, Cao = gấp đôi; luôn giữ cạnh dài ≤ 8000 px. */
export function exportPixelRatio(page: { width: number; height: number }, quality: ExportQuality): number {
  const want = quality === 'high' ? 2 : 1;
  const cap = MAX_EXPORT_SIDE / Math.max(page.width, page.height);
  return Math.min(want, cap);
}

/** Tên file gọn, giữ chữ tiếng Việt: "Thiệp cưới.png", nhiều trang → "Thiệp cưới - 2.png". */
export function exportFileName(docName: string, ext: string, index: number, total: number): string {
  const base = docName.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Artio';
  return total > 1 ? `${base} - ${index + 1}.${ext}` : `${base}.${ext}`;
}

export interface ExportResult {
  /** Câu báo cho người dùng, ví dụ "Đã lưu 2 ảnh vào Ảnh/Artio". */
  message: string;
  /** File vừa lưu, để nút "Chia sẻ" dùng. */
  files: FileToShare[];
}

export interface ExportOptions {
  doc: DesignDocument;
  pageIds: readonly Id[];
  format: ExportFormat;
  quality: ExportQuality;
  render: RenderPage;
  platform: Pick<Platform, 'files' | 'gallery'>;
  onProgress?(done: number, total: number): void;
}

const bytesOf = async (blob: Blob) => new Uint8Array(await blob.arrayBuffer());

export async function runExport(o: ExportOptions): Promise<PlatformResult<ExportResult>> {
  const pages = o.pageIds.map((id) => o.doc.pages.find((p) => p.id === id)).filter((p) => p !== undefined);
  if (pages.length === 0) return { ok: false, error: 'Không có trang nào để xuất.' };
  const total = pages.length;

  if (o.format === 'pdf') {
    // PDF in: mỗi trang vẽ đúng px của trang (theo DPI thiết kế) dạng JPEG. Trang quá lớn thì thu
    // nhỏ cả bộ cùng tỉ lệ và hạ DPI tương ứng, nên khổ giấy in vẫn giữ nguyên.
    const ratio = Math.min(1, MAX_EXPORT_SIDE / Math.max(...pages.map((p) => Math.max(p.width, p.height))));
    const pdfPages = [];
    for (const [i, page] of pages.entries()) {
      o.onProgress?.(i, total);
      const jpeg = await bytesOf(await o.render(page.id, 'image/jpeg', ratio));
      pdfPages.push({ jpeg, widthPx: Math.round(page.width * ratio), heightPx: Math.round(page.height * ratio) });
    }
    o.onProgress?.(total, total);
    const pdf = buildPdf(pdfPages, o.doc.dpi * ratio, { title: o.doc.name, createdAt: Date.now() });
    const fileName = exportFileName(o.doc.name, 'pdf', 0, 1);
    const saved = await o.platform.files.saveBytes(fileName, 'application/pdf', pdf);
    if (!saved.ok) return saved;
    const file: FileToShare = { fileName, mimeType: 'application/pdf', bytes: pdf };
    if (saved.value.uri) file.uri = saved.value.uri;
    return { ok: true, value: { message: `Đã lưu PDF ${total} trang vào ${saved.value.location}`, files: [file] } };
  }

  const mimeType = o.format === 'png' ? 'image/png' : 'image/jpeg';
  const files: FileToShare[] = [];
  let location = '';
  for (const [i, page] of pages.entries()) {
    o.onProgress?.(i, total);
    const bytes = await bytesOf(await o.render(page.id, mimeType, exportPixelRatio(page, o.quality)));
    const fileName = exportFileName(o.doc.name, o.format, i, total);
    const saved = await o.platform.gallery.saveImage(fileName, bytes);
    if (!saved.ok) return saved;
    location = saved.value.location;
    const file: FileToShare = { fileName, mimeType, bytes };
    if (saved.value.uri) file.uri = saved.value.uri;
    files.push(file);
  }
  o.onProgress?.(total, total);
  return { ok: true, value: { message: `Đã lưu ${total > 1 ? `${total} ảnh` : 'ảnh'} vào ${location}`, files } };
}

/** PNG → JPEG có nền trắng (JPG không có trong suốt). Dùng khi bộ vẽ chỉ trả PNG. */
export async function pngToJpeg(png: Blob, quality = JPEG_QUALITY): Promise<Blob> {
  const bitmap = await createImageBitmap(png);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Trình duyệt không vẽ được ảnh.');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Không tạo được ảnh JPG.'))), 'image/jpeg', quality));
}
