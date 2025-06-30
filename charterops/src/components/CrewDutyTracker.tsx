'use client'

import { useState, useEffect } from 'react'
import { supabase, Crew } from '@/lib/supabase'
import { Users, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import CrewReplacementModal from './CrewReplacementModal'

export default function CrewDutyTracker() {
  const [crew, setCrew] = useState<Crew[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedCrew, setSelectedCrew] = useState<Crew | null>(null)

  useEffect(() => {
    fetchCrew()
  }, [])

  const fetchCrew = async () => {
    const { data } = await supabase
      .from('crew')
      .select('*')
      .order('name')
    if (data) {
      setCrew(data)
    }
    setLoading(false)
  }

  const getDutyStatus = (dutyHours: number) => {
    if (dutyHours <= 8) return { status: 'compliant', color: 'text-green-600', bg: 'bg-green-50' }
    if (dutyHours <= 10) return { status: 'warning', color: 'text-yellow-600', bg: 'bg-yellow-50' }
    return { status: 'violation', color: 'text-red-600', bg: 'bg-red-50' }
  }

  const getDutyIcon = (dutyHours: number) => {
    if (dutyHours <= 8) return <CheckCircle className="h-4 w-4" />
    return <AlertTriangle className="h-4 w-4" />
  }

  // Only show yellow/red crew
  const atRiskCrew = crew.filter(member => member.current_duty > 8)

  const handleCardClick = (member: Crew) => {
    setSelectedCrew(member)
    setShowModal(true)
  }

  const handleReplace = async (atRiskCrewId: string, replacementCrewId: string) => {
    // Remove at-risk crew from their flight
    await supabase
      .from('crew')
      .update({ assigned_flight: null })
      .eq('id', atRiskCrewId)
    // Assign replacement crew to the same flight
    const atRisk = crew.find(c => c.id === atRiskCrewId)
    if (atRisk && atRisk.assigned_flight) {
      await supabase
        .from('crew')
        .update({ assigned_flight: atRisk.assigned_flight })
        .eq('id', replacementCrewId)
    }
    setShowModal(false)
    setSelectedCrew(null)
    fetchCrew()
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Crew Duty Tracker</h2>
        </div>
        <div className="p-4">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Crew Duty Tracker</h2>
          <Users className="h-5 w-5 text-gray-400" />
        </div>
      </div>
      <div className="p-4">
        {atRiskCrew.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">No at-risk crew members</p>
          </div>
        ) : (
          <div className="space-y-3">
            {atRiskCrew.map((member) => {
              const dutyStatus = getDutyStatus(member.current_duty)
              return (
                <div
                  key={member.id}
                  className={`border rounded-lg p-4 cursor-pointer hover:shadow-lg transition ${dutyStatus.bg}`}
                  onClick={() => handleCardClick(member)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Replace crew member ${member.name}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={dutyStatus.color}>
                        {getDutyIcon(member.current_duty)}
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{member.name}</h3>
                        <p className="text-xs text-gray-500">ID: {member.id.slice(0, 8)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className={`text-sm font-medium ${dutyStatus.color}`}>
                          {member.current_duty.toFixed(1)}h
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {dutyStatus.status === 'warning' ? 'Approaching Limit' : 'Duty Violation'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>Rest Compliant: {member.rest_compliant ? 'Yes' : 'No'}</span>
                      <span>Assigned: {member.assigned_flight ? 'Yes' : 'No'}</span>
                    </div>
                    {member.current_duty > 8 && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-xs text-red-700">
                          ⚠️ Duty hours exceed FAA Part 135 limits. Immediate rest required.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Yellow: Warning (8-10h)</p>
            <p>• Red: Violation (&gt;10h)</p>
          </div>
        </div>
      </div>
      {/* Replacement Modal */}
      {showModal && selectedCrew && (
        <CrewReplacementModal
          atRiskCrew={selectedCrew}
          isOpen={showModal}
          onClose={() => { setShowModal(false); setSelectedCrew(null); }}
          onReplace={handleReplace}
        />
      )}
    </div>
  )
} 