import { type SyntheticEvent, useRef, useState } from 'react'
import { ModulePage } from '@/components/ModulePage'
import { moduleContent } from '@/app/module-content'

interface SearchRecord {
  id: string
  tf: string
  target: string
  species: string
  tissue: string
  confidence: string
}

const tfCatalog = [
  'WRKY33',
  'NAC019',
  'MYB46',
  'ERF1',
  'bZIP60',
  'SPL9',
  'ARF7',
  'HB8',
  'TCP4',
  'BES1',
]

const targetCatalog = [
  'NPR1',
  'IAA19',
  'PIN1',
  'WOX5',
  'CESA7',
  'LOX3',
  'PR1',
  'SUC2',
  'CWINV4',
  'DREB2A',
  'SCL3',
  'GA20OX1',
]

const speciesCatalog = [
  'Arabidopsis thaliana',
  'Glycine max',
  'Oryza sativa',
  'Zea mays',
  'Solanum lycopersicum',
]

const tissueCatalog = ['Root', 'Leaf', 'Embryo', 'Nodule', 'Callus', 'Endosperm']

const generatedRecords: SearchRecord[] = Array.from({ length: 120 }, (_, index) => {
  const tf = tfCatalog[index % tfCatalog.length]
  const target = targetCatalog[(index * 3) % targetCatalog.length]
  const species = speciesCatalog[index % speciesCatalog.length]
  const tissue = tissueCatalog[(index * 2) % tissueCatalog.length]
  const confidence = (0.65 + (index % 25) / 100).toFixed(2)

  return {
    id: `REC-${String(index + 1)}`,
    tf,
    target,
    species,
    tissue,
    confidence,
  }
})

function filterRecordsByKeyword(
  records: SearchRecord[],
  key: 'tf' | 'target',
  keyword: string,
) {
  const normalized = keyword.trim().toUpperCase()
  const picked = normalized
    ? records.filter((record) => record[key].toUpperCase().includes(normalized))
    : records

  return picked.slice(0, 20)
}

export default function SearchPage() {
  const tfResultRef = useRef<HTMLElement>(null)
  const targetResultRef = useRef<HTMLElement>(null)
  const [tfKeyword, setTfKeyword] = useState('')
  const [targetKeyword, setTargetKeyword] = useState('')
  const [tfRecords, setTfRecords] = useState<SearchRecord[]>([])
  const [targetRecords, setTargetRecords] = useState<SearchRecord[]>([])
  const [tfSearched, setTfSearched] = useState(false)
  const [targetSearched, setTargetSearched] = useState(false)

  const jumpToTable = (element: HTMLElement | null) => {
    if (!element) return

    requestAnimationFrame(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const handleTfSearch = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    setTfSearched(true)
    setTfRecords(filterRecordsByKeyword(generatedRecords, 'tf', tfKeyword))
    jumpToTable(tfResultRef.current)
  }

  const handleTargetSearch = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    setTargetSearched(true)
    setTargetRecords(filterRecordsByKeyword(generatedRecords, 'target', targetKeyword))
    jumpToTable(targetResultRef.current)
  }

  return (
    <ModulePage module={moduleContent.search}>
      <section className="search-workspace fade-rise">
        <section className="search-card">
          <h2>Search by TF</h2>
          <p>Input transcription factor symbol and jump to TF result table.</p>
          <form className="search-card__form" onSubmit={handleTfSearch}>
            <label htmlFor="tf-query" className="sr-only">
              TF query
            </label>
            <input
              id="tf-query"
              className="query-input"
              value={tfKeyword}
              onChange={(event) => {
                setTfKeyword(event.target.value)
              }}
              placeholder="e.g. WRKY33"
            />
            <button type="submit" className="cta-button cta-button--solid">
              Search TF
            </button>
          </form>
        </section>

        <section className="search-card">
          <h2>Search by Target</h2>
          <p>Input target gene symbol and jump to Target result table.</p>
          <form className="search-card__form" onSubmit={handleTargetSearch}>
            <label htmlFor="target-query" className="sr-only">
              Target query
            </label>
            <input
              id="target-query"
              className="query-input"
              value={targetKeyword}
              onChange={(event) => {
                setTargetKeyword(event.target.value)
              }}
              placeholder="e.g. NPR1"
            />
            <button type="submit" className="cta-button cta-button--solid">
              Search Target
            </button>
          </form>
        </section>
      </section>

      <section ref={tfResultRef} className="extra-card fade-rise" id="tf-results">
        <h2>TF Search Result Table</h2>
        {!tfSearched ? (
          <p className="search-table__empty">No TF search yet. Submit a TF query above.</p>
        ) : tfRecords.length === 0 ? (
          <p className="search-table__empty">No TF records matched your keyword.</p>
        ) : (
          <div className="search-table-wrap">
            <table className="search-table">
              <thead>
                <tr>
                  <th>Record ID</th>
                  <th>TF</th>
                  <th>Target</th>
                  <th>Species</th>
                  <th>Tissue</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {tfRecords.map((record) => (
                  <tr key={record.id}>
                    <td>{record.id}</td>
                    <td>{record.tf}</td>
                    <td>{record.target}</td>
                    <td>{record.species}</td>
                    <td>{record.tissue}</td>
                    <td>{record.confidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section ref={targetResultRef} className="extra-card fade-rise" id="target-results">
        <h2>Target Search Result Table</h2>
        {!targetSearched ? (
          <p className="search-table__empty">No Target search yet. Submit a Target query above.</p>
        ) : targetRecords.length === 0 ? (
          <p className="search-table__empty">No Target records matched your keyword.</p>
        ) : (
          <div className="search-table-wrap">
            <table className="search-table">
              <thead>
                <tr>
                  <th>Record ID</th>
                  <th>Target</th>
                  <th>TF</th>
                  <th>Species</th>
                  <th>Tissue</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {targetRecords.map((record) => (
                  <tr key={`${record.id}-target`}>
                    <td>{record.id}</td>
                    <td>{record.target}</td>
                    <td>{record.tf}</td>
                    <td>{record.species}</td>
                    <td>{record.tissue}</td>
                    <td>{record.confidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </ModulePage>
  )
}
