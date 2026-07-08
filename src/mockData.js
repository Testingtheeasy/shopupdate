// In production, `placeId` comes from Google Places Autocomplete/Details.
// `status` is what YOUR database stores, keyed by placeId — this is the
// entire premise of the app: Google gives location + nav, you give live status.

// In production, `placeId` comes from Google Places Autocomplete/Details.
// Each shop now carries a `schedule` (owner-configured, reused daily) plus
// a few live fields (`confirmedAt`, `breakUntil`, overrides) that the
// status engine (see lib/statusEngine.js) reads to decide what customers see.

export const mockShops = [
  {
    placeId: 'ChIJmock_pothys_swarna',
    name: 'Pothys Swarna Mahal',
    address: '12 Ranganathan St, T. Nagar, Chennai',
    lat: 13.0418,
    lng: 80.2341,
    phone: '+91 98765 43210',
    ownerId: 'owner-1',
    schedule: {
      openTime: '09:00',
      closeTime: '19:00',
      hasBreak: true,
      breaks: [{ start: '13:00', end: '14:00', label: 'Lunch' }],
      closedDays: [0], // Sunday off
      confirmGraceMinutes: 15,
      reminderOffsetsMinutes: [90, 30],
    },
    todayOverride: null,
    tomorrowOverride: null,
    confirmedAt: null,
    breakUntil: null,
  },
  {
    placeId: 'ChIJmock_saravana_stores',
    name: 'Saravana Stores',
    address: '45 Usman Rd, T. Nagar, Chennai',
    lat: 13.0402,
    lng: 80.2335,
    phone: '+91 98765 11111',
    ownerId: 'owner-2',
    schedule: {
      openTime: '08:30',
      closeTime: '21:00',
      hasBreak: false,
      breaks: [],
      closedDays: [],
      confirmGraceMinutes: 15,
      reminderOffsetsMinutes: [60, 30],
    },
    todayOverride: null,
    tomorrowOverride: null,
    confirmedAt: Date.now() - 1000 * 60 * 5, // confirmed 5 min ago
    breakUntil: null,
  },
  {
    placeId: 'ChIJmock_naturals_icecream',
    name: 'Naturals Ice Cream',
    address: 'North Usman Rd, T. Nagar, Chennai',
    lat: 13.0425,
    lng: 80.2360,
    phone: '+91 98765 22222',
    ownerId: 'owner-3',
    schedule: {
      openTime: '11:00',
      closeTime: '22:30',
      hasBreak: false,
      breaks: [],
      closedDays: [],
      confirmGraceMinutes: 20,
      reminderOffsetsMinutes: [120, 60, 30],
    },
    todayOverride: null,
    tomorrowOverride: null,
    confirmedAt: null,
    breakUntil: null,
  },
  {
    placeId: 'ChIJmock_random_bakery',
    name: 'Anand Bakery',
    address: 'GN Chetty Rd, T. Nagar, Chennai',
    lat: 13.0435,
    lng: 80.2320,
    phone: '+91 98765 33333',
    ownerId: null,
    schedule: null, // never registered by an owner -> always shows Unverified
    todayOverride: null,
    tomorrowOverride: null,
    confirmedAt: null,
    breakUntil: null,
  },
]

export const mockOwners = [
  { id: 'owner-1', email: 'owner1@pothys.com', phone: '9876543210', shopPlaceId: 'ChIJmock_pothys_swarna' },
  { id: 'owner-2', email: 'owner2@saravana.com', phone: '9876511111', shopPlaceId: 'ChIJmock_saravana_stores' },
  { id: 'owner-3', email: 'owner3@naturals.com', phone: '9876522222', shopPlaceId: 'ChIJmock_naturals_icecream' },
]

