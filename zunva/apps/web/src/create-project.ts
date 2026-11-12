import { createDocument, createIdGenerator, createImageLayer, createPage, type DesignDocument, type Id } from '@zunva/core';
import { detectImageType, type Platform, type ProjectStore } from '@zunva/platform';
import type { PageSize, StartOption } from './start-options';

/** Random source backed by the browser's crypto (better than Math.random for IDs). */
const cryptoRandom = () => {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return (buf[0] ?? 0) / 4294967296;
};
export const newId = createIdGenerator(cryptoRandom);

/** Kết quả: ID dự án mới, null nếu người dùng bấm hủy, hoặc câu báo lỗi. */
export type CreateResult = { ok: true; id: Id } | { ok: false; error: string } | null;

/** Tạo dự án trống đúng khổ cho một cách bắt đầu, lưu vào kho. */
export async function createBlankProject(store: ProjectStore, option: StartOption, size: PageSize): Promise<CreateResult> {
  const doc = createDocument(newId('doc'), createPage(newId('page'), size.width, size.height), Date.now(), {
    name: option.projectName,
    meta: { kind: option.kind, locale: 'vi', templateId: null },
  });
  const saved = await store.save(doc);
  return saved.ok ? { ok: true, id: doc.id } : { ok: false, error: saved.error };
}

/** Đọc kích thước ảnh mà không cần DOM ảnh (chạy được cả trong WebView Android). */
async function imageSize(bytes: Uint8Array, mimeType: string): Promise<{ width: number; height: number } | null> {
  try {
    const bitmap = await createImageBitmap(new Blob([bytes.slice()], { type: mimeType }));
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size.width > 0 && size.height > 0 ? size : null;
  } catch {
    return null;
  }
}

/** Khổ trang tối đa 4000 px cạnh dài: ảnh điện thoại 4000×3000 giữ nguyên, ảnh lớn hơn thu lại. */
const MAX_PAGE_SIDE = 4000;

/** "Tải ảnh lên": chọn ảnh → dự án có trang đúng tỉ lệ ảnh, ảnh phủ kín trang. */
export async function createPhotoProject(store: ProjectStore, platform: Platform, option: StartOption): Promise<CreateResult> {
  const picked = await platform.images.pickImage();
  if (!picked.ok) return { ok: false, error: picked.error };
  if (picked.value === null) return null;
  const { bytes, name } = picked.value;
  const mimeType = detectImageType(bytes) ?? picked.value.mimeType;
  const dims = await imageSize(bytes, mimeType);
  if (!dims) return { ok: false, error: 'Máy không đọc được ảnh này. Hãy thử ảnh JPG hoặc PNG khác.' };

  const scale = Math.min(1, MAX_PAGE_SIDE / Math.max(dims.width, dims.height));
  const width = Math.round(dims.width * scale);
  const height = Math.round(dims.height * scale);

  const assetId = newId('img');
  const put = await store.putAsset(assetId, mimeType, bytes);
  if (!put.ok) return { ok: false, error: put.error };

  const page = createPage(newId('page'), width, height, {
    layers: [createImageLayer(newId('layer'), assetId, { x: 0, y: 0, width, height })],
  });
  const doc: DesignDocument = createDocument(newId('doc'), page, Date.now(), {
    name: option.projectName,
    meta: { kind: option.kind, locale: 'vi', templateId: null },
    assets: {
      [assetId]: { id: assetId, kind: 'image', mimeType, name, hash: null, width: dims.width, height: dims.height },
    },
  });
  const saved = await store.save(doc);
  return saved.ok ? { ok: true, id: doc.id } : { ok: false, error: saved.error };
}
