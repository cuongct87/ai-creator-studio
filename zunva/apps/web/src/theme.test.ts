import { describe, expect, it } from 'vitest';
import { contrastRatio, DEFAULT_THEME, getTheme, THEMES } from './theme';

describe('màu giao diện', () => {
  it('có đủ 3 màu, mặc định là xanh nhạt', () => {
    expect(THEMES.map((t) => t.id)).toEqual(['xanh', 'hong', 'toi']);
    expect(DEFAULT_THEME).toBe('xanh');
    expect(getTheme('khong-co').id).toBe('xanh');
    expect(getTheme(null).id).toBe('xanh');
  });

  it('tính tương phản đúng chuẩn WCAG', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
  });

  for (const theme of THEMES) {
    it(`"${theme.label}": mọi chữ đủ đậm để đọc (≥ 4.5:1)`, () => {
      const c = theme.colors;
      const pairs: Array<[string, string, string]> = [
        ['chữ chính / nền', c.ink, c.bg],
        ['chữ chính / thẻ', c.ink, c.surface],
        ['chữ phụ / thẻ', c.muted, c.surface],
        ['chữ phụ / nền', c.muted, c.bg],
        ['chữ trên nút hồng', c.onAccent, c.accent],
        ['màu nhấn / thẻ', c.accentInk, c.surface],
      ];
      for (const [name, fg, bg] of pairs) {
        expect({ name, ok: contrastRatio(fg, bg) >= 4.5 }).toEqual({ name, ok: true });
      }
    });
  }
});
