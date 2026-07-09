import { DISPLAY_META } from './statusEngine.js'

const BADGE_PATHS = {
  thumb: '<path d="M7 10v10H4a1 1 0 01-1-1v-8a1 1 0 011-1h3zm0 0l4-7a2 2 0 012 2v4h5a2 2 0 012 2.2l-1.2 6A2 2 0 0117 19H9" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  hourglass: '<path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9" stroke="COLOR" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  cup: '<path d="M4 8h13v5a5 5 0 01-5 5H9a5 5 0 01-5-5V8z" stroke="COLOR" stroke-width="1.8" stroke-linejoin="round" fill="none"/><path d="M17 9h1.5a2.5 2.5 0 010 5H17" stroke="COLOR" stroke-width="1.8" fill="none"/>',
}

// Builds a teardrop map pin, colored + faded per the display state, with an
// optional small circular badge icon in the top-right corner.
export function pinIconUrl(displayStatus) {
  const meta = DISPLAY_META[displayStatus] || DISPLAY_META.unverified
  const { color, opacity, badge } = meta

  const badgeSvg = badge
    ? `<circle cx="35" cy="12" r="10" fill="white" stroke="#00000022" stroke-width="1"/>
       <g transform="translate(29,6) scale(0.5)">${BADGE_PATHS[badge].replaceAll('COLOR', color)}</g>`
    : ''

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="52" height="58" viewBox="0 0 52 58">
      <g opacity="${opacity}">
        <path d="M23 0C10.3 0 0 10.3 0 23c0 16.5 23 35 23 35s23-18.5 23-35C46 10.3 35.7 0 23 0z"
              fill="${color}" stroke="white" stroke-width="2.5"/>
        <circle cx="23" cy="23" r="9" fill="white"/>
      </g>
      ${badgeSvg}
    </svg>
  `.trim()
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg)
}
