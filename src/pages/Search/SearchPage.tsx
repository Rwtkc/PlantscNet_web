import { useMemo, useState } from 'react'
import { ModulePage } from '@/components/ModulePage'
import { moduleContent } from '@/app/module-content'

const indexedGenes = [
  'WUSCHEL',
  'SHOOTMERISTEMLESS',
  'APETALA1',
  'NAC019',
  'MYB46',
  'WRKY33',
  'NPR1',
  'IAA19',
  'PIN1',
  'SPL9',
]

export default function SearchPage() {
  const [query, setQuery] = useState('')

  const matches = useMemo(() => {
    const normalized = query.trim().toUpperCase()
    if (!normalized) return indexedGenes.slice(0, 6)

    return indexedGenes.filter((gene) => gene.includes(normalized)).slice(0, 6)
  }, [query])

  return (
    <ModulePage module={moduleContent.search}>
      <section className="extra-card fade-rise">
        <h2>Quick Gene Lookup</h2>
        <label htmlFor="gene-query" className="sr-only">
          Gene query
        </label>
        <input
          id="gene-query"
          className="query-input"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
          }}
          placeholder="Type gene symbol, e.g. WRKY33"
        />
        <ul className="pill-list">
          {matches.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </ModulePage>
  )
}
