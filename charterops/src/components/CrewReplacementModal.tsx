import { useState, useEffect } from 'react'
import { X, Users, Clock, CheckCircle } from 'lucide-react'
import { supabase, Crew } from '@/lib/supabase'

interface CrewReplacementModalProps {
  atRiskCrew: Crew
  isOpen: boolean
  onClose: () => void
  onReplace: (atRiskCrewId: string, replacementCrewId: string) => Promise<void>
}

export default function CrewReplacementModal({
  atRiskCrew,
  isOpen,
  onClose,
  onReplace
}: CrewReplacementModalProps) {
  const [availableCrew, setAvailableCrew] = useState<Crew[]>([])
  const [selectedCrew, setSelectedCrew] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchAvailableCrew()
      setSelectedCrew('')
      setError(null)
    }
  }, [isOpen])

  const fetchAvailableCrew = async () => {
    const { data } = await supabase
      .from('crew')
      .select('*')
      .eq('rest_compliant', true)
      .lte('current_duty', 8)
      .order('current_duty', { ascending: true })
    if (data) setAvailableCrew(data.filter(c => c.id !== atRiskCrew.id))
  }

  const handleReplace = async () => {
    if (!selectedCrew) return
    setLoading(true)
    setError(null)
    try {
      await onReplace(atRiskCrew.id, selectedCrew)
      onClose()
    } catch {
      // handle error if needed
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-yellow-600" />
            <h2 className="text-lg font-medium text-gray-900">Replace Crew Member</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              At-Risk Crew: <span className="font-semibold">{atRiskCrew.name}</span> ({atRiskCrew.current_duty}h)
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Users className="h-4 w-4 inline mr-2" />
              Available Replacement Crew
            </label>
            {availableCrew.length === 0 ? (
              <div className="text-center py-8 border border-gray-200 rounded-lg">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No available crew for replacement</p>
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
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-green-600" />
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
                            Rest Compliant
                          </span>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
          {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              onClick={handleReplace}
              disabled={loading || !selectedCrew}
            >
              {loading ? 'Replacing...' : 'Replace Crew'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 