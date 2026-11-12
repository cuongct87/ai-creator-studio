import { expect, test, type Page } from '@playwright/test';

/** Ảnh mẫu: PNG đỏ 400×400 (e2e/fixtures/do-400.png). */
const redPng = () => `${test.info().project.testDir}/fixtures/do-400.png`;

/** Thông tin khi lỗi: câu báo của app + nhãn nút hoàn tác. */
async function diag(page: Page): Promise<string> {
  const msg = await page.locator('.editor-message').allTextContents();
  const undo = await page.getByRole('button', { name: /^Hoàn tác/ }).getAttribute('aria-label');
  return `báo: ${JSON.stringify(msg)} | hoàn tác: ${undo ?? '-'}`;
}

/** Màu điểm giữa vùng vẽ (đọc thẳng từ canvas của Konva). */
async function centerPixel(page: Page): Promise<number[]> {
  return page.evaluate(() => {
    const wrap = document.querySelector('[aria-label="Trang thiết kế"]')!;
    const r = wrap.getBoundingClientRect();
    const canvases = Array.from(wrap.querySelectorAll('canvas'));
    const c = canvases[0]!;
    const ctx = c.getContext('2d')!;
    const sx = c.width / c.getBoundingClientRect().width;
    const px = ctx.getImageData(Math.round((r.width / 2) * sx), Math.round((r.height / 2) * sx), 1, 1).data;
    return [px[0]!, px[1]!, px[2]!, px[3]!];
  });
}

test('ghép ảnh: tẩy một nét, mờ viền, bỏ hết vùng tẩy (G2b)', async ({ page }) => {
  await page.goto('/');
  await page.locator('.starts').getByRole('button', { name: 'Mạng xã hội' }).click();
  const stage = page.getByRole('region', { name: /Trang 1080×1080/ });
  await expect(stage).toBeVisible();

  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Ảnh', exact: true }).click();
  await (await chooser).setFiles(redPng());
  await expect(stage).toHaveAccessibleName(/1 lớp/);
  await expect.poll(async () => (await centerPixel(page))[0]).toBeGreaterThan(180); // ảnh đỏ ở giữa

  // Vào chế độ tẩy, kéo chuột ngang qua giữa ảnh.
  await page.getByRole('button', { name: 'Tẩy', exact: true }).click();
  await expect(page.getByLabel('Chế độ tẩy')).toBeVisible();
  const box = (await page.getByLabel('Trang thiết kế').boundingBox())!;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx - 40, cy);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(cx - 40 + i * 8, cy);
  await page.mouse.up();
  await expect(page.getByRole('button', { name: /^Hoàn tác: Tẩy/ })).toBeVisible({ timeout: 5000 });
  // Chỗ đã tẩy lộ nền trắng của trang.
  await expect.poll(async () => (await centerPixel(page))[1]).toBeGreaterThan(150);

  // Thoát chế độ tẩy: ảnh có vùng tẩy → có nút "Bỏ hết vùng tẩy".
  await page.getByLabel('Chế độ tẩy').getByRole('button', { name: 'Xong' }).click();
  await expect(page.getByRole('button', { name: 'Bỏ hết vùng tẩy' })).toBeVisible();

  // Mờ viền.
  await page.getByLabel(/^Mờ viền/).fill('40');
  await expect(page.getByText('Mờ viền: 40')).toBeVisible();

  // Bỏ hết vùng tẩy → ảnh đỏ trở lại ở giữa.
  await page.getByRole('button', { name: 'Bỏ hết vùng tẩy' }).click();
  await expect(page.getByRole('button', { name: /^Hoàn tác: Bỏ hết vùng tẩy/ }), await diag(page)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Bỏ hết vùng tẩy' }), await diag(page)).toHaveCount(0);
  await expect.poll(async () => (await centerPixel(page))[0]).toBeGreaterThan(180);

  // Tải lại trang: dữ liệu còn (mờ viền 40).
  await expect(page.getByText('Đã lưu')).toBeVisible({ timeout: 5000 });
  await page.reload();
  await page.getByRole('button', { name: 'Lớp', exact: true }).click();
  await page.getByRole('list', { name: 'Danh sách lớp' }).getByRole('button').first().click();
  await expect(page.getByText('Mờ viền: 40')).toBeVisible();
});
