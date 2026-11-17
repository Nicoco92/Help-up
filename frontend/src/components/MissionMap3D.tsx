import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Map, { Marker, NavigationControl, Popup, type MapRef } from 'react-map-gl/maplibre'
import {
  LngLatBounds,
  setWorkerUrl,
  type FillExtrusionLayerSpecification,
  type Map as MapLibreMap,
} from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Mission } from '../types/mission'
import { MissionPopupContent } from './MissionPopupContent'

const mapStyle = 'https://tiles.openfreemap.org/styles/bright'
const buildingsLayerId = 'helpup-3d-buildings'

setWorkerUrl(workerUrl)

function formatReward(value: number) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value / 100)
}

// Mouvement réduit demandé par le système : la carte se place sans animation (WCAG 2.3.3 AAA)
function motionDuration(ms: number) {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : ms
}

function addBuildingsLayer(map: MapLibreMap) {
  if (map.getLayer(buildingsLayerId) || !map.getSource('openmaptiles')) return

  const firstSymbolLayer = map.getStyle().layers?.find((layer) => layer.type === 'symbol')?.id
  const layer: FillExtrusionLayerSpecification = {
    id: buildingsLayerId,
    type: 'fill-extrusion',
    source: 'openmaptiles',
    'source-layer': 'building',
    minzoom: 14,
    filter: ['all', ['has', 'render_height'], ['>', ['get', 'render_height'], 0]],
    paint: {
      'fill-extrusion-color': '#cbdccf',
      'fill-extrusion-height': ['get', 'render_height'],
      'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
      'fill-extrusion-opacity': 0.9,
      'fill-extrusion-vertical-gradient': true,
    },
  }

  if (firstSymbolLayer) map.addLayer(layer, firstSymbolLayer)
  else map.addLayer(layer)
}

export function MissionMap3D({
  missions,
  highlightedId,
  onHover,
}: {
  missions: Mission[]
  highlightedId: string | null
  onHover: (id: string | null) => void
}) {
  const mapRef = useRef<MapRef>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const positions = useMemo(
    () =>
      missions.map(
        (mission) => [mission.location.coordinates[0], mission.location.coordinates[1]] as [number, number],
      ),
    [missions],
  )
  const selectedMission = missions.find((mission) => mission.id === selectedId)

  const handleLoad = useCallback(() => {
    setMapLoaded(true)
  }, [])

  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map || !mapLoaded) return
    addBuildingsLayer(map)
    map.easeTo({ pitch: 55, bearing: -18, duration: motionDuration(650) })
  }, [mapLoaded])

  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map || !mapLoaded || positions.length === 0) return

    if (positions.length === 1) {
      map.flyTo({ center: positions[0], zoom: 15, duration: motionDuration(500) })
      return
    }

    const bounds = positions.reduce(
      (result, position) => result.extend(position),
      new LngLatBounds(positions[0], positions[0]),
    )
    map.fitBounds(bounds, { padding: 48, maxZoom: 14, duration: motionDuration(500) })
  }, [mapLoaded, positions])

  return (
    <div className="maplibre-view">
      <Map
        ref={mapRef}
        mapStyle={mapStyle}
        initialViewState={{
          longitude: 2.35,
          latitude: 48.827,
          zoom: 13,
          pitch: 55,
          bearing: -18,
        }}
        style={{ width: '100%', height: '100%' }}
        onLoad={handleLoad}
        onClick={() => setSelectedId(null)}
      >
        <NavigationControl position="bottom-right" visualizePitch />
        {missions.map((mission) => {
          const longitude = mission.location.coordinates[0]
          const latitude = mission.location.coordinates[1]
          const ariaLabel = `${mission.title}, ${formatReward(mission.rewardCents)} euros, ${mission.quartierLabel}`
          const classes = [
            'price-marker',
            'maplibre-price-marker',
            mission.urgent ? 'is-urgent' : '',
            highlightedId === mission.id ? 'is-highlighted' : '',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <Marker key={mission.id} longitude={longitude} latitude={latitude} anchor="center">
              <button
                type="button"
                className={classes}
                title={ariaLabel}
                aria-label={ariaLabel}
                aria-pressed={selectedId === mission.id}
                onClick={(event) => {
                  event.stopPropagation()
                  setSelectedId(mission.id)
                }}
                onMouseEnter={() => onHover(mission.id)}
                onMouseLeave={() => onHover(null)}
                onFocus={() => onHover(mission.id)}
                onBlur={() => onHover(null)}
              >
                {formatReward(mission.rewardCents)} €
              </button>
            </Marker>
          )
        })}
        {selectedMission && (
          <Popup
            longitude={selectedMission.location.coordinates[0]}
            latitude={selectedMission.location.coordinates[1]}
            anchor="bottom"
            offset={24}
            closeButton={false}
            closeOnClick={false}
            onClose={() => setSelectedId(null)}
          >
            <MissionPopupContent mission={selectedMission} onClose={() => setSelectedId(null)} />
          </Popup>
        )}
      </Map>
    </div>
  )
}
