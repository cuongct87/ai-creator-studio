import { describe, expect, it } from 'vitest';
import { createDocument, createPage } from '@zunva/core';
import { exportFileName, exportPixelRatio, runExport, type RenderPage } from './export-actions';

const jpegBlob = () => new Blob([new Uint8Array([0xff, 0xd8, 1, 2, 0xff, 0xd9])], { type: 'image/jpeg' });
const pngBlob = () => new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], { type: 'image/png' });

function fakePlatform() {
  const saved: string[] = [];
  return {
    saved,
    platform: {
      files: {
        saveText: async () => ({ ok: true as const, value: { location: 'x' } }),
        saveBytes: async (name: string, mime: string) => {
          saved.push(`${name}|${mime}`);
          return { ok: true as const, value: { location: 'Tải xuống/Artio', uri: 'content://media/d/1' } };
        },
      },
      gallery: {
        saveImage: async (name: string) => {
          saved.push(name);
          return { ok: true as const, value: { location: 'Ảnh/Artio', uri: `content://media/i/${saved.length}` } };
        },
      },
    },
  };
}

describe('xuất (G3)', () => {
  it('tỉ lệ vẽ: Thường = 1, Cao = 2, không vượt 8000 px', () => {
    expect(exportPixelRatio({ width: 1080, height: 1080 }, 'normal')).toBe(1);
    expect(exportPixelRatio({ width: 1080, height: 1080 }, 'high')).toBe(2);
    expect(exportPixelRatio({ width: 2480, height: 3508 }, 'high')).toBeCloseTo(8000 / 3508, 5);
  });

  it('tên file giữ tiếng Việt, bỏ ký tự cấm, đánh số khi nhiều trang', () => {
    expect(exportFileName('Thiệp cưới Hùng/Lan', 'png', 0, 1)).toBe('Thiệp cưới Hùng Lan.png');
    expect(exportFileName('Bảng hiệu', 'jpg', 1, 3)).toBe('Bảng hiệu - 2.jpg');
    expect(exportFileName('  ', 'pdf', 0, 1)).toBe('Artio.pdf');
  });

  it('ảnh JPG nhiều trang: mỗi trang một file, đúng tỉ lệ, có uri để chia sẻ', async () => {
    const doc = createDocument('d', createPage('p1', 1080, 1080), 1, { name: 'Bài bán hàng' });
    doc.pages.push(createPage('p2', 1080, 1080));
    const calls: string[] = [];
    const render: RenderPage = async (id, mime, ratio) => {
      calls.push(`${id}|${mime}|${ratio}`);
      return jpegBlob();
    };
    const { platform, saved } = fakePlatform();
    const progress: string[] = [];
    const r = await runExport({ doc, pageIds: ['p1', 'p2'], format: 'jpg', quality: 'high', render, platform, onProgress: (a, b) => progress.push(`${a}/${b}`) });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(calls).toEqual(['p1|image/jpeg|2', 'p2|image/jpeg|2']);
    expect(saved).toEqual(['Bài bán hàng - 1.jpg', 'Bài bán hàng - 2.jpg']);
    expect(r.value.files.map((f) => f.uri)).toEqual(['content://media/i/1', 'content://media/i/2']);
    expect(r.value.message).toBe('Đã lưu 2 ảnh vào Ảnh/Artio');
    expect(progress.at(-1)).toBe('2/2');
  });

  it('PDF: một file cho mọi trang, vẽ JPEG đúng khổ, lưu vào Tải xuống', async () => {
    const doc = createDocument('d', createPage('p1', 1748, 2480), 1, { name: 'Thiệp cưới' });
    const calls: string[] = [];
    const { platform, saved } = fakePlatform();
    const r = await runExport({
      doc,
      pageIds: ['p1'],
      format: 'pdf',
      quality: 'high',
      render: async (id, mime, ratio) => {
        calls.push(`${id}|${mime}|${ratio}`);
        return jpegBlob();
      },
      platform,
    });
    expect(r.ok).toBe(true);
    expect(calls).toEqual(['p1|image/jpeg|1']);
    expect(saved).toEqual(['Thiệp cưới.pdf|application/pdf']);
    if (r.ok) expect(r.value.files[0]).toMatchObject({ mimeType: 'application/pdf', uri: 'content://media/d/1' });
  });

  it('lưu lỗi → trả câu báo lỗi, dừng', async () => {
    const doc = createDocument('d', createPage('p1', 100, 100), 1);
    const r = await runExport({
      doc,
      pageIds: ['p1'],
      format: 'png',
      quality: 'normal',
      render: async () => pngBlob(),
      platform: {
        files: fakePlatform().platform.files,
        gallery: { saveImage: async () => ({ ok: false as const, error: 'Máy hết chỗ lưu.' }) },
      },
    });
    expect(r).toEqual({ ok: false, error: 'Máy hết chỗ lưu.' });
  });
});
