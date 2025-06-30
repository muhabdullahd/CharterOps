'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { supabase, Flight, Alert, Crew } from '@/lib/supabase'
import FlightCard from '@/components/FlightCard'
import AlertPanel from '@/components/AlertPanel'
import CrewDutyTracker from '@/components/CrewDutyTracker'
import { Plane, AlertTriangle, Users, Clock, Play, Square, RefreshCw, Activity, TrendingUp } from 'lucide-react'
import { DisruptionSummary, MonitoringStatus } from '@/lib/disruption-monitor'
import { useRouter } from 'next/navigation'

// Add dynamic import to prevent SSR issues
export const dynamic = 'force-dynamic'

export default function Dashboard() {
  const { user, loading } = useAuth()
  const [flights, setFlights] = useState<Flight[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [filter, setFilter] = useState('all')
  const [monitoringStatus, setMonitoringStatus] = useState<MonitoringStatus | null>(null)
  const [disruptionSummary, setDisruptionSummary] = useState<DisruptionSummary[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [crew, setCrew] = useState<Crew[]>([])
  const router = useRouter()

  useEffect(() => {
    if (user) {
      fetchFlights()
      fetchAlerts()
      fetchCrew()
      fetchMonitoringStatus()
      fetchDisruptionSummary()
      
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
          fetchDisruptionSummary()
        })
        .subscribe()

      const crewSubscription = supabase
        .channel('crew')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'crew' }, () => {
          fetchCrew()
        })
        .subscribe()

      return () => {
        supabase.removeChannel(flightsSubscription)
        supabase.removeChannel(alertsSubscription)
        supabase.removeChannel(crewSubscription)
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

  const fetchCrew = async () => {
    const { data } = await supabase
      .from('crew')
      .select('*')
      .order('name', { ascending: true })
    
    if (data) setCrew(data)
  }

  const fetchMonitoringStatus = async () => {
    try {
      const response = await fetch('/api/monitor?action=status')
      const status = await response.json()
      setMonitoringStatus(status)
      setIsMonitoring(status.isRunning)
    } catch (error) {
      console.error('Error fetching monitoring status:', error)
    }
  }

  const fetchDisruptionSummary = async () => {
    try {
      const response = await fetch('/api/monitor?action=summary')
      const summary = await response.json()
      setDisruptionSummary(summary)
    } catch (error) {
      console.error('Error fetching disruption summary:', error)
    }
  }

  const startMonitoring = async () => {
    try {
      await fetch('/api/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      })
      setIsMonitoring(true)
      fetchMonitoringStatus()
    } catch (error) {
      console.error('Error starting monitoring:', error)
    }
  }

  const stopMonitoring = async () => {
    try {
      await fetch('/api/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' })
      })
      setIsMonitoring(false)
      fetchMonitoringStatus()
    } catch (error) {
      console.error('Error stopping monitoring:', error)
    }
  }

  const triggerManualCheck = async () => {
    try {
      await fetch('/api/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check' })
      })
      // Refresh data after manual check
      setTimeout(() => {
        fetchAlerts()
        fetchDisruptionSummary()
        fetchMonitoringStatus()
      }, 2000)
    } catch (error) {
      console.error('Error triggering manual check:', error)
    }
  }

  const filteredFlights = flights.filter(flight => {
    if (filter === 'all') return true
    if (filter === 'active') return flight.status === 'scheduled'
    if (filter === 'delayed') return flight.status === 'delayed'
    if (filter === 'completed') return flight.status === 'completed'
    return true
  })

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  // Add this helper to get available crew
  const availableCrew = crew.filter((c: Crew) => c.rest_compliant && c.current_duty < 8);

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
        {/* Monitoring Controls */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Activity className={`h-5 w-5 mr-2 ${isMonitoring ? 'text-green-600' : 'text-gray-400'}`} />
                <h2 className="text-lg font-medium text-gray-900">Disruption Monitoring</h2>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                  isMonitoring ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {isMonitoring ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={triggerManualCheck}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Check Now
                </button>
                {isMonitoring ? (
                  <button
                    onClick={stopMonitoring}
                    className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                  >
                    <Square className="h-4 w-4 mr-1" />
                    Stop
                  </button>
                ) : (
                  <button
                    onClick={startMonitoring}
                    className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Start
                  </button>
                )}
              </div>
            </div>
          </div>
          {monitoringStatus && (
            <div className="px-6 py-4 bg-gray-50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Last Check:</span>
                  <span className="ml-2 font-medium">
                    {new Date(monitoringStatus.lastCheck).toLocaleTimeString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Active Alerts:</span>
                  <span className="ml-2 font-medium">{monitoringStatus.activeAlerts}</span>
                </div>
                <div>
                  <span className="text-gray-600">Flights Monitored:</span>
                  <span className="ml-2 font-medium">{monitoringStatus.flightsMonitored}</span>
                </div>
                <div>
                  <span className="text-gray-600">Crew Issues:</span>
                  <span className="ml-2 font-medium">{monitoringStatus.crewComplianceIssues}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          {/* Active Flights - navigates to flights page */}
          <div
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:bg-gray-100"
            onClick={() => router.push('/dashboard/flights')}
          >
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
          {/* Crew Available - navigates to crew page */}
          <div
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:bg-gray-100"
            onClick={() => router.push('/dashboard/crew')}
          >
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Crew Available</p>
                <p className="text-2xl font-bold text-gray-900">{availableCrew.length}</p>
              </div>
            </div>
          </div>
          {/* Active Alerts - navigates to alerts page */}
          <div
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:bg-gray-100"
            onClick={() => router.push('/dashboard/alerts')}
          >
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
              </div>
            </div>
          </div>
          {/* Predictive Analysis - navigates to predictions page */}
          <div
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:bg-gray-100"
            onClick={() => router.push('/dashboard/predictions')}
          >
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">AI Predictions</p>
                <p className="text-2xl font-bold text-gray-900">24</p>
              </div>
            </div>
          </div>
          {/* Avg Response - navigates to response stats page */}
          <div
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:bg-gray-100"
            onClick={() => router.push('/dashboard/response')}
          >
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-indigo-600" />
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
            {/* Disruption Summary */}
            {disruptionSummary.length > 0 && (
              <div className="bg-white rounded-lg shadow mb-6">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Disruption Summary</h2>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {disruptionSummary.slice(0, 5).map((summary) => (
                      <div
                        key={summary.flight_id}
                        className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-100 transition"
                        onClick={() => router.push(`/dashboard/flights?flight_id=${summary.flight_id}`)}
                        tabIndex={0}
                        role="button"
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') router.push(`/dashboard/flights?flight_id=${summary.flight_id}`) }}
                        aria-label={`Go to flight ${summary.tail_number}`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{summary.tail_number}</span>
                            <span className="text-sm text-gray-500">
                              {summary.origin} → {summary.destination}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {summary.alerts.length} alerts • {summary.crewIssues.length} crew issues
                            {summary.hasBackupPlans && ' • Has backup plans'}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(summary.severity)}`}>
                          {summary.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

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