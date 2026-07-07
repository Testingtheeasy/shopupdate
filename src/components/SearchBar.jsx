import React, { useEffect, useRef } from 'react'

export default function SearchBar({ onPlaceSelected }) {
  const inputRef = useRef(null)

  useEffect(() => {
    if (!window.google?.maps?.places || !inputRef.current) return
    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ['place_id', 'name', 'geometry', 'formatted_address'],
    })
    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      if (place?.place_id) onPlaceSelected(place)
    })
    return () => window.google.maps.event.removeListener(listener)
  }, [onPlaceSelected])

  return (
    <div className="absolute top-4 left-4 right-4 z-10">
      <div className="bg-white rounded-xl2 shadow-lg shadow-ink/10 flex items-center px-4 py-3 gap-2 border border-ink/5">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-ink/40">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search a shop, e.g. Pothys Swarna Mahal"
          className="w-full outline-none text-[15px] placeholder:text-ink/35"
        />
      </div>
    </div>
  )
}
