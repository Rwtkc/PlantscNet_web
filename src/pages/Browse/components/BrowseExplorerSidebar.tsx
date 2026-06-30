import { memo } from 'react'
import type { BrowseMode, DataModality, SpeciesGroup, TissueGroup } from '../browse.types'
import { buildSampleSelectionKey, formatSampleDisplayId } from '../browse.utils'

function BrowseExplorerSidebarComponent({
  isLoading,
  loadError,
  modality,
  browseMode,
  speciesGroups,
  tissueGroups,
  expandedSpecies,
  expandedTissue,
  selectedSpeciesLabel,
  selectedSampleKey,
  onModalityChange,
  onBrowseModeChange,
  onSpeciesToggle,
  onTissueToggle,
  onSampleToggle,
}: {
  isLoading: boolean
  loadError: string | null
  modality: DataModality
  browseMode: BrowseMode
  speciesGroups: SpeciesGroup[]
  tissueGroups: TissueGroup[]
  expandedSpecies: string | null
  expandedTissue: string | null
  selectedSpeciesLabel: string | null
  selectedSampleKey: string | null
  onModalityChange: (modality: DataModality) => void
  onBrowseModeChange: (mode: BrowseMode) => void
  onSpeciesToggle: (speciesLabel: string, isExpanded: boolean) => void
  onTissueToggle: (tissue: string) => void
  onSampleToggle: (speciesLabel: string, sampleId: string) => void
}) {
  return (
    <aside className="browse-page__sidebar" aria-label="Browse explorer">
      <section className="browse-explorer">
        <div className="browse-explorer__head">
          <div className="browse-explorer__title">
            <p className="browse-explorer__eyebrow">Browse</p>
            <h1>Sample explorer</h1>
            <p>Explore scRNA and scATAC sample collections across the PlantscNet resource.</p>
          </div>

          <div className="browse-modality-control">
            <p className="browse-modality-control__label">Data type</p>
            <div className="browse-modality-switch" role="tablist" aria-label="Data modality">
            <button
              type="button"
              role="tab"
              aria-selected={modality === 'rna'}
              className={
                modality === 'rna'
                  ? 'browse-modality-switch__button browse-modality-switch__button--active'
                  : 'browse-modality-switch__button'
              }
              onClick={() => {
                onModalityChange('rna')
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
                  ? 'browse-modality-switch__button browse-modality-switch__button--active'
                  : 'browse-modality-switch__button'
              }
              onClick={() => {
                onModalityChange('atac')
              }}
            >
              scATAC
            </button>
            </div>
          </div>

          <div className="browse-submode-control">
            <p className="browse-submode-control__label">Browse by</p>
            <div className="browse-mode-switch" role="tablist" aria-label="Browse mode">
            <button
              type="button"
              role="tab"
              aria-selected={browseMode === 'species'}
              className={
                browseMode === 'species'
                  ? 'browse-mode-switch__button browse-mode-switch__button--active'
                  : 'browse-mode-switch__button'
              }
              onClick={() => {
                onBrowseModeChange('species')
              }}
            >
              By species
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={browseMode === 'tissue'}
              className={
                browseMode === 'tissue'
                  ? 'browse-mode-switch__button browse-mode-switch__button--active'
                  : 'browse-mode-switch__button'
              }
              onClick={() => {
                onBrowseModeChange('tissue')
              }}
            >
              By tissue
            </button>
            </div>
          </div>
        </div>

        <div className="browse-explorer__body">
          {isLoading ? <p className="browse-status">Loading sample information...</p> : null}
          {loadError ? <p className="browse-status browse-status--error">{loadError}</p> : null}

          {!isLoading && !loadError && browseMode === 'species' ? (
            <ul className="browse-node-list" aria-label="Species nodes">
              {speciesGroups.map((group) => {
                const isExpanded = expandedSpecies === group.speciesLabel
                const isSelected = selectedSpeciesLabel === group.speciesLabel

                return (
                  <li key={group.speciesLabel} className="browse-node-item">
                    <button
                      type="button"
                      className={
                        isExpanded || isSelected
                          ? 'browse-node-button browse-node-button--active'
                          : 'browse-node-button'
                      }
                      onClick={() => {
                        onSpeciesToggle(group.speciesLabel, isExpanded)
                      }}
                      aria-expanded={isExpanded}
                    >
                      <span>{group.speciesLabel}</span>
                      <span>{group.sampleIds.length}</span>
                    </button>

                    {isExpanded ? (
                      <ul className="browse-sample-list" aria-label={`${group.speciesLabel} sample ids`}>
                        {group.sampleIds.map((sampleId) => {
                          const selectionKey = buildSampleSelectionKey(group.speciesLabel, sampleId)
                          const isSampleSelected = selectedSampleKey === selectionKey

                          return (
                            <li key={sampleId} className="browse-sample-item">
                              <button
                                type="button"
                                className={
                                  isSampleSelected
                                    ? 'browse-sample-button browse-sample-button--active'
                                    : 'browse-sample-button'
                                }
                                aria-pressed={isSampleSelected}
                                onClick={() => {
                                  onSampleToggle(group.speciesLabel, sampleId)
                                }}
                              >
                                <span title={sampleId}>{formatSampleDisplayId(sampleId)}</span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          ) : null}

          {!isLoading && !loadError && browseMode === 'tissue' ? (
            <ul className="browse-node-list" aria-label="Tissue nodes">
              {tissueGroups.map((group) => {
                const isExpanded = expandedTissue === group.tissue

                return (
                  <li key={group.tissue} className="browse-node-item">
                    <button
                      type="button"
                      className={
                        isExpanded
                          ? 'browse-node-button browse-node-button--active'
                          : 'browse-node-button'
                      }
                      onClick={() => {
                        onTissueToggle(group.tissue)
                      }}
                      aria-expanded={isExpanded}
                    >
                      <span>{group.tissue}</span>
                      <span>{group.samples.length}</span>
                    </button>

                    {isExpanded ? (
                      <ul className="browse-sample-list" aria-label={`${group.tissue} sample ids`}>
                        {group.samples.map((sample) => {
                          const selectionKey = buildSampleSelectionKey(
                            sample.speciesLabel,
                            sample.sampleId,
                          )
                          const isSampleSelected = selectedSampleKey === selectionKey

                          return (
                            <li
                              key={`${sample.speciesLabel}-${sample.sampleId}`}
                              className="browse-sample-item"
                            >
                              <button
                                type="button"
                                className={
                                  isSampleSelected
                                    ? 'browse-sample-button browse-sample-button--active'
                                    : 'browse-sample-button'
                                }
                                aria-pressed={isSampleSelected}
                                onClick={() => {
                                  onSampleToggle(sample.speciesLabel, sample.sampleId)
                                }}
                              >
                                <span title={sample.sampleId}>
                                  {sample.speciesLabel} | {formatSampleDisplayId(sample.sampleId)}
                                </span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>
      </section>
    </aside>
  )
}

export const BrowseExplorerSidebar = memo(BrowseExplorerSidebarComponent)
