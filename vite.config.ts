import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // e.g. "/jikkyo/" for GitHub Pages; Netlify serves the app at the root
  base: process.env.BASE_PATH || '/',
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
    }),
  ],
  server: {
    port: 3000,
  },
})
