export interface SpeciesOption {
  label: string
  id: string
  sampleCount: number
}

export interface SampleRecord {
  speciesLabel: string
  speciesId: string
  fileName: string
  sampleId: string
  tissue: string
  pubmedId: string
}

export interface SpeciesGroup {
  speciesLabel: string
  sampleIds: string[]
}

export interface TissueSample {
  speciesLabel: string
  sampleId: string
}

export interface TissueGroup {
  tissue: string
  samples: TissueSample[]
}

export interface TissueCompositionItem {
  label: string
  value: number
  color: string
}

export interface DetailViewContent {
  eyebrow: string
  title: string
  description: string
  chartHeading: string
  chartAriaLabel: string
  chartSummary: string
  compositionItems: TissueCompositionItem[]
  tableRecords: SampleRecord[]
}

export interface SampleDetailRow {
  sampleId: string
  datasetId: string
  species: string
  tissue: string
  cells: string | number
  tf: string
  target: string
  importanceScore: string
}

export interface SampleDetailSummary extends SampleRecord {
  datasetId: string
  cells: string | number
}

export interface SampleDetailResponse {
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

export interface SpeciesDetailCacheEntry {
  tfTargetCounts: Record<string, number | null>
  detailError: string | null
}

export interface BrowseIndexResponse {
  species: SpeciesOption[]
  samples: SampleRecord[]
}

export interface BrowseIndexCacheEntry {
  species: SpeciesOption[]
  samples: SampleRecord[]
  loadError: string | null
}

export interface SpeciesNetworkPreviewNode {
  id: string
  type: 'tf' | 'target'
  x?: number
  y?: number
  vx?: number
  vy?: number
  fx?: number | null
  fy?: number | null
}

export interface SpeciesNetworkPreviewLink {
  source: string | SpeciesNetworkPreviewNode
  target: string | SpeciesNetworkPreviewNode
  probability: number
}

export interface SpeciesNetworkPreviewResponse {
  speciesId: string
  speciesLabel: string
  sampleId?: string | null
  limit: number
  threshold: number
  recommendedThreshold?: number
  tfFilter: string | null
  sourceKind?: 'species-preview' | 'single-sample'
  totalAvailableLinks: number
  totalNodes: number
  totalLinks: number
  nodes: SpeciesNetworkPreviewNode[]
  links: SpeciesNetworkPreviewLink[]
}

export interface SpeciesNetworkRelationRow {
  tf: string
  target: string
  probability: number
}

export interface SpeciesNetworkRelationsResponse {
  speciesId: string
  speciesLabel: string
  threshold: number
  tfFilter: string | null
  sourceKind?: 'species-preview' | 'single-sample'
  pagination: {
    page: number
    pageSize: number
    totalRows: number
    totalPages: number
  }
  rows: SpeciesNetworkRelationRow[]
}

export type BrowseMode = 'species' | 'tissue'
export type PaginationItem = number | 'ellipsis-left' | 'ellipsis-right'
