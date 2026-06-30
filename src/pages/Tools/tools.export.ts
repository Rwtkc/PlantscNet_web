import type { ContextHubRow, GbaPriorityRow } from './tools.types'

type ExportFormat = 'csv' | 'txt'

function sanitizeFilePart(value: string) {
  return value.trim().replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '') || 'tools'
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

function exportRows(filenameBase: string, rows: string[][], format: ExportFormat) {
  const extension = format === 'csv' ? 'csv' : 'txt'
  const delimiter = format === 'csv' ? ',' : '\t'
  const mimeType = format === 'csv' ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8'

  downloadTextFile(
    `${sanitizeFilePart(filenameBase)}.${extension}`,
    buildDelimitedContent(rows, delimiter),
    mimeType,
  )
}

function formatExportedPValue(value: string) {
  return /^(?:0|0\.0+)$/.test(value) ? '<0.001' : value
}

export function exportGbaPriorityRows(title: string, rows: GbaPriorityRow[], format: ExportFormat) {
  exportRows(
    title,
    [
      ['Rank', 'Gene', 'Score', 'Support'],
      ...rows.map((row) => [
        String(row.rank),
        row.gene,
        String(row.score),
        `${row.connectedGuideGenes}/${row.validGuideGenes}`,
      ]),
    ],
    format,
  )
}

export function exportContextHubRows(rows: ContextHubRow[], format: ExportFormat) {
  exportRows(
    'context_hub_genes',
    [
      ['Rank', 'Gene', 'P-value', 'Input gene?', 'Hub links', 'Input links'],
      ...rows.map((row) => [
        String(row.rank),
        row.gene,
        formatExportedPValue(row.pValue),
        row.isDeg ? 'Yes' : 'No',
        String(row.linksToHub),
        String(row.linksInDeg),
      ]),
    ],
    format,
  )
}
