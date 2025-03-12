import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: './', // 🔥 Configuración importante para servir archivos correctamente en Railway
  plugins: [react()],
})