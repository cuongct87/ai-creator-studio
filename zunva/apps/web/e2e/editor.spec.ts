import { expect, test } from '@playwright/test';

test('chỉnh sửa thiệp cưới: thêm chữ/hình, sửa chữ tiếng Việt, hoàn tác/làm lại, tự lưu', async ({ page }) => {
  await page.goto('/');
  await page.locator('.starts').getByRole('button', { name: 'Thiệp cưới' }).click();
  const stage = page.getByRole('region', { name: /Trang 1748×2480/ });
  await expect(stage).toHaveAccessibleName(/0 lớp/);
  await expect(stage.locator('canvas').first()).toBeVisible();

  // Thêm chữ → bảng thuộc tính chữ hiện ra.
  await page.getByRole('button', { name: 'Chữ', exact: true }).click();
  await expect(stage).toHaveAccessibleName(/1 lớp/);
  const content = page.getByLabel('Nội dung (hoặc chạm vào chữ đang chọn trên trang để gõ)');
  await expect(content).toHaveValue('Chữ mới');
  await content.fill('Trân trọng kính mời');
  await page.getByLabel('Phông chữ').selectOption('Dancing Script');
  await page.getByRole('button', { name: 'Chữ to hơn' }).click();
  await page.getByRole('button', { name: 'Bỏ chọn' }).click();

  // Thêm hình tròn.
  await page.getByRole('button', { name: 'Hình', exact: true }).click();
  await page.getByRole('button', { name: '◯ Hình tròn' }).click();
  await expect(stage).toHaveAccessibleName(/2 lớp/);
  await page.getByRole('button', { name: 'Bỏ chọn' }).click();

  // Bảng Lớp có đủ, lớp trên cùng ở đầu.
  await page.getByRole('button', { name: 'Lớp', exact: true }).click();
  const layers = page.getByRole('list', { name: 'Danh sách lớp' });
  await expect(layers.getByRole('button')).toHaveText(['Hình tròn', 'Trân trọng kính mời']);

  // Hoàn tác 2 lần → mất hình tròn và lần đổi cỡ chữ; làm lại 2 lần → trở lại.
  const undo = page.getByRole('button', { name: /^Hoàn tác/ });
  const redo = page.getByRole('button', { name: 'Làm lại' });
  await undo.click();
  await expect(stage).toHaveAccessibleName(/1 lớp/);
  await undo.click();
  await redo.click();
  await redo.click();
  await expect(stage).toHaveAccessibleName(/2 lớp/);

  // Tự lưu: chờ "Đã lưu" rồi tải lại trang → mọi thứ còn nguyên.
  await expect(page.getByText('Đã lưu')).toBeVisible({ timeout: 5000 });
  await page.reload();
  await expect(stage).toHaveAccessibleName(/2 lớp/);
  await page.getByRole('button', { name: 'Lớp', exact: true }).click();
  await expect(layers.getByRole('button')).toHaveText(['Hình tròn', 'Trân trọng kính mời']);
  await layers.getByRole('button', { name: 'Trân trọng kính mời' }).click();
  await expect(page.getByLabel('Phông chữ')).toHaveValue('Dancing Script');

  // Xóa qua hộp hỏi riêng; khổ 360px không cuộn ngang.
  await page.getByRole('button', { name: 'Xóa', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Xóa', exact: true }).click();
  await expect(stage).toHaveAccessibleName(/1 lớp/);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  // Quay lại: "Tiếp tục thiết kế" có dự án.
  await page.getByRole('button', { name: 'Quay lại trang chủ' }).click();
  await expect(page.getByRole('list', { name: 'Thiết kế gần đây' }).getByRole('button', { name: /Thiệp cưới/ })).toBeVisible();
});

test('đổi màu nền trang và nhân đôi lớp', async ({ page }) => {
  await page.goto('/');
  await page.locator('.starts').getByRole('button', { name: 'Mạng xã hội' }).click();
  const stage = page.getByRole('region', { name: /Trang 1080×1080/ });
  await page.getByRole('button', { name: 'Nền', exact: true }).click();
  await page.getByRole('button', { name: 'Màu nền #f7b6cf' }).click();
  await expect(page.getByRole('button', { name: 'Màu nền #f7b6cf' })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: 'Hình', exact: true }).click();
  await page.getByRole('button', { name: '▭ Hình chữ nhật' }).click();
  await page.getByRole('button', { name: 'Nhân đôi' }).click();
  await expect(stage).toHaveAccessibleName(/2 lớp/);
});
