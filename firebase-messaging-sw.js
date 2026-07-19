importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// Same values as src/lib/firebase.js — this file lives in /public and can't
// read Vite env vars, so they're written directly here. This is safe: these
// are public client identifiers by design (see the comment in firebase.js),
// protected by Firestore Security Rules and API key restrictions, not by
// being hidden. If you ever rotate your Firebase project, update both files.
firebase.initializeApp({
  apiKey: "AIzaSyBsqKsmX8xYtY-2S3RyDJ71bpdmF1ycy7I",
  authDomain: "shopstatus-live-94470.firebaseapp.com",
  projectId: "shopstatus-live-94470",
  storageBucket: "shopstatus-live-94470.firebasestorage.app",
  messagingSenderId: "325465888886",
  appId: "1:325465888886:web:9c091557549eb55946a757",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || 'ShopStatus', {
    body: body || '',
    icon: '/icon-192.png',
  });
});
