import React, { useState, useEffect } from 'react'
import {
  AlertTriangle,
  Phone,
  MapPin,
  Plus,
  Trash2,
  Save,
  X,
  Shield,
  Users as UsersIcon
} from 'lucide-react'
import apiService from '../services/api'
import { toast } from 'react-toastify'

const EmergencyContacts = ({ user }) => {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    relationship: '',
    isPrimary: false
  })

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const response = await apiService.get('/emergency/contacts')
      setContacts(response || [])
    } catch (error) {
      console.error('Error fetching contacts:', error)
      toast.error('Failed to load emergency contacts')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await apiService.post('/emergency/contacts', formData)
      toast.success('Emergency contact added successfully')
      setShowAddForm(false)
      setFormData({
        contactName: '',
        contactPhone: '',
        contactEmail: '',
        relationship: '',
        isPrimary: false
      })
      fetchContacts()
    } catch (error) {
      console.error('Error adding contact:', error)
      toast.error('Failed to add emergency contact')
    }
  }

  const handleDelete = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this emergency contact?')) {
      return
    }
    
    try {
      await apiService.delete(`/emergency/contacts/${contactId}`)
      toast.success('Emergency contact deleted')
      fetchContacts()
    } catch (error) {
      console.error('Error deleting contact:', error)
      toast.error('Failed to delete contact')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-yellow-500" />
            Emergency Contacts
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your emergency contacts who will be notified in case of SOS
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 justify-center"
        >
          {showAddForm ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          {showAddForm ? 'Cancel' : 'Add Contact'}
        </button>
      </div>

      {/* Add Contact Form */}
      {showAddForm && (
        <div className="bg-white border-2 border-yellow-500 rounded-lg p-4 sm:p-6">
          <h3 className="text-lg font-semibold mb-4">Add New Emergency Contact</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                placeholder="+91 1234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email (Optional)
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relationship
              </label>
              <select
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">Select Relationship</option>
                <option value="Parent">Parent</option>
                <option value="Spouse">Spouse</option>
                <option value="Sibling">Sibling</option>
                <option value="Friend">Friend</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isPrimary}
                  onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                  className="w-4 h-4 text-yellow-500 rounded focus:ring-yellow-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Set as primary contact (will receive voice calls during emergency)
                </span>
              </label>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                <Save className="h-5 w-5" />
                Save Contact
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Contacts List */}
      {contacts.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No emergency contacts added yet</p>
          <p className="text-sm text-gray-500 mt-2">
            Add at least one contact to enable SOS features
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className={`bg-white rounded-lg p-4 border-2 ${
                contact.isPrimary ? 'border-yellow-500' : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg text-gray-900">{contact.contactName}</h4>
                  {contact.relationship && (
                    <span className="text-xs text-gray-500">{contact.relationship}</span>
                  )}
                </div>
                {contact.isPrimary && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                    Primary
                  </span>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{contact.contactPhone}</span>
                </div>
                {contact.contactEmail && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <span>📧</span>
                    <span className="truncate">{contact.contactEmail}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200">
                <button
                  onClick={() => handleDelete(contact.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Important Information:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Emergency contacts will be notified via SMS and Email during SOS</li>
              <li>Primary contacts will also receive voice calls</li>
              <li>Make sure contact details are accurate and up-to-date</li>
              <li>Your location will be shared with these contacts during emergencies</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmergencyContacts
