import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // <--- "/" ki jagah "./" karein (Relative path)
  build: {
    sourcemap: true,
    minify: false,
  },
  server: {
    host: true,
  }
})
