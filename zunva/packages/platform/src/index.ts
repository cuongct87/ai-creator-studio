/**
 * @zunva/platform — hợp đồng giữa ZUNVA và thiết bị.
 * Lõi và công cụ không gọi thẳng trình duyệt hay Android/iOS; mỗi vỏ ứng dụng
 * (web, Capacitor, Tauri) cung cấp một bản cài đặt các giao diện dưới đây.
 * G1-2 chỉ khai báo kiểu; G1-5 thêm kho dự án và bản cài đặt cho web.
 */

import type { DesignDocument, Id } from '@zunva/core';

export type PlatformResult<T> = { ok: true; value: T } | { ok: false; error: string };

export interface FileSaver {
  /** Lưu nội dung chữ (ví dụ JSON dự án) thành file người dùng thấy được. */
  saveText(fileName: string, mimeType: string, content: string): Promise<PlatformResult<{ location: string }>>;
  /** Lưu dữ liệu nhị phân (PNG, PDF, .zunva). */
  saveBytes(fileName: string, mimeType: string, bytes: Uint8Array): Promise<PlatformResult<{ location: string }>>;
}

export interface PickedImage {
  name: string;
  mimeType: string;
  bytes: Uint8Array;
}

export interface ImagePicker {
  pickImage(): Promise<PlatformResult<PickedImage | null>>;
}

export interface GallerySaver {
  /** Lưu ảnh vào Thư viện ảnh của máy (Android/iOS); trên web có thể là tải xuống. */
  saveImage(fileName: string, bytes: Uint8Array): Promise<PlatformResult<{ location: string }>>;
}

export interface Platform {
  readonly name: 'web' | 'android' | 'ios' | 'windows' | 'macos';
  readonly files: FileSaver;
  readonly images: ImagePicker;
  readonly gallery: GallerySaver;
}

/** Một dòng trong danh sách dự án (không cần mở cả thiết kế). */
export interface ProjectSummary {
  id: Id;
  name: string;
  /** Lần lưu gần nhất, mili giây kể từ 1970 (UTC). */
  updatedAt: number;
  pageCount: number;
}

/** Nội dung một ảnh/phông lưu riêng, không nằm trong JSON dự án. */
export interface StoredAsset {
  mimeType: string;
  bytes: Uint8Array;
}

export interface StorageInfo {
  /** Số byte trình duyệt đang dùng cho trang này. */
  usedBytes: number;
  /** Số byte tối đa trình duyệt cho phép (ước tính). */
  quotaBytes: number;
}

/**
 * Kho dự án trên máy (G1-5). Ảnh lưu riêng qua putAsset/getAsset;
 * tài liệu chỉ tham chiếu ảnh bằng assetId.
 * Mọi hàm trả lỗi bằng tiếng Việt dễ hiểu, không ném lỗi ra ngoài.
 */
export interface ProjectStore {
  /** Danh sách dự án, mới sửa xếp trước. */
  list(): Promise<PlatformResult<ProjectSummary[]>>;
  load(id: Id): Promise<PlatformResult<DesignDocument>>;
  /** Lưu (tạo mới hoặc ghi đè). Kho tự ghi `updatedAt`; trả về đúng bản đã lưu. */
  save(doc: DesignDocument): Promise<PlatformResult<DesignDocument>>;
  /** Xóa dự án và các ảnh không còn dự án nào khác dùng. */
  remove(id: Id): Promise<PlatformResult<void>>;
  putAsset(id: Id, mimeType: string, bytes: Uint8Array): Promise<PlatformResult<void>>;
  getAsset(id: Id): Promise<PlatformResult<StoredAsset>>;
  /** Dung lượng đã dùng / còn được dùng. */
  storageInfo(): Promise<PlatformResult<StorageInfo>>;
}

export { createIndexedDbProjectStore, STORE_MESSAGES } from './indexeddb-store';
export type { IndexedDbStoreOptions } from './indexeddb-store';
export { createAutosave } from './autosave';
export type { Autosave, AutosaveOptions, AutosaveState, AutosaveStatus } from './autosave';
export { createWebPlatform } from './web-platform';
