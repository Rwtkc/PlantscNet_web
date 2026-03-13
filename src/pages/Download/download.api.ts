import { toApiPath } from '@/app/base'
import { fetchJson } from '@/app/http'
import type { DownloadAssetsResponse } from './download.types'

export function fetchDownloadAssets(signal?: AbortSignal) {
  return fetchJson<DownloadAssetsResponse>(toApiPath('/download/assets'), {
    signal,
    errorMessage: 'Request failed while loading download assets.',
    parseErrorMessage: true,
  })
}
