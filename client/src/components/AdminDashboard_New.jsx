import { useState, useEffect } from 'react'
import { Users, Car, IndianRupee, TrendingUp, UserCheck, UserX, AlertTriangle, Eye, CheckCircle, XCircle, Trash2, RefreshCw, Search, Filter } from 'lucide-react'
import apiService from '../services/api'

const AdminDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview')
  
  // State for different data types
  const [allUsers, setAllUsers] = useState([])
  const [allDrivers, setAllDrivers] = useState([])
  const [pendingDrivers, setPendingDrivers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Filter states
  const [userSearch, setUserSearch] = useState('')
  const [userTypeFilter, setUserTypeFilter] = useState('all')
  const [driverStatusFilter, setDriverStatusFilter] = useState('all')

  // Stats state
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDrivers: 0,
    pendingVerifications: 0,
    totalRevenue: 0
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    switch (activeTab) {
      case 'users':
        fetchAllUsers()
        break
      case 'drivers':
        fetchAllDrivers()
        break
      case 'verifications':
        fetchPendingDrivers()
        break
      default:
        break
    }
  }, [activeTab])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // You can implement these stats endpoints in backend later
      setStats({
        totalUsers: 1234,
        totalDrivers: 456,
        pendingVerifications: 23,
        totalRevenue: 125000
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  // User Management Functions
  const fetchAllUsers = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await apiService.getAllUsers()
      console.log('All users response:', response)
      
      if (response && response.status === 'SUCCESS' && response.data) {
        setAllUsers(Array.isArray(response.data) ? response.data : [])
      } else if (response && Array.isArray(response)) {
        setAllUsers(response)
      } else {
        setAllUsers([])
        setError('No users found')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setError(`Error fetching users: ${error.message}`)
      setAllUsers([])
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      setLoading(true)
      await apiService.deleteUser(userId)
      await fetchAllUsers() // Refresh the list
      alert('User deleted successfully!')
    } catch (error) {
      console.error('Error deleting user:', error)
      alert(`Error deleting user: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Driver Management Functions
  const fetchAllDrivers = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await apiService.getAllDriverDetails()
      console.log('All drivers response:', response)
      
      if (response && response.status === 'SUCCESS' && response.data) {
        setAllDrivers(Array.isArray(response.data) ? response.data : [])
      } else if (response && Array.isArray(response)) {
        setAllDrivers(response)
      } else {
        setAllDrivers([])
        setError('No drivers found')
      }
    } catch (error) {
      console.error('Error fetching drivers:', error)
      setError(`Error fetching drivers: ${error.message}`)
      setAllDrivers([])
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingDrivers = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await apiService.getPendingDrivers()
      console.log('Pending drivers response:', response)
      
      if (response && response.status === 'SUCCESS' && response.data) {
        setPendingDrivers(Array.isArray(response.data) ? response.data : [])
      } else if (response && Array.isArray(response)) {
        setPendingDrivers(response)
      } else {
        setPendingDrivers([])
        setError('No pending verifications found')
      }
    } catch (error) {
      console.error('Error fetching pending drivers:', error)
      setError(`Error fetching pending drivers: ${error.message}`)
      setPendingDrivers([])
    } finally {
      setLoading(false)
    }
  }

  const verifyDriver = async (driverDetailId, verified) => {
    try {
      setLoading(true)
      
      if (verified) {
        await apiService.adminVerifyDriver(driverDetailId)
      } else {
        await apiService.adminRejectDriver(driverDetailId)
      }
      
      // Refresh the lists
      await fetchPendingDrivers()
      await fetchAllDrivers()
      
      alert(`Driver ${verified ? 'verified' : 'rejected'} successfully!`)
    } catch (error) {
      console.error('Error verifying driver:', error)
      alert(`Error ${verified ? 'verifying' : 'rejecting'} driver: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Filter functions
  const getFilteredUsers = () => {
    return allUsers.filter(user => {
      const matchesSearch = user.firstName?.toLowerCase().includes(userSearch.toLowerCase()) ||
                           user.lastName?.toLowerCase().includes(userSearch.toLowerCase()) ||
                           user.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
                           user.phoneNumber?.includes(userSearch)
      
      const matchesType = userTypeFilter === 'all' || user.role?.toLowerCase() === userTypeFilter.toLowerCase()
      
      return matchesSearch && matchesType
    })
  }

  const getFilteredDrivers = () => {
    return allDrivers.filter(driver => {
      const matchesStatus = driverStatusFilter === 'all' || 
                           (driverStatusFilter === 'verified' && driver.verified) ||
                           (driverStatusFilter === 'pending' && !driver.verified)
      
      return matchesStatus
    })
  }

  const renderOverviewTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-sm text-gray-600">New driver verification completed</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <p className="text-sm text-gray-600">5 new users registered today</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <p className="text-sm text-gray-600">Driver verification pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            <button
              onClick={() => setActiveTab('verifications')}
              className="w-full text-left px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">Review Pending Verifications</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className="w-full text-left px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-800">Manage Users</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('drivers')}
              className="w-full text-left px-4 py-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Car className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Manage Drivers</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderUsersTab = () => (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
          <button
            onClick={fetchAllUsers}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm font-medium flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Loading...' : 'Refresh'}</span>
          </button>
        </div>
        
        {/* Search and Filter */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={userTypeFilter}
            onChange={(e) => setUserTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="user">Passengers</option>
            <option value="driver">Drivers</option>
            <option value="admin">Admins</option>
          </select>
          <div className="text-sm text-gray-600 flex items-center">
            Total: {getFilteredUsers().length} users
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading users...</p>
          </div>
        ) : getFilteredUsers().length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verified</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {getFilteredUsers().map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">#{user.id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.phoneNumber}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.role === 'DRIVER' 
                          ? 'bg-green-100 text-green-800'
                          : user.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.phoneVerified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.phoneVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex space-x-2">
                        <button 
                          className="text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )

  const renderDriversTab = () => (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Driver Management</h3>
          <button
            onClick={fetchAllDrivers}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm font-medium flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Loading...' : 'Refresh'}</span>
          </button>
        </div>
        
        {/* Filter */}
        <div className="mt-4 flex items-center space-x-4">
          <select
            value={driverStatusFilter}
            onChange={(e) => setDriverStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Drivers</option>
            <option value="verified">Verified Only</option>
            <option value="pending">Pending Only</option>
          </select>
          <div className="text-sm text-gray-600">
            Total: {getFilteredDrivers().length} drivers
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading drivers...</p>
          </div>
        ) : getFilteredDrivers().length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Car className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No drivers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">License</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Insurance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {getFilteredDrivers().map((driver) => (
                  <tr key={driver.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">#{driver.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div>
                        <p className="font-medium">{driver.licenseNumber}</p>
                        <p className="text-xs text-gray-500">Exp: {driver.licenseExpiryDate}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div>
                        <p className="font-medium">{driver.carModel} ({driver.carYear})</p>
                        <p className="text-xs text-gray-500">{driver.carNumber} - {driver.carColor}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div>
                        <p className="font-medium">{driver.insuranceNumber}</p>
                        <p className="text-xs text-gray-500">Exp: {driver.insuranceExpiryDate}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        driver.verified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {driver.verified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex space-x-2">
                        {!driver.verified && (
                          <>
                            <button
                              onClick={() => verifyDriver(driver.id, true)}
                              disabled={loading}
                              className="text-green-600 hover:text-green-800 disabled:opacity-50"
                              title="Approve Driver"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => verifyDriver(driver.id, false)}
                              disabled={loading}
                              className="text-red-600 hover:text-red-800 disabled:opacity-50"
                              title="Reject Driver"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button 
                          className="text-blue-600 hover:text-blue-800" 
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )

  const renderVerificationsTab = () => (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Pending Driver Verifications</h3>
          <button
            onClick={fetchPendingDrivers}
            disabled={loading}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 text-sm font-medium flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Loading...' : 'Refresh'}</span>
          </button>
        </div>
      </div>
      
      <div className="p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading pending verifications...</p>
          </div>
        ) : pendingDrivers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No pending verifications</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pendingDrivers.map((driver) => (
              <div key={driver.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Driver #{driver.id}</h4>
                  <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                    Pending
                  </span>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">License Number</label>
                    <p className="text-sm text-gray-900">{driver.licenseNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">License Expiry</label>
                    <p className="text-sm text-gray-900">{driver.licenseExpiryDate}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Vehicle</label>
                    <p className="text-sm text-gray-900">{driver.carModel} ({driver.carYear}) - {driver.carColor}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Car Number</label>
                    <p className="text-sm text-gray-900">{driver.carNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Insurance</label>
                    <p className="text-sm text-gray-900">{driver.insuranceNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Insurance Expiry</label>
                    <p className="text-sm text-gray-900">{driver.insuranceExpiryDate}</p>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => verifyDriver(driver.id, true)}
                    disabled={loading}
                    className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => verifyDriver(driver.id, false)}
                    disabled={loading}
                    className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user?.firstName || 'Admin'}!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
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
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {['overview', 'users', 'drivers', 'verifications'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'users' && renderUsersTab()}
        {activeTab === 'drivers' && renderDriversTab()}
        {activeTab === 'verifications' && renderVerificationsTab()}
      </div>
    </div>
  )
}

export default AdminDashboard