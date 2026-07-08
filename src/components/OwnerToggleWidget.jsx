import React, { useState } from 'react'
import { getDisplayStatus, DISPLAY_META, DISPLAY } from '../lib/statusEngine.js'

// Lives on the owner's map home screen — quick actions only.
// Full schedule editing and the "confirmed" summary/edit pattern live in Profile.
export default function OwnerToggleWidget({ shop, onConfirm, onNotOpeningToday, onStartBreak, onEndBreak }) {
  const [expanded, setExpanded] = useState(false)
  const display = getDisplayStatus(shop)
  const meta = DISPLAY_META[display]
  const onBreak = display === DISPLAY.ON_BREAK

  return (
    <div className="absolute bottom-20 left-4 right-4 z-20">
      <div className="bg-white rounded-xl2 shadow-xl shadow-ink/15 border border-ink/5 overflow-hidden">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3.5"
        >
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: meta.color, opacity: meta.opacity }} />
            <div className="text-left">
              <p className="text-sm font-medium text-ink">{shop.name}</p>
              <p className="text-xs text-ink/50">{meta.label} · tap to update</p>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>
            <path d="M6 9l6 6 6-6" stroke="#9A9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {expanded && (
          <div className="px-4 pb-4 pt-1 space-y-2">
            {onBreak ? (
              <button
                onClick={() => { onEndBreak(); setExpanded(false) }}
                className="w-full rounded-xl py-2.5 text-sm font-medium bg-accent text-white"
              >
                End break now
              </button>
            ) : (
              <>
                <button
                  onClick={() => { onConfirm(); setExpanded(false) }}
                  className="w-full rounded-xl py-2.5 text-sm font-medium bg-accent text-white"
                >
                  I'm open
                </button>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => { onStartBreak(10); setExpanded(false) }}
                          className="rounded-xl py-2 text-xs font-medium border border-ink/10 text-ink/70 bg-paper">
                    Break 10m
                  </button>
                  <button onClick={() => { onStartBreak(30); setExpanded(false) }}
                          className="rounded-xl py-2 text-xs font-medium border border-ink/10 text-ink/70 bg-paper">
                    Break 30m
                  </button>
                  <button onClick={() => { onNotOpeningToday(); setExpanded(false) }}
                          className="rounded-xl py-2 text-xs font-medium border border-closed/30 text-closed bg-closedBg">
                    Closed today
                  </button>
                </div>
              </>
            )}
            <p className="text-[11px] text-ink/40 text-center pt-1">
              Full schedule &amp; reminder settings are in your Profile tab.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
