// Converts Google Places' `opening_hours.periods` into our schedule shape.
// Returns null if Google has no hours data, or if the pattern is too
// irregular to represent with our "one schedule for every open day" model
// (per-day custom hours is a planned future upgrade — see Profile.jsx notes).
export function parseGoogleHours(openingHours) {
  const periods = openingHours?.periods
  if (!periods || periods.length === 0) return null

  // 24/7 shops: a single period with no close time.
  if (periods.length === 1 && !periods[0].close) {
    return {
      openTime: '00:00',
      closeTime: '23:59',
      hasBreak: false,
      breaks: [],
      closedDays: [],
      confirmGraceMinutes: 15,
      reminderOffsetsMinutes: [90, 30],
      is24Hours: true,
    }
  }

  const toHHMM = (t) => (t ? `${t.slice(0, 2)}:${t.slice(2, 4)}` : null)

  // Group periods by the day they open on.
  const byDay = {}
  periods.forEach((p) => {
    if (p.open?.day === undefined) return
    byDay[p.open.day] = byDay[p.open.day] || []
    byDay[p.open.day].push(p)
  })

  const openDays = Object.keys(byDay).map(Number)
  if (openDays.length === 0) return null

  // Use Monday if available (a representative "normal" day), else the
  // first open day found — our schema assumes one schedule for all
  // working days, so we just need one good example to pre-fill from.
  const repDay = openDays.includes(1) ? 1 : openDays[0]
  const dayPeriods = byDay[repDay]

  const firstOpen = toHHMM(dayPeriods[0].open?.time)
  const lastPeriod = dayPeriods[dayPeriods.length - 1]
  const lastClose = toHHMM(lastPeriod.close?.time)
  if (!firstOpen || !lastClose) return null

  // Two periods on the same day usually means a lunch/break gap.
  let hasBreak = false
  let breaks = []
  if (dayPeriods.length === 2 && dayPeriods[0].close && dayPeriods[1].open) {
    hasBreak = true
    breaks = [{ start: toHHMM(dayPeriods[0].close.time), end: toHHMM(dayPeriods[1].open.time), label: 'Break' }]
  }

  const closedDays = [0, 1, 2, 3, 4, 5, 6].filter((d) => !openDays.includes(d))

  return {
    openTime: firstOpen,
    closeTime: lastClose,
    hasBreak,
    breaks,
    closedDays,
    confirmGraceMinutes: 15,
    reminderOffsetsMinutes: [90, 30],
    is24Hours: false,
  }
}
