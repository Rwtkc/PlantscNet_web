import type { DataModality } from '@/pages/Browse/browse.types'

export type GenePriorityTool = 'gba' | 'context'
export type NetworkSource = 'integrated' | 'sample'

export interface ToolNetworkSample {
  sampleId: string
  tissue: string
  fileName: string
}

export interface ToolNetworkSpecies {
  speciesId: string
  speciesLabel: string
  sampleCount: number
  integratedAvailable: boolean
  samples: ToolNetworkSample[]
}

export interface ToolNetworkIndex {
  modality: DataModality
  species: ToolNetworkSpecies[]
}

export interface GbaPriorityRow {
  rank: number
  gene: string
  score: number
  connectedGuideGenes: number
  validGuideGenes: number
}

export interface ContextHubRow {
  rank: number
  gene: string
  pValue: string
  isDeg: boolean
  linksToHub: number
  linksInDeg: number
}

export interface GenePriorityJobResult {
  tool: GenePriorityTool
  queryGeneCount: number
  totalNetworkGenes: number
  totalNetworkEdges: number
  validGuideGeneCount?: number
  validDegGeneCount?: number
  auc?: number
  pValue?: string
  coreRows?: GbaPriorityRow[]
  candidateRows?: GbaPriorityRow[]
  allCandidateCount?: number
  hubRows?: ContextHubRow[]
}

export interface GenePriorityJob {
  jobId: string
  tool: GenePriorityTool
  status: 'queued' | 'running' | 'complete' | 'failed'
  createdAt: string
  completedAt: string | null
  error: string | null
  network: {
    modality: DataModality
    speciesId: string
    speciesLabel: string
    source: NetworkSource
    sampleId: string | null
    label: string
    tissue: string | null
  }
  result: GenePriorityJobResult | null
}

export interface CreateGenePriorityJobPayload {
  modality: DataModality
  speciesId: string
  source: NetworkSource
  sampleId?: string
  genes: string
}
