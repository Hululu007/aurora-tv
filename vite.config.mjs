import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Tauri 期望固定端口 5173。
// 说明：构建使用 terser 而不是 esbuild 压缩，避免部分 Windows 安全软件
// 锁定 esbuild 临时文件导致的 "Access is denied"；产物大小差异可以忽略。
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    minify: 'terser',
    cssMinify: false,
    chunkSizeWarningLimit: 1600,
  },
})
