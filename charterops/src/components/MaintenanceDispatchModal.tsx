'use client'

import { useState, useEffect } from 'react'
import { X, Wrench, Users, Clock, CheckCircle } from 'lucide-react'
import { supabase, Crew } from '@/lib/supabase'

interface MaintenanceDispatchModalProps {
  alertId: string
  isOpen: boolean
  onClose: () => void
  onDispatch: (alertId: string, crewId: string) => void
}

export default function MaintenanceDispatchModal({ 
  alertId, 
  isOpen, 
  onClose, 
  onDispatch 
}: MaintenanceDispatchModalProps) {
  const [availableCrew, setAvailableCrew] = useState<Crew[]>([])
  const [selectedCrew, setSelectedCrew] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [maintenanceTypes] = useState([
    { id: 'engine', name: 'Engine Issue', description: 'Engine performance or mechanical problems', estimatedHours: 2 },
    { id: 'avionics', name: 'Avionics Problem', description: 'Navigation or communication system issues', estimatedHours: 1.5 },
    { id: 'landing_gear', name: 'Landing Gear Issue', description: 'Landing gear malfunction or warning', estimatedHours: 3 },
    { id: 'hydraulics', name: 'Hydraulic System', description: 'Hydraulic pressure or fluid issues', estimatedHours: 2.5 },
    { id: 'electrical', name: 'Electrical System', description: 'Electrical power or circuit problems', estimatedHours: 1 }
  ])
  const [selectedMaintenance, setSelectedMaintenance] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      fetchAvailableCrew()
      setSelectedCrew('')
      setSelectedMaintenance('')
    } else {
      setSelectedCrew('')
      setSelectedMaintenance('')
    }
  }, [isOpen])

  const fetchAvailableCrew = async () => {
    const { data } = await supabase
      .from('crew')
      .select('*')
      .eq('rest_compliant', true)
      .lt('current_duty', 8)
      .eq('role', 'maintenance')
      .order('current_duty', { ascending: true })
    
    if (data) {
      setAvailableCrew(data)
    }
  }

  const handleDispatch = async () => {
    if (!selectedCrew || !selectedMaintenance) return
    
    setLoading(true)
    try {
      await onDispatch(alertId, selectedCrew)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const getMaintenanceType = () => {
    return maintenanceTypes.find(m => m.id === selectedMaintenance)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wrench className="h-6 w-6 text-red-600" />
              <h2 className="text-lg font-medium text-gray-900">Dispatch Maintenance Crew</h2>
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
          {/* Maintenance Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Maintenance Type
            </label>
            <div className="grid grid-cols-1 gap-3">
              {maintenanceTypes.map((maintenance) => (
                <label
                  key={maintenance.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedMaintenance === maintenance.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="maintenanceType"
                    value={maintenance.id}
                    checked={selectedMaintenance === maintenance.id}
                    onChange={(e) => setSelectedMaintenance(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">{maintenance.name}</h3>
                      <span className="text-sm text-gray-500">{maintenance.estimatedHours}h</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{maintenance.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Available Crew Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Users className="h-4 w-4 inline mr-2" />
              Available Maintenance Crew
            </label>
            {availableCrew.length === 0 ? (
              <div className="text-center py-8 border border-gray-200 rounded-lg">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No available maintenance crew</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {availableCrew.map((member) => (
                  <label
                    key={member.id}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedCrew === String(member.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="crewMember"
                      value={String(member.id)}
                      checked={selectedCrew === String(member.id)}
                      onChange={(e) => setSelectedCrew(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{member.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {member.current_duty}h duty
                          </span>
                          <span className="flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {member.rest_compliant ? 'Rest Compliant' : 'Rest Required'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Maintenance Details */}
          {selectedMaintenance && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Maintenance Details</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Type:</strong> {getMaintenanceType()?.name}</p>
                <p><strong>Estimated Duration:</strong> {getMaintenanceType()?.estimatedHours} hours</p>
                <p><strong>Priority:</strong> High (Safety Critical)</p>
                <p><strong>Required Tools:</strong> Standard maintenance kit</p>
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
              onClick={handleDispatch}
              disabled={!selectedCrew || !selectedMaintenance || loading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Dispatching...' : 'Dispatch Maintenance Crew'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 