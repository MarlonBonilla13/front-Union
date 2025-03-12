import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',  // Usar ruta absoluta en lugar de './'
  plugins: [react()],
  build: {
    outDir: 'dist',  // Asegúrate de que la salida sea 'dist'
    rollupOptions: {
      input: '/index.html',  // Asegúrate de que el archivo de entrada sea el correcto
    },
  },
})
