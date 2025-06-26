'use client'

import { useState } from 'react'
import { Alert } from '@/lib/supabase'
import { AlertTriangle, X, Clock, Cloud, Users, Wrench, MapPin } from 'lucide-react'
import { format } from 'date-fns'

interface AlertPanelProps {
  alerts: Alert[]
}

export default function AlertPanel({ alerts }: AlertPanelProps) {
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null)

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'weather':
        return <Cloud className="h-4 w-4" />
      case 'crew':
        return <Users className="h-4 w-4" />
      case 'mechanical':
        return <Wrench className="h-4 w-4" />
      case 'airport':
        return <MapPin className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'weather':
        return 'bg-blue-50 border-blue-200'
      case 'crew':
        return 'bg-yellow-50 border-yellow-200'
      case 'mechanical':
        return 'bg-red-50 border-red-200'
      case 'airport':
        return 'bg-purple-50 border-purple-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getAlertTextColor = (type: string) => {
    switch (type) {
      case 'weather':
        return 'text-blue-800'
      case 'crew':
        return 'text-yellow-800'
      case 'mechanical':
        return 'text-red-800'
      case 'airport':
        return 'text-purple-800'
      default:
        return 'text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Active Alerts</h2>
          <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {alerts.length}
          </span>
        </div>
      </div>
      
      <div className="p-4">
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">No active alerts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`border rounded-lg p-4 ${getAlertColor(alert.type)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`mt-1 ${getAlertTextColor(alert.type)}`}>
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`text-sm font-medium ${getAlertTextColor(alert.type)}`}>
                          {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)} Alert
                        </span>
                        <span className="text-xs text-gray-500">
                          Flight {alert.flight_id.slice(0, 8)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{format(new Date(alert.triggered_at), 'MMM dd, HH:mm')}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                {expandedAlert === alert.id && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="space-y-2 text-sm">
                      <p><strong>Alert ID:</strong> {alert.id}</p>
                      <p><strong>Flight ID:</strong> {alert.flight_id}</p>
                      <p><strong>Triggered:</strong> {format(new Date(alert.triggered_at), 'PPP p')}</p>
                      <p><strong>Status:</strong> {alert.resolved ? 'Resolved' : 'Active'}</p>
                    </div>
                    <div className="mt-3 flex space-x-2">
                      <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700">
                        Mark Resolved
                      </button>
                      <button className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700">
                        View Flight
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 