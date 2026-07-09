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

function nowMinutes(date) {
  return date.getHours() * 60 + date.getMinutes()
}

// shop shape expected (see mockData.js):
// schedule: { openTime, closeTime, hasBreak, breaks: [{start,end}], closedDays: [0-6], confirmGraceMinutes, reminderOffsetsMinutes }
// todayOverride: null | 'closed' | 'open'
// tomorrowOverride: null | 'closed' | 'open'
// confirmedAt: timestamp | null   -> owner tapped "confirm" today (early or on-time)
// breakUntil: timestamp | null    -> ad-hoc or scheduled break currently active, auto-ends at this time
export function getDisplayStatus(shop, now = new Date()) {
  if (!shop.schedule) return DISPLAY.UNVERIFIED

  const { schedule } = shop
  const day = now.getDay()
  const nowMin = nowMinutes(now)
  const openMin = toMinutes(schedule.openTime)
  const closeMin = toMinutes(schedule.closeTime)
  const graceMin = schedule.confirmGraceMinutes ?? 15

  // Malformed/incomplete schedule (e.g. missing openTime/closeTime from a
  // manual data-entry mistake) — show unverified instead of crashing.
  if (openMin === null || closeMin === null) return DISPLAY.UNVERIFIED

  // Explicit owner overrides win over everything else.
  if (shop.todayOverride === 'closed') return DISPLAY.CLOSED
  if ((schedule.closedDays || []).includes(day) && !shop.todayOverride) return DISPLAY.CLOSED

  // Active break (scheduled or ad-hoc) always shows regardless of open/close window.
  if (shop.breakUntil && now.getTime() < shop.breakUntil) return DISPLAY.ON_BREAK

  // Outside today's operating window entirely.
  if (nowMin >= closeMin) return DISPLAY.CLOSED

  if (nowMin < openMin) {
    // Before opening time today.
    const minutesToOpen = openMin - nowMin
    if (shop.confirmedAt && isSameDay(shop.confirmedAt, now)) return DISPLAY.CONFIRMED_EARLY
    const soonestReminder = Math.max(...(schedule.reminderOffsetsMinutes || [90]))
    if (minutesToOpen <= soonestReminder) return DISPLAY.AWAITING_CONFIRM
    return DISPLAY.LIKELY_OPEN
  }

  // Within operating hours.
  if (shop.confirmedAt && isSameDay(shop.confirmedAt, now)) return DISPLAY.OPEN
  if (nowMin - openMin <= graceMin) return DISPLAY.AWAITING_CONFIRM
  return DISPLAY.UNCERTAIN
}

function isSameDay(timestamp, now) {
  const d = new Date(timestamp)
  return d.toDateString() === now.toDateString()
}

// Builds the concrete list of reminder clock-times for a schedule, e.g.
// openTime 09:00 + offsets [90, 30] -> ["07:30", "08:30"]
export function reminderClockTimes(schedule) {
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
