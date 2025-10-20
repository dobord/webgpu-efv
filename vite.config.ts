import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        main: 'index.html',
        fallback: 'fallback.html',
        diagnostic: 'diagnostic.html',
        test: 'test-webgpu.html'
      }
    }
  },
});
