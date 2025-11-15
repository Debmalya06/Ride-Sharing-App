import React, { useState, useEffect } from 'react'
import {
  AlertTriangle,
  MapPin,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
  User,
  Car,
  Calendar
} from 'lucide-react'
import apiService from '../services/api'
import { useToast } from './ToastContext'

const EmergencyAlertsDashboard = () => {
  const [activeAlerts, setActiveAlerts] = useState([])
  const [recentAlerts, setRecentAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('active') // 'active', 'recent'
  const [autoRefresh, setAutoRefresh] = useState(true)
  const toast = useToast()

  useEffect(() => {
    fetchAlerts()
    
    // Auto-refresh every 30 seconds if enabled
    let interval
    if (autoRefresh) {
      interval = setInterval(fetchAlerts, 30000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [filter, autoRefresh])

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      
      if (filter === 'active') {
        const response = await apiService.get('/emergency/alerts/active')
        setActiveAlerts(response)
      } else {
        const response = await apiService.get('/emergency/alerts/recent?hours=24')
        setRecentAlerts(response)
      }
    } catch (error) {
      console.error('Error fetching emergency alerts:', error)
      toast.error('Failed to load emergency alerts')
    } finally {
      setLoading(false)
    }
  }

  const resolveAlert = async (alertId, status = 'RESOLVED') => {
    try {
      await apiService.post(`/emergency/alerts/${alertId}/resolve?status=${status}`)
      toast.success(`Alert marked as ${status.toLowerCase()}`)
      fetchAlerts()
    } catch (error) {
      console.error('Error resolving alert:', error)
      toast.error('Failed to update alert status')
    }
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getAlertTypeColor = (type) => {
    switch (type) {
      case 'SOS':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'EMERGENCY_CALL':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'PANIC_BUTTON':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-red-100 text-red-800'
      case 'RESOLVED':
        return 'bg-green-100 text-green-800'
      case 'FALSE_ALARM':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const alerts = filter === 'active' ? activeAlerts : recentAlerts

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                Emergency Alerts Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Monitor and manage emergency SOS alerts</p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={fetchAlerts}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  autoRefresh
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                Auto-Refresh: {autoRefresh ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setFilter('active')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                filter === 'active'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Active Alerts ({activeAlerts.length})
            </button>
            <button
              onClick={() => setFilter('recent')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                filter === 'recent'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Recent (24h)
            </button>
          </div>
        </div>

        {/* Alerts List */}
        {loading && alerts.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filter === 'active' ? 'No Active Alerts' : 'No Recent Alerts'}
            </h3>
            <p className="text-gray-600">
              {filter === 'active'
                ? 'All clear! There are no active emergency alerts at the moment.'
                : 'No emergency alerts in the last 24 hours.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-white rounded-lg shadow-md overflow-hidden border-l-4 ${
                  alert.status === 'ACTIVE' ? 'border-red-600' : 'border-gray-400'
                }`}
              >
                <div className="p-6">
                  {/* Alert Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getAlertTypeColor(
                            alert.alertType
                          )}`}
                        >
                          {alert.alertType.replace('_', ' ')}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            alert.status
                          )}`}
                        >
                          {alert.status}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Alert #{alert.id}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <Clock className="h-4 w-4" />
                        {formatDateTime(alert.createdAt)}
                      </p>
                    </div>

                    {alert.status === 'ACTIVE' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => resolveAlert(alert.id, 'RESOLVED')}
                          className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Resolve
                        </button>
                        <button
                          onClick={() => resolveAlert(alert.id, 'FALSE_ALARM')}
                          className="flex items-center gap-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
                        >
                          <XCircle className="h-4 w-4" />
                          False Alarm
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Alert Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* User Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        User Information
                      </h4>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-medium">Name:</span> {alert.user?.name || 'N/A'}
                        </p>
                        <p className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {alert.user?.phoneNumber || 'N/A'}
                        </p>
                        <p className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {alert.user?.email || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Location Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p className="text-xs text-gray-600 break-all">
                          {alert.latitude?.toFixed(6)}, {alert.longitude?.toFixed(6)}
                        </p>
                        <div className="flex gap-2">
                          <a
                            href={alert.googleMapsLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Google Maps
                          </a>
                          <a
                            href={alert.trackingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs transition-colors"
                          >
                            <MapPin className="h-3 w-3" />
                            Live Track
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Ride Info */}
                    {alert.ride && (
                      <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <Car className="h-4 w-4" />
                          Active Ride Details
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <p>
                            <span className="font-medium">From:</span> {alert.ride.source}
                          </p>
                          <p>
                            <span className="font-medium">To:</span> {alert.ride.destination}
                          </p>
                          <p>
                            <span className="font-medium">Status:</span> {alert.ride.status}
                          </p>
                          <p>
                            <span className="font-medium">Driver:</span>{' '}
                            {alert.ride.driver?.name || 'N/A'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Message */}
                    {alert.message && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 md:col-span-2">
                        <h4 className="font-semibold text-yellow-900 mb-2">Emergency Message</h4>
                        <p className="text-sm text-yellow-800">{alert.message}</p>
                      </div>
                    )}

                    {/* Resolution Info */}
                    {alert.status !== 'ACTIVE' && alert.resolvedAt && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 md:col-span-2">
                        <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Resolution Details
                        </h4>
                        <p className="text-sm text-green-800">
                          Resolved on {formatDateTime(alert.resolvedAt)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default EmergencyAlertsDashboard
