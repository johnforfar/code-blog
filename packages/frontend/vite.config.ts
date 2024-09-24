import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import * as path from 'path';
import mdx from '@mdx-js/rollup';

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/app/' : '/',
  plugins: [
    vue(),
    mdx(),
  ],
  root: path.resolve(__dirname, './'),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  define: {
    'process.env': {},
    'process.browser': true,
    'global': {}
  },
  build: {
    chunkSizeWarningLimit: 1600,
  },

})

