const rawBaseUrl = import.meta.env.BASE_URL || '/'
const rawApiOrigin =
  import.meta.env.VITE_PUBLIC_API_ORIGIN ||
  ''

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

export function getCurrentAppPath() {
  if (typeof window === 'undefined') {
    return '/'
  }

  const currentPath = window.location.pathname

  if (appBasePath && currentPath.startsWith(appBasePath)) {
    const pathWithoutBase = currentPath.slice(appBasePath.length)
    return pathWithoutBase.startsWith('/') ? pathWithoutBase : `/${pathWithoutBase}`
  }

  return currentPath || '/'
}

export function toAssetPath(assetName: string) {
  const normalizedAssetName = assetName.replace(/^\/+/, '')
  return `${appBaseUrl}${normalizedAssetName}`
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
