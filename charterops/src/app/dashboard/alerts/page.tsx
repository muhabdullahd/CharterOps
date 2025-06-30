"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Alert } from '@/lib/supabase'

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchAlerts = async () => {
      const { data } = await supabase
        .from('alerts')
        .select('*')
        .order('triggered_at', { ascending: false })
      setAlerts(data || [])
      setLoading(false)
    }
    fetchAlerts()
  }, [])

  const activeAlerts = alerts.filter((a: Alert) => !a.resolved)

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
        <div className="overflow-x-auto rounded-lg shadow border border-gray-200">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">Alert Type</th>
                <th className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">Message</th>
                <th className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">Triggered At</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
              ) : activeAlerts.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">No active alerts.</td></tr>
              ) : (
                activeAlerts.map((alert: Alert) => (
                  <tr key={alert.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 border-b text-gray-900 font-medium">{alert.type}</td>
                    <td className="px-6 py-4 border-b text-gray-700">{alert.message}</td>
                    <td className="px-6 py-4 border-b text-gray-700">{new Date(alert.triggered_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 