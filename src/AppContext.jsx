import React, { createContext, useContext, useState } from 'react'
import { mockShops, mockOwners } from './mockData.js'

const AppCtx = createContext(null)

export function AppProvider({ children }) {
  const [session, setSession] = useState(null) // { role: 'user'|'owner', ownerId?, identifier }
  const [shops, setShops] = useState(mockShops)

  // Simulates: backend checks the entered email/phone against the owners table.
  function loginWithIdentifier(identifier) {
    const clean = identifier.trim().toLowerCase()
    const owner = mockOwners.find(
      (o) => o.email.toLowerCase() === clean || o.phone === clean.replace(/\D/g, '')
    )
    if (owner) {
      setSession({ role: 'owner', ownerId: owner.id, identifier })
    } else {
      setSession({ role: 'user', identifier })
    }
  }

  function logout() {
    setSession(null)
  }

  function updateShopStatus(placeId, status, note) {
    setShops((prev) =>
      prev.map((s) =>
        s.placeId === placeId
          ? { ...s, status, note: note ?? s.note, updatedAt: Date.now() }
          : s
      )
    )
  }

  // Owner "vouches" for a specific opening time today — separate from live status,
  // so a shop that's currently closed can still tell customers a trusted time to arrive.
  function confirmOpeningTime(placeId, time) {
    setShops((prev) =>
      prev.map((s) =>
        s.placeId === placeId
          ? { ...s, confirmedOpeningTime: time, confirmedAt: Date.now() }
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
      value={{ session, loginWithIdentifier, logout, shops, updateShopStatus, confirmOpeningTime, getOwnerShop }}
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
