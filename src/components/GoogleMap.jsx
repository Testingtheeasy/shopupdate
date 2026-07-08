import React, { useEffect, useRef } from 'react'
import { pinIconUrl } from '../lib/pinIcon.js'
import { getDisplayStatus } from '../lib/statusEngine.js'

// Waits for the Google Maps JS script (loaded in index.html) to be ready.
function useGoogleReady() {
  const [ready, setReady] = React.useState(!!window.google?.maps)
  useEffect(() => {
    if (ready) return
    const id = setInterval(() => {
      if (window.google?.maps) {
        setReady(true)
        clearInterval(id)
      }
    }, 200)
    return () => clearInterval(id)
  }, [ready])
  return ready
}

export default function GoogleMap({ shops, center, onPinClick }) {
  const ready = useGoogleReady()
  const mapDivRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])

  useEffect(() => {
    if (!ready || !mapDivRef.current) return
    if (!mapRef.current) {
      mapRef.current = new window.google.maps.Map(mapDivRef.current, {
        center,
        zoom: 15,
        disableDefaultUI: true,
        zoomControl: true,
        styles: MAP_STYLE,
      })
    }
  }, [ready, center])

  useEffect(() => {
    if (!ready || !mapRef.current) return
    // Clear old markers
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = shops.map((shop) => {
      const displayStatus = getDisplayStatus(shop)
      const marker = new window.google.maps.Marker({
        position: { lat: shop.lat, lng: shop.lng },
        map: mapRef.current,
        icon: {
          url: pinIconUrl(displayStatus),
          scaledSize: new window.google.maps.Size(44, 50),
          anchor: new window.google.maps.Point(22, 50),
        },
        title: shop.name,
      })
      marker.addListener('click', () => onPinClick(shop.placeId))
      return marker
    })
  }, [ready, shops, onPinClick])

  if (!ready) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-unverifiedBg text-ink/50 text-sm">
        Loading map…
      </div>
    )
  }

  return <div ref={mapDivRef} className="w-full h-full" />
}

// A quiet, warm map theme instead of default Google blue/grey — matches the app palette.
const MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#F7F5EF' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5b5548' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#F7F5EF' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#EFEBE0' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#DCE9E5' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
]
