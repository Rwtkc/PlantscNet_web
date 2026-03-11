import type {
  BrowseIndexCacheEntry,
  BrowseIndexResponse,
  SampleDetailResponse,
  SpeciesDetailCacheEntry,
  SpeciesNetworkRelationsResponse,
  SpeciesNetworkPreviewResponse,
  SpeciesOption,
} from './browse.types'

export const browsePageCache = {
  browseIndexCache: null as BrowseIndexCacheEntry | null,
  browseIndexRequest: null as Promise<BrowseIndexCacheEntry> | null,
  speciesDetailCacheStore: {} as Record<string, SpeciesDetailCacheEntry>,
  speciesDetailRequestStore: {} as Record<string, Promise<SpeciesDetailCacheEntry>>,
  sampleDetailCacheStore: {} as Record<string, SampleDetailResponse>,
  sampleDetailRequestStore: {} as Record<string, Promise<SampleDetailResponse>>,
  speciesNetworkPreviewCacheStore: {} as Record<string, SpeciesNetworkPreviewResponse>,
  speciesNetworkPreviewRequestStore: {} as Record<
    string,
    Promise<SpeciesNetworkPreviewResponse>
  >,
  sampleNetworkPreviewCacheStore: {} as Record<string, SpeciesNetworkPreviewResponse>,
  sampleNetworkPreviewRequestStore: {} as Record<
    string,
    Promise<SpeciesNetworkPreviewResponse>
  >,
  speciesNetworkRelationsCacheStore: {} as Record<string, SpeciesNetworkRelationsResponse>,
  speciesNetworkRelationsRequestStore: {} as Record<
    string,
    Promise<SpeciesNetworkRelationsResponse>
  >,
}

async function fetchJson<T>(input: string): Promise<T> {
  const response = await fetch(input)

  if (!response.ok) {
    throw new Error(`Request failed for ${input}`)
  }

  return (await response.json()) as T
}

async function loadCachedResource<T>(
  cacheStore: Record<string, T>,
  requestStore: Record<string, Promise<T>>,
  cacheKey: string,
  loader: () => Promise<T>,
) {
  const cachedEntry = cacheStore[cacheKey]
  if (cachedEntry) {
    return cachedEntry
  }

  const existingRequest = requestStore[cacheKey]
  const request = existingRequest ?? loader()

  if (!existingRequest) {
    requestStore[cacheKey] = request
  }

  try {
    const entry = await request
    cacheStore[cacheKey] = entry
    return entry
  } finally {
    if (requestStore[cacheKey] === request) {
      delete requestStore[cacheKey]
    }
  }
}

export function buildSampleDetailCacheKey(
  speciesId: string,
  sampleId: string,
  page: number,
  pageSize: number,
) {
  return `${speciesId}|${sampleId}|${page}|${pageSize}`
}

export function buildSpeciesNetworkRelationsCacheKey(
  speciesId: string,
  page: number,
  pageSize: number,
  threshold: number,
  tfFilter: string,
) {
  return `${speciesId}:${page}:${pageSize}:${threshold}:${tfFilter.trim().toLowerCase()}`
}

export async function loadSpeciesDetails(
  species: SpeciesOption,
): Promise<SpeciesDetailCacheEntry> {
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
      detailError:
        'Species-level overview data could not be loaded from the selected directory.',
    }
  }
}

export async function loadSampleDetail(
  speciesId: string,
  sampleId: string,
  page: number,
  pageSize: number,
): Promise<SampleDetailResponse> {
  return fetchJson<SampleDetailResponse>(
    `/api/browse/species/${speciesId}/samples/${encodeURIComponent(sampleId)}?page=${page}&pageSize=${pageSize}`,
  )
}

export async function loadCachedSampleDetail(
  speciesId: string,
  sampleId: string,
  page: number,
  pageSize: number,
) {
  return loadCachedResource(
    browsePageCache.sampleDetailCacheStore,
    browsePageCache.sampleDetailRequestStore,
    buildSampleDetailCacheKey(speciesId, sampleId, page, pageSize),
    () => loadSampleDetail(speciesId, sampleId, page, pageSize),
  )
}

export function prefetchSampleDetail(
  speciesId: string,
  sampleId: string,
  page: number,
  pageSize: number,
) {
  void loadCachedSampleDetail(speciesId, sampleId, page, pageSize).catch(() => {})
}

export async function loadSpeciesNetworkPreview(
  speciesId: string,
  limit: number,
  threshold: number,
  tfFilter: string,
): Promise<SpeciesNetworkPreviewResponse> {
  const response = await fetchJson<SpeciesNetworkPreviewResponse>(
    `/api/browse/species/${speciesId}/network-preview?limit=${limit}&threshold=${threshold}${tfFilter ? `&tf=${encodeURIComponent(tfFilter)}` : ''}`,
  )

  if (!Array.isArray(response.nodes) || !Array.isArray(response.links)) {
    throw new Error('Invalid species network preview response')
  }

  return response
}

export async function loadSampleNetworkPreview(
  speciesId: string,
  sampleId: string,
  limit: number,
  threshold: number,
  tfFilter: string,
): Promise<SpeciesNetworkPreviewResponse> {
  const response = await fetchJson<SpeciesNetworkPreviewResponse>(
    `/api/browse/species/${speciesId}/samples/${encodeURIComponent(sampleId)}/network-preview?limit=${limit}&threshold=${threshold}${tfFilter ? `&tf=${encodeURIComponent(tfFilter)}` : ''}`,
  )

  if (!Array.isArray(response.nodes) || !Array.isArray(response.links)) {
    throw new Error('Invalid sample network preview response')
  }

  return response
}

export async function loadSpeciesNetworkRelations(
  speciesId: string,
  page: number,
  pageSize: number,
  threshold: number,
  tfFilter: string,
): Promise<SpeciesNetworkRelationsResponse> {
  return fetchJson<SpeciesNetworkRelationsResponse>(
    `/api/browse/species/${speciesId}/network-relations?page=${page}&pageSize=${pageSize}&threshold=${threshold}${tfFilter ? `&tf=${encodeURIComponent(tfFilter)}` : ''}`,
  )
}

export async function loadCachedSpeciesNetworkRelations(
  speciesId: string,
  page: number,
  pageSize: number,
  threshold: number,
  tfFilter: string,
) {
  const normalizedFilter = tfFilter.trim()

  return loadCachedResource(
    browsePageCache.speciesNetworkRelationsCacheStore,
    browsePageCache.speciesNetworkRelationsRequestStore,
    buildSpeciesNetworkRelationsCacheKey(
      speciesId,
      page,
      pageSize,
      threshold,
      normalizedFilter,
    ),
    () =>
      loadSpeciesNetworkRelations(
        speciesId,
        page,
        pageSize,
        threshold,
        normalizedFilter,
      ),
  )
}

export function prefetchSpeciesNetworkRelations(
  speciesId: string,
  page: number,
  pageSize: number,
  threshold: number,
  tfFilter: string,
) {
  void loadCachedSpeciesNetworkRelations(
    speciesId,
    page,
    pageSize,
    threshold,
    tfFilter,
  ).catch(() => {})
}

export async function loadBrowseIndex(): Promise<BrowseIndexCacheEntry> {
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
  browsePageCache.browseIndexCache = null
  browsePageCache.browseIndexRequest = null

  for (const key of Object.keys(browsePageCache.speciesDetailCacheStore)) {
    delete browsePageCache.speciesDetailCacheStore[key]
  }

  for (const key of Object.keys(browsePageCache.speciesDetailRequestStore)) {
    delete browsePageCache.speciesDetailRequestStore[key]
  }

  for (const key of Object.keys(browsePageCache.sampleDetailCacheStore)) {
    delete browsePageCache.sampleDetailCacheStore[key]
  }

  for (const key of Object.keys(browsePageCache.sampleDetailRequestStore)) {
    delete browsePageCache.sampleDetailRequestStore[key]
  }

  for (const key of Object.keys(browsePageCache.speciesNetworkPreviewCacheStore)) {
    delete browsePageCache.speciesNetworkPreviewCacheStore[key]
  }

  for (const key of Object.keys(browsePageCache.speciesNetworkPreviewRequestStore)) {
    delete browsePageCache.speciesNetworkPreviewRequestStore[key]
  }

  for (const key of Object.keys(browsePageCache.sampleNetworkPreviewCacheStore)) {
    delete browsePageCache.sampleNetworkPreviewCacheStore[key]
  }

  for (const key of Object.keys(browsePageCache.sampleNetworkPreviewRequestStore)) {
    delete browsePageCache.sampleNetworkPreviewRequestStore[key]
  }

  for (const key of Object.keys(browsePageCache.speciesNetworkRelationsCacheStore)) {
    delete browsePageCache.speciesNetworkRelationsCacheStore[key]
  }

  for (const key of Object.keys(browsePageCache.speciesNetworkRelationsRequestStore)) {
    delete browsePageCache.speciesNetworkRelationsRequestStore[key]
  }
}
