import type { FileSaver, GallerySaver, Platform, PlatformResult, SavedFile } from './index';
import { createWebPlatform } from './web-platform';

/**
 * Bản cài đặt nền tảng cho vỏ Windows (Tauri 2, G4).
 * - Lưu file: lệnh Rust `save_file` ghi vào Pictures\Artio (ảnh) hoặc Downloads\Artio (PDF, .zunva),
 *   gửi byte thô (không đổi sang JSON) để file lớn vẫn nhanh. Trùng tên thì Rust thêm " (2)"…
 * - Mở thư mục: lệnh `reveal_file` (Explorer chọn sẵn file; Rust chỉ cho mở file trong 2 thư mục trên).
 * - Chọn ảnh, mở `.zunva`: dùng hộp chọn file của trang web (WebView2 mở hộp thoại Windows).
 * - Không có chia sẻ, tách nền, đặt hình nền → app tự ẩn các nút đó.
 * Gọi lệnh qua `window.__TAURI_INTERNALS__.invoke` (Tauri luôn có) → app web không cần thư viện Tauri.
 */

type InvokeOptions = { headers: Record<string, string> };

export interface TauriWindow {
  __TAURI_INTERNALS__?: {
    invoke(cmd: string, args?: unknown, options?: InvokeOptions): Promise<unknown>;
  };
}

export function isTauri(win: unknown): win is TauriWindow & Required<Pick<TauriWindow, '__TAURI_INTERNALS__'>> {
  const internals = (win as TauriWindow | null)?.__TAURI_INTERNALS__;
  return typeof internals === 'object' && internals !== null && typeof internals.invoke === 'function';
}

const PICTURES = 'Ảnh/Artio';
const DOWNLOADS = 'Tải xuống/Artio';

const MESSAGES = {
  saveFailed: 'Không lưu được file vào máy. Hãy thử lại.',
  revealFailed: 'Không mở được thư mục.',
} as const;

/** Lỗi từ Rust là chuỗi tiếng Việt; lỗi khác (ví dụ lệnh không có) → câu chung. */
function errorText(e: unknown, fallback: string): string {
  return typeof e === 'string' && e.trim() !== '' ? e : fallback;
}

export function createTauriPlatform(win: TauriWindow, doc?: Document): Platform {
  const internals = win.__TAURI_INTERNALS__;
  if (!internals) throw new Error('Không phải vỏ Tauri');
  const web = createWebPlatform(doc ?? document);

  async function save(folder: 'pictures' | 'downloads', fileName: string, bytes: Uint8Array): Promise<PlatformResult<SavedFile>> {
    try {
      const path = await internals.invoke('save_file', bytes, {
        headers: { 'x-artio-folder': folder, 'x-artio-name': encodeURIComponent(fileName) },
      });
      if (typeof path !== 'string' || path === '') return { ok: false, error: MESSAGES.saveFailed };
      return { ok: true, value: { location: folder === 'pictures' ? PICTURES : DOWNLOADS, uri: path } };
    } catch (e) {
      return { ok: false, error: errorText(e, MESSAGES.saveFailed) };
    }
  }

  const files: FileSaver = {
    saveText: (fileName, _mimeType, content) => save('downloads', fileName, new TextEncoder().encode(content)),
    saveBytes: (fileName, _mimeType, bytes) => save('downloads', fileName, bytes),
  };
  const gallery: GallerySaver = {
    saveImage: (fileName, bytes) => save('pictures', fileName, bytes),
  };

  return {
    name: 'windows',
    files,
    gallery,
    opener: web.opener,
    images: web.images,
    async reveal(uri) {
      try {
        await internals.invoke('reveal_file', { path: uri });
        return { ok: true, value: undefined };
      } catch (e) {
        return { ok: false, error: errorText(e, MESSAGES.revealFailed) };
      }
    },
  };
}
