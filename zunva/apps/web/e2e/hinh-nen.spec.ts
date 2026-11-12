import { expect, test } from '@playwright/test';

test('hình nền điện thoại: đúng khổ dọc, có vạch gợi ý, web không có nút "Đặt làm hình nền" (G3)', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder(/Thiệp cưới/).fill('hinh nen');
  await page.locator('.starts').getByRole('button', { name: 'Hình nền điện thoại' }).click();
  // Web không biết kích thước máy → khổ mặc định 1080×2340.
  await expect(page.getByRole('region', { name: /Trang 1080×2340, 0 lớp/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Hình nền điện thoại' })).toBeVisible();

  await page.getByRole('button', { name: 'Xuất', exact: true }).click();
  const sheet = page.getByRole('dialog', { name: /Xuất thiết kế/ });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole('group', { name: 'Đặt làm hình nền' })).toHaveCount(0);
});
