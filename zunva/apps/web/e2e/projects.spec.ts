import { expect, test } from '@playwright/test';

test('tạo dự án → tải lại trang vẫn còn → đổi tên → xóa thì mất (khổ 360px)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Dự án', exact: true }).click();
  await expect(page.getByText('Chưa có dự án nào.', { exact: false })).toBeVisible();

  await page.getByRole('button', { name: '+ Tạo dự án mới' }).click();
  const list = page.getByRole('list', { name: 'Danh sách dự án' });
  await expect(list.getByRole('listitem')).toHaveCount(1);
  await expect(list.getByText('Thiết kế mới')).toBeVisible();

  // Reload: the project must still be there (saved in IndexedDB, not in memory).
  await page.reload();
  await page.getByRole('button', { name: 'Dự án', exact: true }).click();
  await expect(list.getByRole('listitem')).toHaveCount(1);
  await expect(list.getByText('Thiết kế mới')).toBeVisible();

  // Rename with Vietnamese diacritics.
  await page.getByRole('button', { name: 'Đổi tên dự án Thiết kế mới' }).click();
  await page.getByLabel('Tên mới cho dự án').fill('Thiệp cưới Hùng – Lan');
  await page.getByRole('button', { name: 'Lưu tên' }).click();
  await expect(list.getByText('Thiệp cưới Hùng – Lan')).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  // Delete asks first; cancelling keeps the project.
  page.once('dialog', (d) => void d.dismiss());
  await page.getByRole('button', { name: 'Xóa dự án Thiệp cưới Hùng – Lan' }).click();
  await expect(list.getByRole('listitem')).toHaveCount(1);

  page.once('dialog', (d) => void d.accept());
  await page.getByRole('button', { name: 'Xóa dự án Thiệp cưới Hùng – Lan' }).click();
  await expect(page.getByText('Chưa có dự án nào.', { exact: false })).toBeVisible();

  await page.reload();
  await page.getByRole('button', { name: 'Dự án', exact: true }).click();
  await expect(page.getByText('Chưa có dự án nào.', { exact: false })).toBeVisible();
});
