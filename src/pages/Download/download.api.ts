import type { DownloadAssetsResponse } from './download.types'

async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init)

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`

    try {
      const payload = (await response.json()) as { error?: string }
      if (payload.error) {
        message = payload.error
      }
    } catch {
      // Keep default message when the response body is not JSON.
    }

    throw new Error(message)
  }

  return (await response.json()) as T
}

export function fetchDownloadAssets(signal?: AbortSignal) {
  return fetchJson<DownloadAssetsResponse>('/api/download/assets', { signal })
}
