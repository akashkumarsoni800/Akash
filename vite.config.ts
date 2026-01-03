import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  
  // --- YE PART ADD KARO ---
  build: {
    sourcemap: true, // Isse asli line number dikhega
    minify: false,   // Isse variable ke asli naam dikhenge (ve, gw nahi dikhega)
  },
  server: {
    host: true, // Network par chalane ke liye
  }
})
