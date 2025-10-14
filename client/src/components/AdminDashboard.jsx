import { useState, useEffect } from 'react'
import { Users, Car, IndianRupee, TrendingUp, UserCheck, UserX, AlertTriangle, Eye, CheckCircle, XCircle, Trash2, RefreshCw, Shield, UserPlus } from 'lucide-react'
import apiService from '../services/api'

const AdminDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview')
  
  // Real data from APIs
  const [allUsers, setAllUsers] = useState([])
  const [allDrivers, setAllDrivers] = useState([])
  const [pendingDrivers, setPendingDrivers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // UI states
  const [showPendingOnly, setShowPendingOnly] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserModal, setShowUserModal] = useState(false)

  // Stats data
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDrivers: 0,
    pendingVerifications: 0,
    totalRevenue: 0
  })

  useEffect(() => {
    // Ensure the API service has the latest token from localStorage
    const token = localStorage.getItem('token')
    console.log('AdminDashboard loaded with token:', token)
    if (token) {
      apiService.setToken(token)
    }
    
    // Fetch initial data on component mount
    fetchAllData()
  }, [])

  useEffect(() => {
    // Fetch specific data based on active tab
    switch (activeTab) {
      case 'users':
        fetchAllUsers()
        break
      case 'drivers':
        fetchAllDrivers()
        break
      case 'pending':
        fetchPendingDrivers()
        break
      default:
        break
    }
  }, [activeTab])

  // Fetch all data for overview
  const fetchAllData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Ensure API service has latest token before making admin calls
      const token = localStorage.getItem('token')
      console.log('fetchAllData - ensuring token is set:', token)
      if (token) {
        apiService.setToken(token)
      } else {
        setError('No authentication token found. Please login again.')
        return
      }
      
      await Promise.all([
        fetchAllUsers(),
        fetchAllDrivers(),
        fetchPendingDrivers()
      ])
      
      updateStats()
    } catch (error) {
      console.error('Error fetching admin data:', error)
      setError('Failed to load admin data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Fetch all users
  const fetchAllUsers = async () => {
    try {
      console.log('Fetching all users...')
      console.log('Current token:', localStorage.getItem('token'))
      
      const response = await apiService.getAllUsers()
      console.log('Users response:', response)
      console.log('Response type:', typeof response)
      console.log('Response status:', response?.status)
      console.log('Response data:', response?.data)
      
      if (response && response.status === 'SUCCESS' && response.data) {
        setAllUsers(Array.isArray(response.data) ? response.data : [])
        console.log('Set users from response.data:', response.data)
      } else if (response && Array.isArray(response)) {
        setAllUsers(response)
        console.log('Set users from direct array:', response)
      } else {
        setAllUsers([])
        console.log('No users found or invalid response format:', response)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      console.error('Error stack:', error.stack)
      setError('Failed to fetch users: ' + error.message)
      setAllUsers([])
    }
  }

  // Fetch all drivers
  const fetchAllDrivers = async () => {
    try {
      console.log('Fetching all drivers...')
      console.log('Current token:', localStorage.getItem('token'))
      setLoading(true)
      
      const response = await apiService.getAllDriverDetails()
      console.log('Drivers response:', response)
      console.log('Response type:', typeof response)
      console.log('Response status:', response?.status)
      console.log('Response data:', response?.data)
      
      if (response && response.status === 'SUCCESS' && response.data) {
        setAllDrivers(Array.isArray(response.data) ? response.data : [])
        console.log('Set drivers from response.data:', response.data)
      } else if (response && Array.isArray(response)) {
        setAllDrivers(response)
        console.log('Set drivers from direct array:', response)
      } else {
        setAllDrivers([])
        console.log('No drivers found or invalid response format:', response)
      }
    } catch (error) {
      console.error('Error fetching drivers:', error)
      console.error('Error stack:', error.stack)
      setError('Failed to fetch drivers: ' + error.message)
      setAllDrivers([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch pending drivers
  const fetchPendingDrivers = async () => {
    try {
      console.log('Fetching pending drivers...')
      console.log('Current token:', localStorage.getItem('token'))
      setLoading(true)
      
      const response = await apiService.getPendingDrivers()
      console.log('Pending drivers response:', response)
      console.log('Response type:', typeof response)
      console.log('Response status:', response?.status)
      console.log('Response data:', response?.data)
      
      if (response && response.status === 'SUCCESS' && response.data) {
        setPendingDrivers(Array.isArray(response.data) ? response.data : [])
        console.log('Set pending drivers from response.data:', response.data)
      } else if (response && Array.isArray(response)) {
        setPendingDrivers(response)
        console.log('Set pending drivers from direct array:', response)
      } else {
        setPendingDrivers([])
        console.log('No pending drivers found or invalid response format:', response)
      }
    } catch (error) {
      console.error('Error fetching pending drivers:', error)
      console.error('Error stack:', error.stack)
      setError('Failed to fetch pending drivers: ' + error.message)
      setPendingDrivers([])
    } finally {
      setLoading(false)
    }
  }

  // Update stats based on fetched data
  const updateStats = () => {
    setStats({
      totalUsers: allUsers.length,
      totalDrivers: allDrivers.length,
      pendingVerifications: pendingDrivers.length,
      totalRevenue: 50000 // This would come from a real API
    })
  }

  // Verify driver
  const handleVerifyDriver = async (driverDetailId) => {
    try {
      console.log('Verifying driver:', driverDetailId)
      const response = await apiService.adminVerifyDriver(driverDetailId)
      console.log('Verify driver response:', response)
      
      if (response && (response.status === 'SUCCESS' || response.success)) {
        alert('Driver verified successfully!')
        // Refresh data
        await fetchPendingDrivers()
        await fetchAllDrivers()
        updateStats()
      } else {
        alert('Failed to verify driver: ' + (response?.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error verifying driver:', error)
      alert('Error verifying driver: ' + (error.message || 'Unknown error'))
    }
  }

  // Reject driver
  const handleRejectDriver = async (driverDetailId) => {
    if (!window.confirm('Are you sure you want to reject this driver?')) {
      return
    }
    
    try {
      console.log('Rejecting driver:', driverDetailId)
      const response = await apiService.adminRejectDriver(driverDetailId)
      console.log('Reject driver response:', response)
      
      if (response && (response.status === 'SUCCESS' || response.success)) {
        alert('Driver rejected successfully!')
        // Refresh data
        await fetchPendingDrivers()
        await fetchAllDrivers()
        updateStats()
      } else {
        alert('Failed to reject driver: ' + (response?.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error rejecting driver:', error)
      alert('Error rejecting driver: ' + (error.message || 'Unknown error'))
    }
  }

  // Delete user
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }
    
    try {
      console.log('Deleting user:', userId)
      const response = await apiService.deleteUser(userId)
      console.log('Delete user response:', response)
      
      if (response && (response.status === 'SUCCESS' || response.success)) {
        alert('User deleted successfully!')
        // Refresh users data
        await fetchAllUsers()
        updateStats()
      } else {
        alert('Failed to delete user: ' + (response?.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Error deleting user: ' + (error.message || 'Unknown error'))
    }
  }

  // View user details
  const handleViewUser = async (userId) => {
    try {
      console.log('Fetching user details:', userId)
      const response = await apiService.getUserById(userId)
      console.log('User details response:', response)
      
      if (response && response.status === 'SUCCESS' && response.data) {
        setSelectedUser(response.data)
        setShowUserModal(true)
      } else {
        alert('Failed to fetch user details')
      }
    } catch (error) {
      console.error('Error fetching user details:', error)
      alert('Error fetching user details: ' + (error.message || 'Unknown error'))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user?.name || user?.firstName || 'Admin'}!</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
              <button 
                onClick={() => setError('')}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Car className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Drivers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDrivers}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Verifications</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingVerifications}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <IndianRupee className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Platform Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <TrendingUp className="h-4 w-4 inline mr-2" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="h-4 w-4 inline mr-2" />
                All Users ({allUsers.length})
              </button>
              <button
                onClick={() => setActiveTab('drivers')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'drivers'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Car className="h-4 w-4 inline mr-2" />
                All Drivers ({allDrivers.length})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-4 px-1 border-b-2 font-medium text-sm relative ${
                  activeTab === 'pending'
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Shield className="h-4 w-4 inline mr-2" />
                Pending Verifications ({pendingDrivers.length})
                {pendingDrivers.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs px-1.5 py-0.5">
                    {pendingDrivers.length}
                  </span>
                )}
              </button>
            </nav>
            
            {/* Refresh Button */}
            <div className="absolute top-4 right-6">
              <button
                onClick={fetchAllData}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Loading...' : 'Refresh Data'}</span>
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="bg-green-100 p-2 rounded-full">
                          <UserCheck className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">New user registered</p>
                          <p className="text-sm text-gray-500">John Doe joined as passenger</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">2 hours ago</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="bg-yellow-100 p-2 rounded-full">
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Ride reported</p>
                          <p className="text-sm text-gray-500">Issue reported for ride #1234</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">4 hours ago</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 rounded-lg p-6">
                      <h4 className="font-medium text-blue-900">Users This Week</h4>
                      <p className="text-2xl font-bold text-blue-600">+47</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-6">
                      <h4 className="font-medium text-green-900">Rides Completed</h4>
                      <p className="text-2xl font-bold text-green-600">156</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-6">
                      <h4 className="font-medium text-yellow-900">Revenue This Week</h4>
                      <p className="text-2xl font-bold text-yellow-600">₹45,600</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">User Management</h3>
                  <div className="flex space-x-2">
                    <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                      Export Users
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Join Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.type === 'driver' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {user.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.joinDate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                              <Eye className="h-4 w-4" />
                            </button>
                            {user.status === 'active' ? (
                              <button className="text-red-600 hover:text-red-900">
                                <UserX className="h-4 w-4" />
                              </button>
                            ) : (
                              <button className="text-green-600 hover:text-green-900">
                                <UserCheck className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'drivers' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Driver Verification</h3>
                  <div className="flex space-x-2">
                    <button 
                      onClick={fetchAllDrivers}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      Refresh
                    </button>
                    <button 
                      onClick={() => setShowPendingOnly(!showPendingOnly)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        showPendingOnly 
                          ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                          : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                      }`}
                    >
                      {showPendingOnly ? 'Show All' : 'Show Pending Only'}
                    </button>
                  </div>
                </div>
                
                {loading ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading drivers...</p>
                  </div>
                ) : (showPendingOnly ? allDrivers.filter(driver => !driver.isVerified) : allDrivers).length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No drivers found</p>
                    <p className="text-sm text-gray-400 mt-2">Driver registrations will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(showPendingOnly ? allDrivers.filter(driver => !driver.isVerified) : allDrivers).map((driver) => (
                      <div key={driver.id} className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <h4 className="text-lg font-medium text-gray-900 mr-3">
                                {driver.firstName} {driver.lastName}
                              </h4>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                driver.isVerified 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {driver.isVerified ? 'Verified' : 'Pending'}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">License Number:</span>
                                <span className="ml-2 font-medium">{driver.licenseNumber}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Car Number:</span>
                                <span className="ml-2 font-medium">{driver.carNumber}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Car Model:</span>
                                <span className="ml-2 font-medium">{driver.carModel}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Car Color:</span>
                                <span className="ml-2 font-medium">{driver.carColor}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Car Year:</span>
                                <span className="ml-2 font-medium">{driver.carYear}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Insurance:</span>
                                <span className="ml-2 font-medium">{driver.insuranceNumber}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Phone:</span>
                                <span className="ml-2 font-medium">{driver.user?.phoneNumber}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Email:</span>
                                <span className="ml-2 font-medium">{driver.user?.email}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">License Expiry:</span>
                                <span className="ml-2 font-medium">{driver.licenseExpiryDate}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            {!driver.isVerified ? (
                              <>
                                <button
                                  onClick={() => verifyDriver(driver.id, true)}
                                  disabled={loading}
                                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-1"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => verifyDriver(driver.id, false)}
                                  disabled={loading}
                                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-1"
                                >
                                  <XCircle className="h-4 w-4" />
                                  <span>Reject</span>
                                </button>
                              </>
                            ) : (
                              <div className="flex items-center text-green-600">
                                <CheckCircle className="h-5 w-5 mr-1" />
                                <span className="text-sm font-medium">Verified</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'rides' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Ride Management</h3>
                  <div className="flex space-x-2">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                      Export Rides
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  {rides.map((ride) => (
                    <div key={ride.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {ride.from} → {ride.to}
                          </h4>
                          <p className="text-sm text-gray-500">Driver: {ride.driver}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            ride.status === 'active' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {ride.status}
                          </span>
                          <p className="text-lg font-bold text-gray-900 mt-1">₹{ride.revenue}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Date:</span>
                          <span className="ml-2 font-medium">{ride.date}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Passengers:</span>
                          <span className="ml-2 font-medium">{ride.passengers}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Revenue:</span>
                          <span className="ml-2 font-medium">₹{ride.revenue}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Reports & Analytics</h3>
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Analytics dashboard coming soon</p>
                  <p className="text-sm text-gray-400 mt-2">Detailed reports and insights will be available here</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Details Modal */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">User Details</h3>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Name:</span>
                    <p className="text-sm text-gray-900">{selectedUser.firstName} {selectedUser.lastName}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Email:</span>
                    <p className="text-sm text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Phone:</span>
                    <p className="text-sm text-gray-900">{selectedUser.phoneNumber}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Role:</span>
                    <p className="text-sm text-gray-900">{selectedUser.role}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Status:</span>
                    <p className="text-sm text-gray-900">{selectedUser.isActive ? 'Active' : 'Inactive'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Joined:</span>
                    <p className="text-sm text-gray-900">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteUser(selectedUser.id)
                      setShowUserModal(false)
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Delete User
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard