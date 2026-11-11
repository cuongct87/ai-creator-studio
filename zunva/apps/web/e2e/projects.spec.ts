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

test('lưu dự án ra file .zunva → xóa → mở lại file thì dự án trở lại; mở file lạ bị từ chối', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Dự án', exact: true }).click();
  await page.getByRole('button', { name: '+ Tạo dự án mới' }).click();
  const list = page.getByRole('list', { name: 'Danh sách dự án' });
  await page.getByRole('button', { name: 'Đổi tên dự án Thiết kế mới' }).click();
  await page.getByLabel('Tên mới cho dự án').fill('Cáo phó Cần Thơ');
  await page.getByRole('button', { name: 'Lưu tên' }).click();
  await expect(list.getByText('Cáo phó Cần Thơ')).toBeVisible();

  // Lưu file: trình duyệt tải xuống "Cáo phó Cần Thơ.zunva".
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Lưu file .zunva của dự án Cáo phó Cần Thơ' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('Cáo phó Cần Thơ.zunva');
  const saved = testInfo.outputPath('du-an.zunva');
  await download.saveAs(saved);
  await expect(page.getByRole('alert')).toContainText('Đã lưu file');

  // Mở lại khi dự án vẫn còn → thêm thành bản sao, không ghi đè.
  let chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Mở file .zunva' }).click();
  await (await chooser).setFiles(saved);
  await expect(list.getByText('Cáo phó Cần Thơ (bản sao)')).toBeVisible();
  await expect(list.getByRole('listitem')).toHaveCount(2);

  // Xóa cả hai, mở lại file → dự án gốc trở lại với đúng tên.
  for (const name of ['Cáo phó Cần Thơ (bản sao)', 'Cáo phó Cần Thơ']) {
    page.once('dialog', (d) => void d.accept());
    await page.getByRole('button', { name: `Xóa dự án ${name}`, exact: true }).click();
  }
  await expect(page.getByText('Chưa có dự án nào.', { exact: false })).toBeVisible();
  chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Mở file .zunva' }).click();
  await (await chooser).setFiles(saved);
  await expect(list.getByRole('listitem')).toHaveCount(1);
  await expect(list.getByText('Cáo phó Cần Thơ', { exact: true })).toBeVisible();

  // File không phải .zunva → báo lỗi tiếng Việt, không thêm dự án.
  chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Mở file .zunva' }).click();
  await (await chooser).setFiles(testInfo.file); // chính file test này: chữ thường, không phải .zunva
  await expect(page.getByRole('alert')).toContainText('Không mở được "projects.spec.ts"');
  await expect(list.getByRole('listitem')).toHaveCount(1);
});
