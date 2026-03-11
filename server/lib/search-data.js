import fs from 'node:fs/promises'
import path from 'node:path'
import { speciesById } from '../species.js'
import { getBrowseIndex, getDataRoot } from './browse-data.js'
import { parseRegulatoryNetworkRows, parseTfTargetRows } from './browse-data-parsers.js'

const integratedNetworkRowsCache = new Map()
const sampleTfTargetRowsCache = new Map()

function normalizeSearchMode(value) {
  return String(value ?? '').trim().toLowerCase() === 'target' ? 'target' : 'tf'
}

function normalizeSearchQuery(value) {
  return String(value ?? '').trim()
}

function createSearchMatcher(mode, query) {
  const normalizedQuery = query.toUpperCase()

  return (row) => {
    const candidate = mode === 'target' ? row.target : row.tf
    return candidate.toUpperCase() === normalizedQuery
  }
}

function compareDescendingByNumber(left, right, field) {
  const leftValue = Number.parseFloat(String(left[field] ?? ''))
  const rightValue = Number.parseFloat(String(right[field] ?? ''))
  const safeLeft = Number.isFinite(leftValue) ? leftValue : Number.NEGATIVE_INFINITY
  const safeRight = Number.isFinite(rightValue) ? rightValue : Number.NEGATIVE_INFINITY

  return safeRight - safeLeft
}

function pickExampleGene(rows, mode) {
  const candidateField = mode === 'target' ? 'target' : 'tf'

  for (const row of rows) {
    const value = String(row[candidateField] ?? '').trim()

    if (value) {
      return value
    }
  }

  return null
}

async function loadIntegratedSpeciesNetworkRows(speciesId) {
  const species = speciesById.get(speciesId)

  if (!species) {
    return null
  }

  const dataRoot = await getDataRoot()
  const networkPath = path.join(dataRoot, speciesId, 'final_regulatory_with_probability.tsv')

  try {
    const content = await fs.readFile(networkPath, 'utf8')
    return parseRegulatoryNetworkRows(content, Number.MAX_SAFE_INTEGER).map((row) => ({
      tf: row.source,
      target: row.target,
      probability: row.probability,
    }))
  } catch {
    return []
  }
}

async function loadSampleSearchRows(speciesId, sampleId, tissue, fileName) {
  const dataRoot = await getDataRoot()
  const samplePath = path.join(dataRoot, speciesId, fileName)

  try {
    const content = await fs.readFile(samplePath, 'utf8')

    return parseTfTargetRows(content).map((row) => ({
      sampleId,
      tissue,
      tf: row.tf,
      target: row.target,
      importanceScore: row.importanceScore,
    }))
  } catch {
    return []
  }
}

async function getIntegratedRowsForSpecies(speciesId) {
  if (!integratedNetworkRowsCache.has(speciesId)) {
    integratedNetworkRowsCache.set(speciesId, loadIntegratedSpeciesNetworkRows(speciesId))
  }

  return integratedNetworkRowsCache.get(speciesId)
}

async function getSampleRowsForSpecies(speciesId) {
  const { samples } = await getBrowseIndex()
  const speciesSamples = samples.filter((record) => record.speciesId === speciesId)

  const sampleEntries = await Promise.all(
    speciesSamples.map(async (sample) => {
      const cacheKey = `${speciesId}:${sample.sampleId}`

      if (!sampleTfTargetRowsCache.has(cacheKey)) {
        sampleTfTargetRowsCache.set(
          cacheKey,
          loadSampleSearchRows(speciesId, sample.sampleId, sample.tissue, sample.fileName),
        )
      }

      return sampleTfTargetRowsCache.get(cacheKey)
    }),
  )

  return sampleEntries.flat()
}

async function resolveExampleForSpecies(speciesId, mode) {
  const species = speciesById.get(speciesId)

  if (!species) {
    return null
  }

  const integratedRows = (await getIntegratedRowsForSpecies(speciesId)) ?? []
  const sampleRows = await getSampleRowsForSpecies(speciesId)
  const query = pickExampleGene(integratedRows, mode) ?? pickExampleGene(sampleRows, mode)

  if (!query) {
    return null
  }

  return {
    speciesId: species.id,
    speciesLabel: species.label,
    mode,
    query,
  }
}

export async function searchSpeciesNetwork({ speciesId, mode, query }) {
  const species = speciesById.get(speciesId)

  if (!species) {
    return null
  }

  const normalizedMode = normalizeSearchMode(mode)
  const normalizedQuery = normalizeSearchQuery(query)

  if (!normalizedQuery) {
    throw new Error('Search query is required.')
  }

  const matcher = createSearchMatcher(normalizedMode, normalizedQuery)
  const integratedRows = (await getIntegratedRowsForSpecies(speciesId)) ?? []
  const sampleRows = await getSampleRowsForSpecies(speciesId)

  const integratedMatches = integratedRows
    .filter(matcher)
    .sort((left, right) => compareDescendingByNumber(left, right, 'probability'))

  const sampleMatches = sampleRows
    .filter(matcher)
    .sort((left, right) => compareDescendingByNumber(left, right, 'importanceScore'))

  return {
    speciesId: species.id,
    speciesLabel: species.label,
    mode: normalizedMode,
    query: normalizedQuery,
    integratedNetworkAvailable: integratedRows.length > 0,
    integratedMatches,
    sampleMatches,
    summary: {
      integratedMatchCount: integratedMatches.length,
      sampleMatchCount: sampleMatches.length,
    },
  }
}

export async function getSearchExample({ speciesId, mode }) {
  const normalizedMode = normalizeSearchMode(mode)

  if (speciesId) {
    return resolveExampleForSpecies(speciesId, normalizedMode)
  }

  for (const species of speciesById.values()) {
    const example = await resolveExampleForSpecies(species.id, normalizedMode)

    if (example) {
      return example
    }
  }

  return null
}
