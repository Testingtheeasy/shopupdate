import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../AppContext.jsx'
import { getDisplayStatus, DISPLAY_META, DISPLAY, reminderClockTimes, isDormantPeriod } from '../lib/statusEngine.js'
import BottomNav from '../components/BottomNav.jsx'
import ClaimShopSearch from '../components/ClaimShopSearch.jsx'
import { registerForPush } from '../lib/pushNotifications.js'

const REMINDER_OFFSET_OPTIONS = [30, 60, 90, 120, 150, 180]

export default function Profile() {
  const { session, logout, getOwnerShop, saveFcmToken, isAdmin } = useApp()
  const ownerShop = session.role === 'owner' ? getOwnerShop(session.ownerId) : null
  const isOwner = session.role === 'owner'
  const initial = (session.identifier || '?').trim()[0]?.toUpperCase() || '?'

  // Register this device for reminder push notifications once the owner
  // has a real shop set up — no point asking before there's anything to
  // remind them about.
  useEffect(() => {
    if (!ownerShop) return
    registerForPush().then((token) => {
      if (token) saveFcmToken(session.ownerId, token)
    })
  }, [ownerShop?.placeId])

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center text-sm font-semibold shrink-0">
            {initial}
          </div>
          <h1 className="font-display text-xl font-600 leading-tight break-words">
            {isOwner ? (ownerShop ? ownerShop.name : 'Shop Update') : 'Profile'}
          </h1>
        </div>
        <button onClick={logout} aria-label="Log out" className="p-2 -mr-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="#14231D99" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 17l5-5-5-5M21 12H9" stroke="#14231D99" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 space-y-5 pb-24">
        {isOwner ? (
          ownerShop ? <OwnerPanel shop={ownerShop} /> : <ClaimShopSearch />
        ) : session.role === 'guest' ? (
          <div className="bg-white rounded-xl2 border border-ink/10 p-4">
            <p className="text-sm text-ink/60">Sign in with email, phone, or Google to save shops or list your own.</p>
          </div>
        ) : (
          <CustomerPanel session={session} isAdmin={isAdmin} />
        )}
      </div>

      <BottomNav ownerMode={isOwner} />
    </div>
  )
}

function CustomerPanel({ session, isAdmin }) {
  const navigate = useNavigate()

  return (
    <>
      <div className="bg-white rounded-xl2 border border-ink/10 p-4">
        <p className="text-xs uppercase tracking-wide text-ink/40 font-medium mb-1">Signed in as</p>
        <p className="text-sm text-ink/80">{session.identifier}</p>
        <p className="text-sm text-ink/60 mt-3">Saved shops and notification preferences will live here.</p>
        {isAdmin && (
          <button onClick={() => navigate('/admin')} className="text-sm font-medium text-accent mt-3">
            Open admin review →
          </button>
        )}
      </div>
    </>
  )
}

function OwnerPanel({ shop }) {
  const { confirmOpen, confirmCustomTime, setOverride, startBreak, endBreakNow, updateSchedule } = useApp()
  const display = getDisplayStatus(shop)
  const meta = DISPLAY_META[display]

  return (
    <>
      {/* 1. Shop name + status only, no buttons here */}
      <div className="bg-white rounded-xl2 border border-ink/10 p-4">
        <p className="font-medium text-sm">{shop.name}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color, opacity: meta.opacity }} />
          <p className="text-sm" style={{ color: meta.color }}>{meta.label}</p>
        </div>
        {shop.verificationStatus === 'pending' && (
          <p className="text-xs text-ink/50 bg-unverifiedBg rounded-lg px-3 py-2 mt-3">
            ⏳ Your shop is pending manual review — customers see it as unverified until we approve it.
            Everything else here still works, so feel free to set up your schedule now.
          </p>
        )}
      </div>

      {/* 2. Today — the bright, primary card. Hidden once past closing time,
          since "open/closed today" no longer applies until tomorrow. */}
      {!isDormantPeriod(shop.schedule) && (
        <TodayCard shop={shop} display={display} confirmOpen={confirmOpen} confirmCustomTime={confirmCustomTime}
                   setOverride={setOverride} startBreak={startBreak} endBreakNow={endBreakNow} />
      )}

      {/* 3. Tomorrow */}
      <TomorrowCard shop={shop} setOverride={setOverride} />

      {/* 4. Opening hours + reminders */}
      <ScheduleCard shop={shop} updateSchedule={updateSchedule} />
    </>
  )
}

function TodayCard({ shop, display, confirmOpen, confirmCustomTime, setOverride, startBreak, endBreakNow }) {
  const [editing, setEditing] = useState(false)
  const [pickingCustom, setPickingCustom] = useState(false)
  const [customTime, setCustomTime] = useState(shop.schedule?.openTime || '09:00')

  const onBreak = display === DISPLAY.ON_BREAK

  if (shop.schedule?.is24Hours) {
    return (
      <div className="rounded-xl2 p-4 space-y-3" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #2C6E6333', boxShadow: '0 2px 10px rgba(44,110,99,0.08)' }}>
        <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: '#2C6E63' }}>Today shop status</p>
        {onBreak ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink/70">On a break right now</p>
            <button onClick={() => endBreakNow(shop.placeId)} className="bg-accent text-white rounded-xl px-3.5 py-2 text-xs font-medium">
              End break now
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink">Open 24 hours — no confirmation needed</p>
            <div className="flex gap-1.5">
              <button onClick={() => startBreak(shop.placeId, 10)} className="rounded-lg px-2.5 py-1.5 text-xs font-medium border border-ink/10 bg-paper text-ink/60">10m</button>
              <button onClick={() => startBreak(shop.placeId, 30)} className="rounded-lg px-2.5 py-1.5 text-xs font-medium border border-ink/10 bg-paper text-ink/60">30m</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  const isConfirmedToday = !!shop.confirmedAt && new Date(shop.confirmedAt).toDateString() === new Date().toDateString()
  const isClosedToday = shop.todayOverride === 'closed'
  const settled = isConfirmedToday || isClosedToday
  const showButtons = editing || !settled

  // "Opening late / custom time" only makes sense once the shop's normal
  // opening time has actually passed — before that, "Open" is the right
  // action, not a late/custom label.
  const pastOpenTime = isPast(shop.schedule?.openTime)

  return (
    <div className="rounded-xl2 p-4 space-y-3" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #2C6E6333', boxShadow: '0 2px 10px rgba(44,110,99,0.08)' }}>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: '#2C6E63' }}>Today shop status</p>
        {settled && (
          <button
            onClick={() => { setEditing((v) => !v); setPickingCustom(false) }}
            aria-label={editing ? 'Cancel edit' : 'Edit'}
            className="text-xs font-medium text-accent flex items-center gap-1"
          >
            {editing ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="#2C6E63" strokeWidth="2.2" strokeLinecap="round" /></svg>
                Cancel
              </>
            ) : 'Edit'}
          </button>
        )}
      </div>

      {!showButtons && (
        <div>
          <p className="text-sm font-medium text-ink">
            {isClosedToday ? 'Not opening today' : shop.customOpenLabel ? `Opening at ${shop.customOpenLabel}` : 'Confirmed open'}
          </p>
          <p className="text-xs text-ink/40 mt-0.5">
            {isClosedToday ? 'Customers see this immediately' : 'Customers see a confirmed green pin'}
          </p>
        </div>
      )}

      {showButtons && !onBreak && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { confirmOpen(shop.placeId); setEditing(false); setPickingCustom(false) }}
              className="rounded-xl py-2.5 text-sm font-medium bg-open text-white"
            >
              Open
            </button>
            <button
              onClick={() => { setOverride(shop.placeId, 'today', 'closed'); setEditing(false); setPickingCustom(false) }}
              className="rounded-xl py-2.5 text-sm font-medium bg-closed text-white"
            >
              Closed
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              disabled={!pastOpenTime}
              onClick={() => setPickingCustom('late')}
              className={`rounded-xl py-2.5 text-sm font-medium border ${
                pastOpenTime ? 'border-ink/15 text-ink/70 bg-paper' : 'border-ink/10 text-ink/30 bg-paper/50'
              }`}
            >
              Opening late
            </button>
            <button
              onClick={() => setPickingCustom('custom')}
              className="rounded-xl py-2.5 text-sm font-medium border border-ink/15 text-ink/70 bg-paper"
            >
              Custom time
            </button>
          </div>
          {!pastOpenTime && (
            <p className="text-[11px] text-ink/35 -mt-1">
              "Opening late" unlocks after your usual opening time ({shop.schedule?.openTime}) passes.
              "Custom time" works anytime — use it to pre-confirm an early opening too.
            </p>
          )}

          {pickingCustom && (
            <div className="space-y-2 pt-1">
              <p className="text-xs text-ink/50">
                {pickingCustom === 'late' ? "What time will you actually open?" : "Set a specific opening time"}
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="flex-1 border border-ink/15 rounded-xl px-3 py-2.5 text-sm bg-paper outline-none focus:border-accent"
                />
                <button
                  onClick={() => { confirmCustomTime(shop.placeId, customTime); setEditing(false); setPickingCustom(false) }}
                  className="bg-accent text-white rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap"
                >
                  Confirm
                </button>
              </div>
              <button onClick={() => setPickingCustom(false)} className="text-xs text-ink/40">Cancel</button>
            </div>
          )}
        </>
      )}

      {!onBreak && shop.schedule?.hasBreak && !isClosedToday && (
        <div className="pt-2 border-t border-ink/10 flex items-center gap-2">
          <p className="text-xs text-ink/50 flex-1">Need a break now?</p>
          <button onClick={() => startBreak(shop.placeId, 10)} className="rounded-lg px-2.5 py-1.5 text-xs font-medium border border-ink/10 bg-paper text-ink/60">10m</button>
          <button onClick={() => startBreak(shop.placeId, 30)} className="rounded-lg px-2.5 py-1.5 text-xs font-medium border border-ink/10 bg-paper text-ink/60">30m</button>
        </div>
      )}

      {onBreak && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-sm text-ink/70">On a break right now</p>
          <button onClick={() => endBreakNow(shop.placeId)} className="bg-accent text-white rounded-xl px-3.5 py-2 text-xs font-medium">
            End break now
          </button>
        </div>
      )}
    </div>
  )
}

function isPast(hhmm) {
  if (!hhmm) return false
  const [h, m] = hhmm.split(':').map(Number)
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes() >= h * 60 + m
}

function TomorrowCard({ shop, setOverride }) {
  const selected = shop.tomorrowOverride === 'closed' ? 'holiday' : 'open'
  const dormant = isDormantPeriod(shop.schedule)
  const [editing, setEditing] = useState(false)
  const expanded = editing || dormant

  return (
    <div className="bg-white rounded-xl2 border border-ink/10 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-ink/40 font-medium">Tomorrow shop status</p>
        {!dormant && (
          <button
            onClick={() => setEditing((v) => !v)}
            className="text-xs font-medium text-accent flex items-center gap-1"
          >
            {editing ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="#2C6E63" strokeWidth="2.2" strokeLinecap="round" /></svg>
                Cancel
              </>
            ) : 'Edit'}
          </button>
        )}
      </div>

      {!expanded && (
        <p className="text-sm font-medium text-ink">
          {selected === 'holiday' ? 'Not opening tomorrow' : 'Opening as usual'}
        </p>
      )}

      {expanded && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setOverride(shop.placeId, 'tomorrow', null); setEditing(false) }}
              className={`rounded-xl py-2.5 text-sm font-medium border ${selected === 'open' ? 'bg-accent text-white border-accent' : 'bg-paper text-ink/70 border-ink/10'}`}
            >
              Open
            </button>
            <button
              onClick={() => { setOverride(shop.placeId, 'tomorrow', 'closed'); setEditing(false) }}
              className={`rounded-xl py-2.5 text-sm font-medium border ${selected === 'holiday' ? 'bg-closed text-white border-closed' : 'bg-paper text-ink/70 border-ink/10'}`}
            >
              Holiday / Leave
            </button>
          </div>
          <p className="text-xs text-ink/40">
            If "Open," customers start seeing a faded "Likely to open" pin from about 3 hours before your opening time — no action needed from you until tomorrow's reminders begin.
          </p>
        </>
      )}
    </div>
  )
}

function ScheduleCard({ shop, updateSchedule }) {
  const [editingSchedule, setEditingSchedule] = useState(false)
  const reminders = shop.schedule ? reminderClockTimes(shop.schedule) : []
  if (!shop.schedule) return null

  return (
    <div className="bg-white rounded-xl2 border border-ink/10 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-ink/40 font-medium">Opening hours</p>
        <button onClick={() => setEditingSchedule((v) => !v)} className="text-sm font-medium text-accent">
          {editingSchedule ? 'Done' : 'Edit'}
        </button>
      </div>

      {shop.hoursSource === 'google' && (
        <p className="text-xs text-ink/40 -mt-2">Pre-filled from your Google Maps listing — edit anytime.</p>
      )}

      {!editingSchedule ? (
        <div className="text-sm text-ink/70 space-y-1">
          <p>Open {shop.schedule.openTime} – {shop.schedule.closeTime}</p>
          {shop.schedule.hasBreak && shop.schedule.breaks[0] && (
            <p className="text-ink/50">Break {shop.schedule.breaks[0].start} – {shop.schedule.breaks[0].end}</p>
          )}
          {shop.schedule.closedDays.length > 0 && (
            <p className="text-ink/50">Weekly off: {shop.schedule.closedDays.map(dayName).join(', ')}</p>
          )}
        </div>
      ) : (
        <ScheduleEditor shop={shop} updateSchedule={updateSchedule} />
      )}

      {!shop.schedule.is24Hours && (
      <div className="pt-3 border-t border-ink/10 space-y-3">
        <p className="text-xs uppercase tracking-wide text-ink/40 font-medium">
          Reminders before opening ({shop.schedule.reminderOffsetsMinutes.length} selected — pick 2 to 4)
        </p>
        <div className="grid grid-cols-3 gap-2">
          {REMINDER_OFFSET_OPTIONS.map((offset) => {
            const selected = shop.schedule.reminderOffsetsMinutes.includes(offset)
            const atLimit = shop.schedule.reminderOffsetsMinutes.length >= 4
            const disabled = !selected && atLimit
            return (
              <button
                key={offset}
                disabled={disabled}
                onClick={() => {
                  const next = selected
                    ? shop.schedule.reminderOffsetsMinutes.filter((m) => m !== offset)
                    : [...shop.schedule.reminderOffsetsMinutes, offset]
                  updateSchedule(shop.placeId, { reminderOffsetsMinutes: next })
                }}
                className={`rounded-xl py-2 text-xs font-medium border ${
                  selected ? 'bg-accent text-white border-accent' : disabled ? 'bg-paper text-ink/30 border-ink/10' : 'bg-paper text-ink/70 border-ink/10'
                }`}
              >
                {offset} min
              </button>
            )
          })}
        </div>
        {reminders.length > 0 && (
          <p className="text-xs text-ink/40">You'll be pinged at: {reminders.join(', ')} (today's opening {shop.schedule.openTime})</p>
        )}
      </div>
      )}
    </div>
  )
}

function ScheduleEditor({ shop, updateSchedule }) {
  const s = shop.schedule
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between bg-openBg rounded-xl px-3.5 py-3">
        <p className="text-sm font-medium text-ink">Open 24 hours</p>
        <button
          onClick={() => updateSchedule(shop.placeId, { is24Hours: !s.is24Hours })}
          className={`w-11 h-6 rounded-full relative transition-colors ${s.is24Hours ? 'bg-accent' : 'bg-ink/15'}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${s.is24Hours ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {s.is24Hours ? (
        <p className="text-xs text-ink/40">
          One tap and you're set — no daily confirmations needed. Weekly off days and breaks below still apply if you use them.
        </p>
      ) : (
        <>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Opens">
          <input type="time" value={s.openTime} onChange={(e) => updateSchedule(shop.placeId, { openTime: e.target.value })}
                 className="w-full border border-ink/15 rounded-xl px-3 py-2 text-sm bg-paper outline-none focus:border-accent" />
        </Field>
        <Field label="Closes">
          <input type="time" value={s.closeTime} onChange={(e) => updateSchedule(shop.placeId, { closeTime: e.target.value })}
                 className="w-full border border-ink/15 rounded-xl px-3 py-2 text-sm bg-paper outline-none focus:border-accent" />
        </Field>
      </div>

      {s.closeTime && s.openTime && s.closeTime <= s.openTime && (
        <p className="text-xs text-accent bg-openBg rounded-lg px-3 py-2">
          Closing time is earlier than opening time — we'll treat this as an overnight shop
          (e.g. opens {s.openTime}, closes {s.closeTime} the next morning). No extra setup needed.
        </p>
      )}
        </>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-ink/70">Take a break?</p>
        <button
          onClick={() => updateSchedule(shop.placeId, {
            hasBreak: !s.hasBreak,
            breaks: !s.hasBreak ? [{ start: '13:00', end: '14:00', label: 'Break' }] : [],
          })}
          className={`w-11 h-6 rounded-full relative transition-colors ${s.hasBreak ? 'bg-accent' : 'bg-ink/15'}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${s.hasBreak ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {s.hasBreak && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Break start">
            <input type="time" value={s.breaks[0]?.start || '13:00'}
                   onChange={(e) => updateSchedule(shop.placeId, { breaks: [{ ...s.breaks[0], start: e.target.value }] })}
                   className="w-full border border-ink/15 rounded-xl px-3 py-2 text-sm bg-paper outline-none focus:border-accent" />
          </Field>
          <Field label="Break end">
            <input type="time" value={s.breaks[0]?.end || '14:00'}
                   onChange={(e) => updateSchedule(shop.placeId, { breaks: [{ ...s.breaks[0], end: e.target.value }] })}
                   className="w-full border border-ink/15 rounded-xl px-3 py-2 text-sm bg-paper outline-none focus:border-accent" />
          </Field>
          <p className="col-span-2 text-xs text-ink/40">Shop auto-reopens the moment the break ends — no action needed.</p>
        </div>
      )}

      <div>
        <p className="text-xs text-ink/60 mb-1.5">Weekly off day</p>
        <div className="flex gap-1.5 flex-wrap">
          {[0, 1, 2, 3, 4, 5, 6].map((d) => {
            const active = s.closedDays.includes(d)
            return (
              <button key={d} onClick={() => {
                const next = active ? s.closedDays.filter((x) => x !== d) : [...s.closedDays, d]
                updateSchedule(shop.placeId, { closedDays: next })
              }} className={`w-9 h-9 rounded-full text-xs font-medium border ${active ? 'bg-closed text-white border-closed' : 'bg-paper text-ink/60 border-ink/10'}`}>
                {dayName(d).slice(0, 2)}
              </button>
            )
          })}
        </div>
      </div>

      <p className="text-[11px] text-ink/35 italic">
        Same hours apply every working day for now — per-day custom hours is a planned "advanced settings" upgrade.
      </p>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <p className="text-xs text-ink/50 mb-1">{label}</p>
      {children}
    </div>
  )
}

function dayName(d) {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d]
}
