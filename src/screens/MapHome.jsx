import React, { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../AppContext.jsx'
import GoogleMap from '../components/GoogleMap.jsx'
import SearchBar from '../components/SearchBar.jsx'
import BottomNav from '../components/BottomNav.jsx'
import OwnerToggleWidget from '../components/OwnerToggleWidget.jsx'

const CHENNAI_CENTER = { lat: 13.0418, lng: 80.2341 }

export default function MapHome() {
  const { session, shops, updateShopStatus, confirmOpeningTime, getOwnerShop, logout } = useApp()
  const navigate = useNavigate()
  const [center] = useState(CHENNAI_CENTER)

  const ownerShop = session.role === 'owner' ? getOwnerShop(session.ownerId) : null

  const handlePlaceSelected = useCallback(
    (place) => {
      const match = shops.find((s) => s.placeId === place.place_id)
      if (match) navigate(`/shop/${match.placeId}`)
      else {
        // Not in our DB yet — still useful: show it as unverified via place details screen.
        navigate(`/shop/unknown`, {
          state: {
            placeId: place.place_id,
            name: place.name,
            address: place.formatted_address,
            lat: place.geometry?.location?.lat?.(),
            lng: place.geometry?.location?.lng?.(),
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

      <div className="absolute top-4 left-4 right-4 z-10 flex items-center gap-2">
        <SearchBar onPlaceSelected={handlePlaceSelected} />
        <button
          onClick={logout}
          aria-label="Log out"
          className="shrink-0 bg-white rounded-full w-11 h-11 flex items-center justify-center shadow-lg border border-ink/5"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="#14231D99" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 17l5-5-5-5M21 12H9" stroke="#14231D99" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {ownerShop && (
        <OwnerToggleWidget
          shop={ownerShop}
          onUpdate={(status) => updateShopStatus(ownerShop.placeId, status)}
          onConfirmOpening={(time) => confirmOpeningTime(ownerShop.placeId, time)}
        />
      )}
      <BottomNav />
    </div>
  )
}
