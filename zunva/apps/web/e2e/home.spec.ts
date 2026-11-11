import { expect, test } from '@playwright/test';

test('trang chủ hiện đủ 5 tab và câu hỏi chính ở khổ 360px', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Bạn muốn tạo gì hôm nay?' })).toBeVisible();

  const nav = page.getByRole('navigation', { name: 'Điều hướng chính' });
  for (const label of ['Trang chủ', 'Dự án', 'Mẫu', 'AI', 'Tài khoản']) {
    await expect(nav.getByRole('button', { name: label, exact: true })).toBeVisible();
  }
});

test('không cuộn ngang ở khổ 360px', async ({ page }) => {
  await page.goto('/');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('bấm tab đổi tiêu đề', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Dự án', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Dự án' })).toBeVisible();
});
