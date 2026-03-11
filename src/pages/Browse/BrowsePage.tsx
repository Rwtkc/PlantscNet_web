import { useEffect, useMemo, useRef, useState } from 'react'
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
import type {
  BrowseMode,
  DetailViewContent,
  SpeciesNetworkRelationsResponse,
  SpeciesNetworkPreviewResponse,
} from './browse.types'
import {
  buildAdjacentPages,
  buildSampleSelectionKey,
  buildSpeciesComposition,
  buildSpeciesGroups,
  buildTissueComposition,
  buildTissueGroups,
} from './browse.utils'
import { BrowseExplorerSidebar } from './components/BrowseExplorerSidebar'
import { BrowseOverviewContent } from './components/BrowseOverviewContent'
import { BrowseSampleContent } from './components/BrowseSampleContent'
import { useBrowseIndexData, useSampleDetailData, useSpeciesDetailData } from './browse.hooks'

export { __resetBrowsePageCacheForTests }

export default function BrowsePage() {
  const sampleDetailPageSize = 10
  const speciesRelationsPageSize = 12
  const [browseMode, setBrowseMode] = useState<BrowseMode>('species')
  const [selectedSpeciesLabel, setSelectedSpeciesLabel] = useState<string | null>(null)
  const [expandedSpecies, setExpandedSpecies] = useState<string | null>(null)
  const [expandedTissue, setExpandedTissue] = useState<string | null>(null)
  const [selectedSampleKey, setSelectedSampleKey] = useState<string | null>(null)
  const [sampleNetworkPreview, setSampleNetworkPreview] = useState<SpeciesNetworkPreviewResponse | null>(null)
  const [sampleNetworkPreviewError, setSampleNetworkPreviewError] = useState<string | null>(null)
  const [isLoadingSampleNetworkPreview, setIsLoadingSampleNetworkPreview] = useState(false)
  const [speciesNetworkPreview, setSpeciesNetworkPreview] = useState<SpeciesNetworkPreviewResponse | null>(null)
  const [speciesNetworkPreviewError, setSpeciesNetworkPreviewError] = useState<string | null>(null)
  const [isLoadingSpeciesNetworkPreview, setIsLoadingSpeciesNetworkPreview] = useState(false)
  const [speciesNetworkRelations, setSpeciesNetworkRelations] = useState<SpeciesNetworkRelationsResponse | null>(null)
  const [speciesNetworkRelationsError, setSpeciesNetworkRelationsError] = useState<string | null>(null)
  const [isLoadingSpeciesNetworkRelations, setIsLoadingSpeciesNetworkRelations] = useState(false)
  const [networkPreviewThreshold, setNetworkPreviewThreshold] = useState(defaultNetworkThreshold)
  const [networkPreviewLimit, setNetworkPreviewLimit] = useState(defaultNetworkLimit)
  const [networkTfFilter, setNetworkTfFilter] = useState('')
  const [hasManualNetworkPreviewThreshold, setHasManualNetworkPreviewThreshold] = useState(false)
  const [sampleDetailPage, setSampleDetailPage] = useState(1)
  const [speciesRelationsPage, setSpeciesRelationsPage] = useState(1)
  const { speciesOptions, sampleRecords, isLoading, loadError } = useBrowseIndexData()
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

  const speciesGroups = useMemo(
    () => buildSpeciesGroups(speciesOptions, sampleRecords),
    [sampleRecords, speciesOptions],
  )
  const tissueGroups = useMemo(() => buildTissueGroups(sampleRecords), [sampleRecords])

  const activeSpecies =
    browseMode === 'species'
      ? speciesOptions.find((species) => species.label === selectedSpeciesLabel) ?? null
      : null
  const activeTissue = browseMode === 'tissue' ? expandedTissue : null
  const activeSample = useMemo(
    () =>
      selectedSampleKey
        ? sampleRecords.find(
            (record) =>
              buildSampleSelectionKey(record.speciesLabel, record.sampleId) === selectedSampleKey,
          ) ?? null
        : null,
    [sampleRecords, selectedSampleKey],
  )

  useEffect(() => {
    setSampleDetailPage(1)
  }, [activeSample?.speciesId, activeSample?.sampleId])

  useEffect(() => {
    setSpeciesRelationsPage(1)
  }, [activeSpecies?.id, networkPreviewThreshold, networkTfFilter])

  useEffect(() => {
    setNetworkPreviewThreshold(defaultNetworkThreshold)
    setNetworkPreviewLimit(defaultNetworkLimit)
    setNetworkTfFilter('')
    setHasManualNetworkPreviewThreshold(false)
  }, [activeSample?.speciesId, activeSample?.sampleId, activeSpecies?.id])

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

  const activeSpeciesRecords = useMemo(
    () =>
      activeSpecies
        ? sampleRecords.filter((record) => record.speciesLabel === activeSpecies.label)
        : [],
    [activeSpecies, sampleRecords],
  )

  const tissueComposition = useMemo(
    () => buildTissueComposition(activeSpeciesRecords),
    [activeSpeciesRecords],
  )
  const activeTissueRecords = useMemo(
    () => (activeTissue ? sampleRecords.filter((record) => record.tissue === activeTissue) : []),
    [activeTissue, sampleRecords],
  )
  const tissueSpeciesComposition = useMemo(
    () => buildSpeciesComposition(activeTissueRecords),
    [activeTissueRecords],
  )
  const detailView = useMemo<DetailViewContent | null>(() => {
    if (activeSpecies) {
      return {
        eyebrow: 'Species overview',
        title: activeSpecies.label,
        description:
          'Browse the tissue composition and sample-level metadata for the selected PlantscNet species.',
        chartHeading: 'Tissue composition',
        chartAriaLabel: 'Species tissue composition',
        chartSummary: `${activeSpeciesRecords.length} total samples`,
        compositionItems: tissueComposition,
        tableRecords: activeSpeciesRecords,
      }
    }

    if (activeTissue) {
      return {
        eyebrow: 'Tissue overview',
        title: activeTissue,
        description:
          'Browse species coverage and sample-level metadata for the selected PlantscNet tissue.',
        chartHeading: 'Species composition',
        chartAriaLabel: 'Tissue species composition',
        chartSummary: `${activeTissueRecords.length} total samples`,
        compositionItems: tissueSpeciesComposition,
        tableRecords: activeTissueRecords,
      }
    }

    return null
  }, [
    activeSpecies,
    activeSpeciesRecords,
    activeTissue,
    activeTissueRecords,
    tissueComposition,
    tissueSpeciesComposition,
  ])
  const detailSpeciesIds = useMemo(
    () => Array.from(new Set(detailView?.tableRecords.map((record) => record.speciesId) ?? [])),
    [detailView],
  )
  const { tfTargetCounts, detailError } = useSpeciesDetailData(detailSpeciesIds, speciesOptions)
  const { sampleDetail, sampleDetailError, isLoadingSampleDetail } = useSampleDetailData(
    activeSample,
    sampleDetailPage,
    sampleDetailPageSize,
  )

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
      const cacheKey = `${activeSample.speciesId}:${activeSample.sampleId}:${networkPreviewLimit}:${networkPreviewThreshold}:${normalizedTfFilter}`
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
    networkPreviewLimit,
    networkPreviewThreshold,
    networkTfFilter,
    sampleNetworkPreview,
  ])

  useEffect(() => {
    let isCancelled = false

    async function syncSpeciesNetworkRelations() {
      if (browseMode !== 'species' || !activeSpecies || activeSample) {
        setSpeciesNetworkRelations(null)
        setSpeciesNetworkRelationsError(null)
        setIsLoadingSpeciesNetworkRelations(false)
        return
      }

      const rawTfFilter = networkTfFilter.trim()
      const cacheKey = buildSpeciesNetworkRelationsCacheKey(
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
    networkPreviewThreshold,
    networkTfFilter,
    speciesNetworkRelations,
    speciesRelationsPage,
    speciesRelationsPageSize,
  ])

  useEffect(() => {
    if (
      browseMode !== 'species' ||
      !activeSpecies ||
      activeSample ||
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
    networkPreviewThreshold,
    networkTfFilter,
    speciesNetworkRelations,
    speciesRelationsPageSize,
  ])

  useEffect(() => {
    let isCancelled = false

    async function syncSpeciesNetworkPreview() {
      if (browseMode !== 'species' || !activeSpecies || activeSample) {
        setSpeciesNetworkPreview(null)
        setSpeciesNetworkPreviewError(null)
        setIsLoadingSpeciesNetworkPreview(false)
        return
      }

      const rawTfFilter = networkTfFilter.trim()
      const normalizedTfFilter = rawTfFilter.toLowerCase()
      const cacheKey = `${activeSpecies.id}:${networkPreviewLimit}:${networkPreviewThreshold}:${normalizedTfFilter}`
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
  }, [activeSample, activeSpecies, browseMode, networkPreviewLimit, networkPreviewThreshold, networkTfFilter])

  return (
    <article className="browse-page fade-rise">
      <BrowseExplorerSidebar
        isLoading={isLoading}
        loadError={loadError}
        browseMode={browseMode}
        speciesGroups={speciesGroups}
        tissueGroups={tissueGroups}
        expandedSpecies={expandedSpecies}
        expandedTissue={expandedTissue}
        selectedSpeciesLabel={selectedSpeciesLabel}
        selectedSampleKey={selectedSampleKey}
        onBrowseModeChange={setBrowseMode}
        onSpeciesToggle={(speciesLabel, isExpanded) => {
          if (isExpanded) {
            setExpandedSpecies(null)
            setSelectedSpeciesLabel(speciesLabel)
            setSelectedSampleKey((current) =>
              current?.startsWith(`${speciesLabel}|`) ? null : current,
            )
            return
          }

          setExpandedSpecies(speciesLabel)
          setSelectedSpeciesLabel(speciesLabel)
          setSelectedSampleKey(null)
        }}
        onTissueToggle={(tissue) => {
          setExpandedTissue((current) => (current === tissue ? null : tissue))
        }}
        onSampleToggle={(speciesLabel, sampleId) => {
          const sampleKey = buildSampleSelectionKey(speciesLabel, sampleId)
          setSelectedSampleKey((current) => (current === sampleKey ? null : sampleKey))
        }}
      />

      <section className="browse-page__main" aria-label="Browse D3 main stage">
        {activeSample ? (
          <BrowseSampleContent
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
            onApplyNetworkFilters={({ threshold, limit, tfFilter }) => {
              setNetworkPreviewThreshold(threshold)
              setNetworkPreviewLimit(limit)
              setNetworkTfFilter(tfFilter)
              setHasManualNetworkPreviewThreshold(
                threshold !== effectiveNetworkDefaultThreshold,
              )
            }}
            onResetNetworkFilters={() => {
              setNetworkPreviewThreshold(effectiveNetworkDefaultThreshold)
              setNetworkPreviewLimit(defaultNetworkLimit)
              setNetworkTfFilter('')
              setHasManualNetworkPreviewThreshold(false)
            }}
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
            onApplyNetworkFilters={({ threshold, limit, tfFilter }) => {
              setNetworkPreviewThreshold(threshold)
              setNetworkPreviewLimit(limit)
              setNetworkTfFilter(tfFilter)
              setHasManualNetworkPreviewThreshold(
                threshold !== effectiveNetworkDefaultThreshold,
              )
            }}
            onResetNetworkFilters={() => {
              setNetworkPreviewThreshold(effectiveNetworkDefaultThreshold)
              setNetworkPreviewLimit(defaultNetworkLimit)
              setNetworkTfFilter('')
              setHasManualNetworkPreviewThreshold(false)
            }}
            onSpeciesRelationsPageChange={setSpeciesRelationsPage}
          />
        )}
      </section>
    </article>
  )
}


