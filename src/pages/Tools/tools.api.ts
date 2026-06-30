import { toApiPath } from '@/app/base'
import { fetchJson } from '@/app/http'
import type { DataModality } from '@/pages/Browse/browse.types'
import type {
  CreateGenePriorityJobPayload,
  GenePriorityJob,
  GenePriorityTool,
  ToolNetworkIndex,
} from './tools.types'

export function fetchToolNetworkIndex(modality: DataModality, signal?: AbortSignal) {
  return fetchJson<ToolNetworkIndex>(toApiPath(`/tools/networks?modality=${modality}`), {
    signal,
    errorMessage: 'Failed to load PlantScNet network sources.',
    parseErrorMessage: true,
  })
}

export function createGenePriorityJob(
  tool: GenePriorityTool,
  payload: CreateGenePriorityJobPayload,
) {
  return fetchJson<GenePriorityJob>(toApiPath(`/tools/${tool}/jobs`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    errorMessage: 'Failed to start the gene prioritization job.',
    parseErrorMessage: true,
  })
}

export function fetchGenePriorityJob(jobId: string, signal?: AbortSignal) {
  return fetchJson<GenePriorityJob>(toApiPath(`/tools/jobs/${jobId}`), {
    signal,
    errorMessage: 'Failed to load the gene prioritization job.',
    parseErrorMessage: true,
  })
}
