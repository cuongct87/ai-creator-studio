/**
 * Mô hình dữ liệu thiết kế, định dạng v2.
 *
 * Nguyên tắc:
 * - Dữ liệu là gốc; thư viện vẽ (Konva/Fabric) chỉ hiển thị, không giữ trạng thái riêng.
 * - Mọi phần tử (trang, lớp, tài nguyên) có ID cố định, duy nhất trong cả tài liệu.
 * - Không có trường tùy chọn kiểu "có thể vắng mặt": trường chưa dùng để `null`,
 *   để dữ liệu lưu ra luôn cùng một hình dạng.
 * - Ảnh/phông không nằm trong tài liệu, chỉ được tham chiếu qua `assetId` (kho tài nguyên ở G1-5).
 */

export const SCHEMA_VERSION = 3;

/** Kiểu hòa trộn lớp với phần bên dưới (G2b). Tên giống CSS `mix-blend-mode`. */
export const BLEND_MODES = [
  'normal',
  'multiply',
  'screen',
  'overlay',
  'soft-light',
  'darken',
  'lighten',
  'difference',
  'color',
  'luminosity',
] as const;
export type BlendMode = (typeof BLEND_MODES)[number];

export type Id = string;

/** Thời gian (cho video sau 1.0). Ở 1.0 luôn là null. */
export interface Timing {
  /** Giây kể từ đầu trang. */
  start: number;
  /** Số giây hiển thị. */
  duration: number;
}

/** Hiệu ứng chuyển động (sau 1.0). Ở 1.0 luôn là null. */
export interface Animation {
  name: string;
  params: Readonly<Record<string, number | string | boolean>>;
}

interface LayerBase {
  id: Id;
  /** Tên hiện trong bảng Lớp; null = tự sinh từ nội dung. */
  name: string | null;
  /** Vị trí và kích thước theo đơn vị px của trang, gốc ở góc trên trái. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Góc xoay theo độ, chiều kim đồng hồ. */
  rotation: number;
  /** 0 → 1. */
  opacity: number;
  /** Cách hòa vào phần bên dưới. Mặc định 'normal'. */
  blendMode: BlendMode;
  locked: boolean;
  hidden: boolean;
  timing: Timing | null;
  animation: Animation | null;
}

export type TextAlign = 'left' | 'center' | 'right';

export interface TextLayer extends LayerBase {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  italic: boolean;
  color: string;
  align: TextAlign;
  /** Bội số của cỡ chữ, ví dụ 1.25. */
  lineHeight: number;
  letterSpacing: number;
}

export interface Crop {
  /** Vùng cắt theo tỉ lệ 0 → 1 của ảnh gốc. */
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageLayer extends LayerBase {
  type: 'image';
  assetId: Id;
  crop: Crop | null;
  cornerRadius: number;
  flipX: boolean;
  flipY: boolean;
  /** Mờ viền, đơn vị px của trang. 0 = mép sắc. */
  feather: number;
  /**
   * Mặt nạ tẩy: ảnh PNG xám phủ đúng khung lớp (trắng = giữ, đen = đã tẩy).
   * null = chưa tẩy. Ảnh gốc không bị sửa.
   */
  maskAssetId: Id | null;
}

export type ShapeKind = 'rect' | 'ellipse' | 'line';

export interface ShapeLayer extends LayerBase {
  type: 'shape';
  shape: ShapeKind;
  /** Mã màu hoặc null = không tô. */
  fill: string | null;
  stroke: string | null;
  strokeWidth: number;
  cornerRadius: number;
}

export type Layer = TextLayer | ImageLayer | ShapeLayer;
export type LayerType = Layer['type'];

export interface Background {
  color: string;
  imageAssetId: Id | null;
  /** 0 → 1, độ rõ của ảnh nền. */
  imageOpacity: number;
}

export interface Page {
  id: Id;
  width: number;
  height: number;
  background: Background;
  /** Thứ tự vẽ: phần tử đầu ở dưới cùng. */
  layers: Layer[];
  /** Số giây của trang khi làm video (sau 1.0). Ở 1.0 là null. */
  duration: number | null;
}

export type AssetKind = 'image' | 'font';

export interface Asset {
  id: Id;
  kind: AssetKind;
  mimeType: string;
  /** Tên gốc của file người dùng chọn, hoặc null. */
  name: string | null;
  /** Mã băm nội dung (sha-256, hex) để không lưu trùng; null khi chưa tính. */
  hash: string | null;
  /** Kích thước gốc (ảnh); null với phông. */
  width: number | null;
  height: number | null;
}

export interface DesignDocument {
  schemaVersion: typeof SCHEMA_VERSION;
  id: Id;
  name: string;
  /** Mốc thời gian, mili giây kể từ 1970 (UTC). */
  createdAt: number;
  /**
   * Lần LƯU gần nhất. Do tầng lưu trữ (G1-5) ghi khi tự lưu, không phải thao tác
   * chỉnh sửa: vì vậy thao tác và hoàn tác không đổi trường này, và hoàn tác hết
   * vẫn trả tài liệu về đúng nội dung ban đầu.
   */
  updatedAt: number;
  /** DPI tham chiếu để quy đổi px ↔ mm khi in. */
  dpi: number;
  pages: Page[];
  assets: Record<Id, Asset>;
  meta: DocumentMeta;
}

export interface DocumentMeta {
  /** Loại thiết kế, ví dụ 'wedding', 'signage'; null nếu trang trắng. */
  kind: string | null;
  /** Ngôn ngữ chữ mẫu, ví dụ 'vi'. */
  locale: string;
  /** ID mẫu gốc nếu tạo từ mẫu. */
  templateId: string | null;
}
