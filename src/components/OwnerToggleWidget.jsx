import React, { useState } from 'react'
import { STATUS, STATUS_META } from '../mockData.js'

const QUICK_OPTIONS = [
  { key: STATUS.OPEN, label: 'Open' },
  { key: STATUS.CLOSED_TEMP, label: 'Closed today' },
  { key: STATUS.OPENING_LATE, label: 'Opening late' },
  { key: STATUS.CLOSING_EARLY, label: 'Closing early' },
]

export default function OwnerToggleWidget({ shop, onUpdate, onConfirmOpening }) {
  const [expanded, setExpanded] = useState(false)
  const [time, setTime] = useState(shop.confirmedOpeningTime || '09:00')
  const meta = STATUS_META[shop.status]

  return (
    <div className="absolute bottom-20 left-4 right-4 z-20">
      <div className="bg-white rounded-xl2 shadow-xl shadow-ink/15 border border-ink/5 overflow-hidden">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3.5"
        >
          <div className="flex items-center gap-3">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: meta.color }}
            />
            <div className="text-left">
              <p className="text-sm font-medium text-ink">{shop.name}</p>
              <p className="text-xs text-ink/50">{meta.label} · tap to update</p>
            </div>
          </div>
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
          >
            <path d="M6 9l6 6 6-6" stroke="#9A9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {expanded && (
          <div className="px-4 pb-4 pt-1 grid grid-cols-2 gap-2">
            {QUICK_OPTIONS.map((opt) => {
              const active = shop.status === opt.key
              return (
                <button
                  key={opt.key}
                  onClick={() => {
                    onUpdate(opt.key)
                    setExpanded(false)
                  }}
                  className={`rounded-xl py-2.5 text-sm font-medium border transition-colors ${
                    active
                      ? 'bg-accent text-white border-accent'
                      : 'bg-paper text-ink/70 border-ink/10 active:bg-ink/5'
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}

            <div className="col-span-2 border-t border-ink/10 mt-1 pt-3">
              <p className="text-xs text-ink/50 mb-2">
                Not open yet? Confirm today's opening time so customers know it's real:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="flex-1 border border-ink/15 rounded-xl px-3 py-2 text-sm bg-paper outline-none focus:border-accent"
                />
                <button
                  onClick={() => onConfirmOpening(time)}
                  className="bg-accent text-white rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap"
                >
                  Confirm
                </button>
              </div>
              {shop.confirmedOpeningTime && (
                <p className="text-xs text-ink/40 mt-1.5">
                  Currently confirmed: opens {shop.confirmedOpeningTime}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
