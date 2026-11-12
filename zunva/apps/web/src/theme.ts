/**
 * Màu giao diện của Artio (G2 R2). Chỉ đổi màu app, không đổi màu thiết kế của người dùng.
 * Founder chốt 12/11/2026: mặc định nền xanh nhạt + nút hồng phấn; có thêm Hồng phấn và Tối.
 */

export type ThemeId = 'xanh' | 'hong' | 'toi';

export interface ThemeColors {
  /** Nền trang. */
  bg: string;
  /** Nền thẻ, thanh tab. */
  surface: string;
  /** Chữ chính. */
  ink: string;
  /** Chữ phụ. */
  muted: string;
  /** Viền. */
  line: string;
  /** Nền nút chính (hồng phấn). */
  accent: string;
  /** Chữ trên nút chính. */
  onAccent: string;
  /** Màu nhấn dùng làm chữ/biểu tượng trên nền thẻ (tab đang chọn, liên kết). */
  accentInk: string;
}

export interface Theme {
  id: ThemeId;
  label: string;
  dark: boolean;
  colors: ThemeColors;
}

export const THEMES: readonly Theme[] = [
  {
    id: 'xanh',
    label: 'Xanh nhạt',
    dark: false,
    colors: {
      bg: '#e8f3fb',
      surface: '#ffffff',
      ink: '#10263b',
      muted: '#4a6176',
      line: '#cbdeec',
      accent: '#f7b6cf',
      onAccent: '#5e0f30',
      accentInk: '#ad2459',
    },
  },
  {
    id: 'hong',
    label: 'Hồng phấn',
    dark: false,
    colors: {
      bg: '#fdeef4',
      surface: '#ffffff',
      ink: '#3a1424',
      muted: '#75495b',
      line: '#f1cfdc',
      accent: '#f2a3c0',
      onAccent: '#560c2b',
      accentInk: '#a8204f',
    },
  },
  {
    id: 'toi',
    label: 'Tối',
    dark: true,
    colors: {
      bg: '#0f1622',
      surface: '#1a2434',
      ink: '#eef3fa',
      muted: '#a7b5c8',
      line: '#33425a',
      accent: '#f2a3c0',
      onAccent: '#3b0a1e',
      accentInk: '#f7b6cf',
    },
  },
];

export const DEFAULT_THEME: ThemeId = 'xanh';
const STORAGE_KEY = 'artio.theme';

export function getTheme(id: string | null | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES.find((t) => t.id === DEFAULT_THEME)!;
}

/** Độ sáng tương đối theo WCAG 2.x. */
function luminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16);
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

/** Tỉ lệ tương phản WCAG giữa hai màu #rrggbb (1 → 21). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Đọc lựa chọn đã lưu trên máy; trình duyệt chặn bộ nhớ thì dùng mặc định. */
export function loadThemeId(): ThemeId {
  try {
    return getTheme(globalThis.localStorage?.getItem(STORAGE_KEY)).id;
  } catch {
    return DEFAULT_THEME;
  }
}

export function saveThemeId(id: ThemeId): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, id);
  } catch {
    // Không lưu được (chế độ riêng tư…): vẫn đổi màu trong lần dùng này.
  }
}

/** Gắn màu vào trang: biến CSS trên <html>, kèm màu thanh trạng thái trình duyệt. */
export function applyTheme(id: ThemeId, doc: Document = document): void {
  const theme = getTheme(id);
  const root = doc.documentElement;
  root.dataset['theme'] = theme.id;
  root.style.colorScheme = theme.dark ? 'dark' : 'light';
  const map: Record<keyof ThemeColors, string> = {
    bg: '--bg',
    surface: '--surface',
    ink: '--ink',
    muted: '--muted',
    line: '--line',
    accent: '--accent',
    onAccent: '--on-accent',
    accentInk: '--accent-ink',
  };
  for (const key of Object.keys(map) as Array<keyof ThemeColors>) root.style.setProperty(map[key], theme.colors[key]);
  let meta = doc.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = doc.createElement('meta');
    meta.name = 'theme-color';
    doc.head.append(meta);
  }
  meta.content = theme.colors.surface;
  // Vỏ Android: tô dải thanh trạng thái / điều hướng cùng màu nền app.
  const shell = (doc.defaultView as (Window & { AndroidShell?: { setBarColor(hex: string): void } }) | null)?.AndroidShell;
  try {
    shell?.setBarColor(theme.colors.bg);
  } catch {
    // Cầu nối lỗi thì giữ màu mặc định, không ảnh hưởng app.
  }
}
