import { defineConfig } from 'vitest/config';

// Unit test chỉ nằm trong packages/*/src. Test giao diện (Playwright) nằm ở apps/web/e2e, chạy riêng.
export default defineConfig({
  test: {
    include: ['packages/*/src/**/*.test.ts'],
  },
});
