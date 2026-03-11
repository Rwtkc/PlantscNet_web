import { formatImportanceScore, formatNetworkMetric } from '@/pages/Browse/browse.utils'
import type { SearchIntegratedMatch, SearchSampleMatch } from './search.types'

function sanitizeFilePart(value: string) {
  return value.trim().replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '') || 'search'
}

function escapeCsvCell(value: string) {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }

  return value
}

function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function buildDelimitedContent(rows: string[][], delimiter: ',' | '\t') {
  const cellFormatter = delimiter === ',' ? escapeCsvCell : (value: string) => value
  return rows.map((row) => row.map(cellFormatter).join(delimiter)).join('\n')
}

export function exportIntegratedMatches(
  rows: SearchIntegratedMatch[],
  {
    speciesLabel,
    query,
    format,
    includeSpecies = true,
  }: {
    speciesLabel: string
    query: string
    format: 'csv' | 'txt'
    includeSpecies?: boolean
  },
) {
  const header = includeSpecies
    ? ['Species', 'TF', 'Target', 'Probability']
    : ['TF', 'Target', 'Probability']

  const contentRows = rows.map((row) =>
    includeSpecies
      ? [speciesLabel, row.tf, row.target, formatNetworkMetric(row.probability)]
      : [row.tf, row.target, formatNetworkMetric(row.probability)],
  )

  const filenameBase = `${sanitizeFilePart(speciesLabel)}_${sanitizeFilePart(query)}_integrated_matches`
  const extension = format === 'csv' ? 'csv' : 'txt'
  const delimiter = format === 'csv' ? ',' : '\t'
  const mimeType = format === 'csv' ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8'

  downloadTextFile(
    `${filenameBase}.${extension}`,
    buildDelimitedContent([header, ...contentRows], delimiter),
    mimeType,
  )
}

export function exportSampleMatches(
  rows: SearchSampleMatch[],
  {
    speciesLabel,
    query,
    format,
    includeSpecies = true,
  }: {
    speciesLabel: string
    query: string
    format: 'csv' | 'txt'
    includeSpecies?: boolean
  },
) {
  const header = includeSpecies
    ? ['Species', 'Sample ID', 'Tissue', 'TF', 'Target', 'Importance score']
    : ['Sample ID', 'Tissue', 'TF', 'Target', 'Importance score']

  const contentRows = rows.map((row) =>
    includeSpecies
      ? [
          speciesLabel,
          row.sampleId,
          row.tissue,
          row.tf,
          row.target,
          formatImportanceScore(row.importanceScore),
        ]
      : [
          row.sampleId,
          row.tissue,
          row.tf,
          row.target,
          formatImportanceScore(row.importanceScore),
        ],
  )

  const filenameBase = `${sanitizeFilePart(speciesLabel)}_${sanitizeFilePart(query)}_sample_matches`
  const extension = format === 'csv' ? 'csv' : 'txt'
  const delimiter = format === 'csv' ? ',' : '\t'
  const mimeType = format === 'csv' ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8'

  downloadTextFile(
    `${filenameBase}.${extension}`,
    buildDelimitedContent([header, ...contentRows], delimiter),
    mimeType,
  )
}
