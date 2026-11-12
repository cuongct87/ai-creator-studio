import type { FileSaver, GallerySaver, Platform, PlatformResult, SubjectSegmenter } from './index';
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
  AndroidFileSaver?: { saveBytes(fileName: string, mimeType: string, base64: string): string };
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

function parseBridgeReply(reply: unknown): PlatformResult<{ location: string }> {
  if (typeof reply !== 'string') return { ok: false, error: MESSAGES.bridgeFailed };
  try {
    const value = JSON.parse(reply) as { ok?: unknown; location?: unknown; error?: unknown };
    if (value.ok === true) {
      return { ok: true, value: { location: typeof value.location === 'string' ? value.location : 'Tải xuống' } };
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

  const gallery: GallerySaver = imageBridge
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

  const base: Platform = { name: fileBridge ? 'android' : 'web', files, opener: web.opener, images: web.images, gallery };
  const subject = createAndroidSegmenter(win);
  return subject ? { ...base, subject } : base;
}

/** Chọn bản nền tảng theo nơi app đang chạy: trong vỏ Android có cầu nối thì dùng Android. */
export function createPlatform(): Platform {
  const win = window as unknown as AndroidBridgeWindow;
  return win.AndroidFileSaver ? createAndroidPlatform(win) : createWebPlatform();
}
