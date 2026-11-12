import { describe, expect, it } from 'vitest';
import { createDocument, createImageLayer, createPage, createShapeLayer, createTextLayer } from './factory';
import { migrateDocument } from './migrate';
import { SCHEMA_VERSION } from './model';
import { validateDocument } from './validate';

/** Một thiết kế như app đã lưu trước G2b (schema v2): không có blendMode/feather/maskAssetId. */
function savedV2() {
  const img = createImageLayer('l_img', 'a_img', { width: 400, height: 300, cornerRadius: 12 });
  const doc = createDocument('d1', createPage('p1', 1080, 1080, { layers: [createTextLayer('l_txt'), img, createShapeLayer('l_shp')] }), 1, {
    assets: { a_img: { id: 'a_img', kind: 'image', mimeType: 'image/png', name: null, hash: null, width: 400, height: 300 } },
  });
  const raw = JSON.parse(JSON.stringify(doc)) as Record<string, unknown> & { pages: Array<{ layers: Array<Record<string, unknown>> }> };
  raw['schemaVersion'] = 2;
  for (const l of raw.pages[0]!.layers) {
    delete l['blendMode'];
    delete l['feather'];
    delete l['maskAssetId'];
  }
  return raw;
}

describe('nâng dữ liệu cũ (v2 → v3)', () => {
  it('phiên bản hiện tại là 3', () => {
    expect(SCHEMA_VERSION).toBe(3);
  });

  it('dự án v2 mở ra hợp lệ, giữ nguyên nội dung, có giá trị mặc định mới', () => {
    const raw = savedV2();
    expect(validateDocument(raw).ok).toBe(false); // chưa nâng thì không hợp lệ
    const checked = validateDocument(migrateDocument(raw));
    expect(checked.ok).toBe(true);
    if (!checked.ok) return;
    const [txt, img, shp] = checked.value.pages[0]!.layers;
    expect(checked.value.schemaVersion).toBe(3);
    expect(txt).toMatchObject({ type: 'text', text: 'Chữ mới', blendMode: 'normal' });
    expect(img).toMatchObject({ type: 'image', cornerRadius: 12, blendMode: 'normal', feather: 0, maskAssetId: null });
    expect(shp).toMatchObject({ type: 'shape', blendMode: 'normal' });
    expect(shp).not.toHaveProperty('feather');
  });

  it('không sửa dữ liệu đầu vào', () => {
    const raw = savedV2();
    const before = JSON.stringify(raw);
    migrateDocument(raw);
    expect(JSON.stringify(raw)).toBe(before);
  });

  it('dữ liệu v3 và dữ liệu lạ trả nguyên', () => {
    const v3 = createDocument('d', createPage('p', 10, 10), 1);
    expect(migrateDocument(v3)).toBe(v3);
    expect(migrateDocument(null)).toBe(null);
    const v9 = { schemaVersion: 9 };
    expect(migrateDocument(v9)).toBe(v9);
  });
});

describe('dữ liệu v3 mới', () => {
  it('lớp ảnh có mặt nạ phải trỏ tới ảnh có thật; mờ viền không âm; kiểu hòa trộn đúng danh sách', () => {
    const base = savedV2();
    const doc = migrateDocument(base) as ReturnType<typeof savedV2>;
    const img = doc.pages[0]!.layers[1]!;
    img['maskAssetId'] = 'khong_co';
    img['feather'] = -1;
    img['blendMode'] = 'lam-mo';
    const r = validateDocument(doc);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.join('\n')).toMatch(/maskAssetId/);
    expect(r.errors.join('\n')).toMatch(/feather/);
    expect(r.errors.join('\n')).toMatch(/blendMode/);
  });
});
