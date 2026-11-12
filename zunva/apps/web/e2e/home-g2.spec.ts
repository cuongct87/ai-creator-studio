import { expect, test } from '@playwright/test';

test('đổi màu giao diện: 3 màu, chữ vẫn đọc được, tải lại trang vẫn nhớ', async ({ page }) => {
  await page.goto('/');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'xanh');

  await page.getByRole('radio', { name: 'Màu Tối' }).first().click();
  await expect(html).toHaveAttribute('data-theme', 'toi');
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe('rgb(15, 22, 34)');

  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'toi');

  await page.getByRole('button', { name: 'Tài khoản', exact: true }).click();
  await page.getByRole('radio', { name: 'Màu Hồng phấn' }).click();
  await expect(html).toHaveAttribute('data-theme', 'hong');
});

test('ô tìm gõ không dấu vẫn ra đúng loại thiết kế', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Tìm loại thiết kế' }).fill('thiep cuoi');
  const starts = page.locator('.starts');
  await expect(starts.getByRole('button')).toHaveCount(1);
  await expect(starts.getByRole('button', { name: 'Thiệp cưới' })).toBeVisible();

  await page.getByRole('searchbox', { name: 'Tìm loại thiết kế' }).fill('khong co loai nay');
  await expect(page.getByText('Chưa có loại thiết kế', { exact: false })).toBeVisible();
});

test('bấm "Thiệp cưới" → mở màn hình chỉnh sửa đúng khổ A5 → quay lại thấy trong "Tiếp tục thiết kế"', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Chưa có thiết kế nào', { exact: false })).toBeVisible();
  await page.locator('.starts').getByRole('button', { name: 'Thiệp cưới' }).click();

  await expect(page.getByRole('heading', { name: 'Thiệp cưới' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Trang 1748×2480' })).toBeVisible();
  expect(page.url()).toContain('?project=');

  // Nút Back của trình duyệt/Android quay về trang chủ.
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Bạn muốn tạo gì hôm nay?' })).toBeVisible();
  const recent = page.getByRole('list', { name: 'Thiết kế gần đây' });
  await expect(recent.getByRole('button', { name: /Thiệp cưới/ })).toBeVisible();

  // Mở lại từ "Tiếp tục thiết kế"; tải lại trang khi đang chỉnh sửa vẫn mở đúng dự án.
  await recent.getByRole('button', { name: /Thiệp cưới/ }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Thiệp cưới' })).toBeVisible();
  await page.getByRole('button', { name: 'Quay lại trang chủ' }).click();
  await expect(page.getByRole('heading', { name: 'Bạn muốn tạo gì hôm nay?' })).toBeVisible();
});

test('"Trang trắng" hỏi khổ trước khi tạo', async ({ page }) => {
  await page.goto('/');
  await page.locator('.starts').getByRole('button', { name: 'Trang trắng' }).click();
  const dialog = page.getByRole('dialog', { name: 'Chọn khổ cho thiết kế' });
  await dialog.getByRole('button', { name: 'Story / màn hình điện thoại 1080×1920' }).click();
  await expect(page.getByRole('img', { name: 'Trang 1080×1920' })).toBeVisible();
});

test('trang chủ không cuộn ngang ở khổ 360px, cả 3 màu', async ({ page }) => {
  await page.goto('/');
  for (const name of ['Màu Xanh nhạt', 'Màu Hồng phấn', 'Màu Tối']) {
    await page.getByRole('radio', { name }).first().click();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  }
});

test('nhiều dự án gần đây: dải "Tiếp tục thiết kế" cuộn bên trong, trang không cuộn ngang', async ({ page }) => {
  await page.goto('/');
  for (let i = 0; i < 4; i++) {
    await page.locator('.starts').getByRole('button', { name: 'Mạng xã hội' }).click();
    await page.getByRole('button', { name: 'Quay lại trang chủ' }).click();
  }
  await expect(page.getByRole('list', { name: 'Thiết kế gần đây' }).getByRole('listitem')).toHaveCount(4);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
