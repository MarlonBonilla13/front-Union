import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // 🔥 Ajuste importante para el despliegue en Railway
  server: {
    port: 5173, // Puerto que usa Vite en desarrollo
    host: true, // Permite que Railway acceda a la app en el puerto asignado
  },
  build: {
    outDir: 'dist', // Carpeta donde se generarán los archivos de producción
  }
});
