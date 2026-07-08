import React, { createContext, useContext, useState } from 'react'
import { mockShops, mockOwners } from './mockData.js'

const AppCtx = createContext(null)

export function AppProvider({ children }) {
  const [session, setSession] = useState(null) // { role: 'user'|'owner', ownerId?, identifier }
  const [shops, setShops] = useState(mockShops)

  function loginWithIdentifier(identifier) {
    const clean = identifier.trim().toLowerCase()
    const owner = mockOwners.find(
      (o) => o.email.toLowerCase() === clean || o.phone === clean.replace(/\D/g, '')
    )
    if (owner) {
      setSession({ role: 'owner', ownerId: owner.id, identifier })
      return true
    } else {
      setSession({ role: 'user', identifier })
      return false
    }
  }

  function logout() {
    setSession(null)
  }

  function patchShop(placeId, patch) {
    setShops((prev) => prev.map((s) => (s.placeId === placeId ? { ...s, ...patch } : s)))
  }

  // Owner taps "I'm open" / confirm — whether that's on-time or ahead of schedule
  // (90 min early etc), it's the same action: stamp confirmedAt = now.
  function confirmOpen(placeId) {
    patchShop(placeId, { confirmedAt: Date.now(), todayOverride: null, customOpenLabel: null })
  }

  // Owner is opening, but later than scheduled, or at a specific custom time.
  // Still counts as "confirmed" for the engine, but carries a label so the UI
  // can show "Opening at 11:30 (confirmed)" instead of the default open message.
  function confirmCustomTime(placeId, timeLabel) {
    patchShop(placeId, { confirmedAt: Date.now(), todayOverride: null, customOpenLabel: timeLabel })
  }

  // "Not opening today" / "Not opening tomorrow" — cancels the whole reminder
  // cascade for that date. Same control, different target date.
  function setOverride(placeId, which, value) {
    // which: 'today' | 'tomorrow'; value: 'closed' | 'open' | null
    patchShop(placeId, which === 'today' ? { todayOverride: value } : { tomorrowOverride: value })
  }

  // Break control covers both the scheduled break (auto-triggered) and the
  // ad-hoc "need 10 min" case — both just set breakUntil, engine handles the rest.
  function startBreak(placeId, minutes) {
    patchShop(placeId, { breakUntil: Date.now() + minutes * 60 * 1000 })
  }

  function endBreakNow(placeId) {
    patchShop(placeId, { breakUntil: null })
  }

  function updateSchedule(placeId, scheduleUpdates) {
    setShops((prev) =>
      prev.map((s) =>
        s.placeId === placeId
          ? { ...s, schedule: { ...s.schedule, ...scheduleUpdates } }
          : s
      )
    )
  }

  function getOwnerShop(ownerId) {
    const owner = mockOwners.find((o) => o.id === ownerId)
    if (!owner) return null
    return shops.find((s) => s.placeId === owner.shopPlaceId) || null
  }

  return (
    <AppCtx.Provider
      value={{
        session,
        loginWithIdentifier,
        logout,
        shops,
        confirmOpen,
        confirmCustomTime,
        setOverride,
        startBreak,
        endBreakNow,
        updateSchedule,
        getOwnerShop,
      }}
    >
      {children}
    </AppCtx.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
