import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ocr: ['tesseract.js'],
          ai: ['@google/generative-ai']
        }
      }
    }
  },
  server: {
    port: 3000,
    host: true
  }
})