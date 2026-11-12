/**
 * Dựng ảnh thu nhỏ kho mẫu bằng đúng trình vẽ của app (phông thật), ghi vào public/mau/thu-nho/<id>.webp.
 * Chạy: pnpm --filter @zunva/web exec node scripts/anh-thu-nho-mau.mjs
 * (CI chạy lệnh này và tải thư mục kết quả lên artifact "anh-thu-nho-mau".)
 */
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const outDir = fileURLToPath(new URL('../public/mau/thu-nho/', import.meta.url));
const PORT = 5199;

const server = await createServer({
  root,
  configFile: `${root}vite.config.ts`,
  server: { host: '127.0.0.1', port: PORT, strictPort: true },
  logLevel: 'warn',
});
await server.listen();
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  page.on('console', (m) => console.log(`[trang] ${m.text()}`));
  page.on('pageerror', (e) => console.error(`[lỗi trang] ${e.message}`));
  await page.goto(`http://127.0.0.1:${PORT}/scripts/ve-mau.html`);
  await page.waitForFunction(() => typeof globalThis.veMau === 'function', null, { timeout: 120_000 });
  const results = await page.evaluate(() => globalThis.veMau());
  mkdirSync(outDir, { recursive: true });
  for (const { id, webp } of results) {
    const bytes = Buffer.from(webp, 'base64');
    writeFileSync(`${outDir}${id}.webp`, bytes);
    console.log(`${id}.webp  ${(bytes.length / 1024).toFixed(0)} KB`);
  }
  console.log(`Xong ${results.length} ảnh thu nhỏ → ${outDir}`);
} finally {
  await browser.close();
  await server.close();
}
