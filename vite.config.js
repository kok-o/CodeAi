import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Fix Vite 8 / Rolldown Windows path issue:
  // Without explicit root, Rolldown receives an absolute Windows path (C:\...)
  // which it cannot normalize as a relative output filename.
  root: process.cwd(),
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      'es-toolkit/compat/get': path.resolve(__dirname, 'src/compat/get.js'),
      'es-toolkit/compat/isPlainObject': path.resolve(__dirname, 'src/compat/isPlainObject.js'),
      'es-toolkit/compat/last': path.resolve(__dirname, 'src/compat/last.js'),
      'es-toolkit/compat/maxBy': path.resolve(__dirname, 'src/compat/maxBy.js'),
      'es-toolkit/compat/minBy': path.resolve(__dirname, 'src/compat/minBy.js'),
      'es-toolkit/compat/omit': path.resolve(__dirname, 'src/compat/omit.js'),
      'es-toolkit/compat/range': path.resolve(__dirname, 'src/compat/range.js'),
      'es-toolkit/compat/sortBy': path.resolve(__dirname, 'src/compat/sortBy.js'),
      'es-toolkit/compat/sumBy': path.resolve(__dirname, 'src/compat/sumBy.js'),
      'es-toolkit/compat/throttle': path.resolve(__dirname, 'src/compat/throttle.js'),
      'es-toolkit/compat/uniqBy': path.resolve(__dirname, 'src/compat/uniqBy.js')
    }
  }
})


