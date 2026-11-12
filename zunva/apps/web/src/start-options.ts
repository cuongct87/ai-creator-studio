/**
 * Các cách bắt đầu trên trang chủ (G2 R3): chọn theo mục đích, mỗi loại tạo dự án đúng khổ.
 * Khổ in theo 300 dpi (A5 = 148×210 mm = 1748×2480 px).
 */

export interface PageSize {
  id: string;
  label: string;
  width: number;
  height: number;
}

export interface StartOption {
  /** Ghi vào `document.meta.kind`. */
  kind: string;
  label: string;
  /** Tên dự án mới. */
  projectName: string;
  /** Biểu tượng chữ đơn giản (không dùng hình của Canva). */
  icon: string;
  /** Màu nền nút tròn (pastel), chữ đậm cùng tông. */
  tint: string;
  ink: string;
  /** null = hỏi khổ (Trang trắng) hoặc lấy theo ảnh (Tải ảnh lên). */
  size: PageSize | null;
  /** Từ khóa để ô tìm khớp (viết có dấu; tìm không dấu vẫn ra). */
  keywords: readonly string[];
}

export const PAGE_SIZES: readonly PageSize[] = [
  { id: 'vuong', label: 'Vuông 1080×1080', width: 1080, height: 1080 },
  { id: 'doc', label: 'Bài đăng dọc 1080×1350', width: 1080, height: 1350 },
  { id: 'story', label: 'Story / màn hình điện thoại 1080×1920', width: 1080, height: 1920 },
  { id: 'hinh-nen', label: 'Hình nền điện thoại 1080×2340', width: 1080, height: 2340 },
  { id: 'ngang', label: 'Ngang 1920×1080', width: 1920, height: 1080 },
  { id: 'a5', label: 'Giấy A5 1748×2480', width: 1748, height: 2480 },
  { id: 'a4', label: 'Giấy A4 2480×3508', width: 2480, height: 3508 },
];

const size = (id: string): PageSize => PAGE_SIZES.find((s) => s.id === id)!;

export const START_OPTIONS: readonly StartOption[] = [
  {
    kind: 'wedding',
    label: 'Thiệp cưới',
    projectName: 'Thiệp cưới',
    icon: '♥',
    tint: '#fbd3e2',
    ink: '#8a1c47',
    size: size('a5'),
    keywords: ['thiệp cưới', 'đám cưới', 'lễ thành hôn', 'vu quy', 'tân hôn', 'hỷ', 'wedding'],
  },
  {
    kind: 'obituary',
    label: 'Cáo phó',
    projectName: 'Cáo phó',
    icon: '✝',
    tint: '#dfe3ea',
    ink: '#2f3b4c',
    size: size('a5'),
    keywords: ['cáo phó', 'tang lễ', 'phân ưu', 'tưởng niệm', 'đám tang'],
  },
  {
    kind: 'signboard',
    label: 'Bảng hiệu',
    projectName: 'Bảng hiệu',
    icon: '▭',
    tint: '#cfe8f7',
    ink: '#0f4c6e',
    size: { id: 'bang-hieu', label: 'Bảng hiệu 3000×1000', width: 3000, height: 1000 },
    keywords: ['bảng hiệu', 'biển hiệu', 'cửa hàng', 'quán', 'khai trương', 'banner'],
  },
  {
    kind: 'sale-post',
    label: 'Bài bán hàng',
    projectName: 'Bài bán hàng',
    icon: '%',
    tint: '#fde7c8',
    ink: '#7a4300',
    size: size('doc'),
    keywords: ['bán hàng', 'giảm giá', 'khuyến mãi', 'sale', 'menu', 'thực đơn', 'quảng cáo'],
  },
  {
    kind: 'social',
    label: 'Mạng xã hội',
    projectName: 'Bài mạng xã hội',
    icon: '◎',
    tint: '#d9f2e6',
    ink: '#14553a',
    size: size('vuong'),
    keywords: ['mạng xã hội', 'facebook', 'instagram', 'zalo', 'tiktok', 'bài đăng', 'story'],
  },
  {
    kind: 'wallpaper',
    label: 'Hình nền điện thoại',
    projectName: 'Hình nền điện thoại',
    icon: '▯',
    tint: '#fbe3ef',
    ink: '#7a1f4c',
    // Android dùng đúng kích thước màn hình máy (AndroidShell.screenSize); web dùng khổ này.
    size: size('hinh-nen'),
    keywords: ['hình nền', 'màn hình khóa', 'wallpaper', 'điện thoại', 'nền máy'],
  },
  {
    kind: 'blank',
    label: 'Trang trắng',
    projectName: 'Thiết kế mới',
    icon: '+',
    tint: '#ece6fb',
    ink: '#45307a',
    size: null,
    keywords: ['trang trắng', 'tự do', 'trống', 'khổ', 'a4', 'a5'],
  },
  {
    kind: 'photo',
    label: 'Tải ảnh lên',
    projectName: 'Ảnh của tôi',
    icon: '↑',
    tint: '#d4f1f4',
    ink: '#0d5560',
    size: null,
    keywords: ['tải ảnh', 'ảnh', 'hình', 'chỉnh ảnh', 'photo'],
  },
];

/** Bỏ dấu tiếng Việt, chữ thường, gộp khoảng trắng — để gõ "thiep cuoi" vẫn ra "Thiệp cưới". */
export function normalizeVi(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Lọc các cách bắt đầu theo ô tìm. Chuỗi rỗng → tất cả. */
export function searchStartOptions(query: string, options: readonly StartOption[] = START_OPTIONS): StartOption[] {
  const q = normalizeVi(query);
  if (q === '') return [...options];
  const words = q.split(' ');
  return options.filter((o) => {
    const haystack = normalizeVi([o.label, ...o.keywords].join(' '));
    return words.every((w) => haystack.includes(w));
  });
}
