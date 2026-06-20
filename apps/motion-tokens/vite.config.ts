import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // Force Vite to always reload these files
      ignored: ['!**/src/tokens/generated/**']
    },
    proxy: {
      // Proxy API requests to the Express server
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  optimizeDeps: {
    exclude: ['src/tokens/generated/motion.generated.ts']
  },
  define: {
    // Suppress specific React warnings in development
    '__SUPPRESS_LEGACY_WARNINGS__': JSON.stringify(true),
  },
  esbuild: {
    logOverride: {
      'this-is-undefined-in-esm': 'silent',
      'unsupported-jsx-comment': 'silent'
    }
  }
})
