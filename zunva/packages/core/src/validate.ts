import type { DesignDocument } from './model';
import { BLEND_MODES, SCHEMA_VERSION } from './model';

/**
 * Kiểm tra dữ liệu thiết kế trước khi dùng (khi mở file, nhập dự án cũ, nhận kết quả AI).
 * Viết tay, không dùng thư viện, để lõi không có phụ thuộc ngoài. Trả về toàn bộ lỗi
 * tìm thấy kèm đường dẫn, ví dụ `pages[0].layers[2].fontSize: phải là số > 0`.
 */

export type ValidationResult =
  | { ok: true; value: DesignDocument }
  | { ok: false; errors: string[] };

type Obj = Record<string, unknown>;

const has = (o: object, k: string): boolean => Object.hasOwn(o, k);
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isBool = (v: unknown): v is boolean => typeof v === 'boolean';
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

class Checker {
  readonly errors: string[] = [];

  fail(path: string, msg: string): void {
    this.errors.push(`${path}: ${msg}`);
  }

  num(o: Obj, key: string, path: string, opts: { min?: number; max?: number; gt?: number } = {}): void {
    const v = o[key];
    const p = `${path}.${key}`;
    if (!isNum(v)) return this.fail(p, 'phải là số');
    if (opts.gt !== undefined && !(v > opts.gt)) this.fail(p, `phải > ${opts.gt}`);
    if (opts.min !== undefined && v < opts.min) this.fail(p, `phải >= ${opts.min}`);
    if (opts.max !== undefined && v > opts.max) this.fail(p, `phải <= ${opts.max}`);
  }

  numOrNull(o: Obj, key: string, path: string, opts: { min?: number; gt?: number } = {}): void {
    if (o[key] === null) return;
    this.num(o, key, path, opts);
  }

  str(o: Obj, key: string, path: string, opts: { nonEmpty?: boolean } = {}): void {
    const v = o[key];
    const p = `${path}.${key}`;
    if (!isStr(v)) return this.fail(p, 'phải là chuỗi');
    if (opts.nonEmpty && v.trim() === '') this.fail(p, 'không được rỗng');
  }

  strOrNull(o: Obj, key: string, path: string): void {
    if (o[key] === null) return;
    this.str(o, key, path);
  }

  bool(o: Obj, key: string, path: string): void {
    if (!isBool(o[key])) this.fail(`${path}.${key}`, 'phải là true/false');
  }

  color(o: Obj, key: string, path: string, nullable = false): void {
    const v = o[key];
    if (nullable && v === null) return;
    if (!isStr(v) || !HEX.test(v)) this.fail(`${path}.${key}`, 'phải là mã màu #rgb, #rgba, #rrggbb hoặc #rrggbbaa');
  }

  oneOf(o: Obj, key: string, path: string, values: readonly string[]): void {
    const v = o[key];
    if (!isStr(v) || !values.includes(v)) this.fail(`${path}.${key}`, `phải là một trong: ${values.join(', ')}`);
  }
}

function checkTiming(c: Checker, o: Obj, path: string): void {
  const t = o.timing;
  if (t === null) return;
  if (!isObj(t)) return c.fail(`${path}.timing`, 'phải là null hoặc { start, duration }');
  c.num(t, 'start', `${path}.timing`, { min: 0 });
  c.num(t, 'duration', `${path}.timing`, { gt: 0 });
}

function checkAnimation(c: Checker, o: Obj, path: string): void {
  const a = o.animation;
  if (a === null) return;
  if (!isObj(a)) return c.fail(`${path}.animation`, 'phải là null hoặc { name, params }');
  c.str(a, 'name', `${path}.animation`, { nonEmpty: true });
  if (!isObj(a.params)) c.fail(`${path}.animation.params`, 'phải là object');
}

function checkLayer(c: Checker, l: unknown, path: string, assetIds: Set<string>, seen: Set<string>): void {
  if (!isObj(l)) return c.fail(path, 'phải là object');
  checkId(c, l, path, seen);
  c.strOrNull(l, 'name', path);
  c.num(l, 'x', path);
  c.num(l, 'y', path);
  c.num(l, 'width', path, { min: 0 });
  c.num(l, 'height', path, { min: 0 });
  c.num(l, 'rotation', path);
  c.num(l, 'opacity', path, { min: 0, max: 1 });
  c.oneOf(l, 'blendMode', path, BLEND_MODES);
  c.bool(l, 'locked', path);
  c.bool(l, 'hidden', path);
  checkTiming(c, l, path);
  checkAnimation(c, l, path);

  switch (l.type) {
    case 'text':
      c.str(l, 'text', path);
      c.str(l, 'fontFamily', path, { nonEmpty: true });
      c.num(l, 'fontSize', path, { gt: 0 });
      c.num(l, 'fontWeight', path, { min: 100, max: 1000 });
      c.bool(l, 'italic', path);
      c.color(l, 'color', path);
      c.oneOf(l, 'align', path, ['left', 'center', 'right']);
      c.num(l, 'lineHeight', path, { gt: 0 });
      c.num(l, 'letterSpacing', path);
      break;
    case 'image': {
      c.str(l, 'assetId', path, { nonEmpty: true });
      if (isStr(l.assetId) && !assetIds.has(l.assetId)) c.fail(`${path}.assetId`, `không có tài nguyên "${l.assetId}"`);
      const crop = l.crop;
      if (crop !== null) {
        if (!isObj(crop)) {
          c.fail(`${path}.crop`, 'phải là null hoặc { x, y, width, height }');
        } else {
          c.num(crop, 'x', `${path}.crop`, { min: 0, max: 1 });
          c.num(crop, 'y', `${path}.crop`, { min: 0, max: 1 });
          c.num(crop, 'width', `${path}.crop`, { gt: 0, max: 1 });
          c.num(crop, 'height', `${path}.crop`, { gt: 0, max: 1 });
        }
      }
      c.num(l, 'cornerRadius', path, { min: 0 });
      c.bool(l, 'flipX', path);
      c.bool(l, 'flipY', path);
      c.num(l, 'feather', path, { min: 0 });
      if (l.maskAssetId !== null && (!isStr(l.maskAssetId) || !assetIds.has(l.maskAssetId))) {
        c.fail(`${path}.maskAssetId`, 'phải là null hoặc ID tài nguyên có thật');
      }
      break;
    }
    case 'shape':
      c.oneOf(l, 'shape', path, ['rect', 'ellipse', 'line']);
      c.color(l, 'fill', path, true);
      c.color(l, 'stroke', path, true);
      c.num(l, 'strokeWidth', path, { min: 0 });
      c.num(l, 'cornerRadius', path, { min: 0 });
      break;
    default:
      c.fail(`${path}.type`, 'phải là text, image hoặc shape');
  }
}

/** ID trùng tên thuộc tính đặc biệt của JavaScript bị cấm, để kho tài nguyên dạng từ điển luôn an toàn. */
const RESERVED_IDS = new Set(['__proto__', 'prototype', 'constructor']);

function checkId(c: Checker, o: Obj, path: string, seen: Set<string>): void {
  const id = o.id;
  if (!isStr(id) || id === '') return c.fail(`${path}.id`, 'phải là chuỗi không rỗng');
  if (RESERVED_IDS.has(id)) return c.fail(`${path}.id`, `không được dùng tên dành riêng "${id}"`);
  if (seen.has(id)) c.fail(`${path}.id`, `trùng ID "${id}"`);
  seen.add(id);
}

/** Lỗi của MỘT lớp (dùng khi áp dụng thao tác, không chờ tới lúc lưu). */
export function layerErrors(layer: unknown, assetIds: ReadonlySet<string>, path = 'layer'): string[] {
  const c = new Checker();
  checkLayer(c, layer, path, new Set(assetIds), new Set());
  return c.errors;
}

/** Lỗi của phần thông tin trang (không gồm các lớp bên trong). */
export function pageInfoErrors(page: unknown, assetIds: ReadonlySet<string>, path = 'page'): string[] {
  const c = new Checker();
  if (!isObj(page)) return [`${path}: phải là object`];
  checkPageInfo(c, page, path, new Set(assetIds));
  return c.errors;
}

/** Lỗi của một tài nguyên. */
export function assetErrors(asset: unknown, path = 'asset'): string[] {
  const c = new Checker();
  if (!isObj(asset)) return [`${path}: phải là object`];
  checkAssetFields(c, asset, path);
  return c.errors;
}

function checkAssetFields(c: Checker, a: Obj, p: string): void {
  c.oneOf(a, 'kind', p, ['image', 'font']);
  c.str(a, 'mimeType', p, { nonEmpty: true });
  c.strOrNull(a, 'name', p);
  c.strOrNull(a, 'hash', p);
  c.numOrNull(a, 'width', p, { gt: 0 });
  c.numOrNull(a, 'height', p, { gt: 0 });
  if (!isStr(a.id) || a.id === '') c.fail(`${p}.id`, 'phải là chuỗi không rỗng');
  else if (RESERVED_IDS.has(a.id)) c.fail(`${p}.id`, `không được dùng tên dành riêng "${a.id}"`);
}

function checkPageInfo(c: Checker, pg: Obj, p: string, assetIds: Set<string>): void {
  c.num(pg, 'width', p, { gt: 0 });
  c.num(pg, 'height', p, { gt: 0 });
  c.numOrNull(pg, 'duration', p, { gt: 0 });
  const bg = pg.background;
  if (!isObj(bg)) {
    c.fail(`${p}.background`, 'phải là object');
  } else {
    c.color(bg, 'color', `${p}.background`);
    c.num(bg, 'imageOpacity', `${p}.background`, { min: 0, max: 1 });
    if (bg.imageAssetId !== null) {
      if (!isStr(bg.imageAssetId) || !assetIds.has(bg.imageAssetId)) {
        c.fail(`${p}.background.imageAssetId`, 'phải là null hoặc ID tài nguyên có thật');
      }
    }
  }
}

export function validateDocument(input: unknown): ValidationResult {
  const c = new Checker();
  if (!isObj(input)) return { ok: false, errors: ['(gốc): phải là object'] };
  const d = input;

  if (d.schemaVersion !== SCHEMA_VERSION) {
    c.fail('schemaVersion', `phải là ${SCHEMA_VERSION} (bản cũ phải qua bộ nhập trước)`);
  }
  const seen = new Set<string>();
  checkId(c, d, '(gốc)', seen);
  c.str(d, 'name', '(gốc)');
  c.num(d, 'createdAt', '(gốc)', { min: 0 });
  c.num(d, 'updatedAt', '(gốc)', { min: 0 });
  c.num(d, 'dpi', '(gốc)', { gt: 0 });

  const assetIds = new Set<string>();
  if (!isObj(d.assets)) {
    c.fail('assets', 'phải là object { id: tài nguyên }');
  } else {
    for (const [key, a] of Object.entries(d.assets)) {
      if (!has(d.assets, key)) continue;
      const p = `assets["${key}"]`;
      if (!isObj(a)) {
        c.fail(p, 'phải là object');
        continue;
      }
      checkId(c, a, p, seen);
      if (a.id !== key) c.fail(`${p}.id`, 'phải trùng với khóa');
      checkAssetFields(c, a, p);
      assetIds.add(key);
    }
  }

  if (!Array.isArray(d.pages) || d.pages.length === 0) {
    c.fail('pages', 'phải có ít nhất 1 trang');
  } else {
    d.pages.forEach((pg: unknown, i: number) => {
      const p = `pages[${i}]`;
      if (!isObj(pg)) return c.fail(p, 'phải là object');
      checkId(c, pg, p, seen);
      checkPageInfo(c, pg, p, assetIds);
      if (!Array.isArray(pg.layers)) {
        c.fail(`${p}.layers`, 'phải là danh sách');
      } else {
        pg.layers.forEach((l: unknown, j: number) => checkLayer(c, l, `${p}.layers[${j}]`, assetIds, seen));
      }
    });
  }

  if (!isObj(d.meta)) {
    c.fail('meta', 'phải là object');
  } else {
    c.strOrNull(d.meta, 'kind', 'meta');
    c.str(d.meta, 'locale', 'meta', { nonEmpty: true });
    c.strOrNull(d.meta, 'templateId', 'meta');
  }

  return c.errors.length === 0 ? { ok: true, value: input as unknown as DesignDocument } : { ok: false, errors: c.errors };
}
