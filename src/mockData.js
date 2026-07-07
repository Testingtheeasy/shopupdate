// In production, `placeId` comes from Google Places Autocomplete/Details.
// `status` is what YOUR database stores, keyed by placeId — this is the
// entire premise of the app: Google gives location + nav, you give live status.

export const STATUS = {
  OPEN: 'open',
  CLOSED_TEMP: 'closed_temp',
  CLOSED_PERM: 'closed_perm',
  OPENING_LATE: 'opening_late',
  CLOSING_EARLY: 'closing_early',
  UNVERIFIED: 'unverified',
}

export const STATUS_META = {
  [STATUS.OPEN]: { label: 'Open now', color: '#1F9D55', bg: '#E7F6EC' },
  [STATUS.CLOSED_TEMP]: { label: 'Closed today', color: '#C4433A', bg: '#FBEAE8' },
  [STATUS.CLOSED_PERM]: { label: 'Permanently closed', color: '#C4433A', bg: '#FBEAE8' },
  [STATUS.OPENING_LATE]: { label: 'Opening late', color: '#C77F1A', bg: '#FBF0DD' },
  [STATUS.CLOSING_EARLY]: { label: 'Closing early', color: '#C77F1A', bg: '#FBF0DD' },
  [STATUS.UNVERIFIED]: { label: 'Not verified', color: '#9A9488', bg: '#EFEBE3' },
}

export const mockShops = [
  {
    placeId: 'ChIJmock_pothys_swarna',
    name: 'Pothys Swarna Mahal',
    address: '12 Ranganathan St, T. Nagar, Chennai',
    lat: 13.0418,
    lng: 80.2341,
    phone: '+91 98765 43210',
    status: STATUS.CLOSED_TEMP,
    note: 'Closed for stock renewal, opens tomorrow 10 AM',
    updatedAt: Date.now() - 1000 * 60 * 40, // 40 min ago
    ownerId: 'owner-1',
  },
  {
    placeId: 'ChIJmock_saravana_stores',
    name: 'Saravana Stores',
    address: '45 Usman Rd, T. Nagar, Chennai',
    lat: 13.0402,
    lng: 80.2335,
    phone: '+91 98765 11111',
    status: STATUS.OPEN,
    note: '',
    updatedAt: Date.now() - 1000 * 60 * 5,
    ownerId: 'owner-2',
  },
  {
    placeId: 'ChIJmock_naturals_icecream',
    name: 'Naturals Ice Cream',
    address: 'North Usman Rd, T. Nagar, Chennai',
    lat: 13.0425,
    lng: 80.2360,
    phone: '+91 98765 22222',
    status: STATUS.OPENING_LATE,
    note: 'Opening at 2 PM today',
    updatedAt: Date.now() - 1000 * 60 * 60 * 3,
    ownerId: 'owner-3',
  },
  {
    placeId: 'ChIJmock_random_bakery',
    name: 'Anand Bakery',
    address: 'GN Chetty Rd, T. Nagar, Chennai',
    lat: 13.0435,
    lng: 80.2320,
    phone: '+91 98765 33333',
    status: STATUS.UNVERIFIED,
    note: '',
    updatedAt: null,
    ownerId: null,
  },
]

// Simulated "owners" table — used by Login to decide which profile to route to.
export const mockOwners = [
  { id: 'owner-1', email: 'owner1@pothys.com', phone: '9876543210', shopPlaceId: 'ChIJmock_pothys_swarna' },
  { id: 'owner-2', email: 'owner2@saravana.com', phone: '9876511111', shopPlaceId: 'ChIJmock_saravana_stores' },
  { id: 'owner-3', email: 'owner3@naturals.com', phone: '9876522222', shopPlaceId: 'ChIJmock_naturals_icecream' },
]
