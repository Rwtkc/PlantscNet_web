import type { SampleDetailResponse, SpeciesNetworkPreviewResponse } from '../browse.types'
import { SampleOverviewPanel } from './SampleOverviewPanel'
import { SampleTfTargetTable } from './SampleTfTargetTable'
import { SpeciesNetworkPreviewPanel } from './SpeciesNetworkPreviewPanel'

export function BrowseSampleContent({
  sampleDetail,
  sampleDetailError,
  isLoadingSampleDetail,
  sampleNetworkPreview,
  sampleNetworkPreviewError,
  isLoadingSampleNetworkPreview,
  networkThreshold,
  networkDefaultThreshold,
  networkLimit,
  networkTfFilter,
  onApplyNetworkFilters,
  onResetNetworkFilters,
  onSampleDetailPageChange,
}: {
  sampleDetail: SampleDetailResponse | null
  sampleDetailError: string | null
  isLoadingSampleDetail: boolean
  sampleNetworkPreview: SpeciesNetworkPreviewResponse | null
  sampleNetworkPreviewError: string | null
  isLoadingSampleNetworkPreview: boolean
  networkThreshold: number
  networkDefaultThreshold: number
  networkLimit: number
  networkTfFilter: string
  onApplyNetworkFilters: (filters: { threshold: number; limit: number; tfFilter: string }) => void
  onResetNetworkFilters: () => void
  onSampleDetailPageChange: (page: number) => void
}) {
  return (
    <div className="browse-overview">
      {isLoadingSampleDetail && !sampleDetail ? (
        <div className="browse-panel browse-panel--status">
          <p className="browse-status">Loading sample detail...</p>
        </div>
      ) : null}

      {sampleDetail ? (
        <>
          <SampleOverviewPanel {...sampleDetail} />
          <SampleTfTargetTable
            rows={sampleDetail.rows}
            pagination={sampleDetail.pagination}
            isLoading={isLoadingSampleDetail}
            onPageChange={onSampleDetailPageChange}
          />
          {isLoadingSampleNetworkPreview && !sampleNetworkPreview ? (
            <div className="browse-panel browse-panel--status">
              <p className="browse-status">Loading sample network preview...</p>
            </div>
          ) : null}
          {sampleNetworkPreview ? (
            <SpeciesNetworkPreviewPanel
              preview={sampleNetworkPreview}
              isLoading={isLoadingSampleNetworkPreview}
              threshold={networkThreshold}
              defaultThreshold={networkDefaultThreshold}
              limit={networkLimit}
              tfFilter={networkTfFilter}
              onApplyFilters={onApplyNetworkFilters}
              onResetFilters={onResetNetworkFilters}
              onFitView={() => {}}
            />
          ) : null}
          {sampleNetworkPreviewError ? (
            <div className="browse-panel browse-panel--status">
              <p className="browse-status browse-status--error">{sampleNetworkPreviewError}</p>
            </div>
          ) : null}
        </>
      ) : null}

      {sampleDetailError ? (
        <div className="browse-panel browse-panel--status">
          <p className="browse-status browse-status--error">{sampleDetailError}</p>
        </div>
      ) : null}
    </div>
  )
}
