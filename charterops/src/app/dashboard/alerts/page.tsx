"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Alert, Flight } from '@/lib/supabase'
import MaintenanceDispatchModal from '@/components/MaintenanceDispatchModal'
import FlightRerouteModal from '@/components/FlightRerouteModal'
import WeatherInfoModal from '@/components/WeatherInfoModal'
import BackupCrewModal from '@/components/BackupCrewModal'
import { CheckCircle, AlertTriangle } from 'lucide-react'

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [flights, setFlights] = useState<Flight[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [resolving, setResolving] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [flightsMap, setFlightsMap] = useState<Record<string, string>>({})
  
  // Modal states
  const [maintenanceModal, setMaintenanceModal] = useState<{ isOpen: boolean; alertId: string; flightId: string }>({ isOpen: false, alertId: '', flightId: '' })
  const [rerouteModal, setRerouteModal] = useState<{ isOpen: boolean; alertId: string; flightId: string; origin: string; destination: string }>({ isOpen: false, alertId: '', flightId: '', origin: '', destination: '' })
  const [weatherModal, setWeatherModal] = useState<{ isOpen: boolean; alertId: string; flightId: string; origin: string; destination: string }>({ isOpen: false, alertId: '', flightId: '', origin: '', destination: '' })
  const [crewModal, setCrewModal] = useState<{ isOpen: boolean; alertId: string; flightId: string }>({ isOpen: false, alertId: '', flightId: '' })

  useEffect(() => {
    const fetchAlerts = async () => {
      const { data } = await supabase
        .from('alerts')
        .select('*')
        .order('triggered_at', { ascending: false })
      setAlerts(data || [])
      setLoading(false)
    }
    const fetchFlights = async () => {
      const { data } = await supabase
        .from('flights')
        .select('*')
      if (data) {
        setFlights(data)
        const map: Record<string, string> = {}
        data.forEach((f: Flight) => {
          map[f.id] = f.departure_time
        })
        setFlightsMap(map)
      }
    }
    fetchAlerts()
    fetchFlights()
  }, [])

  const activeAlerts = alerts
    .filter((a: Alert) => !a.resolved)
    .sort((a, b) => {
      const depA = flightsMap[a.flight_id] || ''
      const depB = flightsMap[b.flight_id] || ''
      if (depA === depB) {
        return new Date(b.triggered_at).getTime() - new Date(a.triggered_at).getTime()
      }
      return new Date(depB).getTime() - new Date(depA).getTime()
    })

  const getFlightForAlert = (alertId: string): Flight | null => {
    const alert = alerts.find(a => a.id === alertId)
    if (!alert) return null
    return flights.find(f => f.id === alert.flight_id) || null
  }

  const handleDemoResolve = async (alertId: string, action: string) => {
    setResolving(alertId)
    try {
      const res = await fetch('/api/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve_alert', alert_id: alertId })
      })
      if (res.ok) {
        setAlerts(alerts => alerts.filter(a => a.id !== alertId))
        if (action.toLowerCase().includes('acknowledge')) {
          setToast('Acknowledged!')
        } else if (action.toLowerCase().includes('ignore')) {
          setToast('Ignored!')
        } else {
          setToast(`${action} - Alert resolved!`)
        }
        setTimeout(() => setToast(null), 2000)
      } else {
        setToast('Failed to resolve alert')
        setTimeout(() => setToast(null), 2000)
      }
    } finally {
      setResolving(null)
    }
  }

  const handleResolveAll = async () => {
    setResolving('all')
    try {
      await Promise.all(activeAlerts.map(alert =>
        fetch('/api/monitor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'resolve_alert', alert_id: alert.id })
        })
      ))
      setAlerts(alerts => alerts.filter(a => a.resolved))
      setToast('All alerts resolved!')
      setTimeout(() => setToast(null), 2000)
    } finally {
      setResolving(null)
    }
  }

  // Modal handlers
  const handleMaintenanceDispatch = async (alertId: string, crewId: string) => {
    setResolving(alertId)
    try {
      const res = await fetch('/api/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve_alert', alert_id: alertId })
      })
      if (res.ok) {
        setAlerts(alerts => alerts.filter(a => a.id !== alertId))
        setToast(`Maintenance crew ${crewId} dispatched!`)
        setTimeout(() => setToast(null), 2000)
      } else {
        setToast('Failed to dispatch maintenance')
        setTimeout(() => setToast(null), 2000)
      }
    } finally {
      setResolving(null)
    }
  }

  const handleFlightReroute = async (alertId: string, newDestination: string) => {
    setResolving(alertId)
    try {
      const res = await fetch('/api/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve_alert', alert_id: alertId })
      })
      if (res.ok) {
        setAlerts(alerts => alerts.filter(a => a.id !== alertId))
        setToast(`Flight rerouted to ${newDestination}!`)
        setTimeout(() => setToast(null), 2000)
      } else {
        setToast('Failed to reroute flight')
        setTimeout(() => setToast(null), 2000)
      }
    } finally {
      setResolving(null)
    }
  }

  const handleBackupCrewAssign = async (alertId: string, crewIds: string[]) => {
    setResolving(alertId)
    try {
      const res = await fetch('/api/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve_alert', alert_id: alertId })
      })
      if (res.ok) {
        setAlerts(alerts => alerts.filter(a => a.id !== alertId))
        setToast(`${crewIds.length} backup crew members assigned!`)
        setTimeout(() => setToast(null), 2000)
      } else {
        setToast('Failed to assign backup crew')
        setTimeout(() => setToast(null), 2000)
      }
    } finally {
      setResolving(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-3xl mx-auto">
        <button
          className="mb-8 px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
          onClick={() => router.push('/dashboard')}
          aria-label="Back to Dashboard"
        >
          Back to Dashboard
        </button>
        <h2 className="text-2xl font-bold mb-6 text-center tracking-tight">Active Alerts</h2>
        {activeAlerts.length > 0 && (
          <button
            className="mb-4 px-6 py-2 bg-green-700 text-white rounded shadow hover:bg-green-800 focus:ring-2 focus:ring-green-400 focus:outline-none transition disabled:opacity-50"
            disabled={!!resolving}
            onClick={handleResolveAll}
            aria-label="Resolve All Alerts"
          >
            {resolving === 'all' ? 'Resolving All...' : 'Resolve All'}
          </button>
        )}
        <div className="overflow-x-auto rounded-lg shadow border border-gray-200" style={{ width: '150%' }}>
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">Alert Type</th>
                <th className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">Message</th>
                <th className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">Triggered At</th>
                <th className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">Action</th>
                <th className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
              ) : activeAlerts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CheckCircle className="h-10 w-10 text-green-300 mb-2 animate-bounce" />
                      <span className="text-lg font-semibold">No active alerts. All clear!</span>
                      <span className="text-sm text-gray-400">You're all caught up. Enjoy the calm skies.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                activeAlerts.map((alert: Alert, idx) => {
                  const flight = getFlightForAlert(alert.id)
                  return (
                    <tr key={alert.id} className={`transition-colors duration-150 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50`}> 
                      <td className={`px-6 py-4 border-b font-medium rounded whitespace-nowrap transition-colors ${
                        alert.type === 'weather' ? 'bg-blue-50 text-blue-800' :
                        alert.type === 'crew' ? 'bg-yellow-50 text-yellow-800' :
                        alert.type === 'mechanical' ? 'bg-red-50 text-red-800' :
                        alert.type === 'airport' ? 'bg-purple-50 text-purple-800' :
                        'bg-gray-50 text-gray-800'
                      }`}>
                        {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
                      </td>
                      <td className="px-6 py-4 border-b text-gray-700">{alert.message}</td>
                      <td className="px-6 py-4 border-b text-gray-700">{new Date(alert.triggered_at).toLocaleString()}</td>
                      <td className="px-6 py-4 border-b text-gray-700">
                        <div className="flex gap-2 flex-wrap">
                          {/* Enhanced action buttons based on alert type */}
                          {alert.type === 'crew' && (
                            <>
                              <button
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:outline-none transition disabled:opacity-50"
                                disabled={resolving === alert.id}
                                onClick={() => setCrewModal({ isOpen: true, alertId: alert.id, flightId: alert.flight_id })}
                                aria-label="Assign Backup Crew"
                              >Assign Backup Crew</button>
                              <button
                                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 focus:ring-2 focus:ring-gray-400 focus:outline-none transition disabled:opacity-50"
                                disabled={resolving === alert.id}
                                onClick={() => handleDemoResolve(alert.id, 'Acknowledge')}
                                aria-label="Acknowledge Crew Alert"
                              >Acknowledge</button>
                              <button
                                className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-400 focus:outline-none transition disabled:opacity-50"
                                disabled={resolving === alert.id}
                                onClick={() => handleDemoResolve(alert.id, 'Ignore')}
                                aria-label="Ignore Crew Alert"
                              >Ignore</button>
                            </>
                          )}
                          {alert.type === 'weather' && (
                            <>
                              <button
                                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 focus:outline-none transition disabled:opacity-50"
                                disabled={resolving === alert.id}
                                onClick={() => setWeatherModal({ 
                                  isOpen: true, 
                                  alertId: alert.id, 
                                  flightId: alert.flight_id,
                                  origin: flight?.origin || '',
                                  destination: flight?.destination || ''
                                })}
                                aria-label="Show Weather Details"
                              >Show Weather</button>
                              <button
                                className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 focus:ring-2 focus:ring-orange-400 focus:outline-none transition disabled:opacity-50"
                                disabled={resolving === alert.id}
                                onClick={() => handleDemoResolve(alert.id, 'Delay Flight')}
                                aria-label="Delay Flight for Weather"
                              >Delay Flight</button>
                              <button
                                className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-400 focus:outline-none transition disabled:opacity-50"
                                disabled={resolving === alert.id}
                                onClick={() => handleDemoResolve(alert.id, 'Ignore')}
                                aria-label="Ignore Weather Alert"
                              >Ignore</button>
                            </>
                          )}
                          {alert.type === 'mechanical' && (
                            <>
                              <button
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 focus:ring-2 focus:ring-red-400 focus:outline-none transition disabled:opacity-50"
                                disabled={resolving === alert.id}
                                onClick={() => setMaintenanceModal({ isOpen: true, alertId: alert.id, flightId: alert.flight_id })}
                                aria-label="Dispatch Maintenance Crew"
                              >Dispatch Maintenance</button>
                              <button
                                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 focus:ring-2 focus:ring-gray-400 focus:outline-none transition disabled:opacity-50"
                                disabled={resolving === alert.id}
                                onClick={() => handleDemoResolve(alert.id, 'Acknowledge')}
                                aria-label="Acknowledge Mechanical Alert"
                              >Acknowledge</button>
                              <button
                                className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-400 focus:outline-none transition disabled:opacity-50"
                                disabled={resolving === alert.id}
                                onClick={() => handleDemoResolve(alert.id, 'Ignore')}
                                aria-label="Ignore Mechanical Alert"
                              >Ignore</button>
                            </>
                          )}
                          {alert.type === 'airport' && (
                            <>
                              <button
                                className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 focus:ring-2 focus:ring-purple-400 focus:outline-none transition disabled:opacity-50"
                                disabled={resolving === alert.id}
                                onClick={() => setRerouteModal({ 
                                  isOpen: true, 
                                  alertId: alert.id, 
                                  flightId: alert.flight_id,
                                  origin: flight?.origin || '',
                                  destination: flight?.destination || ''
                                })}
                                aria-label="Reroute Flight"
                              >Reroute Flight</button>
                              <button
                                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 focus:ring-2 focus:ring-gray-400 focus:outline-none transition disabled:opacity-50"
                                disabled={resolving === alert.id}
                                onClick={() => handleDemoResolve(alert.id, 'Acknowledge')}
                                aria-label="Acknowledge Airport Alert"
                              >Acknowledge</button>
                              <button
                                className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-400 focus:outline-none transition disabled:opacity-50"
                                disabled={resolving === alert.id}
                                onClick={() => handleDemoResolve(alert.id, 'Ignore')}
                                aria-label="Ignore Airport Alert"
                              >Ignore</button>
                            </>
                          )}
                          {/* View Flight button */}
                          <button
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:outline-none text-sm transition"
                            onClick={() => router.push(`/dashboard/flights?flight_id=${alert.flight_id}`)}
                            aria-label="View Flight Details"
                          >
                            View Flight
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modals */}
      <div className={maintenanceModal.isOpen ? "fixed inset-0 z-50 flex items-center justify-center transition-all duration-200 opacity-100 scale-100" : "pointer-events-none opacity-0 scale-95"}>
        <MaintenanceDispatchModal
          alertId={maintenanceModal.alertId}
          isOpen={maintenanceModal.isOpen}
          onClose={() => setMaintenanceModal({ isOpen: false, alertId: '', flightId: '' })}
          onDispatch={handleMaintenanceDispatch}
        />
      </div>
      <div className={rerouteModal.isOpen ? "fixed inset-0 z-50 flex items-center justify-center transition-all duration-200 opacity-100 scale-100" : "pointer-events-none opacity-0 scale-95"}>
        <FlightRerouteModal
          alertId={rerouteModal.alertId}
          currentOrigin={rerouteModal.origin}
          currentDestination={rerouteModal.destination}
          isOpen={rerouteModal.isOpen}
          onClose={() => setRerouteModal({ isOpen: false, alertId: '', flightId: '', origin: '', destination: '' })}
          onReroute={handleFlightReroute}
        />
      </div>
      <div className={weatherModal.isOpen ? "fixed inset-0 z-50 flex items-center justify-center transition-all duration-200 opacity-100 scale-100" : "pointer-events-none opacity-0 scale-95"}>
        <WeatherInfoModal
          origin={weatherModal.origin}
          destination={weatherModal.destination}
          isOpen={weatherModal.isOpen}
          onClose={() => setWeatherModal({ isOpen: false, alertId: '', flightId: '', origin: '', destination: '' })}
        />
      </div>
      <div className={crewModal.isOpen ? "fixed inset-0 z-50 flex items-center justify-center transition-all duration-200 opacity-100 scale-100" : "pointer-events-none opacity-0 scale-95"}>
        <BackupCrewModal
          alertId={crewModal.alertId}
          isOpen={crewModal.isOpen}
          onClose={() => setCrewModal({ isOpen: false, alertId: '', flightId: '' })}
          onAssign={handleBackupCrewAssign}
        />
      </div>
      
      {toast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow z-50 animate-fade-in-out">
          {toast}
        </div>
      )}
      <style jsx global>{`
        @keyframes fade-in-out {
          0% { opacity: 0; transform: translateY(-10px); }
          10% { opacity: 1; transform: translateY(0); }
          90% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
        .animate-fade-in-out {
          animation: fade-in-out 2s;
        }
      `}</style>
    </div>
  )
} 