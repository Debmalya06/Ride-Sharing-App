import { useState, useEffect } from 'react'
import { Users, Car, IndianRupee, TrendingUp, UserCheck, UserX, AlertTriangle, Eye, CheckCircle, XCircle } from 'lucide-react'
import ApiService from '../services/api'

const AdminDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [users] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', type: 'passenger', status: 'active', joinDate: '2024-01-01' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', type: 'driver', status: 'active', joinDate: '2024-01-02' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', type: 'passenger', status: 'suspended', joinDate: '2024-01-03' }
  ])
  const [rides] = useState([
    { id: 1, driver: 'Jane Smith', from: 'Mumbai', to: 'Pune', date: '2024-01-15', passengers: 3, status: 'active', revenue: 1350 },
    { id: 2, driver: 'Mike Wilson', from: 'Delhi', to: 'Jaipur', date: '2024-01-16', passengers: 2, status: 'completed', revenue: 1200 }
  ])
  
  const [allDrivers, setAllDrivers] = useState([])
  const [pendingDrivers, setPendingDrivers] = useState([])
  const [loading, setLoading] = useState(false)
  const [showPendingOnly, setShowPendingOnly] = useState(false)

  useEffect(() => {
    if (activeTab === 'drivers') {
      fetchAllDrivers()
    }
  }, [activeTab])

  const fetchAllDrivers = async () => {
    try {
      setLoading(true)
      const response = await ApiService.getAllDriverDetails()
      if (response && response.data) {
        setAllDrivers(response.data)
      } else if (response && Array.isArray(response)) {
        setAllDrivers(response)
      } else {
        setAllDrivers([])
      }
    } catch (error) {
      console.error('Error fetching drivers:', error)
      alert(`Error fetching drivers: ${error.response?.data?.message || error.message}`)
      setAllDrivers([])
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingDrivers = async () => {
    try {
      setLoading(true)
      const response = await ApiService.getPendingDrivers()
      if (response && response.data) {
        setPendingDrivers(response.data)
      } else if (response && Array.isArray(response)) {
        setPendingDrivers(response)
      } else {
        setPendingDrivers([])
      }
    } catch (error) {
      console.error('Error fetching pending drivers:', error)
      alert(`Error fetching pending drivers: ${error.response?.data?.message || error.message}`)
      setPendingDrivers([])
    } finally {
      setLoading(false)
    }
  }

  const verifyDriver = async (driverDetailId, verified) => {
    try {
      setLoading(true)
      await ApiService.verifyDriver(driverDetailId, verified)
      // Refresh the driver list
      fetchAllDrivers()
      alert(`Driver ${verified ? 'approved' : 'rejected'} successfully!`)
    } catch (error) {
      console.error('Error verifying driver:', error)
      alert(`Error ${verified ? 'approving' : 'rejecting'} driver: ${error.response?.data?.message || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user.name}!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">1,234</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Car className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Rides</p>
                <p className="text-2xl font-bold text-gray-900">89</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <IndianRupee className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹2,45,600</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Growth</p>
                <p className="text-2xl font-bold text-gray-900">+23%</p>
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
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                User Management
              </button>
              <button
                onClick={() => setActiveTab('drivers')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'drivers'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Driver Verification
              </button>
              <button
                onClick={() => setActiveTab('rides')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'rides'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Ride Management
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reports'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Reports
              </button>
            </nav>
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
      </div>
    </div>
  )
}

export default AdminDashboard