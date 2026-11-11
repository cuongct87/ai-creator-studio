/**
 * @zunva/core — lõi dữ liệu ZUNVA.
 * G1-2 chỉ có khung; mô hình dữ liệu, lệnh và lịch sử được viết ở G1-3.
 */

export const PRODUCT_NAME = 'ZUNVA';

/** Phiên bản định dạng dữ liệu thiết kế. v1 là bản lưu của app v1.5. */
export const SCHEMA_VERSION = 2;

/** Giới hạn một số trong khoảng [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  if (min > max) throw new RangeError('min phải nhỏ hơn hoặc bằng max');
  return Math.min(max, Math.max(min, value));
}

/** Kiểm tra mã màu dạng #rgb hoặc #rrggbb. */
export function isHexColor(value: string): boolean {
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
}
