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
    const { win, calls } = bridge('{"ok":true,"location":"Tải xuống/Artio"}');
    const p = createAndroidPlatform(win, fakeDoc);
    expect(p.name).toBe('android');
    const r = await p.files.saveBytes('Thiệp cưới.zunva', 'application/octet-stream', new Uint8Array([1, 2, 3]));
    expect(r).toEqual({ ok: true, value: { location: 'Tải xuống/Artio' } });
    expect(calls[0]).toEqual({ fileName: 'Thiệp cưới.zunva', mimeType: 'application/octet-stream', base64: 'AQID' });
  });

  it('saveText gửi chữ UTF-8', async () => {
    const { win, calls } = bridge('{"ok":true,"location":"Tải xuống/Artio"}');
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
    const { win, calls } = bridge('{"ok":true,"location":"Tải xuống/Artio"}');
    const big = { length: ANDROID_MAX_SAVE_BYTES + 1 } as unknown as Uint8Array;
    const r = await createAndroidPlatform(win, fakeDoc).files.saveBytes('to.zunva', 'application/octet-stream', big);
    expect(r).toEqual({ ok: false, error: 'File quá lớn để lưu trên điện thoại (tối đa 100 MB).' });
    expect(calls).toHaveLength(0);
  });

  it('không có cầu nối thì dùng bản web', () => {
    expect(createAndroidPlatform({}, fakeDoc).name).toBe('web');
  });
});

describe('tách nền qua cầu nối Java (G2b)', () => {
  function subjectWindow(reply: (id: string, base64: string, win: AndroidBridgeWindow) => void) {
    const win: AndroidBridgeWindow = {
      AndroidFileSaver: { saveBytes: () => '{"ok":true}' },
      AndroidSubject: {
        segment(id, base64) {
          setTimeout(() => reply(id, base64, win), 1);
        },
      },
    };
    return win;
  }

  it('không có cầu nối → không có tách nền (app ẩn nút)', () => {
    expect(createAndroidPlatform(bridge('{"ok":true}').win, fakeDoc).subject).toBeUndefined();
  });

  it('trả mặt nạ PNG đúng từng byte', async () => {
    const mask = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 255]);
    let sent = '';
    const win = subjectWindow((id, b64, w) => {
      sent = b64;
      w.__artioSegmentDone?.(id, JSON.stringify({ ok: true, mask: toBase64(mask) }));
    });
    const r = await createAndroidPlatform(win, fakeDoc).subject!.segment(new Uint8Array([1, 2, 3]));
    expect(sent).toBe(toBase64(new Uint8Array([1, 2, 3])));
    expect(r).toEqual({ ok: true, value: mask });
  });

  it('không thấy chủ thể → null; lỗi Java → câu báo tiếng Việt', async () => {
    const none = subjectWindow((id, _b, w) => w.__artioSegmentDone?.(id, '{"ok":true,"mask":null}'));
    expect(await createAndroidPlatform(none, fakeDoc).subject!.segment(new Uint8Array([1]))).toEqual({ ok: true, value: null });
    const err = subjectWindow((id, _b, w) => w.__artioSegmentDone?.(id, '{"ok":false,"error":"Máy đang tải bộ tách nền"}'));
    expect(await createAndroidPlatform(err, fakeDoc).subject!.segment(new Uint8Array([1]))).toEqual({ ok: false, error: 'Máy đang tải bộ tách nền' });
    const junk = subjectWindow((id, _b, w) => w.__artioSegmentDone?.(id, 'rác'));
    const j = await createAndroidPlatform(junk, fakeDoc).subject!.segment(new Uint8Array([1]));
    expect(j.ok).toBe(false);
  });

  it('Java không trả lời → hết giờ, báo lỗi', async () => {
    const win = subjectWindow(() => {});
    const { createAndroidSegmenter } = await import('./android-platform');
    const r = await createAndroidSegmenter(win, 20)!.segment(new Uint8Array([1]));
    expect(r.ok).toBe(false);
  });
});

describe('xuất và chia sẻ (G3)', () => {
  it('ảnh xuất lưu vào Ảnh/Artio qua saveImageBytes, có uri để chia sẻ', async () => {
    const calls: string[] = [];
    const win: AndroidBridgeWindow = {
      AndroidFileSaver: {
        saveBytes: () => '{"ok":true,"location":"Tải xuống/Artio"}',
        saveImageBytes(fileName, mime) {
          calls.push(`${fileName}|${mime}`);
          return '{"ok":true,"location":"Ảnh/Artio","uri":"content://media/external/images/media/42"}';
        },
      },
    };
    const r = await createAndroidPlatform(win, fakeDoc).gallery.saveImage('Thiệp.jpg', new Uint8Array([0xff, 0xd8, 1]));
    expect(r).toEqual({ ok: true, value: { location: 'Ảnh/Artio', uri: 'content://media/external/images/media/42' } });
    expect(calls).toEqual(['Thiệp.jpg|image/jpeg']);
  });

  it('chia sẻ gửi danh sách uri sang Java; chưa lưu thì báo lỗi', async () => {
    let sent = '';
    const win: AndroidBridgeWindow = {
      AndroidFileSaver: { saveBytes: () => '{"ok":true}' },
      AndroidShare: {
        share(urisJson, mime) {
          sent = `${urisJson}|${mime}`;
          return '{"ok":true,"location":""}';
        },
      },
    };
    const sharer = createAndroidPlatform(win, fakeDoc).share!;
    const files = [
      { fileName: 'a - 1.png', mimeType: 'image/png', bytes: new Uint8Array([1]), uri: 'content://media/x/1' },
      { fileName: 'a - 2.png', mimeType: 'image/png', bytes: new Uint8Array([1]), uri: 'content://media/x/2' },
    ];
    expect(await sharer.share(files)).toEqual({ ok: true, value: undefined });
    expect(sent).toBe('["content://media/x/1","content://media/x/2"]|image/png');
    const r = await sharer.share([{ fileName: 'a.pdf', mimeType: 'application/pdf', bytes: new Uint8Array([1]) }]);
    expect(r.ok).toBe(false);
  });

  it('bản app cũ (không có saveImageBytes / AndroidShare): vẫn lưu ảnh kiểu cũ, không có chia sẻ', () => {
    const p = createAndroidPlatform(bridge('{"ok":true}').win, fakeDoc);
    expect(p.share).toBeUndefined();
  });
});

describe('hình nền điện thoại (G3 R4)', () => {
  it('kích thước màn hình từ Java; số lạ → null', async () => {
    const { parseScreenSize } = await import('./android-platform');
    expect(parseScreenSize(() => '{"width":1080,"height":2340}')).toEqual({ width: 1080, height: 2340 });
    expect(parseScreenSize(() => '{"width":0,"height":2340}')).toBeNull();
    expect(parseScreenSize(() => 'rác')).toBeNull();
    const win: AndroidBridgeWindow = { AndroidFileSaver: { saveBytes: () => '{"ok":true}' }, AndroidShell: { screenSize: () => '{"width":1440,"height":3120}' } };
    expect(createAndroidPlatform(win, fakeDoc).screenSize?.()).toEqual({ width: 1440, height: 3120 });
  });

  it('đặt hình nền: gửi ảnh + nơi đặt sang Java, nhận kết quả', async () => {
    const sent: string[] = [];
    const win: AndroidBridgeWindow = {
      AndroidFileSaver: { saveBytes: () => '{"ok":true}' },
      AndroidWallpaper: {
        setWallpaper(id, b64, target) {
          sent.push(`${b64}|${target}`);
          setTimeout(() => win.__artioWallpaperDone?.(id, target === 'lock' ? '{"ok":false,"error":"Máy không cho đặt hình nền."}' : '{"ok":true}'), 1);
        },
      },
    };
    const wp = createAndroidPlatform(win, fakeDoc).wallpaper!;
    expect(await wp.set(new Uint8Array([1, 2]), 'home')).toEqual({ ok: true, value: undefined });
    expect(await wp.set(new Uint8Array([1, 2]), 'lock')).toEqual({ ok: false, error: 'Máy không cho đặt hình nền.' });
    expect(sent).toEqual([`${toBase64(new Uint8Array([1, 2]))}|home`, `${toBase64(new Uint8Array([1, 2]))}|lock`]);
  });

  it('web / bản app cũ: không có đặt hình nền', () => {
    expect(createAndroidPlatform(bridge('{"ok":true}').win, fakeDoc).wallpaper).toBeUndefined();
  });
});
