import React, { useState } from 'react'
import { useApp } from '../AppContext.jsx'
import { STATUS, STATUS_META } from '../mockData.js'
import { timeAgo } from '../lib/time.js'
import BottomNav from '../components/BottomNav.jsx'

const ALL_OPTIONS = [
  { key: STATUS.OPEN, label: 'Open' },
  { key: STATUS.CLOSED_TEMP, label: 'Closed today' },
  { key: STATUS.OPENING_LATE, label: 'Opening late' },
  { key: STATUS.CLOSING_EARLY, label: 'Closing early' },
  { key: STATUS.CLOSED_PERM, label: 'Permanently closed' },
]

export default function Profile() {
  const { session, logout, getOwnerShop, updateShopStatus } = useApp()
  const [tomorrow, setTomorrow] = useState(STATUS.OPEN)

  const ownerShop = session.role === 'owner' ? getOwnerShop(session.ownerId) : null

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="px-5 pt-6 pb-4">
        <h1 className="font-display text-2xl font-600">Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 space-y-6">
        <div className="bg-white rounded-xl2 border border-ink/10 p-4">
          <p className="text-xs uppercase tracking-wide text-ink/40 font-medium mb-1">
            Signed in as
          </p>
          <p className="text-sm text-ink/80">{session.identifier}</p>
          <p className="text-xs text-ink/40 mt-1">
            {session.role === 'owner' ? 'Shop owner account' : 'Customer account'}
          </p>
        </div>

        {session.role === 'owner' && ownerShop && (
          <div className="bg-white rounded-xl2 border border-ink/10 p-4 space-y-4">
            <div>
              <p className="font-medium text-sm">{ownerShop.name}</p>
              <p className="text-xs text-ink/40">{timeAgo(ownerShop.updatedAt)}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-ink/40 font-medium mb-2">
                Today's status
              </p>
              <div className="grid grid-cols-2 gap-2">
                {ALL_OPTIONS.map((opt) => {
                  const active = ownerShop.status === opt.key
                  return (
                    <button
                      key={opt.key}
                      onClick={() => updateShopStatus(ownerShop.placeId, opt.key)}
                      className={`rounded-xl py-2.5 text-sm font-medium border transition-colors ${
                        active
                          ? 'bg-accent text-white border-accent'
                          : 'bg-paper text-ink/70 border-ink/10'
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-ink/40 font-medium mb-2">
                Set tomorrow's status in advance
              </p>
              <select
                value={tomorrow}
                onChange={(e) => setTomorrow(e.target.value)}
                className="w-full border border-ink/15 rounded-xl px-3 py-2.5 text-sm bg-paper outline-none focus:border-accent"
              >
                <option value={STATUS.OPEN}>Open as usual</option>
                <option value={STATUS.CLOSED_TEMP}>Closed</option>
                <option value={STATUS.OPENING_LATE}>Opening late</option>
              </select>
              <p className="text-xs text-ink/40 mt-2">
                This will auto-apply at midnight. (Simulated in this prototype.)
              </p>
            </div>
          </div>
        )}

        {session.role === 'user' && (
          <div className="bg-white rounded-xl2 border border-ink/10 p-4">
            <p className="text-sm text-ink/60">
              You'll see saved shops and notification preferences here in a future update.
            </p>
          </div>
        )}

        <button
          onClick={logout}
          className="w-full border border-ink/15 rounded-xl2 py-3 text-sm font-medium text-ink/70"
        >
          Log out
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
