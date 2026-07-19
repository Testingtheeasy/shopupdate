// The single source of truth for "what does the customer see right now."
// Every other screen just calls getDisplayStatus(shop) — nobody else
// re-implements this logic, so the rules only live in one place.

export const DISPLAY = {
  OPEN: 'open',
  CLOSED: 'closed',
  UNCERTAIN: 'uncertain',           // grace period expired, owner never responded
  LIKELY_OPEN: 'likely_open',       // schedule-based prediction, far from open time
  CONFIRMED_EARLY: 'confirmed_early', // owner pre-confirmed ahead of time (thumbs-up state)
  AWAITING_CONFIRM: 'awaiting_confirm', // inside the pre-open window, not yet confirmed
  ON_BREAK: 'on_break',
  UNVERIFIED: 'unverified',         // no owner/schedule data exists at all
}

export const DISPLAY_META = {
  [DISPLAY.OPEN]: { label: 'Open now', color: '#1F9D55', opacity: 1, badge: null, bg: '#E7F6EC' },
  [DISPLAY.CLOSED]: { label: 'Closed today', color: '#C4433A', opacity: 1, badge: null, bg: '#FBEAE8' },
  [DISPLAY.UNCERTAIN]: { label: 'Hours unclear today', color: '#9A9488', opacity: 1, badge: null, bg: '#EFEBE3' },
  [DISPLAY.LIKELY_OPEN]: { label: 'Likely open', color: '#1F9D55', opacity: 0.45, badge: null, bg: '#E7F6EC' },
  [DISPLAY.CONFIRMED_EARLY]: { label: 'Confirmed', color: '#1F9D55', opacity: 1, badge: 'thumb', bg: '#E7F6EC' },
  [DISPLAY.AWAITING_CONFIRM]: { label: 'Opening today, not yet confirmed', color: '#E8A33D', opacity: 1, badge: 'hourglass', bg: '#FBF0DD' },
  [DISPLAY.ON_BREAK]: { label: 'On a short break', color: '#E8A33D', opacity: 1, badge: 'cup', bg: '#FBF0DD' },
  [DISPLAY.UNVERIFIED]: { label: 'Not verified', color: '#9A9488', opacity: 1, badge: null, bg: '#EFEBE3' },
}

function toMinutes(hhmm) {
  if (typeof hhmm !== 'string' || !hhmm.includes(':')) return null
  const [h, m] = hhmm.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

// Computes where "now" sits relative to the shop's daily window, correctly
// handling shops that cross midnight (e.g. open 21:00, close 03:00).
// A schedule is treated as overnight automatically whenever closeTime is
// numerically earlier in the day than openTime — no separate toggle needed,
// the owner just enters hours normally (e.g. Opens 21:00, Closes 03:00).
export function getScheduleInfo(schedule, now = new Date()) {
  const openMin = toMinutes(schedule?.openTime)
  const closeMin = toMinutes(schedule?.closeTime)
  if (openMin === null || closeMin === null) return null

  const nowMin = now.getHours() * 60 + now.getMinutes()
  const overnight = closeMin <= openMin

  let withinWindow, minutesSinceOpen, minutesUntilOpen, minutesUntilClose

  if (!overnight) {
    withinWindow = nowMin >= openMin && nowMin < closeMin
    if (withinWindow) {
      minutesSinceOpen = nowMin - openMin
      minutesUntilClose = closeMin - nowMin
    } else if (nowMin < openMin) {
      minutesUntilOpen = openMin - nowMin
    } else {
      minutesUntilOpen = (1440 - nowMin) + openMin // opens again tomorrow
    }
  } else {
    // Window spans midnight: [openMin, 1440) plus [0, closeMin) the next morning.
    withinWindow = nowMin >= openMin || nowMin < closeMin
    if (withinWindow) {
      minutesSinceOpen = nowMin >= openMin ? nowMin - openMin : (1440 - openMin) + nowMin
      minutesUntilClose = nowMin < closeMin ? closeMin - nowMin : (1440 - nowMin) + closeMin
    } else {
      // Daytime gap between this morning's close and tonight's open.
      minutesUntilOpen = openMin - nowMin
    }
  }

  return { overnight, withinWindow, minutesSinceOpen, minutesUntilOpen, minutesUntilClose, openMin, closeMin, nowMin }
}

// A confirm/break timestamp counts as "for the current cycle" if it happened
// recently (within ~20h) — simpler and more robust than trying to track
// exact calendar-day boundaries, and works the same for normal and
// overnight (midnight-crossing) shops without special-casing either.
function isRecentConfirm(timestamp, now) {
  if (!timestamp) return false
  return now.getTime() - timestamp < 20 * 60 * 60 * 1000
}

// shop shape expected (see mockData.js):
// schedule: { openTime, closeTime, hasBreak, breaks: [{start,end}], closedDays: [0-6], confirmGraceMinutes, reminderOffsetsMinutes }
// todayOverride: null | 'closed' | 'open'
// tomorrowOverride: null | 'closed' | 'open'
// confirmedAt: timestamp | null   -> owner tapped "confirm" (early, on-time, or late)
// breakUntil: timestamp | null    -> ad-hoc or scheduled break currently active, auto-ends at this time
export function getDisplayStatus(shop, now = new Date()) {
  if (!shop.schedule) return DISPLAY.UNVERIFIED

  // Not yet manually approved (or explicitly rejected) — customers see
  // "not verified" no matter what the schedule says, until reviewed.
  if (shop.verificationStatus && shop.verificationStatus !== 'auto_approved' && shop.verificationStatus !== 'verified') {
    return DISPLAY.UNVERIFIED
  }

  const { schedule } = shop
  const day = now.getDay()
  const graceMin = schedule.confirmGraceMinutes ?? 15

  // Explicit owner overrides win over everything else.
  if (shop.todayOverride === 'closed') return DISPLAY.CLOSED
  if ((schedule.closedDays || []).includes(day) && !shop.todayOverride) return DISPLAY.CLOSED

  // Active break (scheduled or ad-hoc) always shows regardless of open/close window.
  if (shop.breakUntil && now.getTime() < shop.breakUntil) return DISPLAY.ON_BREAK

  // 24-hour shops skip the whole opening-time/confirmation cycle entirely —
  // one tap to enable, then it just stays Open (breaks/overrides still apply above).
  if (schedule.is24Hours) return DISPLAY.OPEN

  const info = getScheduleInfo(shop.schedule, now)
  if (!info) return DISPLAY.UNVERIFIED // malformed schedule — don't crash, show unverified

  if (!info.withinWindow) {
    // Before this cycle's opening time.
    if (isRecentConfirm(shop.confirmedAt, now)) return DISPLAY.CONFIRMED_EARLY
    const soonestReminder = Math.max(...(schedule.reminderOffsetsMinutes || [90]))
    if (info.minutesUntilOpen <= soonestReminder) return DISPLAY.AWAITING_CONFIRM
    return DISPLAY.LIKELY_OPEN
  }

  // Within operating hours (correctly spans midnight for overnight shops).
  if (isRecentConfirm(shop.confirmedAt, now)) return DISPLAY.OPEN
  if (info.minutesSinceOpen <= graceMin) return DISPLAY.AWAITING_CONFIRM
  return DISPLAY.UNCERTAIN
}

// For UI purposes (e.g. hiding the owner's "Today" controls when there's
// genuinely nothing to do right now): true only when we're outside the
// operating window AND further from the next opening than the owner's
// furthest reminder — i.e. a real lull, not just "closed for the moment."
export function isDormantPeriod(schedule, now = new Date()) {
  if (schedule?.is24Hours) return false
  const info = getScheduleInfo(schedule, now)
  if (!info) return true
  if (info.withinWindow) return false
  const threshold = Math.max(180, ...(schedule.reminderOffsetsMinutes || [180]))
  return info.minutesUntilOpen > threshold
}

// Builds the concrete list of reminder clock-times for a schedule, e.g.
// openTime 09:00 + offsets [90, 30] -> ["07:30", "08:30"]. Works the same
// for overnight shops since reminders always precede the same-day openTime.
export function reminderClockTimes(schedule) {
  if (schedule?.is24Hours) return []
  const openMin = toMinutes(schedule?.openTime)
  if (openMin === null) return []
  return (schedule.reminderOffsetsMinutes || [])
    .slice()
    .sort((a, b) => b - a)
    .map((offset) => {
      const total = openMin - offset
      const h = Math.floor(((total % 1440) + 1440) % 1440 / 60)
      const m = ((total % 60) + 60) % 60
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    })
}
