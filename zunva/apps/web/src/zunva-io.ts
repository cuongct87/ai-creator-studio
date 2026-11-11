import { packZunva, unpackZunva, ZUNVA_EXTENSION, ZUNVA_MIME_TYPE, type Id } from '@zunva/core';
import type { Platform, ProjectStore } from '@zunva/platform';

/** Lưu một dự án trong kho ra file `.zunva` (thiết kế + ảnh). Trả câu báo cho người dùng. */
export async function exportProject(store: ProjectStore, platform: Platform, id: Id, now: number): Promise<string> {
  const loaded = await store.load(id);
  if (!loaded.ok) return loaded.error;
  const doc = loaded.value;

  const assets: Record<Id, Uint8Array> = {};
  for (const assetId of Object.keys(doc.assets)) {
    const asset = await store.getAsset(assetId);
    if (!asset.ok) return `Không lưu được file: ${asset.error}`;
    assets[assetId] = asset.value.bytes;
  }

  const packed = packZunva(doc, assets, now);
  if (!packed.ok) return `Không lưu được file: ${packed.errors[0] ?? 'lỗi không rõ'}`;

  const saved = await platform.files.saveBytes(`${doc.name}${ZUNVA_EXTENSION}`, ZUNVA_MIME_TYPE, packed.value);
  return saved.ok ? `Đã lưu file "${doc.name}${ZUNVA_EXTENSION}" vào ${saved.value.location}.` : saved.error;
}

/**
 * Mở file `.zunva` người dùng chọn và thêm vào kho. Trùng ID với dự án đang có thì thêm thành
 * bản sao (ID mới), không ghi đè. Trả câu báo cho người dùng, hoặc null nếu người dùng bấm hủy.
 */
export async function importProject(
  store: ProjectStore,
  platform: Platform,
  newDocId: () => Id,
): Promise<string | null> {
  // Không lọc theo đuôi file: hộp chọn file của Android không hiểu đuôi lạ như ".zunva".
  const picked = await platform.opener.openFile('');
  if (!picked.ok) return picked.error;
  if (picked.value === null) return null;

  const opened = unpackZunva(picked.value.bytes);
  if (!opened.ok) {
    const more = opened.errors.length > 1 ? ` (và ${opened.errors.length - 1} lỗi khác)` : '';
    return `Không mở được "${picked.value.name}": ${opened.errors[0] ?? 'file hỏng'}${more}`;
  }

  let doc = opened.value.document;
  const existing = await store.load(doc.id);
  if (existing.ok) doc = { ...doc, id: newDocId(), name: `${doc.name} (bản sao)`.slice(0, 120) };

  for (const [assetId, bytes] of Object.entries(opened.value.assets)) {
    const meta = doc.assets[assetId];
    const put = await store.putAsset(assetId, meta?.mimeType ?? 'application/octet-stream', bytes);
    if (!put.ok) return put.error;
  }
  const saved = await store.save(doc);
  return saved.ok ? `Đã mở "${saved.value.name}".` : saved.error;
}
