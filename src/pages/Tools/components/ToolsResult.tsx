import { useEffect, useMemo, useState } from 'react'
import { buildPaginationItems, clampPage } from '@/pages/Browse/browse.utils'
import type { ContextHubRow, GbaPriorityRow, GenePriorityJob } from '../tools.types'
import { exportContextHubRows, exportGbaPriorityRows } from '../tools.export'

const resultRowsPerPage = 10

function summarizeJob(job: GenePriorityJob) {
  if (job.status === 'complete') {
    return 'Complete'
  }

  if (job.status === 'failed') {
    return job.error ?? 'Failed'
  }

  return job.status === 'queued' ? 'Queued' : 'Running'
}

export function ToolsResult({ job }: { job: GenePriorityJob }) {
  if (job.status !== 'complete' || !job.result) {
    return (
      <section className="tools-results extra-card fade-rise">
        <h2>Job status</h2>
        <p className={job.status === 'failed' ? 'tools-error' : 'tools-status'}>
          {summarizeJob(job)}
        </p>
      </section>
    )
  }

  return (
    <section className="tools-results extra-card fade-rise">
      <div className="tools-results__header">
        <div>
          <h2>{job.tool === 'gba' ? 'Neighborhood results' : 'Context Hub results'}</h2>
          <p>
            {job.network.label} · {job.result.totalNetworkGenes.toLocaleString()} genes ·{' '}
            {job.result.totalNetworkEdges.toLocaleString()} edges
          </p>
        </div>
        {job.tool === 'gba' ? (
          <div className="tools-score-card">
            <span>AUC</span>
            <strong>{job.result.auc}</strong>
            <small>P-value {job.result.pValue}</small>
          </div>
        ) : null}
      </div>

      {job.tool === 'gba' ? (
        <GbaTables
          coreRows={job.result.coreRows ?? []}
          candidateRows={job.result.candidateRows ?? []}
        />
      ) : (
        <ContextTable rows={job.result.hubRows ?? []} />
      )}
    </section>
  )
}

function GbaTables({
  coreRows,
  candidateRows,
}: {
  coreRows: GbaPriorityRow[]
  candidateRows: GbaPriorityRow[]
}) {
  return (
    <div className="tools-result-grid">
      <GbaTable title="Prioritized submitted genes" rows={coreRows} />
      <GbaTable title="Top new candidate genes" rows={candidateRows} />
    </div>
  )
}

function useToolsPagination<T>(rows: T[], pageSize = resultRowsPerPage) {
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [rows])

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const safePage = clampPage(currentPage, totalPages)
  const pageStart = (safePage - 1) * pageSize
  const visibleRows = useMemo(
    () => rows.slice(pageStart, pageStart + pageSize),
    [pageSize, pageStart, rows],
  )

  return {
    currentPage: safePage,
    totalPages,
    totalRows: rows.length,
    pageStart,
    pageSize,
    visibleRows,
    setCurrentPage,
  }
}

function GbaTable({ title, rows }: { title: string; rows: GbaPriorityRow[] }) {
  const pagination = useToolsPagination(rows)

  return (
    <div className="tools-table-block">
      <div className="tools-table-block__header">
        <h3>{title}</h3>
        <TableExportActions
          onExportCsv={() => exportGbaPriorityRows(title, rows, 'csv')}
          onExportTxt={() => exportGbaPriorityRows(title, rows, 'txt')}
        />
      </div>
      <div className="tools-table-wrap">
        <table className="tools-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Gene</th>
              <th>Score</th>
              <th>Support</th>
            </tr>
          </thead>
          <tbody>
            {pagination.visibleRows.map((row) => (
              <tr key={`${title}-${row.rank}-${row.gene}`}>
                <td>{row.rank}</td>
                <td>{row.gene}</td>
                <td>{row.score}</td>
                <td>
                  {row.connectedGuideGenes}/{row.validGuideGenes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > resultRowsPerPage ? (
        <TablePagination
          label={`${title} pages`}
          pagination={pagination}
        />
      ) : null}
    </div>
  )
}

function TableExportActions({
  onExportCsv,
  onExportTxt,
}: {
  onExportCsv: () => void
  onExportTxt: () => void
}) {
  return (
    <div className="tools-table-actions">
      <button type="button" className="tools-export-button" onClick={onExportCsv}>
        Export CSV
      </button>
      <button type="button" className="tools-export-button" onClick={onExportTxt}>
        Export TXT
      </button>
    </div>
  )
}

function TablePagination({
  label,
  pagination,
}: {
  label: string
  pagination: ReturnType<typeof useToolsPagination>
}) {
  const [pageInput, setPageInput] = useState(String(pagination.currentPage))
  const items = buildPaginationItems(pagination.currentPage, pagination.totalPages)

  useEffect(() => {
    setPageInput(String(pagination.currentPage))
  }, [pagination.currentPage])

  function submitPageJump() {
    const parsed = Number(pageInput)

    if (!Number.isFinite(parsed)) {
      setPageInput(String(pagination.currentPage))
      return
    }

    pagination.setCurrentPage(clampPage(Math.trunc(parsed), pagination.totalPages))
  }

  return (
    <div className="tools-pagination" aria-label={label}>
      <p className="tools-pagination__summary">
        Showing {pagination.pageStart + 1}-
        {Math.min(pagination.pageStart + pagination.pageSize, pagination.totalRows)} of{' '}
        {pagination.totalRows}
      </p>
      <div className="tools-pagination__buttons">
        {items.map((item) => {
          if (typeof item !== 'number') {
            return (
              <span key={item} className="tools-pagination__ellipsis" aria-hidden="true">
                ...
              </span>
            )
          }

          return (
            <button
              key={item}
              type="button"
              className={
                pagination.currentPage === item
                  ? 'tools-pagination__button tools-pagination__button--active'
                  : 'tools-pagination__button'
              }
              aria-current={pagination.currentPage === item ? 'page' : undefined}
              onClick={() => pagination.setCurrentPage(item)}
            >
              {item}
            </button>
          )
        })}
      </div>
      <div className="tools-pagination__jump">
        <span>Page</span>
        <input
          className="tools-pagination__input"
          value={pageInput}
          type="number"
          min={1}
          max={pagination.totalPages}
          inputMode="numeric"
          onChange={(event) => setPageInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              submitPageJump()
            }
          }}
        />
        <button type="button" className="tools-pagination__button" onClick={submitPageJump}>
          Go
        </button>
      </div>
    </div>
  )
}

function formatDisplayedPValue(value: string) {
  return /^(?:0|0\.0+)$/.test(value) ? '<0.001' : value
}

function ContextTable({ rows }: { rows: ContextHubRow[] }) {
  const pagination = useToolsPagination(rows)

  return (
    <div className="tools-table-block">
      <div className="tools-table-block__header">
        <h3>Context Hub genes</h3>
        <TableExportActions
          onExportCsv={() => exportContextHubRows(rows, 'csv')}
          onExportTxt={() => exportContextHubRows(rows, 'txt')}
        />
      </div>
      <div className="tools-table-wrap">
        <table className="tools-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Gene</th>
              <th>P-value</th>
              <th>Input gene?</th>
              <th>Hub links</th>
              <th>Input links</th>
            </tr>
          </thead>
          <tbody>
            {pagination.visibleRows.map((row) => (
              <tr key={`${row.rank}-${row.gene}`}>
                <td>{row.rank}</td>
                <td>{row.gene}</td>
                <td>{formatDisplayedPValue(row.pValue)}</td>
                <td>{row.isDeg ? 'Yes' : 'No'}</td>
                <td>{row.linksToHub}</td>
                <td>{row.linksInDeg}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > resultRowsPerPage ? (
        <TablePagination
          label="Context Hub gene pages"
          pagination={pagination}
        />
      ) : null}
    </div>
  )
}

export { summarizeJob }
