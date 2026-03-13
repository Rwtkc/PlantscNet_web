import { startTransition, useEffect, useMemo, useRef, useState } from 'react'
import { loadAmapJsApi, type AMapMap } from './amap-loader'
import {
  buildContactMapInfoContent,
  contactLocation,
  resolveContactMapConfig,
} from './contact-map.config'

function extractLngLat(
  location:
    | {
        lng?: number
        lat?: number
      }
    | {
        getLng(): number
        getLat(): number
      }
    | undefined,
): [number, number] | null {
  if (!location) {
    return null
  }

  if ('getLng' in location && 'getLat' in location) {
    return [location.getLng(), location.getLat()]
  }

  if (typeof location.lng === 'number' && typeof location.lat === 'number') {
    return [location.lng, location.lat]
  }

  return null
}

export function ContactLocationMap() {
  const mapConfig = useMemo(() => resolveContactMapConfig(), [])
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const isDisposedRef = useRef(false)
  const [mapStatus, setMapStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    mapConfig.isConfigured ? 'idle' : 'error',
  )
  const [displayCoordinates, setDisplayCoordinates] = useState(contactLocation.coordinates)

  useEffect(() => {
    if (!mapConfig.isConfigured || !mapContainerRef.current) {
      return
    }

    isDisposedRef.current = false
    let map: AMapMap | null = null

    function shouldIgnoreUpdates() {
      return isDisposedRef.current
    }

    async function initializeMap() {
      setMapStatus('loading')

      try {
        const AMap = await loadAmapJsApi(mapConfig)

        if (shouldIgnoreUpdates() || !mapContainerRef.current) {
          return
        }

        const center: [number, number] = [
          contactLocation.coordinates.lng,
          contactLocation.coordinates.lat,
        ]

        const mapInstance = new AMap.Map(mapContainerRef.current, {
          center,
          zoom: contactLocation.zoom,
          resizeEnable: true,
          viewMode: '2D',
        })
        map = mapInstance

        mapInstance.addControl(new AMap.Scale())
        mapInstance.addControl(new AMap.ToolBar())

        const marker = new AMap.Marker({
          position: center,
          title: contactLocation.name,
          anchor: 'bottom-center',
        })
        marker.setMap(mapInstance)

        const infoWindow = new AMap.InfoWindow({
          content: buildContactMapInfoContent(),
          closeWhenClickMap: false,
          autoMove: false,
        })

        const geocoder = new AMap.Geocoder()
        const placeSearch = new AMap.PlaceSearch()

        placeSearch.getDetails(contactLocation.poiId, (status, result) => {
          if (shouldIgnoreUpdates() || status !== 'complete') {
            return
          }

          const poi = result.poiList?.pois?.[0]
          const resolvedPosition = extractLngLat(poi?.location)

          if (!poi || !resolvedPosition) {
            return
          }

          marker.setPosition(resolvedPosition)
          mapInstance.setZoomAndCenter(contactLocation.zoom, resolvedPosition)
          setDisplayCoordinates({
            lng: resolvedPosition[0],
            lat: resolvedPosition[1],
          })

          const detailAddress = [poi.name, poi.address]
            .filter((value): value is string => Boolean(value?.trim()))
            .join(' | ')

          infoWindow.setContent(buildContactMapInfoContent(detailAddress || contactLocation.address))
        })

        mapInstance.on('click', (event) => {
          const position: [number, number] = [event.lnglat.getLng(), event.lnglat.getLat()]

          geocoder.getAddress(position, (status, result) => {
            if (shouldIgnoreUpdates()) {
              return
            }

            if (status !== 'complete') {
              startTransition(() => {
                setMapStatus('ready')
              })
              return
            }

            const resolvedAddress = result.regeocode?.formattedAddress?.trim() ?? null

            infoWindow.setContent(buildContactMapInfoContent(resolvedAddress))
            infoWindow.open(mapInstance, position)

            startTransition(() => {
              setMapStatus('ready')
            })
          })
        })

        if (!shouldIgnoreUpdates()) {
          setMapStatus('ready')
        }
      } catch (error) {
        if (!shouldIgnoreUpdates()) {
          setMapStatus('error')
          console.error(
            error instanceof Error ? error.message : 'Failed to load the AMap JS API.',
          )
        }
      }
    }

    void initializeMap()

    return () => {
      isDisposedRef.current = true
      map?.destroy()
    }
  }, [mapConfig])

  return (
    <section className="extra-card fade-rise contact-map-card">
      <div className="contact-map-card__header">
        <div>
          <h2>Location</h2>
          <p>{contactLocation.name}</p>
        </div>
        <span className="contact-map-card__coords">
          {displayCoordinates.lat.toFixed(6)}, {displayCoordinates.lng.toFixed(6)}
        </span>
      </div>

      <div className="contact-map-card__frame">
        {mapConfig.isConfigured ? (
          <>
            <div
              ref={mapContainerRef}
              className="contact-map-card__canvas"
              aria-label={`Interactive map centered on ${contactLocation.name}`}
            />
            {mapStatus !== 'ready' ? (
              <div className="contact-map-card__overlay" aria-live="polite">
                {mapStatus === 'loading' ? 'Loading interactive map...' : 'Preparing map...'}
              </div>
            ) : null}
          </>
        ) : (
          <div className="contact-map-card__fallback" role="status">
            <p className="contact-map-card__fallback-title">Interactive map unavailable</p>
            <p>{mapConfig.errorMessage}</p>
            <p>Add the AMap JS API key and security code to the frontend env, then reload.</p>
          </div>
        )}
      </div>
    </section>
  )
}
