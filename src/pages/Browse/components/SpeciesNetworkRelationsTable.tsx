import type { SpeciesNetworkRelationsResponse } from '../browse.types'
import { formatNetworkMetric } from '../browse.utils'
import { SampleDetailPaginationControls } from './PaginationControls'

export function SpeciesNetworkRelationsTable({
  relations,
  isLoading,
  onPageChange,
}: {
  relations: SpeciesNetworkRelationsResponse
  isLoading: boolean
  onPageChange: (page: number) => void
}) {
  const isSingleSampleSource = relations.sourceKind === 'single-sample'
  const metricLabel = isSingleSampleSource ? 'Importance Score' : 'Probability'
  const pageStart = (relations.pagination.page - 1) * relations.pagination.pageSize

  return (
    <div className="browse-panel">
      <div className="browse-panel__header">
        <h2>Integrated regulatory relations</h2>
        <p>
          {isSingleSampleSource
            ? 'Showing species-level pySCENIC TF-target relations from the available sample-derived network.'
            : 'Showing species-integrated TF-target relations from the high-confidence network defined in the paper (Probability >= 0.5).'}
        </p>
      </div>

      <div className="browse-table-wrap browse-table-wrap--loading-shell">
        <table className="browse-metadata-table browse-metadata-table--sample-detail">
          <thead>
            <tr>
              <th scope="col">TF</th>
              <th scope="col">Target</th>
              <th scope="col">{metricLabel}</th>
            </tr>
          </thead>
          <tbody>
            {relations.rows.map((row, index) => (
              <tr key={`${row.tf}-${row.target}-${index}`}>
                <td>{row.tf}</td>
                <td>{row.target}</td>
                <td>{formatNetworkMetric(row.probability)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading ? (
          <div
            className="browse-table-wrap__loading"
            aria-label="Loading integrated regulatory relations"
            aria-live="polite"
          >
            <span className="browse-table-wrap__spinner" aria-hidden="true" />
          </div>
        ) : null}
      </div>

      {relations.pagination.totalPages > 1 ? (
        <div className="browse-table-pagination" aria-label="Integrated regulatory relations pagination">
          <p className="browse-table-pagination__summary">
            Showing {pageStart + 1}-
            {Math.min(pageStart + relations.pagination.pageSize, relations.pagination.totalRows)} of{' '}
            {relations.pagination.totalRows}
          </p>
          <div className="browse-table-pagination__cluster">
            <SampleDetailPaginationControls
              currentPage={relations.pagination.page}
              totalPages={relations.pagination.totalPages}
              onPageChange={onPageChange}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
