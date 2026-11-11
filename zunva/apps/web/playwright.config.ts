import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    ...devices['Desktop Chrome'],
    // Khổ điện thoại nhỏ phổ biến: mọi màn hình phải vừa 360 px.
    viewport: { width: 360, height: 780 },
  },
  webServer: {
    command: 'pnpm build && pnpm preview --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
