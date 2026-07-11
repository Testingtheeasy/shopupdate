import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../AppContext.jsx'
import GoogleMap from '../components/GoogleMap.jsx'
import SearchBar from '../components/SearchBar.jsx'
import BottomNav from '../components/BottomNav.jsx'

const CHENNAI_CENTER = { lat: 13.0418, lng: 80.2341 } // fallback only, if geolocation is unavailable/denied

// Map is read-only for everyone, including owners — no edit controls live
// here. Owners manage their shop entirely from the Shop Update tab.
export default function MapHome() {
  const { shops, session } = useApp()
  const navigate = useNavigate()
  const [center, setCenter] = useState(CHENNAI_CENTER)

  // Start at the visitor's real location instead of always defaulting to
  // Chennai for everyone regardless of where they actually are.
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}, // silently keep the fallback on denial/error
      { timeout: 5000 }
    )
  }, [])

  const handlePlaceSelected = useCallback(
    (place) => {
      const lat = place.geometry?.location?.lat?.()
      const lng = place.geometry?.location?.lng?.()
      if (lat && lng) setCenter({ lat, lng })

      const match = shops.find((s) => s.placeId === place.place_id)
      if (match) navigate(`/shop/${match.placeId}`)
      else {
        navigate(`/shop/unknown`, {
          state: {
            placeId: place.place_id,
            name: place.name,
            address: place.formatted_address,
            lat,
            lng,
          },
        })
      }
    },
    [shops, navigate]
  )

  const handlePinClick = useCallback((placeId) => navigate(`/shop/${placeId}`), [navigate])

  return (
    <div className="relative w-full h-full">
      <GoogleMap shops={shops} center={center} onPinClick={handlePinClick} />
      <div className="absolute top-4 left-4 right-4 z-10">
        <SearchBar onPlaceSelected={handlePlaceSelected} />
      </div>
      <BottomNav ownerMode={session?.role === 'owner'} />
    </div>
  )
}
