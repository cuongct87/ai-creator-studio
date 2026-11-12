import type { FileSaver, GallerySaver, Platform, PlatformResult, SavedFile, Sharer, SubjectSegmenter, WallpaperSetter } from './index';
import { createWebPlatform } from './web-platform';

/**
 * Bản nền tảng cho vỏ Android (G1-7). WebView của Android không tải xuống được file tạo bằng
 * Blob, nên lưu file đi qua cầu nối Java do `MainActivity` cung cấp:
 *
 *   window.AndroidFileSaver.saveBytes(fileName, mimeType, base64)
 *     → chuỗi JSON {"ok":true,"location":"Tải xuống/Artio"} hoặc {"ok":false,"error":"..."}
 *   window.AndroidImageSaver.saveImage(dataUrl, fileName)   (có sẵn từ v1.5, tự hiện thông báo)
 *
 * Chọn ảnh / chọn file dùng hộp chọn file của WebView như bản web. Thiếu cầu nối thì dùng bản web.
 */

export interface AndroidBridgeWindow {
  AndroidFileSaver?: {
    saveBytes(fileName: string, mimeType: string, base64: string): string;
    /** G3: ảnh xuất vào Ảnh/Artio, trả kèm uri để chia sẻ (bản app cũ không có). */
    saveImageBytes?(fileName: string, mimeType: string, base64: string): string;
  };
  /** G3: kích thước màn hình (JSON {"width","height"}) — có trong AndroidShell. */
  AndroidShell?: { setBarColor?(hex: string): void; screenSize?(): string };
  /** G3: đặt hình nền; trả lời bất đồng bộ qua `__artioWallpaperDone(requestId, json)`. */
  AndroidWallpaper?: { setWallpaper(requestId: string, base64Png: string, target: string): void };
  __artioWallpaperDone?: (requestId: string, json: string) => void;
  /** G3: bảng chia sẻ của máy cho các uri vừa lưu. */
  AndroidShare?: { share(urisJson: string, mimeType: string): string };
  AndroidImageSaver?: { saveImage(dataUrl: string, fileName: string): void };
  /** G2b: tách nền bằng ML Kit. Trả lời bất đồng bộ qua `__artioSegmentDone(requestId, json)`. */
  AndroidSubject?: { segment(requestId: string, base64: string): void };
  __artioSegmentDone?: (requestId: string, json: string) => void;
}

/** Giới hạn khớp với MainActivity: file đi qua cầu nối dưới dạng một chuỗi base64 lớn. */
export const ANDROID_MAX_SAVE_BYTES = 100 * 1024 * 1024;

const MESSAGES = {
  tooLarge: 'File quá lớn để lưu trên điện thoại (tối đa 100 MB).',
  bridgeFailed: 'Không lưu được file trên điện thoại. Hãy thử lại.',
  imageFailed: 'Không lưu được ảnh vào Thư viện. Hãy thử lại.',
  segmentFailed: 'Không tách được nền. Hãy thử lại.',
  segmentTimeout: 'Tách nền lâu quá. Hãy thử lại với ảnh nhỏ hơn.',
  segmentTooLarge: 'Ảnh quá lớn để tách nền (tối đa 40 MB).',
} as const;

/** Khớp với SubjectBridge.java. */
export const ANDROID_MAX_SEGMENT_BYTES = 40 * 1024 * 1024;
const SEGMENT_TIMEOUT_MS = 90_000;

const CHUNK = 0x8000;

/** Mã hóa base64 theo từng khúc để không vượt giới hạn tham số khi file lớn. */
export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export function fromBase64(text: string): Uint8Array {
  const binary = atob(text);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

/** Cầu nối tách nền: Java xử lý ở luồng riêng rồi gọi lại `__artioSegmentDone`. */
export function createAndroidSegmenter(win: AndroidBridgeWindow, timeoutMs = SEGMENT_TIMEOUT_MS): SubjectSegmenter | null {
  const bridge = win.AndroidSubject;
  if (!bridge) return null;
  const pending = new Map<string, (r: PlatformResult<Uint8Array | null>) => void>();
  let seq = 0;
  win.__artioSegmentDone = (requestId, json) => {
    const done = pending.get(requestId);
    if (!done) return;
    pending.delete(requestId);
    try {
      const v = JSON.parse(json) as { ok?: unknown; mask?: unknown; error?: unknown };
      if (v.ok === true && v.mask === null) return done({ ok: true, value: null });
      if (v.ok === true && typeof v.mask === 'string') return done({ ok: true, value: fromBase64(v.mask) });
      done({ ok: false, error: typeof v.error === 'string' && v.error !== '' ? v.error : MESSAGES.segmentFailed });
    } catch {
      done({ ok: false, error: MESSAGES.segmentFailed });
    }
  };
  return {
    segment(bytes) {
      if (bytes.length > ANDROID_MAX_SEGMENT_BYTES) return Promise.resolve({ ok: false, error: MESSAGES.segmentTooLarge });
      seq += 1;
      const id = `seg_${seq}`;
      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          if (pending.delete(id)) resolve({ ok: false, error: MESSAGES.segmentTimeout });
        }, timeoutMs);
        pending.set(id, (r) => {
          clearTimeout(timer);
          resolve(r);
        });
        try {
          bridge.segment(id, toBase64(bytes));
        } catch {
          pending.delete(id);
          clearTimeout(timer);
          resolve({ ok: false, error: MESSAGES.segmentFailed });
        }
      });
    },
  };
}

/** Đọc kích thước màn hình từ Java; số lạ → null (app dùng khổ mặc định). */
export function parseScreenSize(read: () => string): { width: number; height: number } | null {
  try {
    const v = JSON.parse(read()) as { width?: unknown; height?: unknown };
    const ok = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 200 && n <= 8000;
    return ok(v.width) && ok(v.height) ? { width: v.width, height: v.height } : null;
  } catch {
    return null;
  }
}

/** Đặt hình nền (Android): Java làm ở luồng riêng rồi gọi lại `__artioWallpaperDone`. */
export function createAndroidWallpaper(win: AndroidBridgeWindow, timeoutMs = 30_000): WallpaperSetter | null {
  const bridge = win.AndroidWallpaper;
  if (!bridge) return null;
  const pending = new Map<string, (r: PlatformResult<void>) => void>();
  let seq = 0;
  win.__artioWallpaperDone = (requestId, json) => {
    const done = pending.get(requestId);
    if (!done) return;
    pending.delete(requestId);
    try {
      const v = JSON.parse(json) as { ok?: unknown; error?: unknown };
      done(v.ok === true ? { ok: true, value: undefined } : { ok: false, error: typeof v.error === 'string' && v.error ? v.error : 'Không đặt được hình nền.' });
    } catch {
      done({ ok: false, error: 'Không đặt được hình nền.' });
    }
  };
  return {
    set(png, target) {
      if (png.length > ANDROID_MAX_SAVE_BYTES) return Promise.resolve({ ok: false, error: MESSAGES.tooLarge });
      seq += 1;
      const id = `wp_${seq}`;
      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          if (pending.delete(id)) resolve({ ok: false, error: 'Đặt hình nền lâu quá. Hãy thử lại.' });
        }, timeoutMs);
        pending.set(id, (r) => {
          clearTimeout(timer);
          resolve(r);
        });
        try {
          bridge.setWallpaper(id, toBase64(png), target);
        } catch {
          pending.delete(id);
          clearTimeout(timer);
          resolve({ ok: false, error: 'Không đặt được hình nền.' });
        }
      });
    },
  };
}

/** Chia sẻ file đã lưu (Android): gửi danh sách uri sang Java, Java mở bảng chia sẻ. */
export function createAndroidSharer(win: AndroidBridgeWindow): Sharer | null {
  const bridge = win.AndroidShare;
  if (!bridge) return null;
  return {
    async share(files) {
      const uris = files.map((f) => f.uri).filter((u): u is string => typeof u === 'string');
      if (uris.length === 0) return { ok: false, error: 'Hãy lưu file trước rồi mới chia sẻ.' };
      const types = new Set(files.map((f) => f.mimeType));
      const mime = types.size === 1 ? [...types][0]! : files.every((f) => f.mimeType.startsWith('image/')) ? 'image/*' : '*/*';
      try {
        const r = parseBridgeReply(bridge.share(JSON.stringify(uris), mime));
        return r.ok ? { ok: true, value: undefined } : r;
      } catch {
        return { ok: false, error: 'Không mở được bảng chia sẻ.' };
      }
    },
  };
}

function parseBridgeReply(reply: unknown, fallbackLocation = 'Tải xuống'): PlatformResult<SavedFile> {
  if (typeof reply !== 'string') return { ok: false, error: MESSAGES.bridgeFailed };
  try {
    const value = JSON.parse(reply) as { ok?: unknown; location?: unknown; uri?: unknown; error?: unknown };
    if (value.ok === true) {
      const saved: SavedFile = { location: typeof value.location === 'string' && value.location !== '' ? value.location : fallbackLocation };
      if (typeof value.uri === 'string' && value.uri.startsWith('content://')) saved.uri = value.uri;
      return { ok: true, value: saved };
    }
    return { ok: false, error: typeof value.error === 'string' && value.error !== '' ? value.error : MESSAGES.bridgeFailed };
  } catch {
    return { ok: false, error: MESSAGES.bridgeFailed };
  }
}

export function createAndroidPlatform(win: AndroidBridgeWindow, doc?: Document): Platform {
  const web = createWebPlatform(doc);
  const fileBridge = win.AndroidFileSaver;
  const imageBridge = win.AndroidImageSaver;

  let files: FileSaver = web.files;
  if (fileBridge) {
    const saveBytes: FileSaver['saveBytes'] = async (fileName, mimeType, bytes) => {
      // Chặn trước khi mã hóa base64, để không làm đầy bộ nhớ WebView vô ích.
      if (bytes.length > ANDROID_MAX_SAVE_BYTES) return { ok: false, error: MESSAGES.tooLarge };
      try {
        return parseBridgeReply(fileBridge.saveBytes(fileName, mimeType, toBase64(bytes)));
      } catch {
        return { ok: false, error: MESSAGES.bridgeFailed };
      }
    };
    files = {
      saveBytes,
      saveText: (fileName, mimeType, content) => saveBytes(fileName, mimeType, new TextEncoder().encode(content)),
    };
  }

  const saveImageBytes = fileBridge?.saveImageBytes;
  const gallery: GallerySaver = fileBridge && saveImageBytes
    ? {
        async saveImage(fileName, bytes) {
          if (bytes.length > ANDROID_MAX_SAVE_BYTES) return { ok: false, error: MESSAGES.tooLarge };
          const mime = bytes[0] === 0xff && bytes[1] === 0xd8 ? 'image/jpeg' : 'image/png';
          try {
            return parseBridgeReply(saveImageBytes.call(fileBridge, fileName, mime, toBase64(bytes)), 'Ảnh/Artio');
          } catch {
            return { ok: false, error: MESSAGES.imageFailed };
          }
        },
      }
    : imageBridge
    ? {
        async saveImage(fileName, bytes) {
          try {
            const mime = bytes[0] === 0xff && bytes[1] === 0xd8 ? 'image/jpeg' : 'image/png';
            imageBridge.saveImage(`data:${mime};base64,${toBase64(bytes)}`, fileName);
            return { ok: true, value: { location: 'Ảnh/Artio' } };
          } catch {
            return { ok: false, error: MESSAGES.imageFailed };
          }
        },
      }
    : web.gallery;

  let platform: Platform = { name: fileBridge ? 'android' : 'web', files, opener: web.opener, images: web.images, gallery };
  const subject = createAndroidSegmenter(win);
  if (subject) platform = { ...platform, subject };
  const share = createAndroidSharer(win);
  if (share) platform = { ...platform, share };
  const wallpaper = createAndroidWallpaper(win);
  if (wallpaper) platform = { ...platform, wallpaper };
  const shell = win.AndroidShell;
  if (shell && typeof shell.screenSize === 'function') {
    const read = shell.screenSize.bind(shell);
    platform = { ...platform, screenSize: () => parseScreenSize(read) };
  }
  return platform;
}

/** Chọn bản nền tảng theo nơi app đang chạy: trong vỏ Android có cầu nối thì dùng Android. */
export function createPlatform(): Platform {
  const win = window as unknown as AndroidBridgeWindow;
  return win.AndroidFileSaver ? createAndroidPlatform(win) : createWebPlatform();
}
