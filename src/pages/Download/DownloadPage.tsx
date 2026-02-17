import { ModulePage } from '@/components/ModulePage'
import { moduleContent } from '@/app/module-content'

const releaseItems = [
  { version: 'v2.4.0', payload: 'Network Edges + Metadata', size: '4.3 GB' },
  { version: 'v2.3.2', payload: 'Expression Matrix Bundle', size: '11.8 GB' },
  { version: 'v2.2.7', payload: 'Motif Enrichment Reports', size: '1.2 GB' },
]

export default function DownloadPage() {
  return (
    <ModulePage module={moduleContent.download}>
      <section className="extra-card fade-rise">
        <h2>Latest Release Matrix</h2>
        <div className="release-table" role="table" aria-label="Release versions">
          <div className="release-table__row release-table__row--head" role="row">
            <span role="columnheader">Version</span>
            <span role="columnheader">Payload</span>
            <span role="columnheader">Size</span>
          </div>
          {releaseItems.map((release) => (
            <div key={release.version} className="release-table__row" role="row">
              <span role="cell">{release.version}</span>
              <span role="cell">{release.payload}</span>
              <span role="cell">{release.size}</span>
            </div>
          ))}
        </div>
      </section>
    </ModulePage>
  )
}
