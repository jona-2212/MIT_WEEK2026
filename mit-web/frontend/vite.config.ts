import path from 'path'
import { fileURLToPath } from 'url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: { '/api/v1': 'http://127.0.0.1:8000' },
  },
  resolve: {
    alias: {
      html2canvas: path.resolve(__dirname, 'src/shims/html2canvas.ts'),
    },
  },
})
