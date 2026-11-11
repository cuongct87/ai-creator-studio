import { describe, expect, it } from 'vitest';
import { ANDROID_MAX_SAVE_BYTES, createAndroidPlatform, toBase64 } from './android-platform';
import type { AndroidBridgeWindow } from './android-platform';

const fakeDoc = {} as Document;

function bridge(reply: string | (() => string)) {
  const calls: Array<{ fileName: string; mimeType: string; base64: string }> = [];
  const win: AndroidBridgeWindow = {
    AndroidFileSaver: {
      saveBytes(fileName, mimeType, base64) {
        calls.push({ fileName, mimeType, base64 });
        return typeof reply === 'string' ? reply : reply();
      },
    },
  };
  return { win, calls };
}

describe('nền tảng Android (cầu nối Java)', () => {
  it('mã hóa base64 đúng, kể cả file lớn hơn một khúc', () => {
    expect(toBase64(new TextEncoder().encode('Xin chào'))).toBe('WGluIGNow6Bv');
    const big = new Uint8Array(100_000).map((_, i) => i % 251);
    expect(atob(toBase64(big)).length).toBe(100_000);
    expect(atob(toBase64(big)).charCodeAt(99_999)).toBe(99_999 % 251);
  });

  it('lưu file qua AndroidFileSaver và trả nơi lưu', async () => {
    const { win, calls } = bridge('{"ok":true,"location":"Tải xuống/C87"}');
    const p = createAndroidPlatform(win, fakeDoc);
    expect(p.name).toBe('android');
    const r = await p.files.saveBytes('Thiệp cưới.zunva', 'application/octet-stream', new Uint8Array([1, 2, 3]));
    expect(r).toEqual({ ok: true, value: { location: 'Tải xuống/C87' } });
    expect(calls[0]).toEqual({ fileName: 'Thiệp cưới.zunva', mimeType: 'application/octet-stream', base64: 'AQID' });
  });

  it('saveText gửi chữ UTF-8', async () => {
    const { win, calls } = bridge('{"ok":true,"location":"Tải xuống/C87"}');
    await createAndroidPlatform(win, fakeDoc).files.saveText('a.json', 'application/json', 'Cần Thơ');
    expect(calls[0]?.base64).toBe(toBase64(new TextEncoder().encode('Cần Thơ')));
  });

  it('báo lỗi tiếng Việt khi Java báo lỗi, trả rác, hoặc ném lỗi', async () => {
    const err = await createAndroidPlatform(bridge('{"ok":false,"error":"Máy hết chỗ"}').win, fakeDoc).files.saveBytes('a', 'b', new Uint8Array(1));
    expect(err).toEqual({ ok: false, error: 'Máy hết chỗ' });
    const junk = await createAndroidPlatform(bridge('không phải JSON').win, fakeDoc).files.saveBytes('a', 'b', new Uint8Array(1));
    expect(junk.ok).toBe(false);
    const thrown = await createAndroidPlatform(
      bridge(() => {
        throw new Error('boom');
      }).win,
      fakeDoc,
    ).files.saveBytes('a', 'b', new Uint8Array(1));
    expect(thrown.ok).toBe(false);
  });

  it('file quá 100 MB bị từ chối trước khi gửi sang Java', async () => {
    const { win, calls } = bridge('{"ok":true,"location":"Tải xuống/C87"}');
    const big = { length: ANDROID_MAX_SAVE_BYTES + 1 } as unknown as Uint8Array;
    const r = await createAndroidPlatform(win, fakeDoc).files.saveBytes('to.zunva', 'application/octet-stream', big);
    expect(r).toEqual({ ok: false, error: 'File quá lớn để lưu trên điện thoại (tối đa 100 MB).' });
    expect(calls).toHaveLength(0);
  });

  it('không có cầu nối thì dùng bản web', () => {
    expect(createAndroidPlatform({}, fakeDoc).name).toBe('web');
  });
});
