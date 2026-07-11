import React, { useEffect, useRef, useState } from 'react'
import { useApp } from '../AppContext.jsx'

export default function ClaimShopSearch({ ownerId }) {
  const { claimShop } = useApp()
  const inputRef = useRef(null)
  const [claiming, setClaiming] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!window.google?.maps?.places || !inputRef.current) return
    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ['place_id', 'name', 'geometry', 'formatted_address'],
    })
    const listener = autocomplete.addListener('place_changed', async () => {
      const place = autocomplete.getPlace()
      if (!place?.place_id) return
      setClaiming(true)
      setError('')
      try {
        await claimShop(ownerId, place)
      } catch (err) {
        console.error('claimShop failed:', err)
        setError(`Could not link this shop — ${err.code || err.message || 'unknown error'}`)
        setClaiming(false)
      }
    })
    return () => window.google.maps.event.removeListener(listener)
  }, [ownerId, claimShop])

  return (
    <div className="bg-white rounded-xl2 border border-ink/10 p-5 text-center">
      <p className="font-display text-lg font-600 mb-1">Link your shop</p>
      <p className="text-sm text-ink/60 mb-4">
        Search for your shop exactly as it appears on Google Maps — this connects
        your account to that real listing so customers see your live status.
      </p>
      <div className="bg-paper rounded-xl2 border border-ink/10 flex items-center px-4 py-3 gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-ink/40">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          disabled={claiming}
          placeholder={claiming ? 'Linking…' : 'Search your shop name'}
          className="w-full outline-none text-[15px] bg-transparent placeholder:text-ink/35 disabled:opacity-50"
        />
      </div>
      {error && <p className="text-xs text-closed mt-2">{error}</p>}
      <p className="text-[11px] text-ink/35 mt-3">
        Don't see it? Make sure your business is listed on Google Maps first, then try again here.
      </p>
    </div>
  )
}
