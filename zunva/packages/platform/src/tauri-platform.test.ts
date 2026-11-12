import { describe, expect, it } from 'vitest';
import { createTauriPlatform, isTauri, type TauriWindow } from './tauri-platform';

type Call = { cmd: string; args: unknown; headers: Record<string, string> | undefined };

function fakeTauri(reply: (call: Call) => unknown): { win: TauriWindow; calls: Call[] } {
  const calls: Call[] = [];
  const win: TauriWindow = {
    __TAURI_INTERNALS__: {
      async invoke(cmd, args, options) {
        const call = { cmd, args, headers: options?.headers };
        calls.push(call);
        return reply(call);
      },
    },
  };
  return { win, calls };
}

/** Trang giả tối thiểu: chỉ cần cho phần chọn file dùng lại từ bản web (không gọi trong test này). */
const doc = {} as Document;

describe('nền tảng Windows (Tauri)', () => {
  it('nhận ra vỏ Tauri, không nhầm với trình duyệt hay Android', () => {
    expect(isTauri(fakeTauri(() => null).win)).toBe(true);
    expect(isTauri({})).toBe(false);
    expect(isTauri(null)).toBe(false);
    expect(isTauri({ __TAURI_INTERNALS__: {} })).toBe(false);
  });

  it('ảnh lưu vào Ảnh/Artio, PDF và .zunva vào Tải xuống/Artio; gửi byte thô, tên mã hóa URL', async () => {
    const { win, calls } = fakeTauri((c) => `C:\\Users\\a\\${c.headers?.['x-artio-folder']}\\Artio\\x`);
    const p = createTauriPlatform(win, doc);
    expect(p.name).toBe('windows');

    const png = new Uint8Array([1, 2, 3]);
    const img = await p.gallery.saveImage('Thiệp cưới - 1.png', png);
    expect(img).toEqual({ ok: true, value: { location: 'Ảnh/Artio', uri: 'C:\\Users\\a\\pictures\\Artio\\x' } });
    expect(calls[0]).toEqual({
      cmd: 'save_file',
      args: png,
      headers: { 'x-artio-folder': 'pictures', 'x-artio-name': encodeURIComponent('Thiệp cưới - 1.png') },
    });

    const pdf = await p.files.saveBytes('Thiệp.pdf', 'application/pdf', new Uint8Array([9]));
    expect(pdf.ok && pdf.value.location).toBe('Tải xuống/Artio');
    expect(calls[1]?.headers?.['x-artio-folder']).toBe('downloads');

    await p.files.saveText('a.json', 'application/json', 'chào');
    expect(calls[2]?.args).toEqual(new TextEncoder().encode('chào'));
  });

  it('lỗi từ Rust (chuỗi tiếng Việt) chuyển nguyên cho người dùng; lỗi lạ → câu chung', async () => {
    const rust = createTauriPlatform(fakeTauri(() => Promise.reject('Ổ đĩa đầy, không lưu được file.')).win, doc);
    expect(await rust.gallery.saveImage('a.png', new Uint8Array(1))).toEqual({ ok: false, error: 'Ổ đĩa đầy, không lưu được file.' });
    const odd = createTauriPlatform(fakeTauri(() => Promise.reject(new Error('x'))).win, doc);
    expect(await odd.gallery.saveImage('a.png', new Uint8Array(1))).toEqual({ ok: false, error: 'Không lưu được file vào máy. Hãy thử lại.' });
    const empty = createTauriPlatform(fakeTauri(() => '').win, doc);
    expect((await empty.files.saveBytes('a.pdf', 'application/pdf', new Uint8Array(1))).ok).toBe(false);
  });

  it('"Mở thư mục" gọi reveal_file với đường dẫn đã lưu; không có chia sẻ, tách nền, hình nền', async () => {
    const { win, calls } = fakeTauri(() => null);
    const p = createTauriPlatform(win, doc);
    expect(await p.reveal?.('C:\\x\\Artio\\a.png')).toEqual({ ok: true, value: undefined });
    expect(calls[0]).toEqual({ cmd: 'reveal_file', args: { path: 'C:\\x\\Artio\\a.png' }, headers: undefined });
    expect(p.share).toBeUndefined();
    expect(p.subject).toBeUndefined();
    expect(p.wallpaper).toBeUndefined();
  });
});
