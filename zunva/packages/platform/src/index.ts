/**
 * @zunva/platform — hợp đồng giữa ZUNVA và thiết bị.
 * Lõi và công cụ không gọi thẳng trình duyệt hay Android/iOS; mỗi vỏ ứng dụng
 * (web, Capacitor, Tauri) cung cấp một bản cài đặt các giao diện dưới đây.
 * G1-2 chỉ khai báo kiểu; bản cài đặt viết ở G1-5.
 */

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
