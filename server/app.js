import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getBrowseIndex, getSampleDetail, getSpeciesTfTargetCounts } from './lib/browse-data.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '..', 'dist')

export function createApp() {
  const app = express()

  app.disable('x-powered-by')

  app.get('/api/health', async (_request, response) => {
    response.json({ status: 'ok' })
  })

  app.get('/api/browse/index', async (_request, response, next) => {
    try {
      const index = await getBrowseIndex()
      response.json(index)
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/browse/species/:speciesId/tf-target-counts', async (request, response, next) => {
    try {
      const tfTargetCounts = await getSpeciesTfTargetCounts(request.params.speciesId)

      if (!tfTargetCounts) {
        response.status(404).json({ error: 'Species not found.' })
        return
      }

      response.json(tfTargetCounts)
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/browse/species/:speciesId/samples/:sampleId', async (request, response, next) => {
    try {
      const sampleDetail = await getSampleDetail(request.params.speciesId, request.params.sampleId, {
        page: request.query.page,
        pageSize: request.query.pageSize,
      })

      if (!sampleDetail) {
        response.status(404).json({ error: 'Sample not found.' })
        return
      }

      response.json(sampleDetail)
    } catch (error) {
      next(error)
    }
  })

  app.use(express.static(distDir, { index: false }))

  app.get(/^(?!\/api\/).*/, async (_request, response) => {
    response.sendFile(path.join(distDir, 'index.html'))
  })

  app.use((error, _request, response, _next) => {
    const message = error instanceof Error ? error.message : 'Unexpected server error.'
    response.status(500).json({ error: message })
  })

  return app
}
