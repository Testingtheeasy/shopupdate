export function timeAgo(timestamp) {
  if (!timestamp) return 'Never updated'
  const diffMs = Date.now() - timestamp
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `Updated ${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Updated ${hours}h ago`
  const days = Math.floor(hours / 24)
  return `Updated ${days}d ago`
}

// Grey out / mark unverified if status hasn't been confirmed in 24h.
export function isStale(timestamp, hours = 24) {
  if (!timestamp) return true
  return Date.now() - timestamp > hours * 60 * 60 * 1000
}
