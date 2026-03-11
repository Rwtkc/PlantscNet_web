import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  getBrowseIndex,
  getSampleDetail,
  getSampleNetworkPreview,
  getSpeciesNetworkRelations,
  getSpeciesNetworkPreview,
  getSpeciesTfTargetCounts,
} from './lib/browse-data.js'

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

  app.get('/api/browse/species/:speciesId/network-preview', async (request, response, next) => {
    try {
      const networkPreview = await getSpeciesNetworkPreview(request.params.speciesId, {
        limit: request.query.limit,
        threshold: request.query.threshold,
        tf: request.query.tf,
      })

      if (!networkPreview) {
        response.status(404).json({ error: 'Species network preview not found.' })
        return
      }

      response.json(networkPreview)
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/browse/species/:speciesId/network-relations', async (request, response, next) => {
    try {
      const relations = await getSpeciesNetworkRelations(request.params.speciesId, {
        page: request.query.page,
        pageSize: request.query.pageSize,
        threshold: request.query.threshold,
        tf: request.query.tf,
      })

      if (!relations) {
        response.status(404).json({ error: 'Species network relations not found.' })
        return
      }

      response.json(relations)
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

  app.get(
    '/api/browse/species/:speciesId/samples/:sampleId/network-preview',
    async (request, response, next) => {
      try {
        const networkPreview = await getSampleNetworkPreview(
          request.params.speciesId,
          request.params.sampleId,
          {
            limit: request.query.limit,
            threshold: request.query.threshold,
            tf: request.query.tf,
          },
        )

        if (!networkPreview) {
          response.status(404).json({ error: 'Sample network preview not found.' })
          return
        }

        response.json(networkPreview)
      } catch (error) {
        next(error)
      }
    },
  )

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
