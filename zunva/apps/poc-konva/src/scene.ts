import { SANS, SERIF } from './fonts';

// Throwaway data model for the proof of concept. The real model is @zunva/core (G1-3).
export interface Base {
  id: string;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

export interface TextItem extends Base {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontStyle: 'normal' | 'bold';
  fill: string;
  width: number;
  align: 'left' | 'center' | 'right';
  lineHeight: number;
}

export interface ShapeItem extends Base {
  type: 'rect' | 'circle' | 'star';
  width: number;
  height: number;
  fill: string;
  cornerRadius: number;
}

export interface Crop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type PhotoKey = 'photoA' | 'photoB';

export interface ImageItem extends Base {
  type: 'image';
  src: PhotoKey;
  width: number;
  height: number;
  crop: Crop;
}

export type LeafItem = TextItem | ShapeItem | ImageItem;

export interface GroupItem extends Base {
  type: 'group';
  children: LeafItem[];
}

export type Item = LeafItem | GroupItem;

export interface PageSize {
  width: number;
  height: number;
}

export const PAGE_SMALL: PageSize = { width: 1080, height: 1350 };
export const PAGE_LARGE: PageSize = { width: 1748, height: 2480 };

export type Photos = Record<PhotoKey, HTMLCanvasElement>;

/** Generates a large synthetic "photo" with a canvas (no copyrighted images). */
function makePhoto(width: number, height: number, hueA: number, hueB: number, label: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is not available');
  const g = ctx.createLinearGradient(0, 0, width, height);
  g.addColorStop(0, `hsl(${hueA} 70% 55%)`);
  g.addColorStop(1, `hsl(${hueB} 70% 35%)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  // Deterministic pseudo-random circles so every run draws the same picture.
  let seed = hueA * 31 + hueB;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < 140; i++) {
    ctx.beginPath();
    ctx.fillStyle = `hsla(${(hueA + rnd() * 120) % 360} 80% ${40 + rnd() * 40}% / 0.35)`;
    ctx.arc(rnd() * width, rnd() * height, 40 + rnd() * 260, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 12;
  ctx.strokeRect(60, 60, width - 120, height - 120);
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 ${Math.round(width / 12)}px "${SANS}"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, width / 2, height / 2);
  return canvas;
}

export function makePhotos(): Photos {
  return {
    photoA: makePhoto(3200, 2400, 200, 260, 'Ảnh thử A · 3200×2400'),
    photoB: makePhoto(3000, 3000, 20, 330, 'Ảnh thử B · 3000×3000'),
  };
}

const TEXTS: Array<[string, string, 'normal' | 'bold', string]> = [
  ['Trân trọng kính mời\nquý khách đến dự lễ thành hôn', SERIF, 'bold', '#7a2e4a'],
  ['Giảm giá 50%\ncho mọi đơn hàng hôm nay', SANS, 'bold', '#d6336c'],
  ['Thành kính phân ưu', SERIF, 'normal', '#2b3d3e'],
  ['Thực đơn món ngon\nPhở bò · Bún chả · Bánh xèo', SANS, 'normal', '#5a3214'],
  ['Chúc mừng năm mới\nAn khang thịnh vượng', SERIF, 'bold', '#b8860b'],
  ['Khai trương cửa hàng\nƯu đãi đặc biệt tuần đầu', SANS, 'bold', '#1864ab'],
  ['Ngày 20 · 12 · 2026', SANS, 'normal', '#343a40'],
  ['Liên hệ đặt hàng: 0900 000 000', SANS, 'normal', '#212529'],
  ['Sáng tạo mỗi ngày\ncùng ZUNVA', SERIF, 'normal', '#087f5b'],
  ['Đặt hàng ngay hôm nay\nGiao tận nơi trong ngày', SANS, 'bold', '#e8590c'],
];

const COLORS = ['#ffd43b', '#74c0fc', '#ff8787', '#63e6be', '#b197fc', '#ffa94d'];

/** 30 objects: 2 big images, 10 multi-line Vietnamese texts, 18 shapes. Coordinates scale with the page. */
export function buildScene(page: PageSize): Item[] {
  const s = page.width / 1080;
  const items: Item[] = [];
  const base = (id: string, x: number, y: number, rotation = 0): Base => ({ id, x: x * s, y: y * s, rotation, scaleX: 1, scaleY: 1 });

  items.push({ ...base('img-a', 60, 60), type: 'image', src: 'photoA', width: 560 * s, height: 420 * s, crop: { x: 0, y: 0, width: 3200, height: 2400 } });
  items.push({ ...base('img-b', 600, 700, -6), type: 'image', src: 'photoB', width: 400 * s, height: 400 * s, crop: { x: 0, y: 0, width: 3000, height: 3000 } });

  for (let i = 0; i < 18; i++) {
    const type = (['rect', 'circle', 'star'] as const)[i % 3] ?? 'rect';
    const col = i % 6;
    const row = Math.floor(i / 6);
    const size = (70 + (i % 4) * 22) * s;
    items.push({
      ...base(`shape-${i}`, 80 + col * 160, 520 + row * 260 + (i % 2) * 40, (i * 17) % 45),
      type,
      width: size,
      height: type === 'rect' ? size * 0.7 : size,
      fill: COLORS[i % COLORS.length] ?? '#ffd43b',
      cornerRadius: type === 'rect' ? 14 * s : 0,
    });
  }

  TEXTS.forEach(([text, fontFamily, fontStyle, fill], i) => {
    items.push({
      ...base(`text-${i}`, i % 2 ? 560 : 70, 500 + i * 80, i % 4 === 3 ? -4 : 0),
      type: 'text',
      text,
      fontFamily,
      fontStyle,
      fill,
      fontSize: (i < 2 ? 46 : 34) * s,
      width: 460 * s,
      align: i % 3 === 0 ? 'center' : 'left',
      lineHeight: 1.25,
    });
  });

  return items;
}
