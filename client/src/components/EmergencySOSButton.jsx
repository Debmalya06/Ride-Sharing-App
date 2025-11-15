import React, { useState, useEffect } from 'react'
import {
  AlertTriangle,
  Phone,
  MapPin,
  Send,
  X,
  CheckCircle,
  Clock
} from 'lucide-react'
import apiService from '../services/api'
import { toast } from 'react-toastify'

const EmergencySOSButton = ({ user, ride = null }) => {
  const [showSOSModal, setShowSOSModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [location, setLocation] = useState(null)
  const [message, setMessage] = useState('')
  const [alertType, setAlertType] = useState('SOS')
  const [sosTriggered, setSOSTriggered] = useState(false)
  const [trackingLink, setTrackingLink] = useState('')

  // Get user's location
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      )
    })
  }

  useEffect(() => {
    if (showSOSModal) {
      getCurrentLocation()
        .then((loc) => setLocation(loc))
        .catch((error) => {
          console.error('Error getting location:', error)
          toast.error('Unable to get current location. Please enable location services.')
        })
    }
  }, [showSOSModal])

  const triggerSOS = async (type = 'SOS') => {
    try {
      setLoading(true)
      setAlertType(type)

      // Get current location
      let currentLocation = location
      if (!currentLocation) {
        try {
          currentLocation = await getCurrentLocation()
          setLocation(currentLocation)
        } catch (error) {
          toast.error('Unable to get location. Using default.')
          currentLocation = { latitude: 0, longitude: 0 }
        }
      }

      const sosData = {
        rideId: ride?.id || null,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        message: message || `Emergency ${type} alert triggered`,
        alertType: type
      }

      const response = await apiService.post('/emergency/sos', sosData)

      if (response.status === 'ALERT_TRIGGERED') {
        setSOSTriggered(true)
        setTrackingLink(response.trackingLink)
        
        const notifications = []
        if (response.emailSent) notifications.push('Email')
        if (response.smsSent) notifications.push('SMS')
        if (response.callInitiated) notifications.push('Voice Call')

        toast.success(
          `Emergency alert sent successfully! Notifications: ${notifications.join(', ') || 'Email'}`,
          { autoClose: 5000 }
        )
      } else {
        toast.error('Failed to send emergency alert')
      }
    } catch (error) {
      console.error('Error triggering SOS:', error)
      toast.error('Failed to send SOS alert. Please try again or call emergency services directly.')
    } finally {
      setLoading(false)
    }
  }

  const handleEmergencyCall = () => {
    triggerSOS('EMERGENCY_CALL')
  }

  const handleSOSButton = () => {
    triggerSOS('SOS')
  }

  return (
    <>
      {/* SOS Button - Always visible */}
      <button
        onClick={() => setShowSOSModal(true)}
        className="fixed bottom-6 right-6 z-50 bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-2xl transform hover:scale-110 transition-all duration-200 animate-pulse"
        title="Emergency SOS"
      >
        <AlertTriangle className="h-8 w-8" />
      </button>

      {/* SOS Modal */}
      {showSOSModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 relative">
            <button
              onClick={() => {
                setShowSOSModal(false)
                setSOSTriggered(false)
                setMessage('')
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>

            {!sosTriggered ? (
              <>
                <div className="text-center mb-6">
                  <div className="bg-red-100 rounded-full p-4 inline-block mb-4">
                    <AlertTriangle className="h-12 w-12 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Emergency SOS</h2>
                  <p className="text-gray-600">
                    Your emergency contacts will be notified with your location
                  </p>
                </div>

                {/* Location Status */}
                {location ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-green-600" />
                    <div className="text-sm">
                      <p className="font-medium text-green-900">Location acquired</p>
                      <p className="text-green-700 text-xs">
                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-600 animate-spin" />
                    <p className="text-sm text-yellow-800">Getting your location...</p>
                  </div>
                )}

                {/* Ride Info */}
                {ride && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm font-medium text-blue-900 mb-1">Active Ride</p>
                    <p className="text-xs text-blue-700">
                      {ride.source} → {ride.destination}
                    </p>
                  </div>
                )}

                {/* Message Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Optional Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe the emergency (optional)..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
                    rows="3"
                  />
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleSOSButton}
                    disabled={loading || !location}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Sending Alert...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        Send SOS Alert (Email + SMS)
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleEmergencyCall}
                    disabled={loading || !location}
                    className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Initiating Call...
                      </>
                    ) : (
                      <>
                        <Phone className="h-5 w-5" />
                        Emergency Call Alert
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-gray-500 text-center mt-4">
                  For immediate police/ambulance, call 100/108
                </p>
              </>
            ) : (
              <>
                {/* Success State */}
                <div className="text-center">
                  <div className="bg-green-100 rounded-full p-4 inline-block mb-4">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Alert Sent!</h2>
                  <p className="text-gray-600 mb-6">
                    Your emergency contacts have been notified
                  </p>

                  {trackingLink && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <p className="text-sm font-medium text-blue-900 mb-2">
                        Live Tracking Link (Valid for 1 hour)
                      </p>
                      <a
                        href={trackingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 break-all underline"
                      >
                        {trackingLink}
                      </a>
                    </div>
                  )}

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
                    <p className="text-sm font-medium text-yellow-900 mb-2">What happens next?</p>
                    <ul className="text-xs text-yellow-800 space-y-1">
                      <li>✓ Emergency contacts received SMS & Email</li>
                      <li>✓ Your location has been shared</li>
                      <li>✓ Primary contacts may receive a call</li>
                      <li>✓ Admin has been notified</li>
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      setShowSOSModal(false)
                      setSOSTriggered(false)
                      setMessage('')
                    }}
                    className="w-full mt-6 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default EmergencySOSButton
