import type { DataModality } from '@/pages/Browse/browse.types'

export interface SearchSpeciesOption {
  id: string
  label: string
}

export type SearchMode = 'tf' | 'target'

export interface SearchIntegratedMatch {
  tf: string
  target: string
  probability: number
}

export interface SearchSampleMatch {
  sampleId: string
  tissue: string
  tf: string
  target: string
  importanceScore: string
}

export interface SearchResponse {
  speciesId: string
  speciesLabel: string
  modality?: DataModality
  mode: SearchMode
  query: string
  integratedNetworkAvailable: boolean
  integratedMatches: SearchIntegratedMatch[]
  sampleMatches: SearchSampleMatch[]
  summary: {
    integratedMatchCount: number
    sampleMatchCount: number
  }
}
