import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

// From Firebase Console → Project settings → Your apps → Web app config.
// This is safe to keep in client code — it's a public identifier, not a
// secret. Actual protection comes from Firestore Security Rules, not from
// hiding this object.
const firebaseConfig = {
  apiKey: "AIzaSyBsqKsmX8xYtY-2S3RyDJ71bpdmF1ycy71",
  authDomain: "shopstatus-live-94470.firebaseapp.com",
  projectId: "shopstatus-live-94470",
  storageBucket: "shopstatus-live-94470.firebasestorage.app",
  messagingSenderId: "325465888886",
  appId: "1:325465888886:web:9c091557549eb55946a757",
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

// Firebase has no native "phone + password" mode — only phone+OTP or
// email+password. We simulate phone+password by turning the phone number
// into a pseudo-email under a fixed fake domain, then using normal
// email/password auth underneath. See PHONE_AUTH_DOMAIN usage in AppContext.
export const PHONE_AUTH_DOMAIN = 'shopstatus-users.app'
export function phoneToPseudoEmail(phone) {
  const digits = phone.replace(/\D/g, '')
  return `${digits}@${PHONE_AUTH_DOMAIN}`
}
