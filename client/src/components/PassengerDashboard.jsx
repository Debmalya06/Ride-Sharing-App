import { useState, useEffect } from 'react'
import { Search, MapPin, Calendar, Clock, Users, IndianRupee, Star, Filter, X, RefreshCw } from 'lucide-react'
import apiService from '../services/api'

const PassengerDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('search')
  const [searchFilters, setSearchFilters] = useState({
    from: '',
    to: '',
    date: '',
    maxPrice: ''
  })
  const [availableRides, setAvailableRides] = useState([])
  const [bookings, setBookings] = useState([]) // Active bookings
  const [rideHistory, setRideHistory] = useState([]) // Ride history
  const [loading, setLoading] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [error, setError] = useState('')
  const [selectedSeats, setSelectedSeats] = useState({}) // Track selected seats for each ride

  useEffect(() => {
    fetchBookings()
    loadAllRides()
  }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await apiService.getMyBookings()
      console.log('Bookings response:', response)
      
      if (response && response.status === 'SUCCESS' && response.data) {
        const allBookings = response.data
        
        // Separate active bookings from ride history
        const activeBookings = allBookings.filter(booking => 
          booking.status === 'PENDING' || booking.status === 'CONFIRMED'
        )
        
        const completedBookings = allBookings.filter(booking => 
          booking.status === 'CANCELLED' || booking.status === 'COMPLETED'
        )
        
        setBookings(activeBookings)
        setRideHistory(completedBookings)
        
        console.log('Active bookings:', activeBookings)
        console.log('Ride history:', completedBookings)
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      setError('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  // Update the loadAllRides function
  const loadAllRides = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await apiService.searchRides({
        source: '',
        destination: '',
        date: '',
        maxPrice: ''
      })
      
      console.log('API Response:', response)
      
      // Handle the correct response format based on the Postman response
      let ridesArray = []
      
      if (response && response.status === 'SUCCESS' && response.data && response.data.content) {
        // Backend returns: { status: "SUCCESS", data: { content: [...] } }
        ridesArray = response.data.content
      } else if (response && Array.isArray(response)) {
        // In case response is directly an array
        ridesArray = response
      } else if (response && response.data && Array.isArray(response.data)) {
        // In case response is { data: [...] }
        ridesArray = response.data
      } else {
        console.log('Unexpected response format:', response)
        ridesArray = []
      }
      
      console.log('Extracted rides array:', ridesArray)
      
      // Filter to show only future rides
      const currentDateTime = new Date()
      const futureRides = ridesArray.filter(ride => {
        const rideDateTime = new Date(ride.departureDate) // departureDate is already in ISO format
        return rideDateTime > currentDateTime && ride.status === 'ACTIVE'
      })
      
      setAvailableRides(futureRides)
      console.log('Future rides loaded:', futureRides)
      
    } catch (error) {
      console.error('Error loading rides:', error)
      setError('Failed to load available rides')
    } finally {
      setLoading(false)
    }
  }

  // Update the handleSearch function with the same logic
  const handleSearch = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError('')
      
      const response = await apiService.searchRides(searchFilters)
      console.log('Search Response:', response)
      
      // Handle the correct response format
      let ridesArray = []
      
      if (response && response.status === 'SUCCESS' && response.data && response.data.content) {
        ridesArray = response.data.content
      } else if (response && Array.isArray(response)) {
        ridesArray = response
      } else if (response && response.data && Array.isArray(response.data)) {
        ridesArray = response.data
      } else {
        console.log('Unexpected search response format:', response)
        ridesArray = []
      }
      
      // Filter to show only future rides
      const currentDateTime = new Date()
      const futureRides = ridesArray.filter(ride => {
        const rideDateTime = new Date(ride.departureDate)
        return rideDateTime > currentDateTime && ride.status === 'ACTIVE'
      })
      
      setAvailableRides(futureRides)
      setSearchPerformed(true)
      
    } catch (error) {
      console.error('Error searching rides:', error)
      setError('Failed to search rides')
    } finally {
      setLoading(false)
    }
  }

  // Update the handleBookRide function to collect pickup point
  const handleBookRide = async (rideId, seatsToBook = 1) => {
    try {
      setLoading(true)
      setError('')
      
      // Prompt user for pickup point
      const pickupPoint = prompt('Enter your pickup point:')
      if (!pickupPoint || pickupPoint.trim() === '') {
        alert('Pickup point is required!')
        return
      }
      
      // Get user info from props or localStorage
      const userInfo = user || JSON.parse(localStorage.getItem('user') || '{}')
      
      const response = await apiService.bookRide(
        rideId, 
        seatsToBook,
        userInfo.firstName || userInfo.name || "Passenger",
        userInfo.phoneNumber || userInfo.phone || "0000000000",
        pickupPoint.trim()
      )
      
      console.log('Booking response:', response)
      
      if (response && (response.status === 'SUCCESS' || response.message)) {
        alert('Ride booked successfully! Status: PENDING (waiting for driver confirmation)')
        // Refresh rides and bookings
        await loadAllRides()
        await fetchBookings()
        // Reset seat selection
        setSelectedSeats(prev => ({
          ...prev,
          [rideId]: 1
        }))
      } else {
        throw new Error('Booking failed')
      }
    } catch (error) {
      console.error('Error booking ride:', error)
      setError(`Failed to book ride: ${error.message}`)
      alert(`Failed to book ride: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId) => {
    try {
      setLoading(true)
      const response = await apiService.cancelBooking(bookingId)
      if (response.status === 'SUCCESS') {
        alert('Booking cancelled successfully!')
        fetchBookings() // Refresh bookings
      } else {
        alert(response.message || 'Cancellation failed')
      }
    } catch (err) {
      alert(err.message || 'Cancellation failed')
    } finally {
      setLoading(false)
    }
  }

  // Update the ride card display to match the design in your image
  const renderRideCard = (ride) => {
    const selectedSeatsCount = selectedSeats[ride.id] || 1
    const totalPrice = ride.pricePerSeat * selectedSeatsCount

    return (
      <div key={ride.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
        {/* Route Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {ride.source} → {ride.destination}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              ride.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800' : 
              ride.status === 'FULL' ? 'bg-orange-100 text-orange-800' : 
              'bg-gray-100 text-gray-800'
            }`}>
              {ride.status?.toLowerCase()}
            </span>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-yellow-600">₹{ride.pricePerSeat}</p>
            <p className="text-sm text-gray-500">per seat</p>
          </div>
        </div>

        {/* Ride Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* Date & Time */}
          <div className="flex items-center space-x-2 text-gray-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
            </svg>
            <div>
              <p className="text-xs text-gray-500">Date & Time</p>
              <p className="text-sm font-medium">
                {new Date(ride.departureDate).toLocaleDateString()} {new Date(ride.departureDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </p>
            </div>
          </div>

          {/* Available Seats */}
          <div className="flex items-center space-x-2 text-gray-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
            </svg>
            <div>
              <p className="text-xs text-gray-500">Available Seats</p>
              <p className="text-sm font-medium">
                {ride.availableSeats}/{ride.totalSeats} seats
              </p>
            </div>
          </div>

          {/* Vehicle Type */}
          <div className="flex items-center space-x-2 text-gray-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v1h-1a1 1 0 00-1 1v5H5V6a1 1 0 00-1-1H3V4zM4 8h12v6a1 1 0 01-1 1H5a1 1 0 01-1-1V8z"/>
            </svg>
            <div>
              <p className="text-xs text-gray-500">Vehicle Type</p>
              <p className="text-sm font-medium">{ride.vehicleType}</p>
            </div>
          </div>
        </div>

        {/* Vehicle Details Section */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Vehicle Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Model</p>
              <p className="font-medium text-gray-900">{ride.vehicleModel}</p>
            </div>
            <div>
              <p className="text-gray-500">Color</p>
              <p className="font-medium text-gray-900">{ride.vehicleColor}</p>
            </div>
            <div>
              <p className="text-gray-500">Number</p>
              <p className="font-medium text-gray-900">{ride.vehicleNumber}</p>
            </div>
          </div>
        </div>

        {/* Driver Info Section */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {ride.driverName ? ride.driverName.charAt(0).toUpperCase() : 'D'}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {ride.driverName}
                  </p>
                  <p className="text-xs text-gray-600">
                    📞 {ride.driverPhone}
                  </p>
                </div>
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  <span className="text-sm text-gray-600">4.5</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {ride.notes && (
          <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Notes:</span> {ride.notes}
            </p>
          </div>
        )}

        {/* Booking Section */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium text-gray-700">Seats:</label>
              <select
                value={selectedSeatsCount}
                onChange={(e) => setSelectedSeats(prev => ({
                  ...prev,
                  [ride.id]: parseInt(e.target.value)
                }))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                disabled={ride.availableSeats === 0}
              >
                {[...Array(Math.min(4, ride.availableSeats))].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} seat{i > 0 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Amount:</p>
              <p className="text-xl font-bold text-gray-900">₹{totalPrice}</p>
            </div>
          </div>

          <button
            onClick={() => handleBookRide(ride.id, selectedSeatsCount)}
            disabled={ride.availableSeats === 0 || loading}
            className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-colors ${
              ride.availableSeats === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-yellow-500 hover:bg-yellow-600 text-white'
            }`}
          >
            {ride.availableSeats === 0 ? 'Fully Booked' : 'Book Now'}
          </button>
        </div>
      </div>
    )
  }

  // Update the stats calculation to use only active bookings
  const stats = {
    ridesCompleted: rideHistory.filter(booking => booking.status === 'COMPLETED').length,
    totalSpent: rideHistory.reduce((sum, booking) => {
      if (booking.status === 'COMPLETED') {
        return sum + (booking.totalAmount || 0)
      }
      return sum
    }, 0),
    avgRating: 5.0, // You can calculate this from completed rides
    activeBookings: bookings.length
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Passenger Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user.name}!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Search className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Rides Taken</p>
                <p className="text-2xl font-bold text-gray-900">{rideHistory.filter(b => b.status === 'COMPLETED').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <IndianRupee className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">₹{rideHistory.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {rideHistory.length > 0 
                    ? (rideHistory.reduce((sum, b) => sum + (b.rating || 5), 0) / rideHistory.length).toFixed(1)
                    : '5.0'
                  }
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('search')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'search'
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Search Rides
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bookings'
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Bookings ({bookings.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Ride History ({rideHistory.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'search' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Find Your Perfect Ride</h3>
                
                {/* Search Form */}
                <form onSubmit={handleSearch} className="bg-gray-50 rounded-lg p-6 mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={searchFilters.from}
                          onChange={(e) => setSearchFilters({...searchFilters, from: e.target.value})}
                          className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                          placeholder="Departure city"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={searchFilters.to}
                          onChange={(e) => setSearchFilters({...searchFilters, to: e.target.value})}
                          className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                          placeholder="Destination city"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                      <input
                        type="date"
                        value={searchFilters.date}
                        min={new Date().toISOString().split('T')[0]} // Set minimum date to today
                        onChange={(e) => setSearchFilters({...searchFilters, date: e.target.value})}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Price</label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                          type="number"
                          value={searchFilters.maxPrice}
                          onChange={(e) => setSearchFilters({...searchFilters, maxPrice: e.target.value})}
                          className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                  >
                    <Search className="h-5 w-5" />
                    <span>{loading ? 'Searching...' : 'Search Rides'}</span>
                  </button>
                </form>

                {error && (
                  <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                {/* Available Rides */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium text-gray-900">
                      {searchPerformed ? 'Search Results' : 'Available Rides'}
                    </h4>
                    <button 
                      onClick={loadAllRides}
                      className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                    >
                      <Filter className="h-4 w-4" />
                      <span className="text-sm">Refresh Rides</span>
                    </button>
                  </div>

                  {loading && (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading rides...</p>
                    </div>
                  )}

                  {!loading && availableRides.length > 0 && (
                    <div className="grid gap-6">
                      {availableRides.map(renderRideCard)}
                    </div>
                  )}

                  {!loading && searchPerformed && availableRides.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No rides found for your search criteria. Try adjusting your filters.
                    </div>
                  )}

                  {!loading && !searchPerformed && availableRides.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Use the search form above to find available rides.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'bookings' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">My Active Bookings</h3>
                  <button 
                    onClick={fetchBookings}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span className="text-sm">Refresh</span>
                  </button>
                </div>

                {error && (
                  <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                {loading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading bookings...</p>
                  </div>
                )}

                {!loading && bookings.length > 0 && (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                        {/* Driver Info */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {booking.driverName ? booking.driverName.charAt(0).toUpperCase() : 'D'}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{booking.driverName || 'Driver'}</h4>
                              <p className="text-sm text-gray-600">{booking.source} → {booking.destination}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              booking.status === 'CONFIRMED' 
                                ? 'bg-green-100 text-green-800' 
                                : booking.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {booking.status}
                            </div>
                            <p className="text-lg font-bold text-gray-900 mt-1">₹{booking.totalAmount}</p>
                          </div>
                        </div>

                        {/* Booking Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                          <div>
                            <p className="text-gray-500">Date & Time</p>
                            <p className="font-medium">{new Date(booking.departureDate).toLocaleDateString()} at {new Date(booking.departureDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Seats Booked</p>
                            <p className="font-medium">{booking.seatsBooked}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Vehicle</p>
                            <p className="font-medium">{booking.vehicleModel || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Booking Date</p>
                            <p className="font-medium">{new Date(booking.bookingDate).toLocaleDateString()}</p>
                          </div>
                        </div>

                        {/* Pickup Point */}
                        {booking.pickupPoint && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Pickup:</span> {booking.pickupPoint}
                            </p>
                          </div>
                        )}

                        {/* Status Message */}
                        <div className="mb-4 p-3 rounded-lg bg-blue-50">
                          <p className="text-sm text-blue-700">
                            {booking.status === 'PENDING' && '⏳ Waiting for driver confirmation'}
                            {booking.status === 'CONFIRMED' && '✅ Booking confirmed by driver'}
                          </p>
                        </div>

                        {/* Driver Contact */}
                        {booking.status === 'CONFIRMED' && (
                          <div className="mb-4 p-3 bg-green-50 rounded-lg">
                            <p className="text-sm text-green-700">
                              <span className="font-medium">Driver Contact:</span> {booking.driverPhone || 'N/A'}
                            </p>
                          </div>
                        )}

                        {/* Cancel Button - Only for PENDING and CONFIRMED bookings */}
                        {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              disabled={loading}
                              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Cancel Booking
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {!loading && bookings.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Bookings</h3>
                    <p className="text-gray-600 mb-4">You don't have any active bookings at the moment.</p>
                    <button
                      onClick={() => setActiveTab('search')}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Search for Rides
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Ride History</h3>
                  <button 
                    onClick={fetchBookings}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span className="text-sm">Refresh</span>
                  </button>
                </div>

                {error && (
                  <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                {loading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading ride history...</p>
                  </div>
                )}

                {!loading && rideHistory.length > 0 && (
                  <div className="space-y-4">
                    {rideHistory.map((booking) => (
                      <div key={booking.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                        {/* Driver Info */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {booking.driverName ? booking.driverName.charAt(0).toUpperCase() : 'D'}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{booking.driverName || 'Driver'}</h4>
                              <p className="text-sm text-gray-600">{booking.source} → {booking.destination}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              booking.status === 'COMPLETED' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {booking.status}
                            </div>
                            <p className="text-lg font-bold text-gray-900 mt-1">₹{booking.totalAmount}</p>
                          </div>
                        </div>

                        {/* Booking Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                          <div>
                            <p className="text-gray-500">Date & Time</p>
                            <p className="font-medium">{new Date(booking.departureDate).toLocaleDateString()} at {new Date(booking.departureDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Seats Booked</p>
                            <p className="font-medium">{booking.seatsBooked}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Vehicle</p>
                            <p className="font-medium">{booking.vehicleModel || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Booking Date</p>
                            <p className="font-medium">{new Date(booking.bookingDate).toLocaleDateString()}</p>
                          </div>
                        </div>

                        {/* Pickup Point */}
                        {booking.pickupPoint && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Pickup:</span> {booking.pickupPoint}
                            </p>
                          </div>
                        )}

                        {/* Final Status Message */}
                        <div className={`mb-4 p-3 rounded-lg ${
                          booking.status === 'COMPLETED' ? 'bg-green-50' : 'bg-red-50'
                        }`}>
                          <p className={`text-sm ${
                            booking.status === 'COMPLETED' ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {booking.status === 'COMPLETED' && '✅ This booking has been completed successfully.'}
                            {booking.status === 'CANCELLED' && '❌ This booking has been cancelled.'}
                          </p>
                        </div>

                        {/* Driver Contact for completed rides */}
                        {booking.status === 'COMPLETED' && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Driver Contact:</span> {booking.driverPhone || 'N/A'}
                            </p>
                          </div>
                        )}

                        {/* Add Rating Button for completed rides */}
                        {booking.status === 'COMPLETED' && (
                          <div className="flex justify-end">
                            <button
                              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors"
                              onClick={() => {
                                // Add rating functionality later
                                alert('Rating functionality coming soon!')
                              }}
                            >
                              Rate Driver
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {!loading && rideHistory.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Ride History</h3>
                    <p className="text-gray-600 mb-4">You haven't completed any rides yet.</p>
                    <button
                      onClick={() => setActiveTab('search')}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Book Your First Ride
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PassengerDashboard