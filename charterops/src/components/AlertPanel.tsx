'use client'

import { useState } from 'react'
import { Alert } from '@/lib/supabase'
import { AlertTriangle, X, Clock, Cloud, Users, Wrench, MapPin, CheckCircle, Eye, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'

interface AlertPanelProps {
  alerts: Alert[]
}

export default function AlertPanel({ alerts }: AlertPanelProps) {
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null)
  const [resolving, setResolving] = useState<string | null>(null)
  const router = useRouter()

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'weather':
        return <Cloud className="h-5 w-5" />
      case 'crew':
        return <Users className="h-5 w-5" />
      case 'mechanical':
        return <Wrench className="h-5 w-5" />
      case 'airport':
        return <MapPin className="h-5 w-5" />
      default:
        return <AlertTriangle className="h-5 w-5" />
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'weather':
        return 'bg-blue-50 border-blue-200 hover:bg-blue-100'
      case 'crew':
        return 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
      case 'mechanical':
        return 'bg-red-50 border-red-200 hover:bg-red-100'
      case 'airport':
        return 'bg-purple-50 border-purple-200 hover:bg-purple-100'
      default:
        return 'bg-gray-50 border-gray-200 hover:bg-gray-100'
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

  const getAlertIconColor = (type: string) => {
    switch (type) {
      case 'weather':
        return 'text-blue-600'
      case 'crew':
        return 'text-yellow-600'
      case 'mechanical':
        return 'text-red-600'
      case 'airport':
        return 'text-purple-600'
      default:
        return 'text-gray-600'
    }
  }

  const handleMarkResolved = async (alertId: string) => {
    setResolving(alertId)
    try {
      const res = await fetch('/api/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve_alert', alert_id: alertId })
      })
      if (res.ok) {
        setExpandedAlert(null)
      } else {
        console.error('Failed to resolve alert')
      }
    } catch (error) {
      console.error('Error resolving alert:', error)
    } finally {
      setResolving(null)
    }
  }

  const handleViewFlight = (flightId: string) => {
    router.push(`/dashboard/flights?flight_id=${flightId}`)
  }

  return (
    <div className="card-modern overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="relative">
              <AlertTriangle className="h-6 w-6 mr-3" />
              {alerts.length > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-pulse"></div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold">Active Alerts</h2>
              <p className="text-red-100 text-sm">System notifications requiring attention</p>
            </div>
          </div>
          <div className="flex items-center">
            <span className="bg-white/20 text-red-100 text-xs font-bold px-3 py-1 rounded-full border border-white/30">
              {alerts.length}
            </span>
          </div>
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="text-center py-12 px-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All Clear!</h3>
            <p className="text-gray-500 text-sm">No active alerts at this time</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {alerts.map((alert, index) => (
              <div
                key={alert.id}
                className={`border rounded-xl transition-all duration-300 ${getAlertColor(alert.type)} animate-in slide-in-from-right-2`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`p-2 bg-white rounded-lg shadow-sm ${getAlertIconColor(alert.type)}`}>
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`text-sm font-semibold ${getAlertTextColor(alert.type)}`}>
                            {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)} Alert
                          </span>
                          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full font-medium">
                            Flight {alert.flight_id.slice(0, 8)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2 leading-relaxed">{alert.message}</p>
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{format(new Date(alert.triggered_at), 'MMM dd, HH:mm')}</span>
                          </div>
                          <span className="px-2 py-1 bg-gray-100 rounded-full font-medium">
                            {alert.resolved ? 'Resolved' : 'Active'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
                    >
                      <ArrowRight className={`h-4 w-4 transition-transform ${expandedAlert === alert.id ? 'rotate-90' : ''}`} />
                    </button>
                  </div>
                  
                  {expandedAlert === alert.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 animate-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg">
                            <span className="text-gray-600 font-medium">Alert ID</span>
                            <span className="font-mono text-gray-900">{alert.id.slice(0, 8)}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg">
                            <span className="text-gray-600 font-medium">Flight ID</span>
                            <span className="font-mono text-gray-900">{alert.flight_id.slice(0, 8)}</span>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg">
                            <span className="text-gray-600 font-medium">Triggered</span>
                            <span className="text-gray-900 font-medium">
                              {format(new Date(alert.triggered_at), 'MMM dd, HH:mm')}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg">
                            <span className="text-gray-600 font-medium">Status</span>
                            <span className={`font-semibold ${alert.resolved ? 'text-green-600' : 'text-red-600'}`}>
                              {alert.resolved ? 'Resolved' : 'Active'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button 
                          className="btn-success text-sm flex items-center space-x-2"
                          disabled={resolving === alert.id}
                          onClick={() => handleMarkResolved(alert.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>{resolving === alert.id ? 'Resolving...' : 'Mark Resolved'}</span>
                        </button>
                        <button 
                          className="btn-primary text-sm flex items-center space-x-2"
                          onClick={() => handleViewFlight(alert.flight_id)}
                        >
                          <Eye className="h-4 w-4" />
                          <span>View Flight</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 