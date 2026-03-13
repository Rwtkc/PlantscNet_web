import { lazy, memo, Suspense } from 'react'
import type { SpeciesNetworkPreviewPanelProps } from './SpeciesNetworkPreviewPanel'

const SpeciesNetworkPreviewPanel = lazy(() => import('./SpeciesNetworkPreviewPanel'))
const noop = () => {}

type BrowseNetworkPreviewSectionProps = Omit<SpeciesNetworkPreviewPanelProps, 'onFitView'>

function BrowseNetworkPreviewFallback() {
  return (
    <div className="browse-panel browse-panel--status">
      <p className="browse-status">Loading network preview...</p>
    </div>
  )
}

function BrowseNetworkPreviewSectionComponent(props: BrowseNetworkPreviewSectionProps) {
  return (
    <Suspense fallback={<BrowseNetworkPreviewFallback />}>
      <SpeciesNetworkPreviewPanel {...props} onFitView={noop} />
    </Suspense>
  )
}

export const BrowseNetworkPreviewSection = memo(BrowseNetworkPreviewSectionComponent)
export default BrowseNetworkPreviewSection
