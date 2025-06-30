'use client'

import { useEffect, useState } from 'react'
import { supabase, Crew } from '@/lib/supabase'
import { Users, Clock, AlertTriangle, CheckCircle, Activity, TrendingUp, UserCheck } from 'lucide-react'

export default function CrewDutyTracker() {
  const [crew, setCrew] = useState<Crew[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCrew()
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('crew_tracker')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crew' }, () => {
        fetchCrew()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

  const fetchCrew = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('crew')
      .select('*')
      .order('name', { ascending: true })
    
    if (data) setCrew(data)
    setLoading(false)
  }

  const getCrewStatusColor = (crewMember: Crew) => {
    if (!crewMember.rest_compliant) return 'text-red-600 bg-red-50 border-red-200'
    if (crewMember.current_duty >= 8) return 'text-orange-600 bg-orange-50 border-orange-200'
    if (crewMember.current_duty >= 6) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-green-600 bg-green-50 border-green-200'
  }

  const getCrewStatusIcon = (crewMember: Crew) => {
    if (!crewMember.rest_compliant) return <AlertTriangle className="h-4 w-4" />
    if (crewMember.current_duty >= 8) return <Clock className="h-4 w-4" />
    if (crewMember.current_duty >= 6) return <Activity className="h-4 w-4" />
    return <CheckCircle className="h-4 w-4" />
  }

  const getCrewStatusText = (crewMember: Crew) => {
    if (!crewMember.rest_compliant) return 'Not Rest Compliant'
    if (crewMember.current_duty >= 8) return 'At Duty Limit'
    if (crewMember.current_duty >= 6) return 'High Duty Hours'
    return 'Available'
  }

  const getDutyProgress = (hours: number) => {
    const maxHours = 10
    const percentage = Math.min((hours / maxHours) * 100, 100)
    return percentage
  }

  const getDutyProgressColor = (hours: number) => {
    if (hours >= 8) return 'bg-red-500'
    if (hours >= 6) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const availableCrew = crew.filter(c => c.rest_compliant && c.current_duty < 8)
  const unavailableCrew = crew.filter(c => !c.rest_compliant || c.current_duty >= 8)
  const averageDutyHours = crew.length > 0 ? crew.reduce((sum, c) => sum + c.current_duty, 0) / crew.length : 0

  if (loading) {
    return (
      <div className="card-modern">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-2 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card-modern overflow-hidden">
      {/* Header with gradient */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="relative">
              <Users className="h-6 w-6 mr-3" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-300 rounded-full pulse-ring"></div>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Crew Duty Tracker</h2>
              <p className="text-blue-100 text-sm">Real-time crew availability monitoring</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{availableCrew.length}</div>
            <div className="text-xs text-blue-100 uppercase tracking-wide">Available</div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <UserCheck className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-lg font-bold text-green-600">{availableCrew.length}</span>
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Available</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <AlertTriangle className="h-4 w-4 text-red-600 mr-1" />
              <span className="text-lg font-bold text-red-600">{unavailableCrew.length}</span>
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Unavailable</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="h-4 w-4 text-blue-600 mr-1" />
              <span className="text-lg font-bold text-blue-600">{averageDutyHours.toFixed(1)}h</span>
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Avg Duty</div>
          </div>
        </div>
      </div>
      
      {/* Crew List */}
      <div className="max-h-80 overflow-y-auto">
        {crew.length === 0 ? (
          <div className="text-center py-12 px-6">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Crew Data</h3>
            <p className="text-gray-500 text-sm">Crew information will appear here when available</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {crew.map((crewMember, index) => (
              <div
                key={crewMember.id}
                className="card-modern p-4 hover:shadow-md transition-all duration-200 animate-in slide-in-from-left-2"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {crewMember.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{crewMember.name}</h3>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                        ID: {crewMember.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                  <span className={`status-badge border text-xs ${getCrewStatusColor(crewMember)}`}>
                    {getCrewStatusIcon(crewMember)}
                    <span className="ml-1.5 font-semibold">{getCrewStatusText(crewMember)}</span>
                  </span>
                </div>
                
                {/* Duty Hours Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 font-medium">Duty Hours</span>
                    <span className="font-semibold text-gray-900">
                      {crewMember.current_duty}h / 10h
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${getDutyProgressColor(crewMember.current_duty)}`}
                      style={{ width: `${getDutyProgress(crewMember.current_duty)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Additional Status Info */}
                <div className="mt-3 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center ${
                      crewMember.rest_compliant ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {crewMember.rest_compliant ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 mr-1" />
                      )}
                      <span className="font-medium">
                        {crewMember.rest_compliant ? 'Rest Compliant' : 'Not Compliant'}
                      </span>
                    </div>
                  </div>
                  {crewMember.current_duty >= 8 && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full font-medium">
                      Near Limit
                    </span>
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