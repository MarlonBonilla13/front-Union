import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',  // Usar ruta absoluta en lugar de './'
  plugins: [react()],
})
