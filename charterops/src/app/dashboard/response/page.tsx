"use client"

import { useRouter } from 'next/navigation'

// Demo data
const responseStats = {
  average: 2.3,
  min: 1.1,
  max: 4.7,
  values: [2.1, 2.3, 1.8, 2.7, 3.2, 1.1, 4.7, 2.9, 2.0, 2.5],
}

export default function ResponseStatsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl mx-auto">
        <button
          className="mb-8 px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
          onClick={() => router.push('/dashboard')}
        >
          Back to Dashboard
        </button>
        <h2 className="text-2xl font-bold mb-6 text-center">Response Time Statistics</h2>
        <div className="mb-8 grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-4 shadow">
            <div className="text-sm text-gray-500">Average</div>
            <div className="text-2xl font-bold text-blue-700">{responseStats.average}m</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 shadow">
            <div className="text-sm text-gray-500">Min</div>
            <div className="text-2xl font-bold text-green-700">{responseStats.min}m</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 shadow">
            <div className="text-sm text-gray-500">Max</div>
            <div className="text-2xl font-bold text-red-700">{responseStats.max}m</div>
          </div>
        </div>
        <h3 className="text-lg font-semibold mb-4 text-center">Response Time (Last 10 Events)</h3>
        <div className="flex items-end space-x-2 h-40 mb-8">
          {responseStats.values.map((v, i) => (
            <div key={i} className="flex flex-col items-center">
              <div
                className="w-6 rounded-t bg-blue-400"
                style={{ height: `${v * 30}px` }}
                title={`${v}m`}
              ></div>
              <span className="text-xs mt-1 text-gray-500">{v}m</span>
            </div>
          ))}
        </div>
        <div className="text-center text-gray-400 text-sm">* Demo data only</div>
      </div>
    </div>
  )
} 