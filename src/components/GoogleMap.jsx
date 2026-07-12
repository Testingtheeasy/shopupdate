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

export default function GoogleMap({ shops, center, myLocation, searchMarker, onPinClick }) {
  const ready = useGoogleReady()
  const mapDivRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const locationMarkerRef = useRef(null)
  const searchMarkerRef = useRef(null)

  useEffect(() => {
    if (!ready || !mapDivRef.current) return
    if (!mapRef.current) {
      mapRef.current = new window.google.maps.Map(mapDivRef.current, {
        center,
        zoom: 15,
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: { position: window.google.maps.ControlPosition.RIGHT_CENTER },
        styles: MAP_STYLE,
      })
    }
  }, [ready])

  // Pan to a new center whenever it changes (e.g. after a search selection) —
  // the effect above only sets it once at map creation.
  useEffect(() => {
    if (!mapRef.current || !center) return
    mapRef.current.panTo(center)
    mapRef.current.setZoom(16)
  }, [center])

  useEffect(() => {
    if (!ready || !mapRef.current) return
    // Clear old markers
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = shops
      .filter((shop) => typeof shop.lat === 'number' && typeof shop.lng === 'number' && !Number.isNaN(shop.lat) && !Number.isNaN(shop.lng))
      .map((shop) => {
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

  // "My location" blue dot — separate from shop pins, just a position indicator.
  useEffect(() => {
    if (!ready || !mapRef.current) return
    if (locationMarkerRef.current) locationMarkerRef.current.setMap(null)
    if (!myLocation) return
    locationMarkerRef.current = new window.google.maps.Marker({
      position: myLocation,
      map: mapRef.current,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#2C6E63',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 3,
      },
      title: 'Your location',
      zIndex: 999,
    })
  }, [ready, myLocation])

  // Searched-but-not-yet-selected place — a distinct highlighted pin the
  // user taps to open, instead of auto-navigating straight to details.
  useEffect(() => {
    if (!ready || !mapRef.current) return
    if (searchMarkerRef.current) searchMarkerRef.current.setMap(null)
    if (!searchMarker) return
    searchMarkerRef.current = new window.google.maps.Marker({
      position: { lat: searchMarker.lat, lng: searchMarker.lng },
      map: mapRef.current,
      icon: {
        url: pinIconUrl('search_result'),
        scaledSize: new window.google.maps.Size(50, 58),
        anchor: new window.google.maps.Point(25, 58),
      },
      title: searchMarker.name,
      animation: window.google.maps.Animation.DROP,
      zIndex: 1000,
    })
    searchMarkerRef.current.addListener('click', searchMarker.onClick)
  }, [ready, searchMarker])

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
