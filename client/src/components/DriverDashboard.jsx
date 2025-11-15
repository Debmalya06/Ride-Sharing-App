import { useState, useEffect } from 'react'
import { Car, Plus, MapPin, Clock, Users, IndianRupee, Calendar, Eye, TrendingUp, DollarSign, Activity, CheckCircle, RefreshCw } from 'lucide-react'
import apiService from '../services/api'
import DriverWallet from './DriverWallet'
import Loader from './Loader'
import { useToast } from './ToastContext'

const DriverDashboard = ({ user }) => {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('overview')
  const [isDashboardLoading, setIsDashboardLoading] = useState(true)
  const [rides, setRides] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [postRideForm, setPostRideForm] = useState({
    from: '',
    to: '',
    date: '',
    time: '',
    seats: '',
    price: '',
    notes: ''
  })
  const [fareCalculation, setFareCalculation] = useState(null)
  const [calculatingFare, setCalculatingFare] = useState(false)
  
  // Driver stats state
  const [driverStats, setDriverStats] = useState({
    totalEarnings: 0,
    pendingEarnings: 0,
    completedEarnings: 0,
    todayEarnings: 0,
    totalTransactions: 0,
    completedTransactions: 0
  })
  const [recentActivities, setRecentActivities] = useState([])
  const [statsLoading, setStatsLoading] = useState(false)

  useEffect(() => {
    const initializeDashboard = async () => {
      // Simulate initial data loading
      await new Promise(resolve => setTimeout(resolve, 2500))
      setIsDashboardLoading(false)
      
      // Load data after initial loading
      await fetchData()
      
      // Fetch activities for overview
      if (user?.userId) {
        await fetchRecentActivities()
      }
    }
    
    initializeDashboard()
  }, [user?.userId]) // Re-run when userId becomes available

  // Handle tab switching - no more full page loading
  const handleTabSwitch = (newTab) => {
    if (newTab === activeTab) return // Don't switch if already on the same tab
    setActiveTab(newTab)
    
    // Fetch specific data when switching to overview
    if (newTab === 'overview' && user?.userId) {
      fetchDriverStats()
      fetchRecentActivities()
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [ridesResponse, bookingsResponse] = await Promise.all([
        apiService.getMyRides(),
        apiService.getDriverBookings()
      ])
      
      if (ridesResponse.status === 'SUCCESS') {
        setRides(ridesResponse.data || [])
      }
      
      if (bookingsResponse.status === 'SUCCESS') {
        setBookings(bookingsResponse.data || [])
      }
      
      // Fetch driver earnings summary
      if (user?.userId) {
        await fetchDriverStats()
      }
    } catch (err) {
      setError('Failed to load data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }
  
  const fetchDriverStats = async () => {
    try {
      setStatsLoading(true)
      const response = await apiService.get(`/payments/earnings/${user.userId}/summary`)
      
      console.log('Driver Stats Response:', response) // Debug log
      
      // The backend returns: { success: true, message: "...", data: { totalEarnings, pendingEarnings, ... } }
      if (response.success && response.data) {
        setDriverStats({
          totalEarnings: response.data.totalEarnings || 0,
          pendingEarnings: response.data.pendingEarnings || 0,
          completedEarnings: response.data.completedEarnings || 0,
          todayEarnings: response.data.todayEarnings || 0,
          totalTransactions: response.data.totalTransactions || 0,
          completedTransactions: response.data.completedTransactions || 0
        })
      } else {
        console.warn('Driver stats API returned no data')
        // Keep default values (all zeros)
      }
    } catch (err) {
      console.error('Failed to load driver stats:', err)
      // Keep default values on error
    } finally {
      setStatsLoading(false)
    }
  }
  
  const fetchRecentActivities = async () => {
    try {
      // Fetch recent bookings and payment history
      const [bookingsResponse, paymentsResponse] = await Promise.all([
        apiService.getDriverBookings(),
        apiService.get(`/payments/earnings/${user.userId}`).catch(() => ({ success: false, data: [] }))
      ])
      
      const activities = []
      
      // Add booking activities
      if (bookingsResponse.status === 'SUCCESS' && bookingsResponse.data) {
        const bookingActivities = bookingsResponse.data
          .slice(0, 3) // Get last 3 bookings
          .map(booking => ({
            type: 'booking',
            title: booking.bookingStatus === 'CONFIRMED' ? 'New booking received' : 
                   booking.bookingStatus === 'COMPLETED' ? 'Booking completed' : 'Booking updated',
            description: `${booking.ride?.departureLocation || 'Unknown'} → ${booking.ride?.destination || 'Unknown'} ride on ${new Date(booking.ride?.departureDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`,
            time: formatTimeAgo(booking.bookingDate),
            amount: booking.totalAmount,
            icon: 'users'
          }))
        activities.push(...bookingActivities)
      }
      
      // Add payment activities
      if (paymentsResponse.success && paymentsResponse.data) {
        const paymentActivities = paymentsResponse.data
          .filter(payment => payment.settlementStatus === 'COMPLETED')
          .slice(0, 2) // Get last 2 completed payments
          .map(payment => ({
            type: 'payment',
            title: 'Payment received',
            description: `₹${payment.driverSettlementAmount?.toLocaleString('en-IN')} for ${payment.bookingId ? 'booking #' + payment.bookingId : 'ride'}`,
            time: formatTimeAgo(payment.settlementDate),
            amount: payment.driverSettlementAmount,
            icon: 'rupee'
          }))
        activities.push(...paymentActivities)
      }
      
      // Sort by most recent and limit to 5
      activities.sort((a, b) => {
        // Sort by time string (this is approximate, in production you'd use actual dates)
        return 0 // Keep the order as is since we're already getting recent items
      })
      
      setRecentActivities(activities.slice(0, 5))
    } catch (err) {
      console.error('Failed to load recent activities:', err)
      // Set empty array on error
      setRecentActivities([])
    }
  }
  
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Recently'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  }

  const handlePostRideSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Frontend validation
    try {
      // Validate required fields
      if (!postRideForm.from.trim()) {
        throw new Error('Please enter departure location')
      }
      if (!postRideForm.to.trim()) {
        throw new Error('Please enter destination location')
      }
      if (!postRideForm.date) {
        throw new Error('Please select departure date')
      }
      if (!postRideForm.time) {
        throw new Error('Please select departure time')
      }
      if (!postRideForm.seats || parseInt(postRideForm.seats) < 1) {
        throw new Error('Please select number of available seats')
      }
      if (!postRideForm.price || parseFloat(postRideForm.price) < 1) {
        throw new Error('Please enter a valid price per seat')
      }

      // Validate date is not in the past
      const selectedDateTime = new Date(`${postRideForm.date}T${postRideForm.time}`)
      const now = new Date()
      if (selectedDateTime <= now) {
        throw new Error('Departure date and time must be in the future')
      }

      // Validate price range
      const price = parseFloat(postRideForm.price)
      if (price < 10) {
        throw new Error('Price per seat must be at least ₹10')
      }
      if (price > 10000) {
        throw new Error('Price per seat cannot exceed ₹10,000')
      }

      // Validate seat count
      const seats = parseInt(postRideForm.seats)
      if (seats < 1 || seats > 8) {
        throw new Error('Available seats must be between 1 and 8')
      }

      const response = await apiService.postRide(postRideForm)
      
      if (response.status === 'SUCCESS') {
        toast.success('Ride posted successfully!')
        setPostRideForm({
          from: '',
          to: '',
          date: '',
          time: '',
          seats: '',
          price: '',
          notes: ''
        })
        setFareCalculation(null) // Reset fare calculation
        fetchData() // Refresh rides list
        await handleTabSwitch('my-rides') // Switch to My Rides tab to see the posted ride
      } else {
        setError(response.message || 'Failed to post ride')
      }
    } catch (err) {
      console.error('Error posting ride:', err)
      setError(err.message || 'Failed to post ride')
    } finally {
      setLoading(false)
    }
  }

  const handlePostRideChange = (e) => {
    setPostRideForm({
      ...postRideForm,
      [e.target.name]: e.target.value
    })
  }

  // Function to calculate fare based on distance
  const calculateFare = async () => {
    if (!postRideForm.from || !postRideForm.to) {
      setError('Please enter both source and destination to calculate fare')
      return
    }

    setCalculatingFare(true)
    setError('')
    
    try {
      const response = await apiService.calculateFare(postRideForm.from, postRideForm.to)
      
      if (response.status === 'SUCCESS') {
        setFareCalculation(response.data)
        // Auto-fill the calculated fare in the price field
        setPostRideForm({
          ...postRideForm,
          price: response.data.calculatedFare.toString()
        })
      } else {
        setError('Failed to calculate fare: ' + response.message)
      }
    } catch (err) {
      setError('Error calculating fare: ' + err.message)
    } finally {
      setCalculatingFare(false)
    }
  }

  // Ride management functions
  const handleRideStatusChange = async (rideId, action) => {
    try {
      setLoading(true)
      let response
      
      switch (action) {
        case 'cancel':
          response = await apiService.cancelRide(rideId)
          break
        case 'complete':
          response = await apiService.completeRide(rideId)
          break
        case 'activate':
          response = await apiService.activateRide(rideId)
          break
        default:
          throw new Error('Invalid action')
      }

      if (response.status === 'SUCCESS') {
        toast.success(`Ride ${action}d successfully!`)
        fetchData() // Refresh data
      } else {
        toast.error(response.message || `Failed to ${action} ride`)
      }
    } catch (err) {
      toast.error(err.message || `Failed to ${action} ride`)
    } finally {
      setLoading(false)
    }
  }

  // Booking management functions
  const handleBookingAction = async (rideId, bookingId, action) => {
    try {
      setLoading(true)
      let response
      
      if (action === 'confirm') {
        response = await apiService.confirmBooking(rideId, bookingId)
      } else if (action === 'cancel') {
        response = await apiService.cancelBookingByDriver(rideId, bookingId)
      }

      if (response.status === 'SUCCESS') {
        toast.success(`Booking ${action}ed successfully!`)
        fetchData() // Refresh data
      } else {
        toast.error(response.message || `Failed to ${action} booking`)
      }
    } catch (err) {
      toast.error(err.message || `Failed to ${action} booking`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Initial Dashboard Loading */}
      {isDashboardLoading && (
        <div className="fixed inset-0 bg-white bg-opacity-98 flex flex-col items-center justify-center z-50">
          <Loader 
            size={250}
            showText={true}
            text="Loading your driver dashboard..."
            className="mb-8"
          />
          <div className="text-center max-w-lg mx-auto px-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Hit the Road! 🚗💨
            </h3>
            <p className="text-lg text-gray-600 mb-2">
              Setting up your driving experience...
            </p>
            <div className="flex justify-center items-center space-x-2 mt-6">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-ping"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header with Yellow Theme */}
        <div className="mb-6 sm:mb-8 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl shadow-lg p-6 sm:p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Driver Dashboard</h1>
              <p className="text-sm sm:text-base text-yellow-50">
                Welcome back, {user?.firstName || user?.name || 'Driver'}! 🚗
              </p>
              <div className="flex items-center gap-4 mt-3 text-xs sm:text-sm text-yellow-50">
                <div className="flex items-center gap-1">
                  <Car className="h-4 w-4" />
                  <span>{rides.filter(r => r.status === 'ACTIVE').length} Active Rides</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{bookings.length} Bookings</span>
                </div>
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4 text-center">
                <p className="text-xs text-yellow-50 mb-1">Your Rating</p>
                <div className="flex items-center gap-1 justify-center">
                  <span className="text-2xl font-bold">⭐</span>
                  <span className="text-xl font-bold">{user?.averageRating?.toFixed(1) || '5.0'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Responsive Grid with Dynamic Data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Total Rides */}
          <div className="bg-gradient-to-br from-yellow-50 to-white rounded-xl shadow-md p-4 sm:p-6 border border-yellow-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-yellow-500 p-2.5 sm:p-3 rounded-lg shadow-sm">
                <Car className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-xs text-green-600">
                <TrendingUp className="h-3 w-3" />
                <span className="font-medium">Active</span>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Rides</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{rides.length}</p>
              <p className="text-xs text-gray-500 mt-1">
                {rides.filter(r => r.status === 'ACTIVE').length} active rides
              </p>
            </div>
          </div>

          {/* Total Booking */}
          <div className="bg-gradient-to-br from-green-50 to-white rounded-xl shadow-md p-4 sm:p-6 border border-green-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-green-500 p-2.5 sm:p-3 rounded-lg shadow-sm">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-xs text-green-600">
                <Activity className="h-3 w-3" />
                <span className="font-medium">Bookings</span>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Bookings</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{bookings.length}</p>
              <p className="text-xs text-gray-500 mt-1">
                {bookings.filter(b => b.bookingStatus === 'CONFIRMED').length} confirmed
              </p>
            </div>
          </div>

          {/* Total Earnings */}
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-md p-4 sm:p-6 border border-blue-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-blue-500 p-2.5 sm:p-3 rounded-lg shadow-sm">
                <IndianRupee className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <DollarSign className="h-3 w-3" />
                <span className="font-medium">Total</span>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Earnings</p>
              {statsLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
              ) : (
                <>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    ₹{driverStats.totalEarnings?.toLocaleString('en-IN') || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    ₹{driverStats.todayEarnings?.toLocaleString('en-IN') || 0} today
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Completed Trips */}
          <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl shadow-md p-4 sm:p-6 border border-purple-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-purple-500 p-2.5 sm:p-3 rounded-lg shadow-sm">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-xs text-purple-600">
                <Calendar className="h-3 w-3" />
                <span className="font-medium">Status</span>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Completed Trips</p>
              {statsLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
              ) : (
                <>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {driverStats.completedTransactions || rides.filter(r => r.status === 'COMPLETED').length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {driverStats.totalTransactions || rides.length} total trips
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation - Responsive */}
        <div className="bg-white rounded-lg shadow-sm mb-6 sm:mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto space-x-4 sm:space-x-8 px-4 sm:px-6 scrollbar-hide">
              <button
                onClick={() => handleTabSwitch('overview')}
                className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => handleTabSwitch('post-ride')}
                className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'post-ride'
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Post Ride
              </button>
              <button
                onClick={() => handleTabSwitch('my-rides')}
                className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'my-rides'
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Rides
              </button>
              <button
                onClick={() => handleTabSwitch('bookings')}
                className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'bookings'
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="hidden sm:inline">Manage </span>Bookings
              </button>
              <button
                onClick={() => handleTabSwitch('wallet')}
                className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'wallet'
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                💳 Wallet
              </button>
            </nav>
          </div>

          {/* Main Content */}
            {loading && (
              <Loader 
                overlay={true} 
                text="Loading..." 
                size={180}
                className="bg-white bg-opacity-95 rounded-lg"
              />
            )}

          <div className="p-4 sm:p-6">
            {activeTab === 'overview' && (
              <div>
                {/* Earnings Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center gap-3">
                      <div className="bg-yellow-500 p-2 rounded-lg">
                        <DollarSign className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-yellow-800 font-medium">Pending Earnings</p>
                        {statsLoading ? (
                          <div className="animate-pulse bg-yellow-200 h-6 w-20 rounded mt-1"></div>
                        ) : (
                          <p className="text-xl font-bold text-yellow-900">
                            ₹{typeof driverStats.pendingEarnings === 'number' ? driverStats.pendingEarnings.toLocaleString('en-IN') : '0'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-500 p-2 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-green-800 font-medium">Completed Earnings</p>
                        {statsLoading ? (
                          <div className="animate-pulse bg-green-200 h-6 w-20 rounded mt-1"></div>
                        ) : (
                          <p className="text-xl font-bold text-green-900">
                            ₹{typeof driverStats.completedEarnings === 'number' ? driverStats.completedEarnings.toLocaleString('en-IN') : '0'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-500 p-2 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-blue-800 font-medium">Today's Earnings</p>
                        {statsLoading ? (
                          <div className="animate-pulse bg-blue-200 h-6 w-20 rounded mt-1"></div>
                        ) : (
                          <p className="text-xl font-bold text-blue-900">
                            ₹{typeof driverStats.todayEarnings === 'number' ? driverStats.todayEarnings.toLocaleString('en-IN') : '0'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Driver Performance & Quick Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Performance Metrics */}
                  <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Activity className="h-5 w-5 text-yellow-500" />
                      Performance Metrics
                    </h3>
                    <div className="space-y-4">
                      {/* Total Trips Progress */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Total Trips Completed</span>
                          <span className="text-sm font-bold text-yellow-600">
                            {Math.round((driverStats.completedTransactions || 0) / Math.max(driverStats.totalTransactions || 1, 1) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-3 rounded-full transition-all duration-500" 
                            style={{ 
                              width: `${Math.min(Math.round((driverStats.completedTransactions || 0) / Math.max(driverStats.totalTransactions || 1, 1) * 100), 100)}%`,
                              minWidth: driverStats.completedTransactions > 0 ? '5%' : '0%'
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{driverStats.completedTransactions || 0} of {driverStats.totalTransactions || 0} trips</p>
                      </div>

                      {/* Active Rides */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Active Rides Today</span>
                          <span className="text-sm font-bold text-green-600">{rides.filter(r => r.status === 'ACTIVE').length}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full transition-all duration-500" 
                            style={{ 
                              width: `${Math.min((rides.filter(r => r.status === 'ACTIVE').length / Math.max(rides.length || 1, 1)) * 100, 100)}%`,
                              minWidth: rides.filter(r => r.status === 'ACTIVE').length > 0 ? '5%' : '0%'
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{rides.filter(r => r.status === 'ACTIVE').length} active out of {rides.length} total</p>
                      </div>

                      {/* Bookings Confirmed */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Confirmed Bookings</span>
                          <span className="text-sm font-bold text-blue-600">
                            {Math.round((bookings.filter(b => b.bookingStatus === 'CONFIRMED').length / Math.max(bookings.length || 1, 1)) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-blue-400 to-blue-500 h-3 rounded-full transition-all duration-500" 
                            style={{ 
                              width: `${Math.min((bookings.filter(b => b.bookingStatus === 'CONFIRMED').length / Math.max(bookings.length || 1, 1)) * 100, 100)}%`,
                              minWidth: bookings.filter(b => b.bookingStatus === 'CONFIRMED').length > 0 ? '5%' : '0%'
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{bookings.filter(b => b.bookingStatus === 'CONFIRMED').length} confirmed out of {bookings.length}</p>
                      </div>

                      {/* Rating */}
                      <div className="pt-4 border-t-2 border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Your Rating</span>
                          <div className="flex items-center gap-2 bg-yellow-50 px-3 py-2 rounded-lg">
                            <span className="text-xl">⭐</span>
                            <span className="text-lg font-bold text-gray-900">{(user?.averageRating || 5.0).toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Visual Feature Card */}
                  <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-xl shadow-lg p-6 text-white">
                    <div>
                      <h3 className="text-2xl font-bold mb-3">🚗 Drive & Earn</h3>
                      <p className="text-yellow-50 text-sm mb-6">
                        Flexible schedule, reliable payouts, and 24/7 support. Make every trip count!
                      </p>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex items-start gap-3 bg-white bg-opacity-15 p-3 rounded-lg">
                          <div className="flex-shrink-0 mt-0.5">
                            <CheckCircle className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Flexible Hours</p>
                            <p className="text-xs text-yellow-100">Work on your own schedule</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 bg-white bg-opacity-15 p-3 rounded-lg">
                          <div className="flex-shrink-0 mt-0.5">
                            <CheckCircle className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Weekly Payouts</p>
                            <p className="text-xs text-yellow-100">Get paid every week</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 bg-white bg-opacity-15 p-3 rounded-lg">
                          <div className="flex-shrink-0 mt-0.5">
                            <CheckCircle className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">24/7 Support</p>
                            <p className="text-xs text-yellow-100">We're always here</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                          <p className="text-xs text-yellow-50 font-medium mb-2">This Week</p>
                          <p className="text-3xl font-bold">{rides.length > 0 ? rides.filter(r => {
                            try {
                              const rideDate = new Date(r.departureDate)
                              const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                              return rideDate >= weekAgo
                            } catch {
                              return false
                            }
                          }).length : 0}</p>
                          <p className="text-xs text-yellow-100 mt-1">Rides</p>
                        </div>
                        <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                          <p className="text-xs text-yellow-50 font-medium mb-2">This Month</p>
                          <p className="text-3xl font-bold">{rides.length > 0 ? rides.filter(r => {
                            try {
                              const rideDate = new Date(r.departureDate)
                              const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                              return rideDate >= monthAgo
                            } catch {
                              return false
                            }
                          }).length : 0}</p>
                          <p className="text-xs text-yellow-100 mt-1">Rides</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleTabSwitch('post-ride')}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-4 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md hover:shadow-lg"
                  >
                    <Plus className="h-5 w-5" />
                    Post New Ride
                  </button>
                  <button
                    onClick={() => handleTabSwitch('wallet')}
                    className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-4 px-6 rounded-lg border-2 border-yellow-500 flex items-center justify-center gap-2 transition-colors shadow-md hover:shadow-lg"
                  >
                    <IndianRupee className="h-5 w-5 text-yellow-600" />
                    View Wallet
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'post-ride' && (
              <div className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-4 sm:mb-6">Post a New Ride</h3>
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 text-red-700 text-xs sm:text-sm">
                    {error}
                  </div>
                )}
                <form onSubmit={handlePostRideSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">From</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      <input
                        type="text"
                        name="from"
                        value={postRideForm.from}
                        onChange={handlePostRideChange}
                        required
                        className="w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        placeholder="Departure city"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">To</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      <input
                        type="text"
                        name="to"
                        value={postRideForm.to}
                        onChange={handlePostRideChange}
                        required
                        className="w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        placeholder="Destination city"
                      />
                    </div>
                  </div>
                  
                  {/* Dynamic Fare Calculation Section */}
                  <div className="md:col-span-2">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                        <h4 className="text-xs sm:text-sm font-medium text-blue-900">🚗 Dynamic Fare Calculator</h4>
                        <button
                          type="button"
                          onClick={calculateFare}
                          disabled={calculatingFare || !postRideForm.from || !postRideForm.to}
                          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                        >
                          {calculatingFare ? 'Calculating...' : 'Calculate Fare'}
                        </button>
                      </div>
                      
                      {fareCalculation && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                          <div className="bg-white rounded-lg p-2.5 sm:p-3 border border-blue-100">
                            <p className="text-blue-600 font-medium">Distance</p>
                            <p className="text-gray-900 font-semibold">{fareCalculation.distanceText}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-blue-100">
                            <p className="text-blue-600 font-medium">Duration</p>
                            <p className="text-gray-900 font-semibold">{fareCalculation.durationText}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-blue-100">
                            <p className="text-blue-600 font-medium">Calculated Fare</p>
                            <p className="text-green-600 font-bold text-lg">₹{fareCalculation.calculatedFare}</p>
                          </div>
                        </div>
                      )}
                      
                      {!fareCalculation && (
                        <p className="text-blue-700 text-xs sm:text-sm">
                          💡 <strong>FREE Smart Pricing:</strong> Our system calculates fare based on actual distance.
                          Formula: Base Fare (₹50) + Distance × Rate per KM (₹3/km).
                          Max cost:₹5000 Only.
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={postRideForm.date}
                      onChange={handlePostRideChange}
                      required
                      className="w-full px-3 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Time</label>
                    <input
                      type="time"
                      name="time"
                      value={postRideForm.time}
                      onChange={handlePostRideChange}
                      required
                      className="w-full px-3 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Available Seats</label>
                    <select 
                      name="seats"
                      value={postRideForm.seats}
                      onChange={handlePostRideChange}
                      required
                      className="w-full px-3 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    >
                      <option value="">Select seats</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                      <option value="6">6</option>
                      <option value="7">7</option>
                      <option value="8">8</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Price per Seat 
                      {fareCalculation && <span className="text-green-600 text-xs ml-2">(Auto-calculated)</span>}
                    </label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-3 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      <input
                        type="number"
                        name="price"
                        value={postRideForm.price}
                        onChange={handlePostRideChange}
                        required
                        min="0"
                        className="w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                    {fareCalculation && (
                      <p className="text-xs text-gray-500 mt-1">
                        Calculated based on {fareCalculation.distanceKm?.toFixed(1)} km distance
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                    <textarea
                      rows="3"
                      name="notes"
                      value={postRideForm.notes}
                      onChange={handlePostRideChange}
                      className="w-full px-3 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      placeholder="Any additional information for passengers..."
                    ></textarea>
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white py-2.5 sm:py-3 px-4 rounded-lg font-semibold text-sm sm:text-base transition-colors flex items-center justify-center space-x-2"
                    >
                      <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span>{loading ? 'Posting...' : 'Post Ride'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'my-rides' && (
              <div className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-4 sm:mb-6">My Posted Rides</h3>
                <div className="space-y-3 sm:space-y-4">
                  {rides.map((ride) => (
                    <div key={ride.id} className="border border-gray-200 rounded-lg p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <h4 className="text-base sm:text-lg font-medium text-gray-900">
                            {ride.source} → {ride.destination}
                          </h4>
                          <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium w-fit ${
                            ride.status === 'ACTIVE' 
                              ? 'bg-blue-100 text-blue-800' 
                              : ride.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {ride.status?.toLowerCase() || 'unknown'}
                          </span>
                        </div>
                        <button className="text-yellow-600 hover:text-yellow-700 p-2">
                          <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{ride.departureDate}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                          <span>{ride.departureTime}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                          <span>{ride.bookedSeats || 0}/{ride.availableSeats} seats</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <IndianRupee className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                          <span>₹{ride.pricePerSeat}</span>
                        </div>
                      </div>
                      {ride.notes && (
                        <div className="mt-3 text-xs sm:text-sm text-gray-600">
                          <strong>Notes:</strong> {ride.notes}
                        </div>
                      )}
                      
                      {/* Ride Management Buttons */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {ride.status === 'ACTIVE' && (
                          <>
                            <button
                              onClick={() => handleRideStatusChange(ride.id, 'complete')}
                              disabled={loading}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 sm:py-1 rounded text-xs sm:text-sm disabled:opacity-50"
                            >
                              <span className="hidden sm:inline">Mark </span>Complete
                            </button>
                            <button
                              onClick={() => handleRideStatusChange(ride.id, 'cancel')}
                              disabled={loading}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 sm:py-1 rounded text-xs sm:text-sm disabled:opacity-50"
                            >
                              Cancel<span className="hidden sm:inline"> Ride</span>
                            </button>
                          </>
                        )}
                        {ride.status === 'CANCELLED' && (
                          <button
                            onClick={() => handleRideStatusChange(ride.id, 'activate')}
                            disabled={loading}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                          >
                            Reactivate
                          </button>
                        )}
                        <button
                          onClick={() => window.open(`#/ride/${ride.id}/bookings`, '_blank')}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 sm:py-1 rounded text-xs sm:text-sm"
                        >
                          <span className="hidden sm:inline">View </span>Bookings ({ride.bookedSeats || 0})
                        </button>
                      </div>
                    </div>
                  ))}
                  {rides.length === 0 && (
                    <div className="text-center py-8 text-sm sm:text-base text-gray-500">
                      No rides posted yet. Create your first ride to get started!
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'bookings' && (
              <div className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-4 sm:mb-6">Booking Requests</h3>
                {bookings.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-6 sm:p-8 text-center">
                    <Users className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm sm:text-base text-gray-500">No booking requests at the moment</p>
                    <p className="text-xs sm:text-sm text-gray-400 mt-2">When passengers book your rides, they'll appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="border border-gray-200 rounded-lg p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
                          <div className="flex-1">
                            <h5 className="font-semibold text-sm sm:text-base text-gray-900">
                              {booking.passengerName}
                            </h5>
                            <p className="text-xs sm:text-sm text-gray-600">
                              {booking.passengerPhone}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">
                              {booking.source} → {booking.destination}
                            </p>
                            <p className="text-xs text-gray-500">
                              Pickup: {booking.pickupPoint}
                            </p>
                          </div>
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
                            <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                              booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                              booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {booking.status}
                            </span>
                            <p className="text-base sm:text-lg font-bold text-gray-900">
                              ₹{booking.totalAmount}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm">
                          <div>
                            <p className="text-gray-500">Departure</p>
                            <p className="font-medium">
                              {new Date(booking.departureDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Seats Booked</p>
                            <p className="font-medium">{booking.seatsBooked}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Booking Date</p>
                            <p className="font-medium">
                              {new Date(booking.bookingDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Vehicle</p>
                            <p className="font-medium truncate">{booking.vehicleModel}</p>
                          </div>
                        </div>

                        {/* Booking Management Buttons */}
                        {booking.status === 'PENDING' && (
                          <div className="flex flex-col sm:flex-row gap-2 mt-4">
                            <button
                              onClick={() => handleBookingAction(booking.rideId, booking.id, 'confirm')}
                              disabled={loading}
                              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm sm:text-base font-medium transition-colors disabled:opacity-50"
                            >
                              <span className="hidden sm:inline">Confirm </span>Booking
                            </button>
                            <button
                              onClick={() => handleBookingAction(booking.rideId, booking.id, 'cancel')}
                              disabled={loading}
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm sm:text-base font-medium transition-colors disabled:opacity-50"
                            >
                              <span className="hidden sm:inline">Reject </span>Booking
                            </button>
                          </div>
                        )}
                        
                        {booking.status === 'CONFIRMED' && (
                          <div className="flex flex-col sm:flex-row gap-2 mt-4">
                            <div className="bg-green-50 text-green-700 px-4 py-2 rounded text-sm sm:text-base font-medium text-center sm:text-left">
                              ✓ Booking Confirmed
                            </div>
                            <button
                              onClick={() => handleBookingAction(booking.rideId, booking.id, 'cancel')}
                              disabled={loading}
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm sm:text-base font-medium transition-colors disabled:opacity-50"
                            >
                              Cancel<span className="hidden sm:inline"> Booking</span>
                            </button>
                          </div>
                        )}
                        
                        {booking.status === 'CANCELLED' && (
                          <div className="bg-red-50 text-red-700 px-4 py-2 rounded text-sm sm:text-base font-medium mt-4 text-center sm:text-left">
                            ✗ Booking Cancelled
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Wallet Tab */}
            {activeTab === 'wallet' && (
              <DriverWallet driverId={user.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DriverDashboard