import { useEffect, useMemo, useRef, useState } from 'react'
import '@/styles/browse.css'
import { useCallback } from 'react'
import {
  buildSpeciesNetworkRelationsCacheKey,
  __resetBrowsePageCacheForTests,
  browsePageCache,
  loadSampleNetworkPreview,
  loadCachedSpeciesNetworkRelations,
  loadSpeciesNetworkPreview,
  prefetchSpeciesNetworkRelations,
} from './browse.api'
import { defaultNetworkLimit, defaultNetworkThreshold } from './browse.constants'
import { useBrowseDerivedState } from './browse.derived'
import { readBrowseSessionState, writeBrowseSessionState } from './browse.storage'
import type {
  BrowseMode,
  DataModality,
  SpeciesNetworkRelationsResponse,
  SpeciesNetworkPreviewResponse,
} from './browse.types'
import {
  buildAdjacentPages,
  buildSampleSelectionKey,
} from './browse.utils'
import { BrowseExplorerSidebar } from './components/BrowseExplorerSidebar'
import { BrowseOverviewContent } from './components/BrowseOverviewContent'
import { BrowseSampleContent } from './components/BrowseSampleContent'
import { useBrowseIndexData, useSampleDetailData, useSpeciesDetailData } from './browse.hooks'

export { __resetBrowsePageCacheForTests }

export default function BrowsePage() {
  const initialBrowseStateRef = useRef(readBrowseSessionState())
  const initialBrowseState = initialBrowseStateRef.current
  const sampleDetailPageSize = 10
  const speciesRelationsPageSize = 12
  const [modality, setModality] = useState<DataModality>(initialBrowseState?.modality ?? 'rna')
  const [browseMode, setBrowseMode] = useState<BrowseMode>(initialBrowseState?.browseMode ?? 'species')
  const [selectedSpeciesLabel, setSelectedSpeciesLabel] = useState<string | null>(
    initialBrowseState?.selectedSpeciesLabel ?? null,
  )
  const [expandedSpecies, setExpandedSpecies] = useState<string | null>(
    initialBrowseState?.expandedSpecies ?? null,
  )
  const [expandedTissue, setExpandedTissue] = useState<string | null>(
    initialBrowseState?.expandedTissue ?? null,
  )
  const [selectedSampleKey, setSelectedSampleKey] = useState<string | null>(
    initialBrowseState?.selectedSampleKey ?? null,
  )
  const [sampleNetworkPreview, setSampleNetworkPreview] = useState<SpeciesNetworkPreviewResponse | null>(null)
  const [sampleNetworkPreviewError, setSampleNetworkPreviewError] = useState<string | null>(null)
  const [isLoadingSampleNetworkPreview, setIsLoadingSampleNetworkPreview] = useState(false)
  const [speciesNetworkPreview, setSpeciesNetworkPreview] = useState<SpeciesNetworkPreviewResponse | null>(null)
  const [speciesNetworkPreviewError, setSpeciesNetworkPreviewError] = useState<string | null>(null)
  const [isLoadingSpeciesNetworkPreview, setIsLoadingSpeciesNetworkPreview] = useState(false)
  const [speciesNetworkRelations, setSpeciesNetworkRelations] = useState<SpeciesNetworkRelationsResponse | null>(null)
  const [speciesNetworkRelationsError, setSpeciesNetworkRelationsError] = useState<string | null>(null)
  const [isLoadingSpeciesNetworkRelations, setIsLoadingSpeciesNetworkRelations] = useState(false)
  const [networkPreviewThreshold, setNetworkPreviewThreshold] = useState(
    initialBrowseState?.networkPreviewThreshold ?? defaultNetworkThreshold,
  )
  const [networkPreviewLimit, setNetworkPreviewLimit] = useState(
    initialBrowseState?.networkPreviewLimit ?? defaultNetworkLimit,
  )
  const [networkTfFilter, setNetworkTfFilter] = useState(initialBrowseState?.networkTfFilter ?? '')
  const [hasManualNetworkPreviewThreshold, setHasManualNetworkPreviewThreshold] = useState(
    initialBrowseState?.hasManualNetworkPreviewThreshold ?? false,
  )
  const [sampleDetailPage, setSampleDetailPage] = useState(initialBrowseState?.sampleDetailPage ?? 1)
  const [speciesRelationsPage, setSpeciesRelationsPage] = useState(
    initialBrowseState?.speciesRelationsPage ?? 1,
  )
  const { speciesOptions, sampleRecords, isLoading, loadError } = useBrowseIndexData(modality)
  const skipInitialSamplePageResetRef = useRef(Boolean(initialBrowseState?.selectedSampleKey))
  const skipInitialSpeciesRelationsResetRef = useRef(Boolean(initialBrowseState?.selectedSpeciesLabel))
  const skipInitialNetworkResetRef = useRef(
    Boolean(initialBrowseState?.selectedSampleKey || initialBrowseState?.selectedSpeciesLabel),
  )
  const speciesNetworkPreviewCacheRef = useRef<Record<string, SpeciesNetworkPreviewResponse>>(
    browsePageCache.speciesNetworkPreviewCacheStore,
  )
  const speciesNetworkPreviewRequestRef = useRef<Record<string, Promise<SpeciesNetworkPreviewResponse>>>(
    browsePageCache.speciesNetworkPreviewRequestStore,
  )
  const sampleNetworkPreviewCacheRef = useRef<Record<string, SpeciesNetworkPreviewResponse>>(
    browsePageCache.sampleNetworkPreviewCacheStore,
  )
  const sampleNetworkPreviewRequestRef = useRef<Record<string, Promise<SpeciesNetworkPreviewResponse>>>(
    browsePageCache.sampleNetworkPreviewRequestStore,
  )
  const speciesNetworkRelationsCacheRef = useRef<Record<string, SpeciesNetworkRelationsResponse>>(
    browsePageCache.speciesNetworkRelationsCacheStore,
  )

  const {
    speciesGroups,
    tissueGroups,
    activeSpecies,
    activeSample,
    detailView,
    detailSpeciesIds,
  } = useBrowseDerivedState({
    browseMode,
    selectedSpeciesLabel,
    expandedTissue,
    selectedSampleKey,
    speciesOptions,
    sampleRecords,
  })

  useEffect(() => {
    if (skipInitialSamplePageResetRef.current) {
      skipInitialSamplePageResetRef.current = false
      return
    }

    setSampleDetailPage(1)
  }, [activeSample?.speciesId, activeSample?.sampleId])

  useEffect(() => {
    if (skipInitialSpeciesRelationsResetRef.current) {
      skipInitialSpeciesRelationsResetRef.current = false
      return
    }

    setSpeciesRelationsPage(1)
  }, [activeSpecies?.id, networkPreviewThreshold, networkTfFilter])

  useEffect(() => {
    if (skipInitialNetworkResetRef.current) {
      skipInitialNetworkResetRef.current = false
      return
    }

    setNetworkPreviewThreshold(defaultNetworkThreshold)
    setNetworkPreviewLimit(defaultNetworkLimit)
    setNetworkTfFilter('')
    setHasManualNetworkPreviewThreshold(false)
  }, [activeSample?.speciesId, activeSample?.sampleId, activeSpecies?.id])

  useEffect(() => {
    writeBrowseSessionState({
      modality,
      browseMode,
      selectedSpeciesLabel,
      expandedSpecies,
      expandedTissue,
      selectedSampleKey,
      networkPreviewThreshold,
      networkPreviewLimit,
      networkTfFilter,
      hasManualNetworkPreviewThreshold,
      sampleDetailPage,
      speciesRelationsPage,
    })
  }, [
    browseMode,
    expandedSpecies,
    expandedTissue,
    hasManualNetworkPreviewThreshold,
    modality,
    networkPreviewLimit,
    networkPreviewThreshold,
    networkTfFilter,
    sampleDetailPage,
    selectedSampleKey,
    selectedSpeciesLabel,
    speciesRelationsPage,
  ])

  const activeNetworkPreview = activeSample ? sampleNetworkPreview : speciesNetworkPreview

  const effectiveNetworkDefaultThreshold = useMemo(() => {
    const recommendedThreshold = activeNetworkPreview?.recommendedThreshold

    if (
      activeNetworkPreview?.sourceKind === 'single-sample' &&
      typeof recommendedThreshold === 'number' &&
      Number.isFinite(recommendedThreshold)
    ) {
      return recommendedThreshold
    }

    return defaultNetworkThreshold
  }, [activeNetworkPreview])

  useEffect(() => {
    if (!activeNetworkPreview || hasManualNetworkPreviewThreshold) {
      return
    }

    if (activeNetworkPreview.sourceKind !== 'single-sample') {
      return
    }

    const recommendedThreshold = activeNetworkPreview.recommendedThreshold

    if (
      typeof recommendedThreshold !== 'number' ||
      !Number.isFinite(recommendedThreshold) ||
      recommendedThreshold === networkPreviewThreshold
    ) {
      return
    }

    setNetworkPreviewThreshold(recommendedThreshold)
  }, [
    activeNetworkPreview,
    hasManualNetworkPreviewThreshold,
    networkPreviewThreshold,
  ])

  const { tfTargetCounts, detailError } = useSpeciesDetailData(
    modality,
    detailSpeciesIds,
    speciesOptions,
  )
  const { sampleDetail, sampleDetailError, isLoadingSampleDetail } = useSampleDetailData(
    modality,
    activeSample,
    sampleDetailPage,
    sampleDetailPageSize,
  )
  const shouldLoadSpeciesNetwork =
    browseMode === 'species' &&
    Boolean(activeSpecies) &&
    !activeSample &&
    (activeSpecies?.sampleCount ?? 0) >= 10

  useEffect(() => {
    let isCancelled = false

    async function syncSampleNetworkPreview() {
      if (!activeSample) {
        setSampleNetworkPreview(null)
        setSampleNetworkPreviewError(null)
        setIsLoadingSampleNetworkPreview(false)
        return
      }

      const rawTfFilter = networkTfFilter.trim()
      const normalizedTfFilter = rawTfFilter.toLowerCase()
      const cacheKey = `${modality}:${activeSample.speciesId}:${activeSample.sampleId}:${networkPreviewLimit}:${networkPreviewThreshold}:${normalizedTfFilter}`
      const cachedEntry = sampleNetworkPreviewCacheRef.current[cacheKey]
      const hasCurrentSamplePreview =
        sampleNetworkPreview?.speciesId === activeSample.speciesId &&
        sampleNetworkPreview.sampleId === activeSample.sampleId

      if (cachedEntry) {
        setSampleNetworkPreview(cachedEntry)
        setSampleNetworkPreviewError(null)
        setIsLoadingSampleNetworkPreview(false)
        return
      }

      setIsLoadingSampleNetworkPreview(true)
      setSampleNetworkPreviewError(null)
      if (!hasCurrentSamplePreview) {
        setSampleNetworkPreview(null)
      }

      const existingRequest = sampleNetworkPreviewRequestRef.current[cacheKey]
      const previewRequest =
        existingRequest ??
        loadSampleNetworkPreview(
          modality,
          activeSample.speciesId,
          activeSample.sampleId,
          networkPreviewLimit,
          networkPreviewThreshold,
          rawTfFilter,
        )

      if (!existingRequest) {
        sampleNetworkPreviewRequestRef.current[cacheKey] = previewRequest
      }

      try {
        const entry = await previewRequest
        sampleNetworkPreviewCacheRef.current[cacheKey] = entry

        if (sampleNetworkPreviewRequestRef.current[cacheKey] === previewRequest) {
          delete sampleNetworkPreviewRequestRef.current[cacheKey]
        }

        if (!isCancelled) {
          setSampleNetworkPreview(entry)
          setSampleNetworkPreviewError(null)
          setIsLoadingSampleNetworkPreview(false)
        }
      } catch {
        if (sampleNetworkPreviewRequestRef.current[cacheKey] === previewRequest) {
          delete sampleNetworkPreviewRequestRef.current[cacheKey]
        }

        if (!isCancelled) {
          setSampleNetworkPreview(null)
          setSampleNetworkPreviewError(
            'Sample network preview could not be loaded from the selected directory.',
          )
          setIsLoadingSampleNetworkPreview(false)
        }
      }
    }

    syncSampleNetworkPreview()

    return () => {
      isCancelled = true
    }
  }, [
    activeSample,
    modality,
    networkPreviewLimit,
    networkPreviewThreshold,
    networkTfFilter,
    sampleNetworkPreview,
  ])

  useEffect(() => {
    let isCancelled = false

    async function syncSpeciesNetworkRelations() {
      if (!shouldLoadSpeciesNetwork || !activeSpecies) {
        setSpeciesNetworkRelations(null)
        setSpeciesNetworkRelationsError(null)
        setIsLoadingSpeciesNetworkRelations(false)
        return
      }

      const rawTfFilter = networkTfFilter.trim()
      const cacheKey = buildSpeciesNetworkRelationsCacheKey(
        modality,
        activeSpecies.id,
        speciesRelationsPage,
        speciesRelationsPageSize,
        networkPreviewThreshold,
        rawTfFilter,
      )
      const cachedEntry = speciesNetworkRelationsCacheRef.current[cacheKey]
      const hasCurrentRelations = speciesNetworkRelations?.speciesId === activeSpecies.id

      if (cachedEntry) {
        setSpeciesNetworkRelations(cachedEntry)
        setSpeciesNetworkRelationsError(null)
        setIsLoadingSpeciesNetworkRelations(false)
        return
      }

      setIsLoadingSpeciesNetworkRelations(true)
      setSpeciesNetworkRelationsError(null)
      if (!hasCurrentRelations) {
        setSpeciesNetworkRelations(null)
      }

      try {
        const entry = await loadCachedSpeciesNetworkRelations(
          modality,
          activeSpecies.id,
          speciesRelationsPage,
          speciesRelationsPageSize,
          networkPreviewThreshold,
          rawTfFilter,
        )

        if (!isCancelled) {
          setSpeciesNetworkRelations(entry)
          setSpeciesNetworkRelationsError(null)
          setIsLoadingSpeciesNetworkRelations(false)
        }
      } catch {
        if (!isCancelled) {
          setSpeciesNetworkRelations(null)
          setSpeciesNetworkRelationsError(
            'Integrated regulatory relations could not be loaded from the selected directory.',
          )
          setIsLoadingSpeciesNetworkRelations(false)
        }
      }
    }

    syncSpeciesNetworkRelations()

    return () => {
      isCancelled = true
    }
  }, [
    activeSample,
    activeSpecies,
    browseMode,
    modality,
    networkPreviewThreshold,
    networkTfFilter,
    shouldLoadSpeciesNetwork,
    speciesNetworkRelations,
    speciesRelationsPage,
    speciesRelationsPageSize,
  ])

  useEffect(() => {
    if (
      !shouldLoadSpeciesNetwork ||
      !activeSpecies ||
      !speciesNetworkRelations ||
      speciesNetworkRelations.speciesId !== activeSpecies.id
    ) {
      return
    }

    buildAdjacentPages(
      speciesNetworkRelations.pagination.page,
      speciesNetworkRelations.pagination.totalPages,
    ).forEach((page) => {
      prefetchSpeciesNetworkRelations(
        modality,
        activeSpecies.id,
        page,
        speciesRelationsPageSize,
        networkPreviewThreshold,
        networkTfFilter,
      )
    })
  }, [
    activeSample,
    activeSpecies,
    browseMode,
    modality,
    networkPreviewThreshold,
    networkTfFilter,
    shouldLoadSpeciesNetwork,
    speciesNetworkRelations,
    speciesRelationsPageSize,
  ])

  useEffect(() => {
    let isCancelled = false

    async function syncSpeciesNetworkPreview() {
      if (!shouldLoadSpeciesNetwork || !activeSpecies) {
        setSpeciesNetworkPreview(null)
        setSpeciesNetworkPreviewError(null)
        setIsLoadingSpeciesNetworkPreview(false)
        return
      }

      const rawTfFilter = networkTfFilter.trim()
      const normalizedTfFilter = rawTfFilter.toLowerCase()
      const cacheKey = `${modality}:${activeSpecies.id}:${networkPreviewLimit}:${networkPreviewThreshold}:${normalizedTfFilter}`
      const cachedEntry = speciesNetworkPreviewCacheRef.current[cacheKey]
      const hasCurrentSpeciesPreview = speciesNetworkPreview?.speciesId === activeSpecies.id

      if (cachedEntry) {
        setSpeciesNetworkPreview(cachedEntry)
        setSpeciesNetworkPreviewError(null)
        setIsLoadingSpeciesNetworkPreview(false)
        return
      }

      setIsLoadingSpeciesNetworkPreview(true)
      setSpeciesNetworkPreviewError(null)
      if (!hasCurrentSpeciesPreview) {
        setSpeciesNetworkPreview(null)
      }

      const existingRequest = speciesNetworkPreviewRequestRef.current[cacheKey]
      const previewRequest =
        existingRequest ??
        loadSpeciesNetworkPreview(
          modality,
          activeSpecies.id,
          networkPreviewLimit,
          networkPreviewThreshold,
          rawTfFilter,
        )

      if (!existingRequest) {
        speciesNetworkPreviewRequestRef.current[cacheKey] = previewRequest
      }

      try {
        const entry = await previewRequest
        speciesNetworkPreviewCacheRef.current[cacheKey] = entry

        if (speciesNetworkPreviewRequestRef.current[cacheKey] === previewRequest) {
          delete speciesNetworkPreviewRequestRef.current[cacheKey]
        }

        if (!isCancelled) {
          setSpeciesNetworkPreview(entry)
          setSpeciesNetworkPreviewError(null)
          setIsLoadingSpeciesNetworkPreview(false)
        }
      } catch {
        if (speciesNetworkPreviewRequestRef.current[cacheKey] === previewRequest) {
          delete speciesNetworkPreviewRequestRef.current[cacheKey]
        }

        if (!isCancelled) {
          setSpeciesNetworkPreview(null)
          setSpeciesNetworkPreviewError('Species network preview could not be loaded from the selected directory.')
          setIsLoadingSpeciesNetworkPreview(false)
        }
      }
    }

    syncSpeciesNetworkPreview()

    return () => {
      isCancelled = true
    }
  }, [
    activeSpecies,
    modality,
    networkPreviewLimit,
    networkPreviewThreshold,
    networkTfFilter,
    shouldLoadSpeciesNetwork,
  ])

  const handleModalityChange = useCallback((nextModality: DataModality) => {
    setModality(nextModality)
    setExpandedSpecies(null)
    setSelectedSpeciesLabel(null)
    setExpandedTissue(null)
    setSelectedSampleKey(null)
    setSampleNetworkPreview(null)
    setSpeciesNetworkPreview(null)
    setSpeciesNetworkRelations(null)
    setNetworkPreviewThreshold(defaultNetworkThreshold)
    setNetworkPreviewLimit(defaultNetworkLimit)
    setNetworkTfFilter('')
    setHasManualNetworkPreviewThreshold(false)
  }, [])

  const handleApplyNetworkFilters = useCallback(
    ({ threshold, limit, tfFilter }: { threshold: number; limit: number; tfFilter: string }) => {
      setNetworkPreviewThreshold(threshold)
      setNetworkPreviewLimit(limit)
      setNetworkTfFilter(tfFilter)
      setHasManualNetworkPreviewThreshold(threshold !== effectiveNetworkDefaultThreshold)
    },
    [effectiveNetworkDefaultThreshold],
  )

  const handleResetNetworkFilters = useCallback(() => {
    setNetworkPreviewThreshold(effectiveNetworkDefaultThreshold)
    setNetworkPreviewLimit(defaultNetworkLimit)
    setNetworkTfFilter('')
    setHasManualNetworkPreviewThreshold(false)
  }, [effectiveNetworkDefaultThreshold])

  const handleSpeciesToggle = useCallback(
    (speciesLabel: string, isExpanded: boolean) => {
      if (isExpanded && selectedSpeciesLabel === speciesLabel) {
        setExpandedSpecies(null)
        setSelectedSpeciesLabel(null)
        setSelectedSampleKey(null)
        return
      }

      setExpandedSpecies(speciesLabel)
      setSelectedSpeciesLabel(speciesLabel)
      setSelectedSampleKey(null)
    },
    [selectedSpeciesLabel],
  )

  const handleTissueToggle = useCallback((tissue: string) => {
    setExpandedTissue((current) => (current === tissue ? null : tissue))
  }, [])

  const handleSampleToggle = useCallback((speciesLabel: string, sampleId: string) => {
    const sampleKey = buildSampleSelectionKey(speciesLabel, sampleId)
    setSelectedSampleKey((current) => (current === sampleKey ? null : sampleKey))
  }, [])

  return (
    <article className="browse-page fade-rise">
      <BrowseExplorerSidebar
        isLoading={isLoading}
        loadError={loadError}
        modality={modality}
        browseMode={browseMode}
        speciesGroups={speciesGroups}
        tissueGroups={tissueGroups}
        expandedSpecies={expandedSpecies}
        expandedTissue={expandedTissue}
        selectedSpeciesLabel={selectedSpeciesLabel}
        selectedSampleKey={selectedSampleKey}
        onModalityChange={handleModalityChange}
        onBrowseModeChange={setBrowseMode}
        onSpeciesToggle={handleSpeciesToggle}
        onTissueToggle={handleTissueToggle}
        onSampleToggle={handleSampleToggle}
      />

      <section className="browse-page__main" aria-label="Browse D3 main stage">
        {activeSample ? (
          <BrowseSampleContent
            modality={modality}
            sampleDetail={sampleDetail}
            sampleDetailError={sampleDetailError}
            isLoadingSampleDetail={isLoadingSampleDetail}
            sampleNetworkPreview={sampleNetworkPreview}
            sampleNetworkPreviewError={sampleNetworkPreviewError}
            isLoadingSampleNetworkPreview={isLoadingSampleNetworkPreview}
            networkThreshold={networkPreviewThreshold}
            networkDefaultThreshold={effectiveNetworkDefaultThreshold}
            networkLimit={networkPreviewLimit}
            networkTfFilter={networkTfFilter}
            onApplyNetworkFilters={handleApplyNetworkFilters}
            onResetNetworkFilters={handleResetNetworkFilters}
            onSampleDetailPageChange={setSampleDetailPage}
          />
        ) : (
          <BrowseOverviewContent
            detailView={detailView}
            detailError={detailError}
            tfTargetCounts={tfTargetCounts}
            browseMode={browseMode}
            activeSpecies={activeSpecies}
            speciesNetworkRelations={speciesNetworkRelations}
            speciesNetworkRelationsError={speciesNetworkRelationsError}
            isLoadingSpeciesNetworkRelations={isLoadingSpeciesNetworkRelations}
            speciesNetworkPreview={speciesNetworkPreview}
            speciesNetworkPreviewError={speciesNetworkPreviewError}
            isLoadingSpeciesNetworkPreview={isLoadingSpeciesNetworkPreview}
            networkThreshold={networkPreviewThreshold}
            networkDefaultThreshold={effectiveNetworkDefaultThreshold}
            networkLimit={networkPreviewLimit}
            networkTfFilter={networkTfFilter}
            onApplyNetworkFilters={handleApplyNetworkFilters}
            onResetNetworkFilters={handleResetNetworkFilters}
            onSpeciesRelationsPageChange={setSpeciesRelationsPage}
          />
        )}
      </section>
    </article>
  )
}
