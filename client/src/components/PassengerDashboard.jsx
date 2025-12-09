import { useState, useEffect } from 'react'
import { Search, MapPin, Calendar, Clock, Users, Star, RefreshCw, Car } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import apiService from '../services/api'
import PaymentModal from './PaymentModal'
import PaymentHistory from './PaymentHistory'
import Loader from './Loader'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import EmergencySOSButton from './EmergencySOSButton'
import EmergencyContacts from './EmergencyContacts'

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom markers
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color:${color};width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  })
}

const greenIcon = createCustomIcon('#22c55e')
const redIcon = createCustomIcon('#ef4444')

// Utility function to format date and time
const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return { date: 'No date', time: 'No time' }
  
  try {
    const date = new Date(dateTimeString)
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateTimeString)
      return { date: 'Invalid date', time: 'Invalid time' }
    }
    
    const formattedDate = date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
    
    const formattedTime = date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    })
    
    return { date: formattedDate, time: formattedTime }
  } catch (error) {
    console.error('Error formatting date:', error, 'for value:', dateTimeString)
    return { date: 'Format error', time: 'Format error' }
  }
}

const PassengerDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('search')
  const [isDashboardLoading, setIsDashboardLoading] = useState(true)
  const [searchFilters, setSearchFilters] = useState({
    from: '',
    to: '',
    date: '',
    maxPrice: ''
  })
  const [availableRides, setAvailableRides] = useState([]) // Always initialize as empty array
  const [bookings, setBookings] = useState([]) // Active bookings
  const [rideHistory, setRideHistory] = useState([]) // Ride history
  const [loading, setLoading] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [error, setError] = useState('')
  const [selectedSeats, setSelectedSeats] = useState({}) // Track selected seats for each ride
  
  // Tab-specific loading states
  const [searchLoading, setSearchLoading] = useState(false)
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  
  // Emergency SOS State
  const [currentRide, setCurrentRide] = useState(null) // Track active ride for emergency
  
  // Map and Location state
  const [showFromSuggestions, setShowFromSuggestions] = useState(false)
  const [showToSuggestions, setShowToSuggestions] = useState(false)
  const [showAllRides, setShowAllRides] = useState(false)
  const [fromCoords, setFromCoords] = useState(null)
  const [toCoords, setToCoords] = useState(null)
  const [mapCenter, setMapCenter] = useState([22.5726, 88.3639]) // Kolkata coordinates
  const [mapZoom, setMapZoom] = useState(12)
  const [geocodingLoading, setGeocodingLoading] = useState({
    from: false,
    to: false
  })
  
  const [locationSuggestions] = useState([
    // Kolkata and West Bengal
    'Kolkata Airport', 'Howrah Station', 'Sealdah Station', 'Salt Lake City Center',
    'Park Street', 'New Market', 'Esplanade', 'Gariahat', 'Tollygunge',
    'Behala', 'Jadavpur', 'Rajarhat', 'Garia', 'Barasat', 'Dum Dum',
    'Ballygunge', 'Hazra', 'Rashbehari', 'Shyambazar', 'Ultadanga',
    'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Kharagpur',
    
    // Major Indian Cities
    'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune',
    'Ahmedabad', 'Surat', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur',
    'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad',
    'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik',
    'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivali', 'Vasai-Virar',
    'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar',
    'Navi Mumbai', 'Allahabad', 'Ranchi', 'Coimbatore', 'Jabalpur',
    
    // Popular landmarks and areas
    'Connaught Place', 'India Gate', 'Red Fort', 'Gateway of India',
    'Marine Drive', 'Juhu Beach', 'Bandra', 'Andheri', 'Powai',
    'Electronic City', 'Whitefield', 'Koramangala', 'Indiranagar',
    'MG Road', 'Brigade Road', 'Commercial Street', 'UB City Mall'
  ])
  
  // Payment Modal State
  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    booking: null
  })

  // Profile State
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    address: ''
  })
  const [isEditingProfile, setIsEditingProfile] = useState(false)

  // Enhanced geocoding function with multiple services and fallbacks
  const geocodeLocation = async (locationName) => {
    if (!locationName) return null
    
    try {
      console.log('🔍 Geocoding location:', locationName)
      
      // First try: Nominatim with multiple search strategies
      const searchQueries = [
        `${locationName}, India`,
        `${locationName}, West Bengal, India`,
        `${locationName}`,
        `${locationName}, Kolkata, West Bengal, India`
      ]
      
      for (const query of searchQueries) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=3&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'RideSharing-App/1.0'
              }
            }
          )
          
          if (!response.ok) {
            console.warn(`⚠️ Nominatim API error: ${response.status}`)
            continue
          }
          
          const data = await response.json()
          console.log(`🌍 Nominatim result for "${query}":`, data)
          
          if (data && data.length > 0) {
            // Prefer results in India or West Bengal
            const preferredResult = data.find(result => 
              result.display_name.toLowerCase().includes('india') ||
              result.display_name.toLowerCase().includes('west bengal') ||
              result.display_name.toLowerCase().includes('kolkata')
            ) || data[0]
            
            const coords = {
              lat: parseFloat(preferredResult.lat),
              lng: parseFloat(preferredResult.lon)
            }
            console.log('✅ Nominatim coordinates found:', coords)
            return coords
          }
        } catch (fetchError) {
          console.warn(`⚠️ Nominatim fetch error for "${query}":`, fetchError)
          continue
        }
      }
      
      // Fallback: Use predefined coordinates for known locations
      const knownLocations = {
        'howrah': { lat: 22.5958, lng: 88.2636 },
        'bangalore': { lat: 12.9716, lng: 77.5946 },
        'mumbai': { lat: 19.0760, lng: 72.8777 },
        'delhi': { lat: 28.7041, lng: 77.1025 },
        'kolkata': { lat: 22.5726, lng: 88.3639 },
        'chennai': { lat: 13.0827, lng: 80.2707 },
        'hyderabad': { lat: 17.3850, lng: 78.4867 },
        'pune': { lat: 18.5204, lng: 73.8567 },
        'salt lake': { lat: 22.5675, lng: 88.4044 },
        'park street': { lat: 22.5448, lng: 88.3426 },
        'sealdah': { lat: 22.5665, lng: 88.3712 },
        'howrah station': { lat: 22.5851, lng: 88.2627 },
        'jadavpur': { lat: 22.4989, lng: 88.3671 },
        'esplanade': { lat: 22.5695, lng: 88.3499 }
      }
      
      const normalizedLocation = locationName.toLowerCase().trim()
      for (const [key, coords] of Object.entries(knownLocations)) {
        if (normalizedLocation.includes(key) || key.includes(normalizedLocation)) {
          console.log(`✅ Using fallback coordinates for "${locationName}":`, coords)
          return coords
        }
      }
      
      console.log('❌ No coordinates found for:', locationName)
      return null
      
    } catch (error) {
      console.error('❌ Geocoding error:', error)
      return null
    }
  }

  // Reverse geocoding function
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      )
      const data = await response.json()
      if (data && data.display_name) {
        // Extract relevant part of the address
        const address = data.display_name.split(',')
        return address.length > 2 ? `${address[0]}, ${address[1]}` : address[0]
      }
      return `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      return `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
    }
  }

  // Map click handler component
  const MapClickHandler = () => {
    useMapEvents({
      click: async (e) => {
        const { lat, lng } = e.latlng
        const locationName = await reverseGeocode(lat, lng)
        
        // Set as pickup if empty, otherwise as dropoff
        if (!searchFilters.from) {
          setSearchFilters(prev => ({ ...prev, from: locationName }))
          setFromCoords({ lat, lng })
        } else if (!searchFilters.to) {
          setSearchFilters(prev => ({ ...prev, to: locationName }))
          setToCoords({ lat, lng })
        } else {
          // If both are filled, replace the pickup
          setSearchFilters(prev => ({ ...prev, from: locationName }))
          setFromCoords({ lat, lng })
        }
      }
    })
    return null
  }

  // Initial dashboard loading
  useEffect(() => {
    const initializeDashboard = async () => {
      // Simulate initial loading time
      await new Promise(resolve => setTimeout(resolve, 2000))
      setIsDashboardLoading(false)
    }
    
    initializeDashboard()
  }, [])

  // Update coordinates when locations change
  useEffect(() => {
    if (searchFilters.from) {
      console.log('🔍 Geocoding FROM location:', searchFilters.from)
      setGeocodingLoading(prev => ({ ...prev, from: true }))
      
      geocodeLocation(searchFilters.from).then(coords => {
        if (coords) {
          console.log('✅ FROM coordinates set:', coords)
          setFromCoords(coords)
          setMapCenter([coords.lat, coords.lng])
          setMapZoom(13)
        } else {
          console.log('❌ FROM coordinates not found')
          setFromCoords(null)
        }
        setGeocodingLoading(prev => ({ ...prev, from: false }))
      })
    } else {
      setFromCoords(null)
      setGeocodingLoading(prev => ({ ...prev, from: false }))
    }
  }, [searchFilters.from])

  useEffect(() => {
    if (searchFilters.to) {
      console.log('🔍 Geocoding TO location:', searchFilters.to)
      setGeocodingLoading(prev => ({ ...prev, to: true }))
      
      geocodeLocation(searchFilters.to).then(coords => {
        if (coords) {
          console.log('✅ TO coordinates set:', coords)
          setToCoords(coords)
          // If we have both coordinates, center the map between them
          if (fromCoords) {
            const centerLat = (fromCoords.lat + coords.lat) / 2
            const centerLng = (fromCoords.lng + coords.lng) / 2
            setMapCenter([centerLat, centerLng])
            setMapZoom(12)
          }
        } else {
          console.log('❌ TO coordinates not found')
          setToCoords(null)
        }
        setGeocodingLoading(prev => ({ ...prev, to: false }))
      })
    } else {
      console.log('🔄 Clearing TO coordinates')
      setToCoords(null)
      setGeocodingLoading(prev => ({ ...prev, to: false }))
    }
  }, [searchFilters.to, fromCoords])

  useEffect(() => {
    // Welcome toast for successful login (only after initial dashboard loading)
    if (!isDashboardLoading) {
      toast.success(`🎉 Welcome back, ${user?.firstName || 'User'}! Ready for your next ride?`, {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
    }
    
    // Add debugging to see what happens on load
    console.log('PassengerDashboard mounted, availableRides:', availableRides)
    
    // Load initial rides data for search tab
    if (!isDashboardLoading) {
      loadAllRides()
    }
  }, [isDashboardLoading])

  // Handle tab switching - no more full page loading
  const handleTabSwitch = async (newTab) => {
    if (newTab === activeTab) return // Don't switch if already on the same tab
    
    setActiveTab(newTab)
    
    // Show tab switch notification
    toast.info(`Switched to ${newTab.charAt(0).toUpperCase() + newTab.slice(1)} tab`, {
      position: "bottom-right",
      autoClose: 2000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
    })

    // Load data for the new tab with loading states
    try {
      switch (newTab) {
        case 'search':
          console.log('Loading search tab...')
          setSearchLoading(true)
          await new Promise(resolve => setTimeout(resolve, 2000))
          // Load all available rides for search tab
          await loadAllRides()
          setSearchLoading(false)
          console.log('Search loading completed')
          break
        case 'bookings':
          console.log('Loading bookings tab...')
          setBookingsLoading(true)
          // Force a render cycle before fetching data
          await new Promise(resolve => {
            requestAnimationFrame(() => {
              setTimeout(resolve, 300)
            })
          })
          const bookingsStartTime = Date.now()
          await fetchBookings(false)
          const bookingsElapsed = Date.now() - bookingsStartTime
          const bookingsRemainingTime = Math.max(0, 2000 - bookingsElapsed)
          await new Promise(resolve => setTimeout(resolve, bookingsRemainingTime))
          setBookingsLoading(false)
          console.log('Bookings loading completed')
          break
        case 'history':
          console.log('Loading history tab...')
          setHistoryLoading(true)
          // Force a render cycle before fetching data
          await new Promise(resolve => {
            requestAnimationFrame(() => {
              setTimeout(resolve, 300)
            })
          })
          const historyStartTime = Date.now()
          await fetchBookings(false) // This populates both bookings and history
          const historyElapsed = Date.now() - historyStartTime
          const historyRemainingTime = Math.max(0, 2000 - historyElapsed)
          await new Promise(resolve => setTimeout(resolve, historyRemainingTime))
          setHistoryLoading(false)
          console.log('History loading completed')
          break
        case 'emergency':
          console.log('Loading emergency tab...')
          // Emergency tab loads instantly - no API calls needed
          await new Promise(resolve => setTimeout(resolve, 500))
          console.log('Emergency tab loaded')
          break
        case 'payments':
          console.log('Loading payments tab...')
          setPaymentsLoading(true)
          await new Promise(resolve => setTimeout(resolve, 2000))
          setPaymentsLoading(false)
          console.log('Payments loading completed')
          break
        case 'profile':
          console.log('Loading profile tab...')
          setProfileLoading(true)
          // Force a render cycle before fetching data
          await new Promise(resolve => {
            requestAnimationFrame(() => {
              setTimeout(resolve, 300)
            })
          })
          const profileStartTime = Date.now()
          await fetchUserProfile(false)
          const profileElapsed = Date.now() - profileStartTime
          const profileRemainingTime = Math.max(0, 2000 - profileElapsed)
          await new Promise(resolve => setTimeout(resolve, profileRemainingTime))
          setProfileLoading(false)
          console.log('Profile loading completed')
          break
      }
    } catch (error) {
      console.error('Error loading tab data:', error)
      // Reset all loading states on error
      setSearchLoading(false)
      setBookingsLoading(false)
      setHistoryLoading(false)
      setPaymentsLoading(false)
      setProfileLoading(false)
      setError('Failed to load data. Please try again.')
    }
  }

  const fetchBookings = async (handleOwnLoading = true) => {
    try {
      if (handleOwnLoading) {
        setLoading(true)
      }
      setError('')
      
      const response = await apiService.getMyBookings()
      console.log('Bookings response:', response)
      
      if (response && response.status === 'SUCCESS' && response.data) {
        const allBookings = Array.isArray(response.data) ? response.data : []
        
        // Separate active bookings from ride history
        const activeBookings = allBookings.filter(booking => 
          booking.status === 'PENDING' || booking.status === 'CONFIRMED' || booking.status === 'PAID'
        )
        
        const completedBookings = allBookings.filter(booking => 
          booking.status === 'COMPLETED' || booking.status === 'CANCELLED'
        )
        
        setBookings(activeBookings)
        setRideHistory(completedBookings)
      } else {
        console.log('No bookings found or invalid response format')
        setBookings([])
        setRideHistory([])
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      setError('Failed to load bookings. Please try again.')
      setBookings([])
      setRideHistory([])
    } finally {
      if (handleOwnLoading) {
        setLoading(false)
      }
    }
  }

  const loadAllRides = async () => {
    try {
      console.log('🚀 Loading all rides...')
      // Use search with empty filters to get all available rides
      const response = await apiService.searchRides({})
      console.log('🚀 Load all rides response:', response)
      
      if (response && response.status === 'SUCCESS' && response.data) {
        // Handle Spring Boot Page response
        let ridesData = []
        if (response.data.content && Array.isArray(response.data.content)) {
          ridesData = response.data.content
          console.log('📄 Found rides in Page.content:', ridesData.length)
        } else if (Array.isArray(response.data)) {
          ridesData = response.data
          console.log('📄 Found rides in direct array:', ridesData.length)
        } else {
          console.log('📄 No rides data or unexpected structure:', response.data)
        }
        setAvailableRides(showAllRides ? ridesData : ridesData.slice(0, 3)) // Show only 3 most recent rides by default, or all if requested
        setSearchPerformed(true) // Set this to true so rides show on initial load
        console.log('✅ Set availableRides to:', ridesData.slice(0, 5))
        
        // Debug: Log the structure of the first ride to see date fields
        if (ridesData.length > 0) {
          console.log('🔍 First ride structure:', ridesData[0])
          console.log('🔍 Date fields in first ride:', {
            departureDate: ridesData[0].departureDate,
            departureTime: ridesData[0].departureTime,
            createdAt: ridesData[0].createdAt,
            updatedAt: ridesData[0].updatedAt
          })
        }
      } else {
        console.log('❌ Load rides failed or no data')
        setAvailableRides([])
      }
    } catch (error) {
      console.error('❌ Error loading rides:', error)
      setAvailableRides([])
    }
  }

  const fetchAvailableRides = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Use search with empty filters to get all available rides
      const response = await apiService.searchRides({})
      console.log('All rides response:', response)
      
      if (response && response.status === 'SUCCESS' && response.data) {
        // Handle Spring Boot Page response
        let ridesData = []
        if (response.data.content && Array.isArray(response.data.content)) {
          ridesData = response.data.content
        } else if (Array.isArray(response.data)) {
          ridesData = response.data
        }
        setAvailableRides(ridesData)
        setSearchPerformed(true) // Ensure this is always set
        
        if (ridesData.length === 0) {
          setError('No rides available at the moment.')
        }
      } else {
        setAvailableRides([])
        setError('No rides available at the moment.')
      }
    } catch (error) {
      console.error('Error fetching rides:', error)
      setError('Failed to load rides. Please try again.')
      setAvailableRides([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    
    if (!searchFilters.from || !searchFilters.to) {
      toast.warning('📍 Please enter both pickup and drop-off locations.', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
      return
    }

    try {
      setLoading(true)
      setError('')
      
      // Use the searchRides API method with proper parameters
      const searchParams = {
        source: searchFilters.from,
        destination: searchFilters.to,
        departureDate: searchFilters.date ? `${searchFilters.date}T00:00:00` : null,
        maxPrice: searchFilters.maxPrice ? parseFloat(searchFilters.maxPrice) : null
      }
      
      console.log('🔍 Search parameters being sent:', searchParams)
      const response = await apiService.searchRides(searchParams)
      console.log('🔍 Complete API response:', response)
      console.log('🔍 Response data type:', typeof response.data)
      console.log('🔍 Response data content:', response.data)
      
      if (response && response.status === 'SUCCESS' && response.data) {
        // Handle Spring Boot Page response
        let ridesData = []
        if (response.data.content && Array.isArray(response.data.content)) {
          ridesData = response.data.content
          console.log('📄 Using Page.content:', ridesData)
        } else if (Array.isArray(response.data)) {
          ridesData = response.data
          console.log('📄 Using direct array:', ridesData)
        } else {
          console.log('📄 Unexpected data structure:', response.data)
        }
        
        console.log('🎯 Final ridesData:', ridesData)
        setAvailableRides(ridesData)
        setSearchPerformed(true)
        
        if (ridesData.length === 0) {
          setError('No rides found matching your criteria. Try adjusting your search.')
        }
      } else {
        console.log('❌ API response failed or no data')
        setAvailableRides([])
        setError('No rides available for your search criteria.')
      }
    } catch (error) {
      console.error('❌ Error searching rides:', error)
      setError('Failed to search rides. Please try again.')
      setAvailableRides([])
    } finally {
      setLoading(false)
    }
  }

  const handleBooking = async (ride, seats) => {
    try {
      console.log('Creating booking for ride:', ride.id, 'seats:', seats)
      const response = await apiService.createBooking(ride.id, seats)
      console.log('Booking response:', response)
      
      if (response && response.status === 'SUCCESS' && response.data) {
        // Show success message and refresh bookings
        toast.success('🎉 Booking created successfully! Please check your booking history. Payment will be available after driver confirmation.', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        })
        
        // Refresh the bookings list to show the new booking
        await fetchBookings()
        
        // Switch to bookings tab to show the new booking
        handleTabSwitch('bookings')
        
        // Clear any previous errors
        setError('')
      } else {
        toast.error('❌ Failed to create booking. Please try again.', {
          position: "top-right",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        })
      }
    } catch (error) {
      console.error('Error creating booking:', error)
      toast.error('❌ Failed to book ride. Please try again.', {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
    }
  }

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return
    }

    try {
      setLoading(true)
      const response = await apiService.cancelBooking(bookingId)
      
      if (response && response.status === 'SUCCESS') {
        await fetchBookings() // Refresh bookings
        toast.success('✅ Booking cancelled successfully!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        })
      } else {
        toast.error('❌ Failed to cancel booking. Please try again.', {
          position: "top-right",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        })
      }
    } catch (error) {
      console.error('Error cancelling booking:', error)
      toast.error('❌ Failed to cancel booking. Please try again.', {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const closePaymentModal = () => {
    setPaymentModal({
      isOpen: false,
      booking: null
    })
  }

  const handlePaymentSuccess = (paymentResult) => {
    console.log('Payment successful:', paymentResult)
    closePaymentModal()
    fetchBookings() // Refresh bookings after successful payment
    toast.success('💳 Payment successful! Your ride is confirmed.', {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    })
  }

  // Profile functions
  const fetchUserProfile = async (handleOwnLoading = true) => {
    try {
      if (handleOwnLoading) {
        setProfileLoading(true)
      }
      setError('')
      
      const response = await apiService.getUserProfile()
      console.log('Profile response:', response)
      
      if (response && response.data) {
        setProfileData({
          firstName: response.data.firstName || '',
          lastName: response.data.lastName || '',
          email: response.data.email || '',
          phoneNumber: response.data.phoneNumber || '',
          dateOfBirth: response.data.dateOfBirth || '',
          address: response.data.address || ''
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError('Failed to load profile. Please try again.')
    } finally {
      if (handleOwnLoading) {
        setProfileLoading(false)
      }
    }
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    
    try {
      setProfileLoading(true)
      setError('')
      
      const response = await apiService.updateUserProfile(profileData)
      console.log('Profile update response:', response)
      
      if (response && response.status === 'SUCCESS') {
        toast.success('✅ Profile updated successfully!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        })
        setIsEditingProfile(false)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setError('Failed to update profile. Please try again.')
    } finally {
      setProfileLoading(false)
    }
  }

  const handleProfileInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Location suggestion handlers
  const getFilteredSuggestions = (input) => {
    if (!input) return []
    return locationSuggestions.filter(location => 
      location.toLowerCase().includes(input.toLowerCase())
    ).slice(0, 5)
  }

  const handleLocationSelect = (location, field) => {
    setSearchFilters(prev => ({ ...prev, [field]: location }))
    setShowFromSuggestions(false)
    setShowToSuggestions(false)
  }

  const handleFromInputChange = (e) => {
    const value = e.target.value
    setSearchFilters(prev => ({ ...prev, from: value }))
    setShowFromSuggestions(value.length > 0)
    // Clear coordinates when typing manually
    if (!value) setFromCoords(null)
  }

  const handleToInputChange = (e) => {
    const value = e.target.value
    setSearchFilters(prev => ({ ...prev, to: value }))
    setShowToSuggestions(value.length > 0)
    // Clear coordinates when typing manually
    if (!value) setToCoords(null)
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Initial Dashboard Loading */}
      {isDashboardLoading && (
        <div className="fixed inset-0 bg-white bg-opacity-98 flex flex-col items-center justify-center z-50">
          <Loader 
            size={250}
            showText={true}
            text="Setting up your dashboard..."
            className="mb-8"
          />
          <div className="text-center max-w-lg mx-auto px-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to Your Passenger Hub! 🚗
            </h3>
            <p className="text-lg text-gray-600 mb-2">
              Preparing your personalized ride experience...
            </p>
            <div className="flex justify-center items-center space-x-2 mt-6">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div className="flex-shrink-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Welcome back, {user?.firstName}!</h1>
            <p className="text-sm sm:text-base text-gray-600">Find your perfect ride</p>
          </div>
          
          {/* Tab Navigation - Responsive */}
          <div className="flex flex-wrap gap-2 bg-yellow-500 rounded-lg p-1 overflow-x-auto">
            <button
              onClick={() => handleTabSwitch('search')}
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'search' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Search
            </button>
            <button
              onClick={() => handleTabSwitch('bookings')}
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'bookings' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="hidden sm:inline">My Bookings</span>
              <span className="sm:hidden">Bookings</span> ({bookings.length})
            </button>
            <button
              onClick={() => handleTabSwitch('history')}
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'history' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="hidden sm:inline">Ride History</span>
              <span className="sm:hidden">History</span> ({rideHistory.length})
            </button>
            <button
              onClick={() => handleTabSwitch('emergency')}
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'emergency' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🚨 Emergency
            </button>
            <button
              onClick={() => handleTabSwitch('payments')}
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'payments' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="hidden sm:inline">Payments</span>
              <span className="sm:hidden">Pay</span>
            </button>
            <button
              onClick={() => handleTabSwitch('profile')}
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'profile' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Profile
            </button>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {/* Main Content - Responsive Layout for Search Tab */}
      {activeTab === 'search' && (
        <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
          {/* Search Loading Overlay */}
          {searchLoading && (
            <div className="absolute inset-0 bg-white flex flex-col items-center justify-center z-50 rounded-lg">
              <Loader 
                size={250}
                showText={true}
                text="Loading ride search..."
                className="mb-4"
              />
              <div className="text-center px-4">
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Preparing Search Interface
                </h4>
                <p className="text-sm text-gray-600">
                  Setting up your personalized ride search experience...
                </p>
              </div>
            </div>
          )}

          {/* MOBILE LAYOUT: Map First (1/3), then Filters & Rides (2/3) - Hidden on Desktop */}
          <div className="lg:hidden flex flex-col h-full w-full">
            {/* Map Section - Mobile */}
            <div className="h-1/3 bg-gray-200 relative z-0">
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                {fromCoords && (
                  <Marker position={[fromCoords.lat, fromCoords.lng]} icon={greenIcon}>
                    <Popup><strong>Pickup</strong><br />{searchFilters.from}</Popup>
                  </Marker>
                )}
                {toCoords && (
                  <Marker position={[toCoords.lat, toCoords.lng]} icon={redIcon}>
                    <Popup><strong>Dropoff</strong><br />{searchFilters.to}</Popup>
                  </Marker>
                )}
                {fromCoords && toCoords && (
                  <Polyline
                    positions={[[fromCoords.lat, fromCoords.lng], [toCoords.lat, toCoords.lng]]}
                    color="#EAB308" weight={3} opacity={0.8} dashArray="10,10"
                  />
                )}
              </MapContainer>
              <button 
                onClick={() => { setMapCenter([22.5726, 88.3639]); setMapZoom(12) }}
                className="absolute top-2 right-2 bg-white p-2 rounded-lg shadow-md hover:shadow-lg z-10"
              >
                <RefreshCw className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            {/* Search Filters & Rides - Mobile Scrollable */}
            <div className="flex-1 overflow-y-auto bg-white">
              <div className="p-3 space-y-3">
                {/* Search Form - Compact */}
                <div className="bg-yellow-50 rounded-lg p-3 space-y-2">
                  <h3 className="text-sm font-semibold text-gray-800">Search Rides</h3>
                  <div className="relative">
                    <div className="absolute left-3 top-2">
                      <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                    </div>
                    <input type="text" placeholder="From" value={searchFilters.from} onChange={handleFromInputChange} onFocus={() => setShowFromSuggestions(searchFilters.from.length > 0)} onBlur={() => setTimeout(() => setShowFromSuggestions(false), 200)} className="w-full pl-8 pr-8 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500" />
                    {showFromSuggestions && (
                      <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-24 overflow-y-auto">
                        {getFilteredSuggestions(searchFilters.from).map((location, index) => (
                          <button key={index} onClick={() => handleLocationSelect(location, 'from')} className="w-full text-left px-3 py-1 hover:bg-gray-100 text-xs flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" /><span className="truncate">{location}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-2">
                      <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                    </div>
                    <input type="text" placeholder="To" value={searchFilters.to} onChange={handleToInputChange} onFocus={() => setShowToSuggestions(searchFilters.to.length > 0)} onBlur={() => setTimeout(() => setShowToSuggestions(false), 200)} className="w-full pl-8 pr-8 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500" />
                    {showToSuggestions && (
                      <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-24 overflow-y-auto">
                        {getFilteredSuggestions(searchFilters.to).map((location, index) => (
                          <button key={index} onClick={() => handleLocationSelect(location, 'to')} className="w-full text-left px-3 py-1 hover:bg-gray-100 text-xs flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" /><span className="truncate">{location}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={searchFilters.date} onChange={(e) => setSearchFilters(prev => ({ ...prev, date: e.target.value }))} className="px-2 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500" />
                    <input type="number" placeholder="Max ₹" value={searchFilters.maxPrice} onChange={(e) => setSearchFilters(prev => ({ ...prev, maxPrice: e.target.value }))} className="px-2 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500" />
                  </div>
                  <button onClick={handleSearch} disabled={loading || !searchFilters.from || !searchFilters.to} className="w-full bg-yellow-500 text-white py-2 rounded-lg font-medium text-xs hover:bg-yellow-600 disabled:bg-gray-300">
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </div>

                {/* Available Rides - Mobile */}
                {searchPerformed && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-semibold">Available Rides ({Array.isArray(availableRides) ? availableRides.length : 0})</h3>
                      <button onClick={fetchAvailableRides} disabled={loading} className="text-gray-600 hover:text-gray-900 disabled:text-gray-300">
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </div>
                    {error && <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-red-700 text-xs">{error}</div>}
                    {!loading && Array.isArray(availableRides) && availableRides.length === 0 && searchPerformed && (
                      <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                        <Car className="h-8 w-8 mx-auto mb-1 text-gray-300" />
                        <p className="text-xs">No rides found</p>
                      </div>
                    )}
                    {!loading && Array.isArray(availableRides) && availableRides.map((ride) => (
                      <div key={ride.id} className="bg-white border border-gray-200 rounded-lg p-2 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 mb-1 text-xs">
                              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                              <span className="font-medium truncate">{ride.source || 'N/A'}</span>
                              <span className="text-gray-400 flex-shrink-0">→</span>
                              <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                              <span className="font-medium truncate">{ride.destination || 'N/A'}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                              <span className="flex items-center gap-0.5"><Calendar className="h-3 w-3" />{ride.departureDate ? new Date(ride.departureDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'N/A'}</span>
                              <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{ride.departureDate ? new Date(ride.departureDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A'}</span>
                              <span className="flex items-center gap-0.5"><Users className="h-3 w-3" />{ride.availableSeats || 0}</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm font-bold">₹{ride.pricePerSeat || 0}</div>
                            <button onClick={() => { setSelectedSeats({ [ride.id]: 1 }); handleBooking(ride, 1) }} disabled={loading} className="text-xs bg-yellow-500 text-white px-2 py-1 rounded mt-1 hover:bg-yellow-600 disabled:bg-gray-300">Book</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* DESKTOP LAYOUT - Left Panel - Search Form (Hidden on Mobile) */}
          <div className="hidden lg:block w-2/5 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Get ready for your first trip</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">Discover the convenience of SmartRide. Request a ride now, or schedule one for later directly from your browser.</p>
              
              {/* Search Form */}
              <div className="space-y-4">
                {/* From Location */}
                <div className="relative">
                  <div className="absolute left-3 top-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <input
                    type="text"
                    placeholder="Pickup location"
                    value={searchFilters.from}
                    onChange={handleFromInputChange}
                    onFocus={() => setShowFromSuggestions(searchFilters.from.length > 0)}
                    onBlur={() => setTimeout(() => setShowFromSuggestions(false), 200)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                  {geocodingLoading.from && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-yellow-500 rounded-full"></div>
                    </div>
                  )}
                  {!geocodingLoading.from && fromCoords && (
                    <div className="absolute right-3 top-3">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                  )}
                  {/* From Suggestions Dropdown */}
                  {showFromSuggestions && (
                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-48 overflow-y-auto">
                      {getFilteredSuggestions(searchFilters.from).map((location, index) => (
                        <button
                          key={index}
                          onClick={() => handleLocationSelect(location, 'from')}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <MapPin className="h-4 w-4 text-gray-400" />
                          {location}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* To Location */}
                <div className="relative">
                  <div className="absolute left-3 top-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  </div>
                  <input
                    type="text"
                    placeholder="Dropoff location"
                    value={searchFilters.to}
                    onChange={handleToInputChange}
                    onFocus={() => setShowToSuggestions(searchFilters.to.length > 0)}
                    onBlur={() => setTimeout(() => setShowToSuggestions(false), 200)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                  {geocodingLoading.to && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-yellow-500 rounded-full"></div>
                    </div>
                  )}
                  {!geocodingLoading.to && toCoords && (
                    <div className="absolute right-3 top-3">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                  )}
                  {/* To Suggestions Dropdown */}
                  {showToSuggestions && (
                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-48 overflow-y-auto">
                      {getFilteredSuggestions(searchFilters.to).map((location, index) => (
                        <button
                          key={index}
                          onClick={() => handleLocationSelect(location, 'to')}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <MapPin className="h-4 w-4 text-gray-400" />
                          {location}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Date and Price */}
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="date"
                    value={searchFilters.date}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, date: e.target.value }))}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Max Price (₹)"
                    value={searchFilters.maxPrice}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
                
                {/* Search Button */}
                <button
                  onClick={handleSearch}
                  disabled={loading || !searchFilters.from || !searchFilters.to}
                  className="w-full bg-yellow-500 text-white py-3 rounded-lg font-medium hover:bg-yellow-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? 'Searching...' : 'See prices'}
                </button>
              </div>

              {/* Available Rides */}
              {searchPerformed && (
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Available Rides</h3>
                    <button 
                      onClick={fetchAvailableRides}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <RefreshCw className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {loading && (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Finding rides...</p>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                      {error}
                    </div>
                  )}

                  {!loading && Array.isArray(availableRides) && availableRides.length === 0 && searchPerformed && (
                    <div className="text-center py-8 text-gray-500">
                      <Car className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No rides found for your search criteria.</p>
                      <p className="text-sm">Try adjusting your filters or search again.</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    {Array.isArray(availableRides) && availableRides.length > 0 ? availableRides.map((ride) => (
                      <div key={ride.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1 pr-4">
                            <div className="flex items-center gap-2 mb-3">
                              <MapPin className="h-4 w-4 text-green-500 flex-shrink-0" />
                              <span className="text-sm font-medium">{ride.source || 'Unknown'}</span>
                              <span className="text-gray-400">→</span>
                              <MapPin className="h-4 w-4 text-red-500 flex-shrink-0" />
                              <span className="text-sm font-medium">{ride.destination || 'Unknown'}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4 flex-shrink-0" />
                                <span>
                                  {(ride.departureDate || ride.departureTime) ? 
                                    new Date(ride.departureDate || ride.departureTime).toLocaleDateString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric'
                                    }) : 'No date'
                                  }
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 flex-shrink-0" />
                                <span>
                                  {(ride.departureDate || ride.departureTime) ? 
                                    new Date(ride.departureDate || ride.departureTime).toLocaleTimeString('en-IN', { 
                                      hour: '2-digit', 
                                      minute: '2-digit',
                                      hour12: true
                                    }) : 'No time'
                                  }
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4 flex-shrink-0" />
                                <span>{ride.availableSeats || 0} seats</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-lg font-bold text-gray-900">₹{ride.pricePerSeat || 0}</div>
                            <div className="text-sm text-gray-500">per person</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-medium">
                                {ride.driverName?.[0] || ride.driver?.firstName?.[0] || 'D'}
                              </span>
                            </div>
                            <span className="text-sm font-medium">
                              {ride.driverName || ride.driver?.firstName || 'Driver'} {ride.driver?.lastName || ''}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <select
                              value={selectedSeats[ride.id] || 1}
                              onChange={(e) => setSelectedSeats(prev => ({ ...prev, [ride.id]: parseInt(e.target.value) }))}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              {[...Array(Math.min(ride.availableSeats || 1, 4))].map((_, i) => (
                                <option key={i + 1} value={i + 1}>{i + 1} seat{i > 0 ? 's' : ''}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleBooking(ride, selectedSeats[ride.id] || 1)}
                              className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-600 transition-colors"
                            >
                              Book Now
                            </button>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-8 text-gray-500">
                        <Car className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No rides available.</p>
                      </div>
                    )}
                  </div>
                  
                  {/* View All Rides Button */}
                  {Array.isArray(availableRides) && availableRides.length > 0 && !showAllRides && (
                    <div className="text-center mt-4">
                      <button
                        onClick={() => {
                          setShowAllRides(true)
                          loadAllRides()
                        }}
                        className="bg-yellow-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-yellow-600 transition-colors"
                      >
                        View All Rides
                      </button>
                    </div>
                  )}
                  
                  {/* Show Fewer Button */}
                  {showAllRides && Array.isArray(availableRides) && availableRides.length > 3 && (
                    <div className="text-center mt-4">
                      <button
                        onClick={() => {
                          setShowAllRides(false)
                          loadAllRides()
                        }}
                        className="bg-gray-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                      >
                        Show Less
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Real World Map - Hidden on mobile, visible on lg+ */}
          <div className="hidden lg:flex lg:flex-1 bg-gray-100 relative overflow-hidden">
            {/* Map Container */}
            <div className="absolute inset-0 z-0">
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: '100%', width: '100%' }}
                key={`${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Map click handler */}
                <MapClickHandler />
                
                {/* From marker */}
                {fromCoords && (
                  <Marker position={[fromCoords.lat, fromCoords.lng]} icon={greenIcon}>
                    <Popup>
                      <div>
                        <strong>Pickup Location</strong><br />
                        {searchFilters.from}
                      </div>
                    </Popup>
                  </Marker>
                )}
                
                {/* To marker */}
                {toCoords && (
                  <Marker position={[toCoords.lat, toCoords.lng]} icon={redIcon}>
                    <Popup>
                      <div>
                        <strong>Dropoff Location</strong><br />
                        {searchFilters.to}
                      </div>
                    </Popup>
                  </Marker>
                )}
                
                {/* Route line */}
                {fromCoords && toCoords && (
                  <Polyline
                    positions={[
                      [fromCoords.lat, fromCoords.lng],
                      [toCoords.lat, toCoords.lng]
                    ]}
                    color="#EAB308"
                    weight={4}
                    opacity={0.8}
                    dashArray="10,10"
                  />
                )}
              </MapContainer>
            </div>
            
            {/* Route info overlay */}
            {searchFilters.from && searchFilters.to && (
              <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 sm:p-4 max-w-xs sm:max-w-sm z-10">
                <h4 className="text-sm sm:text-base font-medium mb-3 flex items-center gap-2">
                  <Car className="h-4 w-4 text-yellow-500" />
                  Route Overview
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                    <span className="flex-1 truncate">{searchFilters.from}</span>
                  </div>
                  <div className="ml-1.5 w-0.5 h-4 bg-gray-300"></div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></div>
                    <span className="flex-1 truncate">{searchFilters.to}</span>
                  </div>
                </div>
                {fromCoords && toCoords && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Distance</span>
                      <span>
                        {Math.round(
                          Math.sqrt(
                            Math.pow(fromCoords.lat - toCoords.lat, 2) + 
                            Math.pow(fromCoords.lng - toCoords.lng, 2)
                          ) * 111 // Rough conversion to km
                        )} km
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Est. Time</span>
                      <span>30-45 min</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Central message when no locations */}
            {!searchFilters.from && !searchFilters.to && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bg-black bg-opacity-20">
                <div className="text-center text-white bg-black bg-opacity-50 p-6 rounded-lg">
                  <MapPin className="h-16 w-16 mx-auto mb-4 text-white" />
                  <h3 className="text-lg font-medium mb-2">Interactive World Map</h3>
                  <p className="text-sm">Click anywhere on the map to set locations</p>
                  <p className="text-xs mt-2 text-gray-300">or type in the search boxes on the left</p>
                </div>
              </div>
            )}
            
            {/* Map controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
              <button 
                onClick={() => {
                  setMapCenter([22.5726, 88.3639])
                  setMapZoom(12)
                }}
                className="bg-white p-2 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                title="Reset to Kolkata"
              >
                <RefreshCw className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Other Tabs Content (Full Width) - Responsive */}
      {activeTab !== 'search' && (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              {/* Tab Content for non-search tabs */}
              {activeTab === 'bookings' && (
                <div className="bg-yellow-200 rounded-lg p-4 sm:p-6 relative">
                  {/* Smooth Loading Indicator */}
                  {bookingsLoading && (
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-white backdrop-blur-sm flex flex-col items-center justify-center z-50 rounded-lg">
                      <div className="text-center px-4">
                        <div className="inline-block animate-spin rounded-full h-12 sm:h-16 w-12 sm:w-16 border-4 border-yellow-200 border-t-yellow-500 mb-4"></div>
                        <h4 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Loading Bookings...</h4>
                        <p className="text-xs sm:text-sm text-gray-600">Fetching your ride bookings</p>
                      </div>
                    </div>
                  )}
                  
                  <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-gray-800">My Bookings</h3>
                  
                  {bookings.length === 0 ? (
                    <div className="text-center py-8 sm:py-12 text-gray-500 bg-white rounded-lg shadow-sm">
                      <Calendar className="h-12 sm:h-16 w-12 sm:w-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-base sm:text-lg font-medium mb-2">No bookings yet</h3>
                      <p className="text-sm sm:text-base">Start by searching for rides in the Search tab.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Array.isArray(bookings) && bookings.map((booking) => (
                        <div key={booking.id} className="bg-yellow-100 border border-yellow-700 rounded-lg p-4 sm:p-6 hover:shadow-lg transition-shadow shadow-sm">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <MapPin className="h-4 w-4 text-green-500 flex-shrink-0" />
                                <span className="font-medium text-sm sm:text-base">{booking.source || booking.ride?.source || 'N/A'}</span>
                                <span className="text-gray-400">→</span>
                                <MapPin className="h-4 w-4 text-red-500 flex-shrink-0" />
                                <span className="font-medium text-sm sm:text-base">{booking.destination || booking.ride?.destination || 'N/A'}</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>
                                    {(booking.departureDate || booking.ride?.departureDate) ? 
                                      new Date(booking.departureDate || booking.ride?.departureDate).toLocaleDateString('en-IN', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                      }) : 'N/A'
                                    }
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    {(booking.departureDate || booking.ride?.departureDate) ? 
                                      new Date(booking.departureDate || booking.ride?.departureDate).toLocaleTimeString('en-IN', { 
                                        hour: '2-digit', 
                                        minute: '2-digit',
                                        hour12: true
                                      }) : 'N/A'
                                    }
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{booking.departureDate ? new Date(booking.departureDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Users className="h-4 w-4 flex-shrink-0" />
                                  <span>{booking.seatsBooked} seats</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-lg sm:text-xl font-bold text-gray-900">₹{booking.totalAmount || booking.totalPrice || 0}</div>
                              <div className="text-xs sm:text-sm text-gray-500">Total amount</div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                booking.status === 'CONFIRMED' 
                                  ? 'bg-green-100 text-green-800'
                                  : booking.status === 'CANCELLED'
                                  ? 'bg-red-100 text-red-800'
                                  : booking.status === 'PAID'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {booking.status}
                              </span>
                              <span className="text-xs sm:text-sm text-gray-500">
                                Booking ID: {booking.id}
                              </span>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                              {booking.status === 'CONFIRMED' && (
                                <>
                                  <button
                                    onClick={() => setPaymentModal({ isOpen: true, booking: booking })}
                                    className="bg-yellow-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-yellow-700 transition-colors"
                                  >
                                    Pay Now
                                  </button>
                                  <button
                                    onClick={() => handleCancelBooking(booking.id)}
                                    className="text-red-600 hover:text-red-800 text-xs sm:text-sm font-medium px-2"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                              
                              {booking.status === 'PENDING' && (
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                  <span className="text-xs sm:text-sm text-gray-500">Waiting for driver confirmation...</span>
                                  <button
                                    onClick={() => handleCancelBooking(booking.id)}
                                    className="text-red-600 hover:text-red-800 text-xs sm:text-sm font-medium"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                              
                              {booking.status === 'PAID' && (
                                <span className="text-xs sm:text-sm text-green-600 font-medium">✓ Payment Complete</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="bg-yellow-200 rounded-lg p-4 sm:p-6 relative">
                  {/* Smooth Loading Indicator */}
                  {historyLoading && (
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-white backdrop-blur-sm flex flex-col items-center justify-center z-50 rounded-lg">
                      <div className="text-center px-4">
                        <div className="inline-block animate-spin rounded-full h-12 sm:h-16 w-12 sm:w-16 border-4 border-yellow-200 border-t-yellow-500 mb-4"></div>
                        <h4 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Loading History...</h4>
                        <p className="text-xs sm:text-sm text-gray-600">Fetching your ride history</p>
                      </div>
                    </div>
                  )}
                  
                  <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-gray-800">Ride History</h3>
                  
                  {rideHistory.length === 0 ? (
                    <div className="text-center py-8 sm:py-12 text-gray-500 bg-white rounded-lg shadow-sm">
                      <Clock className="h-12 sm:h-16 w-12 sm:w-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-base sm:text-lg font-medium mb-2">No completed rides yet</h3>
                      <p className="text-sm sm:text-base">Your ride history will appear here after you complete trips.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Array.isArray(rideHistory) && rideHistory.map((ride, index) => (
                        <RideHistoryCard 
                          key={index} 
                          ride={ride} 
                          user={user}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'emergency' && (
                <div className="bg-white rounded-lg p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-semibold mb-6 text-gray-800 flex items-center gap-2">
                    🚨 Emergency Safety Center
                  </h3>
                  
                  {/* Emergency Info Banner */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-red-900 mb-2">Your Safety is Our Priority</h4>
                    <p className="text-sm text-red-800 mb-3">
                      In case of emergency during a ride, use the SOS button to instantly alert your emergency contacts 
                      and our admin team with your live location.
                    </p>
                    <div className="text-xs text-red-700 space-y-1">
                      <p>✓ SMS & Email notifications to all contacts</p>
                      <p>✓ Voice calls to primary contacts</p>
                      <p>✓ Live location tracking for 1 hour</p>
                      <p>✓ Admin monitoring and support</p>
                    </div>
                  </div>

                  {/* Emergency Contacts Section */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-4 text-gray-800">Manage Emergency Contacts</h4>
                    <EmergencyContacts />
                  </div>

                  {/* Quick Emergency Actions */}
                  <div className="bg-gray-50 rounded-lg p-4 mt-6">
                    <h4 className="text-sm font-semibold mb-2 text-gray-700">Quick Actions</h4>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p>• Look for the red SOS button (bottom-right corner) during rides</p>
                      <p>• Make sure your emergency contacts are up to date</p>
                      <p>• For life-threatening emergencies, call 100 (Police) or 108 (Ambulance)</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'payments' && (
                <div className="bg-yellow-200 rounded-lg p-4 sm:p-6 relative">
                  {/* Payments Loading Overlay */}
                  {paymentsLoading && (
                    <div className="absolute inset-0 bg-white flex flex-col items-center justify-center z-50 rounded-lg px-4">
                      <Loader 
                        size={200}
                        showText={true}
                        text="Loading payment history..."
                        className="mb-4"
                      />
                      <div className="text-center">
                        <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                          Fetching Payment Information
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Please wait while we load your payment history...
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Payment History</h3>
                  <PaymentHistory user={user} userType="passenger" />
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm relative">
                  {/* Profile Loading Overlay */}
                  {profileLoading && (
                    <div className="absolute inset-0 bg-white flex flex-col items-center justify-center z-50 rounded-lg px-4">
                      <Loader 
                        size={200}
                        showText={true}
                        text="Loading profile data..."
                        className="mb-4"
                      />
                      <div className="text-center">
                        <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                          Fetching Profile Information
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Please wait while we load your account details...
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                      <p className="text-sm sm:text-base text-red-700">{error}</p>
                    </div>
                  )}

                  {/* Profile Display Mode - Read Only */}
                  <div className="max-w-4xl mx-auto">
                    {/* Profile Header */}
                    <div className="text-center mb-6 sm:mb-10">
                      <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full mx-auto mb-4 sm:mb-6 flex items-center justify-center shadow-xl">
                        <span className="text-4xl sm:text-5xl font-bold text-white">
                          {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
                        {user?.firstName || 'User'} {user?.lastName || ''}
                      </h2>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm sm:text-base text-gray-600 mb-2">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="break-all">{user?.email || 'No email provided'}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm sm:text-base text-gray-600">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>{user?.phoneNumber || 'No phone number'}</span>
                      </div>
                    </div>

                    {/* Statistics Grid - Responsive */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                      {/* Member Since */}
                      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 sm:p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                          </div>
                        </div>
                        <h4 className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Member Since</h4>
                        <p className="text-lg sm:text-2xl font-bold text-gray-900">
                          {user?.createdAt 
                            ? new Date(user.createdAt).toLocaleDateString('en-IN', { 
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })
                            : 'Recently'
                          }
                        </p>
                      </div>

                      {/* Total Bookings */}
                      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 sm:p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                            <Car className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                          </div>
                        </div>
                        <h4 className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Bookings</h4>
                        <p className="text-lg sm:text-2xl font-bold text-gray-900">
                          {bookings.length + rideHistory.length}
                        </p>
                      </div>

                      {/* Successful Rides */}
                      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 sm:p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        <h4 className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Successful Rides</h4>
                        <p className="text-lg sm:text-2xl font-bold text-gray-900">
                          {rideHistory.filter(ride => ride.status === 'COMPLETED' || ride.status === 'PAID').length}
                        </p>
                      </div>

                      {/* Total Amount Spent */}
                      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 sm:p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        <h4 className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Amount Spent</h4>
                        <p className="text-lg sm:text-2xl font-bold text-gray-900">
                          ₹{[...bookings, ...rideHistory]
                            .filter(item => item.status === 'PAID' || item.status === 'COMPLETED')
                            .reduce((sum, item) => sum + (item.totalAmount || item.totalPrice || 0), 0)
                            .toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    {/* Additional Info Section - Responsive */}
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 sm:p-6 md:p-8 text-center">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
                        Thank you for being a valued member! 🎉
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600">
                        Your journey with us continues to make every ride better.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={closePaymentModal}
        booking={paymentModal.booking}
        onPaymentSuccess={handlePaymentSuccess}
      />
      
      {/* Emergency SOS Button - Floating on all pages */}
      <EmergencySOSButton user={user} ride={currentRide} />
      
      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{ zIndex: 9999 }}
      />
    </div>
  )
}

// Rating Modal Component
const RatingModal = ({ isOpen, onClose, ride, user, onRatingSubmitted }) => {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate that a rating is selected
    if (rating === 0) {
      toast.warning('⚠️ Please select a rating before submitting.', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
      return
    }
    
    setSubmitting(true)

    try {
      const ratingData = {
        rating: rating,
        comment: comment,
        driverId: ride.driverId,
        bookingId: ride.id
      }

      await apiService.createRating(user.id, ratingData)
      toast.success('⭐ Rating submitted successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
      onRatingSubmitted()
      onClose()
    } catch (error) {
      console.error('Error submitting rating:', error)
      toast.error('❌ Failed to submit rating. Please try again.', {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">Rate Your Ride</h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Driver: {ride.driverName}</p>
          <p className="text-sm text-gray-600 mb-4">{ride.source} → {ride.destination}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Rating</label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="text-2xl focus:outline-none"
                >
                  <Star 
                    className={`w-6 h-6 ${
                      star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Comment (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              className="w-full p-2 border border-gray-300 rounded-md resize-none"
              rows="3"
              maxLength="500"
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Ride History Card Component
const RideHistoryCard = ({ ride, user }) => {
  const [showDetails, setShowDetails] = useState(false)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [existingRating, setExistingRating] = useState(null)

  // Fetch existing rating when component mounts
  useEffect(() => {
    const fetchExistingRating = async () => {
      try {
        if (ride.status === 'COMPLETED') {
          const response = await apiService.getPassengerRatings(user.id)
          if (response.status === 'SUCCESS' && response.data) {
            const rating = response.data.find(r => r.bookingId === ride.id)
            setExistingRating(rating)
          }
        }
      } catch (error) {
        console.error('Error fetching existing rating:', error)
      }
    }

    fetchExistingRating()
  }, [ride.id, ride.status, user.id])

  const handleRatingSubmitted = () => {
    // Refresh the existing rating
    const fetchUpdatedRating = async () => {
      try {
        const response = await apiService.getPassengerRatings(user.id)
        if (response.status === 'SUCCESS' && response.data) {
          const rating = response.data.find(r => r.bookingId === ride.id)
          setExistingRating(rating)
        }
      } catch (error) {
        console.error('Error fetching updated rating:', error)
      }
    }
    fetchUpdatedRating()
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm hover:shadow-md transition-shadow">
        {/* Main Content */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            {/* Route */}
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="h-4 w-4 text-green-500" />
              <span className="font-medium text-gray-900">{ride.source}</span>
              <span className="text-gray-400">→</span>
              <MapPin className="h-4 w-4 text-red-500" />
              <span className="font-medium text-gray-900">{ride.destination}</span>
            </div>
            
            {/* Date and Time */}
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-1">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {ride.departureDate ? 
                    new Date(ride.departureDate).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    }) : 'Date not available'
                  }
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>
                  {ride.departureDate ? 
                    new Date(ride.departureDate).toLocaleTimeString('en-IN', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: true
                    }) : 'Time not available'
                  }
                </span>
              </div>
            </div>
            
            {/* Driver */}
            <p className="text-sm text-gray-600">
              <span className="font-medium">Driver:</span> {ride.driverName || 'Not assigned'}
            </p>
          </div>
          
          {/* Price and Actions */}
          <div className="text-right">
            <div className="text-xl font-bold text-gray-900 mb-1">₹{ride.pricePerSeat || ride.totalAmount || '0'}</div>
            <div className={`text-xs px-2 py-1 rounded-full inline-block mb-2 ${
              ride.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
              ride.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {ride.status}
            </div>
            
            {/* Rating Section */}
            {ride.status === 'COMPLETED' && (
              <div className="mt-2">
                {existingRating ? (
                  <div className="text-center">
                    <div className="flex justify-center items-center space-x-1 mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star}
                          className={`w-4 h-4 ${
                            star <= existingRating.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-600">Rated</p>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowRatingModal(true)}
                    className="text-xs bg-yellow-600 text-white px-3 py-1 rounded-full hover:bg-yellow-700 transition-colors"
                  >
                    Rate Now
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* View More Button */}
        <div className="text-center">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            {showDetails ? 'View Less' : 'View More'}
          </button>
        </div>
        
        {/* Detailed Information (Collapsible) */}
        {showDetails && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Contact:</span>
                  <span className="font-medium">{ride.driverPhone || 'Not available'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Seats Booked:</span>
                  <span className="font-medium">{ride.seatsBooked || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-medium">₹{ride.totalAmount || '0'}</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Vehicle:</span>
                  <span className="font-medium">
                    {ride.vehicleMake && ride.vehicleModel ? 
                      `${ride.vehicleMake} ${ride.vehicleModel}` : 
                      ride.vehicleModel || 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Vehicle Number:</span>
                  <span className="font-medium">{ride.vehicleNumber || 'Not available'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Booking ID:</span>
                  <span className="font-medium">#{ride.id || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-2 text-xs text-gray-500 text-center">
              Booked on: {ride.bookingDate ? new Date(ride.bookingDate).toLocaleDateString() : 'Date not available'}
            </div>
          </div>
        )}
      </div>
      
      {/* Rating Modal */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        ride={ride}
        user={user}
        onRatingSubmitted={handleRatingSubmitted}
      />
    </>
  )
}

export default PassengerDashboard