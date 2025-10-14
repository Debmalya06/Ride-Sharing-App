// API Configuration
const API_BASE_URL = 'http://localhost:8080/api'

// API Service Class
class ApiService {
  constructor() {
    this.token = localStorage.getItem('token')
  }

  // Set authentication token
  setToken(token) {
    this.token = token
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }

  // Get authorization headers
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }
    return headers
  }

  // Generic API call method
  async apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    
    // Update token from localStorage before each call
    this.token = localStorage.getItem('token')
    
    const config = {
      headers: this.getAuthHeaders(),
      ...options,
    }

    console.log('Making API call to:', url, 'with config:', config)
    console.log('Current token from localStorage:', this.token)
    console.log('Authorization header:', config.headers['Authorization'])

    try {
      const response = await fetch(url, config)
      
      console.log('Response status:', response.status, response.statusText)
      
      // Check if response has content
      const contentType = response.headers.get('content-type')
      let data = null
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json()
        } catch (jsonError) {
          console.error('JSON parsing error:', jsonError)
          data = { message: 'Invalid response format' }
        }
      } else {
        // Handle plain text responses
        const textResponse = await response.text()
        console.log('Text response:', textResponse)
        data = { 
          message: textResponse,
          status: response.ok ? 'SUCCESS' : 'ERROR'
        }
      }
      
      console.log('Parsed response data:', data)
      
      if (!response.ok) {
        throw new Error(data.message || data || `HTTP error! status: ${response.status}`)
      }
      
      return data
    } catch (error) {
      console.error('API call failed:', error)
      throw error
    }
  }

  // Test backend connection
  async testConnection() {
    try {
      const response = await fetch(`${API_BASE_URL}/test`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      return {
        status: response.status,
        ok: response.ok,
        message: response.ok ? 'Connected' : 'Connection failed'
      }
    } catch (error) {
      console.error('Connection test failed:', error)
      return {
        status: 0,
        ok: false,
        message: error.message || 'Backend not accessible'
      }
    }
  }

  // Auth endpoints
  async register(userData) {
    // Split the name into first and last name
    const nameParts = userData.name.trim().split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    const registrationData = {
      firstName: firstName,
      lastName: lastName,
      phoneNumber: userData.phone,
      email: userData.email, // Use the actual email from the form
      password: userData.password,
      role: userData.userType === 'passenger' ? 'USER' : 'DRIVER' // Map frontend types to backend roles
    }

    console.log('Sending registration data to backend:', registrationData)

    // Don't include driver details in initial registration - they're handled separately
    return this.apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(registrationData)
    })
  }

  async verifyOtp(phoneNumber, otp) {
    return this.apiCall('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({
        phoneNumber,
        otp
      })
    })
  }

  async resendOtp(phoneNumber) {
    return this.apiCall(`/auth/resend-otp?phoneNumber=${phoneNumber}`, {
      method: 'POST'
    })
  }

  async login(phoneNumber, password) {
    return this.apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        phoneNumber,
        password
      })
    })
  }

  async adminLogin(email, password) {
    return this.apiCall('/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password
      })
    })
  }

  // User endpoints
  async getUserProfile() {
    return this.apiCall('/users/profile')
  }

  async updateUserProfile(profileData) {
    return this.apiCall('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    })
  }

  async getAllUsers() {
    return this.apiCall('/users/all')
  }

  async deleteUser(userId) {
    return this.apiCall(`/users/${userId}`, {
      method: 'DELETE'
    })
  }

  // Driver endpoints
  async addDriverDetails(driverDetails) {
    return this.apiCall('/driver/details', {
      method: 'POST',
      body: JSON.stringify(driverDetails)
    })
  }

  async getDriverDetails() {
    return this.apiCall('/driver/details')
  }

  async updateDriverDetails(driverDetails) {
    return this.apiCall('/driver/details', {
      method: 'PUT',
      body: JSON.stringify(driverDetails)
    })
  }

  // Ride endpoints
  async postRide(rideData) {
    // Combine date and time into LocalDateTime format
    const departureDateTime = `${rideData.date}T${rideData.time}:00`
    
    return this.apiCall('/rides', {
      method: 'POST',
      body: JSON.stringify({
        source: rideData.from,
        destination: rideData.to,
        departureDate: departureDateTime,
        availableSeats: parseInt(rideData.seats),
        pricePerSeat: parseFloat(rideData.price),
        notes: rideData.notes || ''
      })
    })
  }

  async getMyRides() {
    return this.apiCall('/rides/my-rides')
  }

  async getMyUpcomingRides() {
    return this.apiCall('/rides/my-rides/upcoming')
  }

  // Update the searchRides method
  async searchRides(searchParams) {
    const payload = {
      source: searchParams.from || searchParams.source || '',
      destination: searchParams.to || searchParams.destination || '',
      departureDate: searchParams.date ? `${searchParams.date}T00:00:00` : '',
      maxPrice: searchParams.maxPrice ? parseFloat(searchParams.maxPrice) : null
    }
    
    console.log('Sending search request:', payload)
    
    return this.apiCall('/rides/search', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  }

  async getAllAvailableRides() {
    // Get all available rides without filters
    return this.apiCall('/rides/search', {
      method: 'POST',
      body: JSON.stringify({})
    })
  }

  async getRideById(rideId) {
    return this.apiCall(`/rides/${rideId}`)
  }

  async getRideBookings(rideId) {
    return this.apiCall(`/rides/${rideId}/bookings`)
  }

  async updateRideStatus(rideId, status) {
    return this.apiCall(`/rides/${rideId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    })
  }

  async deleteRide(rideId) {
    return this.apiCall(`/rides/${rideId}`, {
      method: 'DELETE'
    })
  }

  // Calculate fare based on distance
  async calculateFare(source, destination) {
    const payload = {
      source: source,
      destination: destination
    }
    
    console.log('Calculating fare for route:', payload)
    
    return this.apiCall('/rides/calculate-fare', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  }

  // Booking endpoints
  async createBooking(rideId, seatsToBook) {
    console.log('Creating booking for ride:', rideId, 'seats:', seatsToBook)
    
    return this.apiCall(`/rides/${rideId}/booking?seatsToBook=${seatsToBook}`, {
      method: 'POST'
    })
  }

  async bookRide(rideId, seatsBooked, passengerName, passengerPhone, pickupPoint) {
    const payload = {
      rideId: rideId,
      seatsBooked: seatsBooked,
      passengerName: passengerName || "Passenger", // Use actual passenger name if available
      passengerPhone: passengerPhone || "0000000000", // Use actual passenger phone if available
      pickupPoint: pickupPoint || "Default pickup point" // Use actual pickup point if available
    }
    
    console.log('Booking ride:', payload)
    
    return this.apiCall('/bookings', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  }

  async getMyBookings() {
    return this.apiCall('/bookings/my-bookings')
  }

  async getMyUpcomingBookings() {
    return this.apiCall('/bookings/my-bookings/upcoming')
  }

  async cancelBooking(bookingId) {
    return this.apiCall(`/bookings/${bookingId}/cancel`, {
      method: 'PUT'
    })
  }

  async getDriverBookings() {
    return this.apiCall('/bookings/driver-bookings')
  }

  // Ride management endpoints for drivers
  async cancelRide(rideId) {
    return this.apiCall(`/rides/${rideId}/cancel`, {
      method: 'PUT'
    })
  }

  async completeRide(rideId) {
    return this.apiCall(`/rides/${rideId}/complete`, {
      method: 'PUT'
    })
  }

  async activateRide(rideId) {
    return this.apiCall(`/rides/${rideId}/activate`, {
      method: 'PUT'
    })
  }

  // Booking management endpoints for drivers
  async confirmBooking(rideId, bookingId) {
    return this.apiCall(`/rides/${rideId}/bookings/${bookingId}/confirm`, {
      method: 'PUT'
    })
  }

  async cancelBookingByDriver(rideId, bookingId) {
    return this.apiCall(`/rides/${rideId}/bookings/${bookingId}/cancel`, {
      method: 'PUT'
    })
  }

  async getRideBookings(rideId) {
    return this.apiCall(`/rides/${rideId}/bookings`)
  }

  // Admin endpoints
  async getAdminProfile() {
    return this.apiCall('/admin/profile')
  }

  // Get all pending driver details for admin verification
  async getPendingDrivers() {
    return this.apiCall('/admin/drivers/pending')
  }

  // Get all driver details for admin
  async getAllDriverDetails() {
    return this.apiCall('/admin/drivers')
  }

  // Verify driver details
  async verifyDriver(driverDetailId, verified) {
    return this.apiCall(`/driver/verify/${driverDetailId}?verified=${verified}`, {
      method: 'PUT'
    })
  }

  // Admin: Get all users
  async getAllUsers() {
    return this.apiCall('/admin/users')
  }

  // Admin: Get user by ID
  async getUserById(userId) {
    return this.apiCall(`/admin/users/${userId}`)
  }

  // Admin: Delete user
  async deleteUser(userId) {
    return this.apiCall(`/admin/users/${userId}`, {
      method: 'DELETE'
    })
  }

  // Admin: Verify driver (alternative endpoint from Postman)
  async adminVerifyDriver(driverDetailId) {
    return this.apiCall(`/admin/drivers/${driverDetailId}/verify`, {
      method: 'PUT'
    })
  }

  // Admin: Reject driver verification
  async adminRejectDriver(driverDetailId) {
    return this.apiCall(`/admin/drivers/${driverDetailId}/reject`, {
      method: 'PUT'
    })
  }

  // ===================
  // PAYMENT ENDPOINTS
  // ===================

  // Create payment order for booking
  async createPaymentOrder(paymentRequest) {
    return this.apiCall('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify(paymentRequest)
    })
  }

  // Verify payment signature
  async verifyPayment(paymentData) {
    return this.apiCall('/payments/verify', {
      method: 'POST',
      body: JSON.stringify({
        razorpayOrderId: paymentData.razorpay_order_id,
        razorpayPaymentId: paymentData.razorpay_payment_id,
        razorpaySignature: paymentData.razorpay_signature,
        paymentMethod: paymentData.paymentMethod,
        gatewayResponse: JSON.stringify(paymentData)
      })
    })
  }

  // Handle payment failure
  async handlePaymentFailure(failureData) {
    return this.apiCall('/payments/failure', {
      method: 'POST',
      body: JSON.stringify(failureData)
    })
  }

  // Get passenger payment history
  async getPassengerPaymentHistory(passengerId) {
    return this.apiCall(`/payments/history/passenger/${passengerId}`)
  }

  // Get driver payment history (earnings)
  async getDriverPaymentHistory(driverId) {
    return this.apiCall(`/payments/history/driver/${driverId}`)
  }

  // Get payment history by date range
  async getPaymentHistoryByDateRange(userId, isDriver, startDate, endDate) {
    const params = new URLSearchParams({
      isDriver: isDriver.toString(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    })
    return this.apiCall(`/payments/history/${userId}?${params.toString()}`)
  }

  // Release payment to driver
  async releasePaymentToDriver(bookingId) {
    return this.apiCall(`/payments/release/${bookingId}`, {
      method: 'POST'
    })
  }

  // Get driver total earnings
  async getDriverTotalEarnings(driverId) {
    return this.apiCall(`/payments/earnings/${driverId}`)
  }

  // Get passenger total spending
  async getPassengerTotalSpending(passengerId) {
    return this.apiCall(`/payments/spending/${passengerId}`)
  }
}

// Create and export a singleton instance
const apiService = new ApiService()
export default apiService