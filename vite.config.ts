import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
  define: {
    __API_URL__: JSON.stringify(process.env.VITE_API_URL || 'https://api.yourdomain.com'),
    __CLIENT_URL__: JSON.stringify(process.env.VITE_CLIENT_URL || 'https://yourdomain.com'),
  },
  server: {
    port: 3000,
    open: true,
  },
})
