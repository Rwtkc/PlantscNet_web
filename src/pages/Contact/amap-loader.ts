import AMapLoader from '@amap/amap-jsapi-loader'
import type { ResolvedContactMapConfig } from './contact-map.config'

declare global {
  interface Window {
    _AMapSecurityConfig?: {
      securityJsCode?: string
    }
  }
}

export type AMapLngLatTuple = [number, number]

export interface AMapMouseEvent {
  lnglat: {
    getLng(): number
    getLat(): number
  }
}

export interface AMapMap {
  addControl(control: unknown): void
  destroy(): void
  on(eventName: 'click', handler: (event: AMapMouseEvent) => void): void
  setLayers(layers: unknown[]): void
  setCenter(center: AMapLngLatTuple): void
  setZoom(zoom: number): void
  setZoomAndCenter(zoom: number, center: AMapLngLatTuple): void
}

export interface AMapMarker {
  setMap(map: AMapMap | null): void
  setPosition(position: AMapLngLatTuple): void
}

export interface AMapInfoWindow {
  open(map: AMapMap, position: AMapLngLatTuple): void
  setContent(content: string): void
}

export interface AMapGeocoder {
  getAddress(
    location: AMapLngLatTuple,
    callback: (
      status: string,
      result: { regeocode?: { formattedAddress?: string } },
    ) => void,
  ): void
}

export interface AMapPlaceSearchResult {
  poiList?: {
    pois?: {
      location?:
        | {
            lng?: number
            lat?: number
          }
        | {
            getLng(): number
            getLat(): number
      }
      name?: string
      address?: string
    }[]
  }
}

export interface AMapPlaceSearch {
  getDetails(
    poiId: string,
    callback: (status: string, result: AMapPlaceSearchResult) => void,
  ): void
}

export interface AMapNamespace {
  Map: new (
    container: HTMLDivElement,
    options: {
      center: AMapLngLatTuple
      zoom: number
      resizeEnable: boolean
      viewMode: '2D' | '3D'
      mapStyle?: string
    },
  ) => AMapMap
  Marker: new (options: {
    position: AMapLngLatTuple
    title: string
    anchor?: string
  }) => AMapMarker
  InfoWindow: new (options: {
    content: string
    closeWhenClickMap?: boolean
    autoMove?: boolean
  }) => AMapInfoWindow
  Scale: new () => unknown
  ToolBar: new () => unknown
  Geocoder: new () => AMapGeocoder
  PlaceSearch: new (options?: { city?: string }) => AMapPlaceSearch
}

let amapPromise: Promise<AMapNamespace> | null = null

export async function loadAmapJsApi(config: ResolvedContactMapConfig) {
  if (!config.isConfigured || !config.key || !config.securityJsCode) {
    throw new Error(config.errorMessage ?? 'AMap JS API is not configured.')
  }

  window._AMapSecurityConfig = {
    securityJsCode: config.securityJsCode,
  }

  amapPromise ??= AMapLoader.load({
    key: config.key,
    version: '2.0',
    plugins: ['AMap.Scale', 'AMap.ToolBar', 'AMap.Geocoder', 'AMap.PlaceSearch'],
  }) as Promise<AMapNamespace>

  return amapPromise
}
