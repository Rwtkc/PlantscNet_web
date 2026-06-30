import { useEffect, useState } from 'react'
import { ModulePage } from '@/components/ModulePage'
import { resolveApiHref } from '@/app/base'
import { moduleContent } from '@/app/module-content'
import '@/styles/download.css'
import { fetchDownloadAssets } from './download.api'
import type { DownloadSpeciesAssets } from './download.types'

export default function DownloadPage() {
  const [speciesAssets, setSpeciesAssets] = useState<DownloadSpeciesAssets[]>([])
  const [expandedSpeciesId, setExpandedSpeciesId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    setLoading(true)
    setError(null)

    fetchDownloadAssets(controller.signal)
      .then((payload) => {
        setSpeciesAssets(payload.species)
      })
      .catch((loadError) => {
        if (controller.signal.aborted) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : 'Failed to load download assets.')
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () => {
      controller.abort()
    }
  }, [])

  return (
    <ModulePage module={moduleContent.download} hideInfoSections>
      <section className="extra-card fade-rise">
        <div className="download-section__header">
          <div>
            <h2>Species download bundles</h2>
            <p>
              Expand one species to download the feather ranking archive, MEME motif file, TF
              list, and the integrated regulatory network when available.
            </p>
          </div>
        </div>

        {loading ? <p className="download-state">Loading download assets...</p> : null}
        {error ? <p className="download-state download-state--error">{error}</p> : null}

        {!loading && !error ? (
          <div className="download-species-list">
            {speciesAssets.map((species) => {
              const expanded = expandedSpeciesId === species.speciesId

              return (
                <section key={species.speciesId} className="download-species-card">
                  <button
                    type="button"
                    className={`download-species-card__trigger${expanded ? ' download-species-card__trigger--expanded' : ''}`}
                    onClick={() => {
                      setExpandedSpeciesId((current) =>
                        current === species.speciesId ? null : species.speciesId,
                      )
                    }}
                    aria-expanded={expanded}
                  >
                    <span className="download-species-card__title">{species.speciesLabel}</span>
                    <span className="download-species-card__count">
                      {species.availableAssetCount}/{species.assets.length} files
                    </span>
                  </button>

                  {expanded ? (
                    <div className="download-asset-grid">
                      {species.assets.map((asset) => (
                        <article
                          key={`${species.speciesId}-${asset.key}`}
                          className="download-asset-card"
                        >
                          <div className="download-asset-card__body">
                            <div className="download-asset-card__header">
                              <h3>{asset.label}</h3>
                              <span
                                className={`download-asset-card__status${asset.available ? '' : ' download-asset-card__status--muted'}`}
                              >
                                {asset.available ? asset.sizeLabel ?? 'Available' : 'Not available'}
                              </span>
                            </div>
                            <p>{asset.description}</p>
                            <code className="download-asset-card__filename">{asset.fileName}</code>
                          </div>

                          {asset.available && asset.href ? (
                            <a className="cta-button" href={resolveApiHref(asset.href)}>
                              Download
                            </a>
                          ) : (
                            <span className="download-asset-card__empty">Not available</span>
                          )}
                        </article>
                      ))}
                    </div>
                  ) : null}
                </section>
              )
            })}
          </div>
        ) : null}
      </section>
    </ModulePage>
  )
}
