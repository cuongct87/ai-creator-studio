import { expect, test } from '@playwright/test';

test('nhiều trang: thêm, nhân đôi, chuyển trang, đổi chỗ, xóa + hoàn tác, xuất mỗi trang một ảnh (G3)', async ({ page }) => {
  await page.goto('/');
  await page.locator('.starts').getByRole('button', { name: 'Mạng xã hội' }).click();
  const stage = page.getByRole('region', { name: /Trang 1080×1080/ });

  // Trang 1: một hình tròn.
  await page.getByRole('button', { name: 'Hình', exact: true }).click();
  await page.getByRole('button', { name: '◯ Hình tròn' }).click();
  await page.getByRole('button', { name: 'Bỏ chọn' }).click();
  await expect(stage).toHaveAccessibleName(/1 lớp/);

  // Thêm trang → mở trang 2 (trắng).
  await page.getByRole('button', { name: 'Trang', exact: true }).click();
  const thumbs = page.getByRole('list', { name: 'Danh sách trang' }).getByRole('button');
  await page.getByRole('button', { name: '+ Trang' }).click();
  await expect(thumbs).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Trang 2', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(stage).toHaveAccessibleName(/0 lớp/);

  // Chạm trang 1 → thấy lại hình tròn; nhân đôi trang 1 → 3 trang, bản sao có hình tròn.
  await page.getByRole('button', { name: 'Trang 1', exact: true }).click();
  await expect(stage).toHaveAccessibleName(/1 lớp/);
  await page.getByRole('button', { name: 'Nhân đôi trang' }).click();
  await expect(thumbs).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'Trang 2', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(stage).toHaveAccessibleName(/1 lớp/);

  // Đưa trang 2 ra sau → nó thành trang 3 (vẫn đang mở).
  await page.getByRole('button', { name: 'Đưa trang ra sau' }).click();
  await expect(page.getByRole('button', { name: 'Trang 3', exact: true })).toHaveAttribute('aria-current', 'page');

  // Xóa trang (hỏi lại) → còn 2; hoàn tác → 3.
  await page.getByRole('button', { name: 'Xóa trang' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Xóa trang' }).click();
  await expect(thumbs).toHaveCount(2);
  await page.getByRole('button', { name: /^Hoàn tác: Xóa trang/ }).click();
  await expect(thumbs).toHaveCount(3);

  // Ảnh thu nhỏ các trang hiện ra.
  await expect(page.locator('.page-thumb img')).toHaveCount(3, { timeout: 10000 });

  // Xuất PNG: mỗi trang một file, có số thứ tự.
  await page.getByRole('button', { name: 'Xuất', exact: true }).click();
  const sheet = page.getByRole('dialog', { name: /Xuất thiết kế/ });
  await expect(sheet).toContainText('3 trang');
  const names: string[] = [];
  page.on('download', (d) => names.push(d.suggestedFilename()));
  await sheet.getByRole('button', { name: 'Xuất', exact: true }).click();
  await expect(sheet.getByRole('status')).toContainText('Đã lưu 3 ảnh');
  await expect.poll(() => names.length).toBe(3);
  expect(names.sort()).toEqual(['Bài mạng xã hội - 1.png', 'Bài mạng xã hội - 2.png', 'Bài mạng xã hội - 3.png']);
});
