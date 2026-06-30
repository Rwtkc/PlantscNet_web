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
import { sendContactRequestMail, validateContactRequest } from './lib/contact-mail.js'
import { getDownloadAssets, resolveDownloadAsset } from './lib/download-data.js'
import {
  createGenePriorityJob,
  getGenePriorityExampleGenes,
  getGenePriorityJob,
  getGenePriorityNetworkIndex,
} from './lib/gene-priority-jobs.js'
import { getSearchExample, searchSpeciesNetwork } from './lib/search-data.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '..', 'dist')

export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  app.use((request, response, next) => {
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (request.method === 'OPTIONS') {
      response.status(204).end()
      return
    }

    next()
  })
  app.use(express.json())

  app.get('/api/health', async (_request, response) => {
    response.json({ status: 'ok' })
  })

  app.post('/api/contact/request', async (request, response, next) => {
    try {
      const validation = validateContactRequest(request.body)

      if (validation.error || !validation.data) {
        response.status(400).json({
          ok: false,
          message: validation.error ?? 'Invalid contact request payload.',
        })
        return
      }

      await sendContactRequestMail(validation.data)
      response.status(200).json({
        ok: true,
        message: 'Your request has been emailed successfully.',
      })
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/download/assets', async (_request, response, next) => {
    try {
      const assets = await getDownloadAssets()
      response.json(assets)
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/download/:assetKey/:speciesId', async (request, response, next) => {
    try {
      const asset = await resolveDownloadAsset(request.params.speciesId, request.params.assetKey)

      if (!asset) {
        response.status(404).json({ error: 'Download asset not found.' })
        return
      }

      response.download(asset.filePath, asset.downloadName)
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/browse/index', async (request, response, next) => {
    try {
      const index = await getBrowseIndex(request.query.modality)
      response.json(index)
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/browse/species/:speciesId/tf-target-counts', async (request, response, next) => {
    try {
      const tfTargetCounts = await getSpeciesTfTargetCounts(request.params.speciesId, {
        modality: request.query.modality,
      })

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
        modality: request.query.modality,
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
        modality: request.query.modality,
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
        modality: request.query.modality,
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
            modality: request.query.modality,
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

  app.get('/api/search/species/:speciesId/network', async (request, response, next) => {
    try {
      const result = await searchSpeciesNetwork({
        speciesId: request.params.speciesId,
        mode: request.query.mode,
        query: request.query.query,
        modality: request.query.modality,
      })

      if (!result) {
        response.status(404).json({ error: 'Species search data not found.' })
        return
      }

      response.json(result)
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/search/example', async (request, response, next) => {
    try {
      const example = await getSearchExample({
        speciesId: request.query.speciesId,
        mode: request.query.mode,
        modality: request.query.modality,
      })

      if (!example) {
        response.status(404).json({ error: 'No example query could be resolved.' })
        return
      }

      response.json(example)
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/tools/networks', async (request, response, next) => {
    try {
      const index = await getGenePriorityNetworkIndex(request.query.modality)
      response.json(index)
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/tools/example', async (request, response, next) => {
    try {
      const example = await getGenePriorityExampleGenes({
        modality: request.query.modality,
        speciesId: request.query.speciesId,
        source: request.query.source,
        sampleId: request.query.sampleId,
      })

      if (!example) {
        response.status(404).json({ error: 'No tool example genes could be resolved.' })
        return
      }

      response.json(example)
    } catch (error) {
      next(error)
    }
  })

  app.post('/api/tools/:tool/jobs', async (request, response, next) => {
    try {
      const job = await createGenePriorityJob(request.params.tool, request.body)
      response.status(202).json(job)
    } catch (error) {
      response.status(400)
      next(error)
    }
  })

  app.get('/api/tools/jobs/:jobId', async (request, response, next) => {
    try {
      const job = await getGenePriorityJob(request.params.jobId)

      if (!job) {
        response.status(404).json({ error: 'Gene priority job not found.' })
        return
      }

      response.json(job)
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
    const statusCode = response.statusCode >= 400 ? response.statusCode : 500
    response.status(statusCode).json({ error: message, ok: false, message })
  })

  return app
}
