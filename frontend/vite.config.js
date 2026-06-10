import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Expose VITE_* env vars to the client bundle
  envPrefix: 'VITE_',
})
