import { clearBrowseSessionState } from '@/pages/Browse/browse.storage'

function getNavigationEntryType() {
  if (typeof window === 'undefined' || typeof window.performance === 'undefined') {
    return null
  }

  const navigationEntry = window.performance.getEntriesByType('navigation')[0] as
    | PerformanceNavigationTiming
    | undefined

  if (navigationEntry?.type) {
    return navigationEntry.type
  }

  const legacyNavigation = window.performance.navigation
  if (legacyNavigation?.type === legacyNavigation.TYPE_RELOAD) {
    return 'reload'
  }

  return null
}

export function isReloadNavigation() {
  return getNavigationEntryType() === 'reload'
}

export function clearPlantscNetSessionState() {
  clearBrowseSessionState()
}

export function resetSessionStateForReload() {
  if (!isReloadNavigation()) {
    return false
  }

  clearPlantscNetSessionState()
  return true
}
