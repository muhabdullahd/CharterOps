'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { supabase, Flight, Alert, Crew } from '@/lib/supabase'
import FlightCard from '@/components/FlightCard'
import AlertPanel from '@/components/AlertPanel'
import CrewDutyTracker from '@/components/CrewDutyTracker'
import { Plane, AlertTriangle, Users, Clock, Play, Square, RefreshCw, Activity, TrendingUp, BarChart3, CheckCircle } from 'lucide-react'
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
  const [isRefreshing, setIsRefreshing] = useState(false)
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
    setIsRefreshing(true)
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
        setIsRefreshing(false)
      }, 2000)
    } catch (error) {
      console.error('Error triggering manual check:', error)
      setIsRefreshing(false)
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
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  // Add this helper to get available crew
  const availableCrew = crew.filter((c: Crew) => c.rest_compliant && c.current_duty < 8);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading CharterOps...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <div>Please log in</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/50">
      {/* Enhanced Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="relative">
                <Plane className="h-8 w-8 text-blue-600 mr-3" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full pulse-ring"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  CharterOps
                </h1>
                <p className="text-sm text-gray-500">Flight Operations Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm text-gray-600 font-medium">{user.email}</span>
              </div>
              <button
                onClick={() => supabase.auth.signOut()}
                className="btn-danger text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Monitoring Controls */}
        <div className="card-modern mb-8 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="relative">
                  <Activity className={`h-6 w-6 mr-3 ${isMonitoring ? 'text-green-200' : 'text-gray-300'}`} />
                  {isMonitoring && (
                    <div className="absolute inset-0 rounded-full bg-green-400 opacity-25 animate-ping"></div>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Disruption Monitoring System</h2>
                  <p className="text-blue-100 text-sm">Real-time flight operations oversight</p>
                </div>
                <span className={`ml-4 px-3 py-1 rounded-full text-xs font-medium ${
                  isMonitoring ? 'bg-green-500/20 text-green-100 border border-green-400/30' : 'bg-gray-500/20 text-gray-200 border border-gray-400/30'
                }`}>
                  {isMonitoring ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={triggerManualCheck}
                  disabled={isRefreshing}
                  className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-all duration-200 border border-white/20 hover:border-white/30 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Checking...' : 'Check Now'}
                </button>
                {isMonitoring ? (
                  <button
                    onClick={stopMonitoring}
                    className="flex items-center px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-100 rounded-lg text-sm font-medium transition-all duration-200 border border-red-400/30 hover:border-red-400/50"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stop
                  </button>
                ) : (
                  <button
                    onClick={startMonitoring}
                    className="flex items-center px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-100 rounded-lg text-sm font-medium transition-all duration-200 border border-green-400/30 hover:border-green-400/50"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start
                  </button>
                )}
              </div>
            </div>
          </div>
          {monitoringStatus && (
            <div className="px-6 py-4 bg-gray-50/50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {new Date(monitoringStatus.lastCheck).toLocaleTimeString()}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Last Check</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 mb-1">{monitoringStatus.activeAlerts}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Active Alerts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">{monitoringStatus.flightsMonitored}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Flights Monitored</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600 mb-1">{monitoringStatus.crewComplianceIssues}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Crew Issues</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Active Flights */}
          <div
            className="card-modern card-hover cursor-pointer group overflow-hidden"
            onClick={() => router.push('/dashboard/flights')}
          >
            <div className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                  <Plane className="h-6 w-6 text-blue-600" />
                </div>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Active Flights</p>
                <p className="text-3xl font-bold text-gray-900">
                  {flights.filter(f => f.status === 'scheduled').length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Currently in operation</p>
              </div>
            </div>
          </div>

          {/* Crew Available */}
          <div
            className="card-modern card-hover cursor-pointer group overflow-hidden"
            onClick={() => router.push('/dashboard/crew')}
          >
            <div className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <BarChart3 className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Crew Available</p>
                <p className="text-3xl font-bold text-gray-900">{availableCrew.length}</p>
                <p className="text-xs text-gray-500 mt-1">Ready for assignment</p>
              </div>
            </div>
          </div>

          {/* Active Alerts */}
          <div
            className="card-modern card-hover cursor-pointer group overflow-hidden"
            onClick={() => router.push('/dashboard/alerts')}
          >
            <div className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-yellow-100 rounded-xl group-hover:bg-yellow-200 transition-colors">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                {alerts.length > 0 && (
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Active Alerts</p>
                <p className="text-3xl font-bold text-gray-900">{alerts.length}</p>
                <p className="text-xs text-gray-500 mt-1">Require attention</p>
              </div>
            </div>
          </div>

          {/* Avg Response */}
          <div
            className="card-modern card-hover cursor-pointer group overflow-hidden"
            onClick={() => router.push('/dashboard/response')}
          >
            <div className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Avg Response</p>
                <p className="text-3xl font-bold text-gray-900">2.3m</p>
                <p className="text-xs text-gray-500 mt-1">Response time</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Enhanced Disruption Summary */}
            {disruptionSummary.length > 0 && (
              <div className="card-modern mb-8">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Disruption Summary</h2>
                  <p className="text-sm text-gray-500 mt-1">Real-time overview of flight disruptions</p>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {disruptionSummary.slice(0, 5).map((summary) => (
                      <div key={summary.flight_id} className="card-modern p-4 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="font-semibold text-gray-900">{summary.tail_number}</span>
                              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {summary.origin} → {summary.destination}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span className="flex items-center">
                                <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
                                {summary.alerts.length} alerts
                              </span>
                              <span className="flex items-center">
                                <Users className="h-4 w-4 mr-1 text-yellow-500" />
                                {summary.crewIssues.length} crew issues
                              </span>
                              {summary.hasBackupPlans && (
                                <span className="flex items-center text-green-600">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Backup plans available
                                </span>
                              )}
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(summary.severity)}`}>
                            {summary.severity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Flight Filters */}
            <div className="card-modern mb-6">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Flight Operations</h2>
                <p className="text-sm text-gray-500 mt-1">Monitor and manage your fleet</p>
              </div>
              <div className="px-6 py-4">
                <div className="flex flex-wrap gap-2">
                  {['all', 'active', 'delayed', 'completed'].map((filterOption) => (
                    <button
                      key={filterOption}
                      onClick={() => setFilter(filterOption)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        filter === filterOption
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                      }`}
                    >
                      {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                      {filterOption === 'all' && (
                        <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                          {flights.length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Flight Cards */}
            <div className="space-y-4">
              {filteredFlights.map((flight, index) => (
                <div key={flight.id} className="slide-up-enter" style={{ animationDelay: `${index * 0.1}s` }}>
                  <FlightCard flight={flight} />
                </div>
              ))}
              {filteredFlights.length === 0 && (
                <div className="card-modern p-12 text-center">
                  <Plane className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium">No flights found</p>
                  <p className="text-gray-400 text-sm mt-1">Try adjusting your filter criteria</p>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Sidebar */}
          <div className="space-y-6">
            <AlertPanel alerts={alerts} />
            <CrewDutyTracker />
          </div>
        </div>
      </div>
    </div>
  )
} 