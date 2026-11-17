import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { Box, Map as MapIcon } from 'lucide-react'
import type { Mission } from '../types/mission'
import { Button } from './Button'
import { MissionPopupContent } from './MissionPopupContent'

const MissionMap3D = lazy(() =>
  import('./MissionMap3D').then((module) => ({ default: module.MissionMap3D })),
)

function formatReward(value: number) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value / 100)
}

function ResizeMap() {
  const map = useMap()

  useEffect(() => {
    const container = map.getContainer()
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(container)
    return () => observer.disconnect()
  }, [map])

  return null
}

function FitMissions({ missions }: { missions: Mission[] }) {
  const map = useMap()
  const positions = useMemo(
    () =>
      missions.map(
        (mission) => [mission.location.coordinates[1], mission.location.coordinates[0]] as [number, number],
      ),
    [missions],
  )

  useEffect(() => {
    if (positions.length === 1) {
      map.setView(positions[0], 14)
    } else if (positions.length > 1) {
      map.fitBounds(positions, { padding: [36, 36], maxZoom: 14 })
    }
  }, [map, positions])

  return null
}

function missionIcon(mission: Mission) {
  const classes = ['price-marker', mission.urgent ? 'is-urgent' : ''].filter(Boolean).join(' ')
  const icon = L.divIcon({
    className: 'price-marker-container',
    html: `<span class="${classes}">${formatReward(mission.rewardCents)} €</span>`,
    iconSize: [76, 34],
    iconAnchor: [38, 17],
  })
  return icon
}

function LeafletMissionMarker({
  mission,
  highlighted,
  onHover,
}: {
  mission: Mission
  highlighted: boolean
  onHover: (id: string | null) => void
}) {
  const markerRef = useRef<L.Marker>(null)
  const icon = useMemo(() => missionIcon(mission), [mission])

  useEffect(() => {
    const marker = markerRef.current?.getElement()?.querySelector('.price-marker')
    marker?.classList.toggle('is-highlighted', highlighted)
  }, [highlighted])

  const position: [number, number] = [
    mission.location.coordinates[1],
    mission.location.coordinates[0],
  ]
  const ariaLabel = `${mission.title}, ${formatReward(mission.rewardCents)} euros, ${mission.quartierLabel}`

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={icon}
      title={ariaLabel}
      alt={ariaLabel}
      eventHandlers={{
        mouseover: () => onHover(mission.id),
        mouseout: () => onHover(null),
      }}
    >
      <LeafletMissionPopup mission={mission} />
    </Marker>
  )
}

function LeafletMissionPopup({ mission }: { mission: Mission }) {
  const map = useMap()
  return (
    <Popup closeButton={false}>
      <MissionPopupContent mission={mission} onClose={() => map.closePopup()} />
    </Popup>
  )
}

function LeafletMapView({
  missions,
  highlightedId,
  onHover,
}: {
  missions: Mission[]
  highlightedId: string | null
  onHover: (id: string | null) => void
}) {
  return (
    <MapContainer center={[48.827, 2.35]} zoom={12} scrollWheelZoom>
      <ResizeMap />
      <FitMissions missions={missions} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {missions.map((mission) => (
        <LeafletMissionMarker
          key={mission.id}
          mission={mission}
          highlighted={highlightedId === mission.id}
          onHover={onHover}
        />
      ))}
    </MapContainer>
  )
}

export function MissionMap({
  missions,
  highlightedId,
  onHover,
}: {
  missions: Mission[]
  highlightedId: string | null
  onHover: (id: string | null) => void
}) {
  const [dimension, setDimension] = useState<'2d' | '3d'>('2d')

  return (
    <div className="map-frame" id="explore-map" aria-label="Carte des missions">
      <div className="map-mode-control" role="group" aria-label="Perspective de la carte">
        <Button
          variant={dimension === '2d' ? 'primary' : 'secondary'}
          size="sm"
          icon={<MapIcon size={16} />}
          aria-pressed={dimension === '2d'}
          onClick={() => setDimension('2d')}
        >
          2D
        </Button>
        <Button
          variant={dimension === '3d' ? 'primary' : 'secondary'}
          size="sm"
          icon={<Box size={16} />}
          aria-pressed={dimension === '3d'}
          onClick={() => setDimension('3d')}
        >
          3D
        </Button>
      </div>
      {dimension === '2d' ? (
        <LeafletMapView missions={missions} highlightedId={highlightedId} onHover={onHover} />
      ) : (
        <Suspense fallback={<div className="map-mode-loading" role="status">Chargement de la carte 3D…</div>}>
          <MissionMap3D missions={missions} highlightedId={highlightedId} onHover={onHover} />
        </Suspense>
      )}
      {missions.length === 0 && <p className="map-empty">Les missions apparaîtront ici.</p>}
    </div>
  )
}
