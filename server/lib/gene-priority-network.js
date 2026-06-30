import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import { speciesById } from '../species.js'
import { getBrowseIndex } from './browse-data.js'
import { getDataRoot, normalizeModality, pathExists } from './data-context.js'

export function normalizeNetworkSource(value) {
  return String(value ?? '').trim().toLowerCase() === 'sample' ? 'sample' : 'integrated'
}

function parseNetworkLine(line) {
  const trimmed = line.trim()

  if (!trimmed) {
    return null
  }

  const columns = trimmed.includes('\t') ? trimmed.split(/\t+/) : trimmed.split(',')
  const [source, target, rawWeight = '1'] = columns.map((column) => column.trim())

  if (!source || !target || /^node1$/i.test(source) || /^tf$/i.test(source)) {
    return null
  }

  const weight = Number.parseFloat(rawWeight)

  return {
    source,
    target,
    weight: Number.isFinite(weight) ? weight : 1,
  }
}

export async function forEachNetworkEdge(networkPath, onEdge) {
  const stream = fsSync.createReadStream(networkPath, { encoding: 'utf8' })
  const lines = readline.createInterface({ input: stream, crlfDelay: Infinity })

  for await (const line of lines) {
    const edge = parseNetworkLine(line)

    if (edge) {
      onEdge(edge)
    }
  }
}

export async function collectNetworkExampleGenes(networkPath, limit = 5) {
  const genes = []
  const seen = new Set()
  const stream = fsSync.createReadStream(networkPath, { encoding: 'utf8' })
  const lines = readline.createInterface({ input: stream, crlfDelay: Infinity })

  function addGene(gene) {
    if (!seen.has(gene)) {
      seen.add(gene)
      genes.push(gene)
    }
  }

  for await (const line of lines) {
    const edge = parseNetworkLine(line)

    if (!edge) {
      continue
    }

    addGene(edge.source)

    if (genes.length >= limit) {
      break
    }

    addGene(edge.target)

    if (genes.length >= limit) {
      break
    }
  }

  lines.close()
  stream.destroy()

  return genes.slice(0, limit)
}

export async function resolveToolNetwork({ modality: modalityValue, speciesId, source, sampleId }) {
  const modality = normalizeModality(modalityValue)
  const sourceType = normalizeNetworkSource(source)
  const species = speciesById.get(speciesId)

  if (!species) {
    return null
  }

  const dataRoot = await getDataRoot(modality)

  if (sourceType === 'integrated') {
    const filePath = path.join(dataRoot, speciesId, 'final_regulatory_with_probability.tsv')

    if (!(await pathExists(filePath))) {
      return null
    }

    return {
      modality,
      speciesId,
      speciesLabel: species.label,
      source: sourceType,
      sampleId: null,
      label: `${species.label} integrated network`,
      filePath,
    }
  }

  const { samples } = await getBrowseIndex(modality)
  const sample = samples.find(
    (record) => record.speciesId === speciesId && record.sampleId === sampleId,
  )

  if (!sample) {
    return null
  }

  const filePath = path.join(dataRoot, speciesId, sample.fileName)

  if (!(await pathExists(filePath))) {
    return null
  }

  return {
    modality,
    speciesId,
    speciesLabel: species.label,
    source: sourceType,
    sampleId: sample.sampleId,
    label: `${species.label} / ${sample.sampleId}`,
    tissue: sample.tissue,
    filePath,
  }
}

export async function getToolNetworkIndex(modalityValue) {
  const modality = normalizeModality(modalityValue)
  const dataRoot = await getDataRoot(modality)
  const { species, samples } = await getBrowseIndex(modality)
  const sampleGroups = new Map()

  for (const sample of samples) {
    const group = sampleGroups.get(sample.speciesId) ?? []
    group.push({
      sampleId: sample.sampleId,
      tissue: sample.tissue,
      fileName: sample.fileName,
    })
    sampleGroups.set(sample.speciesId, group)
  }

  const speciesNetworks = await Promise.all(
    species.map(async (entry) => {
      const integratedPath = path.join(dataRoot, entry.id, 'final_regulatory_with_probability.tsv')

      return {
        speciesId: entry.id,
        speciesLabel: entry.label,
        sampleCount: entry.sampleCount,
        integratedAvailable: await pathExists(integratedPath),
        samples: sampleGroups.get(entry.id) ?? [],
      }
    }),
  )

  return {
    modality,
    species: speciesNetworks,
  }
}

export async function getToolJobsRoot() {
  const configuredRoot = process.env.PLANTSCNET_TOOL_JOBS_DIR

  if (configuredRoot) {
    await fs.mkdir(configuredRoot, { recursive: true })
    return configuredRoot
  }

  const fallbackRoot = path.join(process.cwd(), 'tool_jobs')
  await fs.mkdir(fallbackRoot, { recursive: true })
  return fallbackRoot
}
