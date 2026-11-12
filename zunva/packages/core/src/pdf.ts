import { utf8Encode } from './zip';

/**
 * PDF tối thiểu (G3), không thư viện ngoài: mỗi trang là một ảnh JPEG phủ kín trang.
 * Khổ trang (điểm, 1/72 inch) = px ÷ dpi × 72 — A5 1748×2480 ở 300 DPI = 148 × 210 mm.
 */
export interface PdfPage {
  /** Ảnh JPEG của cả trang (RGB). */
  jpeg: Uint8Array;
  widthPx: number;
  heightPx: number;
}

export interface PdfMeta {
  title: string;
  /** Mili giây kể từ 1970 (UTC). */
  createdAt: number;
}

/** Số gọn cho PDF: tối đa 2 chữ số thập phân, không dạng 1e-7. */
function num(n: number): string {
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) ? String(r) : r.toFixed(2).replace(/0+$/, '');
}

/** Chuỗi PDF dạng hex UTF-16BE có BOM — giữ được chữ tiếng Việt trong tiêu đề. */
function textString(text: string): string {
  let hex = 'FEFF';
  for (let i = 0; i < text.length; i++) hex += text.charCodeAt(i).toString(16).padStart(4, '0').toUpperCase();
  return `<${hex}>`;
}

function pdfDate(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `D:${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
}

/** Khổ trang PDF (điểm) từ px và DPI. */
export function pdfPageSize(widthPx: number, heightPx: number, dpi: number): { width: number; height: number } {
  return { width: (widthPx / dpi) * 72, height: (heightPx / dpi) * 72 };
}

export function buildPdf(pages: readonly PdfPage[], dpi: number, meta: PdfMeta): Uint8Array {
  if (pages.length === 0) throw new RangeError('PDF phải có ít nhất 1 trang');
  if (!(dpi > 0)) throw new RangeError('DPI phải > 0');

  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;
  const push = (data: Uint8Array | string) => {
    const bytes = typeof data === 'string' ? utf8Encode(data) : data;
    chunks.push(bytes);
    length += bytes.length;
  };
  const object = (id: number, body: string, stream?: Uint8Array) => {
    offsets[id] = length;
    push(`${id} 0 obj\n${body}\n`);
    if (stream) {
      push('stream\n');
      push(stream);
      push('\nendstream\n');
    }
    push('endobj\n');
  };

  // Số thứ tự đối tượng: 1 Catalog, 2 Pages, 3 Info, rồi mỗi trang 3 đối tượng (Page, nội dung, ảnh).
  const pageObj = (i: number) => 4 + i * 3;
  push('%PDF-1.4\n');
  // Dòng chú thích nhị phân theo khuyến nghị PDF (báo cho công cụ đây là file nhị phân).
  push(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  object(1, '<< /Type /Catalog /Pages 2 0 R >>');
  const kids = pages.map((_, i) => `${pageObj(i)} 0 R`).join(' ');
  object(2, `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);
  object(3, `<< /Title ${textString(meta.title)} /Producer (Artio) /Creator (Artio) /CreationDate (${pdfDate(meta.createdAt)}) >>`);

  pages.forEach((page, i) => {
    const size = pdfPageSize(page.widthPx, page.heightPx, dpi);
    const w = num(size.width);
    const h = num(size.height);
    const id = pageObj(i);
    object(id, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 ${id + 2} 0 R >> >> /Contents ${id + 1} 0 R >>`);
    const content = utf8Encode(`q ${w} 0 0 ${h} 0 0 cm /Im0 Do Q`);
    object(id + 1, `<< /Length ${content.length} >>`, content);
    object(
      id + 2,
      `<< /Type /XObject /Subtype /Image /Width ${Math.round(page.widthPx)} /Height ${Math.round(page.heightPx)} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpeg.length} >>`,
      page.jpeg,
    );
  });

  const count = 4 + pages.length * 3;
  const xrefAt = length;
  let xref = `xref\n0 ${count}\n0000000000 65535 f \n`;
  for (let id = 1; id < count; id++) xref += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  push(xref);
  push(`trailer\n<< /Size ${count} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`);

  const out = new Uint8Array(length);
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.length;
  }
  return out;
}
