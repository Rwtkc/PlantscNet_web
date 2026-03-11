import type { FormEvent } from 'react'
import type { SearchSpeciesOption } from '../search.types'
import { SearchSpeciesPicker } from './SearchSpeciesPicker'

export function SearchModulePanel({
  title,
  description,
  queryLabel,
  queryPlaceholder,
  speciesOptions,
  selectedSpeciesId,
  query,
  isLoading,
  onSpeciesChange,
  onQueryChange,
  onExampleClick,
  onSubmit,
}: {
  title: string
  description: string
  queryLabel: string
  queryPlaceholder: string
  speciesOptions: SearchSpeciesOption[]
  selectedSpeciesId: string
  query: string
  isLoading: boolean
  onSpeciesChange: (value: string) => void
  onQueryChange: (value: string) => void
  onExampleClick: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <section className="search-module-card fade-rise">
      <div className="search-module-card__header">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <form className="search-module-form" onSubmit={onSubmit}>
        <label className="search-field">
          <span>Species</span>
          <SearchSpeciesPicker
            options={speciesOptions}
            value={selectedSpeciesId}
            onChange={onSpeciesChange}
          />
        </label>

        <label className="search-field">
          <span className="search-field__row">
            <span>{queryLabel}</span>
            <button
              type="button"
              className="search-example-button"
              onClick={onExampleClick}
            >
              Fill Example
            </button>
          </span>
          <input
            className="query-input"
            value={query}
            onChange={(event) => {
              onQueryChange(event.target.value)
            }}
            placeholder={queryPlaceholder}
          />
        </label>

        <button type="submit" className="cta-button cta-button--solid" disabled={isLoading}>
          {isLoading ? 'Searching...' : title}
        </button>
      </form>
    </section>
  )
}
