import React from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../AppContext.jsx'
import { getDisplayStatus, DISPLAY_META, DISPLAY } from '../lib/statusEngine.js'

export default function ShopDetails() {
  const { placeId } = useParams()
  const { state } = useLocation()
  const { shops } = useApp()
  const navigate = useNavigate()

  const shop = shops.find((s) => s.placeId === placeId) || null

  const display = shop ? getDisplayStatus(shop) : DISPLAY.UNVERIFIED
  const meta = DISPLAY_META[display]

  const name = shop?.name || state?.name || 'Unknown shop'
  const address = shop?.address || state?.address || ''
  const lat = shop?.lat ?? state?.lat
  const lng = shop?.lng ?? state?.lng
  const phone = shop?.phone

  const navUrl = lat && lng
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${placeId !== 'unknown' ? placeId : ''}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-5 pb-3 border-b border-ink/10">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="#14231D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="font-display text-lg font-600 truncate">{name}</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        <div className="rounded-xl2 px-4 py-3.5 flex items-center gap-2.5" style={{ backgroundColor: meta.bg }}>
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: meta.color, opacity: meta.opacity }} />
          <span className="font-medium text-sm" style={{ color: meta.color }}>{meta.label}</span>
        </div>

        {shop?.schedule && (
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-ink/40 font-medium">Usual hours</p>
            <p className="text-sm text-ink/80">{shop.schedule.openTime} – {shop.schedule.closeTime}</p>
            {shop.schedule.hasBreak && shop.schedule.breaks[0] && (
              <p className="text-xs text-ink/45">Break {shop.schedule.breaks[0].start} – {shop.schedule.breaks[0].end}</p>
            )}
          </div>
        )}

        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-ink/40 font-medium">Address</p>
          <p className="text-sm text-ink/80">{address || 'Address unavailable'}</p>
        </div>

        {phone && (
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-ink/40 font-medium">Phone</p>
            <a href={`tel:${phone}`} className="text-sm text-accent font-medium">{phone}</a>
          </div>
        )}

        {!shop && (
          <p className="text-xs text-ink/40 italic">
            This shop isn't in our verified database yet — status shown is unverified. Only the owner can add live status.
          </p>
        )}
      </div>

      <div className="p-4 border-t border-ink/10">
        <a
          href={navUrl}
          target="_blank"
          rel="noreferrer"
          className="w-full bg-accent text-white rounded-xl2 py-3.5 font-medium text-base flex items-center justify-center gap-2 active:bg-accentDark transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M3 11l18-7-7 18-2-8-9-3z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
          Navigate in Google Maps
        </a>
      </div>
    </div>
  )
}
