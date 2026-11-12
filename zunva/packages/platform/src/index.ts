/**
 * @zunva/platform — hợp đồng giữa ZUNVA và thiết bị.
 * Lõi và công cụ không gọi thẳng trình duyệt hay Android/iOS; mỗi vỏ ứng dụng
 * (web, Capacitor, Tauri) cung cấp một bản cài đặt các giao diện dưới đây.
 * G1-2 chỉ khai báo kiểu; G1-5 thêm kho dự án và bản cài đặt cho web; G1-7 thêm bản Android (cầu nối Java).
 */

import type { DesignDocument, Id } from '@zunva/core';

export type PlatformResult<T> = { ok: true; value: T } | { ok: false; error: string };

/** Nơi file vừa lưu. `uri` (Android: content://media/…) dùng để chia sẻ; vắng mặt trên web. */
export interface SavedFile {
  location: string;
  uri?: string;
}

/** Một file để chia sẻ sang app khác (Zalo, Messenger…). */
export interface FileToShare {
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
  /** Có khi file đã lưu trên Android (chia sẻ bằng uri, không gửi lại byte). */
  uri?: string;
}

export interface Sharer {
  share(files: readonly FileToShare[]): Promise<PlatformResult<void>>;
}

export interface FileSaver {
  /** Lưu nội dung chữ (ví dụ JSON dự án) thành file người dùng thấy được. */
  saveText(fileName: string, mimeType: string, content: string): Promise<PlatformResult<SavedFile>>;
  /** Lưu dữ liệu nhị phân (PNG, PDF, .zunva). */
  saveBytes(fileName: string, mimeType: string, bytes: Uint8Array): Promise<PlatformResult<SavedFile>>;
}

export interface PickedImage {
  name: string;
  mimeType: string;
  bytes: Uint8Array;
}

export interface ImagePicker {
  pickImage(): Promise<PlatformResult<PickedImage | null>>;
}

/** Tự tách chủ thể (người/vật chính) khỏi nền, chạy trên máy (G2b). */
export interface SubjectSegmenter {
  /**
   * Trả ảnh PNG mặt nạ cùng tỉ lệ ảnh (đã xoay theo EXIF như trình duyệt hiển thị), đọc theo độ
   * trong suốt: đục = chủ thể, trong suốt = nền. `null` = không tìm thấy chủ thể.
   */
  segment(bytes: Uint8Array): Promise<PlatformResult<Uint8Array | null>>;
}

export type WallpaperTarget = 'home' | 'lock' | 'both';

/** Đặt ảnh làm hình nền máy (G3 R4, Android). */
export interface WallpaperSetter {
  set(png: Uint8Array, target: WallpaperTarget): Promise<PlatformResult<void>>;
}

export interface GallerySaver {
  /** Lưu ảnh vào Thư viện ảnh của máy (Android/iOS); trên web có thể là tải xuống. */
  saveImage(fileName: string, bytes: Uint8Array): Promise<PlatformResult<SavedFile>>;
}

export interface PickedFile {
  name: string;
  bytes: Uint8Array;
}

export interface FileOpener {
  /**
   * Cho người dùng chọn một file (ví dụ `.zunva`) và đọc nội dung. `null` = người dùng bấm hủy.
   * `accept` chỉ là gợi ý cho hộp chọn file; nơi gọi phải tự kiểm tra nội dung.
   */
  openFile(accept: string): Promise<PlatformResult<PickedFile | null>>;
}

export interface Platform {
  readonly name: 'web' | 'android' | 'ios' | 'windows' | 'macos';
  readonly files: FileSaver;
  readonly opener: FileOpener;
  readonly images: ImagePicker;
  readonly gallery: GallerySaver;
  /** Có khi nền tảng hỗ trợ tách nền (Android có ML Kit). Vắng mặt → app ẩn nút "Tách nền". */
  readonly subject?: SubjectSegmenter;
  /** Có khi nền tảng mở được bảng chia sẻ của máy. Vắng mặt → app ẩn nút "Chia sẻ". */
  readonly share?: Sharer;
  /** Có trên Android: đặt hình nền. Vắng mặt → app ẩn nút "Đặt làm hình nền". */
  readonly wallpaper?: WallpaperSetter;
  /** Kích thước màn hình máy (px thật), để làm hình nền vừa khít. Vắng mặt / null → dùng khổ mặc định. */
  screenSize?(): { width: number; height: number } | null;
  /** Có trên máy tính (Windows): mở thư mục chứa file vừa lưu (`SavedFile.uri`). Vắng mặt → app ẩn nút "Mở thư mục". */
  reveal?(uri: string): Promise<PlatformResult<void>>;
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
  /**
   * Xóa ảnh trong kho mà không dự án nào còn dùng (mỗi nét tẩy G2b tạo một ảnh mặt nạ mới).
   * Gọi lúc mở dự án, trước khi người dùng sửa. Trả số ảnh đã xóa.
   */
  collectUnusedAssets(): Promise<PlatformResult<number>>;
}

export { createIndexedDbProjectStore, STORE_MESSAGES } from './indexeddb-store';
export type { IndexedDbStoreOptions } from './indexeddb-store';
export { createAutosave } from './autosave';
export type { Autosave, AutosaveOptions, AutosaveState, AutosaveStatus } from './autosave';
export { createWebPlatform, detectImageType } from './web-platform';
export { createAndroidPlatform, createPlatform } from './android-platform';
export { createTauriPlatform, isTauri } from './tauri-platform';
export type { TauriWindow } from './tauri-platform';
export type { AndroidBridgeWindow } from './android-platform';
