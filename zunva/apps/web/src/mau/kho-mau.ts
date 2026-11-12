/**
 * Kho mẫu đợt đầu (G3 R2): 15 mẫu nằm sẵn trong app, không cần mạng.
 *
 * Mỗi mẫu = mô tả ngắn ở đây (khổ, nền, các lớp chữ/hình) + một ảnh minh họa
 * `public/mau/anh/<id>.jpg` (Gemini vẽ, founder tạo 12/11/2026, nguồn gốc ghi trong
 * `.kiro/specs/g3-xuat-mau-nhieu-trang/nguon-goc-anh-mau.txt`). Chữ mẫu do GPT viết
 * (`tools/mau/chu-mau.json`), Claude kiểm độ dài từng ô.
 * Sửa mẫu = sửa mô tả này; ảnh thu nhỏ `public/mau/thu-nho/<id>.webp` dựng lại bằng
 * `apps/web/scripts/anh-thu-nho-mau.mjs` (CI chạy và tải lên artifact "anh-thu-nho-mau").
 *
 * Tọa độ theo px của trang, gốc ở góc trên trái. Chỉ dùng 6 phông OFL có sẵn trong app.
 */

export interface TemplateText {
  type: 'text';
  /** Tên ô chữ trong bản giao việc GPT (tieu_de, ten…). */
  key: string;
  text: string;
  x: number;
  y: number;
  width: number;
  fontFamily: 'Be Vietnam Pro' | 'Playfair Display' | 'Dancing Script' | 'Lora' | 'Montserrat' | 'Pacifico';
  fontSize: number;
  fontWeight: 400 | 700;
  italic: boolean;
  color: string;
  align: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing: number;
}

export interface TemplateShape {
  type: 'shape';
  shape: 'rect' | 'line';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string | null;
  stroke: string | null;
  strokeWidth: number;
  cornerRadius: number;
}

export type TemplateItem = TemplateText | TemplateShape;

export interface TemplateSpec {
  id: string;
  /** Trùng `StartOption.kind` của trang chủ. */
  kind: 'wedding' | 'obituary' | 'signboard' | 'sale-post' | 'social' | 'wallpaper';
  title: string;
  /** Từ khóa cho ô tìm (có dấu; gõ không dấu vẫn ra). */
  tags: readonly string[];
  width: number;
  height: number;
  /** Màu nền trang (dưới ảnh). */
  background: string;
  /** Kích thước thật của ảnh minh họa (px). */
  image: { width: number; height: number };
  /**
   * null = ảnh làm nền trang (phủ kín, không chạm nhầm khi sửa chữ).
   * Có khung = ảnh là một lớp riêng ở vị trí này (bảng hiệu: ảnh bên phải, chữ bên trái).
   */
  picture: { x: number; y: number; width: number; height: number } | null;
  /** Thứ tự vẽ: phần tử đầu ở dưới cùng. */
  items: readonly TemplateItem[];
}

/** Đường dẫn tương đối (chạy được cả web lẫn trong APK). */
export const templateImageUrl = (id: string) => `./mau/anh/${id}.jpg`;
export const templateThumbUrl = (id: string) => `./mau/thu-nho/${id}.webp`;

type TextStyle = Omit<TemplateText, 'type' | 'key' | 'text' | 'x' | 'y' | 'width'>;

const text = (key: string, value: string, box: { x: number; y: number; width: number }, style: TextStyle): TemplateText => ({
  type: 'text',
  key,
  text: value,
  ...box,
  ...style,
});

const style = (
  fontFamily: TemplateText['fontFamily'],
  fontSize: number,
  color: string,
  more: Partial<Omit<TextStyle, 'fontFamily' | 'fontSize' | 'color'>> = {},
): TextStyle => ({
  fontFamily,
  fontSize,
  color,
  fontWeight: 400,
  italic: false,
  align: 'center',
  lineHeight: 1.3,
  letterSpacing: 0,
  ...more,
});

const line = (x: number, y: number, width: number, stroke: string, strokeWidth: number): TemplateShape => ({
  type: 'shape',
  shape: 'line',
  x,
  y,
  width,
  height: strokeWidth * 2,
  fill: null,
  stroke,
  strokeWidth,
  cornerRadius: 0,
});

const pill = (x: number, y: number, width: number, height: number, fill: string): TemplateShape => ({
  type: 'shape',
  shape: 'rect',
  x,
  y,
  width,
  height,
  fill,
  stroke: null,
  strokeWidth: 0,
  cornerRadius: height / 2,
});

const A5 = { width: 1748, height: 2480 } as const;
const POST = { width: 1080, height: 1350 } as const;
const SQUARE = { width: 1080, height: 1080 } as const;
const PHONE = { width: 1080, height: 2340 } as const;
const SIGN = { width: 3000, height: 1000 } as const;
const PORTRAIT_IMG = { width: 896, height: 1200 } as const;

export const TEMPLATES: readonly TemplateSpec[] = [
  // ——— Thiệp cưới ———
  {
    id: 'thiep-cuoi-hoa-hong',
    kind: 'wedding',
    title: 'Thiệp cưới hoa hồng',
    tags: ['thiệp cưới', 'hoa hồng', 'màu nước', 'hồng', 'trang trọng'],
    ...A5,
    background: '#fbf8f1',
    image: PORTRAIT_IMG,
    picture: null,
    items: [
      text('tieu_de', 'Trân trọng kính mời', { x: 274, y: 620, width: 1200 }, style('Playfair Display', 84, '#8c5a63', { italic: true, letterSpacing: 2 })),
      text('ten', '[Tên chú rể] & [Tên cô dâu]', { x: 174, y: 760, width: 1400 }, style('Dancing Script', 150, '#b5536f', { fontWeight: 700, lineHeight: 1.15 })),
      text('loi_moi', 'Xin mời [Tên khách mời] đến dự tiệc cưới\nvà chung vui cùng gia đình chúng tôi.', { x: 224, y: 1180, width: 1300 }, style('Lora', 54, '#5b4a4a', { lineHeight: 1.45 })),
      line(724, 1400, 300, '#d9a5b3', 4),
      text('thoi_gian', '[Giờ], [Thứ], ngày [Ngày] tháng [Tháng] năm [Năm] (nhằm [Ngày âm] âm lịch)', { x: 274, y: 1470, width: 1200 }, style('Lora', 50, '#5b4a4a', { fontWeight: 700, lineHeight: 1.4 })),
      text('dia_diem', 'Tại: [Địa chỉ nhà hàng / tư gia]', { x: 274, y: 1670, width: 1200 }, style('Lora', 50, '#5b4a4a', { italic: true })),
    ],
  },
  {
    id: 'thiep-cuoi-la-xanh',
    kind: 'wedding',
    title: 'Thiệp cưới lá xanh',
    tags: ['thiệp cưới', 'lá xanh', 'tối giản', 'hiện đại', 'bạch đàn'],
    ...A5,
    background: '#fcfcf7',
    image: PORTRAIT_IMG,
    picture: null,
    items: [
      text('tieu_de', 'Thiệp mời cưới', { x: 374, y: 700, width: 1000 }, style('Montserrat', 54, '#5f7466', { letterSpacing: 10 })),
      text('ten', '[Tên chú rể] & [Tên cô dâu]', { x: 274, y: 820, width: 1200 }, style('Playfair Display', 120, '#2f4a3c', { italic: true, lineHeight: 1.2 })),
      text('loi_moi', 'Mời bạn đến dự tiệc cưới và chung vui cùng chúng mình.', { x: 374, y: 1160, width: 1000 }, style('Montserrat', 46, '#4d5a52', { lineHeight: 1.5 })),
      text('thoi_gian', '[Giờ] · [Ngày/tháng/năm]', { x: 374, y: 1340, width: 1000 }, style('Montserrat', 56, '#2f4a3c', { fontWeight: 700 })),
      text('dia_diem', 'Tại: [Tên địa điểm], [Địa chỉ]', { x: 374, y: 1440, width: 1000 }, style('Montserrat', 46, '#4d5a52')),
    ],
  },
  {
    id: 'thiep-cuoi-do-truyen-thong',
    kind: 'wedding',
    title: 'Thiệp cưới đỏ truyền thống',
    tags: ['thiệp cưới', 'truyền thống', 'đỏ', 'hoa mai', 'lễ thành hôn', 'vu quy', 'tân hôn'],
    ...A5,
    background: '#930e09',
    image: PORTRAIT_IMG,
    picture: null,
    items: [
      text('tieu_de', 'Lễ Thành Hôn', { x: 274, y: 420, width: 1200 }, style('Playfair Display', 104, '#f4cf6a', { fontWeight: 700, letterSpacing: 2 })),
      line(724, 600, 300, '#e2b552', 4),
      text('nha_trai', 'Nhà trai: Ông [Tên cha chú rể] – Bà [Tên mẹ chú rể]\nĐịa chỉ: [Địa chỉ nhà trai]', { x: 174, y: 780, width: 1400 }, style('Lora', 46, '#fbe7b5', { lineHeight: 1.45 })),
      text('nha_gai', 'Nhà gái: Ông [Tên cha cô dâu] – Bà [Tên mẹ cô dâu]\nĐịa chỉ: [Địa chỉ nhà gái]', { x: 174, y: 970, width: 1400 }, style('Lora', 46, '#fbe7b5', { lineHeight: 1.45 })),
      text('loi_moi', 'Trân trọng kính mời quý khách dự lễ thành hôn\ncủa [Tên chú rể] và [Tên cô dâu].', { x: 174, y: 1200, width: 1400 }, style('Lora', 54, '#fff3d6', { italic: true, lineHeight: 1.45 })),
      text('thoi_gian', '[Giờ], [Thứ], ngày [Ngày] tháng [Tháng] năm [Năm] (nhằm [Ngày âm] âm lịch)', { x: 274, y: 1420, width: 1200 }, style('Lora', 50, '#f4cf6a', { fontWeight: 700, lineHeight: 1.4 })),
      text('dia_diem', 'Tại: [Địa điểm tổ chức], [Địa chỉ]', { x: 324, y: 1600, width: 1100 }, style('Lora', 48, '#fbe7b5')),
    ],
  },

  // ——— Cáo phó ———
  {
    id: 'cao-pho-hoa-sen',
    kind: 'obituary',
    title: 'Cáo phó hoa sen',
    tags: ['cáo phó', 'hoa sen', 'tang lễ', 'trang nghiêm', 'thủy mặc'],
    ...A5,
    background: '#ecede7',
    image: PORTRAIT_IMG,
    picture: null,
    items: [
      text('tieu_de', 'CÁO PHÓ', { x: 274, y: 250, width: 1200 }, style('Playfair Display', 150, '#2b2b2b', { fontWeight: 700, letterSpacing: 20 })),
      text('loi_bao', 'Gia đình chúng tôi vô cùng thương tiếc\nkính báo tin buồn đến họ hàng và bằng hữu:', { x: 174, y: 500, width: 1400 }, style('Lora', 50, '#3a3a3a', { italic: true, lineHeight: 1.45 })),
      text('ten', '[Họ và tên người mất]', { x: 174, y: 700, width: 1400 }, style('Playfair Display', 96, '#1f1f1f', { fontWeight: 700 })),
      text('thong_tin', 'Sinh năm [Năm sinh]\nTừ trần ngày [Ngày mất]\nHưởng thọ [Số tuổi] tuổi', { x: 274, y: 880, width: 1200 }, style('Lora', 50, '#3a3a3a', { lineHeight: 1.5 })),
      text('tang_le', 'Lễ nhập quan: [Ngày giờ nhập quan]\nLễ di quan: [Ngày giờ di quan]\nLễ an táng: [Ngày giờ an táng], tại [Nơi an táng]', { x: 174, y: 1180, width: 1400 }, style('Lora', 46, '#3a3a3a', { lineHeight: 1.5 })),
      text('tang_gia', 'Tang gia đồng kính báo', { x: 374, y: 1500, width: 1000 }, style('Lora', 52, '#2b2b2b', { fontWeight: 700, italic: true })),
    ],
  },
  {
    id: 'cao-pho-hoa-cuc',
    kind: 'obituary',
    title: 'Cáo phó hoa cúc',
    tags: ['cáo phó', 'hoa cúc', 'tang lễ', 'giản dị', 'trắng'],
    ...A5,
    background: '#fbfbfb',
    image: { width: 896, height: 1271 },
    picture: null,
    items: [
      text('tieu_de', 'CÁO PHÓ', { x: 274, y: 300, width: 1200 }, style('Montserrat', 130, '#333333', { fontWeight: 700, letterSpacing: 24 })),
      line(774, 490, 200, '#8a8a8a', 4),
      text('loi_bao', 'Gia đình xin báo tin buồn đến họ hàng và bạn bè:', { x: 224, y: 560, width: 1300 }, style('Montserrat', 48, '#444444', { lineHeight: 1.45 })),
      text('ten', '[Họ và tên người mất]', { x: 174, y: 760, width: 1400 }, style('Montserrat', 92, '#222222', { fontWeight: 700 })),
      text('thong_tin', 'Sinh năm [Năm sinh]. Mất ngày [Ngày mất]. Hưởng thọ [Số tuổi] tuổi.', { x: 274, y: 940, width: 1200 }, style('Montserrat', 46, '#444444', { lineHeight: 1.5 })),
      text('tang_le', 'Nhập quan: [Ngày giờ nhập quan]. Di quan: [Ngày giờ di quan]. An táng tại [Nơi an táng].', { x: 274, y: 1160, width: 1200 }, style('Montserrat', 46, '#444444', { lineHeight: 1.5 })),
      text('tang_gia', 'Gia đình kính báo', { x: 374, y: 1480, width: 1000 }, style('Montserrat', 50, '#333333', { italic: true })),
    ],
  },

  // ——— Bảng hiệu (3000×1000, ảnh bên phải liền màu nền) ———
  {
    id: 'bang-hieu-ca-phe',
    kind: 'signboard',
    title: 'Bảng hiệu quán cà phê',
    tags: ['bảng hiệu', 'cà phê', 'quán', 'cafe', 'nâu'],
    ...SIGN,
    background: '#faf3e1',
    image: { width: 1376, height: 768 },
    picture: { x: 1208, y: 0, width: 1792, height: 1000 },
    items: [
      text('ten_quan', '[Tên quán]', { x: 140, y: 190, width: 2000 }, style('Playfair Display', 260, '#5a3620', { fontWeight: 700, align: 'left', lineHeight: 1.1 })),
      text('khau_hieu', 'Ghé quán, nhâm nhi ly cà phê', { x: 150, y: 520, width: 2000 }, style('Lora', 110, '#8a5a3a', { italic: true, align: 'left' })),
      text('dien_thoai', 'ĐT: [Số điện thoại]', { x: 150, y: 740, width: 2000 }, style('Montserrat', 90, '#5a3620', { fontWeight: 700, align: 'left' })),
    ],
  },
  {
    id: 'bang-hieu-sua-xe',
    kind: 'signboard',
    title: 'Bảng hiệu tiệm sửa xe',
    tags: ['bảng hiệu', 'sửa xe', 'xe máy', 'tiệm', 'vá lốp', 'thay nhớt'],
    ...SIGN,
    background: '#081936',
    image: { width: 1376, height: 768 },
    picture: { x: 1208, y: 0, width: 1792, height: 1000 },
    items: [
      text('ten_tiem', '[Tên tiệm sửa xe]', { x: 140, y: 170, width: 1950 }, style('Montserrat', 170, '#ffffff', { fontWeight: 700, align: 'left', lineHeight: 1.1 })),
      text('dich_vu', 'Vá lốp • Thay nhớt • Bảo dưỡng', { x: 150, y: 440, width: 1950 }, style('Montserrat', 100, '#ff7a1a', { align: 'left' })),
      pill(140, 680, 1300, 170, '#ff6a13'),
      text('dien_thoai', 'ĐT: [Số điện thoại]', { x: 140, y: 712, width: 1300 }, style('Montserrat', 92, '#ffffff', { fontWeight: 700, lineHeight: 1.15 })),
    ],
  },

  // ——— Bài bán hàng (1080×1350) ———
  {
    id: 'ban-hang-thoi-trang',
    kind: 'sale-post',
    title: 'Giảm giá thời trang',
    tags: ['bán hàng', 'giảm giá', 'sale', 'thời trang', 'quần áo', 'hồng'],
    ...POST,
    background: '#fce0dc',
    image: PORTRAIT_IMG,
    picture: null,
    items: [
      text('tieu_de', 'SALE CUỐI TUẦN', { x: 40, y: 90, width: 1000 }, style('Montserrat', 92, '#b8325f', { fontWeight: 700, letterSpacing: 2, lineHeight: 1.15 })),
      pill(140, 235, 800, 140, '#6f9bd6'),
      text('giam_gia', 'GIẢM ĐẾN [Mức]%', { x: 140, y: 268, width: 800 }, style('Montserrat', 66, '#ffffff', { fontWeight: 700, lineHeight: 1.15 })),
      text('mo_ta', 'Đồ xinh dễ phối, đi chơi hay đi làm đều hợp.\nGhé thử bộ bạn thích nhé!', { x: 60, y: 420, width: 960 }, style('Be Vietnam Pro', 38, '#5a3a46', { lineHeight: 1.4 })),
      text('thoi_gian', 'Từ [Ngày bắt đầu] đến [Ngày kết thúc]', { x: 60, y: 560, width: 960 }, style('Be Vietnam Pro', 38, '#b8325f', { fontWeight: 700 })),
      text('lien_he', 'Đặt hàng: [Số điện thoại]', { x: 60, y: 625, width: 960 }, style('Be Vietnam Pro', 36, '#5a3a46', { fontWeight: 700 })),
    ],
  },
  {
    id: 'ban-hang-com-tam',
    kind: 'sale-post',
    title: 'Bán cơm tấm',
    tags: ['bán hàng', 'cơm tấm', 'món ăn', 'quán ăn', 'thực đơn', 'menu', 'đồ ăn'],
    ...POST,
    background: '#eee0cc',
    image: PORTRAIT_IMG,
    picture: null,
    items: [
      text('ten_mon', 'CƠM TẤM SƯỜN NƯỚNG', { x: 60, y: 60, width: 960 }, style('Montserrat', 88, '#7a2e0e', { fontWeight: 700, lineHeight: 1.1 })),
      text('mo_ta', 'Sườn nướng thơm lừng, cơm tấm nóng hổi.\nĂn kèm đồ chua và nước mắm pha.', { x: 60, y: 285, width: 960 }, style('Be Vietnam Pro', 40, '#4a2a12', { lineHeight: 1.4 })),
      pill(290, 420, 500, 116, '#d9480f'),
      text('gia', 'Chỉ [Giá]đ', { x: 290, y: 444, width: 500 }, style('Montserrat', 60, '#ffffff', { fontWeight: 700, lineHeight: 1.15 })),
      text('lien_he', 'Đặt món: [Số điện thoại]', { x: 60, y: 558, width: 960 }, style('Be Vietnam Pro', 38, '#4a2a12', { fontWeight: 700 })),
    ],
  },
  {
    id: 'ban-hang-my-pham',
    kind: 'sale-post',
    title: 'Khai trương mỹ phẩm',
    tags: ['bán hàng', 'khai trương', 'mỹ phẩm', 'làm đẹp', 'spa', 'ưu đãi'],
    ...POST,
    background: '#f3e9dd',
    image: PORTRAIT_IMG,
    picture: null,
    items: [
      text('tieu_de', 'KHAI TRƯƠNG', { x: 40, y: 150, width: 1000 }, style('Playfair Display', 96, '#8a5a44', { fontWeight: 700, letterSpacing: 4, lineHeight: 1.15 })),
      line(440, 320, 200, '#d7a58c', 4),
      text('uu_dai', 'Mừng khai trương, giảm [Mức giảm]%\ncho [Sản phẩm áp dụng].', { x: 60, y: 370, width: 960 }, style('Lora', 48, '#5e4033', { lineHeight: 1.4 })),
      text('thoi_gian', 'Lúc [Giờ], ngày [Ngày/tháng/năm]', { x: 60, y: 560, width: 960 }, style('Montserrat', 40, '#8a5a44', { fontWeight: 700 })),
      text('dia_chi', 'Tại: [Địa chỉ cửa hàng]', { x: 60, y: 630, width: 960 }, style('Montserrat', 38, '#5e4033')),
    ],
  },

  // ——— Mạng xã hội (1080×1080) ———
  {
    id: 'mxh-sinh-nhat',
    kind: 'social',
    title: 'Chúc mừng sinh nhật',
    tags: ['mạng xã hội', 'sinh nhật', 'chúc mừng', 'bóng bay', 'bánh kem'],
    ...SQUARE,
    background: '#fef8ec',
    image: { width: 1024, height: 1024 },
    picture: null,
    items: [
      text('tieu_de', 'Chúc mừng sinh nhật', { x: 190, y: 280, width: 700 }, style('Pacifico', 92, '#e0709a', { lineHeight: 1.25 })),
      text('loi_chuc', 'Chúc bạn tuổi mới nhiều niềm vui,\nluôn khỏe mạnh và bình an,\ncó thêm thời gian làm điều mình thích.', { x: 150, y: 560, width: 780 }, style('Be Vietnam Pro', 34, '#6b5560', { lineHeight: 1.5 })),
      text('ky_ten', 'Từ: [Tên bạn]', { x: 240, y: 760, width: 600 }, style('Dancing Script', 52, '#e0709a', { fontWeight: 700 })),
    ],
  },
  {
    id: 'mxh-trich-dan',
    kind: 'social',
    title: 'Câu nói hay',
    tags: ['mạng xã hội', 'câu nói', 'trích dẫn', 'truyền cảm hứng', 'bình minh'],
    ...SQUARE,
    background: '#f6e5ed',
    image: { width: 1024, height: 1024 },
    picture: null,
    items: [
      text('cau_noi', 'Kiên nhẫn với những lần đầu vụng về,\nta cho mình thêm cơ hội\nđể làm tốt điều mình yêu.', { x: 60, y: 360, width: 960 }, style('Playfair Display', 46, '#5a3f5c', { italic: true, lineHeight: 1.45 })),
      line(490, 630, 100, '#a07fa3', 3),
      text('ky_ten', '— [Tên trang của bạn]', { x: 140, y: 670, width: 800 }, style('Montserrat', 34, '#6e5470', { letterSpacing: 2 })),
    ],
  },

  // ——— Hình nền điện thoại (chỉ ảnh; khổ đổi theo màn hình máy khi mở) ———
  {
    id: 'hinh-nen-hoa-pastel',
    kind: 'wallpaper',
    title: 'Hình nền hoa pastel',
    tags: ['hình nền', 'hoa', 'pastel', 'màu nước', 'xanh nhạt', 'dễ thương'],
    ...PHONE,
    background: '#e3f2f9',
    image: { width: 768, height: 1376 },
    picture: null,
    items: [],
  },
  {
    id: 'hinh-nen-song-nuoc-mien-tay',
    kind: 'wallpaper',
    title: 'Hình nền sông nước miền Tây',
    tags: ['hình nền', 'miền tây', 'sông nước', 'hoàng hôn', 'dừa nước', 'quê hương'],
    ...PHONE,
    background: '#a4848f',
    image: { width: 768, height: 1376 },
    picture: null,
    items: [],
  },
  {
    id: 'hinh-nen-hinh-hoc',
    kind: 'wallpaper',
    title: 'Hình nền khối tròn',
    tags: ['hình nền', 'tối giản', 'hình học', 'pastel', 'hiện đại'],
    ...PHONE,
    background: '#f9faf4',
    image: { width: 768, height: 1376 },
    picture: null,
    items: [],
  },
];
