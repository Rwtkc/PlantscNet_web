import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import '@fontsource/montserrat/400.css'
import '@fontsource/montserrat/600.css'
import '@fontsource/montserrat/700.css'
import '@fontsource/montserrat/800.css'
import { toAssetPath } from '@/app/base'
import { BrowseNetworkPreview } from './BrowseNetworkPreview'
import { exportArticleFigurePng, normalizeArticleFigureExportWidth } from './articleFigureExport'
import '@/styles/article-figure.css'
import '@/styles/article-figure-browse-filter.css'
import '@/styles/article-figure-browse-result.css'
import '@/styles/article-figure-search-case.css'
import '@/styles/article-figure-download-case.css'

const dataInputs = [
  { label: 'scRNA-seq', icon: 'article-icons/scrna-seq.webp' },
  { label: 'Species meta', icon: 'article-icons/species-meta.webp' },
  { label: 'TF / motif', icon: 'article-icons/tf-motif.webp' },
  { label: 'GRN files', icon: 'article-icons/grn-files.webp' },
]

const modules = [
  { label: 'Home', icon: 'article-icons/home.webp' },
  { label: 'Browse', icon: 'article-icons/browse.webp' },
  { label: 'Search', icon: 'article-icons/search.webp' },
  { label: 'Download', icon: 'article-icons/download.webp' },
]

const browseSpecies = [
  { count: 50, label: 'Arabidopsis thaliana' },
  { count: 1, label: 'Brassica rapa' },
  { count: 5, label: 'Glycine max' },
  { count: 24, label: 'Oryza sativa' },
  { count: 12, label: 'Populus trichocarpa' },
  { count: 1, label: 'Solanum lycopersicum' },
  { count: 15, label: 'Zea mays' },
]

const browseSamples = [
  { id: 'SMP-01', tissue: 'Root', edges: '8.4k' },
  { id: 'SMP-02', tissue: 'Root', edges: '12.6k' },
  { id: 'SMP-03', tissue: 'Nodule', edges: '18.2k' },
  { id: 'SMP-04', tissue: 'Leaf', edges: '9.7k' },
]

const regulatoryRelations = [
  { probability: '0.98', target: 'LOC_OsXXg1001', tf: 'LOC_OsXXg0101' },
  { probability: '0.96', target: 'LOC_OsXXg1002', tf: 'LOC_OsXXg0101' },
  { probability: '0.94', target: 'LOC_OsXXg1003', tf: 'LOC_OsXXg0202' },
  { probability: '0.91', target: 'LOC_OsXXg1004', tf: 'LOC_OsXXg0303' },
  { probability: '0.89', target: 'LOC_OsXXg1005', tf: 'LOC_OsXXg0303' },
  { probability: '0.87', target: 'LOC_OsXXg1006', tf: 'LOC_OsXXg0404' },
]

const tissueSummary = [
  { count: 19, label: 'Root' },
  { count: 4, label: 'Young inflorescences' },
  { count: 1, label: 'Leaf' },
]

const searchTfGene = 'LOC_OsXXg2834'
const searchTargetGene = 'LOC_OsXXg2834'

const searchModes = [
  {
    action: 'Search by TF',
    field: 'TF gene',
    title: 'Search by TF',
    value: searchTfGene,
  },
  {
    action: 'Search by Target',
    field: 'Target gene',
    title: 'Search by Target',
    value: searchTargetGene,
  },
] as const

const tfSearchResults = [
  {
    probability: '0.9981',
    species: 'Oryza sativa',
    target: 'LOC_OsXXg1005',
    tf: 'LOC_OsXXg2834',
  },
  {
    probability: '0.9977',
    species: 'Oryza sativa',
    target: 'LOC_OsXXg0856',
    tf: 'LOC_OsXXg2834',
  },
  {
    probability: '0.9976',
    species: 'Oryza sativa',
    target: 'LOC_OsXXg3042',
    tf: 'LOC_OsXXg2834',
  },
  {
    probability: '0.9954',
    species: 'Oryza sativa',
    target: 'LOC_OsXXg4090',
    tf: 'LOC_OsXXg2834',
  },
] as const

const targetSearchResults = [
  {
    probability: '0.9977',
    species: 'Oryza sativa',
    target: 'LOC_OsXXg0856',
    tf: 'LOC_OsXXg2834',
  },
  {
    probability: '0.7431',
    species: 'Oryza sativa',
    target: 'LOC_OsXXg0856',
    tf: 'LOC_OsXXg5278',
  },
  {
    probability: '0.6567',
    species: 'Oryza sativa',
    target: 'LOC_OsXXg0856',
    tf: 'LOC_OsXXg6108',
  },
  {
    probability: '0.6370',
    species: 'Oryza sativa',
    target: 'LOC_OsXXg0856',
    tf: 'LOC_OsXXg3140',
  },
] as const

const downloadSpecies: ReadonlyArray<{
  count: string
  label: string
  selected?: boolean
}> = [
  { count: '4/4 files', label: 'Arabidopsis thaliana' },
  { count: '4/4 files', label: 'Glycine max' },
  { count: '4/4 files', label: 'Oryza sativa', selected: true },
  { count: '4/4 files', label: 'Zea mays' },
]

const downloadFiles = [
  {
    fileName: 'feather_file.xz',
    iconVariant: 'ranking',
    size: '88 MB',
    title: 'Feather ranking',
  },
  {
    fileName: 'meme_pwm.meme',
    iconVariant: 'motif',
    size: '454 KB',
    title: 'MEME motif',
  },
  {
    fileName: 'tf_list.txt',
    iconVariant: 'tf',
    size: '8.8 KB',
    title: 'TF list',
  },
  {
    fileName: 'final_regulatory.tsv',
    iconVariant: 'network',
    size: '13 MB',
    title: 'Final network',
  },
] as const

function IconSlot({
  alt,
  size = 'small',
  src,
}: {
  alt?: string
  size?: 'large' | 'small'
  src?: string
}) {
  return (
    <span className={`article-figure-icon-slot article-figure-icon-slot--${size}`}>
      {src ? (
        <img
          className="article-figure-icon-slot__image"
          src={toAssetPath(src)}
          alt={alt ?? ''}
          decoding="async"
        />
      ) : null}
    </span>
  )
}

function FigurePanel({
  title,
  tone,
  children,
}: {
  title: string
  tone: 'blue' | 'green' | 'red' | 'yellow'
  children: ReactNode
}) {
  return (
    <section className={`article-figure-panel article-figure-panel--${tone}`}>
      <h2>{title}</h2>
      {children}
    </section>
  )
}

function Arrow({ label }: { label?: string }) {
  return (
    <div className="article-figure-arrow" aria-label={label}>
      <span>{label}</span>
    </div>
  )
}

function SearchIconPlaceholder() {
  return (
    <span aria-hidden="true" className="article-figure-search-mode__icon-placeholder">
      <img src={toAssetPath('article-icons/click.webp')} alt="" decoding="async" />
    </span>
  )
}

function DownloadIconPlaceholder({ variant }: { variant: string }) {
  const iconMap: Record<string, string> = {
    annotation: 'article-icons/Annotation_file.webp',
    motif: 'article-icons/MEME_motif.webp',
    network: 'article-icons/Final_network.webp',
    ranking: 'article-icons/Feather_ranking.webp',
    tf: 'article-icons/TF_list.webp',
  }

  return (
    <span
      aria-hidden="true"
      className={`article-figure-download__icon-placeholder article-figure-download__icon-placeholder--${variant}`}
    >
      <img src={toAssetPath(iconMap[variant])} alt="" decoding="async" />
    </span>
  )
}

function ChipLabel({ label }: { label: string }) {
  if (label === 'Species meta') {
    return (
      <span className="article-figure-chip__stacked-label">
        Species
        <br />
        meta
      </span>
    )
  }

  return <span>{label}</span>
}

function SearchModesMini() {
  return (
    <div className="article-figure-search-modes">
      {searchModes.map((mode) => (
        <section className="article-figure-search-mode" key={mode.title}>
          <div className="article-figure-search-mode__title">
            <strong>{mode.title}</strong>
          </div>
          <div className="article-figure-search-mode__field">
            <span>Species</span>
            <div className="article-figure-search-mode__input">Oryza sativa</div>
          </div>
          <div className="article-figure-search-mode__field">
            <span>{mode.field}</span>
            <div className="article-figure-search-mode__input">{mode.value}</div>
          </div>
          <div className="article-figure-search-mode__action">
            <div className="article-figure-search-mode__button">{mode.action}</div>
            <SearchIconPlaceholder />
          </div>
        </section>
      ))}
    </div>
  )
}

function SearchResultsMini() {
  return (
    <div className="article-figure-search-results">
      <section className="article-figure-search-result-card">
        <header className="article-figure-search-result-card__header">
          <div>
            <strong>Integrated species network matches</strong>
            <span>{`TF query: ${searchTfGene}`}</span>
          </div>
        </header>
        <div className="article-figure-search-result-card__filter">
          Filter current integrated table
        </div>
        <div className="article-figure-search-result-card__table">
          <div className="article-figure-search-result-card__head">
            <span>Species</span>
            <span>TF</span>
            <span>Target</span>
            <span>Probability</span>
          </div>
          {tfSearchResults.map((item) => (
            <div className="article-figure-search-result-card__row" key={item.target}>
              <span>{item.species}</span>
              <span>{item.tf}</span>
              <span>{item.target}</span>
              <span>{item.probability}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="article-figure-search-result-card">
        <header className="article-figure-search-result-card__header">
          <div>
            <strong>Integrated species network matches</strong>
            <span>{`Target query: ${searchTargetGene}`}</span>
          </div>
        </header>
        <div className="article-figure-search-result-card__filter">
          Filter current integrated table
        </div>
        <div className="article-figure-search-result-card__table">
          <div className="article-figure-search-result-card__head">
            <span>Species</span>
            <span>TF</span>
            <span>Target</span>
            <span>Probability</span>
          </div>
          {targetSearchResults.map((item) => (
            <div className="article-figure-search-result-card__row" key={item.tf}>
              <span>{item.species}</span>
              <span>{item.tf}</span>
              <span>{item.target}</span>
              <span>{item.probability}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function BrowseSelectorMini() {
  return (
    <div className="article-figure-browse-filter">
      <span className="article-figure-browse-filter__eyebrow">Browse</span>
      <strong>Sample explorer</strong>
      <div className="article-figure-browse-filter__tabs">
        <span className="is-active">By species</span>
        <span>By tissue</span>
      </div>
      <div className="article-figure-browse-filter__list">
        {browseSpecies.map((species) => (
          <div
            className={
              species.label === 'Oryza sativa'
                ? 'article-figure-browse-filter__item is-selected'
                : 'article-figure-browse-filter__item'
            }
            key={species.label}
          >
            <span>{species.label}</span>
            <b>{species.count}</b>
          </div>
        ))}
        <div className="article-figure-browse-filter__more">...</div>
      </div>
    </div>
  )
}

function BrowseResultMini() {
  return (
    <div className="article-figure-browse-result">
      <div className="article-figure-browse-result__tables">
        <div className="article-figure-browse-result__table">
          <header>
            <strong>Sample table</strong>
            <span>1-4 of 24</span>
          </header>
          <div className="article-figure-browse-result__table-head">
            <span>Sample ID</span>
            <span>Tissue</span>
            <span>Edges</span>
          </div>
          {browseSamples.map((sample) => (
            <div className="article-figure-browse-result__table-row" key={sample.id}>
              <span>{sample.id}</span>
              <span>{sample.tissue}</span>
              <span>{sample.edges}</span>
            </div>
          ))}
        </div>
        <div className="article-figure-browse-result__relations">
          <header>
            <strong>Integrated regulatory relations</strong>
            <span>{'probability >= 0.5'}</span>
          </header>
          <div className="article-figure-browse-result__relations-head">
            <span>TF</span>
            <span>Target</span>
            <span>Probability</span>
          </div>
          {regulatoryRelations.map((relation) => (
            <div
              className="article-figure-browse-result__relations-row"
              key={`${relation.tf}-${relation.target}`}
            >
              <span>{relation.tf}</span>
              <span>{relation.target}</span>
              <span>{relation.probability}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="article-figure-browse-result__summary">
        <div className="article-figure-browse-result__overview">
          <span>Species overview</span>
          <strong>Oryza sativa</strong>
        </div>
        <div className="article-figure-browse-result__composition">
          <div className="article-figure-browse-result__donut">
            <strong>24</strong>
            <span>samples</span>
          </div>
          <div className="article-figure-browse-result__tissues">
            {tissueSummary.map((item) => (
              <div className="article-figure-browse-result__tissue" key={item.label}>
                <span>{item.label}</span>
                <b>{item.count}</b>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="article-figure-browse-result__network-card">
        <header>
          <strong>Network preview</strong>
          <span>TF-target</span>
        </header>
        <BrowseNetworkPreview />
      </div>
    </div>
  )
}

function DownloadModuleMini() {
  return (
    <div className="article-figure-download">
      <div className="article-figure-download__species">
        {downloadSpecies.map((item) => (
          <div
            className={
              item.selected
                ? 'article-figure-download__species-row is-selected'
                : 'article-figure-download__species-row'
            }
            key={item.label}
          >
            <span>{item.label}</span>
            <b>{item.count}</b>
          </div>
        ))}
        <div className="article-figure-download__species-more">...</div>
      </div>

      <div className="article-figure-download__bundle">
        <header className="article-figure-download__bundle-head">
          <strong>Species download bundles</strong>
          <span>Oryza sativa</span>
        </header>
        <div className="article-figure-download__cards">
          {downloadFiles.map((item) => (
            <section className="article-figure-download__card" key={item.title}>
              <div className="article-figure-download__card-top">
                <DownloadIconPlaceholder variant={item.iconVariant} />
                <b>{item.size}</b>
              </div>
              <strong>{item.title}</strong>
              <span>{item.fileName}</span>
              <i>Download</i>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ArticleFigurePage() {
  const sheetRef = useRef<HTMLDivElement>(null)
  const [pngWidth, setPngWidth] = useState('3000')
  const [exportError, setExportError] = useState<string | null>(null)
  const [isExportingPng, setIsExportingPng] = useState(false)

  const resolvedPngWidth = Number.parseInt(pngWidth, 10)

  const estimatedPngHeight = useMemo(() => {
    const sheet = sheetRef.current

    if (!sheet || !Number.isFinite(resolvedPngWidth) || resolvedPngWidth <= 0) {
      return null
    }

    const rect = sheet.getBoundingClientRect()
    if (!rect.width || !rect.height) {
      return null
    }

    return Math.round((resolvedPngWidth * rect.height) / rect.width)
  }, [resolvedPngWidth])

  const prepareFigureExport = useCallback(async () => {
    const sheet = sheetRef.current

    if (!sheet) {
      return null
    }

    const images = Array.from(sheet.querySelectorAll('img'))
    await Promise.all(
      images.map(async (image) => {
        if (image.complete) {
          return
        }

        try {
          await image.decode()
        } catch {
          await new Promise<void>((resolve) => {
            const finalize = () => resolve()
            image.addEventListener('load', finalize, { once: true })
            image.addEventListener('error', finalize, { once: true })
          })
        }
      }),
    )

    if ('fonts' in document) {
      await document.fonts.ready
    }

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    return sheet
  }, [])

  const handleExportPdf = useCallback(async () => {
    const sheet = await prepareFigureExport()
    if (!sheet) {
      return
    }
    window.print()
  }, [prepareFigureExport])

  const handleExportPng = useCallback(async () => {
    const outputWidth = normalizeArticleFigureExportWidth(resolvedPngWidth)
    if (outputWidth === null || isExportingPng) {
      return
    }

    setExportError(null)
    setIsExportingPng(true)

    try {
      await exportArticleFigurePng(outputWidth)
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Failed to export PNG.')
    } finally {
      setIsExportingPng(false)
    }
  }, [isExportingPng, resolvedPngWidth])

  return (
    <article className="article-figure-page">
      <div className="article-figure-export-bar">
        <label className="article-figure-export-field">
          <span>PNG width</span>
          <input
            type="number"
            min="100"
            step="100"
            value={pngWidth}
            onChange={(event) => setPngWidth(event.target.value)}
          />
        </label>
        <span className="article-figure-export-hint">
          {estimatedPngHeight ? `${resolvedPngWidth} x ${estimatedPngHeight}px` : 'Auto ratio'}
        </span>
        <button
          type="button"
          className="article-figure-export-button"
          disabled={isExportingPng}
          onClick={handleExportPng}
        >
          {isExportingPng ? 'Exporting...' : 'Export PNG'}
        </button>
        <button
          type="button"
          className="article-figure-export-button"
          onClick={handleExportPdf}
        >
          Export PDF
        </button>
      </div>
      {exportError ? <p className="article-figure-export-error">{exportError}</p> : null}
      <div
        ref={sheetRef}
        className="article-figure-sheet"
        aria-label="PlantscNet article figure prototype"
      >
        <FigurePanel title="PlantscNet database resource" tone="green">
          <div className="article-figure-resource">
            <div className="article-figure-icon-grid">
              {dataInputs.map((item) => (
                <div className="article-figure-chip" key={item.label}>
                  <IconSlot alt={item.label} src={item.icon} />
                  <ChipLabel label={item.label} />
                </div>
              ))}
            </div>
            <Arrow />
            <div className="article-figure-database">
              <img
                className="article-figure-database__logo"
                src={toAssetPath('PlantscNet_minilogo.webp')}
                alt=""
                width={320}
                height={260}
                decoding="async"
              />
              <strong>PlantscNet</strong>
              <span>Plant single-cell GRN database</span>
            </div>
            <Arrow />
            <div className="article-figure-icon-grid article-figure-icon-grid--modules">
              {modules.map((item) => (
                <div className="article-figure-chip" key={item.label}>
                  <IconSlot alt={item.label} src={item.icon} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </FigurePanel>

        <FigurePanel title="Browse case: Oryza sativa network exploration" tone="blue">
          <div className="article-figure-case-panel article-figure-case-panel--browse">
            <BrowseSelectorMini />
            <BrowseResultMini />
          </div>
        </FigurePanel>

        <FigurePanel title="Search case: Oryza sativa gene-centered evidence" tone="red">
          <div className="article-figure-case-panel article-figure-case-panel--search">
            <SearchModesMini />
            <SearchResultsMini />
          </div>
        </FigurePanel>

        <FigurePanel title="Download case: Oryza sativa bundles" tone="yellow">
          <DownloadModuleMini />
        </FigurePanel>
      </div>
    </article>
  )
}
