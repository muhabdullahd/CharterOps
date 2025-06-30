"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase, Flight, Alert, Crew } from '@/lib/supabase'

interface DisruptionDetails {
  crewCompliance?: Array<{
    violations?: string[]
  }>
  backupPlans?: unknown[]
}

interface FlightDetails {
  flight: Flight
  alerts: Alert[]
  crew: Crew[]
  disruptionDetails?: DisruptionDetails
}

export default function FlightsPage() {
  const [flights, setFlights] = useState<Flight[]>([])
  const [selectedFlight, setSelectedFlight] = useState<FlightDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [flightLoading, setFlightLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const flightId = searchParams.get('flight_id')
    
    if (flightId) {
      fetchFlightDetails(flightId)
    } else {
      setSelectedFlight(null)
      fetchFlights()
    }
  }, [searchParams])

  const fetchFlights = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('flights')
      .select('*')
      .order('departure_time', { ascending: true })
    setFlights(data || [])
    setLoading(false)
  }

  const fetchFlightDetails = async (flightId: string) => {
    setFlightLoading(true)
    setLoading(false) // Don't show general loading state
    try {
      // Get flight details
      const { data: flight } = await supabase
        .from('flights')
        .select('*')
        .eq('id', flightId)
        .single()

      if (!flight) {
        setFlightLoading(false)
        return
      }

      // Get alerts for this flight
      const { data: alerts } = await supabase
        .from('alerts')
        .select('*')
        .eq('flight_id', flightId)
        .order('triggered_at', { ascending: false })

      // Get crew details
      const { data: crew } = await supabase
        .from('crew')
        .select('*')
        .in('id', flight.crew_ids || [])

      // Get disruption details from API
      const res = await fetch(`/api/monitor?action=details&flight_id=${flightId}`)
      const disruptionDetails = res.ok ? await res.json() : null

      setSelectedFlight({
        flight,
        alerts: alerts || [],
        crew: crew || [],
        disruptionDetails
      })
    } catch (error) {
      console.error('Error fetching flight details:', error)
    } finally {
      setFlightLoading(false)
    }
  }

  const activeFlights = flights.filter((f: Flight) => f.status === 'scheduled')

  if (selectedFlight) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl mx-auto">
          <div className="flex gap-4 mb-8">
            <button
              className="px-6 py-2 bg-gray-600 text-white rounded shadow hover:bg-gray-700 transition"
              onClick={() => router.push('/dashboard')}
            >
              Back to Dashboard
            </button>
            <button
              className="px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.delete('flight_id');
                router.replace(url.pathname + url.search);
              }}
            >
              Back to Flights
            </button>
          </div>
          {flightLoading ? (
            <div className="text-center py-8">Loading flight details...</div>
          ) : (
            <div className="space-y-6">
              {/* Flight Header */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-2xl font-bold mb-4">Flight Details</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Flight ID</label>
                    <p className="text-lg font-semibold">{selectedFlight.flight.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Tail Number</label>
                    <p className="text-lg font-semibold">{selectedFlight.flight.tail_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Origin</label>
                    <p className="text-lg font-semibold">{selectedFlight.flight.origin}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Destination</label>
                    <p className="text-lg font-semibold">{selectedFlight.flight.destination}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Departure Time</label>
                    <p className="text-lg font-semibold">{new Date(selectedFlight.flight.departure_time).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Arrival Time</label>
                    <p className="text-lg font-semibold">{new Date(selectedFlight.flight.arrival_time).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <p className="text-lg font-semibold">{selectedFlight.flight.status}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Crew Count</label>
                    <p className="text-lg font-semibold">{selectedFlight.crew.length}</p>
                  </div>
                </div>
              </div>

              {/* Alerts Section */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold">Active Alerts ({selectedFlight.alerts.filter(a => !a.resolved).length})</h3>
                </div>
                <div className="p-6">
                  {selectedFlight.alerts.filter(a => !a.resolved).length === 0 ? (
                    <p className="text-gray-500">No active alerts for this flight.</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedFlight.alerts.filter(a => !a.resolved).map((alert) => (
                        <div key={alert.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded">
                          <div>
                            <span className="font-medium text-red-800">{alert.type.toUpperCase()}</span>
                            <p className="text-red-700">{alert.message}</p>
                            <p className="text-sm text-red-600">{new Date(alert.triggered_at).toLocaleString()}</p>
                          </div>
                          <button
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                            onClick={() => router.push('/dashboard/alerts')}
                          >
                            View in Alerts
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Crew Section */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold">Assigned Crew ({selectedFlight.crew.length})</h3>
                </div>
                <div className="p-6">
                  {selectedFlight.crew.length === 0 ? (
                    <p className="text-gray-500">No crew assigned to this flight.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedFlight.crew.map((crewMember) => (
                        <div key={crewMember.id} className="p-4 border border-gray-200 rounded">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{crewMember.name}</h4>
                              <p className="text-sm text-gray-600">Current Duty: {crewMember.current_duty}h</p>
                              <p className="text-sm text-gray-600">
                                Rest Compliant: 
                                <span className={crewMember.rest_compliant ? 'text-green-600' : 'text-red-600'}>
                                  {crewMember.rest_compliant ? ' Yes' : ' No'}
                                </span>
                              </p>
                            </div>
                            {!crewMember.rest_compliant && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Duty Violation</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Disruption Details */}
              {selectedFlight.disruptionDetails && (
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold">Disruption Analysis</h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-2">Crew Compliance Issues</h4>
                        {selectedFlight.disruptionDetails && selectedFlight.disruptionDetails.crewCompliance && selectedFlight.disruptionDetails.crewCompliance.length > 0 ? (
                          <ul className="space-y-1">
                            {selectedFlight.disruptionDetails.crewCompliance.map((compliance: { violations?: string[] }, index: number) => (
                              <li key={index} className="text-sm text-gray-700">
                                {compliance.violations?.join(', ') || 'No violations'}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500 text-sm">No compliance issues detected.</p>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Backup Plans</h4>
                        {selectedFlight.disruptionDetails && selectedFlight.disruptionDetails.backupPlans && selectedFlight.disruptionDetails.backupPlans.length > 0 ? (
                          <p className="text-sm text-gray-700">{selectedFlight.disruptionDetails.backupPlans.length} backup plans available</p>
                        ) : (
                          <p className="text-gray-500 text-sm">No backup plans available.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // If a flight_id is present but flight details are still loading, show a spinner
  if (searchParams.get('flight_id')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span>Loading flight details...</span>
      </div>
    );
  }

  // Only show flights list if not loading and no flight_id
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
                <th className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
              ) : activeFlights.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-4 text-center text-gray-500">No active flights.</td></tr>
              ) : (
                activeFlights.map((flight: Flight) => (
                  <tr key={flight.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 border-b text-gray-900 font-medium">{flight.id}</td>
                    <td className="px-6 py-4 border-b text-gray-700">{flight.tail_number}</td>
                    <td className="px-6 py-4 border-b text-gray-700">{flight.origin}</td>
                    <td className="px-6 py-4 border-b text-gray-700">{flight.destination}</td>
                    <td className="px-6 py-4 border-b text-gray-700">{new Date(flight.departure_time).toLocaleString()}</td>
                    <td className="px-6 py-4 border-b text-gray-700">{flight.status}</td>
                    <td className="px-6 py-4 border-b text-gray-700">
                      <button
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        onClick={() => router.push(`/dashboard/flights?flight_id=${flight.id}`)}
                      >
                        View Details
                      </button>
                    </td>
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