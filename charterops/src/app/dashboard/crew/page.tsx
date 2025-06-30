"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Crew } from '@/lib/supabase'

export default function CrewPage() {
  const [crew, setCrew] = useState<Crew[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchCrew = async () => {
      const { data } = await supabase
        .from('crew')
        .select('*')
        .order('name', { ascending: true })
      setCrew(data || [])
      setLoading(false)
    }
    fetchCrew()
  }, [])

  const availableCrew = crew.filter((c: Crew) => c.rest_compliant && c.current_duty < 8)

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl mx-auto">
        <button
          className="mb-8 px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
          onClick={() => router.push('/dashboard')}
        >
          Back to Dashboard
        </button>
        <h2 className="text-2xl font-bold mb-6 text-center">Available Crew Members</h2>
        <div className="overflow-x-auto rounded-lg shadow border border-gray-200">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">Duty Hours</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={2} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
              ) : availableCrew.length === 0 ? (
                <tr><td colSpan={2} className="px-6 py-4 text-center text-gray-500">No available crew members.</td></tr>
              ) : (
                availableCrew.map((member: Crew) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 border-b text-gray-900 font-medium">{member.name}</td>
                    <td className="px-6 py-4 border-b text-gray-700">{member.current_duty}h</td>
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