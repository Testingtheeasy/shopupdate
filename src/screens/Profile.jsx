import React, { useState } from 'react'
import { useApp } from '../AppContext.jsx'
import { getDisplayStatus, DISPLAY_META, reminderClockTimes } from '../lib/statusEngine.js'
import BottomNav from '../components/BottomNav.jsx'

const REMINDER_OFFSET_OPTIONS = [30, 60, 90, 120, 150, 180] // minutes before opening

export default function Profile() {
  const { session, logout, getOwnerShop, confirmOpen, setOverride, updateSchedule } = useApp()
  const [editingSchedule, setEditingSchedule] = useState(false)
  const [overrideTarget, setOverrideTarget] = useState('today') // 'today' | 'tomorrow'

  const ownerShop = session.role === 'owner' ? getOwnerShop(session.ownerId) : null

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="px-5 pt-6 pb-4">
        <h1 className="font-display text-2xl font-600">Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 space-y-6 pb-6">
        <div className="bg-white rounded-xl2 border border-ink/10 p-4">
          <p className="text-xs uppercase tracking-wide text-ink/40 font-medium mb-1">Signed in as</p>
          <p className="text-sm text-ink/80">{session.identifier}</p>
          <p className="text-xs text-ink/40 mt-1">{session.role === 'owner' ? 'Shop owner account' : 'Customer account'}</p>
        </div>

        {session.role === 'owner' && ownerShop && (
          <OwnerPanel
            shop={ownerShop}
            editingSchedule={editingSchedule}
            setEditingSchedule={setEditingSchedule}
            overrideTarget={overrideTarget}
            setOverrideTarget={setOverrideTarget}
            confirmOpen={confirmOpen}
            setOverride={setOverride}
            updateSchedule={updateSchedule}
          />
        )}

        {session.role === 'user' && (
          <div className="bg-white rounded-xl2 border border-ink/10 p-4">
            <p className="text-sm text-ink/60">Saved shops and notification preferences will live here.</p>
          </div>
        )}

        <button onClick={logout} className="w-full border border-ink/15 rounded-xl2 py-3 text-sm font-medium text-ink/70">
          Log out
        </button>
      </div>

      <BottomNav />
    </div>
  )
}

function OwnerPanel({ shop, editingSchedule, setEditingSchedule, overrideTarget, setOverrideTarget, confirmOpen, setOverride, updateSchedule }) {
  const display = getDisplayStatus(shop)
  const meta = DISPLAY_META[display]
  const reminders = shop.schedule ? reminderClockTimes(shop.schedule) : []
  const activeOverride = overrideTarget === 'today' ? shop.todayOverride : shop.tomorrowOverride

  return (
    <>
      {/* Live status summary */}
      <div className="bg-white rounded-xl2 border border-ink/10 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">{shop.name}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color, opacity: meta.opacity }} />
              <p className="text-xs text-ink/50">{meta.label}</p>
            </div>
          </div>
          <button
            onClick={() => confirmOpen(shop.placeId)}
            className="bg-accent text-white rounded-xl px-3.5 py-2 text-xs font-medium whitespace-nowrap"
          >
            Confirm open
          </button>
        </div>
      </div>

      {/* Today / Tomorrow override */}
      <div className="bg-white rounded-xl2 border border-ink/10 p-4 space-y-3">
        <p className="text-xs uppercase tracking-wide text-ink/40 font-medium">Full-day override</p>
        <div className="flex rounded-xl overflow-hidden border border-ink/10">
          {['today', 'tomorrow'].map((t) => (
            <button
              key={t}
              onClick={() => setOverrideTarget(t)}
              className={`flex-1 py-2 text-sm font-medium capitalize ${overrideTarget === t ? 'bg-accent text-white' : 'bg-paper text-ink/60'}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setOverride(shop.placeId, overrideTarget, activeOverride === 'closed' ? null : 'closed')}
            className={`rounded-xl py-2.5 text-sm font-medium border ${
              activeOverride === 'closed' ? 'bg-closed text-white border-closed' : 'bg-paper text-ink/70 border-ink/10'
            }`}
          >
            Not opening
          </button>
          <button
            onClick={() => setOverride(shop.placeId, overrideTarget, null)}
            className={`rounded-xl py-2.5 text-sm font-medium border ${
              !activeOverride ? 'bg-accent text-white border-accent' : 'bg-paper text-ink/70 border-ink/10'
            }`}
          >
            Normal schedule
          </button>
        </div>
        <p className="text-xs text-ink/40">
          {overrideTarget === 'today'
            ? 'Cancels all reminders for today and shows customers "Closed today" immediately.'
            : "Lets customers know in advance — resets automatically once tomorrow becomes today."}
        </p>
      </div>

      {/* Schedule editor */}
      {shop.schedule && (
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
        </div>
      )}

      {/* Reminder timing */}
      {shop.schedule && (
        <div className="bg-white rounded-xl2 border border-ink/10 p-4 space-y-3">
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
                    selected
                      ? 'bg-accent text-white border-accent'
                      : disabled
                      ? 'bg-paper text-ink/30 border-ink/10'
                      : 'bg-paper text-ink/70 border-ink/10'
                  }`}
                >
                  {offset} min
                </button>
              )
            })}
          </div>
          {reminders.length > 0 && (
            <p className="text-xs text-ink/40">
              You'll be pinged at: {reminders.join(', ')} (today's opening {shop.schedule.openTime})
            </p>
          )}
        </div>
      )}
    </>
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
              <button
                key={d}
                onClick={() => {
                  const next = active ? s.closedDays.filter((x) => x !== d) : [...s.closedDays, d]
                  updateSchedule(shop.placeId, { closedDays: next })
                }}
                className={`w-9 h-9 rounded-full text-xs font-medium border ${
                  active ? 'bg-closed text-white border-closed' : 'bg-paper text-ink/60 border-ink/10'
                }`}
              >
                {dayName(d).slice(0, 2)}
              </button>
            )
          })}
        </div>
      </div>

      <p className="text-[11px] text-ink/35 italic">
        Same hours apply every working day for now — per-day custom hours (e.g. shorter Saturdays) is a planned "advanced settings" upgrade.
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
