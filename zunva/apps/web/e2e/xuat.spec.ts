import { expect, test } from '@playwright/test';

test('xuất ảnh PNG, JPG và PDF để in (G3)', async ({ page }) => {
  await page.goto('/');
  await page.locator('.starts').getByRole('button', { name: 'Thiệp cưới' }).click();
  await expect(page.getByRole('region', { name: /Trang 1748×2480/ })).toBeVisible();
  await page.getByRole('button', { name: 'Hình', exact: true }).click();
  await page.getByRole('button', { name: '◯ Hình tròn' }).click();
  await page.getByRole('button', { name: 'Bỏ chọn' }).click();

  const sheet = page.getByRole('dialog', { name: /Xuất thiết kế/ });
  await page.getByRole('button', { name: 'Xuất', exact: true }).click();
  await expect(sheet).toBeVisible();

  // PNG (mặc định): tải xuống "Thiệp cưới.png", đúng chữ ký PNG.
  let download = page.waitForEvent('download');
  await sheet.getByRole('button', { name: 'Xuất', exact: true }).click();
  let file = await download;
  expect(file.suggestedFilename()).toBe('Thiệp cưới.png');
  await expect(sheet.getByRole('status')).toContainText('Đã lưu ảnh');

  // JPG chất lượng cao.
  await sheet.getByRole('button', { name: /Ảnh JPG/ }).click();
  await sheet.getByRole('button', { name: 'Cao (gấp đôi)' }).click();
  download = page.waitForEvent('download');
  await sheet.getByRole('button', { name: 'Xuất lại' }).click();
  file = await download;
  expect(file.suggestedFilename()).toBe('Thiệp cưới.jpg');

  // PDF: một file, bắt đầu bằng %PDF, khổ A5 (419.52 × 595.2 điểm).
  await sheet.getByRole('button', { name: /PDF để in/ }).click();
  await expect(sheet.getByRole('button', { name: 'Cao (gấp đôi)' })).toHaveCount(0);
  download = page.waitForEvent('download');
  await sheet.getByRole('button', { name: 'Xuất lại' }).click();
  file = await download;
  expect(file.suggestedFilename()).toBe('Thiệp cưới.pdf');
  const stream = await file.createReadStream();
  const chunks: Uint8Array[] = [];
  for await (const c of stream) chunks.push(c as Uint8Array);
  const text = Array.from(chunks.flatMap((c) => Array.from(c)), (b) => String.fromCharCode(b)).join('');
  expect(text.startsWith('%PDF-1.4')).toBe(true);
  expect(text).toContain('/MediaBox [0 0 419.52 595.2]');

  await sheet.getByRole('button', { name: 'Đóng' }).click();
  await expect(sheet).toHaveCount(0);
});
