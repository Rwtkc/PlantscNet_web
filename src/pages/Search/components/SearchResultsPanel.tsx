import { useEffect, useMemo, useState } from 'react'
import { SampleDetailPaginationControls } from '@/pages/Browse/components/PaginationControls'
import { formatImportanceScore, formatNetworkMetric } from '@/pages/Browse/browse.utils'
import { exportIntegratedMatches, exportSampleMatches } from '../search.export'
import type { SearchResponse } from '../search.types'

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase()
}

function buildAdjacentPages(currentPage: number, totalPages: number) {
  const pages: number[] = []

  if (currentPage > 1) {
    pages.push(currentPage - 1)
  }

  if (currentPage < totalPages) {
    pages.push(currentPage + 1)
  }

  return pages
}

function useLocalPagination<T>(rows: T[], pageSize = 10) {
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [rows])

  const totalPages = Math.max(Math.ceil(rows.length / pageSize), 1)
  const safePage = Math.min(currentPage, totalPages)
  const pageStart = (safePage - 1) * pageSize
  const visibleRows = useMemo(
    () => rows.slice(pageStart, pageStart + pageSize),
    [pageSize, pageStart, rows],
  )

  useEffect(() => {
    buildAdjacentPages(safePage, totalPages).forEach((page) => {
      const start = (page - 1) * pageSize
      rows.slice(start, start + pageSize)
    })
  }, [pageSize, rows, safePage, totalPages])

  return {
    currentPage: safePage,
    totalPages,
    pageSize,
    totalRows: rows.length,
    pageStart,
    visibleRows,
    setCurrentPage,
  }
}

export function SearchResultsPanel({
  result,
  isLoading,
  error,
  searched,
  modeLabel,
  showSpeciesColumn = false,
}: {
  result: SearchResponse | null
  isLoading: boolean
  error: string | null
  searched: boolean
  modeLabel: string
  showSpeciesColumn?: boolean
}) {
  const [integratedFilter, setIntegratedFilter] = useState('')
  const [sampleFilter, setSampleFilter] = useState('')
  const normalizedIntegratedFilter = normalizeSearchText(integratedFilter)
  const normalizedSampleFilter = normalizeSearchText(sampleFilter)
  const integratedMatches = result?.integratedMatches ?? []
  const sampleMatches = result?.sampleMatches ?? []
  const speciesLabel = result?.speciesLabel ?? ''

  useEffect(() => {
    setIntegratedFilter('')
    setSampleFilter('')
  }, [result])

  const filteredIntegratedRows = useMemo(() => {
    if (!normalizedIntegratedFilter) {
      return integratedMatches
    }

    return integratedMatches.filter((row) =>
      [
        showSpeciesColumn ? speciesLabel : '',
        row.tf,
        row.target,
        formatNetworkMetric(row.probability),
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedIntegratedFilter),
    )
  }, [integratedMatches, normalizedIntegratedFilter, showSpeciesColumn, speciesLabel])

  const filteredSampleRows = useMemo(() => {
    if (!normalizedSampleFilter) {
      return sampleMatches
    }

    return sampleMatches.filter((row) =>
      [
        showSpeciesColumn ? speciesLabel : '',
        row.sampleId,
        row.tissue,
        row.tf,
        row.target,
        row.importanceScore,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSampleFilter),
    )
  }, [normalizedSampleFilter, sampleMatches, showSpeciesColumn, speciesLabel])

  const integratedPagination = useLocalPagination(filteredIntegratedRows)
  const samplePagination = useLocalPagination(filteredSampleRows)

  if (!searched) {
    return null
  }

  if (isLoading) {
    return <p className="search-table__empty">Searching {modeLabel} matches...</p>
  }

  if (error) {
    return <p className="search-table__empty search-table__empty--error">{error}</p>
  }

  if (!result) {
    return <p className="search-table__empty">No result payload returned.</p>
  }

  return (
    <div className="search-results-stack">
      <section className="search-result-block">
        <div className="search-result-block__header">
          <div>
            <h3>Integrated species network matches</h3>
            <p>
              {result.integratedNetworkAvailable
                ? `${result.summary.integratedMatchCount} match(es) from final_regulatory_with_probability.tsv.`
                : 'No integrated final network is available for this species.'}
            </p>
          </div>
          {filteredIntegratedRows.length > 0 ? (
            <div className="search-result-block__actions">
              <button
                type="button"
                className="search-export-button"
                onClick={() => {
                  exportIntegratedMatches(filteredIntegratedRows, {
                    speciesLabel: result.speciesLabel,
                    query: result.query,
                    format: 'csv',
                    includeSpecies: showSpeciesColumn,
                  })
                }}
              >
                Export CSV
              </button>
              <button
                type="button"
                className="search-export-button"
                onClick={() => {
                  exportIntegratedMatches(filteredIntegratedRows, {
                    speciesLabel: result.speciesLabel,
                    query: result.query,
                    format: 'txt',
                    includeSpecies: showSpeciesColumn,
                  })
                }}
              >
                Export TXT
              </button>
            </div>
          ) : null}
        </div>
        {result.integratedMatches.length > 0 ? (
          <>
            <div className="search-table-toolbar">
              <input
                className="query-input search-table-filter"
                value={integratedFilter}
                onChange={(event) => {
                  setIntegratedFilter(event.target.value)
                }}
                placeholder="Filter current integrated table"
              />
            </div>
            <div className="search-table-wrap">
              <table
                className={`search-table ${
                  showSpeciesColumn ? 'search-table--integrated-with-species' : 'search-table--integrated'
                }`}
              >
                <colgroup>
                  {showSpeciesColumn ? <col className="search-table__col search-table__col--species" /> : null}
                  <col className="search-table__col search-table__col--gene" />
                  <col className="search-table__col search-table__col--gene" />
                  <col className="search-table__col search-table__col--metric" />
                </colgroup>
                <thead>
                  <tr>
                    {showSpeciesColumn ? <th>Species</th> : null}
                    <th>TF</th>
                    <th>Target</th>
                    <th className="search-table__metric">Probability</th>
                  </tr>
                </thead>
                <tbody>
                  {integratedPagination.visibleRows.map((row, index) => (
                    <tr key={`${row.tf}-${row.target}-${integratedPagination.currentPage}-${index}`}>
                      {showSpeciesColumn ? <td>{result.speciesLabel}</td> : null}
                      <td>{row.tf}</td>
                      <td>{row.target}</td>
                      <td className="search-table__metric">{formatNetworkMetric(row.probability)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredIntegratedRows.length === 0 ? (
              <p className="search-table__empty">No integrated-network rows match this table filter.</p>
            ) : null}
            {integratedPagination.totalPages > 1 ? (
              <div className="browse-table-pagination" aria-label="Integrated search pagination">
                <p className="browse-table-pagination__summary">
                  Showing {integratedPagination.pageStart + 1}-
                  {Math.min(
                    integratedPagination.pageStart + integratedPagination.pageSize,
                    integratedPagination.totalRows,
                  )}{' '}
                  of {integratedPagination.totalRows}
                </p>
                <div className="browse-table-pagination__cluster">
                  <SampleDetailPaginationControls
                    currentPage={integratedPagination.currentPage}
                    totalPages={integratedPagination.totalPages}
                    onPageChange={integratedPagination.setCurrentPage}
                  />
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <p className="search-table__empty">No integrated-network matches found.</p>
        )}
      </section>

      <section className="search-result-block">
        <div className="search-result-block__header">
          <div>
            <h3>Sample-derived pySCENIC matches</h3>
            <p>{result.summary.sampleMatchCount} match(es) from sample-level TF-target files.</p>
          </div>
          {filteredSampleRows.length > 0 ? (
            <div className="search-result-block__actions">
              <button
                type="button"
                className="search-export-button"
                onClick={() => {
                  exportSampleMatches(filteredSampleRows, {
                    speciesLabel: result.speciesLabel,
                    query: result.query,
                    format: 'csv',
                    includeSpecies: showSpeciesColumn,
                  })
                }}
              >
                Export CSV
              </button>
              <button
                type="button"
                className="search-export-button"
                onClick={() => {
                  exportSampleMatches(filteredSampleRows, {
                    speciesLabel: result.speciesLabel,
                    query: result.query,
                    format: 'txt',
                    includeSpecies: showSpeciesColumn,
                  })
                }}
              >
                Export TXT
              </button>
            </div>
          ) : null}
        </div>
        {result.sampleMatches.length > 0 ? (
          <>
            <div className="search-table-toolbar">
              <input
                className="query-input search-table-filter"
                value={sampleFilter}
                onChange={(event) => {
                  setSampleFilter(event.target.value)
                }}
                placeholder="Filter current sample-derived table"
              />
            </div>
            <div className="search-table-wrap">
              <table
                className={`search-table ${
                  showSpeciesColumn ? 'search-table--sample-with-species' : 'search-table--sample'
                }`}
              >
                <colgroup>
                  {showSpeciesColumn ? <col className="search-table__col search-table__col--species" /> : null}
                  <col className="search-table__col search-table__col--sample-id" />
                  <col className="search-table__col search-table__col--tissue" />
                  <col className="search-table__col search-table__col--gene" />
                  <col className="search-table__col search-table__col--gene" />
                  <col className="search-table__col search-table__col--metric" />
                </colgroup>
                <thead>
                  <tr>
                    {showSpeciesColumn ? <th>Species</th> : null}
                    <th>Sample ID</th>
                    <th>Tissue</th>
                    <th>TF</th>
                    <th>Target</th>
                    <th className="search-table__metric">Importance score</th>
                  </tr>
                </thead>
                <tbody>
                  {samplePagination.visibleRows.map((row, index) => (
                    <tr
                      key={`${row.sampleId}-${row.tf}-${row.target}-${samplePagination.currentPage}-${index}`}
                    >
                      {showSpeciesColumn ? <td>{result.speciesLabel}</td> : null}
                      <td>{row.sampleId}</td>
                      <td>{row.tissue}</td>
                      <td>{row.tf}</td>
                      <td>{row.target}</td>
                      <td className="search-table__metric">
                        {formatImportanceScore(row.importanceScore)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredSampleRows.length === 0 ? (
              <p className="search-table__empty">No sample-derived rows match this table filter.</p>
            ) : null}
            {samplePagination.totalPages > 1 ? (
              <div className="browse-table-pagination" aria-label="Sample-derived search pagination">
                <p className="browse-table-pagination__summary">
                  Showing {samplePagination.pageStart + 1}-
                  {Math.min(
                    samplePagination.pageStart + samplePagination.pageSize,
                    samplePagination.totalRows,
                  )}{' '}
                  of {samplePagination.totalRows}
                </p>
                <div className="browse-table-pagination__cluster">
                  <SampleDetailPaginationControls
                    currentPage={samplePagination.currentPage}
                    totalPages={samplePagination.totalPages}
                    onPageChange={samplePagination.setCurrentPage}
                  />
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <p className="search-table__empty">No sample-derived matches found.</p>
        )}
      </section>
    </div>
  )
}
