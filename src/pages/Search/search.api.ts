import { toApiPath } from '@/app/base'
import { fetchJson } from '@/app/http'
import type { DataModality } from '@/pages/Browse/browse.types'
import type {
  SearchResponse,
  SearchSpeciesOption,
} from './search.types'

function appendModalityQuery(path: string, modality: DataModality, query = '') {
  const separator = query ? '&' : '?'
  return `${toApiPath(path)}${query}${separator}modality=${modality}`
}

export async function loadSearchSpeciesOptions(modality: DataModality) {
  const response = await fetchJson<{
    species: Array<{ id: string; label: string }>
  }>(appendModalityQuery('/browse/index', modality))

  return response.species.map(
    (species): SearchSpeciesOption => ({
      id: species.id,
      label: species.label,
    }),
  )
}

export async function searchSpeciesNetwork(
  modality: DataModality,
  speciesId: string,
  mode: 'tf' | 'target',
  query: string,
) {
  return fetchJson<SearchResponse>(
    appendModalityQuery(
      `/search/species/${speciesId}/network`,
      modality,
      `?mode=${mode}&query=${encodeURIComponent(query.trim())}`,
    ),
  )
}
