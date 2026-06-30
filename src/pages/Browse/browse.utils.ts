import { tissuePalette } from './browse.constants'
import type {
  PaginationItem,
  SampleRecord,
  SpeciesGroup,
  SpeciesOption,
  TissueCompositionItem,
  TissueGroup,
  TissueSample,
} from './browse.types'

export function buildSampleSelectionKey(speciesLabel: string, sampleId: string) {
  return `${speciesLabel}|${sampleId}`
}

export function clampPage(page: number, totalPages: number) {
  return Math.min(Math.max(page, 1), totalPages)
}

export function normalizeNetworkThreshold(
  value: number | string,
  fallback: number,
  max = 1,
) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return fallback
  }

  if (!Number.isFinite(max)) {
    return Math.max(parsed, 0)
  }

  return Math.min(Math.max(parsed, 0), max)
}

export function normalizeNetworkLimit(value: number | string, fallback: number) {
  const parsed = Math.trunc(Number(value))

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback
  }

  return parsed
}

export function formatImportanceScore(value: string) {
  const parsed = Number(value)

  if (Number.isNaN(parsed)) {
    return value
  }

  return parsed.toFixed(4)
}

const sampleIdAccessionPatterns = [
  /(?:^|[^A-Za-z0-9])(GSE\d+)(?=$|[^A-Za-z0-9])/i,
  /(?:^|[^A-Za-z0-9])(GSM\d+)(?=$|[^A-Za-z0-9])/i,
  /(?:^|[^A-Za-z0-9])(SRR\d+)(?=$|[^A-Za-z0-9])/i,
  /(?:^|[^A-Za-z0-9])(SRX\d+)(?=$|[^A-Za-z0-9])/i,
  /(?:^|[^A-Za-z0-9])(SRP\d+)(?=$|[^A-Za-z0-9])/i,
  /(?:^|[^A-Za-z0-9])(SRS\d+)(?=$|[^A-Za-z0-9])/i,
  /(?:^|[^A-Za-z0-9])(ERR\d+)(?=$|[^A-Za-z0-9])/i,
  /(?:^|[^A-Za-z0-9])(ERX\d+)(?=$|[^A-Za-z0-9])/i,
  /(?:^|[^A-Za-z0-9])(ERP\d+)(?=$|[^A-Za-z0-9])/i,
  /(?:^|[^A-Za-z0-9])(DRR\d+)(?=$|[^A-Za-z0-9])/i,
  /(?:^|[^A-Za-z0-9])(DRX\d+)(?=$|[^A-Za-z0-9])/i,
  /(?:^|[^A-Za-z0-9])(DRP\d+)(?=$|[^A-Za-z0-9])/i,
  /(?:^|[^A-Za-z0-9])(CRR\d+)(?=$|[^A-Za-z0-9])/i,
  /(?:^|[^A-Za-z0-9])(CRX\d+)(?=$|[^A-Za-z0-9])/i,
  /(?:^|[^A-Za-z0-9])(CRA\d+)(?=$|[^A-Za-z0-9])/i,
  /(?:^|[^A-Za-z0-9])(PRJNA\d+)(?=$|[^A-Za-z0-9])/i,
  /(?:^|[^A-Za-z0-9])(PRJCA\d+)(?=$|[^A-Za-z0-9])/i,
  /(?:^|[^A-Za-z0-9])(PRJDB\d+)(?=$|[^A-Za-z0-9])/i,
  /(?:^|[^A-Za-z0-9])(CNP\d+)(?=$|[^A-Za-z0-9])/i,
  /(?:^|[^A-Za-z0-9])(CSE\d+)(?=$|[^A-Za-z0-9])/i,
]

function formatSampleTail(rawSampleId: string, accession: string) {
  const afterAccession = rawSampleId.slice(
    rawSampleId.toLowerCase().indexOf(accession.toLowerCase()) + accession.length,
  )
  const normalizedAccession = accession.toLowerCase()
  const tokens = afterAccession
    .split(/[_|\s]+/)
    .map((token) => token.trim().replace(/^\W+|\W+$/g, ''))
    .filter(
      (token) =>
        token.length > 0 &&
        token.toLowerCase() !== normalizedAccession &&
        !/^(orig|ident|orig\.ident|sample|public|atlas|matrix|integrated|revised)$/i.test(token) &&
        !/^(?:lyrata|athaliana|oleracea|rubella|sativa|bicolor)$/i.test(token),
    )

  if (tokens.length === 0) {
    return accession
  }

  const compactTokens = tokens
    .map((token) =>
      token
        .replace(/^Br4sp-/i, '')
        .replace(/^sample-/i, '')
        .replace(/^orig\.ident-/i, ''),
    )
    .filter(Boolean)
  const compactTail = compactTokens.slice(-3).join('_')

  if (compactTail.length > 0 && compactTail.length <= 28) {
    return `${accession} · ${compactTail}`
  }

  return `${accession} · ${compactTokens.slice(-2).join('_')}`
}

function formatNonAccessionSampleId(sampleId: string) {
  const withoutPrefix = sampleId.replace(/^sample[_-]public[_-]/i, '')
  const sourceMatch = withoutPrefix.match(/^(figshare\d+|CNGB|GSE\d+|SRP\d+|PRJNA\d+)/i)
  const source = sourceMatch?.[1] ?? null
  const normalizedSource = source?.toLowerCase() ?? null
  const cleaned = withoutPrefix
    .replace(/^(figshare\d+|CNGB)[_-]*/i, '')
    .replace(/[_-]orig\.?ident[_-]/gi, '_')
    .replace(/[_-]Revised[_-]/gi, '_')
    .replace(/[_-]integrated[_-]/gi, '_')
    .replace(/[_-]\d+[_-]dpi[_-]/gi, '_')
    .replace(/[_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
  const tokens = cleaned
    .split('_')
    .map((token) => token.trim())
    .filter(
      (token) =>
        token.length > 0 &&
        token.toLowerCase() !== normalizedSource &&
        !/^(WT|sample|public|control|cells|root|leaf|mixed10x)$/i.test(token),
    )
  const tail = tokens.slice(-2).join('_')

  if (source && tail) {
    return `${source} · ${tail}`
  }

  if (withoutPrefix !== sampleId) {
    return withoutPrefix
  }

  return sampleId
}

export function formatSampleDisplayId(sampleId: string) {
  const normalizedSampleId = sampleId.trim()

  for (const pattern of sampleIdAccessionPatterns) {
    const match = normalizedSampleId.match(pattern)

    if (match?.[1]) {
      return formatSampleTail(normalizedSampleId, match[1].toUpperCase())
    }
  }

  return formatNonAccessionSampleId(normalizedSampleId)
}

export function formatNetworkMetric(value: number) {
  if (!Number.isFinite(value)) {
    return '-'
  }

  return value.toFixed(4)
}

export function buildPaginationItems(
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
      ...Array.from(
        { length: visiblePageCount },
        (_, index) => totalPages - visiblePageCount + 1 + index,
      ),
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

export function buildAdjacentPages(currentPage: number, totalPages: number) {
  const pages: number[] = []

  if (currentPage > 1) {
    pages.push(currentPage - 1)
  }

  if (currentPage < totalPages) {
    pages.push(currentPage + 1)
  }

  return pages
}

export function buildSpeciesGroups(
  species: SpeciesOption[],
  records: SampleRecord[],
): SpeciesGroup[] {
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

export function buildTissueGroups(records: SampleRecord[]): TissueGroup[] {
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

export function buildTissueComposition(records: SampleRecord[]): TissueCompositionItem[] {
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

export function buildSpeciesComposition(records: SampleRecord[]): TissueCompositionItem[] {
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

export function formatCountLabel(value: number) {
  return `${value} sample${value === 1 ? '' : 's'}`
}

export function splitCenterLabel(label: string) {
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

export function formatMetadataLabel(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
) {
  const radians = ((angleInDegrees - 90) * Math.PI) / 180

  return {
    x: centerX + radius * Math.cos(radians),
    y: centerY + radius * Math.sin(radians),
  }
}

export function describeSector(
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

