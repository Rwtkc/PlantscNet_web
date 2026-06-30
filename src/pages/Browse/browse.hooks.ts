import { useEffect, useMemo, useRef, useState } from 'react'
import {
  buildSampleDetailCacheKey,
  browsePageCache,
  loadBrowseIndex,
  loadCachedSampleDetail,
  loadSpeciesDetails,
  prefetchSampleDetail,
} from './browse.api'
import type {
  SampleDetailResponse,
  SampleRecord,
  SpeciesDetailCacheEntry,
  SpeciesOption,
  DataModality,
} from './browse.types'
import { buildAdjacentPages } from './browse.utils'

export function useBrowseIndexData(modality: DataModality) {
  const [speciesOptions, setSpeciesOptions] = useState<SpeciesOption[]>(
    browsePageCache.browseIndexCacheStore[modality]?.species ?? [],
  )
  const [sampleRecords, setSampleRecords] = useState<SampleRecord[]>(
    browsePageCache.browseIndexCacheStore[modality]?.samples ?? [],
  )
  const [isLoading, setIsLoading] = useState(!browsePageCache.browseIndexCacheStore[modality])
  const [loadError, setLoadError] = useState<string | null>(
    browsePageCache.browseIndexCacheStore[modality]?.loadError ?? null,
  )

  useEffect(() => {
    let isCancelled = false

    async function loadAllSamples() {
      const cachedEntry = browsePageCache.browseIndexCacheStore[modality]
      if (cachedEntry) {
        setSpeciesOptions(cachedEntry.species)
        setSampleRecords(cachedEntry.samples)
        setLoadError(cachedEntry.loadError)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setLoadError(null)

      const request = browsePageCache.browseIndexRequestStore[modality] ?? loadBrowseIndex(modality)

      if (!browsePageCache.browseIndexRequestStore[modality]) {
        browsePageCache.browseIndexRequestStore[modality] = request
      }

      const entry = await request
      browsePageCache.browseIndexCacheStore[modality] = entry

      if (browsePageCache.browseIndexRequestStore[modality] === request) {
        delete browsePageCache.browseIndexRequestStore[modality]
      }

      if (!isCancelled) {
        setSpeciesOptions(entry.species)
        setSampleRecords(entry.samples)
        setLoadError(entry.loadError)
        setIsLoading(false)
      }
    }

    loadAllSamples()

    return () => {
      isCancelled = true
    }
  }, [modality])

  return {
    speciesOptions,
    sampleRecords,
    isLoading,
    loadError,
  }
}

export function useSpeciesDetailData(
  modality: DataModality,
  detailSpeciesIds: string[],
  speciesOptions: SpeciesOption[],
) {
  const [tfTargetCounts, setTfTargetCounts] = useState<Record<string, number | null>>({})
  const [detailError, setDetailError] = useState<string | null>(null)
  const speciesDetailCacheRef = useRef<Record<string, SpeciesDetailCacheEntry>>(
    browsePageCache.speciesDetailCacheStore,
  )
  const speciesDetailRequestRef = useRef<Record<string, Promise<SpeciesDetailCacheEntry>>>(
    browsePageCache.speciesDetailRequestStore,
  )
  const speciesOptionsById = useMemo(
    () => new Map(speciesOptions.map((species) => [species.id, species])),
    [speciesOptions],
  )

  useEffect(() => {
    let isCancelled = false

    async function syncSpeciesDetails() {
      if (detailSpeciesIds.length === 0) {
        setTfTargetCounts({})
        setDetailError(null)
        return
      }

      const cachedEntries = detailSpeciesIds
        .map((speciesId) => speciesDetailCacheRef.current[`${modality}:${speciesId}`])
        .filter((entry): entry is SpeciesDetailCacheEntry => Boolean(entry))

      setTfTargetCounts(
        Object.assign({}, ...cachedEntries.map((entry) => entry.tfTargetCounts)),
      )
      setDetailError(cachedEntries.find((entry) => entry.detailError)?.detailError ?? null)

      if (
        detailSpeciesIds.every((speciesId) =>
          Boolean(speciesDetailCacheRef.current[`${modality}:${speciesId}`]),
        )
      ) {
        return
      }

      setDetailError(null)

      const detailResults = await Promise.all(
        detailSpeciesIds.map(async (speciesId) => {
          const cacheKey = `${modality}:${speciesId}`
          const cachedEntry = speciesDetailCacheRef.current[cacheKey]
          if (cachedEntry) {
            return [speciesId, cachedEntry] as const
          }

          const species = speciesOptionsById.get(speciesId)
          if (!species) {
            return [
              speciesId,
              {
                tfTargetCounts: {},
                detailError:
                  'Species-level overview data could not be loaded from the selected directory.',
              } satisfies SpeciesDetailCacheEntry,
            ] as const
          }

          const existingRequest = speciesDetailRequestRef.current[cacheKey]
          const detailRequest = existingRequest ?? loadSpeciesDetails(species, modality)

          if (!existingRequest) {
            speciesDetailRequestRef.current[cacheKey] = detailRequest
          }

          const entry = await detailRequest

          speciesDetailCacheRef.current[cacheKey] = entry
          if (speciesDetailRequestRef.current[cacheKey] === detailRequest) {
            delete speciesDetailRequestRef.current[cacheKey]
          }

          return [speciesId, entry] as const
        }),
      )

      if (!isCancelled) {
        setTfTargetCounts(
          Object.assign({}, ...detailResults.map(([, entry]) => entry.tfTargetCounts)),
        )
        setDetailError(detailResults.find(([, entry]) => entry.detailError)?.[1].detailError ?? null)
      }
    }

    syncSpeciesDetails()

    return () => {
      isCancelled = true
    }
  }, [detailSpeciesIds, modality, speciesOptionsById])

  return {
    tfTargetCounts,
    detailError,
  }
}

export function useSampleDetailData(
  modality: DataModality,
  activeSample: SampleRecord | null,
  sampleDetailPage: number,
  sampleDetailPageSize: number,
) {
  const [sampleDetail, setSampleDetail] = useState<SampleDetailResponse | null>(null)
  const [sampleDetailError, setSampleDetailError] = useState<string | null>(null)
  const [isLoadingSampleDetail, setIsLoadingSampleDetail] = useState(false)
  const sampleDetailCacheRef = useRef<Record<string, SampleDetailResponse>>(
    browsePageCache.sampleDetailCacheStore,
  )

  useEffect(() => {
    let isCancelled = false

    async function syncSampleDetail() {
      if (!activeSample) {
        setSampleDetail(null)
        setSampleDetailError(null)
        setIsLoadingSampleDetail(false)
        return
      }

      const cacheKey = buildSampleDetailCacheKey(
        modality,
        activeSample.speciesId,
        activeSample.sampleId,
        sampleDetailPage,
        sampleDetailPageSize,
      )
      const cachedEntry = sampleDetailCacheRef.current[cacheKey]
      const isCurrentSampleDetail =
        sampleDetail?.sample.speciesId === activeSample.speciesId &&
        sampleDetail.sample.sampleId === activeSample.sampleId

      if (cachedEntry) {
        setSampleDetail(cachedEntry)
        setSampleDetailError(null)
        setIsLoadingSampleDetail(false)
        return
      }

      setIsLoadingSampleDetail(true)
      setSampleDetailError(null)
      if (!isCurrentSampleDetail) {
        setSampleDetail(null)
      }

      try {
        const entry = await loadCachedSampleDetail(
          modality,
          activeSample.speciesId,
          activeSample.sampleId,
          sampleDetailPage,
          sampleDetailPageSize,
        )

        if (!isCancelled) {
          setSampleDetail(entry)
          setSampleDetailError(null)
          setIsLoadingSampleDetail(false)
        }
      } catch {
        if (!isCancelled) {
          setSampleDetail(null)
          setSampleDetailError(
            'Sample-level metadata could not be loaded from the selected directory.',
          )
          setIsLoadingSampleDetail(false)
        }
      }
    }

    syncSampleDetail()

    return () => {
      isCancelled = true
    }
  }, [activeSample, sampleDetail, sampleDetailPage, sampleDetailPageSize])

  useEffect(() => {
    if (
      !activeSample ||
      !sampleDetail ||
      sampleDetail.sample.speciesId !== activeSample.speciesId ||
      sampleDetail.sample.sampleId !== activeSample.sampleId
    ) {
      return
    }

    buildAdjacentPages(
      sampleDetail.pagination.page,
      sampleDetail.pagination.totalPages,
    ).forEach((page) => {
      prefetchSampleDetail(
        modality,
        activeSample.speciesId,
        activeSample.sampleId,
        page,
        sampleDetailPageSize,
      )
    })
  }, [activeSample, modality, sampleDetail, sampleDetailPageSize])

  return {
    sampleDetail,
    sampleDetailError,
    isLoadingSampleDetail,
  }
}
