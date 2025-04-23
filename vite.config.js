import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      './lib.js': './lib.browser.js'
    }
  },
  optimizeDeps: {
    include: ['xlsx']
  }
});
