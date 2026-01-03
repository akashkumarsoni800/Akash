import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // <--- Yahan se bhi dot (.) hata dein, sirf '/' rakhein
  build: {
    sourcemap: true,
    minify: false,
  },
  server: {
    host: true,
  }
})
