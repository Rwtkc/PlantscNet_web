import { toApiPath } from '@/app/base'
import { fetchJson } from '@/app/http'
import type {
  SearchExampleResponse,
  SearchResponse,
  SearchSpeciesOption,
} from './search.types'

export async function loadSearchSpeciesOptions() {
  const response = await fetchJson<{
    species: Array<{ id: string; label: string }>
  }>(toApiPath('/browse/index'))

  return response.species.map(
    (species): SearchSpeciesOption => ({
      id: species.id,
      label: species.label,
    }),
  )
}

export async function searchSpeciesNetwork(
  speciesId: string,
  mode: 'tf' | 'target',
  query: string,
) {
  return fetchJson<SearchResponse>(
    `${toApiPath(`/search/species/${speciesId}/network`)}?mode=${mode}&query=${encodeURIComponent(query.trim())}`,
  )
}

export async function loadSearchExample(
  mode: 'tf' | 'target',
  speciesId?: string,
) {
  const speciesQuery = speciesId ? `&speciesId=${encodeURIComponent(speciesId)}` : ''

  return fetchJson<SearchExampleResponse>(
    `${toApiPath('/search/example')}?mode=${mode}${speciesQuery}`,
  )
}
