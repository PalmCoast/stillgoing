import netlify from '@netlify/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    netlify({
      // Static raid: no functions, database, or edge runtime. Those boot a Deno
      // server this environment cannot start, and the app does not need them.
      edgeFunctions: { enabled: false },
      functions: { enabled: false },
      database: { enabled: false },
      blobs: { enabled: false },
    }),
  ],
})
