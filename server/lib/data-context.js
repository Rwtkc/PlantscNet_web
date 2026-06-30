import fs from 'node:fs/promises'
import path from 'node:path'

const modalityConfigs = {
  rna: {
    dataEnvVar: 'PLANTSCNET_DATA_DIR',
    metaEnvVar: 'PLANTSCNET_SPECIES_META_DIR',
    dataCandidates: ['data', path.join('public', 'data')],
    metaCandidates: [
      'species_meta_data',
      path.join('data', 'species_meta_data'),
      path.join('public', 'data', 'species_meta_data'),
    ],
  },
  atac: {
    dataEnvVar: 'PLANTSCNET_ATAC_DATA_DIR',
    metaEnvVar: 'PLANTSCNET_ATAC_SPECIES_META_DIR',
    dataCandidates: ['data_atac', path.join('public', 'data_atac')],
    metaCandidates: [
      'species_meta_data_atac',
      path.join('data_atac', 'species_meta_data_atac'),
      path.join('public', 'data_atac', 'species_meta_data_atac'),
    ],
  },
}

const dataRootPromises = new Map()
const speciesMetaRootPromises = new Map()

export function normalizeModality(value) {
  return String(value ?? '').trim().toLowerCase() === 'atac' ? 'atac' : 'rna'
}

export async function pathExists(targetPath) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

async function resolveFirstExistingPath(configuredRoot, candidates) {
  if (configuredRoot) {
    return configuredRoot
  }

  const resolvedCandidates = candidates.map((candidate) => path.join(process.cwd(), candidate))

  for (const candidate of resolvedCandidates) {
    if (await pathExists(candidate)) {
      return candidate
    }
  }

  return resolvedCandidates[0]
}

export async function getDataRoot(modalityValue) {
  const modality = normalizeModality(modalityValue)

  if (!dataRootPromises.has(modality)) {
    const config = modalityConfigs[modality]
    dataRootPromises.set(
      modality,
      resolveFirstExistingPath(process.env[config.dataEnvVar], config.dataCandidates),
    )
  }

  return dataRootPromises.get(modality)
}

export async function getSpeciesMetaRoot(modalityValue) {
  const modality = normalizeModality(modalityValue)

  if (!speciesMetaRootPromises.has(modality)) {
    const config = modalityConfigs[modality]
    speciesMetaRootPromises.set(
      modality,
      resolveFirstExistingPath(process.env[config.metaEnvVar], config.metaCandidates),
    )
  }

  return speciesMetaRootPromises.get(modality)
}

export async function resolveSpeciesMetaDirectory(modalityValue, speciesId) {
  const metaRoot = await getSpeciesMetaRoot(modalityValue)
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

export function __resetDataContextCacheForTests() {
  dataRootPromises.clear()
  speciesMetaRootPromises.clear()
}
