const rawBaseUrl = import.meta.env.BASE_URL || '/'
const defaultProductionApiOrigin = 'http://218.29.54.90:1116'
const rawApiOrigin =
  import.meta.env.VITE_PUBLIC_API_ORIGIN ||
  (import.meta.env.DEV ? '' : defaultProductionApiOrigin)

export const appBaseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl : `${rawBaseUrl}/`
export const appBasePath =
  appBaseUrl === '/' ? '' : appBaseUrl.endsWith('/') ? appBaseUrl.slice(0, -1) : appBaseUrl
export const publicApiOrigin = rawApiOrigin.endsWith('/')
  ? rawApiOrigin.slice(0, -1)
  : rawApiOrigin

export function toAppPath(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (!appBasePath) {
    return normalizedPath
  }

  return `${appBasePath}${normalizedPath}`
}

export function toAssetPath(assetName: string) {
  const normalizedAssetName = assetName.replace(/^\/+/, '')
  return `${appBaseUrl}${normalizedAssetName}`
}

export function toHashAppPath(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const basePrefix = appBasePath ? `${appBasePath}/` : '/'
  return `${basePrefix}#${normalizedPath}`
}

export function getCurrentHashPath() {
  if (typeof window === 'undefined') {
    return '/'
  }

  const rawHash = window.location.hash.replace(/^#/, '')
  if (!rawHash) {
    return '/'
  }

  return rawHash.startsWith('/') ? rawHash : `/${rawHash}`
}

export function toApiPath(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (publicApiOrigin) {
    return `${publicApiOrigin}/api${normalizedPath}`
  }

  return toAppPath(`/api${normalizedPath}`)
}

export function resolveApiHref(href: string) {
  if (/^https?:\/\//i.test(href)) {
    return href
  }

  if (href.startsWith('/api/')) {
    return publicApiOrigin ? `${publicApiOrigin}${href}` : href
  }

  return href
}
