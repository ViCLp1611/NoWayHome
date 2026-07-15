import { useEffect, useMemo } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { MapPin } from 'lucide-react'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const DEFAULT_CENTER = [19.4326, -99.1332]
const DEFAULT_ZOOM = 13
const FOCUSED_ZOOM = 16

function toCoordinate(value) {
  if (value === null || value === undefined || value === '') return null
  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) ? parsedValue : null
}

function MapAutoCenter({ position }) {
  const map = useMap()

  useEffect(() => {
    if (position) {
      map.flyTo(position, FOCUSED_ZOOM, { duration: 1 })
    }
  }, [map, position])

  return null
}

function MapController({ editable, onChange }) {
  useMapEvents({
    click(event) {
      if (!editable || !onChange) return
      onChange({
        latitud: Number(event.latlng.lat.toFixed(8)),
        longitud: Number(event.latlng.lng.toFixed(8)),
      })
    },
  })

  return null
}

export function PropertyLocationMap({
  latitud,
  longitud,
  editable = false,
  onChange,
  className = '',
}) {
  const latitude = toCoordinate(latitud)
  const longitude = toCoordinate(longitud)
  const hasCoordinates = latitude !== null && longitude !== null
  const position = useMemo(
    () => (hasCoordinates ? [latitude, longitude] : null),
    [hasCoordinates, latitude, longitude]
  )
  const center = position || DEFAULT_CENTER

  const markerHandlers = useMemo(
    () => ({
      dragend(event) {
        if (!editable || !onChange) return
        const nextPosition = event.target.getLatLng()
        onChange({
          latitud: Number(nextPosition.lat.toFixed(8)),
          longitud: Number(nextPosition.lng.toFixed(8)),
        })
      },
    }),
    [editable, onChange]
  )

  if (!editable && !hasCoordinates) {
    return (
      <div
        className={`flex min-h-[260px] items-center justify-center rounded-xl border border-[#6B8E23]/15 bg-[#F2E8CF]/55 text-[#5F5F5F] ${className}`}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <MapPin className="h-6 w-6 text-[#A67C52]" />
          <p className="font-medium">Ubicación no disponible</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`min-h-[260px] overflow-hidden rounded-xl border border-[#6B8E23]/15 bg-white ${className}`}
    >
      <MapContainer
        center={center}
        zoom={position ? DEFAULT_ZOOM : 5}
        scrollWheelZoom={editable}
        className="h-[260px] w-full md:h-[320px]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapAutoCenter position={position} />
        <MapController editable={editable} onChange={onChange} />
        {position && (
          <Marker position={position} draggable={editable} eventHandlers={markerHandlers} />
        )}
      </MapContainer>
    </div>
  )
}
