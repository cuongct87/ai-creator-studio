import { describe, expect, it } from 'vitest';
import { SCHEMA_VERSION, clamp, isHexColor } from './index';

describe('@zunva/core', () => {
  it('dùng định dạng dữ liệu v2', () => {
    expect(SCHEMA_VERSION).toBe(2);
  });

  it('clamp giữ số trong khoảng', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
    expect(() => clamp(1, 10, 0)).toThrow(RangeError);
  });

  it('isHexColor nhận đúng mã màu', () => {
    expect(isHexColor('#16a6bd')).toBe(true);
    expect(isHexColor('#FFF')).toBe(true);
    expect(isHexColor('16a6bd')).toBe(false);
    expect(isHexColor('#12345')).toBe(false);
  });
});
