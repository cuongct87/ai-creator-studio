import { describe, expect, it } from 'vitest';
import { createDocument, createImageLayer, createPage, createTextLayer } from './factory';
import { applyOp } from './ops';
import { cloneDocumentForTemplate } from './template';
import { validateDocument } from './validate';

describe('mẫu → dự án mới', () => {
  const template = createDocument(
    'mau_thiep_1',
    createPage('p1', 1748, 2480, { layers: [createTextLayer('t1', { text: 'Tên cô dâu' }), createImageLayer('i1', 'mau_hoa')] }),
    1,
    { name: 'Thiệp cưới hoa hồng', assets: { mau_hoa: { id: 'mau_hoa', kind: 'image', mimeType: 'image/webp', name: null, hash: null, width: 800, height: 600 } } },
  );

  it('ID mới cho tài liệu/trang/lớp, giữ ảnh và nội dung, ghi ID mẫu gốc', () => {
    let n = 0;
    const copy = cloneDocumentForTemplate(template, (p) => `${p}_${++n}`, 99);
    expect(copy.id).not.toBe(template.id);
    expect(copy.pages[0]!.id).not.toBe('p1');
    expect(copy.pages[0]!.layers.map((l) => l.id)).not.toContain('t1');
    expect(copy.pages[0]!.layers[1]).toMatchObject({ type: 'image', assetId: 'mau_hoa' });
    expect(copy.pages[0]!.layers[0]).toMatchObject({ text: 'Tên cô dâu' });
    expect(copy.meta.templateId).toBe('mau_thiep_1');
    expect(copy.createdAt).toBe(99);
    expect(validateDocument(copy).ok).toBe(true);
    // Sửa bản sao không đụng mẫu gốc.
    expect(template.pages[0]!.layers[0]!.id).toBe('t1');
  });
});

describe('đổi thứ tự trang', () => {
  it('movePage và hoàn tác', () => {
    const doc = createDocument('d', createPage('a', 10, 10), 1);
    const two = applyOp(doc, { op: 'addPage', index: 1, page: createPage('b', 10, 10) }).doc;
    const three = applyOp(two, { op: 'addPage', index: 2, page: createPage('c', 10, 10) }).doc;
    const moved = applyOp(three, { op: 'movePage', pageId: 'c', toIndex: 0 });
    expect(moved.doc.pages.map((p) => p.id)).toEqual(['c', 'a', 'b']);
    const back = applyOp(moved.doc, moved.inverse);
    expect(back.doc.pages.map((p) => p.id)).toEqual(['a', 'b', 'c']);
    expect(() => applyOp(three, { op: 'movePage', pageId: 'a', toIndex: 3 })).toThrow();
  });
});
