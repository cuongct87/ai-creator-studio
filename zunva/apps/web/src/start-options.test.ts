import { describe, expect, it } from 'vitest';
import { normalizeVi, PAGE_SIZES, searchStartOptions, START_OPTIONS } from './start-options';

const labels = (q: string) => searchStartOptions(q).map((o) => o.label);

describe('trang chủ: cách bắt đầu và ô tìm', () => {
  it('bỏ dấu tiếng Việt đúng, kể cả chữ đ', () => {
    expect(normalizeVi('  Thiệp CƯỚI   Đẹp ')).toBe('thiep cuoi dep');
    expect(normalizeVi('Cáo phó')).toBe('cao pho');
  });

  it('gõ có dấu hay không dấu đều ra đúng loại', () => {
    expect(labels('thiệp cưới')).toEqual(['Thiệp cưới']);
    expect(labels('thiep cuoi')).toEqual(['Thiệp cưới']);
    expect(labels('dam cuoi')).toEqual(['Thiệp cưới']);
    expect(labels('khai truong')).toEqual(['Bảng hiệu']);
    expect(labels('giam gia')).toEqual(['Bài bán hàng']);
    expect(labels('zalo')).toEqual(['Mạng xã hội']);
    expect(labels('phan uu')).toEqual(['Cáo phó']);
  });

  it('ô tìm trống thì hiện tất cả; không khớp thì rỗng', () => {
    expect(labels('')).toHaveLength(START_OPTIONS.length);
    expect(labels('xyz không có')).toEqual([]);
  });

  it('mỗi khổ và mỗi loại có kích thước hợp lệ', () => {
    for (const s of PAGE_SIZES) {
      expect(s.width >= 100 && s.height >= 100 && s.width <= 8000 && s.height <= 8000).toBe(true);
    }
    expect(new Set(START_OPTIONS.map((o) => o.kind)).size).toBe(START_OPTIONS.length);
  });
});
