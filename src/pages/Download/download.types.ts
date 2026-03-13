export interface DownloadAsset {
  key: string
  label: string
  description: string
  fileName: string
  available: boolean
  sizeBytes: number | null
  sizeLabel: string | null
  href: string | null
}

export interface DownloadSpeciesAssets {
  speciesId: string
  speciesLabel: string
  availableAssetCount: number
  assets: DownloadAsset[]
}

export interface DownloadAssetsResponse {
  species: DownloadSpeciesAssets[]
  assetTypes: Array<{
    key: string
    label: string
    fileName: string
  }>
}
