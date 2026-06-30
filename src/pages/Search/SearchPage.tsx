import { type FormEvent, useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { ModulePage } from '@/components/ModulePage'
import { moduleContent } from '@/app/module-content'
import { loadSearchSpeciesOptions, searchSpeciesNetwork } from './search.api'
import type { DataModality } from '@/pages/Browse/browse.types'
import type { SearchMode, SearchResponse, SearchSpeciesOption } from './search.types'
import { SearchModulePanel } from './components/SearchModulePanel'
import { SearchResultsPanel } from './components/SearchResultsPanel'
import { getSearchExample } from './search.examples'

export default function SearchPage() {
  const [modality, setModality] = useState<DataModality>('rna')
  const [speciesOptions, setSpeciesOptions] = useState<SearchSpeciesOption[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [tfSpeciesId, setTfSpeciesId] = useState('')
  const [targetSpeciesId, setTargetSpeciesId] = useState('')
  const [tfQuery, setTfQuery] = useState('')
  const [targetQuery, setTargetQuery] = useState('')
  const [tfResult, setTfResult] = useState<SearchResponse | null>(null)
  const [targetResult, setTargetResult] = useState<SearchResponse | null>(null)
  const [tfError, setTfError] = useState<string | null>(null)
  const [targetError, setTargetError] = useState<string | null>(null)
  const [isLoadingTf, setIsLoadingTf] = useState(false)
  const [isLoadingTarget, setIsLoadingTarget] = useState(false)
  const [tfSearched, setTfSearched] = useState(false)
  const [targetSearched, setTargetSearched] = useState(false)
  const [activeResultMode, setActiveResultMode] = useState<SearchMode | null>(null)

  useEffect(() => {
    let isCancelled = false

    async function loadSpeciesOptions() {
      try {
        const options = await loadSearchSpeciesOptions(modality)

        if (!isCancelled) {
          setSpeciesOptions(options)
          setLoadError(null)
        }
      } catch {
        if (!isCancelled) {
          setSpeciesOptions([])
          setLoadError('Species options could not be loaded from the browse index.')
        }
      }
    }

    loadSpeciesOptions()

    return () => {
      isCancelled = true
    }
  }, [modality])

  const handleModalityChange = (nextModality: DataModality) => {
    if (nextModality === modality) {
      return
    }

    setModality(nextModality)
    setTfSpeciesId('')
    setTargetSpeciesId('')
    setTfQuery('')
    setTargetQuery('')
    setTfResult(null)
    setTargetResult(null)
    setTfError(null)
    setTargetError(null)
    setTfSearched(false)
    setTargetSearched(false)
    setActiveResultMode(null)
  }

  const handleExampleClick = (
    mode: SearchMode,
    selectedSpeciesId: string,
    setSpeciesId: (value: string) => void,
    setQuery: (value: string) => void,
    setError: (value: string | null) => void,
  ) => {
    const example = getSearchExample(
      modality,
      mode,
      selectedSpeciesId || undefined,
      speciesOptions.map((species) => species.id),
    )

    if (!example) {
      setError('No preset example is available for the selected data layer.')
      return
    }

    flushSync(() => {
      setSpeciesId(example.speciesId)
      setQuery(example.query)
      setError(null)
    })
  }

  const handleSearch =
    (
      mode: SearchMode,
      setLoading: (value: boolean) => void,
      setError: (value: string | null) => void,
      setResult: (value: SearchResponse | null) => void,
      setSearched: (value: boolean) => void,
    ) =>
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setActiveResultMode(mode)
      setSearched(true)

      const speciesId = mode === 'tf' ? tfSpeciesId : targetSpeciesId
      const query = mode === 'tf' ? tfQuery : targetQuery

      if (mode === 'tf') {
        setTargetResult(null)
        setTargetError(null)
        setTargetSearched(false)
        setIsLoadingTarget(false)
      } else {
        setTfResult(null)
        setTfError(null)
        setTfSearched(false)
        setIsLoadingTf(false)
      }

      if (!speciesId) {
        setResult(null)
        setError('Please select a species before searching.')
        return
      }

      if (!query.trim()) {
        setResult(null)
        setError('Please enter a gene symbol before searching.')
        return
      }

      setLoading(true)
      setError(null)

      try {
        const response = await searchSpeciesNetwork(modality, speciesId, mode, query)
        setResult(response)
      } catch {
        setResult(null)
        setError('Search results could not be loaded from the backend.')
      } finally {
        setLoading(false)
      }
    }

  const activeResult =
    activeResultMode === 'tf'
      ? {
          result: tfResult,
          isLoading: isLoadingTf,
          error: tfError,
          searched: tfSearched,
          modeLabel: 'TF gene',
        }
      : activeResultMode === 'target'
        ? {
            result: targetResult,
            isLoading: isLoadingTarget,
            error: targetError,
            searched: targetSearched,
            modeLabel: 'Target gene',
          }
        : null

  const shouldShowResults = Boolean(
    activeResult &&
      (activeResult.searched || activeResult.isLoading || activeResult.error || activeResult.result),
  )

  return (
    <ModulePage module={moduleContent.search} hideInfoSections>
      <section className="search-modality-card fade-rise" aria-label="Search data layer">
        <div>
          <p className="search-modality-card__eyebrow">Data layer</p>
          <h2>{modality === 'rna' ? 'scRNA regulatory networks' : 'scATAC regulatory networks'}</h2>
        </div>
        <div className="search-modality-switch" role="tablist" aria-label="Search data modality">
          <button
            type="button"
            role="tab"
            aria-selected={modality === 'rna'}
            className={
              modality === 'rna'
                ? 'search-modality-switch__button search-modality-switch__button--active'
                : 'search-modality-switch__button'
            }
            onClick={() => {
              handleModalityChange('rna')
            }}
          >
            scRNA
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={modality === 'atac'}
            className={
              modality === 'atac'
                ? 'search-modality-switch__button search-modality-switch__button--active'
                : 'search-modality-switch__button'
            }
            onClick={() => {
              handleModalityChange('atac')
            }}
          >
            scATAC
          </button>
        </div>
      </section>

      {loadError ? (
        <section className="extra-card fade-rise">
          <p className="search-table__empty search-table__empty--error">{loadError}</p>
        </section>
      ) : null}

      <section className="search-module-grid" aria-label="Search modules">
        <SearchModulePanel
          title="Search by TF"
          description="Select a species and search one TF symbol. Results are split into integrated and sample-derived matches."
          queryLabel="TF gene"
          queryPlaceholder="Click Example or enter a TF gene symbol"
          speciesOptions={speciesOptions}
          selectedSpeciesId={tfSpeciesId}
          query={tfQuery}
          isLoading={isLoadingTf}
          onSpeciesChange={setTfSpeciesId}
          onQueryChange={setTfQuery}
          onExampleClick={() => {
            handleExampleClick(
              'tf',
              tfSpeciesId,
              setTfSpeciesId,
              setTfQuery,
              setTfError,
            )
          }}
          onSubmit={handleSearch(
            'tf',
            setIsLoadingTf,
            setTfError,
            setTfResult,
            setTfSearched,
          )}
        />

        <SearchModulePanel
          title="Search by Target"
          description="Select a species and search one target gene. Results are split into integrated and sample-derived matches."
          queryLabel="Target gene"
          queryPlaceholder="Click Example or enter a target gene symbol"
          speciesOptions={speciesOptions}
          selectedSpeciesId={targetSpeciesId}
          query={targetQuery}
          isLoading={isLoadingTarget}
          onSpeciesChange={setTargetSpeciesId}
          onQueryChange={setTargetQuery}
          onExampleClick={() => {
            handleExampleClick(
              'target',
              targetSpeciesId,
              setTargetSpeciesId,
              setTargetQuery,
              setTargetError,
            )
          }}
          onSubmit={handleSearch(
            'target',
            setIsLoadingTarget,
            setTargetError,
            setTargetResult,
            setTargetSearched,
          )}
        />
      </section>

      {shouldShowResults ? (
        <section className="search-results-grid" aria-label="Search result tables">
          {activeResult ? (
            <section className="extra-card fade-rise">
              <div className="search-results-grid__content">
                <SearchResultsPanel
                  result={activeResult.result}
                  isLoading={activeResult.isLoading}
                  error={activeResult.error}
                  searched={activeResult.searched}
                  modeLabel={activeResult.modeLabel}
                  showSpeciesColumn
                />
              </div>
            </section>
          ) : null}
        </section>
      ) : null}
    </ModulePage>
  )
}
