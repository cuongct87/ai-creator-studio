import { describe, expect, it } from 'vitest';
import { createDocument, createImageLayer, createPage, createTextLayer, validateDocument } from './index';

function sample() {
  const page = createPage('page_1', 1080, 1350, {
    layers: [createTextLayer('t1', { text: 'Cáo phó' }), createImageLayer('i1', 'a1')],
  });
  const doc = createDocument('doc_1', page, 1_700_000_000_000);
  return {
    ...doc,
    assets: { a1: { id: 'a1', kind: 'image' as const, mimeType: 'image/jpeg', name: 'anh.jpg', hash: null, width: 800, height: 600 } },
  };
}

const errorsOf = (input: unknown): string[] => {
  const r = validateDocument(input);
  return r.ok ? [] : r.errors;
};

describe('kiểm tra dữ liệu thiết kế', () => {
  it('nhận tài liệu hợp lệ, kể cả sau khi lưu ra JSON rồi đọc lại', () => {
    expect(errorsOf(sample())).toEqual([]);
    expect(errorsOf(JSON.parse(JSON.stringify(sample())))).toEqual([]);
  });

  it('từ chối bản cũ chưa qua bộ nhập', () => {
    expect(errorsOf({ ...sample(), schemaVersion: 1 })).toContainEqual(expect.stringMatching(/^schemaVersion/));
  });

  it('báo trùng ID kèm đường dẫn', () => {
    const d = sample();
    d.pages[0]!.layers[1] = { ...d.pages[0]!.layers[1]!, id: 't1' };
    expect(errorsOf(d)).toContainEqual('pages[0].layers[1].id: trùng ID "t1"');
  });

  it('báo ảnh trỏ tới tài nguyên không có', () => {
    const d = { ...sample(), assets: {} };
    expect(errorsOf(d)).toContainEqual(expect.stringContaining('pages[0].layers[1].assetId'));
  });

  it('báo màu sai, số sai, loại lớp lạ', () => {
    const d = sample() as unknown as { pages: Array<{ layers: Array<Record<string, unknown>> }> };
    d.pages[0]!.layers[0]!.color = 'đỏ';
    d.pages[0]!.layers[0]!.fontSize = -5;
    d.pages[0]!.layers.push({ ...d.pages[0]!.layers[0]!, id: 'x', type: 'video' });
    const errs = errorsOf(d);
    expect(errs).toContainEqual(expect.stringContaining('pages[0].layers[0].color'));
    expect(errs).toContainEqual('pages[0].layers[0].fontSize: phải > 0');
    expect(errs).toContainEqual(expect.stringContaining('pages[0].layers[2].type'));
  });

  it('tạo tài liệu kèm sẵn tài nguyên ảnh thì hợp lệ ngay', () => {
    const asset = { id: 'a9', kind: 'image' as const, mimeType: 'image/png', name: null, hash: null, width: 10, height: 10 };
    const page = createPage('p9', 100, 100, { layers: [createImageLayer('i9', 'a9')] });
    expect(errorsOf(createDocument('d9', page, 0, { assets: { a9: asset } }))).toEqual([]);
  });

  it('từ chối thứ không phải tài liệu', () => {
    expect(errorsOf(null)).toEqual(['(gốc): phải là object']);
    expect(errorsOf({})).not.toEqual([]);
  });

  it('chấp nhận chỗ để sẵn cho video (timing) khi có giá trị hợp lệ', () => {
    const d = sample();
    d.pages[0]!.layers[0] = { ...d.pages[0]!.layers[0]!, timing: { start: 0, duration: 3 } };
    expect(errorsOf(d)).toEqual([]);
  });
});
