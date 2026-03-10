import fs from 'node:fs/promises'
import path from 'node:path'
import { speciesById, speciesCatalog } from '../species.js'

const canonicalTissueLabels = new Map([
  ['root', 'Root'],
  ['leaf', 'Leaf'],
  ['rosette leaf', 'Rosette leaf'],
  ['callus', 'Callus'],
  ['ear', 'Ear'],
  ['embryo', 'Embryo'],
  ['endosperm', 'Endosperm'],
  ['meiotic cells', 'Meiotic Cells'],
  ['nodule', 'Nodule'],
  ['opposite sdx cells', 'Opposite SDX cells'],
  ['shoot apical meristem', 'Shoot Apical Meristem'],
  ['tension sdx cells', 'Tension SDX cells'],
  ['vertical sdx cells', 'Vertical SDX cells'],
  ['young inflorescences', 'Young inflorescences'],
])

let resolvedDataRootPromise
let resolvedSpeciesMetaRootPromise
let browseIndexPromise
const speciesTfTargetCountsCache = new Map()
const sampleDetailCache = new Map()

function normalizePositiveInteger(value, fallback) {
  const numericValue = Number.parseInt(String(value ?? ''), 10)

  if (Number.isFinite(numericValue) && numericValue > 0) {
    return numericValue
  }

  return fallback
}

function formatTissueLabel(rawTissue) {
  const normalized = rawTissue.trim().replace(/\s+/g, ' ').toLowerCase()
  const canonical = canonicalTissueLabels.get(normalized)

  if (canonical) {
    return canonical
  }

  return normalized.replace(/\b\w/g, (character) => character.toUpperCase())
}

function isGeoAccession(value) {
  return /^(?:GSM|GSE|GPL)\d+$/i.test(value)
}

function isPrimarySampleAccession(value) {
  return /^(?:SRX|SRP|SRS|ERX|ERP|ERS|DRX|DRP|DRS|CRX|CRR)\d+$/i.test(value)
}

function resolveSampleId(fileName, sampleTokens) {
  if (sampleTokens.length === 0) {
    return null
  }

  const fileStem = path.basename(fileName, path.extname(fileName))

  if (sampleTokens.length >= 2 && sampleTokens[1] === fileStem) {
    return {
      sampleId: sampleTokens[1],
      tissueTokens: sampleTokens.slice(2),
    }
  }

  if (
    sampleTokens.length >= 2 &&
    isGeoAccession(sampleTokens[0]) &&
    isPrimarySampleAccession(sampleTokens[1])
  ) {
    return {
      sampleId: sampleTokens[1],
      tissueTokens: sampleTokens.slice(2),
    }
  }

  return {
    sampleId: sampleTokens[0],
    tissueTokens: sampleTokens.slice(1),
  }
}

export function parseSampleInformationLine(species, line) {
  const tokens = line.trim().split(/\s+/)

  if (tokens.length < 3) {
    return null
  }

  const fileName = tokens[0]
  let remainder = tokens.slice(1)
  let pubmedId = '-'

  if (
    remainder.length >= 2 &&
    /^PMID:?$/i.test(remainder.at(-2) ?? '') &&
    /^\d+$/.test(remainder.at(-1) ?? '')
  ) {
    pubmedId = remainder.at(-1) ?? '-'
    remainder = remainder.slice(0, -2)
  } else if (/^\d+$/.test(remainder.at(-1) ?? '')) {
    pubmedId = remainder.at(-1) ?? '-'
    remainder = remainder.slice(0, -1)
  } else if (remainder.at(-1) === '-') {
    remainder = remainder.slice(0, -1)
  }

  const sampleResolution = resolveSampleId(fileName, remainder)

  if (!fileName || !sampleResolution?.sampleId || sampleResolution.tissueTokens.length === 0) {
    return null
  }

  return {
    speciesId: species.id,
    speciesLabel: species.label,
    fileName,
    sampleId: sampleResolution.sampleId,
    tissue: formatTissueLabel(sampleResolution.tissueTokens.join(' ')),
    pubmedId,
  }
}

export function parseSampleInformation(species, content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => parseSampleInformationLine(species, line))
    .filter((record) => record !== null)
}

export function parseTfTargetCount(content) {
  const rows = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  return Math.max(rows.length - 1, 0)
}

export function parseTfTargetRows(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(1)
    .map((line) => {
      const [tf, target, importanceScore = '-'] = line.split(/\t+/)

      if (!tf || !target) {
        return null
      }

      return {
        tf,
        target,
        importanceScore,
      }
    })
    .filter((row) => row !== null)
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

async function resolveDataRoot() {
  const configuredRoot = process.env.PLANTSCNET_DATA_DIR

  if (configuredRoot) {
    return configuredRoot
  }

  const candidates = [path.join(process.cwd(), 'data'), path.join(process.cwd(), 'public', 'data')]

  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      return candidate
    }
  }

  return candidates[0]
}

export async function getDataRoot() {
  if (!resolvedDataRootPromise) {
    resolvedDataRootPromise = resolveDataRoot()
  }

  return resolvedDataRootPromise
}

async function resolveSpeciesMetaRoot() {
  const configuredRoot = process.env.PLANTSCNET_SPECIES_META_DIR

  if (configuredRoot) {
    return configuredRoot
  }

  const candidates = [
    path.join(process.cwd(), 'species_meta_data'),
    path.join(process.cwd(), 'data', 'species_meta_data'),
    path.join(process.cwd(), 'public', 'data', 'species_meta_data'),
  ]

  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      return candidate
    }
  }

  return candidates[0]
}

export async function getSpeciesMetaRoot() {
  if (!resolvedSpeciesMetaRootPromise) {
    resolvedSpeciesMetaRootPromise = resolveSpeciesMetaRoot()
  }

  return resolvedSpeciesMetaRootPromise
}

async function resolveSpeciesMetaDirectory(speciesId) {
  const metaRoot = await getSpeciesMetaRoot()
  const candidates = Array.from(
    new Set([
      speciesId,
      speciesId.toLowerCase(),
      `${speciesId.charAt(0).toUpperCase()}${speciesId.slice(1).toLowerCase()}`,
    ]),
  )

  for (const candidate of candidates) {
    const candidatePath = path.join(metaRoot, candidate)

    if (await pathExists(candidatePath)) {
      return candidatePath
    }
  }

  return path.join(metaRoot, speciesId)
}

async function readSampleRecordsForSpecies(species) {
  const dataRoot = await getDataRoot()
  const sampleInfoPath = path.join(dataRoot, species.id, 'sample_imformation.txt')

  try {
    const content = await fs.readFile(sampleInfoPath, 'utf8')
    return parseSampleInformation(species, content)
  } catch {
    return []
  }
}

async function loadBrowseIndex() {
  const sampleGroups = await Promise.all(
    speciesCatalog.map(async (species) => ({
      species,
      samples: await readSampleRecordsForSpecies(species),
    })),
  )

  return {
    species: sampleGroups.map(({ species, samples }) => ({
      id: species.id,
      label: species.label,
      sampleCount: samples.length,
    })),
    samples: sampleGroups.flatMap(({ samples }) => samples),
  }
}

export async function getBrowseIndex() {
  if (!browseIndexPromise) {
    browseIndexPromise = loadBrowseIndex()
  }

  return browseIndexPromise
}

async function loadSpeciesTfTargetCounts(speciesId) {
  const species = speciesById.get(speciesId)

  if (!species) {
    return null
  }

  const dataRoot = await getDataRoot()
  const { samples } = await getBrowseIndex()
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

export async function getSpeciesTfTargetCounts(speciesId) {
  if (!speciesById.has(speciesId)) {
    return null
  }

  if (!speciesTfTargetCountsCache.has(speciesId)) {
    speciesTfTargetCountsCache.set(speciesId, loadSpeciesTfTargetCounts(speciesId))
  }

  return speciesTfTargetCountsCache.get(speciesId)
}

async function loadSampleDetail(speciesId, sampleId) {
  const species = speciesById.get(speciesId)

  if (!species) {
    return null
  }

  const { samples } = await getBrowseIndex()
  const sampleRecord = samples.find(
    (record) => record.speciesId === speciesId && record.sampleId === sampleId,
  )

  if (!sampleRecord) {
    return null
  }

  const speciesMetaDirectory = await resolveSpeciesMetaDirectory(speciesId)
  const metaPath = path.join(speciesMetaDirectory, sampleId, 'meta_data.json')
  let metadata

  try {
    const content = await fs.readFile(metaPath, 'utf8')
    metadata = JSON.parse(content)
  } catch {
    throw new Error(`Sample metadata could not be loaded for ${sampleId}.`)
  }

  const dataRoot = await getDataRoot()
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

  const cacheKey = `${speciesId}:${sampleId}`

  if (!sampleDetailCache.has(cacheKey)) {
    sampleDetailCache.set(cacheKey, loadSampleDetail(speciesId, sampleId))
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
  resolvedDataRootPromise = undefined
  resolvedSpeciesMetaRootPromise = undefined
  browseIndexPromise = undefined
  speciesTfTargetCountsCache.clear()
  sampleDetailCache.clear()
}
