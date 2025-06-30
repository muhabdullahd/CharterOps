"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Alert } from '@/lib/supabase'

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [resolving, setResolving] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [flightsMap, setFlightsMap] = useState<Record<string, string>>({})

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
        .select('id,departure_time')
      if (data) {
        const map: Record<string, string> = {}
        data.forEach((f: { id: string; departure_time: string }) => {
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

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-3xl mx-auto">
        <button
          className="mb-8 px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
          onClick={() => router.push('/dashboard')}
        >
          Back to Dashboard
        </button>
        <h2 className="text-2xl font-bold mb-6 text-center">Active Alerts</h2>
        {activeAlerts.length > 0 && (
          <button
            className="mb-4 px-6 py-2 bg-green-700 text-white rounded shadow hover:bg-green-800 disabled:opacity-50"
            disabled={!!resolving}
            onClick={handleResolveAll}
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
                <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No active alerts.</td></tr>
              ) : (
                activeAlerts.map((alert: Alert) => (
                  <tr key={alert.id} className="hover:bg-gray-50">
                    <td className={`px-6 py-4 border-b font-medium rounded whitespace-nowrap ${
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
                        {/* Demo action buttons based on alert type */}
                        {alert.type === 'crew' && (
                          <>
                            <button
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                              disabled={resolving === alert.id}
                              onClick={() => handleDemoResolve(alert.id, 'Assign Backup Crew')}
                            >Assign Backup Crew</button>
                            <button
                              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                              disabled={resolving === alert.id}
                              onClick={() => handleDemoResolve(alert.id, 'Acknowledge')}
                            >Acknowledge</button>
                            <button
                              className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                              disabled={resolving === alert.id}
                              onClick={() => handleDemoResolve(alert.id, 'Ignore')}
                            >Ignore</button>
                          </>
                        )}
                        {alert.type === 'weather' && (
                          <>
                            <button
                              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                              disabled={resolving === alert.id}
                              onClick={() => handleDemoResolve(alert.id, 'Acknowledge Weather')}
                            >Acknowledge Weather</button>
                            <button
                              className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                              disabled={resolving === alert.id}
                              onClick={() => handleDemoResolve(alert.id, 'Delay Flight')}
                            >Delay Flight</button>
                            <button
                              className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                              disabled={resolving === alert.id}
                              onClick={() => handleDemoResolve(alert.id, 'Ignore')}
                            >Ignore</button>
                          </>
                        )}
                        {alert.type === 'mechanical' && (
                          <>
                            <button
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                              disabled={resolving === alert.id}
                              onClick={() => handleDemoResolve(alert.id, 'Dispatch Maintenance')}
                            >Dispatch Maintenance</button>
                            <button
                              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                              disabled={resolving === alert.id}
                              onClick={() => handleDemoResolve(alert.id, 'Acknowledge')}
                            >Acknowledge</button>
                            <button
                              className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                              disabled={resolving === alert.id}
                              onClick={() => handleDemoResolve(alert.id, 'Ignore')}
                            >Ignore</button>
                          </>
                        )}
                        {alert.type === 'airport' && (
                          <>
                            <button
                              className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                              disabled={resolving === alert.id}
                              onClick={() => handleDemoResolve(alert.id, 'Reroute Flight')}
                            >Reroute Flight</button>
                            <button
                              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                              disabled={resolving === alert.id}
                              onClick={() => handleDemoResolve(alert.id, 'Acknowledge')}
                            >Acknowledge</button>
                            <button
                              className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                              disabled={resolving === alert.id}
                              onClick={() => handleDemoResolve(alert.id, 'Ignore')}
                            >Ignore</button>
                          </>
                        )}
                        {/* View Flight button */}
                        <button
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          onClick={() => router.push(`/dashboard/flights?flight_id=${alert.flight_id}`)}
                        >
                          View Flight
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {toast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow z-50">
          {toast}
        </div>
      )}
    </div>
  )
} 