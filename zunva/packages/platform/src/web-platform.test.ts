import { describe, expect, it } from 'vitest';
import { detectImageType } from './web-platform';

const bytes = (head: number[] | string, total = 16): Uint8Array => {
  const arr = typeof head === 'string' ? Array.from(head, (c) => c.charCodeAt(0)) : head;
  const out = new Uint8Array(Math.max(total, arr.length));
  out.set(arr);
  return out;
};

describe('nhận diện ảnh theo byte thật', () => {
  it('nhận đúng các kiểu ảnh thường gặp trên điện thoại', () => {
    expect(detectImageType(bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('image/png');
    expect(detectImageType(bytes([0xff, 0xd8, 0xff, 0xe1]))).toBe('image/jpeg');
    expect(detectImageType(bytes('RIFF\u0000\u0000\u0000\u0000WEBP'))).toBe('image/webp');
    expect(detectImageType(bytes('GIF89a'))).toBe('image/gif');
    expect(detectImageType(bytes('\u0000\u0000\u0000\u0018ftypheic'))).toBe('image/heic');
    expect(detectImageType(bytes('\u0000\u0000\u0000\u001cftypavif'))).toBe('image/avif');
  });

  it('từ chối file không phải ảnh dù bị đổi đuôi thành .png', () => {
    expect(detectImageType(bytes('%PDF-1.7 hello'))).toBeNull();
    expect(detectImageType(bytes('PK\u0003\u0004 zip file'))).toBeNull();
    expect(detectImageType(bytes('xin chào, chữ thường'))).toBeNull();
    expect(detectImageType(new Uint8Array(3))).toBeNull();
  });
});
