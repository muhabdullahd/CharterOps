'use client'

import { useState, useEffect } from 'react'
import { X, Users, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { supabase, Crew } from '@/lib/supabase'

interface BackupCrewModalProps {
  alertId: string
  isOpen: boolean
  onClose: () => void
  onAssign: (alertId: string, crewIds: string[]) => void
}

export default function BackupCrewModal({ 
  alertId, 
  isOpen, 
  onClose, 
  onAssign 
}: BackupCrewModalProps) {
  const [availableCrew, setAvailableCrew] = useState<Crew[]>([])
  const [selectedCrew, setSelectedCrew] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [crewRoles] = useState([
    { id: 'pilot', name: 'Pilot', required: 1, description: 'Primary aircraft pilot' },
    { id: 'copilot', name: 'Co-Pilot', required: 1, description: 'Secondary pilot for safety' },
    { id: 'flight_attendant', name: 'Flight Attendant', required: 1, description: 'Cabin crew for passenger service' }
  ])

  useEffect(() => {
    if (isOpen) {
      fetchAvailableCrew()
    }
  }, [isOpen])

  const fetchAvailableCrew = async () => {
    const { data } = await supabase
      .from('crew')
      .select('*')
      .eq('rest_compliant', true)
      .lt('current_duty', 8)
      .is('assigned_flight', null)
      .order('current_duty', { ascending: true })
    
    if (data) {
      setAvailableCrew(data)
    }
  }

  const handleAssign = async () => {
    if (selectedCrew.length === 0) return
    
    setLoading(true)
    try {
      await onAssign(alertId, selectedCrew)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const toggleCrewSelection = (crewId: string) => {
    setSelectedCrew(prev => 
      prev.includes(crewId) 
        ? prev.filter(id => id !== crewId)
        : [...prev, crewId]
    )
  }

  const getDutyStatus = (dutyHours: number) => {
    if (dutyHours <= 6) return { status: 'Excellent', color: 'text-green-600', bg: 'bg-green-50' }
    if (dutyHours <= 8) return { status: 'Good', color: 'text-blue-600', bg: 'bg-blue-50' }
    return { status: 'Limited', color: 'text-yellow-600', bg: 'bg-yellow-50' }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-yellow-600" />
              <h2 className="text-lg font-medium text-gray-900">Assign Backup Crew</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Crew Requirements */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="font-medium text-gray-900 mb-3">Crew Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {crewRoles.map((role) => (
                <div key={role.id} className="bg-white p-3 rounded border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{role.name}</h4>
                    <span className="text-sm text-gray-500">{role.required} required</span>
                  </div>
                  <p className="text-sm text-gray-600">{role.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Available Crew */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                <Users className="h-4 w-4 inline mr-2" />
                Available Crew Members
              </label>
              <span className="text-sm text-gray-500">
                {selectedCrew.length} selected
              </span>
            </div>
            
            {availableCrew.length === 0 ? (
              <div className="text-center py-8 border border-gray-200 rounded-lg">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No available crew members</p>
                <p className="text-sm text-gray-400 mt-1">All crew are either on duty or need rest</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {availableCrew.map((member) => {
                  const dutyStatus = getDutyStatus(member.current_duty)
                  const isSelected = selectedCrew.includes(member.id)
                  
                  return (
                    <label
                      key={member.id}
                      className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCrewSelection(member.id)}
                        className="sr-only"
                      />
                      <div className="flex items-start space-x-3 w-full">
                        <div className="flex-shrink-0 mt-1">
                          <div className={`w-4 h-4 border-2 rounded ${
                            isSelected 
                              ? 'bg-yellow-500 border-yellow-500' 
                              : 'border-gray-300'
                          }`}>
                            {isSelected && (
                              <CheckCircle className="h-3 w-3 text-white" />
                            )}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-gray-900 truncate">{member.name}</h3>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${dutyStatus.color} ${dutyStatus.bg}`}>
                              {dutyStatus.status}
                            </span>
                          </div>
                          
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-3 w-3" />
                              <span>{member.current_duty}h duty time</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {member.rest_compliant ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : (
                                <AlertTriangle className="h-3 w-3 text-red-500" />
                              )}
                              <span className={member.rest_compliant ? 'text-green-600' : 'text-red-600'}>
                                {member.rest_compliant ? 'Rest Compliant' : 'Rest Required'}
                              </span>
                            </div>
                            
                            {member.current_duty > 6 && (
                              <div className="flex items-center space-x-2">
                                <AlertTriangle className="h-3 w-3 text-yellow-500" />
                                <span className="text-yellow-600">Approaching duty limit</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          {/* Assignment Summary */}
          {selectedCrew.length > 0 && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="font-medium text-gray-900 mb-2">Assignment Summary</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Selected Crew:</strong> {selectedCrew.length} members</p>
                <p><strong>Estimated Availability:</strong> Immediate</p>
                <p><strong>Duty Compliance:</strong> All selected crew are rest compliant</p>
                <p><strong>Next Steps:</strong> Crew will be notified and briefed on flight details</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAssign}
              disabled={selectedCrew.length === 0 || loading}
              className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Assigning...' : 'Assign Backup Crew'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 