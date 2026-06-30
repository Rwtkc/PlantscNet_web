import { useState } from 'react'
import { loadSampleDetail } from '../browse.api'
import type { DataModality, SampleDetailResponse, SampleDetailRow } from '../browse.types'
import { formatImportanceScore, formatSampleDisplayId } from '../browse.utils'
import { SampleDetailPaginationControls } from './PaginationControls'

type ExportFormat = 'csv' | 'txt'

function sanitizeFilePart(value: string) {
  return value.trim().replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '') || 'tf_target_table'
}

function escapeCsvCell(value: string) {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }

  return value
}

function buildDelimitedContent(rows: string[][], delimiter: ',' | '\t') {
  const cellFormatter = delimiter === ',' ? escapeCsvCell : (value: string) => value
  return rows.map((row) => row.map(cellFormatter).join(delimiter)).join('\n')
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

function exportSampleTfTargetRows(rows: SampleDetailRow[], format: ExportFormat) {
  const firstRow = rows[0]
  const filenameBase = firstRow
    ? `${sanitizeFilePart(firstRow.species)}_${sanitizeFilePart(firstRow.sampleId)}_tf_target`
    : 'tf_target'
  const extension = format === 'csv' ? 'csv' : 'txt'
  const delimiter = format === 'csv' ? ',' : '\t'
  const mimeType = format === 'csv' ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8'
  const contentRows = rows.map((row) => [
    row.sampleId,
    row.species,
    row.tissue,
    String(row.cells),
    row.tf,
    row.target,
    formatImportanceScore(row.importanceScore),
  ])

  downloadTextFile(
    `${filenameBase}.${extension}`,
    buildDelimitedContent(
      [
        ['Sample ID', 'Species', 'Tissue', 'Cells', 'TF', 'Target', 'Importance Score'],
        ...contentRows,
      ],
      delimiter,
    ),
    mimeType,
  )
}

export function SampleTfTargetTable({
  modality,
  sample,
  rows,
  pagination,
  isLoading,
  onPageChange,
}: {
  modality: DataModality
  sample: SampleDetailResponse['sample']
  rows: SampleDetailRow[]
  pagination: SampleDetailResponse['pagination']
  isLoading: boolean
  onPageChange: (page: number) => void
}) {
  const [exportFormat, setExportFormat] = useState<ExportFormat | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const pageStart = (pagination.page - 1) * pagination.pageSize
  const hasRows = rows.length > 0
  const isExporting = exportFormat !== null

  async function handleExport(format: ExportFormat) {
    if (!hasRows || isExporting) {
      return
    }

    setExportFormat(format)
    setExportError(null)

    try {
      const pageSize = Math.max(pagination.totalRows, pagination.pageSize, 1)
      const fullDetail = await loadSampleDetail(
        modality,
        sample.speciesId,
        sample.sampleId,
        1,
        pageSize,
      )

      exportSampleTfTargetRows(fullDetail.rows, format)
    } catch {
      setExportError('Complete TF-target table could not be exported.')
    } finally {
      setExportFormat(null)
    }
  }

  return (
    <div className="browse-panel">
      <div className="browse-panel__header browse-table-header">
        <h2>TF-target table</h2>
        <div className="browse-table-actions" aria-label="TF-target table exports">
          <button
            type="button"
            className="browse-export-button"
            disabled={!hasRows || isLoading || isExporting}
            onClick={() => void handleExport('csv')}
          >
            {exportFormat === 'csv' ? 'Exporting...' : 'Export CSV'}
          </button>
          <button
            type="button"
            className="browse-export-button"
            disabled={!hasRows || isLoading || isExporting}
            onClick={() => void handleExport('txt')}
          >
            {exportFormat === 'txt' ? 'Exporting...' : 'Export TXT'}
          </button>
        </div>
      </div>
      {exportError ? <p className="browse-export-error">{exportError}</p> : null}

      <div className="browse-table-wrap browse-table-wrap--loading-shell">
        <table className="browse-metadata-table browse-metadata-table--sample-detail">
          <thead>
            <tr>
              <th scope="col">Sample ID</th>
              <th scope="col">Species</th>
              <th scope="col">Tissue</th>
              <th scope="col">Cells</th>
              <th scope="col">TF</th>
              <th scope="col">Target</th>
              <th scope="col">Importance Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.sampleId}-${row.tf}-${row.target}-${index}`}>
                <td title={row.sampleId}>{formatSampleDisplayId(row.sampleId)}</td>
                <td>{row.species}</td>
                <td>{row.tissue}</td>
                <td>{row.cells}</td>
                <td>{row.tf}</td>
                <td>{row.target}</td>
                <td>{formatImportanceScore(row.importanceScore)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading ? (
          <div className="browse-table-wrap__loading" aria-label="Loading next TF-target page" aria-live="polite">
            <span className="browse-table-wrap__spinner" aria-hidden="true" />
          </div>
        ) : null}
      </div>

      {pagination.totalPages > 1 ? (
        <div className="browse-table-pagination" aria-label="TF-target table pagination">
          <p className="browse-table-pagination__summary">
            Showing {pageStart + 1}-{Math.min(pageStart + pagination.pageSize, pagination.totalRows)} of{' '}
            {pagination.totalRows}
          </p>
          <div className="browse-table-pagination__cluster">
            <SampleDetailPaginationControls
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={onPageChange}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
