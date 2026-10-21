import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Dev only: /dev/export posts each code-built model here as .glb and it is saved to exports/. */
function modelExport(): Plugin {
  return {
    name: 'model-export',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__export', (req, res) => {
        const name = new URL(req.url ?? '', 'http://x').searchParams.get('name') ?? '';
        if (req.method !== 'POST' || !/^[a-z0-9-]+\.glb$/.test(name)) { res.statusCode = 400; res.end('bad request'); return; }
        const chunks: Buffer[] = [];
        req.on('data', c => chunks.push(c));
        req.on('end', () => {
          const dir = resolve(process.cwd(), 'exports');
          mkdirSync(dir, { recursive: true });
          writeFileSync(resolve(dir, name), Buffer.concat(chunks));
          res.end('saved');
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), modelExport()],
  // three.js lives in the lazy PanelScene chunk (~170 KB gzip)
  build: { chunkSizeWarningLimit: 700 },
});
