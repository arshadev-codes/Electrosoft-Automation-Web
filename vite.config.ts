import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // three.js lives in the lazy PanelScene chunk (~170 KB gzip)
  build: { chunkSizeWarningLimit: 700 },
});
