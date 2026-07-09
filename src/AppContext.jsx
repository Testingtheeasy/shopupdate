import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  collection, onSnapshot, doc, updateDoc, setDoc, query, where, getDocs,
} from 'firebase/firestore'
import {
  signInWithPopup, signOut, onAuthStateChanged,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
} from 'firebase/auth'
import { db, auth, googleProvider, phoneToPseudoEmail, PHONE_AUTH_DOMAIN } from './lib/firebase.js'

const AppCtx = createContext(null)

export function AppProvider({ children }) {
  const [session, setSession] = useState(null)     // { role, ownerId?, identifier, uid? } or { role: 'guest' }
  const [shops, setShops] = useState([])
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'shops'), (snap) => {
      setShops(snap.docs.map((d) => ({ placeId: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  // Resolve role whenever Firebase auth state changes. Handles both:
  // - Google sign-in (real email) -> look up owners by `email`
  // - Phone+password sign-in (pseudo-email) -> extract phone -> look up owners by `phone`
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthLoading(false)
        return // don't clear a guest session here — guests aren't Firebase users
      }
      const isPseudoPhone = user.email?.endsWith(`@${PHONE_AUTH_DOMAIN}`)
      const lookupField = isPseudoPhone ? 'phone' : 'email'
      const lookupValue = isPseudoPhone ? user.email.split('@')[0] : user.email

      const ownersQuery = query(collection(db, 'owners'), where(lookupField, '==', lookupValue))
      const ownerSnap = await getDocs(ownersQuery)
      const identifier = isPseudoPhone ? lookupValue : user.email

      if (!ownerSnap.empty) {
        const ownerDoc = ownerSnap.docs[0]
        setSession({ role: 'owner', ownerId: ownerDoc.id, identifier, uid: user.uid })
      } else {
        setSession({ role: 'user', identifier, uid: user.uid })
      }
      setAuthLoading(false)
    })
    return unsub
  }, [])

  async function loginWithGoogle() {
    await signInWithPopup(auth, googleProvider)
  }

  // isSignup=true creates a new account; false signs into an existing one.
  async function loginWithPhonePassword(phone, password, isSignup) {
    const pseudoEmail = phoneToPseudoEmail(phone)
    if (isSignup) {
      await createUserWithEmailAndPassword(auth, pseudoEmail, password)
    } else {
      await signInWithEmailAndPassword(auth, pseudoEmail, password)
    }
  }

  // Real email + password — distinct from the phone pseudo-email trick above.
  async function loginWithEmailPassword(email, password, isSignup) {
    if (isSignup) {
      await createUserWithEmailAndPassword(auth, email, password)
    } else {
      await signInWithEmailAndPassword(auth, email, password)
    }
  }

  // Guest = browse-only, no Firebase auth session at all. Firestore rules
  // allow public reads, so guests can see the map/pins, but every write
  // action in the app is only ever wired to owner screens, which guests
  // can't reach (Gate below still requires a real session to view them —
  // guest role is only ever routed to the map).
  function continueAsGuest() {
    setSession({ role: 'guest', identifier: 'Guest' })
  }

  function logout() {
    setSession(null)
    if (auth.currentUser) signOut(auth)
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

  // Owner "claims" a real shop found via Places Autocomplete. Creates the
  // Firestore doc at shops/{place_id} — this IS the link between Google's
  // data and ours, no separate mapping table needed — then points the
  // owner's own record at it.
  async function claimShop(ownerId, place) {
    const placeId = place.place_id
    const lat = typeof place.lat === 'number' ? place.lat : place.geometry?.location?.lat?.()
    const lng = typeof place.lng === 'number' ? place.lng : place.geometry?.location?.lng?.()

    await setDoc(doc(db, 'shops', placeId), {
      name: place.name || '',
      address: place.formatted_address || place.address || '',
      lat: lat ?? null,
      lng: lng ?? null,
      phone: '',
      ownerId,
      schedule: {
        openTime: '09:00',
        closeTime: '19:00',
        hasBreak: false,
        breaks: [],
        closedDays: [],
        confirmGraceMinutes: 15,
        reminderOffsetsMinutes: [90, 30],
      },
      todayOverride: null,
      tomorrowOverride: null,
      confirmedAt: null,
      breakUntil: null,
      customOpenLabel: null,
    })

    await updateDoc(doc(db, 'owners', ownerId), { shopPlaceId: placeId })
  }

  function getOwnerShop(ownerId) {
    return shops.find((s) => s.ownerId === ownerId) || null
  }

  return (
    <AppCtx.Provider
      value={{
        session,
        authLoading,
        loginWithGoogle,
        loginWithPhonePassword,
        loginWithEmailPassword,
        continueAsGuest,
        logout,
        shops,
        confirmOpen,
        confirmCustomTime,
        setOverride,
        startBreak,
        endBreakNow,
        updateSchedule,
        claimShop,
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
