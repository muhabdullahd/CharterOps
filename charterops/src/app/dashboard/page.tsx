'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { supabase, Flight, Alert } from '@/lib/supabase'
import FlightCard from '@/components/FlightCard'
import AlertPanel from '@/components/AlertPanel'
import CrewDutyTracker from '@/components/CrewDutyTracker'
import { Plane, AlertTriangle, Users, Clock } from 'lucide-react'

// Add dynamic import to prevent SSR issues
export const dynamic = 'force-dynamic'

export default function Dashboard() {
  const { user, loading } = useAuth()
  const [flights, setFlights] = useState<Flight[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (user) {
      fetchFlights()
      fetchAlerts()
      
      // Set up real-time subscriptions
      const flightsSubscription = supabase
        .channel('flights')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'flights' }, () => {
          fetchFlights()
        })
        .subscribe()

      const alertsSubscription = supabase
        .channel('alerts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => {
          fetchAlerts()
        })
        .subscribe()

      return () => {
        supabase.removeChannel(flightsSubscription)
        supabase.removeChannel(alertsSubscription)
      }
    }
  }, [user])

  const fetchFlights = async () => {
    const { data } = await supabase
      .from('flights')
      .select('*')
      .order('departure_time', { ascending: true })
    
    if (data) setFlights(data)
  }

  const fetchAlerts = async () => {
    const { data } = await supabase
      .from('alerts')
      .select('*')
      .eq('resolved', false)
      .order('triggered_at', { ascending: false })
    
    if (data) setAlerts(data)
  }

  const filteredFlights = flights.filter(flight => {
    if (filter === 'all') return true
    if (filter === 'active') return flight.status === 'scheduled'
    if (filter === 'delayed') return flight.status === 'delayed'
    if (filter === 'completed') return flight.status === 'completed'
    return true
  })

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return <div>Please log in</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Plane className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">CharterOps</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <button
                onClick={() => supabase.auth.signOut()}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Plane className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Flights</p>
                <p className="text-2xl font-bold text-gray-900">
                  {flights.filter(f => f.status === 'scheduled').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Crew Available</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Response</p>
                <p className="text-2xl font-bold text-gray-900">2.3m</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Flight Filters */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Flight Operations</h2>
              </div>
              <div className="px-6 py-4">
                <div className="flex space-x-4">
                  {['all', 'active', 'delayed', 'completed'].map((filterOption) => (
                    <button
                      key={filterOption}
                      onClick={() => setFilter(filterOption)}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        filter === filterOption
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Flight Cards */}
            <div className="space-y-4">
              {filteredFlights.map((flight) => (
                <FlightCard key={flight.id} flight={flight} />
              ))}
              {filteredFlights.length === 0 && (
                <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                  No flights found
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <AlertPanel alerts={alerts} />
            <CrewDutyTracker />
          </div>
        </div>
      </div>
    </div>
  )
} 