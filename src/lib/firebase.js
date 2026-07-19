import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getMessaging, isSupported } from 'firebase/messaging'

// Read from environment variables (set in .env locally, and in your
// Vercel project's Environment Variables settings for deployment) instead
// of hardcoding values directly in this committed file.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

// FCM isn't supported everywhere (e.g. some in-app browsers, iOS Safari
// without PWA install) — this resolves to null gracefully instead of
// throwing, so calling code can just check for that.
export const messagingPromise = isSupported().then((ok) => (ok ? getMessaging(app) : null))

// Firebase has no native "phone + password" mode — only phone+OTP or
// email+password. We simulate phone+password by turning the phone number
// into a pseudo-email under a fixed fake domain, then using normal
// email/password auth underneath. See PHONE_AUTH_DOMAIN usage in AppContext.
export const PHONE_AUTH_DOMAIN = 'shopstatus-users.app'
export function phoneToPseudoEmail(phone) {
  const digits = phone.replace(/\D/g, '')
  return `${digits}@${PHONE_AUTH_DOMAIN}`
}
