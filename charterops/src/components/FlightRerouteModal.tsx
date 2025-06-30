'use client'

import { useState } from 'react'
import { X, MapPin, Plane, Clock, AlertTriangle } from 'lucide-react'

interface FlightRerouteModalProps {
  alertId: string
  flightId: string
  currentOrigin: string
  currentDestination: string
  isOpen: boolean
  onClose: () => void
  onReroute: (alertId: string, newDestination: string) => void
}

export default function FlightRerouteModal({ 
  alertId, 
  flightId, 
  currentOrigin, 
  currentDestination, 
  isOpen, 
  onClose, 
  onReroute 
}: FlightRerouteModalProps) {
  const [selectedDestination, setSelectedDestination] = useState<string>('')
  const [loading, setLoading] = useState(false)
  
  // Mock airport data - in real implementation this would come from a database
  const [alternativeAirports] = useState([
    {
      code: 'KJFK',
      name: 'John F. Kennedy International Airport',
      city: 'New York, NY',
      distance: '15 nm',
      delay: '+45 min',
      status: 'Available',
      facilities: ['FBO', 'Fuel', 'Customs', 'Maintenance'],
      weather: 'VFR, 10SM visibility, 2500ft ceiling'
    },
    {
      code: 'KTEB',
      name: 'Teterboro Airport',
      city: 'Teterboro, NJ',
      distance: '8 nm',
      delay: '+30 min',
      status: 'Available',
      facilities: ['FBO', 'Fuel', 'Maintenance'],
      weather: 'VFR, 8SM visibility, 3000ft ceiling'
    },
    {
      code: 'KEWR',
      name: 'Newark Liberty International Airport',
      city: 'Newark, NJ',
      distance: '12 nm',
      delay: '+60 min',
      status: 'Available',
      facilities: ['FBO', 'Fuel', 'Customs', 'Maintenance', 'Catering'],
      weather: 'MVFR, 5SM visibility, 1500ft ceiling'
    },
    {
      code: 'KLGA',
      name: 'LaGuardia Airport',
      city: 'New York, NY',
      distance: '18 nm',
      delay: '+90 min',
      status: 'Limited',
      facilities: ['FBO', 'Fuel'],
      weather: 'IFR, 2SM visibility, 800ft ceiling'
    },
    {
      code: 'KISP',
      name: 'Long Island MacArthur Airport',
      city: 'Islip, NY',
      distance: '45 nm',
      delay: '+20 min',
      status: 'Available',
      facilities: ['FBO', 'Fuel', 'Maintenance'],
      weather: 'VFR, 12SM visibility, 4000ft ceiling'
    }
  ])

  const handleReroute = async () => {
    if (!selectedDestination) return
    
    setLoading(true)
    try {
      await onReroute(alertId, selectedDestination)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const getSelectedAirport = () => {
    return alternativeAirports.find(a => a.code === selectedDestination)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="h-6 w-6 text-purple-600" />
              <h2 className="text-lg font-medium text-gray-900">Reroute Flight</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Route */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Current Route</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{currentOrigin}</span>
              </div>
              <Plane className="h-4 w-4 text-gray-400 transform rotate-90" />
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-red-400" />
                <span className="font-medium text-red-600">{currentDestination}</span>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Destination airport has operational issues - select an alternative
            </p>
          </div>

          {/* Alternative Airports */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Alternative Destinations
            </label>
            <div className="grid grid-cols-1 gap-3">
              {alternativeAirports.map((airport) => (
                <label
                  key={airport.code}
                  className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedDestination === airport.code
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="destination"
                    value={airport.code}
                    checked={selectedDestination === airport.code}
                    onChange={(e) => setSelectedDestination(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{airport.code}</h3>
                        <p className="text-sm text-gray-600">{airport.name}</p>
                        <p className="text-xs text-gray-500">{airport.city}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          airport.status === 'Available' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {airport.status}
                        </span>
                        <p className="text-sm text-gray-600 mt-1">{airport.delay}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600"><strong>Distance:</strong> {airport.distance}</p>
                        <p className="text-gray-600"><strong>Weather:</strong> {airport.weather}</p>
                      </div>
                      <div>
                        <p className="text-gray-600"><strong>Facilities:</strong></p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {airport.facilities.map((facility) => (
                            <span
                              key={facility}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                            >
                              {facility}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Reroute Details */}
          {selectedDestination && (
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="font-medium text-gray-900 mb-2">Reroute Details</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>New Route:</strong> {currentOrigin} → {selectedDestination}</p>
                <p><strong>Estimated Delay:</strong> {getSelectedAirport()?.delay}</p>
                <p><strong>Additional Distance:</strong> {getSelectedAirport()?.distance}</p>
                <p><strong>Ground Transportation:</strong> Will be arranged to {currentDestination}</p>
                <p><strong>Passenger Notification:</strong> Automatic SMS/email alerts will be sent</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReroute}
              disabled={!selectedDestination || loading}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Rerouting...' : 'Confirm Reroute'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 