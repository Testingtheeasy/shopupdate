import { getToken } from 'firebase/messaging'
import { messagingPromise } from './firebase.js'

// Set this after generating a Web Push certificate:
// Firebase Console → Project settings → Cloud Messaging tab →
// "Web configuration" → Generate key pair → copy the key here.
const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY

// Requests notification permission and returns a device token, or null if
// unsupported/denied/not configured. Call this once after an owner claims
// or opens their shop — the returned token gets saved via saveFcmToken().
export async function registerForPush() {
  try {
    const messaging = await messagingPromise
    if (!messaging) return null
    if (!VAPID_KEY) {
      console.warn('VITE_FCM_VAPID_KEY not set — push notifications disabled.')
      return null
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration })
    return token || null
  } catch (err) {
    console.error('registerForPush failed:', err)
    return null
  }
}
