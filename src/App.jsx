import { useEffect, useState } from 'react'
import L from 'leaflet'
import {
  Circle,
  MapContainer,
  Marker,
  Polygon,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import './App.css'
import 'leaflet/dist/leaflet.css'
import heroIllustration from './assets/mealbridge.png'
import markerIconUrl from 'leaflet/dist/images/marker-icon.png'
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png'

const leafletMarkerIcon = L.icon({
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Foundation', path: '/foundation' },
  { label: 'How to help?', path: '/how-to-help' },
  { label: 'Events', path: '/events' },
  { label: 'Contact', path: '/contact' },
]

const staticPages = {
  '/about': {
    kicker: 'About MealBridge',
    title: 'Building smarter food redistribution.',
    text: 'MealBridge connects food donors and NGOs to ensure surplus edible food reaches people quickly and safely.',
    points: [
      'Built for real-time donor-to-NGO coordination.',
      'Focused on reducing edible food waste and response delays.',
      'Designed for community impact with measurable outcomes.',
    ],
  },
  '/foundation': {
    kicker: 'Our Foundation',
    title: 'Mission-first collaboration and execution.',
    text: 'Our foundation model prioritizes dignity, food safety, and fast logistics for every rescue request.',
    points: [
      'Social impact before operational complexity.',
      'Transparent data for meal recovery and waste reduction.',
      'Scalable workflows for colleges, hostels, restaurants, and events.',
    ],
  },
  '/how-to-help': {
    kicker: 'How To Help',
    title: 'Join the food rescue movement.',
    text: 'Support MealBridge as a donor, organizer, or referral partner.',
    points: [
      'List surplus food immediately when available.',
      'Support packaging, pickup, or local distribution.',
      'Refer NGOs and donor organizations in your city.',
    ],
  },
  '/how-it-works': {
    kicker: 'How It Works',
    title: 'Simple flow, faster rescue.',
    text: 'Donors post food details, NGOs request pickups, and AI urgency indicators help prioritize dispatch order.',
    points: [
      'Donor submits food type, quantity, prep time, and location.',
      'NGOs view nearby listings and request suitable pickups.',
      'AI urgency assists teams in reducing spoilage risk.',
    ],
  },
  '/events': {
    kicker: 'Events',
    title: 'Campus and community collaboration.',
    text: 'MealBridge participates in local events to onboard donors and NGOs into one coordinated network.',
    points: [
      'Food waste awareness sessions and demos.',
      'On-site donor registration and partner onboarding.',
      'Hackathon-style response drills for rapid coordination.',
    ],
  },
  '/contact': {
    kicker: 'Contact',
    title: 'Let us connect and coordinate.',
    text: 'Reach out for partnerships, pilot runs, and operational setup in your area.',
    points: [
      'Email: hello@mealbridge.org',
      'Phone: +91 90000 00000',
      'Response window: 9:00 AM to 7:00 PM',
    ],
  },
  '/donate': {
    kicker: 'Donate',
    title: 'Support timely food rescue efforts.',
    text: 'Contributions help with packaging supplies, transportation support, and awareness operations.',
    points: [
      'Sustain safe pickup and distribution logistics.',
      'Enable recurring field operations in high-need zones.',
      'Strengthen partner readiness.',
    ],
  },
  '/safety-guidelines': {
    kicker: 'Safety Guidelines',
    title: 'Food safety is non-negotiable.',
    text: 'MealBridge follows practical safety checks before acceptance and handoff.',
    points: [
      'Ensure food is freshly prepared and covered.',
      'Mention prep time and special handling notes.',
      'Use clean containers and safe transport methods.',
    ],
  },
  '/faq': {
    kicker: 'FAQ',
    title: 'Common questions, quick answers.',
    text: 'Get clarity on donor posting, NGO requests, urgency estimation, and coordination timelines.',
    points: [
      'Who can post surplus food?',
      'How does NGO request prioritization work?',
      'How quickly should pickup be scheduled?',
    ],
  },
  '/privacy': {
    kicker: 'Privacy',
    title: 'Data usage with practical safeguards.',
    text: 'We collect minimum operational data needed for matching donors, NGOs, and pickups.',
    points: [
      'Contact details used only for coordination.',
      'Location data used for nearest-match efficiency.',
      'Operational records retained for impact analytics.',
    ],
  },
  '/terms': {
    kicker: 'Terms',
    title: 'Shared responsibilities for reliable use.',
    text: 'All participants are expected to provide accurate data, timely responses, and safe handoff practices.',
    points: [
      'Donor listing details must be accurate.',
      'NGO request timelines should be realistic.',
      'All users should follow safety and compliance norms.',
    ],
  },
}

function getRouteFromHash() {
  const path = window.location.hash.replace(/^#/, '') || '/'
  return path.startsWith('/') ? path : `/${path}`
}

const initialAuthForm = {
  name: '',
  role: 'donor',
  location: '',
  email: '',
  password: '',
}

const initialDonateForm = {
  donor_id: '',
  food_type: '',
  quantity: '',
  prep_time: '',
  location: '',
  latitude: '',
  longitude: '',
}

const ERNAKULAM_MAP_CENTER = [9.9816, 76.2999]
const NGO_LISTING_RADIUS_METERS = 15000
const ERNAKULAM_BOUNDARY = [
  [10.355, 76.08],
  [10.36, 76.42],
  [10.24, 76.76],
  [9.83, 76.79],
  [9.71, 76.44],
  [9.76, 76.09],
  [9.98, 75.98],
]

const AUTH_STORAGE_KEY = 'mealbridge_auth'
const donorOnlyRoutes = [
  '/donor-dashboard',
  '/donate',
  '/my-food-listings',
  '/donor-activity',
]
const ngoOnlyRoutes = [
  '/ngo-dashboard',
  '/ngo-open-listings',
  '/ngo-donor-partners',
  '/ngo-pickup-activity',
]

const normalizeRole = (role = '') => String(role).trim().toLowerCase()

const normalizeIdValue = (value = '') => String(value).trim()

const isUuid = (value = '') =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    normalizeIdValue(value),
  )

const safeEnvId = (value = '') => {
  const normalized = normalizeIdValue(value)
  if (!normalized) return ''

  const lowered = normalized.toLowerCase()
  if (lowered.includes('your-') || lowered.includes('placeholder')) return ''

  return normalized
}

const readStoredAuth = () => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    const role = normalizeRole(parsed?.role)

    if (!isUuid(parsed?.id) || !['donor', 'ngo'].includes(role)) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }

    return {
      id: parsed.id,
      role,
      name: parsed.name || '',
      email: parsed.email || '',
    }
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

const getDisplayName = (user, fallback) => {
  const cleanName = user?.name?.trim()
  if (cleanName) return cleanName

  const emailName = user?.email?.split('@')?.[0]
  if (emailName) return emailName

  return fallback
}

const getInitials = (name = '') => {
  const parts = name
    .split(' ')
    .map((value) => value.trim())
    .filter(Boolean)
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

const formatDateTime = (value) => {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getTimeToExpiry = (value) => {
  if (!value) return 'No expiry data'
  const expiry = new Date(value).getTime()
  if (Number.isNaN(expiry)) return 'No expiry data'

  const diffMs = expiry - Date.now()
  if (diffMs <= 0) return 'Expired'

  const totalMinutes = Math.floor(diffMs / (1000 * 60))
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60

  if (days > 0) return `${days}d ${hours}h left`
  if (hours > 0) return `${hours}h ${minutes}m left`
  return `${minutes}m left`
}

const isExpiredListing = (expiryTime) => {
  if (!expiryTime) return false
  const expiry = new Date(expiryTime).getTime()
  if (Number.isNaN(expiry)) return false
  return expiry <= Date.now()
}

const urgencyRank = (urgency = '') => {
  const normalized = String(urgency).trim().toLowerCase()
  if (normalized === 'high') return 3
  if (normalized === 'medium') return 2
  if (normalized === 'low') return 1
  return 0
}

const isPointInPolygon = (lat, lng, polygon) => {
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [latI, lngI] = polygon[i]
    const [latJ, lngJ] = polygon[j]

    const intersects =
      (latI > lat) !== (latJ > lat) &&
      lng < ((lngJ - lngI) * (lat - latI)) / (latJ - latI) + lngI

    if (intersects) inside = !inside
  }

  return inside
}

const isWithinErnakulam = (lat, lng) =>
  isPointInPolygon(lat, lng, ERNAKULAM_BOUNDARY)

const parseCoordinate = (value) => {
  const normalized = String(value ?? '').trim()
  if (!normalized) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function DonateMapPicker({ onPick }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng)
    },
  })

  return null
}

function DonateMapViewport({ latitude, longitude }) {
  const map = useMap()

  useEffect(() => {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return
    map.flyTo([latitude, longitude], Math.max(map.getZoom(), 13), {
      duration: 0.7,
    })
  }, [latitude, longitude, map])

  return null
}

function App() {
  const [route, setRoute] = useState(getRouteFromHash())
  const [authUser, setAuthUser] = useState(readStoredAuth)
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState(initialAuthForm)
  const [authStatus, setAuthStatus] = useState({ type: '', text: '' })
  const [authLoading, setAuthLoading] = useState(false)
  const [donateForm, setDonateForm] = useState(initialDonateForm)
  const [donateState, setDonateState] = useState({
    loading: false,
    type: '',
    text: '',
  })
  const [mapPickState, setMapPickState] = useState({
    loading: false,
    error: '',
    address: '',
  })
  const [ngoSelectState, setNgoSelectState] = useState({
    loadingId: '',
    type: '',
    text: '',
  })
  const [highlightedNgoListingId, setHighlightedNgoListingId] = useState('')

  useEffect(() => {
    const onHashChange = () => setRoute(getRouteFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    if (route === '/join') {
      setAuthStatus({ type: '', text: '' })
      setAuthMode('login')
      setAuthForm(initialAuthForm)
    }
  }, [route])

  useEffect(() => {
    if (route === '/donate') {
      setDonateState({ loading: false, type: '', text: '' })
      setMapPickState({ loading: false, error: '', address: '' })
    }
  }, [route])

  useEffect(() => {
    if (route === '/ngo-open-listings') return
    setNgoSelectState({ loadingId: '', type: '', text: '' })
  }, [route])

  useEffect(() => {
    if (route === '/ngo-open-listings') return
    setHighlightedNgoListingId('')
  }, [route])

  useEffect(() => {
    if (authUser) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser))
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }, [authUser])

  useEffect(() => {
    if (!authUser?.id || !isUuid(authUser.id)) {
      setDonateForm((previous) => ({ ...previous, donor_id: '' }))
      return
    }

    if (authUser.role === 'donor') {
      setDonorId(authUser.id)
      setNgoId('')
      setDonateForm((previous) => ({ ...previous, donor_id: authUser.id }))
      return
    }

    if (authUser.role === 'ngo') {
      setNgoId(authUser.id)
      setDonorId('')
      setDonateForm((previous) => ({ ...previous, donor_id: '' }))
    }
  }, [authUser])

  useEffect(() => {
    if (donorOnlyRoutes.includes(route)) {
      if (authUser?.role === 'donor') return
      window.location.hash = authUser?.role === 'ngo' ? '/ngo-dashboard' : '/join'
      return
    }

    if (ngoOnlyRoutes.includes(route)) {
      if (authUser?.role === 'ngo') return
      window.location.hash = authUser?.role === 'donor' ? '/donor-dashboard' : '/join'
    }
  }, [route, authUser])

  const whyCards = [
    {
      title: 'Rapid Local Matching',
      description:
        'Donors and NGOs connect fast based on location and immediate availability.',
    },
    {
      title: 'AI Priority Routing',
      description:
        'Urgency levels guide pickups so highly perishable food is rescued first.',
    },
    {
      title: 'Traceable Social Impact',
      description:
        'Each listing and request is tracked to measure meals saved and waste prevented.',
    },
  ]

  const currentStaticPage = staticPages[route]
  const isHome = route === '/'
  const isAuthPage = route === '/join'
  const isDonorDashboard = route === '/donor-dashboard'
  const isDonorListingsPage = route === '/my-food-listings'
  const isDonorActivityPage = route === '/donor-activity'
  const isNgoDashboard = route === '/ngo-dashboard'
  const isNgoOpenListingsPage = route === '/ngo-open-listings'
  const isNgoPartnersPage = route === '/ngo-donor-partners'
  const isNgoPickupActivityPage = route === '/ngo-pickup-activity'
  const isDonatePage = route === '/donate'
  const isNgoWorkspacePage =
    isNgoDashboard ||
    isNgoOpenListingsPage ||
    isNgoPartnersPage ||
    isNgoPickupActivityPage
  const isWorkspaceDashboard =
    isDonorDashboard || isDonorListingsPage || isDonorActivityPage || isNgoWorkspacePage
  const [donorId, setDonorId] = useState(() =>
    authUser?.role === 'donor' && isUuid(authUser?.id)
      ? authUser.id
      : safeEnvId(import.meta.env.VITE_DONOR_ID),
  )
  const [ngoId, setNgoId] = useState(() =>
    authUser?.role === 'ngo' && isUuid(authUser?.id)
      ? authUser.id
      : safeEnvId(import.meta.env.VITE_NGO_ID),
  )
  const [donorDashboard, setDonorDashboard] = useState({
    totalDonated: 0,
    count: 0,
    listings: [],
    loading: false,
    error: '',
  })
  const [ngoDashboard, setNgoDashboard] = useState({
    totalReceived: 0,
    totalDonations: 0,
    donations: [],
    available: [],
    ngoLocation: null,
    loading: false,
    error: '',
  })

  const donorCompletedListings = donorDashboard.listings.filter(
    (item) => String(item.status || '').toLowerCase() === 'completed',
  )

  const donorTrendSource = donorCompletedListings.length
    ? donorCompletedListings
    : donorDashboard.listings

  const donorTrendSeries = Object.values(
    donorTrendSource.reduce((acc, listing) => {
      if (!listing.created_at) return acc
      const createdDate = new Date(listing.created_at)
      if (Number.isNaN(createdDate.getTime())) return acc

      const monthKey = `${createdDate.getFullYear()}-${String(
        createdDate.getMonth() + 1,
      ).padStart(2, '0')}`

      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: createdDate.toLocaleString('en-US', {
            month: 'short',
            year: '2-digit',
          }),
          value: 0,
          sortStamp: new Date(
            createdDate.getFullYear(),
            createdDate.getMonth(),
            1,
          ).getTime(),
        }
      }

      acc[monthKey].value += Number(listing.quantity || 0)
      return acc
    }, {}),
  ).sort((a, b) => a.sortStamp - b.sortStamp)

  const donationTrend = donorTrendSeries.slice(-6).map((item) => ({
    month: item.month,
    value: item.value,
  }))

  const donationTrendFull = donorTrendSeries.map((item) => ({
    month: item.month,
    value: item.value,
  }))

  const donorTrendMax = Math.max(...donationTrend.map((item) => item.value), 1)
  const donorTrendFullMax = Math.max(
    ...donationTrendFull.map((item) => item.value),
    1,
  )

  const donorNgoRankings = Object.values(
    donorDashboard.listings.reduce((acc, listing) => {
      const ngoName = listing.users?.name?.trim()
      if (!ngoName) return acc

      if (!acc[ngoName]) {
        acc[ngoName] = {
          name: ngoName,
          donations: 0,
          plates: 0,
        }
      }

      acc[ngoName].donations += 1
      acc[ngoName].plates += Number(listing.quantity || 0)
      return acc
    }, {}),
  ).sort((a, b) => b.donations - a.donations || b.plates - a.plates)

  const ngoRankings = donorNgoRankings.slice(0, 5)
  const ngoRankingsFull = donorNgoRankings.slice(0, 12)

  const dashboardStats = [
    { label: 'Total Donated', value: String(donorDashboard.totalDonated) },
    { label: 'Total Listings', value: String(donorDashboard.count) },
    {
      label: 'Completed',
      value: String(
        donorDashboard.listings.filter((item) => item.status === 'completed').length,
      ),
    },
    {
      label: 'Requested',
      value: String(
        donorDashboard.listings.filter((item) => item.status === 'requested').length,
      ),
    },
  ]

  const weekAgoStamp = Date.now() - 7 * 24 * 60 * 60 * 1000
  const ngoDonorWeek = Object.values(
    ngoDashboard.donations.reduce((acc, item) => {
      const completedStamp = new Date(item.completed_at || 0).getTime()
      if (Number.isNaN(completedStamp) || completedStamp < weekAgoStamp) return acc

      const donorName = item.users?.name?.trim() || 'Unknown donor'
      if (!acc[donorName]) {
        acc[donorName] = {
          donor: donorName,
          value: 0,
          pickups: 0,
        }
      }

      acc[donorName].value += Number(item.quantity || 0)
      acc[donorName].pickups += 1
      return acc
    }, {}),
  )
    .sort((a, b) => b.value - a.value || b.pickups - a.pickups)
    .slice(0, 5)

  const ngoDonorWeekMax = Math.max(...ngoDonorWeek.map((item) => item.value), 1)

  const ngoHistory = [...ngoDashboard.donations].sort(
    (a, b) => new Date(b.completed_at) - new Date(a.completed_at),
  )

  const ngoOpenListings = ngoDashboard.available
    .filter((item) => !isExpiredListing(item.expiry_time))
    .sort((a, b) => {
      const urgencyDiff = urgencyRank(b.urgency) - urgencyRank(a.urgency)
      if (urgencyDiff !== 0) return urgencyDiff
      return new Date(a.expiry_time || 0) - new Date(b.expiry_time || 0)
    })

  const ngoLatitude = parseCoordinate(ngoDashboard.ngoLocation?.latitude)
  const ngoLongitude = parseCoordinate(ngoDashboard.ngoLocation?.longitude)
  const hasNgoLocation = ngoLatitude !== null && ngoLongitude !== null
  const ngoMapCenter = hasNgoLocation
    ? [ngoLatitude, ngoLongitude]
    : ERNAKULAM_MAP_CENTER

  const ngoMappableListings = ngoOpenListings.filter(
    (listing) =>
      Number.isFinite(Number(listing.latitude)) &&
      Number.isFinite(Number(listing.longitude)),
  )

  const ngoPartners = Object.values(
    ngoDashboard.donations.reduce((acc, donation) => {
      const donorName = donation.users?.name || 'Unknown donor'

      if (!acc[donorName]) {
        acc[donorName] = {
          name: donorName,
          donations: 0,
          plates: 0,
          lastPickup: donation.completed_at || '',
        }
      }

      acc[donorName].donations += 1
      acc[donorName].plates += Number(donation.quantity || 0)

      if (
        donation.completed_at &&
        new Date(donation.completed_at) > new Date(acc[donorName].lastPickup || 0)
      ) {
        acc[donorName].lastPickup = donation.completed_at
      }

      return acc
    }, {}),
  ).sort((a, b) => b.plates - a.plates)

  const donorDisplayName = getDisplayName(authUser, 'Donor User')
  const donorAvatar = getInitials(donorDisplayName) || 'DU'
  const ngoDisplayName = getDisplayName(authUser, 'NGO User')
  const ngoAvatar = getInitials(ngoDisplayName) || 'NG'

  const donorListingsByExpiry = [...donorDashboard.listings]
    .filter((item) => item.expiry_time && !isExpiredListing(item.expiry_time))
    .sort((a, b) => new Date(a.expiry_time) - new Date(b.expiry_time))

  const listingStatusCounts = donorDashboard.listings.reduce((acc, item) => {
    const status = String(item.status || 'unknown').toLowerCase()
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})

  useEffect(() => {
    if (!highlightedNgoListingId) return
    const stillVisible = ngoOpenListings.some(
      (listing) => listing.id === highlightedNgoListingId,
    )
    if (!stillVisible) {
      setHighlightedNgoListingId('')
    }
  }, [highlightedNgoListingId, ngoOpenListings])

  const donateLatitude = parseCoordinate(donateForm.latitude)
  const donateLongitude = parseCoordinate(donateForm.longitude)
  const hasDonateMapPoint = donateLatitude !== null && donateLongitude !== null

  const onAuthInput = (event) => {
    const { name, value } = event.target
    setAuthForm((previous) => ({ ...previous, [name]: value }))
  }

  const onAuthSubmit = async (event) => {
    event.preventDefault()
    setAuthLoading(true)
    setAuthStatus({ type: '', text: '' })

    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
    const endpoint =
      authMode === 'register' ? '/api/auth/signup' : '/api/auth/login'
    const payload =
      authMode === 'register'
        ? {
            name: authForm.name,
            role: authForm.role,
            location: authForm.location,
            email: authForm.email,
            password: authForm.password,
          }
        : {
            email: authForm.email,
            password: authForm.password,
          }

    try {
      const response = await fetch(`${apiBase}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Request failed')
      }

      setAuthStatus({
        type: 'success',
        text:
          data.message ||
          (authMode === 'register'
            ? 'Registration successful.'
            : 'Login successful.'),
      })

      if (authMode === 'register') {
        setAuthMode('login')
        setAuthForm((previous) => ({
          ...previous,
          password: '',
        }))
      } else {
        const role = normalizeRole(
          data.profile?.role || data.user?.user_metadata?.role || '',
        )
        const userId = normalizeIdValue(data.profile?.id || data.user?.id || '')

        if (!['donor', 'ngo'].includes(role)) {
          throw new Error(
            'Login succeeded but role is missing. Please contact admin.',
          )
        }
        if (!isUuid(userId)) {
          throw new Error('Login succeeded but user id is invalid. Please login again.')
        }

        const loggedInUser = {
          id: userId,
          role,
          name: data.profile?.name || data.user?.user_metadata?.name || '',
          email: data.user?.email || authForm.email,
        }

        setAuthUser(loggedInUser)

        if (role === 'donor') {
          if (userId) {
            setDonorId(userId)
            setDonateForm((previous) => ({ ...previous, donor_id: userId }))
          }
          window.location.hash = '/donor-dashboard'
        } else {
          if (userId) setNgoId(userId)
          window.location.hash = '/ngo-dashboard'
        }
      }
    } catch (error) {
      setAuthStatus({
        type: 'error',
        text: error.message,
      })
    } finally {
      setAuthLoading(false)
    }
  }

  const onLogout = () => {
    setAuthUser(null)
    setDonorId(safeEnvId(import.meta.env.VITE_DONOR_ID))
    setNgoId(safeEnvId(import.meta.env.VITE_NGO_ID))
    setDonateForm(initialDonateForm)
    setAuthStatus({ type: '', text: '' })
    setAuthMode('login')
    setAuthForm(initialAuthForm)
    window.location.hash = '/join'
  }

  const onDonateInput = (event) => {
    const { name, value } = event.target
    setDonateForm((previous) => ({ ...previous, [name]: value }))
  }

  const pinDonateLocation = ({ lat, lng }) => {
    const roundedLat = Number(lat.toFixed(6))
    const roundedLng = Number(lng.toFixed(6))

    if (!isWithinErnakulam(roundedLat, roundedLng)) {
      setDonateForm((previous) => ({
        ...previous,
        latitude: '',
        longitude: '',
      }))
      setMapPickState({
        loading: false,
        error:
          'Please choose a pickup point inside Ernakulam district boundary.',
        address: '',
      })
      return null
    }

    setDonateForm((previous) => ({
      ...previous,
      latitude: String(roundedLat),
      longitude: String(roundedLng),
    }))

    return { latitude: roundedLat, longitude: roundedLng }
  }

  const reverseGeocodeDonatePoint = async (lat, lng) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      {
        headers: {
          Accept: 'application/json',
        },
      },
    )

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error('Reverse geocoding failed')
    }

    return String(data?.display_name || '').trim()
  }

  const onDonateMapPick = async ({ lat, lng }) => {
    const pinned = pinDonateLocation({ lat, lng })
    if (!pinned) return

    setMapPickState({
      loading: true,
      error: '',
      address: '',
    })

    try {
      const resolvedAddress = await reverseGeocodeDonatePoint(
        pinned.latitude,
        pinned.longitude,
      )

      setMapPickState({
        loading: false,
        error: '',
        address: resolvedAddress,
      })

      if (resolvedAddress) {
        setDonateForm((previous) => ({
          ...previous,
          location: resolvedAddress,
        }))
      } else {
        setMapPickState({
          loading: false,
          error: 'Pin saved. Please enter location text manually.',
          address: '',
        })
      }
    } catch {
      setMapPickState({
        loading: false,
        error: 'Pin saved. Could not auto-fill address. Enter location text manually.',
        address: '',
      })
    }
  }

  const onDonateSubmit = async (event) => {
    event.preventDefault()
    setDonateState({ loading: true, type: '', text: '' })
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
    const donorIdToUse = normalizeIdValue(authUser?.id || donateForm.donor_id)

    if (!isUuid(donorIdToUse)) {
      setDonateState({
        loading: false,
        type: 'error',
        text: 'Invalid donor session. Please login again.',
      })
      return
    }

    const latitudeValue = parseCoordinate(donateForm.latitude)
    const longitudeValue = parseCoordinate(donateForm.longitude)

    if (latitudeValue === null || longitudeValue === null) {
      setDonateState({
        loading: false,
        type: 'error',
        text: 'Please select pickup location on the map.',
      })
      return
    }

    if (!isWithinErnakulam(latitudeValue, longitudeValue)) {
      setDonateState({
        loading: false,
        type: 'error',
        text: 'Pickup location must be inside Ernakulam district.',
      })
      return
    }

    const payload = {
      donor_id: donorIdToUse,
      food_type: donateForm.food_type,
      quantity: Number(donateForm.quantity),
      prep_time: donateForm.prep_time,
      location: donateForm.location,
      latitude: latitudeValue,
      longitude: longitudeValue,
    }

    try {
      const response = await fetch(`${apiBase}/api/food/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add food listing')
      }

      setDonateState({
        loading: false,
        type: 'success',
        text: data.message || 'Food listing added successfully.',
      })

      setDonateForm((previous) => ({
        ...previous,
        food_type: '',
        quantity: '',
        prep_time: '',
        location: '',
        latitude: '',
        longitude: '',
      }))
      setMapPickState({ loading: false, error: '', address: '' })
    } catch (error) {
      setDonateState({
        loading: false,
        type: 'error',
        text: error.message,
      })
    }
  }

  const onSelectFoodForNgo = async (foodId) => {
    const ngoIdToUse = normalizeIdValue(authUser?.id || ngoId)
    if (!isUuid(ngoIdToUse)) {
      setNgoSelectState({
        loadingId: '',
        type: 'error',
        text: 'Invalid NGO session. Please login again.',
      })
      return
    }

    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
    setNgoSelectState({ loadingId: foodId, type: '', text: '' })

    try {
      const response = await fetch(`${apiBase}/api/food/request/${foodId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ngo_id: ngoIdToUse }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'Failed to select food listing')
      }

      setNgoDashboard((previous) => {
        const selectedListing =
          previous.available.find((item) => item.id === foodId) || data.data || {}

        return {
          ...previous,
          available: previous.available.filter((item) => item.id !== foodId),
          donations: [
            {
              ...selectedListing,
              requested_by: ngoIdToUse,
              status: 'completed',
              completed_at: selectedListing.completed_at || new Date().toISOString(),
            },
            ...previous.donations,
          ],
          totalDonations: previous.totalDonations + 1,
          totalReceived: previous.totalReceived + Number(selectedListing.quantity || 0),
        }
      })

      setNgoSelectState({
        loadingId: '',
        type: 'success',
        text: data.message || 'Food accepted successfully.',
      })
    } catch (error) {
      setNgoSelectState({
        loadingId: '',
        type: 'error',
        text: error.message,
      })
    }
  }

  useEffect(() => {
    if (!(isDonorDashboard || isDonorListingsPage || isDonorActivityPage) || !donorId)
      return
    if (!isUuid(donorId)) return

    let isActive = true

    const fetchDonorData = async () => {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
      if (!isActive) return
      setDonorDashboard((prev) => ({ ...prev, loading: true, error: '' }))

      try {
        const [analyticsRes, listingsRes] = await Promise.all([
          fetch(`${apiBase}/api/food/donor-analytics/${donorId}`, {
            cache: 'no-store',
          }),
          fetch(`${apiBase}/api/food/donor-listings/${donorId}`, {
            cache: 'no-store',
          }),
        ])

        const analyticsData = await analyticsRes.json().catch(() => ({}))
        const listingsData = await listingsRes.json().catch(() => ({}))

        if (!analyticsRes.ok) {
          throw new Error(analyticsData.error || 'Failed to load donor analytics')
        }
        if (!listingsRes.ok) {
          throw new Error(listingsData.error || 'Failed to load donor listings')
        }

        if (!isActive) return
        setDonorDashboard({
          totalDonated: analyticsData.totalDonated || 0,
          count: listingsData.count || 0,
          listings: listingsData.listings || [],
          loading: false,
          error: '',
        })
      } catch (error) {
        if (!isActive) return
        setDonorDashboard((prev) => ({
          ...prev,
          loading: false,
          error: error.message,
        }))
      }
    }

    fetchDonorData()

    return () => {
      isActive = false
    }
  }, [isDonorDashboard, isDonorListingsPage, isDonorActivityPage, donorId, route])

  useEffect(() => {
    if (!isNgoWorkspacePage || !ngoId) return
    if (!isUuid(ngoId)) return

    let isActive = true

    const fetchNgoData = async () => {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
      if (!isActive) return
      setNgoDashboard((prev) => ({ ...prev, loading: true, error: '' }))

      try {
        const [analyticsRes, availableRes] = await Promise.all([
          fetch(`${apiBase}/api/food/ngo-analytics/${ngoId}`, {
            cache: 'no-store',
          }),
          fetch(`${apiBase}/api/food/nearby/${ngoId}`, {
            cache: 'no-store',
          }),
        ])

        const analyticsData = await analyticsRes.json().catch(() => ({}))
        const availableData = await availableRes.json().catch(() => ({}))

        if (!analyticsRes.ok) {
          throw new Error(analyticsData.error || 'Failed to load NGO analytics')
        }
        if (!availableRes.ok) {
          throw new Error(
            availableData.error || 'Failed to load available food listings',
          )
        }

        if (!isActive) return
        setNgoDashboard({
          totalReceived: analyticsData.totalReceived || 0,
          totalDonations: analyticsData.totalDonations || 0,
          donations: analyticsData.donations || [],
          available: Array.isArray(availableData.food) ? availableData.food : [],
          ngoLocation: availableData.ngo_location || null,
          loading: false,
          error: '',
        })
      } catch (error) {
        if (!isActive) return
        setNgoDashboard((prev) => ({
          ...prev,
          loading: false,
          error: error.message,
        }))
      }
    }

    fetchNgoData()

    return () => {
      isActive = false
    }
  }, [isNgoWorkspacePage, ngoId, route])

  return (
    <div className="page-shell">
      <main className="page-card">
        {!isWorkspaceDashboard && (
          <header className="topbar">
            <div className="brand">
              <span className="brand-mark">RF</span>
              <div>
                <p className="brand-name">MealBridge</p>
                <p className="brand-subtitle">Food Redistribution Portal</p>
              </div>
            </div>
            <nav className="menu">
              {navLinks.map((link) => (
                <a
                  key={link.path}
                  href={`#${link.path}`}
                  className={route === link.path ? 'active-link' : ''}
                >
                  {link.label}
                </a>
              ))}
            </nav>
            {authUser ? (
              <button type="button" className="cta-mini" onClick={onLogout}>
                Logout
              </button>
            ) : (
              <a className="cta-mini" href="#/join">
                Join Now
              </a>
            )}
          </header>
        )}

        {isHome ? (
          <>
            <section className="hero">
              <div className="hero-copy">
                <p className="hero-kicker">Be The Reason</p>
                <h1>Someone Smiles Today!</h1>
                <p>
                  ReFood helps donors and NGOs coordinate surplus food rescue in real
                  time, with AI-based urgency guidance to reduce edible food waste.
                </p>
                <div className="hero-actions">
                  <a href="#/donate" className="hero-btn">
                    Donate Now
                    <span className="arrow-badge" aria-hidden="true">
                      <svg viewBox="0 0 16 16" className="arrow-icon">
                        <path
                          d="M3.5 8h7.2M8.9 5.3L12.2 8l-3.3 2.7"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </a>
                </div>
              </div>
              <div className="hero-panel">
                <img
                  src={heroIllustration}
                  alt="Food donation illustration"
                  className="hero-illustration"
                />
              </div>
            </section>

            <section id="why-ref-food" className="why-section">
              <h2>Why Choose Us?</h2>
              <div className="why-grid">
                {whyCards.map((card, index) => (
                  <article
                    key={card.title}
                    className={`why-item ${index === 1 ? 'why-item-focus' : ''}`}
                  >
                    <div className="why-icon" aria-hidden="true">
                      {index + 1}
                    </div>
                    <h3>{card.title}</h3>
                    <p>{card.description}</p>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : isAuthPage ? (
          <section className="auth-page">
            <div className="auth-head">
              <p className="static-kicker">Join MealBridge</p>
              <h1>Login or create your account.</h1>
            </div>

            <div className="auth-switch" role="tablist" aria-label="Auth mode">
              <button
                type="button"
                className={authMode === 'login' ? 'tab active-tab' : 'tab'}
                onClick={() => setAuthMode('login')}
              >
                Login
              </button>
              <button
                type="button"
                className={authMode === 'register' ? 'tab active-tab' : 'tab'}
                onClick={() => setAuthMode('register')}
              >
                Register
              </button>
            </div>

            <form className="auth-form" onSubmit={onAuthSubmit}>
              {authMode === 'register' && (
                <>
                  <label>
                    Full Name
                    <input
                      name="name"
                      type="text"
                      value={authForm.name}
                      onChange={onAuthInput}
                      required
                      placeholder="Enter your full name"
                    />
                  </label>
                  <label>
                    Role
                    <select name="role" value={authForm.role} onChange={onAuthInput}>
                      <option value="donor">Donor</option>
                      <option value="ngo">NGO</option>
                    </select>
                  </label>
                  <label>
                    {authForm.role === 'ngo' ? 'NGO Location' : 'Location'}
                    <input
                      name="location"
                      type="text"
                      value={authForm.location}
                      onChange={onAuthInput}
                      required={authForm.role === 'ngo'}
                      placeholder={
                        authForm.role === 'ngo'
                          ? 'e.g. Aluva, Ernakulam'
                          : 'City / Area'
                      }
                    />
                  </label>
                </>
              )}

              <label>
                Email
                <input
                  name="email"
                  type="email"
                  value={authForm.email}
                  onChange={onAuthInput}
                  required
                  placeholder="Enter your email"
                />
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  value={authForm.password}
                  onChange={onAuthInput}
                  required
                  placeholder="Enter your password"
                />
              </label>

              <button type="submit" className="auth-submit" disabled={authLoading}>
                {authLoading
                  ? 'Please wait...'
                  : authMode === 'register'
                    ? 'Create Account'
                    : 'Login'}
              </button>
            </form>

            {authStatus.text && (
              <p
                className={
                  authStatus.type === 'success' ? 'auth-msg success' : 'auth-msg error'
                }
              >
                {authStatus.text}
              </p>
            )}
          </section>
        ) : isDonatePage ? (
          <section className="donate-page">
            <div className="donate-shell">
              <p className="static-kicker">Donor Donate Page</p>
              <h1>Add Surplus Food</h1>
              <p className="static-text">
                Submit food details so NGOs can discover and request pickup.
              </p>

              <form className="donate-form" onSubmit={onDonateSubmit}>
                <label>
                  Food Type
                  <input
                    name="food_type"
                    value={donateForm.food_type}
                    onChange={onDonateInput}
                    required
                    placeholder="e.g. Rice + Curry"
                  />
                </label>
                <label>
                  Quantity (in plates)
                  <input
                    name="quantity"
                    type="number"
                    min="1"
                    value={donateForm.quantity}
                    onChange={onDonateInput}
                    required
                    placeholder="e.g. 25"
                  />
                </label>
                <label>
                  Prepared Time
                  <input
                    name="prep_time"
                    type="datetime-local"
                    value={donateForm.prep_time}
                    onChange={onDonateInput}
                    required
                  />
                </label>
                <label>
                  Location (text)
                  <input
                    name="location"
                    value={donateForm.location}
                    onChange={onDonateInput}
                    required
                    placeholder="Area / Landmark"
                  />
                </label>
                <div className="donate-map-section">
                  <p className="donate-map-label">
                    Pickup Pin (Ernakulam district only)
                  </p>
                  <p className="donate-map-help">
                    Click on the map to choose exact pickup location. Coordinates
                    are saved automatically.
                  </p>
                  <MapContainer
                    center={ERNAKULAM_MAP_CENTER}
                    zoom={10}
                    className="donate-map"
                    scrollWheelZoom
                  >
                    <TileLayer
                      attribution='&copy; OpenStreetMap contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Polygon
                      positions={ERNAKULAM_BOUNDARY}
                      pathOptions={{
                        color: '#0f5f8c',
                        weight: 2,
                        fillOpacity: 0.09,
                      }}
                    />
                    {hasDonateMapPoint && (
                      <Marker
                        icon={leafletMarkerIcon}
                        position={[donateLatitude, donateLongitude]}
                      >
                        <Popup>Pickup location selected</Popup>
                      </Marker>
                    )}
                    <DonateMapPicker onPick={onDonateMapPick} />
                    <DonateMapViewport
                      latitude={donateLatitude}
                      longitude={donateLongitude}
                    />
                  </MapContainer>

                  <p className="donate-map-selected">
                    {hasDonateMapPoint
                      ? `Selected: ${donateLatitude.toFixed(6)}, ${donateLongitude.toFixed(6)}`
                      : 'No map pin selected yet'}
                  </p>
                  {mapPickState.loading && (
                    <p className="donate-map-status">Finding nearest address...</p>
                  )}
                  {mapPickState.address && (
                    <p className="donate-map-status">{mapPickState.address}</p>
                  )}
                  {mapPickState.error && (
                    <p className="donate-map-error">{mapPickState.error}</p>
                  )}
                </div>

                <button className="donate-submit" type="submit" disabled={donateState.loading}>
                  {donateState.loading ? 'Submitting...' : 'Submit Listing'}
                </button>
              </form>

              {donateState.text && (
                <p className={donateState.type === 'success' ? 'auth-msg success' : 'auth-msg error'}>
                  {donateState.text}
                </p>
              )}
            </div>
          </section>
        ) : isDonorDashboard ? (
          <section className="donor-dashboard">
            <aside className="dash-sidebar">
              <div className="dash-brand">
                <span className="brand-mark">RF</span>
                <div>
                  <p className="dash-brand-title">MealBridge</p>
                  <p className="dash-brand-sub">Donor panel</p>
                </div>
              </div>
              <a href="#/donate" className="dash-primary-btn">
                New donation
              </a>
              <nav className="dash-nav">
                <a
                  className={
                    isDonorDashboard ? 'dash-link active-dash-link' : 'dash-link'
                  }
                  href="#/donor-dashboard"
                >
                  Dashboard
                </a>
                <a
                  className={
                    isDonorListingsPage ? 'dash-link active-dash-link' : 'dash-link'
                  }
                  href="#/my-food-listings"
                >
                  Donations
                </a>
                <a
                  className={
                    isDonorActivityPage ? 'dash-link active-dash-link' : 'dash-link'
                  }
                  href="#/donor-activity"
                >
                  Activity
                </a>
              </nav>
              <button type="button" className="dash-logout-btn" onClick={onLogout}>
                Logout
              </button>
              <a className="dash-secondary-btn" href="#/">
                Back to Website
              </a>
            </aside>

            <div className="dash-main">
              <header className="dash-topbar">
                <div>
                  <p className="static-kicker">Donor Workspace</p>
                  <h1>Donor Dashboard</h1>
                </div>
                <div className="dash-user">
                  <span className="dash-avatar">{donorAvatar}</span>
                  <div>
                    <p className="dash-user-name">{donorDisplayName}</p>
                    <p className="dash-user-role">Donor account</p>
                  </div>
                </div>
              </header>

              {donorDashboard.error && (
                <p className="dash-error">{donorDashboard.error}</p>
              )}
              {donorDashboard.loading && <p className="dash-loading">Loading donor data...</p>}

              <section className="dash-stats-grid">
                {dashboardStats.map((stat) => (
                  <article key={stat.label} className="dash-stat-card">
                    <p className="dash-stat-value">{stat.value}</p>
                    <p className="dash-stat-label">{stat.label}</p>
                  </article>
                ))}
              </section>

              <section className="dash-panels donor-main-graphs">
                <article className="dash-panel chart-panel">
                  <div className="panel-head">
                    <h2>Donation Volume Trend</h2>
                    <p>Last 6 months</p>
                  </div>
                  <div className="donor-trend-bars">
                    {donationTrend.length ? (
                      donationTrend.map((item) => {
                        const barHeight = Math.max(
                          (item.value / donorTrendMax) * 100,
                          12,
                        )
                        return (
                          <div key={item.month} className="donor-trend-item">
                            <div
                              className="donor-trend-fill"
                              style={{ height: `${barHeight}%` }}
                            />
                            <span>{item.month}</span>
                          </div>
                        )
                      })
                    ) : (
                      <p className="empty-card">No donor history to chart</p>
                    )}
                  </div>
                </article>

                <article className="dash-panel ngo-ranking-panel">
                  <div className="panel-head">
                    <h2>Most Frequent NGO Partners</h2>
                    <p>Rank wise</p>
                  </div>
                  <ol className="ngo-rank-list">
                    {ngoRankings.length ? (
                      ngoRankings.map((ngo, index) => (
                        <li key={ngo.name} className="ngo-rank-item">
                          <span className="ngo-rank-index">#{index + 1}</span>
                          <div>
                            <p className="ngo-rank-name">{ngo.name}</p>
                            <p className="ngo-rank-meta">
                              {ngo.donations} donations · {ngo.plates} plates
                            </p>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="ngo-rank-empty">No NGO mappings yet</li>
                    )}
                  </ol>
                </article>
              </section>

              <section className="dash-panels donor-recent-row">
                <article className="dash-panel donor-recent-panel">
                  <div className="panel-head">
                    <h2>Recent Donations</h2>
                  </div>
                  <div className="donor-table">
                    <div className="donor-row donor-row-head">
                      <span>Food Type</span>
                      <span>Qty</span>
                      <span>Status</span>
                      <span>NGO</span>
                    </div>
                    {donorDashboard.listings.slice(0, 5).length ? (
                      donorDashboard.listings.slice(0, 5).map((listing) => (
                        <div className="donor-row" key={listing.id}>
                          <span>{listing.food_type}</span>
                          <span>{listing.quantity}</span>
                          <span>{listing.status}</span>
                          <span>{listing.users?.name || '-'}</span>
                        </div>
                      ))
                    ) : (
                      <p className="empty-card">No recent donations yet</p>
                    )}
                  </div>
                </article>
              </section>
            </div>
          </section>
        ) : isDonorListingsPage ? (
          <section className="donor-dashboard donor-listings-dashboard">
            <aside className="dash-sidebar">
              <div className="dash-brand">
                <span className="brand-mark">RF</span>
                <div>
                  <p className="dash-brand-title">MealBridge</p>
                  <p className="dash-brand-sub">Donor panel</p>
                </div>
              </div>
              <a href="#/donate" className="dash-primary-btn">
                New donation
              </a>
              <nav className="dash-nav">
                <a
                  className={
                    isDonorDashboard ? 'dash-link active-dash-link' : 'dash-link'
                  }
                  href="#/donor-dashboard"
                >
                  Dashboard
                </a>
                <a
                  className={
                    isDonorListingsPage ? 'dash-link active-dash-link' : 'dash-link'
                  }
                  href="#/my-food-listings"
                >
                  Donations
                </a>
                <a
                  className={
                    isDonorActivityPage ? 'dash-link active-dash-link' : 'dash-link'
                  }
                  href="#/donor-activity"
                >
                  Activity
                </a>
              </nav>
              <button type="button" className="dash-logout-btn" onClick={onLogout}>
                Logout
              </button>
              <a className="dash-secondary-btn" href="#/">
                Back to Website
              </a>
            </aside>

            <div className="dash-main">
              <header className="dash-topbar">
                <div>
                  <p className="static-kicker">Donor Workspace</p>
                  <h1>My Food Listings</h1>
                </div>
                <div className="dash-user">
                  <span className="dash-avatar">{donorAvatar}</span>
                  <div>
                    <p className="dash-user-name">{donorDisplayName}</p>
                    <p className="dash-user-role">Donor account</p>
                  </div>
                </div>
              </header>

              {donorDashboard.error && (
                <p className="dash-error">{donorDashboard.error}</p>
              )}
              {donorDashboard.loading && <p className="dash-loading">Loading your listings...</p>}

              <section className="listing-summary-grid">
                <article className="dash-stat-card">
                  <p className="dash-stat-value">{donorDashboard.count}</p>
                  <p className="dash-stat-label">Total Listings</p>
                </article>
                <article className="dash-stat-card">
                  <p className="dash-stat-value">{listingStatusCounts.available || 0}</p>
                  <p className="dash-stat-label">Available</p>
                </article>
                <article className="dash-stat-card">
                  <p className="dash-stat-value">{listingStatusCounts.requested || 0}</p>
                  <p className="dash-stat-label">Requested</p>
                </article>
                <article className="dash-stat-card">
                  <p className="dash-stat-value">{listingStatusCounts.completed || 0}</p>
                  <p className="dash-stat-label">Completed</p>
                </article>
              </section>

              <section className="dash-panel donor-listings-panel">
                <div className="panel-head">
                  <h2>Listings With Expiry</h2>
                  <p>Earliest expiry first</p>
                </div>

                <div className="listing-grid">
                  {donorListingsByExpiry.length ? (
                    donorListingsByExpiry.map((listing) => {
                      const status = String(listing.status || 'unknown').toLowerCase()
                      const statusClass = `status-pill status-${status}`
                      return (
                        <article key={listing.id} className="listing-card">
                          <div className="listing-card-head">
                            <h3>{listing.food_type}</h3>
                            <span className={statusClass}>{status}</span>
                          </div>
                          <p>
                            <strong>Quantity:</strong> {listing.quantity} plates
                          </p>
                          <p>
                            <strong>Location:</strong> {listing.location || 'N/A'}
                          </p>
                          <p>
                            <strong>Urgency:</strong> {listing.urgency || 'N/A'}
                          </p>
                          <p>
                            <strong>Expires:</strong> {formatDateTime(listing.expiry_time)}
                          </p>
                          <p className="listing-expiry-left">
                            {getTimeToExpiry(listing.expiry_time)}
                          </p>
                        </article>
                      )
                    })
                  ) : (
                    <p className="empty-card">
                      No active listings with valid expiry found.
                    </p>
                  )}
                </div>
              </section>
            </div>
          </section>
        ) : isDonorActivityPage ? (
          <section className="donor-dashboard donor-activity-dashboard">
            <aside className="dash-sidebar">
              <div className="dash-brand">
                <span className="brand-mark">RF</span>
                <div>
                  <p className="dash-brand-title">MealBridge</p>
                  <p className="dash-brand-sub">Donor panel</p>
                </div>
              </div>
              <a href="#/donate" className="dash-primary-btn">
                New donation
              </a>
              <nav className="dash-nav">
                <a
                  className={
                    isDonorDashboard ? 'dash-link active-dash-link' : 'dash-link'
                  }
                  href="#/donor-dashboard"
                >
                  Dashboard
                </a>
                <a
                  className={
                    isDonorListingsPage ? 'dash-link active-dash-link' : 'dash-link'
                  }
                  href="#/my-food-listings"
                >
                  Donations
                </a>
                <a
                  className={
                    isDonorActivityPage ? 'dash-link active-dash-link' : 'dash-link'
                  }
                  href="#/donor-activity"
                >
                  Activity
                </a>
              </nav>
              <button type="button" className="dash-logout-btn" onClick={onLogout}>
                Logout
              </button>
              <a className="dash-secondary-btn" href="#/">
                Back to Website
              </a>
            </aside>

            <div className="dash-main">
              <header className="dash-topbar">
                <div>
                  <p className="static-kicker">Donor Workspace</p>
                  <h1>Donation Activity</h1>
                </div>
                <div className="dash-user">
                  <span className="dash-avatar">{donorAvatar}</span>
                  <div>
                    <p className="dash-user-name">{donorDisplayName}</p>
                    <p className="dash-user-role">Donor account</p>
                  </div>
                </div>
              </header>

              {donorDashboard.error && (
                <p className="dash-error">{donorDashboard.error}</p>
              )}
              {donorDashboard.loading && <p className="dash-loading">Loading activity...</p>}

              <section className="dash-panels donor-activity-graphs">
                <article className="dash-panel donor-activity-panel donor-activity-graph-panel">
                  <div className="panel-head">
                    <h2>Full Donation Trend</h2>
                    <p>All recorded months</p>
                  </div>

                  <div className="donor-trend-bars donor-trend-bars-full">
                    {donationTrendFull.length ? (
                      donationTrendFull.map((item) => {
                        const barHeight = Math.max(
                          (item.value / donorTrendFullMax) * 100,
                          12,
                        )
                        return (
                          <div key={item.month} className="donor-trend-item">
                            <div
                              className="donor-trend-fill"
                              style={{ height: `${barHeight}%` }}
                            />
                            <span>{item.month}</span>
                          </div>
                        )
                      })
                    ) : (
                      <p className="empty-card">No activity data yet</p>
                    )}
                  </div>
                </article>

                <article className="dash-panel donor-activity-panel donor-activity-rank-panel">
                  <div className="panel-head">
                    <h2>Most Frequent NGO Partners</h2>
                    <p>Rank wise</p>
                  </div>
                  <ol className="ngo-rank-list ngo-rank-list-detailed">
                    {ngoRankingsFull.length ? (
                      ngoRankingsFull.map((ngo, index) => (
                        <li key={`activity-${ngo.name}`} className="ngo-rank-item">
                          <span className="ngo-rank-index">#{index + 1}</span>
                          <div>
                            <p className="ngo-rank-name">{ngo.name}</p>
                            <p className="ngo-rank-meta">
                              {ngo.donations} donations · {ngo.plates} plates
                            </p>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="ngo-rank-empty">No NGO mappings yet</li>
                    )}
                  </ol>
                </article>
              </section>

              <section className="dash-panel donor-activity-table">
                <div className="panel-head">
                  <h2>Monthly Volume</h2>
                </div>
                <div className="donor-table">
                  <div className="donor-row donor-row-head">
                    <span>Month</span>
                    <span>Plates</span>
                    <span>Note</span>
                    <span>Signal</span>
                  </div>
                  {donationTrendFull.length ? (
                    donationTrendFull.map((item) => (
                      <div className="donor-row" key={`trend-${item.month}`}>
                        <span>{item.month}</span>
                        <span>{item.value}</span>
                        <span>Donor contribution</span>
                        <span>{item.value >= 50 ? 'High' : 'Normal'}</span>
                      </div>
                    ))
                  ) : (
                    <p className="empty-card">No monthly records yet</p>
                  )}
                </div>
              </section>
            </div>
          </section>
        ) : isNgoDashboard ? (
          <section className="donor-dashboard ngo-dashboard">
            <aside className="dash-sidebar">
              <div className="dash-brand">
                <span className="brand-mark">RF</span>
                <div>
                  <p className="dash-brand-title">MealBridge</p>
                  <p className="dash-brand-sub">NGO panel</p>
                </div>
              </div>
              <a href="#/ngo-dashboard" className="dash-primary-btn">
                NGO dashboard
              </a>
              <nav className="dash-nav">
                <a
                  className={isNgoDashboard ? 'dash-link active-dash-link' : 'dash-link'}
                  href="#/ngo-dashboard"
                >
                  Dashboard
                </a>
                <a
                  className={
                    isNgoOpenListingsPage ? 'dash-link active-dash-link' : 'dash-link'
                  }
                  href="#/ngo-open-listings"
                >
                  Available Food
                </a>
                <a
                  className={
                    isNgoPartnersPage ? 'dash-link active-dash-link' : 'dash-link'
                  }
                  href="#/ngo-donor-partners"
                >
                  Donor Partners
                </a>
                <a
                  className={
                    isNgoPickupActivityPage
                      ? 'dash-link active-dash-link'
                      : 'dash-link'
                  }
                  href="#/ngo-pickup-activity"
                >
                  Pickup Activity
                </a>              </nav>
              <button type="button" className="dash-logout-btn" onClick={onLogout}>
                Logout
              </button>
              <a className="dash-secondary-btn" href="#/">
                Back to Website
              </a>
            </aside>

            <div className="dash-main">
              <header className="dash-topbar">
                <div>
                  <p className="static-kicker">NGO Workspace</p>
                  <h1>NGO Dashboard</h1>
                </div>
                <div className="dash-user">
                  <span className="dash-avatar">{ngoAvatar}</span>
                  <div>
                    <p className="dash-user-name">{ngoDisplayName}</p>
                    <p className="dash-user-role">NGO account</p>
                  </div>
                </div>
              </header>

              {ngoDashboard.error && <p className="dash-error">{ngoDashboard.error}</p>}
              {ngoDashboard.loading && <p className="dash-loading">Loading NGO data...</p>}

              <section className="ngo-grid">
                <article className="dash-panel ngo-panel tall-left">
                  <div className="panel-head">
                    <h2>Top 5 Donors (This Week)</h2>
                    <p>Last 7 days</p>
                  </div>
                  <div className="ngo-bar-chart">
                    {ngoDonorWeek.length ? (
                      ngoDonorWeek.map((item) => {
                        const barHeight = Math.max(
                          (item.value / ngoDonorWeekMax) * 100,
                          12,
                        )
                        return (
                          <div key={item.donor} className="ngo-bar-item">
                            <div
                              className="ngo-bar-fill"
                              style={{ height: `${barHeight}%` }}
                            />
                            <span>{item.donor}</span>
                          </div>
                        )
                      })
                    ) : (
                      <p className="empty-card">No completed donations in the last 7 days</p>
                    )}
                  </div>
                </article>

                <article className="dash-panel ngo-panel">
                  <div className="panel-head">
                    <h2>Meals Fed</h2>
                  </div>
                  <p className="ngo-big-number">{ngoDashboard.totalReceived}</p>
                  <p className="ngo-meta">Completed food plate count - lifetime</p>
                </article>

                <article className="dash-panel ngo-action-panel">
                  <h2>View Available Food</h2>
                  <p>{ngoOpenListings.length} active food listings available now.</p>
                  <a
                    href="#/ngo-open-listings"
                    className="dash-primary-btn action-btn"
                  >
                    Open Listings
                  </a>
                </article>

                <article className="dash-panel ngo-action-panel">
                  <h2>Pickup Activity</h2>
                  <p>
                    {ngoDashboard.totalDonations} auto-accepted pickups completed so
                    far.
                  </p>
                  <a href="#/ngo-pickup-activity" className="dash-primary-btn action-btn">
                    View Activity
                  </a>
                </article>
              </section>
            </div>
          </section>
        ) : isNgoOpenListingsPage ? (
          <section className="donor-dashboard ngo-dashboard">
            <aside className="dash-sidebar">
              <div className="dash-brand">
                <span className="brand-mark">RF</span>
                <div>
                  <p className="dash-brand-title">MealBridge</p>
                  <p className="dash-brand-sub">NGO panel</p>
                </div>
              </div>
              <a href="#/ngo-dashboard" className="dash-primary-btn">
                NGO dashboard
              </a>
              <nav className="dash-nav">
                <a
                  className={isNgoDashboard ? 'dash-link active-dash-link' : 'dash-link'}
                  href="#/ngo-dashboard"
                >
                  Dashboard
                </a>
                <a
                  className={
                    isNgoOpenListingsPage ? 'dash-link active-dash-link' : 'dash-link'
                  }
                  href="#/ngo-open-listings"
                >
                  Available Food
                </a>
                <a
                  className={
                    isNgoPartnersPage ? 'dash-link active-dash-link' : 'dash-link'
                  }
                  href="#/ngo-donor-partners"
                >
                  Donor Partners
                </a>
                <a
                  className={
                    isNgoPickupActivityPage
                      ? 'dash-link active-dash-link'
                      : 'dash-link'
                  }
                  href="#/ngo-pickup-activity"
                >
                  Pickup Activity
                </a>              </nav>
              <button type="button" className="dash-logout-btn" onClick={onLogout}>
                Logout
              </button>
              <a className="dash-secondary-btn" href="#/">
                Back to Website
              </a>
            </aside>

            <div className="dash-main">
              <header className="dash-topbar">
                <div>
                  <p className="static-kicker">NGO Workspace</p>
                  <h1>Open Food Listings</h1>
                </div>
                <div className="dash-user">
                  <span className="dash-avatar">{ngoAvatar}</span>
                  <div>
                    <p className="dash-user-name">{ngoDisplayName}</p>
                    <p className="dash-user-role">NGO account</p>
                  </div>
                </div>
              </header>

              {ngoDashboard.error && <p className="dash-error">{ngoDashboard.error}</p>}
              {ngoDashboard.loading && <p className="dash-loading">Loading open listings...</p>}
              {ngoSelectState.text && (
                <p
                  className={
                    ngoSelectState.type === 'success'
                      ? 'auth-msg success'
                      : 'auth-msg error'
                  }
                >
                  {ngoSelectState.text}
                </p>
              )}

              <section className="dash-panel ngo-open-panel">
                <div className="panel-head">
                  <h2>Available Nearby Food</h2>
                  <p>Within 15 km radius</p>
                </div>

                <div className="ngo-open-map-wrap">
                  <MapContainer
                    center={ngoMapCenter}
                    zoom={12}
                    className="ngo-open-map"
                    scrollWheelZoom
                  >
                    <TileLayer
                      attribution='&copy; OpenStreetMap contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Circle
                      center={ngoMapCenter}
                      radius={NGO_LISTING_RADIUS_METERS}
                      pathOptions={{
                        color: '#0f5f8c',
                        weight: 2,
                        fillColor: '#8bd0e5',
                        fillOpacity: 0.12,
                      }}
                    />
                    {hasNgoLocation && (
                      <Marker icon={leafletMarkerIcon} position={ngoMapCenter}>
                        <Popup>Your NGO location</Popup>
                      </Marker>
                    )}
                    {ngoMappableListings.map((listing) => (
                      <Marker
                        key={`map-${listing.id}`}
                        icon={leafletMarkerIcon}
                        position={[Number(listing.latitude), Number(listing.longitude)]}
                        eventHandlers={{
                          click: () => setHighlightedNgoListingId(listing.id),
                        }}
                      >
                        <Popup>
                          <strong>{listing.food_type || 'Food listing'}</strong>
                          <br />
                          Qty: {listing.quantity || 0} plates
                          <br />
                          {listing.location || 'N/A'}
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                  {!hasNgoLocation && (
                    <p className="ngo-open-map-note">
                      Showing Ernakulam center by default. Set NGO location during
                      registration for exact nearby radius.
                    </p>
                  )}
                </div>

                <p className="ngo-open-count">{ngoOpenListings.length} active listings</p>

                <div className="listing-grid ngo-open-grid">
                  {ngoOpenListings.length ? (
                    ngoOpenListings.map((listing) => {
                      const urgency = String(listing.urgency || 'unknown').toLowerCase()
                      const urgencyClass = `status-pill status-${urgency}`
                      return (
                        <article
                          key={listing.id}
                          className={`listing-card ${
                            highlightedNgoListingId === listing.id
                              ? 'listing-card-highlight'
                              : ''
                          }`}
                        >
                          <div className="listing-card-head">
                            <h3>{listing.food_type || 'Food listing'}</h3>
                            <span className={urgencyClass}>{urgency}</span>
                          </div>
                          <p>
                            <strong>Quantity:</strong> {listing.quantity || 0} plates
                          </p>
                          <p>
                            <strong>Location:</strong> {listing.location || 'N/A'}
                          </p>
                          <p>
                            <strong>Prep Time:</strong> {formatDateTime(listing.prep_time)}
                          </p>
                          <p>
                            <strong>Expiry:</strong> {formatDateTime(listing.expiry_time)}
                          </p>
                          <p className="listing-expiry-left">
                            {getTimeToExpiry(listing.expiry_time)}
                          </p>
                          <button
                            type="button"
                            className="listing-select-btn"
                            onClick={() => onSelectFoodForNgo(listing.id)}
                            disabled={ngoSelectState.loadingId === listing.id}
                          >
                            {ngoSelectState.loadingId === listing.id
                              ? 'Selecting...'
                              : 'Select Food'}
                          </button>
                        </article>
                      )
                    })
                  ) : (
                    <p className="empty-card">No open listings available right now.</p>
                  )}
                </div>
              </section>
            </div>
          </section>
        ) : isNgoPartnersPage ? (
          <section className="donor-dashboard ngo-dashboard">
            <aside className="dash-sidebar">
              <div className="dash-brand">
                <span className="brand-mark">RF</span>
                <div>
                  <p className="dash-brand-title">MealBridge</p>
                  <p className="dash-brand-sub">NGO panel</p>
                </div>
              </div>
              <a href="#/ngo-dashboard" className="dash-primary-btn">
                NGO dashboard
              </a>
              <nav className="dash-nav">
                <a
                  className={isNgoDashboard ? 'dash-link active-dash-link' : 'dash-link'}
                  href="#/ngo-dashboard"
                >
                  Dashboard
                </a>
                <a
                  className={
                    isNgoOpenListingsPage ? 'dash-link active-dash-link' : 'dash-link'
                  }
                  href="#/ngo-open-listings"
                >
                  Available Food
                </a>
                <a
                  className={
                    isNgoPartnersPage ? 'dash-link active-dash-link' : 'dash-link'
                  }
                  href="#/ngo-donor-partners"
                >
                  Donor Partners
                </a>
                <a
                  className={
                    isNgoPickupActivityPage
                      ? 'dash-link active-dash-link'
                      : 'dash-link'
                  }
                  href="#/ngo-pickup-activity"
                >
                  Pickup Activity
                </a>              </nav>
              <button type="button" className="dash-logout-btn" onClick={onLogout}>
                Logout
              </button>
              <a className="dash-secondary-btn" href="#/">
                Back to Website
              </a>
            </aside>

            <div className="dash-main">
              <header className="dash-topbar">
                <div>
                  <p className="static-kicker">NGO Workspace</p>
                  <h1>Donor Partners</h1>
                </div>
                <div className="dash-user">
                  <span className="dash-avatar">{ngoAvatar}</span>
                  <div>
                    <p className="dash-user-name">{ngoDisplayName}</p>
                    <p className="dash-user-role">NGO account</p>
                  </div>
                </div>
              </header>

              <section className="dash-panel ngo-partners-panel">
                <div className="panel-head">
                  <h2>Accepted Donor Network</h2>
                  <p>{ngoPartners.length} active partners</p>
                </div>

                <div className="ngo-partner-grid">
                  {ngoPartners.length ? (
                    ngoPartners.map((partner, index) => (
                      <article key={partner.name} className="ngo-partner-card">
                        <div className="ngo-partner-rank">#{index + 1}</div>
                        <h3>{partner.name}</h3>
                        <p>
                          <strong>{partner.plates}</strong> plates contributed
                        </p>
                        <p>{partner.donations} accepted donations</p>
                        <p>Last pickup: {formatDateTime(partner.lastPickup)}</p>
                      </article>
                    ))
                  ) : (
                    <p className="empty-card">No accepted donor partners yet.</p>
                  )}
                </div>
              </section>
            </div>
          </section>
        ) : isNgoPickupActivityPage ? (
          <section className="donor-dashboard ngo-dashboard">
            <aside className="dash-sidebar">
              <div className="dash-brand">
                <span className="brand-mark">RF</span>
                <div>
                  <p className="dash-brand-title">MealBridge</p>
                  <p className="dash-brand-sub">NGO panel</p>
                </div>
              </div>
              <a href="#/ngo-dashboard" className="dash-primary-btn">
                NGO dashboard
              </a>
              <nav className="dash-nav">
                <a
                  className={isNgoDashboard ? 'dash-link active-dash-link' : 'dash-link'}
                  href="#/ngo-dashboard"
                >
                  Dashboard
                </a>
                <a
                  className={
                    isNgoOpenListingsPage ? 'dash-link active-dash-link' : 'dash-link'
                  }
                  href="#/ngo-open-listings"
                >
                  Available Food
                </a>
                <a
                  className={
                    isNgoPartnersPage ? 'dash-link active-dash-link' : 'dash-link'
                  }
                  href="#/ngo-donor-partners"
                >
                  Donor Partners
                </a>
                <a
                  className={
                    isNgoPickupActivityPage
                      ? 'dash-link active-dash-link'
                      : 'dash-link'
                  }
                  href="#/ngo-pickup-activity"
                >
                  Pickup Activity
                </a>              </nav>
              <button type="button" className="dash-logout-btn" onClick={onLogout}>
                Logout
              </button>
              <a className="dash-secondary-btn" href="#/">
                Back to Website
              </a>
            </aside>

            <div className="dash-main">
              <header className="dash-topbar">
                <div>
                  <p className="static-kicker">NGO Workspace</p>
                  <h1>Pickup Activity</h1>
                </div>
                <div className="dash-user">
                  <span className="dash-avatar">{ngoAvatar}</span>
                  <div>
                    <p className="dash-user-name">{ngoDisplayName}</p>
                    <p className="dash-user-role">NGO account</p>
                  </div>
                </div>
              </header>

              <section className="dash-panel pickup-activity-panel">
                <div className="panel-head">
                  <h2>Recent Pickup Timeline</h2>
                  <p>Latest completed pickups</p>
                </div>
                <div className="pickup-timeline">
                  {ngoHistory.length ? (
                    ngoHistory.map((item, index) => (
                      <article key={`pickup-${item.id}`} className="pickup-item">
                        <span className="pickup-index">{index + 1}</span>
                        <div>
                          <p className="pickup-title">
                            {item.food_type || 'Food pickup'} · {item.quantity || 0} plates
                          </p>
                          <p className="pickup-meta">
                            Donor: {item.users?.name || 'Unknown donor'} | Location:{' '}
                            {item.location || 'N/A'}
                          </p>
                          <p className="pickup-meta">
                            Completed: {formatDateTime(item.completed_at)}
                          </p>
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="empty-card">No pickup activity yet.</p>
                  )}
                </div>
              </section>
            </div>
          </section>
        ) : (
          <section className="static-page">
            <p className="static-kicker">{currentStaticPage?.kicker || 'MealBridge'}</p>
            <h1>{currentStaticPage?.title || 'Page Not Found'}</h1>
            <p className="static-text">
              {currentStaticPage?.text ||
                'This route is not available yet. Please use the main navigation.'}
            </p>
            {currentStaticPage && (
              <div className="static-points">
                {currentStaticPage.points.map((point) => (
                  <article key={point} className="static-point">
                    {point}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {!isWorkspaceDashboard && (
          <footer className={`site-footer ${isHome ? 'home-footer-gap' : ''}`}>
            <div className="footer-brand">
              <p className="footer-title">MealBridge</p>
              <p>
                AI-assisted food redistribution portal helping donors and NGOs rescue
                surplus food in time.
              </p>
            </div>
            <div className="footer-links">
              <p>Platform</p>
              <a href="#/donate">Donate</a>
              {!authUser && <a href="#/join">Join Now</a>}
              <a href="#/ngo-dashboard">NGO Dashboard</a>
              <a href="#/donor-dashboard">Donor Dashboard</a>
            </div>
            <div className="footer-links">
              <p>Company</p>
              <a href="#/about">About</a>
              <a href="#/how-it-works">How It Works</a>
              <a href="#/events">Events</a>
              <a href="#/contact">Contact</a>
            </div>
            <div className="footer-links">
              <p>Resources</p>
              <a href="#/safety-guidelines">Safety Guidelines</a>
              <a href="#/faq">FAQ</a>
              <a href="#/privacy">Privacy</a>
              <a href="#/terms">Terms</a>
            </div>
          </footer>
        )}
      </main>
    </div>
  )
}

export default App
