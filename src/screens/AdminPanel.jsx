import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../AppContext.jsx'

export default function AdminPanel() {
  const { session, isAdmin, shops, approveShop, rejectShop, logout } = useApp()
  const navigate = useNavigate()

  if (!session || !isAdmin) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-8 text-center">
        <p className="font-display text-lg font-600 mb-1">Not authorized</p>
        <p className="text-sm text-ink/60 mb-5">This screen is only visible to the admin account.</p>
        <button onClick={() => navigate('/')} className="text-accent text-sm font-medium">Back to map</button>
      </div>
    )
  }

  const pending = shops.filter((s) => s.verificationStatus === 'pending')
  const reviewed = shops.filter((s) => s.verificationStatus === 'verified' || s.verificationStatus === 'rejected')

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <h1 className="font-display text-2xl font-600">Admin review</h1>
        <button onClick={logout} aria-label="Log out" className="p-2 -mr-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="#14231D99" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 17l5-5-5-5M21 12H9" stroke="#14231D99" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-10 space-y-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink/40 font-medium mb-2">
            Pending review ({pending.length})
          </p>
          {pending.length === 0 && <p className="text-sm text-ink/40">Nothing waiting right now.</p>}
          <div className="space-y-3">
            {pending.map((shop) => (
              <div key={shop.placeId} className="bg-white rounded-xl2 border border-ink/10 p-4 space-y-2">
                <p className="font-medium text-sm">{shop.name}</p>
                <p className="text-xs text-ink/50">{shop.address}</p>
                <div className="text-xs text-ink/60 space-y-0.5 pt-1">
                  <p><b>Owner name:</b> {shop.ownerName || '—'}</p>
                  <p><b>Phone:</b> {shop.ownerPhone || '—'}</p>
                  <p><b>GST:</b> {shop.gstNumber || '—'}</p>
                  {shop.verificationNote && <p><b>Note:</b> {shop.verificationNote}</p>}
                  <p><b>Google phone on file:</b> {shop.phone || 'none'}</p>
                </div>
                <a
                  href={`https://www.google.com/maps/place/?q=place_id:${shop.placeId}`}
                  target="_blank" rel="noreferrer"
                  className="text-xs text-accent font-medium inline-block pt-1"
                >
                  View on Google Maps →
                </a>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => approveShop(shop.placeId)}
                    className="rounded-xl py-2.5 text-sm font-medium bg-open text-white"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => rejectShop(shop.placeId)}
                    className="rounded-xl py-2.5 text-sm font-medium bg-closed text-white"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-ink/40 font-medium mb-2">
            Already reviewed ({reviewed.length})
          </p>
          <div className="space-y-2">
            {reviewed.map((shop) => (
              <div key={shop.placeId} className="bg-white rounded-xl2 border border-ink/10 px-4 py-3 flex items-center justify-between">
                <p className="text-sm">{shop.name}</p>
                <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
                  shop.verificationStatus === 'verified' ? 'bg-openBg text-open' : 'bg-closedBg text-closed'
                }`}>
                  {shop.verificationStatus}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
