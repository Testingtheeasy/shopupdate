# ShopStatus (prototype)

Live open/closed status for shops, layered on top of Google Maps — because
default "hours" data goes stale and doesn't reflect real-time closures.

This is a **working front-end prototype with mock data** — no real backend yet.
It's built so wiring in Supabase (auth + database) later is a small, isolated change.

## What's here

- 4 screens: **Login → Map (home) → Shop Details → Profile**
- Owner vs. customer is auto-detected on login (mock lookup against `mockOwners`)
- Colored map pins (green/red/orange/grey) sourced from `src/mockData.js`,
  keyed by Google Place ID — swap this for a real DB table later, same shape
- Owner home screen has a floating **status toggle widget**
- Owner profile screen has full status options + a "set tomorrow's status" field
- Shop details screen has a **"Navigate in Google Maps"** button (deep link, not a rebuilt map)
- Google Places Autocomplete search bar wired in (needs your API key)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Add your Google Maps API key. Open `index.html` and replace:
   ```
   YOUR_GOOGLE_MAPS_API_KEY
   ```
   Make sure **Maps JavaScript API** and **Places API** are both enabled on that key
   in Google Cloud Console.

3. Run the dev server:
   ```bash
   npm run dev
   ```
   Open the printed local URL (usually `http://localhost:5173`) on your phone
   or in a mobile-width browser window.

## Try it

- Log in as **owner1@pothys.com** → you'll land on the map with the owner
  toggle widget visible, and see full controls in Profile.
- Log in as **anything else** (e.g. `test@test.com`) → you're a customer:
  search bar + pins only, no toggle.
- Tap any colored pin to open shop details, then tap "Navigate" — it opens
  real Google Maps directions in a new tab.
- Search a real place near you in the search bar — since it's not in
  `mockData.js`, it'll show as an unverified (grey) shop, demonstrating the
  fallback behavior.

## Wiring in the real backend later

Everything that touches data lives in **`src/AppContext.jsx`** and
**`src/mockData.js`**. To go from mock to Supabase:

1. Replace `mockShops` / `mockOwners` arrays with Supabase table reads
   (`shops` table keyed by `place_id`, `owners` table with `email`, `phone`, `shop_place_id`).
2. Replace `loginWithIdentifier` with real Supabase Auth (OTP/email link),
   then do the owner-lookup check server-side or via a Supabase query.
3. Replace `updateShopStatus` with a Supabase `update` call — this is also
   where you'd add the daily-mandatory-update reminder logic later.

The screens themselves (`src/screens/*.jsx`) shouldn't need to change much,
since they only talk to `useApp()` — that's the whole point of isolating
state in the context file.

## Known limitations (by design, for a fast MVP)

- No real auth, database, or persistence — refreshing the page resets everything.
- No WhatsApp bot (planned for phase 2, per our discussion).
- No customer-submitted photo verification (planned for phase 2).
- "Stale after 24h" logic exists (`src/lib/time.js`) but isn't yet tied to
  automatic re-greying — good next step once real timestamps exist.
