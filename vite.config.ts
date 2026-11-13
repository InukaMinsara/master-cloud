import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { localDrivePlugin } from './vite-plugin-local-drive';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function ortWasmPlugin() {
  return {
    name: 'vite-plugin-ort-wasm',
    enforce: 'pre' as const,
    resolveId(id: string) {
      if (id.startsWith('/ort/') || id.includes('ort-wasm')) {
        return '\0' + id.split('?')[0];
      }
      return null;
    },
    load(id: string) {
      if (id.startsWith('\0') && (id.includes('.mjs') || id.includes('.js'))) {
        const cleanId = id.slice(1);
        const fileName = path.basename(cleanId);
        const distPath = path.resolve(__dirname, 'node_modules', 'onnxruntime-web', 'dist', fileName);
        if (fs.existsSync(distPath)) {
          return fs.readFileSync(distPath, 'utf-8');
        }
        const pubPath = path.resolve(__dirname, 'public', 'ort', fileName);
        if (fs.existsSync(pubPath)) {
          return fs.readFileSync(pubPath, 'utf-8');
        }
      }
      return null;
    },
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url && (req.url.startsWith('/ort/') || req.url.includes('ort-wasm'))) {
          const rawUrl = req.url.split('?')[0];
          const fileName = path.basename(rawUrl);
          const distPath = path.resolve(__dirname, 'node_modules', 'onnxruntime-web', 'dist', fileName);
          const localPath = fs.existsSync(distPath) ? distPath : path.resolve(__dirname, 'public', 'ort', fileName);
          if (fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
            if (fileName.endsWith('.wasm')) {
              res.setHeader('Content-Type', 'application/wasm');
            } else {
              res.setHeader('Content-Type', 'text/javascript');
            }
            res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
            res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
            res.setHeader('Cache-Control', 'no-cache');
            if (req.method === 'HEAD') {
              return res.end();
            }
            return res.end(fs.readFileSync(localPath));
          }
        }
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), localDrivePlugin(), ortWasmPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    hmr: {
      overlay: false,
    },
    proxy: {
      '/api/litter-stream': {
        target: 'https://litter.catbox.moe',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/litter-stream/, ''),
      },
      '/api/catbox-stream': {
        target: 'https://files.catbox.moe',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/catbox-stream/, ''),
      },
      '/api/telegram-proxy': {
        target: 'https://api.telegram.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/telegram-proxy/, ''),
      },
      '/api/catbox-proxy': {
        target: 'https://catbox.moe',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/catbox-proxy/, ''),
      },
      '/api/litterbox-proxy': {
        target: 'https://litterbox.catbox.moe',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/litterbox-proxy/, ''),
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-ui': ['lucide-react', 'sonner'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
