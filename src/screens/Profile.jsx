import React, { useState } from 'react'
import { useApp } from '../AppContext.jsx'
import { getDisplayStatus, DISPLAY_META, DISPLAY, reminderClockTimes } from '../lib/statusEngine.js'
import BottomNav from '../components/BottomNav.jsx'
import ClaimShopSearch from '../components/ClaimShopSearch.jsx'

const REMINDER_OFFSET_OPTIONS = [30, 60, 90, 120, 150, 180]

export default function Profile() {
  const { session, logout, getOwnerShop } = useApp()
  const ownerShop = session.role === 'owner' ? getOwnerShop(session.ownerId) : null
  const isOwner = session.role === 'owner'
  const initial = (session.identifier || '?').trim()[0]?.toUpperCase() || '?'

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center text-sm font-semibold shrink-0">
            {initial}
          </div>
          <h1 className="font-display text-2xl font-600">{isOwner ? 'Shop Update' : 'Profile'}</h1>
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
          ownerShop ? <OwnerPanel shop={ownerShop} /> : <ClaimShopSearch ownerId={session.ownerId} />
        ) : (
          <div className="bg-white rounded-xl2 border border-ink/10 p-4">
            <p className="text-xs uppercase tracking-wide text-ink/40 font-medium mb-1">Signed in as</p>
            <p className="text-sm text-ink/80">{session.identifier}</p>
            <p className="text-sm text-ink/60 mt-3">Saved shops and notification preferences will live here.</p>
          </div>
        )}
      </div>

      <BottomNav ownerMode={isOwner} />
    </div>
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
      </div>

      {/* 2. Today — the bright, primary card */}
      <TodayCard shop={shop} display={display} confirmOpen={confirmOpen} confirmCustomTime={confirmCustomTime}
                 setOverride={setOverride} startBreak={startBreak} endBreakNow={endBreakNow} />

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

  const isConfirmedToday = !!shop.confirmedAt && new Date(shop.confirmedAt).toDateString() === new Date().toDateString()
  const isClosedToday = shop.todayOverride === 'closed'
  const onBreak = display === DISPLAY.ON_BREAK
  const settled = isConfirmedToday || isClosedToday
  const showButtons = editing || !settled

  return (
    <div className="rounded-xl2 p-4 space-y-3" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #2C6E6333', boxShadow: '0 2px 10px rgba(44,110,99,0.08)' }}>
      <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: '#2C6E63' }}>Today</p>

      {!showButtons && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink">
              {isClosedToday ? 'Not opening today' : shop.customOpenLabel ? `Opening at ${shop.customOpenLabel}` : 'Confirmed open'}
            </p>
            <p className="text-xs text-ink/40 mt-0.5">
              {isClosedToday ? 'Customers see this immediately' : 'Customers see a confirmed green pin'}
            </p>
          </div>
          <button onClick={() => setEditing(true)} className="text-sm font-medium text-accent shrink-0 ml-3">Edit</button>
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
            <button
              onClick={() => setPickingCustom(true)}
              className="rounded-xl py-2.5 text-sm font-medium border border-ink/15 text-ink/70 bg-paper col-span-2"
            >
              Opening late / custom time
            </button>
          </div>

          {pickingCustom && (
            <div className="flex items-center gap-2 pt-1">
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

function TomorrowCard({ shop, setOverride }) {
  const selected = shop.tomorrowOverride === 'closed' ? 'holiday' : 'open'
  return (
    <div className="bg-white rounded-xl2 border border-ink/10 p-4 space-y-3">
      <p className="text-xs uppercase tracking-wide text-ink/40 font-medium">Tomorrow</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setOverride(shop.placeId, 'tomorrow', null)}
          className={`rounded-xl py-2.5 text-sm font-medium border ${selected === 'open' ? 'bg-accent text-white border-accent' : 'bg-paper text-ink/70 border-ink/10'}`}
        >
          Open
        </button>
        <button
          onClick={() => setOverride(shop.placeId, 'tomorrow', 'closed')}
          className={`rounded-xl py-2.5 text-sm font-medium border ${selected === 'holiday' ? 'bg-closed text-white border-closed' : 'bg-paper text-ink/70 border-ink/10'}`}
        >
          Holiday / Leave
        </button>
      </div>
      <p className="text-xs text-ink/40">
        If "Open," customers start seeing a faded "Likely to open" pin from about 3 hours before your opening time — no action needed from you until tomorrow's reminders begin.
      </p>
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
    </div>
  )
}

function ScheduleEditor({ shop, updateSchedule }) {
  const s = shop.schedule
  return (
    <div className="space-y-3">
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
