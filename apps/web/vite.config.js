import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Libraries change far less often than our code, so they get their own long-cached files: after a deploy,
// returning visitors download only the app code again.
const VENDOR = {
  react: ['react', 'react-dom', 'react-router', 'react-router-dom', 'scheduler'],
  motion: ['gsap', 'lenis'],
  icons: ['lucide-react'],
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {proxy: {'/api': 'http://127.0.0.1:4000'}},
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const pkg = id.match(/node_modules\/((?:@[^/]+\/)?[^/]+)/)?.[1];
          return pkg && Object.keys(VENDOR).find((name) => VENDOR[name].includes(pkg));
        },
      },
    },
  },
});
