import { toApiPath } from '@/app/base'

const MIN_EXPORT_WIDTH = 100

function getArticleFigurePageUrl() {
  if (typeof window === 'undefined') {
    return undefined
  }

  return window.location.href
}

export function normalizeArticleFigureExportWidth(value: number) {
  const width = Math.round(value)

  if (!Number.isFinite(width) || width < MIN_EXPORT_WIDTH) {
    return null
  }

  return width
}

export async function exportArticleFigurePng(width: number) {
  const normalizedWidth = normalizeArticleFigureExportWidth(width)
  if (normalizedWidth === null) {
    throw new Error(`PNG width must be an integer greater than or equal to ${MIN_EXPORT_WIDTH}.`)
  }

  const requestUrl = new URL(toApiPath('/article-figure/export.png'), window.location.origin)
  requestUrl.searchParams.set('width', String(normalizedWidth))

  const pageUrl = getArticleFigurePageUrl()
  if (pageUrl) {
    requestUrl.searchParams.set('pageUrl', pageUrl)
  }

  const response = await fetch(requestUrl.toString())
  if (!response.ok) {
    let message = 'Failed to export article figure PNG.'

    try {
      const payload = (await response.json()) as { error?: string }
      if (payload.error) {
        message = payload.error
      }
    } catch {
      const responseText = await response.text()
      if (responseText) {
        message = responseText
      }
    }

    throw new Error(message)
  }

  const blob = await response.blob()
  if (blob.size <= 0) {
    throw new Error('Exported PNG is empty.')
  }

  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = `plantscnet-article-figure-${normalizedWidth}w.png`
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
}
