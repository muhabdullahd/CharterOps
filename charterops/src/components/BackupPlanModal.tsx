'use client'

import { useState, useEffect } from 'react'
import { supabase, Backup, Flight, Crew } from '@/lib/supabase'
import { X, Plane, Users, MapPin } from 'lucide-react'

interface BackupPlanModalProps {
  flight: Flight
  isOpen: boolean
  onClose: () => void
}

export default function BackupPlanModal({ flight, isOpen, onClose }: BackupPlanModalProps) {
  const [backup, setBackup] = useState<Partial<Backup>>({
    flight_id: flight.id,
    crew_ids: [],
    aircraft_id: '',
    fallback_airport: '',
    activated: false
  })
  const [availableCrew, setAvailableCrew] = useState<Crew[]>([])
  const [loading, setLoading] = useState(false)

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
      .is('assigned_flight', null)
    
    if (data) {
      setAvailableCrew(data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data } = await supabase
      .from('backups')
      .insert([backup])
      .select()

    if (data) {
      onClose()
      // Reset form
      setBackup({
        flight_id: flight.id,
        crew_ids: [],
        aircraft_id: '',
        fallback_airport: '',
        activated: false
      })
    }
    setLoading(false)
  }

  const handleActivateBackup = async () => {
    setLoading(true)
    
    const { data } = await supabase
      .from('backups')
      .update({ activated: true })
      .eq('flight_id', flight.id)
      .select()

    if (data) {
      // Create alert for backup activation
      await supabase
        .from('alerts')
        .insert([{
          flight_id: flight.id,
          type: 'mechanical',
          message: 'Backup plan activated for this flight',
          triggered_at: new Date().toISOString(),
          resolved: false
        }])
    }
    
    setLoading(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Backup Plan for {flight.tail_number}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Aircraft Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Plane className="h-4 w-4 inline mr-2" />
              Backup Aircraft
            </label>
            <select
              value={backup.aircraft_id}
              onChange={(e) => setBackup({ ...backup, aircraft_id: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select backup aircraft</option>
              <option value="N550BA">N550BA (G550)</option>
              <option value="N550BB">N550BB (G550)</option>
              <option value="N550BC">N550BC (G550)</option>
            </select>
          </div>

          {/* Crew Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="h-4 w-4 inline mr-2" />
              Backup Crew
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-3">
              {availableCrew.map((member) => (
                <label key={member.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={backup.crew_ids?.includes(member.id)}
                    onChange={(e) => {
                      const crewIds = e.target.checked
                        ? [...(backup.crew_ids || []), member.id]
                        : backup.crew_ids?.filter(id => id !== member.id) || []
                      setBackup({ ...backup, crew_ids: crewIds })
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    {member.name} ({member.current_duty.toFixed(1)}h duty)
                  </span>
                </label>
              ))}
              {availableCrew.length === 0 && (
                <p className="text-sm text-gray-500">No available crew members</p>
              )}
            </div>
          </div>

          {/* Fallback Airport */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="h-4 w-4 inline mr-2" />
              Fallback Airport
            </label>
            <input
              type="text"
              value={backup.fallback_airport}
              onChange={(e) => setBackup({ ...backup, fallback_airport: e.target.value })}
              placeholder="ICAO code (e.g., KJFK)"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

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
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Backup Plan'}
            </button>
            <button
              type="button"
              onClick={handleActivateBackup}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Activating...' : 'Activate Backup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 