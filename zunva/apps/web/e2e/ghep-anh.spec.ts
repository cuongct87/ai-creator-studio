import { expect, test, type Page } from '@playwright/test';
import { deflateSync } from 'node:zlib';

/** PNG một màu (không cần file mẫu). */
function solidPng(width: number, height: number, [r, g, b]: [number, number, number]): Buffer {
  const table = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf: Buffer) => {
    let c = 0xffffffff;
    for (const byte of buf) c = table[(c ^ byte) & 0xff]! ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const sum = Buffer.alloc(4);
    sum.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, sum]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.set([8, 2, 0, 0, 0], 8);
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 3 + 1);
    for (let x = 0; x < width; x++) raw.set([r, g, b], row + 1 + x * 3);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
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
  await (await chooser).setFiles({ name: 'do.png', mimeType: 'image/png', buffer: solidPng(400, 400, [220, 20, 20]) });
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
  await expect(page.getByRole('button', { name: 'Bỏ hết vùng tẩy' })).toHaveCount(0);
  await expect.poll(async () => (await centerPixel(page))[0]).toBeGreaterThan(180);

  // Tải lại trang: dữ liệu còn (mờ viền 40).
  await expect(page.getByText('Đã lưu')).toBeVisible({ timeout: 5000 });
  await page.reload();
  await page.getByRole('button', { name: 'Lớp', exact: true }).click();
  await page.getByRole('list', { name: 'Danh sách lớp' }).getByRole('button').first().click();
  await expect(page.getByText('Mờ viền: 40')).toBeVisible();
});
