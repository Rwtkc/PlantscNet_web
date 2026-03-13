import fs from 'node:fs/promises'
import path from 'node:path'
import { speciesById, speciesCatalog } from '../species.js'

const assetCatalog = [
  {
    key: 'feather',
    directoryName: 'feather_file',
    envVar: 'PLANTSCNET_FEATHER_DIR',
    variants: [
      {
        label: 'Feather ranking',
        description: 'cisTarget ranking archive for motif enrichment workflows.',
        fileName: 'genes_vs_motifs.rankings.feather.xz',
      },
    ],
  },
  {
    key: 'meme',
    directoryName: 'meme_file',
    envVar: 'PLANTSCNET_MEME_DIR',
    variants: [
      {
        label: 'MEME motif',
        description: 'Motif PWM bundle in MEME format.',
        fileName: 'meme_pwm.meme',
      },
    ],
  },
  {
    key: 'tf-list',
    directoryName: 'tf_list',
    envVar: 'PLANTSCNET_TF_LIST_DIR',
    variants: [
      {
        label: 'TF list',
        description: 'Transcription factor list used by the species workflow.',
        fileName: 'tf_list.txt',
      },
    ],
  },
  {
    key: 'final-regulatory',
    directoryName: 'final_regulatory_file',
    envVar: 'PLANTSCNET_FINAL_REGULATORY_DIR',
    variants: [
      {
        label: 'Final regulatory network (XGBoost)',
        description: 'Model-trained integrated final regulatory network file.',
        fileName: 'final_regulatory.tsv',
      },
      {
        label: 'Final regulatory network (pySCENIC)',
        description: 'Single-sample pySCENIC-derived final regulatory network file.',
        fileName: 'final_regulatory.txt',
      },
    ],
  },
]

const assetByKey = new Map(assetCatalog.map((asset) => [asset.key, asset]))
let resolvedAssetRootsPromise

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

async function resolveAssetRoot(asset) {
  const configuredRoot = process.env[asset.envVar]
  if (configuredRoot) {
    return configuredRoot
  }

  const candidate = path.join(process.cwd(), asset.directoryName)
  return candidate
}

async function getAssetRoots() {
  if (!resolvedAssetRootsPromise) {
    resolvedAssetRootsPromise = Promise.all(
      assetCatalog.map(async (asset) => [asset.key, await resolveAssetRoot(asset)]),
    ).then((entries) => new Map(entries))
  }

  return resolvedAssetRootsPromise
}

function formatFileSize(sizeBytes) {
  if (!Number.isFinite(sizeBytes) || sizeBytes < 0) {
    return null
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = sizeBytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  const digits = size >= 10 || unitIndex === 0 ? 0 : 1
  return `${size.toFixed(digits)} ${units[unitIndex]}`
}

async function resolveAssetRecord(speciesId, asset) {
  const assetRoots = await getAssetRoots()
  const assetRoot = assetRoots.get(asset.key)

  if (!assetRoot) {
    return {
      key: asset.key,
      label: asset.variants[0].label,
      description: asset.variants[0].description,
      fileName: asset.variants[0].fileName,
      available: false,
      sizeBytes: null,
      sizeLabel: null,
      href: null,
    }
  }

  for (const variant of asset.variants) {
    const filePath = path.join(assetRoot, speciesId, variant.fileName)

    if (!(await pathExists(filePath))) {
      continue
    }

    const stats = await fs.stat(filePath)

    return {
      key: asset.key,
      label: variant.label,
      description: variant.description,
      fileName: variant.fileName,
      available: true,
      sizeBytes: stats.size,
      sizeLabel: formatFileSize(stats.size),
      href: `/api/download/${asset.key}/${speciesId}`,
    }
  }

  return {
    key: asset.key,
    label: asset.variants[0].label,
    description: asset.variants[0].description,
    fileName: asset.variants[0].fileName,
    available: false,
    sizeBytes: null,
    sizeLabel: null,
    href: null,
  }
}

export async function getDownloadAssets() {
  const species = await Promise.all(
    speciesCatalog.map(async (speciesRecord) => {
      const assets = await Promise.all(
        assetCatalog.map((asset) => resolveAssetRecord(speciesRecord.id, asset)),
      )

      return {
        speciesId: speciesRecord.id,
        speciesLabel: speciesRecord.label,
        availableAssetCount: assets.filter((asset) => asset.available).length,
        assets,
      }
    }),
  )

  return {
    species,
    assetTypes: assetCatalog.map(({ key, variants }) => ({
      key,
      label: variants[0].label,
      fileName: variants.map((variant) => variant.fileName).join(' / '),
    })),
  }
}

export async function resolveDownloadAsset(speciesId, assetKey) {
  const species = speciesById.get(speciesId)
  const asset = assetByKey.get(assetKey)

  if (!species || !asset) {
    return null
  }

  const assetRoots = await getAssetRoots()
  const assetRoot = assetRoots.get(asset.key)

  if (!assetRoot) {
    return null
  }

  for (const variant of asset.variants) {
    const filePath = path.join(assetRoot, speciesId, variant.fileName)

    if (!(await pathExists(filePath))) {
      continue
    }

    return {
      filePath,
      downloadName: `${species.id}_${variant.fileName}`,
    }
  }

  return null
}
