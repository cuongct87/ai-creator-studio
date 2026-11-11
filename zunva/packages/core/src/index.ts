/**
 * @zunva/core — lõi dữ liệu (tên mã nội bộ; thương hiệu hiển thị lấy từ PRODUCT_NAME).
 * Không phụ thuộc React, DOM hay thư viện vẽ.
 */

export { PRODUCT_NAME } from './brand';
export * from './model';
export * from './ids';
export * from './factory';
export * from './validate';
export * from './ops';
export * from './history';
export * from './zip';
export * from './zunva-file';

/** Giới hạn một số trong khoảng [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  if (min > max) throw new RangeError('min phải nhỏ hơn hoặc bằng max');
  return Math.min(max, Math.max(min, value));
}

/** Kiểm tra mã màu dạng #rgb, #rgba, #rrggbb hoặc #rrggbbaa. */
export function isHexColor(value: string): boolean {
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value);
}
