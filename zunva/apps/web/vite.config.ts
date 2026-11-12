import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // Đường dẫn tương đối để chạy được cả trên web lẫn trong vỏ Capacitor/Tauri sau này.
  base: './',
  // Chỉ một bản React cho cả app và gói @zunva/editor-canvas (hai bản sẽ làm hỏng hook).
  resolve: { dedupe: ['react', 'react-dom'] },
});
