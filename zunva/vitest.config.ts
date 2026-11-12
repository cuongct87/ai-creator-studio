import { defineConfig } from 'vitest/config';

// Unit test nằm trong packages/*/src và apps/*/src. Test giao diện (Playwright) nằm ở apps/web/e2e, chạy riêng.
export default defineConfig({
  test: {
    include: ['packages/*/src/**/*.test.ts', 'apps/*/src/**/*.test.ts'],
  },
});
