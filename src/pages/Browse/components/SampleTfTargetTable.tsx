import type { SampleDetailResponse, SampleDetailRow } from '../browse.types'
import { formatImportanceScore } from '../browse.utils'
import { SampleDetailPaginationControls } from './PaginationControls'

export function SampleTfTargetTable({
  rows,
  pagination,
  isLoading,
  onPageChange,
}: {
  rows: SampleDetailRow[]
  pagination: SampleDetailResponse['pagination']
  isLoading: boolean
  onPageChange: (page: number) => void
}) {
  const pageStart = (pagination.page - 1) * pagination.pageSize
  return (
    <div className="browse-panel">
      <div className="browse-panel__header">
        <h2>TF-target table</h2>
      </div>

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
                <td>{row.sampleId}</td>
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


