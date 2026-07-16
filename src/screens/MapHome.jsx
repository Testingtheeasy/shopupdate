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
  const { shops, session, getOwnerShop } = useApp()
  const navigate = useNavigate()
  const [center, setCenter] = useState(CHENNAI_CENTER)
  const [myLocation, setMyLocation] = useState(null)
  const [searchPlace, setSearchPlace] = useState(null)

  const ownerShop = session?.role === 'owner' ? getOwnerShop(session.ownerId) : null

  const goToMyShop = useCallback(() => {
    if (!ownerShop || typeof ownerShop.lat !== 'number') return
    setCenter({ lat: ownerShop.lat, lng: ownerShop.lng })
  }, [ownerShop])

  // Start at the visitor's real location instead of always defaulting to
  // Chennai for everyone regardless of where they actually are. Also drives
  // the blue "my location" dot on the map.
  const locateMe = useCallback(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setCenter(loc)
        setMyLocation(loc)
      },
      () => {},
      { timeout: 5000 }
    )
  }, [])

  useEffect(() => { locateMe() }, [locateMe])

  // Search only drops a pin and pans the map to it — it does NOT navigate
  // straight to the shop. The person taps the dropped pin (like any other
  // pin) to actually open details, same interaction everywhere on the map.
  const handlePlaceSelected = useCallback(
    (place) => {
      const lat = place.geometry?.location?.lat?.()
      const lng = place.geometry?.location?.lng?.()
      if (!lat || !lng) return
      setCenter({ lat, lng })

      const match = shops.find((s) => s.placeId === place.place_id)
      setSearchPlace({
        lat,
        lng,
        name: place.name,
        onClick: () => {
          if (match) navigate(`/shop/${match.placeId}`)
          else {
            navigate('/shop/unknown', {
              state: { placeId: place.place_id, name: place.name, address: place.formatted_address, lat, lng },
            })
          }
        },
      })
    },
    [shops, navigate]
  )

  const handlePinClick = useCallback((placeId) => navigate(`/shop/${placeId}`), [navigate])

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        shops={shops}
        center={center}
        myLocation={myLocation}
        searchMarker={searchPlace}
        onPinClick={handlePinClick}
      />
      <div className="absolute top-4 left-4 right-4 z-10">
        <SearchBar onPlaceSelected={handlePlaceSelected} />
      </div>
      {searchPlace && (
        <div className="absolute bottom-20 left-4 right-4 z-20 bg-white rounded-xl2 shadow-lg border border-ink/5 px-4 py-3 flex items-center justify-between">
          <p className="text-sm font-medium truncate pr-2">{searchPlace.name}</p>
          <button onClick={searchPlace.onClick} className="bg-accent text-white rounded-xl px-3.5 py-2 text-xs font-medium shrink-0">
            View
          </button>
        </div>
      )}

      <button
        onClick={locateMe}
        aria-label="Go to my location"
        className="absolute bottom-24 left-4 z-10 w-11 h-11 rounded-full bg-white shadow-lg border border-ink/10 flex items-center justify-center"
      >
        <span className="w-3 h-3 rounded-full bg-accent" />
      </button>

      {ownerShop && (
        <button
          onClick={goToMyShop}
          className="absolute bottom-24 left-[4.25rem] z-10 h-11 px-4 rounded-full bg-accent text-white shadow-lg flex items-center gap-2 text-sm font-medium"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M3 11l9-8 9 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 10v9a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1v-9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          My shop
        </button>
      )}

      <BottomNav ownerMode={session?.role === 'owner'} />
    </div>
  )
}
