import { describe, expect, it } from 'vitest';
import { applyOp, createDocument, createPage, createTextLayer, validateDocument, type DesignDocument, type Op } from '@zunva/core';
import { addPageOps, duplicatePageOps, movePageOps, removePageOps } from './page-actions';

let n = 0;
const newId = (p: string) => `${p}_${++n}`;
const run = (doc: DesignDocument, ops: Op[]) => ops.reduce((d, op) => applyOp(d, op).doc, doc);
const ids = (doc: DesignDocument) => doc.pages.map((p) => p.id);

function twoPages() {
  const doc = createDocument('d', createPage('a', 1748, 2480, { layers: [createTextLayer('t1', { text: 'Trân trọng kính mời' })] }), 1);
  return run(doc, addPageOps(doc, 'a', newId).ops);
}

describe('trang (G3 R3)', () => {
  it('thêm trang trắng cùng khổ ngay sau trang đang mở', () => {
    const doc = createDocument('d', createPage('a', 1748, 2480), 1);
    const { ops, pageId } = addPageOps(doc, 'a', newId);
    const next = run(doc, ops);
    expect(ids(next)).toEqual(['a', pageId]);
    expect(next.pages[1]).toMatchObject({ width: 1748, height: 2480, layers: [] });
  });

  it('nhân đôi trang: ID mới cho trang và lớp, nội dung giữ nguyên, hợp lệ', () => {
    const doc = twoPages();
    const r = duplicatePageOps(doc, 'a', newId)!;
    const next = run(doc, r.ops);
    expect(ids(next)[1]).toBe(r.pageId);
    expect(next.pages[1]!.layers[0]).toMatchObject({ type: 'text', text: 'Trân trọng kính mời' });
    expect(next.pages[1]!.layers[0]!.id).not.toBe('t1');
    expect(validateDocument(next).ok).toBe(true);
  });

  it('xóa trang: mở trang kế tiếp (hoặc trước nếu là trang cuối); không xóa được trang duy nhất', () => {
    const doc = twoPages();
    const second = doc.pages[1]!.id;
    expect(removePageOps(doc, 'a')).toEqual({ ops: [{ op: 'removePage', pageId: 'a' }], nextPageId: second });
    expect(removePageOps(doc, second)!.nextPageId).toBe('a');
    const one = createDocument('d', createPage('x', 10, 10), 1);
    expect(removePageOps(one, 'x')).toBeNull();
  });

  it('đưa trang lên/xuống, ở đầu/cuối thì không làm gì', () => {
    const doc = twoPages();
    const second = doc.pages[1]!.id;
    expect(ids(run(doc, movePageOps(doc, second, -1)))).toEqual([second, 'a']);
    expect(movePageOps(doc, 'a', -1)).toEqual([]);
    expect(movePageOps(doc, second, 1)).toEqual([]);
  });
});
