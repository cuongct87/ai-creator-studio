import { expect, test } from '@playwright/test';

test('tab Mẫu: đủ 15 mẫu, lọc theo loại, tìm không dấu, không cuộn ngang (G3)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Điều hướng chính' }).getByRole('button', { name: 'Mẫu', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Mẫu', exact: true })).toBeVisible();

  const grid = page.getByRole('list', { name: 'Danh sách mẫu' });
  await expect(grid.getByRole('button')).toHaveCount(15);

  // Mọi ảnh trong lưới đều hiện được (ảnh thu nhỏ, hoặc ảnh minh họa gốc nếu chưa có).
  const images = grid.locator('img');
  for (let i = 0; i < 15; i++) await images.nth(i).scrollIntoViewIfNeeded();
  await expect
    .poll(() => images.evaluateAll((els) => els.filter((e) => (e as HTMLImageElement).naturalWidth > 0).length), { timeout: 15_000 })
    .toBe(15);

  const filters = page.getByRole('group', { name: 'Lọc theo loại' });
  await filters.getByRole('button', { name: 'Cáo phó' }).click();
  await expect(grid.getByRole('button')).toHaveText(['Cáo phó hoa sen', 'Cáo phó hoa cúc']);
  await filters.getByRole('button', { name: 'Tất cả' }).click();

  await page.getByPlaceholder(/Tìm mẫu/).fill('mien tay');
  await expect(grid.getByRole('button')).toHaveText(['Hình nền sông nước miền Tây']);
  await page.getByPlaceholder(/Tìm mẫu/).fill('khong co mau nay');
  await expect(page.getByText(/Chưa có mẫu/)).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('chọn mẫu thiệp cưới → dự án mới có sẵn chữ mẫu; mở mẫu lần hai ra dự án thứ hai, mẫu gốc không đổi', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Điều hướng chính' }).getByRole('button', { name: 'Mẫu', exact: true }).click();
  await page.getByRole('button', { name: 'Mẫu Thiệp cưới hoa hồng' }).click();

  await expect(page.getByRole('heading', { name: 'Thiệp cưới hoa hồng' })).toBeVisible();
  await expect(page.getByRole('region', { name: /Trang 1748×2480, 6 lớp/ })).toBeVisible();
  await page.getByRole('button', { name: 'Lớp', exact: true }).click();
  const layers = page.getByRole('list', { name: 'Danh sách lớp' });
  await expect(layers.getByRole('button', { name: 'Trân trọng kính mời' })).toBeVisible();

  // Sửa chữ trong dự án này (xóa một lớp) — mẫu gốc phải không đổi.
  await layers.getByRole('button', { name: 'Trân trọng kính mời' }).click();
  await page.getByRole('button', { name: 'Xóa', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Xóa', exact: true }).click();
  await expect(page.getByRole('region', { name: /Trang 1748×2480, 5 lớp/ })).toBeVisible();

  await page.getByRole('button', { name: 'Quay lại trang chủ' }).click();
  await page.getByRole('navigation', { name: 'Điều hướng chính' }).getByRole('button', { name: 'Mẫu', exact: true }).click();
  await page.getByRole('button', { name: 'Mẫu Thiệp cưới hoa hồng' }).click();
  await expect(page.getByRole('region', { name: /Trang 1748×2480, 6 lớp/ })).toBeVisible();

  await page.getByRole('button', { name: 'Quay lại trang chủ' }).click();
  await page.getByRole('navigation', { name: 'Điều hướng chính' }).getByRole('button', { name: 'Dự án', exact: true }).click();
  await expect(page.getByText('Thiệp cưới hoa hồng', { exact: true })).toHaveCount(2);
});

test('trang chủ: bấm "Bảng hiệu" → có "Trang trắng" và 2 mẫu bảng hiệu; chọn mẫu → mở đúng khổ', async ({ page }) => {
  await page.goto('/');
  await page.locator('.starts').getByRole('button', { name: 'Bảng hiệu' }).click();
  const picker = page.getByRole('dialog', { name: 'Chọn mẫu Bảng hiệu' });
  await expect(picker.getByRole('list', { name: 'Danh sách mẫu' }).getByRole('button')).toHaveText([
    /Trang trắng/,
    'Bảng hiệu quán cà phê',
    'Bảng hiệu tiệm sửa xe',
  ]);
  await picker.getByRole('button', { name: 'Đóng' }).click();
  await expect(picker).toHaveCount(0);

  await page.locator('.starts').getByRole('button', { name: 'Bảng hiệu' }).click();
  await picker.getByRole('button', { name: 'Mẫu Bảng hiệu quán cà phê' }).click();
  await expect(page.getByRole('heading', { name: 'Bảng hiệu quán cà phê' })).toBeVisible();
  await expect(page.getByRole('region', { name: /Trang 3000×1000, 4 lớp/ })).toBeVisible();
});
