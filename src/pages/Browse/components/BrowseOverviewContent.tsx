import { memo } from 'react'
import { toAssetPath } from '@/app/base'
import type {
  BrowseMode,
  DetailViewContent,
  SpeciesNetworkRelationsResponse,
  SpeciesNetworkPreviewResponse,
  SpeciesOption,
} from '../browse.types'
import { BrowseNetworkPreviewSection } from './BrowseNetworkPreviewSection'
import { SampleMetadataTable } from './SampleMetadataTable'
import { SpeciesNetworkRelationsTable } from './SpeciesNetworkRelationsTable'
import { TissueCompositionChart } from './TissueCompositionChart'

function BrowseOverviewContentComponent({
  detailView,
  detailError,
  tfTargetCounts,
  browseMode,
  activeSpecies,
  speciesNetworkRelations,
  speciesNetworkRelationsError,
  isLoadingSpeciesNetworkRelations,
  speciesNetworkPreview,
  speciesNetworkPreviewError,
  isLoadingSpeciesNetworkPreview,
  networkThreshold,
  networkDefaultThreshold,
  networkLimit,
  networkTfFilter,
  onApplyNetworkFilters,
  onResetNetworkFilters,
  onSpeciesRelationsPageChange,
}: {
  detailView: DetailViewContent | null
  detailError: string | null
  tfTargetCounts: Record<string, number | null>
  browseMode: BrowseMode
  activeSpecies: SpeciesOption | null
  speciesNetworkRelations: SpeciesNetworkRelationsResponse | null
  speciesNetworkRelationsError: string | null
  isLoadingSpeciesNetworkRelations: boolean
  speciesNetworkPreview: SpeciesNetworkPreviewResponse | null
  speciesNetworkPreviewError: string | null
  isLoadingSpeciesNetworkPreview: boolean
  networkThreshold: number
  networkDefaultThreshold: number
  networkLimit: number
  networkTfFilter: string
  onApplyNetworkFilters: (filters: { threshold: number; limit: number; tfFilter: string }) => void
  onResetNetworkFilters: () => void
  onSpeciesRelationsPageChange: (page: number) => void
}) {
  const hasIntegratedSpeciesRelations =
    speciesNetworkRelations && speciesNetworkRelations.sourceKind !== 'sample-aggregate'
  const hasIntegratedSpeciesPreview =
    speciesNetworkPreview && speciesNetworkPreview.sourceKind !== 'sample-aggregate'

  if (!detailView) {
    return (
      <div className="browse-main__placeholder" role="img" aria-label="PlantscNet browse placeholder">
        <img
          className="browse-main__placeholder-logo"
          src={toAssetPath('PlantscNet_minilogo.webp')}
          alt=""
          aria-hidden="true"
          width={320}
          height={260}
          loading="eager"
          decoding="async"
        />
      </div>
    )
  }

  return (
    <div className="browse-overview">
      <div className="browse-panel browse-panel--hero">
        <p className="browse-panel__eyebrow">{detailView.eyebrow}</p>
        <h2>{detailView.title}</h2>
        <p>{detailView.description}</p>
      </div>

      <TissueCompositionChart
        items={detailView.compositionItems}
        heading={detailView.chartHeading}
        ariaLabel={detailView.chartAriaLabel}
        summary={detailView.chartSummary}
      />
      <SampleMetadataTable records={detailView.tableRecords} tfTargetCounts={tfTargetCounts} />
      {browseMode === 'species' && activeSpecies ? (
        <>
          {isLoadingSpeciesNetworkPreview && !speciesNetworkPreview ? (
            <div className="browse-panel browse-panel--status">
              <p className="browse-status">Loading network preview...</p>
            </div>
          ) : null}
          {isLoadingSpeciesNetworkRelations && !speciesNetworkRelations ? (
            <div className="browse-panel browse-panel--status">
              <p className="browse-status">Loading integrated regulatory relations...</p>
            </div>
          ) : null}
          {hasIntegratedSpeciesRelations ? (
            <SpeciesNetworkRelationsTable
              relations={speciesNetworkRelations}
              isLoading={isLoadingSpeciesNetworkRelations}
              onPageChange={onSpeciesRelationsPageChange}
            />
          ) : null}
          {speciesNetworkRelationsError ? (
            <div className="browse-panel browse-panel--status">
              <p className="browse-status browse-status--error">{speciesNetworkRelationsError}</p>
            </div>
          ) : null}
          {hasIntegratedSpeciesPreview ? (
            <BrowseNetworkPreviewSection
              preview={speciesNetworkPreview}
              isLoading={isLoadingSpeciesNetworkPreview}
              threshold={networkThreshold}
              defaultThreshold={networkDefaultThreshold}
              limit={networkLimit}
              tfFilter={networkTfFilter}
              onApplyFilters={onApplyNetworkFilters}
              onResetFilters={onResetNetworkFilters}
            />
          ) : null}
          {speciesNetworkPreviewError ? (
            <div className="browse-panel browse-panel--status">
              <p className="browse-status browse-status--error">{speciesNetworkPreviewError}</p>
            </div>
          ) : null}
        </>
      ) : null}
      {detailError ? (
        <div className="browse-panel browse-panel--status">
          <p className="browse-status browse-status--error">{detailError}</p>
        </div>
      ) : null}
    </div>
  )
}

export const BrowseOverviewContent = memo(BrowseOverviewContentComponent)
