import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import {
  collection, onSnapshot, doc, updateDoc, setDoc, query, where, getDocs,
} from 'firebase/firestore'
import {
  signInWithRedirect, signOut, onAuthStateChanged,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
} from 'firebase/auth'
import { db, auth, googleProvider, phoneToPseudoEmail, PHONE_AUTH_DOMAIN } from './lib/firebase.js'

const AppCtx = createContext(null)

// Minimum gap between repeat calls to the same write action — a lightweight,
// client-side guard against accidental double-taps and basic spam-clicking.
// This is NOT real server-side rate limiting (that needs Firebase App Check
// or Cloud Functions) — just a cheap first layer that costs nothing to add.
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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthLoading(false)
        return
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

  // Owner "claims" a real shop found via Places Autocomplete. Creates the
  // Firestore doc at shops/{place_id} — this IS the link between Google's
  // data and ours, no separate mapping table needed — then points the
  // owner's own record at it. `verification` carries the outcome of the
  // phone-match / form step from ClaimShopSearch (see that component).
  async function claimShop(ownerId, place, verification = {}) {
    const placeId = place.place_id
    const lat = typeof place.lat === 'number' ? place.lat : place.geometry?.location?.lat?.()
    const lng = typeof place.lng === 'number' ? place.lng : place.geometry?.location?.lng?.()

    await setDoc(doc(db, 'shops', placeId), {
      name: place.name || '',
      address: place.formatted_address || place.address || '',
      lat: lat ?? null,
      lng: lng ?? null,
      phone: place.formatted_phone_number || '',
      ownerId,
      schedule: {
        openTime: '09:00',
        closeTime: '19:00',
        hasBreak: false,
        breaks: [],
        closedDays: [],
        confirmGraceMinutes: 15,
        reminderOffsetsMinutes: [90, 30],
        is24Hours: false,
      },
      todayOverride: null,
      tomorrowOverride: null,
      confirmedAt: null,
      breakUntil: null,
      customOpenLabel: null,
      // Verification fields — see components/ClaimShopSearch.jsx for how
      // these get set. 'auto_approved' shops are live immediately;
      // 'pending' ones show as unverified to customers until you flip
      // this to 'verified' in the Firestore console after a manual check.
      verificationStatus: verification.verificationStatus || 'pending',
      ownerName: verification.ownerName || '',
      ownerPhone: verification.ownerPhone || '',
      gstNumber: verification.gstNumber || '',
      verificationNote: verification.verificationNote || '',
    }).catch((err) => { console.error('claimShop: shop create failed:', err); throw err })

    await updateDoc(doc(db, 'owners', ownerId), { shopPlaceId: placeId })
      .catch((err) => { console.error('claimShop: owner link update failed:', err); throw err })
  }

  // Saves the browser's FCM device token to the owner's record so a future
  // scheduled Cloud Function can find where to send reminder pushes.
  async function saveFcmToken(ownerId, token) {
    await updateDoc(doc(db, 'owners', ownerId), { fcmToken: token }).catch((err) => {
      console.error('saveFcmToken failed:', err)
    })
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
        saveFcmToken,
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
