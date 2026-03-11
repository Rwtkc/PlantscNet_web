import type {
  SearchExampleResponse,
  SearchResponse,
  SearchSpeciesOption,
} from './search.types'

async function fetchJson<T>(input: string): Promise<T> {
  const response = await fetch(input)

  if (!response.ok) {
    throw new Error(`Request failed for ${input}`)
  }

  return (await response.json()) as T
}

export async function loadSearchSpeciesOptions() {
  const response = await fetchJson<{
    species: Array<{ id: string; label: string }>
  }>('/api/browse/index')

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
    `/api/search/species/${speciesId}/network?mode=${mode}&query=${encodeURIComponent(query.trim())}`,
  )
}

export async function loadSearchExample(
  mode: 'tf' | 'target',
  speciesId?: string,
) {
  const speciesQuery = speciesId ? `&speciesId=${encodeURIComponent(speciesId)}` : ''

  return fetchJson<SearchExampleResponse>(
    `/api/search/example?mode=${mode}${speciesQuery}`,
  )
}
