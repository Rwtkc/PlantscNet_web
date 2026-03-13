import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const defaultApiProxyTarget = 'http://218.29.54.90:1116'
const defaultProductionBasePath = '/PlantScNet/'

function normalizeBasePath(value: string) {
  if (!value || value === '/') {
    return '/'
  }

  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

function copyApacheSpaFallback() {
  const sourcePath = path.resolve(__dirname, 'public-static', '.htaccess')

  return {
    name: 'copy-apache-spa-fallback',
    closeBundle() {
      if (!fs.existsSync(sourcePath)) {
        return
      }

      const targetPath = path.resolve(__dirname, 'dist', '.htaccess')
      fs.copyFileSync(sourcePath, targetPath)
    },
  }
}

export default defineConfig(({ command }) => ({
  base:
    command === 'build'
      ? normalizeBasePath(process.env.VITE_APP_BASE_PATH ?? defaultProductionBasePath)
      : '/',
  plugins: [react(), copyApacheSpaFallback()],
  publicDir: 'public-static',
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET ?? defaultApiProxyTarget,
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
}))
