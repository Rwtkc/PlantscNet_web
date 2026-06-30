import { defaultNetworkLimit, defaultNetworkThreshold } from './browse.constants'
import type { BrowseMode, DataModality } from './browse.types'

const browseSessionStorageKey = 'plantscnet:browse-state'

interface PersistedBrowseState {
  modality: DataModality
  browseMode: BrowseMode
  selectedSpeciesLabel: string | null
  expandedSpecies: string | null
  expandedTissue: string | null
  selectedSampleKey: string | null
  networkPreviewThreshold: number
  networkPreviewLimit: number
  networkTfFilter: string
  hasManualNetworkPreviewThreshold: boolean
  sampleDetailPage: number
  speciesRelationsPage: number
}

function parseStoredString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null
}

function parseStoredPage(value: unknown) {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : 1
}

function parseStoredMode(value: unknown): BrowseMode {
  return value === 'tissue' ? 'tissue' : 'species'
}

function parseStoredModality(value: unknown): DataModality {
  return value === 'atac' ? 'atac' : 'rna'
}

function parseStoredThreshold(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : defaultNetworkThreshold
}

function parseStoredLimit(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.trunc(value)
    : defaultNetworkLimit
}

export function readBrowseSessionState(): PersistedBrowseState | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.sessionStorage.getItem(browseSessionStorageKey)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>

    return {
      modality: parseStoredModality(parsed.modality),
      browseMode: parseStoredMode(parsed.browseMode),
      selectedSpeciesLabel: parseStoredString(parsed.selectedSpeciesLabel),
      expandedSpecies: parseStoredString(parsed.expandedSpecies),
      expandedTissue: parseStoredString(parsed.expandedTissue),
      selectedSampleKey: parseStoredString(parsed.selectedSampleKey),
      networkPreviewThreshold: parseStoredThreshold(parsed.networkPreviewThreshold),
      networkPreviewLimit: parseStoredLimit(parsed.networkPreviewLimit),
      networkTfFilter: typeof parsed.networkTfFilter === 'string' ? parsed.networkTfFilter : '',
      hasManualNetworkPreviewThreshold: parsed.hasManualNetworkPreviewThreshold === true,
      sampleDetailPage: parseStoredPage(parsed.sampleDetailPage),
      speciesRelationsPage: parseStoredPage(parsed.speciesRelationsPage),
    }
  } catch {
    return null
  }
}

export function writeBrowseSessionState(state: PersistedBrowseState) {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(browseSessionStorageKey, JSON.stringify(state))
}

export function clearBrowseSessionState() {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.removeItem(browseSessionStorageKey)
}
