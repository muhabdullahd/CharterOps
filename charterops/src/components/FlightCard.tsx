'use client'

import { useState } from 'react'
import { Flight } from '@/lib/supabase'
import { Plane, Clock, MapPin, Users, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'

interface FlightCardProps {
  flight: Flight
}

export default function FlightCard({ flight }: FlightCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-green-100 text-green-800'
      case 'delayed':
        return 'bg-yellow-100 text-yellow-800'
      case 'diverted':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <CheckCircle className="h-4 w-4" />
      case 'delayed':
        return <AlertTriangle className="h-4 w-4" />
      case 'diverted':
        return <XCircle className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const hasIssues = flight.issues && flight.issues.length > 0

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Plane className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{flight.tail_number}</h3>
              <p className="text-sm text-gray-500">Flight ID: {flight.id.slice(0, 8)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(flight.status)}`}>
              {getStatusIcon(flight.status)}
              <span className="ml-1">{flight.status.charAt(0).toUpperCase() + flight.status.slice(1)}</span>
            </span>
            {hasIssues && (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">{flight.origin} → {flight.destination}</p>
              <p className="text-xs text-gray-500">Route</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {format(new Date(flight.departure_time), 'MMM dd, HH:mm')} - {format(new Date(flight.arrival_time), 'HH:mm')}
              </p>
              <p className="text-xs text-gray-500">Departure - Arrival</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">{flight.crew_ids.length} crew assigned</span>
          </div>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {showDetails ? 'Hide Details' : 'View Details'}
          </button>
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Flight Details</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Departure:</strong> {format(new Date(flight.departure_time), 'PPP p')}</p>
              <p><strong>Arrival:</strong> {format(new Date(flight.arrival_time), 'PPP p')}</p>
              <p><strong>Crew IDs:</strong> {flight.crew_ids.join(', ')}</p>
              {hasIssues && (
                <div>
                  <p><strong>Issues:</strong></p>
                  <ul className="list-disc list-inside ml-2">
                    {flight.issues.map((issue, index) => (
                      <li key={index} className="text-red-600">{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 