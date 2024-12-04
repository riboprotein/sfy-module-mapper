import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  build: {
    outDir: 'docs'  // Changed from 'dist' to 'docs'
  },
  plugins: [react()],
})
