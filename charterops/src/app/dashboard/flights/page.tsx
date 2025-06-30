"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Flight } from '@/lib/supabase'

export default function FlightsPage() {
  const [flights, setFlights] = useState<Flight[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchFlights = async () => {
      const { data } = await supabase
        .from('flights')
        .select('*')
        .order('departure_time', { ascending: true })
      setFlights(data || [])
      setLoading(false)
    }
    fetchFlights()
  }, [])

  const activeFlights = flights.filter((f: Flight) => f.status === 'scheduled')

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl mx-auto">
        <button
          className="mb-8 px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
          onClick={() => router.push('/dashboard')}
        >
          Back to Dashboard
        </button>
        <h2 className="text-2xl font-bold mb-6 text-center">Active Flights</h2>
        <div className="overflow-x-auto rounded-lg shadow border border-gray-200">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">Flight ID</th>
                <th className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">Tail Number</th>
                <th className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">Origin</th>
                <th className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">Destination</th>
                <th className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">Departure Time</th>
                <th className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
              ) : activeFlights.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">No active flights.</td></tr>
              ) : (
                activeFlights.map((flight: Flight) => (
                  <tr key={flight.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 border-b text-gray-900 font-medium">{flight.id}</td>
                    <td className="px-6 py-4 border-b text-gray-700">{flight.tail_number}</td>
                    <td className="px-6 py-4 border-b text-gray-700">{flight.origin}</td>
                    <td className="px-6 py-4 border-b text-gray-700">{flight.destination}</td>
                    <td className="px-6 py-4 border-b text-gray-700">{new Date(flight.departure_time).toLocaleString()}</td>
                    <td className="px-6 py-4 border-b text-gray-700">{flight.status}</td>
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