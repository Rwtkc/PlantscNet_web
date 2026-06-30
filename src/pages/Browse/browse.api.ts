import { toApiPath } from '@/app/base'
import { fetchJson } from '@/app/http'
import type {
  BrowseIndexCacheEntry,
  BrowseIndexResponse,
  SampleDetailResponse,
  SpeciesDetailCacheEntry,
  SpeciesNetworkRelationsResponse,
  SpeciesNetworkPreviewResponse,
  SpeciesOption,
  DataModality,
} from './browse.types'

export const browsePageCache = {
  browseIndexCacheStore: {} as Record<string, BrowseIndexCacheEntry>,
  browseIndexRequestStore: {} as Record<string, Promise<BrowseIndexCacheEntry>>,
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

function appendModalityQuery(path: string, modality: DataModality, query = '') {
  const separator = query ? '&' : '?'
  return `${toApiPath(path)}${query}${separator}modality=${modality}`
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
  modality: DataModality,
  speciesId: string,
  sampleId: string,
  page: number,
  pageSize: number,
) {
  return `${modality}|${speciesId}|${sampleId}|${page}|${pageSize}`
}

export function buildSpeciesNetworkRelationsCacheKey(
  modality: DataModality,
  speciesId: string,
  page: number,
  pageSize: number,
  threshold: number,
  tfFilter: string,
) {
  return `${modality}:${speciesId}:${page}:${pageSize}:${threshold}:${tfFilter.trim().toLowerCase()}`
}

export async function loadSpeciesDetails(
  species: SpeciesOption,
  modality: DataModality,
): Promise<SpeciesDetailCacheEntry> {
  try {
    return {
      tfTargetCounts: await fetchJson<Record<string, number | null>>(
        appendModalityQuery(`/browse/species/${species.id}/tf-target-counts`, modality),
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
  modality: DataModality,
  speciesId: string,
  sampleId: string,
  page: number,
  pageSize: number,
): Promise<SampleDetailResponse> {
  return fetchJson<SampleDetailResponse>(
    appendModalityQuery(
      `/browse/species/${speciesId}/samples/${encodeURIComponent(sampleId)}`,
      modality,
      `?page=${page}&pageSize=${pageSize}`,
    ),
  )
}

export async function loadCachedSampleDetail(
  modality: DataModality,
  speciesId: string,
  sampleId: string,
  page: number,
  pageSize: number,
) {
  return loadCachedResource(
    browsePageCache.sampleDetailCacheStore,
    browsePageCache.sampleDetailRequestStore,
    buildSampleDetailCacheKey(modality, speciesId, sampleId, page, pageSize),
    () => loadSampleDetail(modality, speciesId, sampleId, page, pageSize),
  )
}

export function prefetchSampleDetail(
  modality: DataModality,
  speciesId: string,
  sampleId: string,
  page: number,
  pageSize: number,
) {
  void loadCachedSampleDetail(modality, speciesId, sampleId, page, pageSize).catch(() => {})
}

export async function loadSpeciesNetworkPreview(
  modality: DataModality,
  speciesId: string,
  limit: number,
  threshold: number,
  tfFilter: string,
): Promise<SpeciesNetworkPreviewResponse> {
  const response = await fetchJson<SpeciesNetworkPreviewResponse>(
    appendModalityQuery(
      `/browse/species/${speciesId}/network-preview`,
      modality,
      `?limit=${limit}&threshold=${threshold}${tfFilter ? `&tf=${encodeURIComponent(tfFilter)}` : ''}`,
    ),
  )

  if (!Array.isArray(response.nodes) || !Array.isArray(response.links)) {
    throw new Error('Invalid species network preview response')
  }

  return response
}

export async function loadSampleNetworkPreview(
  modality: DataModality,
  speciesId: string,
  sampleId: string,
  limit: number,
  threshold: number,
  tfFilter: string,
): Promise<SpeciesNetworkPreviewResponse> {
  const response = await fetchJson<SpeciesNetworkPreviewResponse>(
    appendModalityQuery(
      `/browse/species/${speciesId}/samples/${encodeURIComponent(sampleId)}/network-preview`,
      modality,
      `?limit=${limit}&threshold=${threshold}${tfFilter ? `&tf=${encodeURIComponent(tfFilter)}` : ''}`,
    ),
  )

  if (!Array.isArray(response.nodes) || !Array.isArray(response.links)) {
    throw new Error('Invalid sample network preview response')
  }

  return response
}

export async function loadSpeciesNetworkRelations(
  modality: DataModality,
  speciesId: string,
  page: number,
  pageSize: number,
  threshold: number,
  tfFilter: string,
): Promise<SpeciesNetworkRelationsResponse> {
  return fetchJson<SpeciesNetworkRelationsResponse>(
    appendModalityQuery(
      `/browse/species/${speciesId}/network-relations`,
      modality,
      `?page=${page}&pageSize=${pageSize}&threshold=${threshold}${tfFilter ? `&tf=${encodeURIComponent(tfFilter)}` : ''}`,
    ),
  )
}

export async function loadCachedSpeciesNetworkRelations(
  modality: DataModality,
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
      modality,
      speciesId,
      page,
      pageSize,
      threshold,
      normalizedFilter,
    ),
    () =>
      loadSpeciesNetworkRelations(
        modality,
        speciesId,
        page,
        pageSize,
        threshold,
        normalizedFilter,
      ),
  )
}

export function prefetchSpeciesNetworkRelations(
  modality: DataModality,
  speciesId: string,
  page: number,
  pageSize: number,
  threshold: number,
  tfFilter: string,
) {
  void loadCachedSpeciesNetworkRelations(
    modality,
    speciesId,
    page,
    pageSize,
    threshold,
    tfFilter,
  ).catch(() => {})
}

export async function loadBrowseIndex(modality: DataModality): Promise<BrowseIndexCacheEntry> {
  try {
    const response = await fetchJson<BrowseIndexResponse>(
      appendModalityQuery('/browse/index', modality),
    )

    return {
      species: response.species,
      samples: response.samples.map((sample) => ({ ...sample, modality })),
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
  for (const key of Object.keys(browsePageCache.browseIndexCacheStore)) {
    delete browsePageCache.browseIndexCacheStore[key]
  }

  for (const key of Object.keys(browsePageCache.browseIndexRequestStore)) {
    delete browsePageCache.browseIndexRequestStore[key]
  }

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
