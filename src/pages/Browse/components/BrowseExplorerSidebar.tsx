import type { BrowseMode, SpeciesGroup, TissueGroup } from '../browse.types'
import { buildSampleSelectionKey } from '../browse.utils'

export function BrowseExplorerSidebar({
  isLoading,
  loadError,
  browseMode,
  speciesGroups,
  tissueGroups,
  expandedSpecies,
  expandedTissue,
  selectedSpeciesLabel,
  selectedSampleKey,
  onBrowseModeChange,
  onSpeciesToggle,
  onTissueToggle,
  onSampleToggle,
}: {
  isLoading: boolean
  loadError: string | null
  browseMode: BrowseMode
  speciesGroups: SpeciesGroup[]
  tissueGroups: TissueGroup[]
  expandedSpecies: string | null
  expandedTissue: string | null
  selectedSpeciesLabel: string | null
  selectedSampleKey: string | null
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
            <p>Explore species- and tissue-resolved sample collections across the PlantscNet resource.</p>
          </div>

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
                        {group.sampleIds.map((sampleId) => (
                          <li key={sampleId} className="browse-sample-item">
                            <button
                              type="button"
                              className={
                                selectedSampleKey === buildSampleSelectionKey(group.speciesLabel, sampleId)
                                  ? 'browse-sample-button browse-sample-button--active'
                                  : 'browse-sample-button'
                              }
                              aria-pressed={
                                selectedSampleKey === buildSampleSelectionKey(group.speciesLabel, sampleId)
                              }
                              onClick={() => {
                                onSampleToggle(group.speciesLabel, sampleId)
                              }}
                            >
                              {sampleId}
                            </button>
                          </li>
                        ))}
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
                        {group.samples.map((sample) => (
                          <li
                            key={`${sample.speciesLabel}-${sample.sampleId}`}
                            className="browse-sample-item"
                          >
                            <button
                              type="button"
                              className={
                                selectedSampleKey ===
                                buildSampleSelectionKey(sample.speciesLabel, sample.sampleId)
                                  ? 'browse-sample-button browse-sample-button--active'
                                  : 'browse-sample-button'
                              }
                              aria-pressed={
                                selectedSampleKey ===
                                buildSampleSelectionKey(sample.speciesLabel, sample.sampleId)
                              }
                              onClick={() => {
                                onSampleToggle(sample.speciesLabel, sample.sampleId)
                              }}
                            >
                              {sample.speciesLabel} | {sample.sampleId}
                            </button>
                          </li>
                        ))}
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
