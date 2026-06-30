import { useEffect, useState } from 'react'
import type { SampleRecord } from '../browse.types'
import { formatSampleDisplayId } from '../browse.utils'
import { PaginationControls } from './PaginationControls'

export function SampleMetadataTable({
  records,
  tfTargetCounts,
}: {
  records: SampleRecord[]
  tfTargetCounts: Record<string, number | null>
}) {
  const pageSize = 10
  const [page, setPage] = useState(1)
  const totalPages = Math.max(Math.ceil(records.length / pageSize), 1)

  useEffect(() => {
    setPage(1)
  }, [records])

  const pageStart = (page - 1) * pageSize
  const visibleRecords = records.slice(pageStart, pageStart + pageSize)

  return (
    <div className="browse-panel">
      <div className="browse-panel__header">
        <h2>Sample table</h2>
      </div>

      <div className="browse-table-wrap">
        <table className="browse-metadata-table">
          <thead>
            <tr>
              <th scope="col">Species</th>
              <th scope="col">NCBI ID</th>
              <th scope="col">Tissues</th>
              <th scope="col">Data Type</th>
              <th scope="col">TF-target number</th>
              <th scope="col">Pubmed ID</th>
            </tr>
          </thead>
          <tbody>
            {visibleRecords.map((record) => (
              <tr key={`${record.speciesLabel}-${record.sampleId}`}>
                <td>{record.speciesLabel}</td>
                <td title={record.sampleId}>{formatSampleDisplayId(record.sampleId)}</td>
                <td>{record.tissue}</td>
                <td>scRNA-seq</td>
                <td>{tfTargetCounts[record.fileName] ?? '-'}</td>
                <td>{record.pubmedId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="browse-table-pagination" aria-label="Sample metadata pagination">
          <p className="browse-table-pagination__summary">
            Showing {pageStart + 1}-{Math.min(pageStart + pageSize, records.length)} of {records.length}
          </p>
          <PaginationControls currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      ) : null}
    </div>
  )
}
