import { describe, expect, it } from 'vitest';
import { buildPdf, pdfPageSize } from './pdf';

/** JPEG giả (chỉ cần byte để nhúng; cấu trúc PDF không phụ thuộc nội dung ảnh). */
const fakeJpeg = (n: number) => new Uint8Array([0xff, 0xd8, ...Array.from({ length: n }, (_, i) => i % 251), 0xff, 0xd9]);
const latin1 = (bytes: Uint8Array) => Array.from(bytes, (b) => String.fromCharCode(b)).join('');

describe('PDF để in (G3)', () => {
  it('khổ giấy theo DPI: A5 1748×2480 ở 300 DPI = 148×210 mm', () => {
    const s = pdfPageSize(1748, 2480, 300);
    expect((s.width / 72) * 25.4).toBeCloseTo(148, 0);
    expect((s.height / 72) * 25.4).toBeCloseTo(210, 0);
  });

  it('nhiều trang, mỗi trang đúng khổ, bảng xref trỏ đúng từng đối tượng', () => {
    const pdf = buildPdf(
      [
        { jpeg: fakeJpeg(300), widthPx: 1748, heightPx: 2480 },
        { jpeg: fakeJpeg(50), widthPx: 1080, heightPx: 1080 },
      ],
      300,
      { title: 'Thiệp cưới Hùng – Lan', createdAt: Date.UTC(2026, 10, 12) },
    );
    const text = latin1(pdf);
    expect(text.startsWith('%PDF-1.4\n')).toBe(true);
    expect(text.trimEnd().endsWith('%%EOF')).toBe(true);
    expect(text).toContain('/Count 2');
    expect(text).toContain('/MediaBox [0 0 419.52 595.2]');
    expect(text).toContain('/MediaBox [0 0 259.2 259.2]');
    expect(text.match(/\/Subtype \/Image/g)).toHaveLength(2);

    const startxref = Number(/startxref\n(\d+)\n/.exec(text)![1]);
    expect(text.slice(startxref, startxref + 4)).toBe('xref');
    const entries = text.slice(startxref).split('\n').filter((l) => / 00000 n $/.test(l));
    expect(entries).toHaveLength(9); // 3 chung + 3 × 2 trang
    entries.forEach((line, i) => {
      const at = Number(line.slice(0, 10));
      expect(text.slice(at).startsWith(`${i + 1} 0 obj`)).toBe(true);
    });
  });

  it('tiêu đề tiếng Việt lưu dạng UTF-16 (không mất dấu)', () => {
    const text = latin1(buildPdf([{ jpeg: fakeJpeg(10), widthPx: 100, heightPx: 100 }], 300, { title: 'Ệ', createdAt: 0 }));
    expect(text).toContain('/Title <FEFF1EC6>');
  });

  it('từ chối PDF rỗng hoặc DPI sai', () => {
    expect(() => buildPdf([], 300, { title: '', createdAt: 0 })).toThrow();
    expect(() => buildPdf([{ jpeg: fakeJpeg(1), widthPx: 1, heightPx: 1 }], 0, { title: '', createdAt: 0 })).toThrow();
  });
});
