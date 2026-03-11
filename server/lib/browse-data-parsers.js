import path from 'node:path'

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

export function parseRegulatoryNetworkRows(content, limit = 500) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(1, limit + 1)
    .map((line) => {
      const [source, target, probability = '-'] = line.split(/\t+/)

      if (!source || !target) {
        return null
      }

      return {
        source,
        target,
        probability: Number.parseFloat(probability),
      }
    })
    .filter((row) => row !== null)
}

export function parseSampleTfTargetNetworkRows(content, limit = 500) {
  return parseTfTargetRows(content)
    .slice(0, limit)
    .map((row) => ({
      source: row.tf,
      target: row.target,
      probability: Number.parseFloat(row.importanceScore),
    }))
}
