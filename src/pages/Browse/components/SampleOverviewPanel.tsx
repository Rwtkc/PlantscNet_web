import type { SampleDetailResponse } from '../browse.types'
import { formatMetadataLabel } from '../browse.utils'

export function SampleOverviewPanel({ sample, metadata }: SampleDetailResponse) {
  const metadataEntries = Object.entries(metadata)

  return (
    <div className="browse-panel browse-panel--hero">
      <p className="browse-panel__eyebrow">Sample overview</p>
      <h2>{sample.sampleId}</h2>
      <p className="browse-sample-overview__description">
        Browse sample-level metadata and TF-target relationships for the selected PlantscNet sample.
      </p>

      <dl className="browse-sample-meta-list" aria-label="Sample metadata overview">
        {metadataEntries.map(([key, value]) => (
          <div key={key} className="browse-sample-meta-row">
            <dt>{formatMetadataLabel(key)}</dt>
            <dd>{value === null || value === '' ? '-' : String(value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}


