import { useState, useEffect } from 'react'
import { Search, MapPin, Calendar, Clock, Users, Star, RefreshCw, Car } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import apiService from '../services/api'
import PaymentModal from './PaymentModal'
import PaymentHistory from './PaymentHistory'

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

const PassengerDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('search')
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
    fetchBookings()
    loadAllRides()
    
    // Add debugging to see what happens on load
    console.log('PassengerDashboard mounted, availableRides:', availableRides)
  }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
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
      setLoading(false)
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
      setError('Please enter both pickup and drop-off locations.')
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
        alert('Booking created successfully! Please check your booking history. Payment will be available after driver confirmation.')
        
        // Refresh the bookings list to show the new booking
        await fetchBookings()
        
        // Switch to bookings tab to show the new booking
        setActiveTab('bookings')
        
        // Clear any previous errors
        setError('')
      } else {
        setError('Failed to create booking. Please try again.')
      }
    } catch (error) {
      console.error('Error creating booking:', error)
      setError('Failed to book ride. Please try again.')
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
        alert('Booking cancelled successfully!')
      } else {
        alert('Failed to cancel booking. Please try again.')
      }
    } catch (error) {
      console.error('Error cancelling booking:', error)
      alert('Failed to cancel booking. Please try again.')
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
    alert('Payment successful! Your ride is confirmed.')
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
      {/* Header */}
      <div className="bg-white shadow-sm px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.firstName}!</h1>
            <p className="text-gray-600">Find your perfect ride</p>
          </div>
          
          {/* Tab Navigation - Horizontal */}
          <div className="flex space-x-1 bg-yellow-500  rounded-lg p-1">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'search' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Search Rides
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'bookings' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              My Bookings ({bookings.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'history' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Ride History ({rideHistory.length})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'payments' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Payment History
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout for Search Tab */}
      {activeTab === 'search' && (
        <div className="flex-1 flex">
          {/* Left Panel - Search Form */}
          <div className="w-2/5 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6">Get ready for your first trip</h2>
              <p className="text-gray-600 mb-8">Discover the convenience of SmartRide. Request a ride now, or schedule one for later directly from your browser.</p>
              
              {/* Search Form */}
              <div className="space-y-4">
                <div className="relative">
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
                  </div>
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
                
                <div className="relative">
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
                  </div>
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
                                <span>{ride.departureTime ? new Date(ride.departureTime).toLocaleDateString() : 'No date'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 flex-shrink-0" />
                                <span>{ride.departureTime ? new Date(ride.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No time'}</span>
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

          {/* Right Panel - Real World Map */}
          <div className="flex-1 bg-gray-100 relative overflow-hidden">
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
              <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-10">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Car className="h-4 w-4 text-yellow-500" />
                  Route Overview
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="flex-1 truncate">{searchFilters.from}</span>
                  </div>
                  <div className="ml-1.5 w-0.5 h-4 bg-gray-300"></div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
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

      {/* Other Tabs Content (Full Width) */}
      {activeTab !== 'search' && (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {/* Tab Content for non-search tabs */}
              {activeTab === 'bookings' && (
                <div className="bg-yellow-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-6 text-gray-800">My Bookings</h3>
                  
                  {bookings.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow-sm">
                      <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium mb-2">No bookings yet</h3>
                      <p>Start by searching for rides in the Search tab.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Array.isArray(bookings) && bookings.map((booking) => (
                        <div key={booking.id} className="bg-yellow-100 border border-yellow-700 rounded-lg p-6 hover:shadow-lg transition-shadow shadow-sm">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <MapPin className="h-4 w-4 text-green-500" />
                                <span className="font-medium">{booking.source || booking.ride?.source || 'N/A'}</span>
                                <span className="text-gray-400">→</span>
                                <MapPin className="h-4 w-4 text-red-500" />
                                <span className="font-medium">{booking.destination || booking.ride?.destination || 'N/A'}</span>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{booking.departureDate ? new Date(booking.departureDate).toLocaleDateString() : 'N/A'}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{booking.departureDate ? new Date(booking.departureDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Users className="h-4 w-4" />
                                  <span>{booking.seatsBooked} seats</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-gray-900">₹{booking.totalAmount || booking.totalPrice || 0}</div>
                              <div className="text-sm text-gray-500">Total amount</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
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
                              <span className="ml-2 text-sm text-gray-500">
                                Booking ID: {booking.id}
                              </span>
                            </div>
                            
                            <div className="flex gap-2">
                              {booking.status === 'CONFIRMED' && (
                                <>
                                  <button
                                    onClick={() => setPaymentModal({ isOpen: true, booking: booking })}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                  >
                                    Pay Now
                                  </button>
                                  <button
                                    onClick={() => handleCancelBooking(booking.id)}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                              
                              {booking.status === 'PENDING' && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-500">Waiting for driver confirmation...</span>
                                  <button
                                    onClick={() => handleCancelBooking(booking.id)}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                              
                              {booking.status === 'PAID' && (
                                <span className="text-sm text-green-600 font-medium">✓ Payment Complete</span>
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
                <div className="bg-yellow-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-6 text-gray-800">Ride History</h3>
                  
                  {rideHistory.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow-sm">
                      <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium mb-2">No completed rides yet</h3>
                      <p>Your ride history will appear here after you complete trips.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Array.isArray(rideHistory) && rideHistory.map((ride, index) => (
                        <div key={index} className="bg-yellow-100 border border-yellow-700 rounded-lg p-6 hover:shadow-lg transition-shadow shadow-sm">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <MapPin className="h-4 w-4 text-green-500" />
                                <span className="font-medium">{ride.source}</span>
                                <span className="text-gray-400">→</span>
                                <MapPin className="h-4 w-4 text-red-500" />
                                <span className="font-medium">{ride.destination}</span>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{new Date(ride.departureTime).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{new Date(ride.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-gray-900">₹{ride.pricePerSeat}</div>
                              <div className="text-sm text-gray-500">Completed</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium">{ride.driver?.firstName?.[0]}</span>
                              </div>
                              <div>
                                <p className="font-medium">{ride.driver?.firstName} {ride.driver?.lastName}</p>
                                <p className="text-sm text-gray-500">Driver</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="text-sm text-gray-600">5.0</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'payments' && (
                <div className="bg-yellow-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-6">Payment History</h3>
                  <PaymentHistory user={user} userType="passenger" />
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
    </div>
  )
}

export default PassengerDashboard