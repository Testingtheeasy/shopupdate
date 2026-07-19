const { onSchedule } = require('firebase-functions/v2/scheduler');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();
const db = getFirestore();
const messaging = getMessaging();

// --- Duplicated (intentionally) from src/lib/statusEngine.js ---
// Cloud Functions run as CommonJS and can't cleanly share an ES module with
// the browser bundle, so the small bit of pure scheduling math is copied
// here. If you change the reminder logic in statusEngine.js, mirror the
// change here too.
function toMinutes(hhmm) {
  if (typeof hhmm !== 'string' || !hhmm.includes(':')) return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function reminderClockTimes(schedule) {
  if (schedule?.is24Hours) return [];
  const openMin = toMinutes(schedule?.openTime);
  if (openMin === null) return [];
  return (schedule.reminderOffsetsMinutes || []).map((offset) => {
    const total = openMin - offset;
    const h = Math.floor(((total % 1440) + 1440) % 1440 / 60);
    const m = ((total % 60) + 60) % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  });
}
// --- end duplicated section ---

function isRecentConfirm(timestamp, now) {
  if (!timestamp) return false;
  return now.getTime() - timestamp < 20 * 60 * 60 * 1000;
}

// Runs every 5 minutes. Checks every shop's reminder times against the
// current clock (assumes IST — see the timezone note from earlier in the
// build), sends a push to the owner if a reminder time matches right now
// and hasn't already been sent today.
exports.sendOpeningReminders = onSchedule(
  { schedule: 'every 5 minutes', timeZone: 'Asia/Kolkata' },
  async () => {
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const nowHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const shopsSnap = await db.collection('shops').get();

    for (const shopDoc of shopsSnap.docs) {
      const shop = shopDoc.data();
      if (!shop.schedule || !shop.ownerId) continue;
      if (shop.todayOverride === 'closed') continue;
      if (isRecentConfirm(shop.confirmedAt, now)) continue; // already confirmed, no need to nag

      const day = now.getDay();
      if ((shop.schedule.closedDays || []).includes(day)) continue;

      const times = reminderClockTimes(shop.schedule);
      // Match within the current 5-minute tick (function runs every 5 min).
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const roundedNow = Math.floor(nowMin / 5) * 5;
      const roundedNowHHMM = `${String(Math.floor(roundedNow / 60)).padStart(2, '0')}:${String(roundedNow % 60).padStart(2, '0')}`;
      if (!times.includes(roundedNowHHMM)) continue;

      const alreadySent = shop.sentRemindersToday?.date === todayKey
        && (shop.sentRemindersToday?.times || []).includes(roundedNowHHMM);
      if (alreadySent) continue;

      const ownerSnap = await db.collection('owners').doc(shop.ownerId).get();
      const fcmToken = ownerSnap.data()?.fcmToken;
      if (!fcmToken) continue;

      try {
        await messaging.send({
          token: fcmToken,
          notification: {
            title: `${shop.name}: confirm you're open`,
            body: `Opens at ${shop.schedule.openTime} — tap to confirm or set a different status.`,
          },
          webpush: { fcmOptions: { link: '/#/profile' } },
        });

        const prevTimes = shop.sentRemindersToday?.date === todayKey ? shop.sentRemindersToday.times : [];
        await shopDoc.ref.update({
          sentRemindersToday: { date: todayKey, times: [...prevTimes, roundedNowHHMM] },
        });
      } catch (err) {
        console.error(`Failed to send reminder for shop ${shopDoc.id}:`, err);
      }
    }
  }
);
