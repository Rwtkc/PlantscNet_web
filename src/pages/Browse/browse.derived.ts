import { useMemo } from 'react'
import type { BrowseMode, DetailViewContent, SampleRecord, SpeciesOption } from './browse.types'
import {
  buildSampleSelectionKey,
  buildSpeciesComposition,
  buildSpeciesGroups,
  buildTissueComposition,
  buildTissueGroups,
} from './browse.utils'

type UseBrowseDerivedStateArgs = {
  browseMode: BrowseMode
  selectedSpeciesLabel: string | null
  expandedTissue: string | null
  selectedSampleKey: string | null
  speciesOptions: SpeciesOption[]
  sampleRecords: SampleRecord[]
}

export function useBrowseDerivedState({
  browseMode,
  selectedSpeciesLabel,
  expandedTissue,
  selectedSampleKey,
  speciesOptions,
  sampleRecords,
}: UseBrowseDerivedStateArgs) {
  const speciesGroups = useMemo(
    () => buildSpeciesGroups(speciesOptions, sampleRecords),
    [sampleRecords, speciesOptions],
  )
  const tissueGroups = useMemo(() => buildTissueGroups(sampleRecords), [sampleRecords])

  const speciesByLabel = useMemo(
    () => new Map(speciesOptions.map((species) => [species.label, species])),
    [speciesOptions],
  )

  const sampleBySelectionKey = useMemo(
    () =>
      new Map(
        sampleRecords.map((record) => [
          buildSampleSelectionKey(record.speciesLabel, record.sampleId),
          record,
        ]),
      ),
    [sampleRecords],
  )

  const recordsBySpeciesLabel = useMemo(() => {
    const grouped = new Map<string, SampleRecord[]>()

    sampleRecords.forEach((record) => {
      const existing = grouped.get(record.speciesLabel)

      if (existing) {
        existing.push(record)
        return
      }

      grouped.set(record.speciesLabel, [record])
    })

    return grouped
  }, [sampleRecords])

  const recordsByTissue = useMemo(() => {
    const grouped = new Map<string, SampleRecord[]>()

    sampleRecords.forEach((record) => {
      const existing = grouped.get(record.tissue)

      if (existing) {
        existing.push(record)
        return
      }

      grouped.set(record.tissue, [record])
    })

    return grouped
  }, [sampleRecords])

  const activeSpecies =
    browseMode === 'species' && selectedSpeciesLabel
      ? speciesByLabel.get(selectedSpeciesLabel) ?? null
      : null
  const activeTissue = browseMode === 'tissue' ? expandedTissue : null
  const activeSample = selectedSampleKey ? sampleBySelectionKey.get(selectedSampleKey) ?? null : null

  const activeSpeciesRecords = useMemo(
    () => (activeSpecies ? recordsBySpeciesLabel.get(activeSpecies.label) ?? [] : []),
    [activeSpecies, recordsBySpeciesLabel],
  )
  const activeTissueRecords = useMemo(
    () => (activeTissue ? recordsByTissue.get(activeTissue) ?? [] : []),
    [activeTissue, recordsByTissue],
  )
  const tissueComposition = useMemo(
    () => buildTissueComposition(activeSpeciesRecords),
    [activeSpeciesRecords],
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

  return {
    speciesGroups,
    tissueGroups,
    activeSpecies,
    activeTissue,
    activeSample,
    detailView,
    detailSpeciesIds,
  }
}
