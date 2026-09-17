import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { mars3dPlugin } from 'vite-plugin-mars3d';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), mars3dPlugin()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    // 跨域配置
    proxy: {
      // 配置 API 代理，确保只匹配真正的 API 请求
      // '/api/': {
      //   target: 'http://localhost:8081', // 后端服务器地址
      //   changeOrigin: true, // 允许跨域
      //   rewrite: (path) => path.replace(/^\/api/, ''), // 重写路径，去掉 /api 前缀
      // },
      // 配置 tester 代理，
      '/api/': {
        target: 'http://35.39.30.226:5050/', // 后端服务器地址
        changeOrigin: true, // 允许跨域
      },
      '/apiController/': {
        target: 'http://35.80.233.154:9008/',
        changeOrigin: true,
      }
    },
  },
});
