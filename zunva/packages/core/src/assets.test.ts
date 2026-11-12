import { describe, expect, it } from 'vitest';
import { pruneUnusedAssets, referencedAssetIds } from './assets';
import { createDocument, createImageLayer, createPage } from './factory';
import type { Asset } from './model';
import { validateDocument } from './validate';

const asset = (id: string): Asset => ({ id, kind: 'image', mimeType: 'image/png', name: null, hash: null, width: 4, height: 4 });

describe('ảnh không còn dùng', () => {
  const page = createPage('p', 100, 100, {
    background: { color: '#ffffff', imageAssetId: 'nen', imageOpacity: 1 },
    layers: [createImageLayer('l', 'anh', { maskAssetId: 'mask_2' })],
  });
  const doc = createDocument('d', page, 1, {
    assets: { nen: asset('nen'), anh: asset('anh'), mask_1: asset('mask_1'), mask_2: asset('mask_2') },
  });

  it('đếm ảnh nền, ảnh lớp và mặt nạ đang dùng', () => {
    expect([...referencedAssetIds(doc)].sort()).toEqual(['anh', 'mask_2', 'nen']);
  });

  it('bỏ mặt nạ của nét tẩy cũ, giữ phần còn lại; tài liệu vẫn hợp lệ', () => {
    const pruned = pruneUnusedAssets(doc);
    expect(Object.keys(pruned.assets).sort()).toEqual(['anh', 'mask_2', 'nen']);
    expect(validateDocument(pruned).ok).toBe(true);
    expect(Object.keys(doc.assets)).toHaveLength(4); // không sửa bản cũ
  });

  it('không có gì để bỏ → trả đúng đối tượng cũ', () => {
    const clean = pruneUnusedAssets(doc);
    expect(pruneUnusedAssets(clean)).toBe(clean);
  });
});
