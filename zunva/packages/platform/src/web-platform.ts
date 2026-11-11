import type { FileSaver, GallerySaver, ImagePicker, PickedImage, Platform, PlatformResult } from './index';

/**
 * Bản cài đặt nền tảng cho trình duyệt (G1-5).
 * - FileSaver, GallerySaver: tạo Blob rồi tải xuống bằng thẻ <a download>.
 * - ImagePicker: <input type="file" accept="image/*">.
 * Vỏ Capacitor (G1-7) sẽ thay bằng bản lưu thật vào Tải xuống / Thư viện ảnh.
 */

const MAX_IMAGE_BYTES = 50 * 1024 * 1024;
const DOWNLOAD_LOCATION = 'Thư mục Tải xuống';

const MESSAGES = {
  downloadFailed: 'Không tải được file xuống máy. Hãy thử lại.',
  notImage: 'File đã chọn không phải ảnh.',
  tooLarge: 'Ảnh quá lớn (tối đa 50 MB).',
  readFailed: 'Không đọc được ảnh đã chọn.',
} as const;

/** Removes characters that are not allowed in file names on Windows/Android. */
function safeFileName(name: string): string {
  const cleaned = Array.from(name, (ch) => (ch.charCodeAt(0) < 32 || '\\/:*?"<>|'.includes(ch) ? '_' : ch))
    .join('')
    .trim();
  return cleaned === '' ? 'zunva' : cleaned.slice(0, 120);
}

/** Guesses an image type from the first bytes (PNG, JPEG, WebP); PNG if unknown. */
function sniffImageType(bytes: Uint8Array): string {
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[8] === 0x57 && bytes[9] === 0x45) return 'image/webp';
  return 'image/png';
}

const ascii = (bytes: Uint8Array, from: number, to: number): string =>
  String.fromCharCode(...bytes.subarray(from, to));

/**
 * Nhận diện ảnh theo các byte đầu file, không tin đuôi file hay kiểu trình duyệt báo.
 * Trả null nếu không phải ảnh quen thuộc (PNG, JPEG, WebP, GIF, HEIC/HEIF, AVIF).
 */
export function detectImageType(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0x89 && ascii(bytes, 1, 4) === 'PNG') return 'image/png';
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP') return 'image/webp';
  if (ascii(bytes, 0, 4) === 'GIF8') return 'image/gif';
  if (ascii(bytes, 4, 8) === 'ftyp') {
    const brand = ascii(bytes, 8, 12);
    if (brand === 'avif' || brand === 'avis') return 'image/avif';
    if (['heic', 'heix', 'heim', 'heis', 'hevc', 'hevx', 'mif1', 'msf1'].includes(brand)) return 'image/heic';
  }
  return null;
}

export function createWebPlatform(doc: Document = document): Platform {
  function download(fileName: string, blob: Blob): PlatformResult<{ location: string }> {
    try {
      const url = URL.createObjectURL(blob);
      const a = doc.createElement('a');
      a.href = url;
      a.download = safeFileName(fileName);
      a.rel = 'noopener';
      a.style.display = 'none';
      doc.body.append(a);
      a.click();
      a.remove();
      // Give the browser time to start the download before freeing the memory.
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
      return { ok: true, value: { location: DOWNLOAD_LOCATION } };
    } catch {
      return { ok: false, error: MESSAGES.downloadFailed };
    }
  }

  const files: FileSaver = {
    async saveText(fileName, mimeType, content) {
      return download(fileName, new Blob([content], { type: mimeType }));
    },
    async saveBytes(fileName, mimeType, bytes) {
      return download(fileName, new Blob([bytes.slice()], { type: mimeType }));
    },
  };

  const gallery: GallerySaver = {
    async saveImage(fileName, bytes) {
      return download(fileName, new Blob([bytes.slice()], { type: sniffImageType(bytes) }));
    },
  };

  const images: ImagePicker = {
    pickImage() {
      return new Promise<PlatformResult<PickedImage | null>>((resolve) => {
        const input = doc.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        let settled = false;
        const finish = (result: PlatformResult<PickedImage | null>) => {
          if (settled) return;
          settled = true;
          input.remove();
          resolve(result);
        };
        input.addEventListener('cancel', () => finish({ ok: true, value: null }));
        input.addEventListener('change', () => {
          const file = input.files?.[0];
          if (!file) return finish({ ok: true, value: null });
          if (!file.type.startsWith('image/')) return finish({ ok: false, error: MESSAGES.notImage });
          if (file.size > MAX_IMAGE_BYTES) return finish({ ok: false, error: MESSAGES.tooLarge });
          file
            .arrayBuffer()
            .then((buf) => {
              const bytes = new Uint8Array(buf);
              // Đuôi file có thể bị đổi: kiểm tra byte thật, và dùng kiểu nhận diện được.
              const mimeType = detectImageType(bytes);
              if (mimeType === null) return finish({ ok: false, error: MESSAGES.notImage });
              finish({ ok: true, value: { name: file.name, mimeType, bytes } });
            })
            .catch(() => finish({ ok: false, error: MESSAGES.readFailed }));
        });
        doc.body.append(input);
        input.click();
      });
    },
  };

  return { name: 'web', files, images, gallery };
}
