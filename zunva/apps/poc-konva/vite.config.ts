import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Proof of concept only (G1-4). Port 5174 so it never clashes with apps/web (5173).
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5174, strictPort: true },
  preview: { port: 4174, strictPort: true },
});
