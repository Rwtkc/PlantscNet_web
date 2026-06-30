import fs from 'node:fs/promises'
import path from 'node:path'
import { speciesById, speciesCatalog } from '../species.js'
import {
  __resetDataContextCacheForTests,
  getDataRoot,
  normalizeModality,
  resolveSpeciesMetaDirectory,
} from './data-context.js'
import {
  parseRegulatoryNetworkRows,
  parseSampleInformation,
  parseSampleInformationLine,
  parseSampleTfTargetNetworkRows,
  parseTfTargetCount,
  parseTfTargetRows,
} from './browse-data-parsers.js'

const browseIndexPromises = new Map()
const speciesTfTargetCountsCache = new Map()
const sampleDetailCache = new Map()
const speciesNetworkRowsCache = new Map()
const speciesNetworkPreviewCache = new Map()
const sampleNetworkRowsCache = new Map()
const sampleNetworkPreviewCache = new Map()
const speciesNetworkRelationsCache = new Map()
const defaultNetworkThreshold = 0.5
const singleSampleRecommendedThresholdQuantile = 0.75

function createModalityCacheKey(modality, ...parts) {
  return [normalizeModality(modality), ...parts].join(':')
}

function normalizePositiveInteger(value, fallback) {
  const numericValue = Number.parseInt(String(value ?? ''), 10)

  if (Number.isFinite(numericValue) && numericValue > 0) {
    return numericValue
  }

  return fallback
}

function roundNetworkThreshold(value) {
  return Number(value.toFixed(2))
}

function calculateQuantile(sortedValues, quantile) {
  if (sortedValues.length === 0) {
    return Number.NaN
  }

  const safeQuantile = Math.min(Math.max(quantile, 0), 1)
  const position = (sortedValues.length - 1) * safeQuantile
  const lowerIndex = Math.floor(position)
  const upperIndex = Math.ceil(position)

  if (lowerIndex === upperIndex) {
    return sortedValues[lowerIndex]
  }

  const fraction = position - lowerIndex

  return (
    sortedValues[lowerIndex] * (1 - fraction) + sortedValues[upperIndex] * fraction
  )
}

function resolveRecommendedNetworkThreshold(source) {
  if (source.sourceKind !== 'single-sample') {
    return defaultNetworkThreshold
  }

  const finiteScores = source.rows
    .map((row) => row.probability)
    .filter((score) => Number.isFinite(score) && score >= 0)
    .sort((left, right) => left - right)

  if (finiteScores.length === 0) {
    return defaultNetworkThreshold
  }

  const quantileValue = calculateQuantile(
    finiteScores,
    singleSampleRecommendedThresholdQuantile,
  )

  if (!Number.isFinite(quantileValue)) {
    return defaultNetworkThreshold
  }

  return Math.max(defaultNetworkThreshold, roundNetworkThreshold(quantileValue))
}

function compareNetworkRowProbability(left, right) {
  const leftProbability = Number.isFinite(left.probability)
    ? left.probability
    : Number.NEGATIVE_INFINITY
  const rightProbability = Number.isFinite(right.probability)
    ? right.probability
    : Number.NEGATIVE_INFINITY

  return rightProbability - leftProbability
}

async function loadSpeciesNetworkRows(speciesId, modalityValue) {
  const modality = normalizeModality(modalityValue)
  const species = speciesById.get(speciesId)

  if (!species) {
    return null
  }

  const dataRoot = await getDataRoot(modality)
  const networkPath = path.join(dataRoot, speciesId, 'final_regulatory_with_probability.tsv')
  const { samples } = await getBrowseIndex(modality)
  const speciesSamples = samples.filter((record) => record.speciesId === speciesId)

  try {
    const content = await fs.readFile(networkPath, 'utf8')
    return {
      sourceKind: 'species-preview',
      rows: parseRegulatoryNetworkRows(content, Number.MAX_SAFE_INTEGER),
    }
  } catch {
    if (speciesSamples.length !== 1) {
      return null
    }

    const fallbackPath = path.join(dataRoot, speciesId, speciesSamples[0].fileName)

    try {
      const content = await fs.readFile(fallbackPath, 'utf8')
      return {
        sourceKind: 'single-sample',
        rows: parseSampleTfTargetNetworkRows(content, Number.MAX_SAFE_INTEGER),
      }
    } catch {
      return null
    }
  }
}

async function loadSampleNetworkRows(speciesId, sampleId, modalityValue) {
  const modality = normalizeModality(modalityValue)
  const species = speciesById.get(speciesId)

  if (!species) {
    return null
  }

  const { samples } = await getBrowseIndex(modality)
  const sampleRecord = samples.find(
    (record) => record.speciesId === speciesId && record.sampleId === sampleId,
  )

  if (!sampleRecord) {
    return null
  }

  const dataRoot = await getDataRoot(modality)
  const samplePath = path.join(dataRoot, speciesId, sampleRecord.fileName)

  try {
    const content = await fs.readFile(samplePath, 'utf8')
    return {
      sourceKind: 'single-sample',
      rows: parseSampleTfTargetNetworkRows(content, Number.MAX_SAFE_INTEGER),
    }
  } catch {
    return null
  }
}

async function readSampleRecordsForSpecies(species, modalityValue) {
  const modality = normalizeModality(modalityValue)
  const dataRoot = await getDataRoot(modality)
  const sampleInfoPath = path.join(dataRoot, species.id, 'sample_imformation.txt')

  try {
    const content = await fs.readFile(sampleInfoPath, 'utf8')
    return parseSampleInformation(species, content)
  } catch {
    return []
  }
}

async function loadBrowseIndex(modalityValue) {
  const modality = normalizeModality(modalityValue)
  const sampleGroups = await Promise.all(
    speciesCatalog.map(async (species) => ({
      species,
      samples: await readSampleRecordsForSpecies(species, modality),
    })),
  )
  const availableSampleGroups = sampleGroups.filter(({ samples }) => samples.length > 0)

  return {
    species: availableSampleGroups.map(({ species, samples }) => ({
      id: species.id,
      label: species.label,
      sampleCount: samples.length,
    })),
    samples: availableSampleGroups.flatMap(({ samples }) => samples),
  }
}

export async function getBrowseIndex(modalityValue = 'rna') {
  const modality = normalizeModality(modalityValue)

  if (!browseIndexPromises.has(modality)) {
    browseIndexPromises.set(modality, loadBrowseIndex(modality))
  }

  return browseIndexPromises.get(modality)
}

async function loadSpeciesTfTargetCounts(speciesId, modalityValue) {
  const modality = normalizeModality(modalityValue)
  const species = speciesById.get(speciesId)

  if (!species) {
    return null
  }

  const dataRoot = await getDataRoot(modality)
  const { samples } = await getBrowseIndex(modality)
  const speciesSamples = samples.filter((record) => record.speciesId === speciesId)

  const countEntries = await Promise.all(
    speciesSamples.map(async (record) => {
      const samplePath = path.join(dataRoot, speciesId, record.fileName)

      try {
        const content = await fs.readFile(samplePath, 'utf8')
        return [record.fileName, parseTfTargetCount(content)]
      } catch {
        return [record.fileName, null]
      }
    }),
  )

  return Object.fromEntries(countEntries)
}

export async function getSpeciesTfTargetCounts(speciesId, options = {}) {
  if (!speciesById.has(speciesId)) {
    return null
  }

  const modality = normalizeModality(options.modality)
  const cacheKey = createModalityCacheKey(modality, speciesId)

  if (!speciesTfTargetCountsCache.has(cacheKey)) {
    speciesTfTargetCountsCache.set(cacheKey, loadSpeciesTfTargetCounts(speciesId, modality))
  }

  return speciesTfTargetCountsCache.get(cacheKey)
}

async function loadSpeciesNetworkPreview(speciesId, options) {
  const modality = normalizeModality(options.modality)
  const species = speciesById.get(speciesId)

  if (!species) {
    return null
  }

  const rowCacheKey = createModalityCacheKey(modality, speciesId)

  if (!speciesNetworkRowsCache.has(rowCacheKey)) {
    speciesNetworkRowsCache.set(rowCacheKey, loadSpeciesNetworkRows(speciesId, modality))
  }

  const source = await speciesNetworkRowsCache.get(rowCacheKey)

  if (!source) {
    return null
  }

  return buildNetworkPreview(speciesId, species.label, source, options)
}

export async function getSpeciesNetworkPreview(speciesId, options = {}) {
  if (!speciesById.has(speciesId)) {
    return null
  }

  const modality = normalizeModality(options.modality)
  const limit = normalizePositiveInteger(options.limit, 500)
  const threshold = Number.parseFloat(String(options.threshold ?? String(defaultNetworkThreshold)))
  const normalizedThreshold = Number.isFinite(threshold) ? threshold : defaultNetworkThreshold
  const tfFilter = String(options.tf ?? '').trim().toLowerCase()
  const cacheKey = createModalityCacheKey(
    modality,
    speciesId,
    limit,
    normalizedThreshold,
    tfFilter,
  )

  if (!speciesNetworkPreviewCache.has(cacheKey)) {
    speciesNetworkPreviewCache.set(
      cacheKey,
      loadSpeciesNetworkPreview(speciesId, {
        limit,
        threshold: normalizedThreshold,
        tf: tfFilter,
        modality,
      }),
    )
  }

  return speciesNetworkPreviewCache.get(cacheKey)
}

function buildFilteredNetworkRows(source, options = {}) {
  const threshold = Number.parseFloat(String(options.threshold ?? String(defaultNetworkThreshold)))
  const normalizedThreshold = Number.isFinite(threshold) ? threshold : defaultNetworkThreshold
  const rawTfFilter = String(options.tf ?? '').trim()
  const normalizedTfFilter = rawTfFilter.toLowerCase()
  const thresholdFilteredRows = source.rows.filter((row) => {
    const probability = Number.isFinite(row.probability)
      ? row.probability
      : Number.NEGATIVE_INFINITY

    return probability >= normalizedThreshold
  })
  const filteredRows = !normalizedTfFilter
    ? thresholdFilteredRows
    : (() => {
        const focusedRows = thresholdFilteredRows.filter((row) =>
          row.source.toLowerCase().includes(normalizedTfFilter),
        )

        if (focusedRows.length === 0) {
          return []
        }

        const focusedNodeIds = new Set()

        focusedRows.forEach((row) => {
          focusedNodeIds.add(row.source)
          focusedNodeIds.add(row.target)
        })

        return thresholdFilteredRows.filter(
          (row) => focusedNodeIds.has(row.source) && focusedNodeIds.has(row.target),
        )
      })()

  return {
    normalizedThreshold,
    rawTfFilter,
    filteredRows,
  }
}

function buildNetworkPreview(speciesId, speciesLabel, source, options = {}) {
  const limit = normalizePositiveInteger(options.limit, 500)
  const recommendedThreshold = resolveRecommendedNetworkThreshold(source)
  const { normalizedThreshold, rawTfFilter, filteredRows } = buildFilteredNetworkRows(
    source,
    options,
  )
  const normalizedTfFilter = rawTfFilter.toLowerCase()
  const links = !normalizedTfFilter
    ? filteredRows.slice().sort(compareNetworkRowProbability).slice(0, limit)
    : (() => {
        const primaryRows = filteredRows
          .filter((row) => row.source.toLowerCase().includes(normalizedTfFilter))
          .sort(compareNetworkRowProbability)
        const primaryKeys = new Set(
          primaryRows.map((row) => `${row.source}\t${row.target}\t${row.probability}`),
        )
        const secondaryRows = filteredRows
          .filter((row) => !primaryKeys.has(`${row.source}\t${row.target}\t${row.probability}`))
          .sort(compareNetworkRowProbability)

        return primaryRows.concat(secondaryRows).slice(0, limit)
      })()
  const tfNodeIds = new Set(source.rows.map((row) => row.source))
  const nodes = new Map()

  links.forEach((link) => {
    if (!nodes.has(link.source)) {
      nodes.set(link.source, {
        id: link.source,
        type: 'tf',
      })
    }

    if (!nodes.has(link.target)) {
      nodes.set(link.target, {
        id: link.target,
        type: tfNodeIds.has(link.target) ? 'tf' : 'target',
      })
    }
  })

  return {
    speciesId,
    speciesLabel,
    sampleId: options.sampleId ?? null,
    limit,
    threshold: normalizedThreshold,
    recommendedThreshold,
    tfFilter: rawTfFilter || null,
    sourceKind: source.sourceKind,
    totalAvailableLinks: filteredRows.length,
    totalNodes: nodes.size,
    totalLinks: links.length,
    nodes: Array.from(nodes.values()),
    links,
  }
}

export async function getSampleNetworkPreview(speciesId, sampleId, options = {}) {
  if (!speciesById.has(speciesId)) {
    return null
  }

  const modality = normalizeModality(options.modality)
  const limit = normalizePositiveInteger(options.limit, 500)
  const threshold = Number.parseFloat(String(options.threshold ?? String(defaultNetworkThreshold)))
  const normalizedThreshold = Number.isFinite(threshold) ? threshold : defaultNetworkThreshold
  const tfFilter = String(options.tf ?? '').trim().toLowerCase()
  const rowCacheKey = createModalityCacheKey(modality, speciesId, sampleId)
  const previewCacheKey = createModalityCacheKey(
    modality,
    speciesId,
    sampleId,
    limit,
    normalizedThreshold,
    tfFilter,
  )

  if (!sampleNetworkRowsCache.has(rowCacheKey)) {
    sampleNetworkRowsCache.set(rowCacheKey, loadSampleNetworkRows(speciesId, sampleId, modality))
  }

  if (!sampleNetworkPreviewCache.has(previewCacheKey)) {
    sampleNetworkPreviewCache.set(
      previewCacheKey,
      (async () => {
        const species = speciesById.get(speciesId)
        const source = await sampleNetworkRowsCache.get(rowCacheKey)

        if (!species || !source) {
          return null
        }

        return buildNetworkPreview(speciesId, species.label, source, {
          limit,
          sampleId,
          threshold: normalizedThreshold,
          tf: tfFilter,
        })
      })(),
    )
  }

  return sampleNetworkPreviewCache.get(previewCacheKey)
}

export async function getSpeciesNetworkRelations(speciesId, options = {}) {
  if (!speciesById.has(speciesId)) {
    return null
  }

  const modality = normalizeModality(options.modality)
  const pageSize = normalizePositiveInteger(options.pageSize, 12)
  const page = normalizePositiveInteger(options.page, 1)
  const threshold = Number.parseFloat(String(options.threshold ?? String(defaultNetworkThreshold)))
  const normalizedThreshold = Number.isFinite(threshold) ? threshold : defaultNetworkThreshold
  const tfFilter = String(options.tf ?? '').trim().toLowerCase()
  const rowCacheKey = createModalityCacheKey(modality, speciesId)
  const cacheKey = createModalityCacheKey(
    modality,
    speciesId,
    page,
    pageSize,
    normalizedThreshold,
    tfFilter,
  )

  if (!speciesNetworkRowsCache.has(rowCacheKey)) {
    speciesNetworkRowsCache.set(rowCacheKey, loadSpeciesNetworkRows(speciesId, modality))
  }

  if (!speciesNetworkRelationsCache.has(cacheKey)) {
    speciesNetworkRelationsCache.set(
      cacheKey,
      (async () => {
        const species = speciesById.get(speciesId)
        const source = await speciesNetworkRowsCache.get(rowCacheKey)

        if (!species || !source) {
          return null
        }

        const { normalizedThreshold: safeThreshold, rawTfFilter, filteredRows } =
          buildFilteredNetworkRows(source, {
            threshold: normalizedThreshold,
            tf: tfFilter,
          })
        const sortedRows = filteredRows.slice().sort(compareNetworkRowProbability)
        const totalRows = sortedRows.length
        const totalPages = Math.max(Math.ceil(totalRows / pageSize), 1)
        const safePage = Math.min(page, totalPages)
        const start = (safePage - 1) * pageSize

        return {
          speciesId,
          speciesLabel: species.label,
          threshold: safeThreshold,
          tfFilter: rawTfFilter || null,
          sourceKind: source.sourceKind,
          pagination: {
            page: safePage,
            pageSize,
            totalRows,
            totalPages,
          },
          rows: sortedRows.slice(start, start + pageSize).map((row) => ({
            tf: row.source,
            target: row.target,
            probability: row.probability,
          })),
        }
      })(),
    )
  }

  return speciesNetworkRelationsCache.get(cacheKey)
}

async function loadSampleDetail(speciesId, sampleId, modalityValue) {
  const modality = normalizeModality(modalityValue)
  const species = speciesById.get(speciesId)

  if (!species) {
    return null
  }

  const { samples } = await getBrowseIndex(modality)
  const sampleRecord = samples.find(
    (record) => record.speciesId === speciesId && record.sampleId === sampleId,
  )

  if (!sampleRecord) {
    return null
  }

  const speciesMetaDirectory = await resolveSpeciesMetaDirectory(modality, speciesId)
  const metaPath = path.join(speciesMetaDirectory, sampleId, 'meta_data.json')
  let metadata

  try {
    const content = await fs.readFile(metaPath, 'utf8')
    metadata = JSON.parse(content)
  } catch {
    throw new Error(`Sample metadata could not be loaded for ${sampleId}.`)
  }

  const dataRoot = await getDataRoot(modality)
  const tfTargetPath = path.join(dataRoot, speciesId, sampleRecord.fileName)
  let tfTargetRows

  try {
    const content = await fs.readFile(tfTargetPath, 'utf8')
    tfTargetRows = parseTfTargetRows(content)
  } catch {
    throw new Error(`TF-target data could not be loaded for ${sampleId}.`)
  }

  const datasetId = metadata?.datasetId ?? sampleId
  const cells = metadata?.cells ?? '-'

  return {
    sample: {
      ...sampleRecord,
      datasetId,
      cells,
    },
    metadata,
    rows: tfTargetRows.map((row) => ({
      sampleId: sampleRecord.sampleId,
      datasetId,
      species: sampleRecord.speciesLabel,
      tissue: sampleRecord.tissue,
      cells,
      ...row,
    })),
  }
}

export async function getSampleDetail(speciesId, sampleId, options = {}) {
  if (!speciesById.has(speciesId)) {
    return null
  }

  const modality = normalizeModality(options.modality)
  const cacheKey = createModalityCacheKey(modality, speciesId, sampleId)

  if (!sampleDetailCache.has(cacheKey)) {
    sampleDetailCache.set(cacheKey, loadSampleDetail(speciesId, sampleId, modality))
  }

  const detail = await sampleDetailCache.get(cacheKey)

  if (!detail) {
    return null
  }

  const pageSize = normalizePositiveInteger(options.pageSize, 10)
  const page = normalizePositiveInteger(options.page, 1)
  const totalRows = detail.rows.length
  const totalPages = Math.max(Math.ceil(totalRows / pageSize), 1)
  const safePage = Math.min(page, totalPages)
  const pageStart = (safePage - 1) * pageSize

  return {
    sample: detail.sample,
    metadata: detail.metadata,
    rows: detail.rows.slice(pageStart, pageStart + pageSize),
    pagination: {
      page: safePage,
      pageSize,
      totalRows,
      totalPages,
    },
  }
}

export function __resetBrowseDataCacheForTests() {
  __resetDataContextCacheForTests()
  browseIndexPromises.clear()
  speciesTfTargetCountsCache.clear()
  sampleDetailCache.clear()
  speciesNetworkRowsCache.clear()
  speciesNetworkPreviewCache.clear()
  sampleNetworkRowsCache.clear()
  sampleNetworkPreviewCache.clear()
  speciesNetworkRelationsCache.clear()
}
