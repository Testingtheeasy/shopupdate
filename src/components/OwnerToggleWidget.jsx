import React, { useState } from 'react'
import { STATUS, STATUS_META } from '../mockData.js'

const QUICK_OPTIONS = [
  { key: STATUS.OPEN, label: 'Open' },
  { key: STATUS.CLOSED_TEMP, label: 'Closed today' },
  { key: STATUS.OPENING_LATE, label: 'Opening late' },
  { key: STATUS.CLOSING_EARLY, label: 'Closing early' },
]

export default function OwnerToggleWidget({ shop, onUpdate }) {
  const [expanded, setExpanded] = useState(false)
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
          </div>
        )}
      </div>
    </div>
  )
}
