import React, { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../AppContext.jsx'
import GoogleMap from '../components/GoogleMap.jsx'
import SearchBar from '../components/SearchBar.jsx'
import BottomNav from '../components/BottomNav.jsx'
import OwnerToggleWidget from '../components/OwnerToggleWidget.jsx'

const CHENNAI_CENTER = { lat: 13.0418, lng: 80.2341 }

export default function MapHome() {
  const { session, shops, confirmOpen, setOverride, startBreak, endBreakNow, getOwnerShop } = useApp()
  const navigate = useNavigate()
  const [center] = useState(CHENNAI_CENTER)

  const ownerShop = session.role === 'owner' ? getOwnerShop(session.ownerId) : null

  const handlePlaceSelected = useCallback(
    (place) => {
      const match = shops.find((s) => s.placeId === place.place_id)
      if (match) navigate(`/shop/${match.placeId}`)
      else {
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

      <div className="absolute top-4 left-4 right-4 z-10">
        <SearchBar onPlaceSelected={handlePlaceSelected} />
      </div>

      {ownerShop && (
        <OwnerToggleWidget
          shop={ownerShop}
          onConfirm={() => confirmOpen(ownerShop.placeId)}
          onNotOpeningToday={() => setOverride(ownerShop.placeId, 'today', 'closed')}
          onStartBreak={(minutes) => startBreak(ownerShop.placeId, minutes)}
          onEndBreak={() => endBreakNow(ownerShop.placeId)}
        />
      )}
      <BottomNav />
    </div>
  )
}
