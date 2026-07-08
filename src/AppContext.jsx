import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  collection, onSnapshot, doc, updateDoc, query, where, getDocs,
} from 'firebase/firestore'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { db, auth, googleProvider } from './lib/firebase.js'

const AppCtx = createContext(null)

export function AppProvider({ children }) {
  const [session, setSession] = useState(null)     // { role, ownerId?, identifier, uid }
  const [shops, setShops] = useState([])
  const [authLoading, setAuthLoading] = useState(true)

  // Live shop list — any change anywhere (owner action, another customer's
  // browser) reflects here automatically, no manual refresh needed.
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'shops'), (snap) => {
      setShops(snap.docs.map((d) => ({ placeId: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  // Resolve role on auth state change: check the `owners` collection for a
  // document whose email matches the signed-in Google account.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setSession(null)
        setAuthLoading(false)
        return
      }
      const ownersQuery = query(collection(db, 'owners'), where('email', '==', user.email))
      const ownerSnap = await getDocs(ownersQuery)
      if (!ownerSnap.empty) {
        const ownerDoc = ownerSnap.docs[0]
        setSession({ role: 'owner', ownerId: ownerDoc.id, identifier: user.email, uid: user.uid })
      } else {
        setSession({ role: 'user', identifier: user.email, uid: user.uid })
      }
      setAuthLoading(false)
    })
    return unsub
  }, [])

  async function loginWithGoogle() {
    await signInWithPopup(auth, googleProvider)
    // session gets set by onAuthStateChanged above; caller can check
    // auth.currentUser or just navigate to '/' and let the Gate route
    // owners onward once session resolves (see Login.jsx).
  }

  function logout() {
    signOut(auth)
  }

  async function patchShop(placeId, patch) {
    await updateDoc(doc(db, 'shops', placeId), patch)
  }

  function confirmOpen(placeId) {
    return patchShop(placeId, { confirmedAt: Date.now(), todayOverride: null, customOpenLabel: null })
  }

  function confirmCustomTime(placeId, timeLabel) {
    return patchShop(placeId, { confirmedAt: Date.now(), todayOverride: null, customOpenLabel: timeLabel })
  }

  function setOverride(placeId, which, value) {
    return patchShop(placeId, which === 'today' ? { todayOverride: value } : { tomorrowOverride: value })
  }

  function startBreak(placeId, minutes) {
    return patchShop(placeId, { breakUntil: Date.now() + minutes * 60 * 1000 })
  }

  function endBreakNow(placeId) {
    return patchShop(placeId, { breakUntil: null })
  }

  async function updateSchedule(placeId, scheduleUpdates) {
    const shop = shops.find((s) => s.placeId === placeId)
    const nextSchedule = { ...(shop?.schedule || {}), ...scheduleUpdates }
    await patchShop(placeId, { schedule: nextSchedule })
  }

  function getOwnerShop(ownerId) {
    const shop = shops.find((s) => s.ownerId === ownerId)
    return shop || null
  }

  return (
    <AppCtx.Provider
      value={{
        session,
        authLoading,
        loginWithGoogle,
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
