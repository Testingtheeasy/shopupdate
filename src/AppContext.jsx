import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import {
  collection, onSnapshot, doc, updateDoc, setDoc, getDoc,
} from 'firebase/firestore'
import {
  signInWithRedirect, signOut, onAuthStateChanged,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
} from 'firebase/auth'
import { db, auth, googleProvider, phoneToPseudoEmail, PHONE_AUTH_DOMAIN } from './lib/firebase.js'

const AppCtx = createContext(null)
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || ''

// Minimum gap between repeat calls to the same write action — a lightweight,
// client-side guard against accidental double-taps. NOT real server-side
// rate limiting (that needs App Check / Cloud Functions) — just cheap insurance.
const WRITE_COOLDOWN_MS = 1200

export function AppProvider({ children }) {
  const [session, setSession] = useState(null)
  const [shops, setShops] = useState([])
  const [authLoading, setAuthLoading] = useState(true)
  const lastWriteAt = useRef({})

  function guardedWrite(key, fn) {
    const now = Date.now()
    const last = lastWriteAt.current[key] || 0
    if (now - last < WRITE_COOLDOWN_MS) {
      console.warn(`Write "${key}" throttled — too soon after previous call.`)
      return Promise.resolve()
    }
    lastWriteAt.current[key] = now
    return fn()
  }

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'shops'),
      (snap) => setShops(snap.docs.map((d) => ({ placeId: d.id, ...d.data() }))),
      (err) => console.error('shops listener error:', err)
    )
    return unsub
  }, [])

  // Owner doc ID is always the Firebase Auth UID now — no more fragile
  // email/phone matching. A user is an "owner" simply if owners/{uid} exists.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthLoading(false)
        return
      }
      const isPseudoPhone = user.email?.endsWith(`@${PHONE_AUTH_DOMAIN}`)
      const identifier = isPseudoPhone ? user.email.split('@')[0] : user.email

      const ownerDocSnap = await getDoc(doc(db, 'owners', user.uid))
      if (ownerDocSnap.exists()) {
        setSession({ role: 'owner', ownerId: user.uid, identifier, uid: user.uid })
      } else {
        setSession({ role: 'user', identifier, uid: user.uid })
      }
      setAuthLoading(false)
    })
    return unsub
  }, [])

  async function loginWithGoogle() {
    await signInWithRedirect(auth, googleProvider)
  }

  async function loginWithPhonePassword(phone, password, isSignup) {
    const pseudoEmail = phoneToPseudoEmail(phone)
    if (isSignup) await createUserWithEmailAndPassword(auth, pseudoEmail, password)
    else await signInWithEmailAndPassword(auth, pseudoEmail, password)
  }

  async function loginWithEmailPassword(email, password, isSignup) {
    if (isSignup) await createUserWithEmailAndPassword(auth, email, password)
    else await signInWithEmailAndPassword(auth, email, password)
  }

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
    return guardedWrite(`confirm-${placeId}`, () =>
      patchShop(placeId, { confirmedAt: Date.now(), todayOverride: null, customOpenLabel: null })
    )
  }

  function confirmCustomTime(placeId, timeLabel) {
    return guardedWrite(`confirm-${placeId}`, () =>
      patchShop(placeId, { confirmedAt: Date.now(), todayOverride: null, customOpenLabel: timeLabel })
    )
  }

  function setOverride(placeId, which, value) {
    return guardedWrite(`override-${placeId}-${which}`, () =>
      patchShop(placeId, which === 'today' ? { todayOverride: value } : { tomorrowOverride: value })
    )
  }

  function startBreak(placeId, minutes) {
    return guardedWrite(`break-${placeId}`, () =>
      patchShop(placeId, { breakUntil: Date.now() + minutes * 60 * 1000 })
    )
  }

  function endBreakNow(placeId) {
    return guardedWrite(`break-${placeId}`, () => patchShop(placeId, { breakUntil: null }))
  }

  async function updateSchedule(placeId, scheduleUpdates) {
    const shop = shops.find((s) => s.placeId === placeId)
    const nextSchedule = { ...(shop?.schedule || {}), ...scheduleUpdates }
    await guardedWrite(`schedule-${placeId}`, () => patchShop(placeId, { schedule: nextSchedule }))
  }

  // Self-serve claim: works for ANY signed-in user, not just pre-seeded
  // owners. Creates the shop doc (keyed by the real Google place_id — this
  // IS the link to Google's data) AND the owners/{uid} doc if it doesn't
  // exist yet, then immediately flips the local session to 'owner' so the
  // UI updates without needing a page reload.
  // `scheduleOverride` carries Google's real opening hours when available
  // (see lib/parseGoogleHours.js) — falls back to a generic default schedule.
  async function claimShop(place, verification = {}, scheduleOverride = null) {
    const user = auth.currentUser
    if (!user) throw new Error('Not signed in')
    const uid = user.uid
    const placeId = place.place_id
    const lat = typeof place.lat === 'number' ? place.lat : place.geometry?.location?.lat?.()
    const lng = typeof place.lng === 'number' ? place.lng : place.geometry?.location?.lng?.()

    const defaultSchedule = {
      openTime: '09:00',
      closeTime: '19:00',
      hasBreak: false,
      breaks: [],
      closedDays: [],
      confirmGraceMinutes: 15,
      reminderOffsetsMinutes: [90, 30],
      is24Hours: false,
    }

    await setDoc(doc(db, 'shops', placeId), {
      name: place.name || '',
      address: place.formatted_address || place.address || '',
      lat: lat ?? null,
      lng: lng ?? null,
      phone: place.formatted_phone_number || '',
      ownerId: uid,
      schedule: scheduleOverride || defaultSchedule,
      todayOverride: null,
      tomorrowOverride: null,
      confirmedAt: null,
      breakUntil: null,
      customOpenLabel: null,
      verificationStatus: verification.verificationStatus || 'pending',
      ownerName: verification.ownerName || '',
      ownerPhone: verification.ownerPhone || '',
      gstNumber: verification.gstNumber || '',
      verificationNote: verification.verificationNote || '',
      hoursSource: scheduleOverride ? 'google' : 'default', // for owner-facing "we found your hours" note
    }).catch((err) => { console.error('claimShop: shop create failed:', err); throw err })

    await setDoc(doc(db, 'owners', uid), {
      email: user.email && !user.email.endsWith(`@${PHONE_AUTH_DOMAIN}`) ? user.email : '',
      phone: user.email?.endsWith(`@${PHONE_AUTH_DOMAIN}`) ? user.email.split('@')[0] : '',
      shopPlaceId: placeId,
    }, { merge: true }).catch((err) => { console.error('claimShop: owner doc failed:', err); throw err })

    setSession((prev) => ({ ...prev, role: 'owner', ownerId: uid }))
  }

  async function saveFcmToken(ownerId, token) {
    await updateDoc(doc(db, 'owners', ownerId), { fcmToken: token }).catch((err) => {
      console.error('saveFcmToken failed:', err)
    })
  }

  function getOwnerShop(ownerId) {
    return shops.find((s) => s.ownerId === ownerId) || null
  }

  const isAdmin = !!ADMIN_EMAIL && session?.identifier?.toLowerCase() === ADMIN_EMAIL.toLowerCase()

  function approveShop(placeId) {
    return patchShop(placeId, { verificationStatus: 'verified' })
  }

  function rejectShop(placeId) {
    return patchShop(placeId, { verificationStatus: 'rejected' })
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
        saveFcmToken,
        getOwnerShop,
        isAdmin,
        approveShop,
        rejectShop,
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
