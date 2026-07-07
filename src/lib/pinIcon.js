import { STATUS, STATUS_META } from '../mockData.js'

// Bigger, bold teardrop pin as a data-URI SVG, colored by status.
// Falls back to unverified grey for anything not in the DB.
export function pinIconUrl(status) {
  const meta = STATUS_META[status] || STATUS_META[STATUS.UNVERIFIED]
  const color = meta.color
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="46" height="58" viewBox="0 0 46 58">
      <path d="M23 0C10.3 0 0 10.3 0 23c0 16.5 23 35 23 35s23-18.5 23-35C46 10.3 35.7 0 23 0z"
            fill="${color}" stroke="white" stroke-width="2.5"/>
      <circle cx="23" cy="23" r="9" fill="white"/>
    </svg>
  `.trim()
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg)
}
