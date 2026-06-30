import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig, type Plugin, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import {
  ArticleFigureExportError,
  buildExpectedAppOrigin,
  parseArticleFigureExportWidth,
  renderArticleFigurePng,
  resolveArticleFigurePageUrl,
} from './server/lib/article-figure-export.js'

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

function articleFigureExportDevPlugin(): Plugin {
  return {
    name: 'article-figure-export-dev',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(
        '/api/article-figure/export.png',
        async (request: IncomingMessage, response: ServerResponse) => {
        if (request.method !== 'GET') {
          response.statusCode = 405
          response.setHeader('Allow', 'GET')
          response.end('Method Not Allowed')
          return
        }

        try {
          const requestOrigin = buildExpectedAppOrigin(
            'http',
            request.headers.host ?? '127.0.0.1:5173',
          )
          const requestUrl = new URL(
            request.url ?? '',
            `${requestOrigin}/api/article-figure/export.png`,
          )
          const width = parseArticleFigureExportWidth(requestUrl.searchParams.get('width'))
          const pageUrl = resolveArticleFigurePageUrl({
            expectedOrigin: requestOrigin,
            requestedPageUrl: requestUrl.searchParams.get('pageUrl'),
          })
          const pngBuffer = await renderArticleFigurePng({
            pageUrl,
            width,
          })

          response.statusCode = 200
          response.setHeader('Cache-Control', 'no-store')
          response.setHeader('Content-Disposition', `attachment; filename="plantscnet-article-figure-${width}w.png"`)
          response.setHeader('Content-Type', 'image/png')
          response.end(pngBuffer)
        } catch (error) {
          const exportError =
            error instanceof ArticleFigureExportError
              ? error
              : new ArticleFigureExportError('Failed to export article figure PNG.', 500)

          response.statusCode = exportError.statusCode
          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          response.end(JSON.stringify({ error: exportError.message }))

          if (!(error instanceof ArticleFigureExportError)) {
            server.config.logger.error(error instanceof Error ? error.stack ?? error.message : String(error))
          }
        }
        },
      )
    },
  }
}

export default defineConfig(({ command }) => ({
  base:
    command === 'build'
      ? normalizeBasePath(process.env.VITE_APP_BASE_PATH ?? defaultProductionBasePath)
      : '/',
  plugins: [react(), copyApacheSpaFallback(), articleFigureExportDevPlugin()],
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
