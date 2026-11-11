import type { Id } from './model';

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

/** Hàm sinh số ngẫu nhiên trong [0, 1). Truyền vào để test cho ra kết quả lặp lại được. */
export type RandomSource = () => number;

/**
 * Tạo bộ sinh ID dạng `tiền-tố_xxxxxxxxxxxxxxxx` (16 ký tự base36, ~82 bit).
 * Lõi không dùng `crypto` của trình duyệt để chạy được ở mọi nơi; vỏ ứng dụng có thể
 * truyền nguồn ngẫu nhiên tốt hơn.
 */
export function createIdGenerator(random: RandomSource = Math.random): (prefix: string) => Id {
  return (prefix: string) => {
    let out = '';
    for (let i = 0; i < 16; i++) {
      out += ALPHABET.charAt(Math.floor(random() * ALPHABET.length));
    }
    return `${prefix}_${out}`;
  };
}

/** Nguồn ngẫu nhiên có hạt giống (mulberry32), chỉ dùng cho test và dữ liệu mẫu. */
export function seededRandom(seed: number): RandomSource {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
