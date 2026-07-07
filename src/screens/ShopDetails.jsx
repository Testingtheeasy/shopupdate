import React from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../AppContext.jsx'
import { STATUS, STATUS_META } from '../mockData.js'
import { timeAgo, isStale } from '../lib/time.js'

export default function ShopDetails() {
  const { placeId } = useParams()
  const { state } = useLocation()
  const { shops } = useApp()
  const navigate = useNavigate()

  const shop = shops.find((s) => s.placeId === placeId) || null

  // Fallback for a place found via search that isn't in our DB yet.
  const display = shop || {
    name: state?.name || 'Unknown shop',
    address: state?.address || '',
    lat: state?.lat,
    lng: state?.lng,
    phone: null,
    status: STATUS.UNVERIFIED,
    note: '',
    updatedAt: null,
  }

  const stale = isStale(display.updatedAt)
  const effectiveStatus = stale && display.status !== STATUS.UNVERIFIED ? display.status : display.status
  const meta = STATUS_META[effectiveStatus]

  const navUrl = display.lat && display.lng
    ? `https://www.google.com/maps/dir/?api=1&destination=${display.lat},${display.lng}&destination_place_id=${placeId !== 'unknown' ? placeId : ''}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(display.name)}`

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-5 pb-3 border-b border-ink/10">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="#14231D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="font-display text-lg font-600 truncate">{display.name}</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        <div
          className="rounded-xl2 px-4 py-3.5 flex items-center justify-between"
          style={{ backgroundColor: meta.bg }}
        >
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
            <span className="font-medium text-sm" style={{ color: meta.color }}>
              {stale && display.status !== STATUS.UNVERIFIED ? 'Status may be outdated' : meta.label}
            </span>
          </div>
          <span className="text-xs text-ink/50">{timeAgo(display.updatedAt)}</span>
        </div>

        {display.note && (
          <p className="text-sm text-ink/70 leading-relaxed">{display.note}</p>
        )}

        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-ink/40 font-medium">Address</p>
          <p className="text-sm text-ink/80">{display.address || 'Address unavailable'}</p>
        </div>

        {display.phone && (
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-ink/40 font-medium">Phone</p>
            <a href={`tel:${display.phone}`} className="text-sm text-accent font-medium">
              {display.phone}
            </a>
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
