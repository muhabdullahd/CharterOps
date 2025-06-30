'use client'

import { useState } from 'react'
import { Flight } from '@/lib/supabase'
import { Plane, Clock, MapPin, Users, AlertTriangle, CheckCircle, XCircle, Calendar, Navigation } from 'lucide-react'
import { format } from 'date-fns'

interface FlightCardProps {
  flight: Flight
}

export default function FlightCard({ flight }: FlightCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'delayed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'diverted':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
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
    <div className="card-modern card-hover group overflow-hidden">
      {/* Status indicator stripe */}
      <div className={`h-1 w-full ${
        flight.status === 'scheduled' ? 'bg-green-500' :
        flight.status === 'delayed' ? 'bg-yellow-500' :
        flight.status === 'diverted' ? 'bg-red-500' :
        flight.status === 'completed' ? 'bg-blue-500' : 'bg-gray-500'
      }`} />
      
      <div className="p-6">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className={`p-3 rounded-xl transition-colors ${
                flight.status === 'scheduled' ? 'bg-green-100 group-hover:bg-green-200' :
                flight.status === 'delayed' ? 'bg-yellow-100 group-hover:bg-yellow-200' :
                flight.status === 'diverted' ? 'bg-red-100 group-hover:bg-red-200' :
                flight.status === 'completed' ? 'bg-blue-100 group-hover:bg-blue-200' :
                'bg-gray-100 group-hover:bg-gray-200'
              }`}>
                <Plane className={`h-6 w-6 ${
                  flight.status === 'scheduled' ? 'text-green-600' :
                  flight.status === 'delayed' ? 'text-yellow-600' :
                  flight.status === 'diverted' ? 'text-red-600' :
                  flight.status === 'completed' ? 'text-blue-600' :
                  'text-gray-600'
                }`} />
              </div>
              {hasIssues && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-2.5 w-2.5 text-white" />
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{flight.tail_number}</h3>
              <p className="text-sm text-gray-500 flex items-center mt-1">
                <span className="bg-gray-100 px-2 py-1 rounded-full text-xs font-medium">
                  ID: {flight.id.slice(0, 8)}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`status-badge border ${getStatusColor(flight.status)}`}>
              {getStatusIcon(flight.status)}
              <span className="ml-1.5 font-semibold">
                {flight.status.charAt(0).toUpperCase() + flight.status.slice(1)}
              </span>
            </span>
          </div>
        </div>

        {/* Route and Time Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Route Information */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Navigation className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-lg font-bold text-gray-900">{flight.origin}</span>
                <div className="flex-1 border-t-2 border-dashed border-gray-300 relative">
                  <Plane className="h-4 w-4 text-blue-600 absolute top-[-8px] left-1/2 transform -translate-x-1/2 bg-white" />
                </div>
                <span className="text-lg font-bold text-gray-900">{flight.destination}</span>
              </div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Flight Route</p>
            </div>
          </div>
          
          {/* Timing Information */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 text-sm font-semibold text-gray-900 mb-1">
                <span>{format(new Date(flight.departure_time), 'HH:mm')}</span>
                <span className="text-gray-400">→</span>
                <span>{format(new Date(flight.arrival_time), 'HH:mm')}</span>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                {format(new Date(flight.departure_time), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
        </div>

        {/* Crew and Actions Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                {flight.crew_ids.length} crew member{flight.crew_ids.length !== 1 ? 's' : ''}
              </span>
            </div>
            {hasIssues && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-red-50 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-900">
                  {flight.issues.length} issue{flight.issues.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              showDetails 
                ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
            }`}
          >
            {showDetails ? 'Hide Details' : 'View Details'}
          </button>
        </div>

        {/* Expandable Details Section */}
        {showDetails && (
          <div className="mt-6 pt-6 border-t border-gray-200 animate-in slide-in-from-top-2 duration-300">
            <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="h-4 w-4 mr-2 text-blue-600" />
              Flight Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600 font-medium">Departure</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {format(new Date(flight.departure_time), 'PPP p')}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600 font-medium">Arrival</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {format(new Date(flight.arrival_time), 'PPP p')}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600 font-medium">Status</span>
                  <span className={`text-sm font-semibold ${
                    flight.status === 'scheduled' ? 'text-green-600' :
                    flight.status === 'delayed' ? 'text-yellow-600' :
                    flight.status === 'diverted' ? 'text-red-600' :
                    flight.status === 'completed' ? 'text-blue-600' :
                    'text-gray-600'
                  }`}>
                    {flight.status.charAt(0).toUpperCase() + flight.status.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600 font-medium">Crew Count</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {flight.crew_ids.length}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Crew IDs */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Assigned Crew:</p>
              <div className="flex flex-wrap gap-2">
                {flight.crew_ids.map((crewId, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                  >
                    {crewId}
                  </span>
                ))}
              </div>
            </div>

            {/* Issues Section */}
            {hasIssues && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-700 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Active Issues:
                </p>
                <div className="space-y-2">
                  {flight.issues.map((issue, index) => (
                    <div 
                      key={index}
                      className="flex items-start space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-red-800 font-medium">{issue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 