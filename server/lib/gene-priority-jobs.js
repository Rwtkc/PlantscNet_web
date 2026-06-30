import fs from 'node:fs/promises'
import path from 'node:path'
import { runContextPriority, runGbaPriority } from './gene-priority-algorithms.js'
import {
  collectNetworkExampleGenes,
  getToolJobsRoot,
  getToolNetworkIndex,
  normalizeNetworkSource,
  resolveToolNetwork,
} from './gene-priority-network.js'

const jobs = new Map()
const allowedTools = new Set(['gba', 'context'])

function normalizeTool(value) {
  const tool = String(value ?? '').trim().toLowerCase()
  return allowedTools.has(tool) ? tool : null
}

function createJobId(tool) {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '')
  const suffix = Math.random().toString(36).slice(2, 8)
  return `${tool}-${timestamp}-${suffix}`
}

function serializeError(error) {
  return error instanceof Error ? error.message : 'Unexpected gene priority job error.'
}

async function writeJobFile(jobDirectory, fileName, content) {
  if (content === undefined || content === null) {
    return
  }

  await fs.writeFile(path.join(jobDirectory, fileName), String(content))
}

async function persistJob(job) {
  await fs.mkdir(job.directory, { recursive: true })
  await fs.writeFile(path.join(job.directory, 'status.json'), JSON.stringify(job, null, 2))
}

async function persistResultFiles(jobDirectory, result) {
  await writeJobFile(jobDirectory, 'result.json', JSON.stringify(result, null, 2))

  if (result.tool === 'gba') {
    await writeJobFile(jobDirectory, 'auc.txt', result.files.auc)
    await writeJobFile(jobDirectory, 'coreFunction.txt', result.files.coreFunction)
    await writeJobFile(jobDirectory, 'newpathgene.txt', result.files.newpathgene)
    await writeJobFile(jobDirectory, 'allNewCandidateGene.txt', result.files.allNewCandidateGene)
    await writeJobFile(jobDirectory, 'core.sif', result.files.coreSif)
    await writeJobFile(jobDirectory, 'newg.sif', result.files.candidateSif)
    return
  }

  await writeJobFile(jobDirectory, 'contexthub.txt', result.files.contexthub)
}

async function executeJob(job, genes, network) {
  try {
    job.status = 'running'
    job.startedAt = new Date().toISOString()
    await persistJob(job)

    const result =
      job.tool === 'gba'
        ? await runGbaPriority({ genes, network })
        : await runContextPriority({ genes, network })

    await persistResultFiles(job.directory, result)

    job.status = 'complete'
    job.completedAt = new Date().toISOString()
    job.result = {
      ...result,
      files: undefined,
    }
  } catch (error) {
    job.status = 'failed'
    job.error = serializeError(error)
    job.completedAt = new Date().toISOString()
  } finally {
    await persistJob(job)
  }
}

export async function getGenePriorityNetworkIndex(modality) {
  return getToolNetworkIndex(modality)
}

export async function getGenePriorityExampleGenes(payload) {
  const network = await resolveToolNetwork({
    modality: payload?.modality,
    speciesId: payload?.speciesId,
    source: normalizeNetworkSource(payload?.source),
    sampleId: payload?.sampleId,
  })

  if (!network) {
    return null
  }

  const genes = await collectNetworkExampleGenes(network.filePath, 5)

  if (genes.length === 0) {
    return null
  }

  return {
    modality: network.modality,
    speciesId: network.speciesId,
    speciesLabel: network.speciesLabel,
    source: network.source,
    sampleId: network.sampleId,
    genes,
  }
}

export async function createGenePriorityJob(toolValue, payload) {
  const tool = normalizeTool(toolValue)

  if (!tool) {
    throw new Error('Unsupported gene priority tool.')
  }

  const genes = String(payload?.genes ?? '').trim()

  if (!genes) {
    throw new Error('A gene list is required.')
  }

  const network = await resolveToolNetwork({
    modality: payload?.modality,
    speciesId: payload?.speciesId,
    source: normalizeNetworkSource(payload?.source),
    sampleId: payload?.sampleId,
  })

  if (!network) {
    throw new Error('The selected PlantScNet network could not be resolved.')
  }

  const jobsRoot = await getToolJobsRoot()
  const jobId = createJobId(tool)
  const job = {
    jobId,
    tool,
    status: 'queued',
    createdAt: new Date().toISOString(),
    completedAt: null,
    error: null,
    network: {
      modality: network.modality,
      speciesId: network.speciesId,
      speciesLabel: network.speciesLabel,
      source: network.source,
      sampleId: network.sampleId,
      label: network.label,
      tissue: network.tissue ?? null,
    },
    result: null,
    directory: path.join(jobsRoot, jobId),
  }

  jobs.set(jobId, job)
  await persistJob(job)
  setImmediate(() => {
    void executeJob(job, genes, network)
  })

  return job
}

export async function getGenePriorityJob(jobId) {
  const memoryJob = jobs.get(jobId)

  if (memoryJob) {
    return memoryJob
  }

  const jobsRoot = await getToolJobsRoot()
  const statusPath = path.join(jobsRoot, jobId, 'status.json')

  try {
    const content = await fs.readFile(statusPath, 'utf8')
    const job = JSON.parse(content)
    jobs.set(jobId, job)
    return job
  } catch {
    return null
  }
}
