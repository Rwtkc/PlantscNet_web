import type { CSSProperties } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

interface SpeciesOption {
  label: string
  id: string
  sampleCount: number
}

interface SampleRecord {
  speciesLabel: string
  speciesId: string
  fileName: string
  sampleId: string
  tissue: string
  pubmedId: string
}

interface SpeciesGroup {
  speciesLabel: string
  sampleIds: string[]
}

interface TissueSample {
  speciesLabel: string
  sampleId: string
}

interface TissueGroup {
  tissue: string
  samples: TissueSample[]
}

interface TissueCompositionItem {
  label: string
  value: number
  color: string
}

interface DetailViewContent {
  eyebrow: string
  title: string
  description: string
  chartHeading: string
  chartAriaLabel: string
  chartSummary: string
  compositionItems: TissueCompositionItem[]
  tableRecords: SampleRecord[]
}

interface SampleDetailRow {
  sampleId: string
  datasetId: string
  species: string
  tissue: string
  cells: string | number
  tf: string
  target: string
  importanceScore: string
}

interface SampleDetailSummary extends SampleRecord {
  datasetId: string
  cells: string | number
}

interface SampleDetailResponse {
  sample: SampleDetailSummary
  metadata: Record<string, string | number | boolean | null>
  rows: SampleDetailRow[]
  pagination: {
    page: number
    pageSize: number
    totalRows: number
    totalPages: number
  }
}

interface SpeciesDetailCacheEntry {
  tfTargetCounts: Record<string, number | null>
  detailError: string | null
}

interface BrowseIndexResponse {
  species: SpeciesOption[]
  samples: SampleRecord[]
}

interface BrowseIndexCacheEntry {
  species: SpeciesOption[]
  samples: SampleRecord[]
  loadError: string | null
}

type BrowseMode = 'species' | 'tissue'
type PaginationItem = number | 'ellipsis-left' | 'ellipsis-right'

const tissuePalette = [
  '#2f814c',
  '#4f9964',
  '#70ab58',
  '#8db86d',
  '#5a9c83',
  '#7dac92',
  '#96bf7b',
  '#5c8f53',
  '#a3c487',
  '#89a86f',
]

let browseIndexCache: BrowseIndexCacheEntry | null = null
let browseIndexRequest: Promise<BrowseIndexCacheEntry> | null = null
const speciesDetailCacheStore: Record<string, SpeciesDetailCacheEntry> = {}
const speciesDetailRequestStore: Record<string, Promise<SpeciesDetailCacheEntry>> = {}
const sampleDetailCacheStore: Record<string, SampleDetailResponse> = {}
const sampleDetailRequestStore: Record<string, Promise<SampleDetailResponse>> = {}

function buildSampleSelectionKey(speciesLabel: string, sampleId: string) {
  return `${speciesLabel}|${sampleId}`
}

function clampPage(page: number, totalPages: number) {
  return Math.min(Math.max(page, 1), totalPages)
}

function formatImportanceScore(value: string) {
  const parsed = Number(value)

  if (Number.isNaN(parsed)) {
    return value
  }

  return parsed.toFixed(4)
}

function buildPaginationItems(
  currentPage: number,
  totalPages: number,
  visiblePageCount = 5,
): PaginationItem[] {
  if (totalPages <= visiblePageCount + 2) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (currentPage <= visiblePageCount) {
    return [
      ...Array.from({ length: visiblePageCount }, (_, index) => index + 1),
      'ellipsis-right',
      totalPages,
    ]
  }

  if (currentPage >= totalPages - visiblePageCount + 1) {
    return [
      1,
      'ellipsis-left',
      ...Array.from({ length: visiblePageCount }, (_, index) => totalPages - visiblePageCount + 1 + index),
    ]
  }

  return [
    1,
    'ellipsis-left',
    ...Array.from({ length: visiblePageCount }, (_, index) => currentPage - 2 + index),
    'ellipsis-right',
    totalPages,
  ]
}

function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  const items = buildPaginationItems(currentPage, totalPages)

  return (
    <div className="browse-table-pagination__controls">
      {items.map((item) => {
        if (typeof item !== 'number') {
          return (
            <span key={item} className="browse-table-pagination__ellipsis" aria-hidden="true">
              …
            </span>
          )
        }

        return (
          <button
            key={item}
            type="button"
            className={
              currentPage === item
                ? 'browse-table-pagination__button browse-table-pagination__button--active'
                : 'browse-table-pagination__button'
            }
            aria-current={currentPage === item ? 'page' : undefined}
            aria-label={`Page ${item}`}
            onClick={() => onPageChange(item)}
          >
            {item}
          </button>
        )
      })}
    </div>
  )
}

function SampleDetailPaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  const items = buildPaginationItems(currentPage, totalPages)
  const [pageInput, setPageInput] = useState(String(currentPage))

  useEffect(() => {
    setPageInput(String(currentPage))
  }, [currentPage])

  function submitPageJump() {
    const parsed = Number(pageInput)

    if (!Number.isFinite(parsed)) {
      setPageInput(String(currentPage))
      return
    }

    onPageChange(clampPage(Math.trunc(parsed), totalPages))
  }

  return (
    <div className="browse-table-pagination__controls">
      <div className="browse-table-pagination__buttons">
        {items.map((item) => {
          if (typeof item !== 'number') {
            return (
              <span key={item} className="browse-table-pagination__ellipsis" aria-hidden="true">
                …
              </span>
            )
          }

          return (
            <button
              key={item}
              type="button"
              className={
                currentPage === item
                  ? 'browse-table-pagination__button browse-table-pagination__button--active'
                  : 'browse-table-pagination__button'
              }
              aria-current={currentPage === item ? 'page' : undefined}
              aria-label={`Page ${item}`}
              onClick={() => onPageChange(item)}
            >
              {item}
            </button>
          )
        })}
      </div>
      <div className="browse-table-pagination__jump">
        <label className="browse-table-pagination__jump-label" htmlFor="browse-sample-page-jump">
          Page
        </label>
        <input
          id="browse-sample-page-jump"
          type="number"
          min={1}
          max={totalPages}
          inputMode="numeric"
          className="browse-table-pagination__jump-input"
          value={pageInput}
          onChange={(event) => {
            setPageInput(event.target.value)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              submitPageJump()
            }
          }}
        />
        <button
          type="button"
          className="browse-table-pagination__jump-button"
          onClick={submitPageJump}
        >
          Go
        </button>
      </div>
    </div>
  )
}

async function fetchJson<T>(input: string): Promise<T> {
  const response = await fetch(input)

  if (!response.ok) {
    throw new Error(`Request failed for ${input}`)
  }

  return (await response.json()) as T
}

function buildSpeciesGroups(species: SpeciesOption[], records: SampleRecord[]): SpeciesGroup[] {
  const grouped = new Map<string, string[]>()

  records.forEach((record) => {
    const existing = grouped.get(record.speciesLabel) ?? []
    existing.push(record.sampleId)
    grouped.set(record.speciesLabel, existing)
  })

  return species.map((species) => ({
    speciesLabel: species.label,
    sampleIds: grouped.get(species.label) ?? [],
  }))
}

function buildTissueGroups(records: SampleRecord[]): TissueGroup[] {
  const grouped = new Map<string, TissueSample[]>()

  records.forEach((record) => {
    const existing = grouped.get(record.tissue) ?? []
    existing.push({
      speciesLabel: record.speciesLabel,
      sampleId: record.sampleId,
    })
    grouped.set(record.tissue, existing)
  })

  return Array.from(grouped.entries())
    .map(([tissue, samples]) => ({
      tissue,
      samples: samples.sort((a, b) =>
        a.speciesLabel === b.speciesLabel
          ? a.sampleId.localeCompare(b.sampleId)
          : a.speciesLabel.localeCompare(b.speciesLabel),
      ),
    }))
    .sort((a, b) => a.tissue.localeCompare(b.tissue))
}

function buildTissueComposition(records: SampleRecord[]): TissueCompositionItem[] {
  const grouped = new Map<string, number>()

  records.forEach((record) => {
    grouped.set(record.tissue, (grouped.get(record.tissue) ?? 0) + 1)
  })

  return Array.from(grouped.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label, value], index) => ({
      label,
      value,
      color: tissuePalette[index % tissuePalette.length],
    }))
}

function buildSpeciesComposition(records: SampleRecord[]): TissueCompositionItem[] {
  const grouped = new Map<string, number>()

  records.forEach((record) => {
    grouped.set(record.speciesLabel, (grouped.get(record.speciesLabel) ?? 0) + 1)
  })

  return Array.from(grouped.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label, value], index) => ({
      label,
      value,
      color: tissuePalette[index % tissuePalette.length],
    }))
}

async function loadSpeciesDetails(species: SpeciesOption): Promise<SpeciesDetailCacheEntry> {
  try {
    return {
      tfTargetCounts: await fetchJson<Record<string, number | null>>(
        `/api/browse/species/${species.id}/tf-target-counts`,
      ),
      detailError: null,
    }
  } catch {
    return {
      tfTargetCounts: {},
      detailError: 'Species-level overview data could not be loaded from the selected directory.',
    }
  }
}

async function loadSampleDetail(
  speciesId: string,
  sampleId: string,
  page: number,
  pageSize: number,
): Promise<SampleDetailResponse> {
  return fetchJson<SampleDetailResponse>(
    `/api/browse/species/${speciesId}/samples/${encodeURIComponent(sampleId)}?page=${page}&pageSize=${pageSize}`,
  )
}

async function loadBrowseIndex(): Promise<BrowseIndexCacheEntry> {
  try {
    const response = await fetchJson<BrowseIndexResponse>('/api/browse/index')

    return {
      species: response.species,
      samples: response.samples,
      loadError: null,
    }
  } catch {
    return {
      species: [],
      samples: [],
      loadError: 'Sample information could not be loaded from the browse API.',
    }
  }
}

export function __resetBrowsePageCacheForTests() {
  browseIndexCache = null
  browseIndexRequest = null

  for (const key of Object.keys(speciesDetailCacheStore)) {
    delete speciesDetailCacheStore[key]
  }

  for (const key of Object.keys(speciesDetailRequestStore)) {
    delete speciesDetailRequestStore[key]
  }

  for (const key of Object.keys(sampleDetailCacheStore)) {
    delete sampleDetailCacheStore[key]
  }

  for (const key of Object.keys(sampleDetailRequestStore)) {
    delete sampleDetailRequestStore[key]
  }
}

function formatCountLabel(value: number) {
  return `${value} sample${value === 1 ? '' : 's'}`
}

function splitCenterLabel(label: string) {
  const normalized = label.trim().replace(/\s+/g, ' ')

  if (normalized === 'samples') {
    return [normalized]
  }

  const words = normalized.split(' ')

  if (words.length <= 2 && normalized.length <= 14) {
    return [normalized]
  }

  const lines: string[] = []
  let currentLine = ''

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word

    if (nextLine.length <= 11 || currentLine.length === 0) {
      currentLine = nextLine
      return
    }

    lines.push(currentLine)
    currentLine = word
  })

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

function formatMetadataLabel(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const radians = ((angleInDegrees - 90) * Math.PI) / 180

  return {
    x: centerX + radius * Math.cos(radians),
    y: centerY + radius * Math.sin(radians),
  }
}

function describeSector(
  centerX: number,
  centerY: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
) {
  const outerStart = polarToCartesian(centerX, centerY, outerRadius, startAngle)
  const outerEnd = polarToCartesian(centerX, centerY, outerRadius, endAngle)
  const innerStart = polarToCartesian(centerX, centerY, innerRadius, startAngle)
  const innerEnd = polarToCartesian(centerX, centerY, innerRadius, endAngle)
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ')
}

function TissueCompositionChart({
  items,
  heading,
  ariaLabel,
  summary,
}: {
  items: TissueCompositionItem[]
  heading: string
  ariaLabel: string
  summary: string
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const outerRadius = 80
  const innerRadius = 43

  const segments = useMemo(() => {
    let current = 0

    return items.map((item) => {
      const startAngle = total === 0 ? 0 : (current / total) * 360
      current += item.value
      const endAngle = total === 0 ? 0 : (current / total) * 360
      const sweep = Math.max(endAngle - startAngle, 0.001)

      return {
        ...item,
        startAngle,
        endAngle,
        sweep,
        midAngle: startAngle + sweep / 2,
      }
    })
  }, [items, total])

  const activeItem = activeIndex === null ? null : segments[activeIndex]
  const centerLabel = activeItem ? activeItem.label : 'samples'
  const centerLabelLines = splitCenterLabel(centerLabel)
  const centerLabelIsLong = centerLabelLines.length >= 3 || centerLabel.length >= 16

  return (
    <div className="browse-panel browse-panel--chart">
      <div className="browse-panel__header">
        <h2>{heading}</h2>
        <p>{summary || `${total} total samples`}</p>
      </div>

      <div className="browse-pie-layout">
        <div className="browse-pie-chart" aria-label={ariaLabel}>
          <svg className="browse-pie-chart__svg" viewBox="0 0 180 180">
            <g>
              {segments.map((item, index) => {
                const isActive = activeIndex === index
                const shiftDistance = isActive ? 6 : 0
                const shiftRadians = ((item.midAngle - 90) * Math.PI) / 180
                const shiftX = Math.cos(shiftRadians) * shiftDistance
                const shiftY = Math.sin(shiftRadians) * shiftDistance
                const isFullDonut = segments.length === 1

                const commonProps = {
                  className: isActive
                    ? 'browse-pie-sector browse-pie-sector--active'
                    : 'browse-pie-sector',
                  role: 'button' as const,
                  tabIndex: 0,
                  'aria-label': `${item.label}: ${formatCountLabel(item.value)}`,
                  style: {
                    '--sector-shift-x': `${shiftX}px`,
                    '--sector-shift-y': `${shiftY}px`,
                  } as CSSProperties,
                  onMouseEnter: () => setActiveIndex(index),
                  onMouseLeave: () => setActiveIndex(null),
                  onFocus: () => setActiveIndex(index),
                  onBlur: () => setActiveIndex(null),
                }

                if (isFullDonut) {
                  return (
                    <circle
                      key={item.label}
                      {...commonProps}
                      cx={90}
                      cy={90}
                      r={(outerRadius + innerRadius) / 2}
                      fill="none"
                      style={
                        {
                          ...commonProps.style,
                          stroke: item.color,
                          strokeWidth: `${outerRadius - innerRadius}px`,
                        } as CSSProperties
                      }
                      strokeWidth={outerRadius - innerRadius}
                    />
                  )
                }

                return (
                  <path
                    key={item.label}
                    {...commonProps}
                    d={describeSector(
                      90,
                      90,
                      outerRadius,
                      innerRadius,
                      item.startAngle,
                      item.endAngle,
                    )}
                    fill={item.color}
                  />
                )
              })}
            </g>
          </svg>

          <div
            className={
              centerLabelIsLong
                ? 'browse-pie-chart__center-text browse-pie-chart__center-text--long'
                : 'browse-pie-chart__center-text'
            }
          >
            <strong>{activeItem ? activeItem.value : total}</strong>
            <span aria-label={centerLabel}>
              {centerLabelLines.map((line) => (
                <span key={line} className="browse-pie-chart__center-line">
                  {line}
                </span>
              ))}
            </span>
          </div>
        </div>

        <ul className="browse-pie-legend">
          {segments.map((item, index) => (
            <li key={item.label}>
              <button
                type="button"
                className={
                  activeIndex === index
                    ? 'browse-pie-legend__button browse-pie-legend__button--active'
                    : 'browse-pie-legend__button'
                }
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                onFocus={() => setActiveIndex(index)}
                onBlur={() => setActiveIndex(null)}
              >
                <span
                  className="browse-pie-legend__swatch"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                <span className="browse-pie-legend__label">{item.label}</span>
                <span className="browse-pie-legend__value">{formatCountLabel(item.value)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function SampleMetadataTable({
  records,
  tfTargetCounts,
}: {
  records: SampleRecord[]
  tfTargetCounts: Record<string, number | null>
}) {
  const pageSize = 10
  const [page, setPage] = useState(1)
  const totalPages = Math.max(Math.ceil(records.length / pageSize), 1)

  useEffect(() => {
    setPage(1)
  }, [records])

  const pageStart = (page - 1) * pageSize
  const visibleRecords = records.slice(pageStart, pageStart + pageSize)

  return (
    <div className="browse-panel">
      <div className="browse-panel__header">
        <h2>Sample table</h2>
      </div>

      <div className="browse-table-wrap">
        <table className="browse-metadata-table">
          <thead>
            <tr>
              <th scope="col">Species</th>
              <th scope="col">NCBI ID</th>
              <th scope="col">Tissues</th>
              <th scope="col">Data Type</th>
              <th scope="col">TF-target number</th>
              <th scope="col">Pubmed ID</th>
            </tr>
          </thead>
          <tbody>
            {visibleRecords.map((record) => (
              <tr key={`${record.speciesLabel}-${record.sampleId}`}>
                <td>{record.speciesLabel}</td>
                <td>{record.sampleId}</td>
                <td>{record.tissue}</td>
                <td>scRNA-seq</td>
                <td>{tfTargetCounts[record.fileName] ?? '-'}</td>
                <td>{record.pubmedId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="browse-table-pagination" aria-label="Sample metadata pagination">
          <p className="browse-table-pagination__summary">
            Showing {pageStart + 1}-{Math.min(pageStart + pageSize, records.length)} of {records.length}
          </p>
          <PaginationControls currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      ) : null}
    </div>
  )
}

function SampleOverviewPanel({ sample, metadata }: SampleDetailResponse) {
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

function SampleTfTargetTable({
  rows,
  pagination,
  isLoading,
  onPageChange,
}: {
  rows: SampleDetailRow[]
  pagination: SampleDetailResponse['pagination']
  isLoading: boolean
  onPageChange: (page: number) => void
}) {
  const pageStart = (pagination.page - 1) * pagination.pageSize
  return (
    <div className="browse-panel">
      <div className="browse-panel__header">
        <h2>TF-target table</h2>
      </div>

      <div className="browse-table-wrap browse-table-wrap--loading-shell">
        <table className="browse-metadata-table browse-metadata-table--sample-detail">
          <thead>
            <tr>
              <th scope="col">Sample ID</th>
              <th scope="col">Species</th>
              <th scope="col">Tissue</th>
              <th scope="col">Cells</th>
              <th scope="col">TF</th>
              <th scope="col">Target</th>
              <th scope="col">Importance Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.sampleId}-${row.tf}-${row.target}-${index}`}>
                <td>{row.sampleId}</td>
                <td>{row.species}</td>
                <td>{row.tissue}</td>
                <td>{row.cells}</td>
                <td>{row.tf}</td>
                <td>{row.target}</td>
                <td>{formatImportanceScore(row.importanceScore)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading ? (
          <div className="browse-table-wrap__loading" aria-label="Loading next TF-target page" aria-live="polite">
            <span className="browse-table-wrap__spinner" aria-hidden="true" />
          </div>
        ) : null}
      </div>

      {pagination.totalPages > 1 ? (
        <div className="browse-table-pagination" aria-label="TF-target table pagination">
          <p className="browse-table-pagination__summary">
            Showing {pageStart + 1}-{Math.min(pageStart + pagination.pageSize, pagination.totalRows)} of{' '}
            {pagination.totalRows}
          </p>
          <div className="browse-table-pagination__cluster">
            <SampleDetailPaginationControls
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={onPageChange}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function BrowsePage() {
  const sampleDetailPageSize = 10
  const [browseMode, setBrowseMode] = useState<BrowseMode>('species')
  const [speciesOptions, setSpeciesOptions] = useState<SpeciesOption[]>(browseIndexCache?.species ?? [])
  const [sampleRecords, setSampleRecords] = useState<SampleRecord[]>(browseIndexCache?.samples ?? [])
  const [expandedSpecies, setExpandedSpecies] = useState<string | null>(null)
  const [expandedTissue, setExpandedTissue] = useState<string | null>(null)
  const [selectedSampleKey, setSelectedSampleKey] = useState<string | null>(null)
  const [tfTargetCounts, setTfTargetCounts] = useState<Record<string, number | null>>({})
  const [isLoading, setIsLoading] = useState(browseIndexCache === null)
  const [loadError, setLoadError] = useState<string | null>(browseIndexCache?.loadError ?? null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [sampleDetail, setSampleDetail] = useState<SampleDetailResponse | null>(null)
  const [sampleDetailError, setSampleDetailError] = useState<string | null>(null)
  const [isLoadingSampleDetail, setIsLoadingSampleDetail] = useState(false)
  const [sampleDetailPage, setSampleDetailPage] = useState(1)
  const speciesDetailCacheRef = useRef<Record<string, SpeciesDetailCacheEntry>>(speciesDetailCacheStore)
  const speciesDetailRequestRef = useRef<Record<string, Promise<SpeciesDetailCacheEntry>>>(
    speciesDetailRequestStore,
  )
  const sampleDetailCacheRef = useRef<Record<string, SampleDetailResponse>>(sampleDetailCacheStore)
  const sampleDetailRequestRef = useRef<Record<string, Promise<SampleDetailResponse>>>(
    sampleDetailRequestStore,
  )

  useEffect(() => {
    let isCancelled = false

    async function loadAllSamples() {
      if (browseIndexCache) {
        setSpeciesOptions(browseIndexCache.species)
        setSampleRecords(browseIndexCache.samples)
        setLoadError(browseIndexCache.loadError)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setLoadError(null)

      const request = browseIndexRequest ?? loadBrowseIndex()

      if (!browseIndexRequest) {
        browseIndexRequest = request
      }

      const entry = await request
      browseIndexCache = entry

      if (browseIndexRequest === request) {
        browseIndexRequest = null
      }

      if (!isCancelled) {
        setSpeciesOptions(entry.species)
        setSampleRecords(entry.samples)
        setLoadError(entry.loadError)
        setIsLoading(false)
      }
    }

    loadAllSamples()

    return () => {
      isCancelled = true
    }
  }, [])

  const speciesGroups = useMemo(
    () => buildSpeciesGroups(speciesOptions, sampleRecords),
    [sampleRecords, speciesOptions],
  )
  const tissueGroups = useMemo(() => buildTissueGroups(sampleRecords), [sampleRecords])

  const activeSpecies =
    browseMode === 'species'
      ? speciesOptions.find((species) => species.label === expandedSpecies) ?? null
      : null
  const activeTissue = browseMode === 'tissue' ? expandedTissue : null
  const activeSample = useMemo(
    () =>
      selectedSampleKey
        ? sampleRecords.find(
            (record) =>
              buildSampleSelectionKey(record.speciesLabel, record.sampleId) === selectedSampleKey,
          ) ?? null
        : null,
    [sampleRecords, selectedSampleKey],
  )

  useEffect(() => {
    setSampleDetailPage(1)
  }, [activeSample?.speciesId, activeSample?.sampleId])

  const activeSpeciesRecords = useMemo(
    () =>
      activeSpecies
        ? sampleRecords.filter((record) => record.speciesLabel === activeSpecies.label)
        : [],
    [activeSpecies, sampleRecords],
  )

  const tissueComposition = useMemo(
    () => buildTissueComposition(activeSpeciesRecords),
    [activeSpeciesRecords],
  )
  const activeTissueRecords = useMemo(
    () => (activeTissue ? sampleRecords.filter((record) => record.tissue === activeTissue) : []),
    [activeTissue, sampleRecords],
  )
  const tissueSpeciesComposition = useMemo(
    () => buildSpeciesComposition(activeTissueRecords),
    [activeTissueRecords],
  )
  const detailView = useMemo<DetailViewContent | null>(() => {
    if (activeSpecies) {
      return {
        eyebrow: 'Species overview',
        title: activeSpecies.label,
        description:
          'Browse the tissue composition and sample-level metadata for the selected PlantscNet species.',
        chartHeading: 'Tissue composition',
        chartAriaLabel: 'Species tissue composition',
        chartSummary: `${activeSpeciesRecords.length} total samples`,
        compositionItems: tissueComposition,
        tableRecords: activeSpeciesRecords,
      }
    }

    if (activeTissue) {
      return {
        eyebrow: 'Tissue overview',
        title: activeTissue,
        description:
          'Browse species coverage and sample-level metadata for the selected PlantscNet tissue.',
        chartHeading: 'Species composition',
        chartAriaLabel: 'Tissue species composition',
        chartSummary: `${activeTissueRecords.length} total samples`,
        compositionItems: tissueSpeciesComposition,
        tableRecords: activeTissueRecords,
      }
    }

    return null
  }, [
    activeSpecies,
    activeSpeciesRecords,
    activeTissue,
    activeTissueRecords,
    tissueComposition,
    tissueSpeciesComposition,
  ])
  const detailSpeciesIds = useMemo(
    () => Array.from(new Set(detailView?.tableRecords.map((record) => record.speciesId) ?? [])),
    [detailView],
  )

  useEffect(() => {
    let isCancelled = false

    async function syncSpeciesDetails() {
      if (detailSpeciesIds.length === 0) {
        setTfTargetCounts({})
        setDetailError(null)
        return
      }

      const cachedEntries = detailSpeciesIds
        .map((speciesId) => speciesDetailCacheRef.current[speciesId])
        .filter((entry): entry is SpeciesDetailCacheEntry => Boolean(entry))

      setTfTargetCounts(
        Object.assign({}, ...cachedEntries.map((entry) => entry.tfTargetCounts)),
      )
      setDetailError(cachedEntries.find((entry) => entry.detailError)?.detailError ?? null)

      if (detailSpeciesIds.every((speciesId) => Boolean(speciesDetailCacheRef.current[speciesId]))) {
        return
      }

      setDetailError(null)

      const detailResults = await Promise.all(
        detailSpeciesIds.map(async (speciesId) => {
          const cachedEntry = speciesDetailCacheRef.current[speciesId]
          if (cachedEntry) {
            return [speciesId, cachedEntry] as const
          }

          const species = speciesOptions.find((option) => option.id === speciesId)
          if (!species) {
            return [
              speciesId,
              {
                tfTargetCounts: {},
                detailError: 'Species-level overview data could not be loaded from the selected directory.',
              } satisfies SpeciesDetailCacheEntry,
            ] as const
          }

          const existingRequest = speciesDetailRequestRef.current[speciesId]
          const detailRequest = existingRequest ?? loadSpeciesDetails(species)

          if (!existingRequest) {
            speciesDetailRequestRef.current[speciesId] = detailRequest
          }

          const entry = await detailRequest

          speciesDetailCacheRef.current[speciesId] = entry
          if (speciesDetailRequestRef.current[speciesId] === detailRequest) {
            delete speciesDetailRequestRef.current[speciesId]
          }

          return [speciesId, entry] as const
        }),
      )

      if (!isCancelled) {
        setTfTargetCounts(
          Object.assign({}, ...detailResults.map(([, entry]) => entry.tfTargetCounts)),
        )
        setDetailError(detailResults.find(([, entry]) => entry.detailError)?.[1].detailError ?? null)
      }
    }

    syncSpeciesDetails()

    return () => {
      isCancelled = true
    }
  }, [detailSpeciesIds, speciesOptions])

  useEffect(() => {
    let isCancelled = false

    async function syncSampleDetail() {
      if (!activeSample) {
        setSampleDetail(null)
        setSampleDetailError(null)
        setIsLoadingSampleDetail(false)
        return
      }

      const cacheKey = `${activeSample.speciesId}|${activeSample.sampleId}|${sampleDetailPage}|${sampleDetailPageSize}`
      const cachedEntry = sampleDetailCacheRef.current[cacheKey]
      const isCurrentSampleDetail =
        sampleDetail?.sample.speciesId === activeSample.speciesId &&
        sampleDetail.sample.sampleId === activeSample.sampleId

      if (cachedEntry) {
        setSampleDetail(cachedEntry)
        setSampleDetailError(null)
        setIsLoadingSampleDetail(false)
        return
      }

      setIsLoadingSampleDetail(true)
      setSampleDetailError(null)
      if (!isCurrentSampleDetail) {
        setSampleDetail(null)
      }

      const existingRequest = sampleDetailRequestRef.current[cacheKey]
      const detailRequest =
        existingRequest ??
        loadSampleDetail(
          activeSample.speciesId,
          activeSample.sampleId,
          sampleDetailPage,
          sampleDetailPageSize,
        )

      if (!existingRequest) {
        sampleDetailRequestRef.current[cacheKey] = detailRequest
      }

      try {
        const entry = await detailRequest
        sampleDetailCacheRef.current[cacheKey] = entry

        if (sampleDetailRequestRef.current[cacheKey] === detailRequest) {
          delete sampleDetailRequestRef.current[cacheKey]
        }

        if (!isCancelled) {
          setSampleDetail(entry)
          setSampleDetailError(null)
          setIsLoadingSampleDetail(false)
        }
      } catch {
        if (sampleDetailRequestRef.current[cacheKey] === detailRequest) {
          delete sampleDetailRequestRef.current[cacheKey]
        }

        if (!isCancelled) {
          setSampleDetail(null)
          setSampleDetailError(
            'Sample-level metadata could not be loaded from the selected directory.',
          )
          setIsLoadingSampleDetail(false)
        }
      }
    }

    syncSampleDetail()

    return () => {
      isCancelled = true
    }
  }, [activeSample, sampleDetailPage, sampleDetailPageSize])

  return (
    <article className="browse-page fade-rise">
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
                  setBrowseMode('species')
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
                  setBrowseMode('tissue')
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

                  return (
                    <li key={group.speciesLabel} className="browse-node-item">
                      <button
                        type="button"
                        className={
                          isExpanded
                            ? 'browse-node-button browse-node-button--active'
                            : 'browse-node-button'
                        }
                        onClick={() => {
                          setExpandedSpecies((current) =>
                            current === group.speciesLabel ? null : group.speciesLabel,
                          )
                        }}
                        aria-expanded={isExpanded}
                      >
                        <span>{group.speciesLabel}</span>
                        <span>{group.sampleIds.length}</span>
                      </button>

                      {isExpanded ? (
                        <ul
                          className="browse-sample-list"
                          aria-label={`${group.speciesLabel} sample ids`}
                        >
                          {group.sampleIds.map((sampleId) => (
                            <li key={sampleId} className="browse-sample-item">
                              <button
                                type="button"
                                className={
                                  selectedSampleKey ===
                                  buildSampleSelectionKey(group.speciesLabel, sampleId)
                                    ? 'browse-sample-button browse-sample-button--active'
                                    : 'browse-sample-button'
                                }
                                aria-pressed={
                                  selectedSampleKey ===
                                  buildSampleSelectionKey(group.speciesLabel, sampleId)
                                }
                                onClick={() => {
                                  const sampleKey = buildSampleSelectionKey(
                                    group.speciesLabel,
                                    sampleId,
                                  )

                                  setSelectedSampleKey((current) =>
                                    current === sampleKey ? null : sampleKey,
                                  )
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
                          setExpandedTissue((current) =>
                            current === group.tissue ? null : group.tissue,
                          )
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
                                  const sampleKey = buildSampleSelectionKey(
                                    sample.speciesLabel,
                                    sample.sampleId,
                                  )

                                  setSelectedSampleKey((current) =>
                                    current === sampleKey ? null : sampleKey,
                                  )
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

      <section className="browse-page__main" aria-label="Browse D3 main stage">
        {activeSample ? (
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
                  onPageChange={setSampleDetailPage}
                />
              </>
            ) : null}

            {sampleDetailError ? (
              <div className="browse-panel browse-panel--status">
                <p className="browse-status browse-status--error">{sampleDetailError}</p>
              </div>
            ) : null}
          </div>
        ) : !detailView ? (
          <div className="browse-main__placeholder" role="img" aria-label="D3 stage placeholder" />
        ) : (
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
            {detailError ? (
              <div className="browse-panel browse-panel--status">
                <p className="browse-status browse-status--error">{detailError}</p>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </article>
  )
}
