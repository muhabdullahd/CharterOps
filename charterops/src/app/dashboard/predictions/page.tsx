'use client'

import { useEffect, useState } from 'react'
import { BarChart3, TrendingUp, AlertTriangle, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { DisruptionPrediction as BaseDisruptionPrediction } from '@/lib/hybrid-ai-engine'

// Extend the type locally to allow optional origin/destination
interface DisruptionPredictionWithRoute extends BaseDisruptionPrediction {
  origin?: string;
  destination?: string;
}

export default function PredictionsPage() {
  const router = useRouter();
  const [predictions, setPredictions] = useState<DisruptionPredictionWithRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPredictions = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/predictions');
        if (!response.ok) throw new Error('Failed to fetch predictions');
        const data = await response.json();
        setPredictions(data.predictions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchPredictions();
  }, []);

  function getRiskLevelColor(riskLevel: string) {
    switch (riskLevel) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Predictive Analysis</h1>
          </div>
          <p className="text-gray-600">
            AI-powered disruption prediction for proactive flight operations management
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition" onClick={() => router.push('/dashboard/predictions?filter=all')}>
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Predictions</p>
                <p className="text-2xl font-bold text-gray-900">24</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition" onClick={() => router.push('/dashboard/predictions?filter=high')}>
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">High Risk</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition" onClick={() => router.push('/dashboard/predictions?filter=medium')}>
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Medium Risk</p>
                <p className="text-2xl font-bold text-gray-900">7</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition" onClick={() => router.push('/dashboard/predictions?filter=accuracy')}>
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Accuracy</p>
                <p className="text-2xl font-bold text-gray-900">87%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Predictive Analysis Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">All Flights Predictive Analysis</h2>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading predictions...</div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">{error}</div>
              ) : predictions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No predictions available.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flight</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disruption Type</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model Confidence</th>
                        <th className="px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {predictions.map((prediction) => (
                        <tr key={prediction.flight_id}>
                          <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900">
                            {prediction.origin && prediction.destination
                              ? `Flight ${prediction.origin} to ${prediction.destination}`
                              : `Flight ${prediction.flight_id.slice(0, 8)}`}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(prediction.risk_level)}`}>
                              {prediction.risk_level.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">{(prediction.risk_score * 100).toFixed(1)}%</td>
                          <td className="px-4 py-2 whitespace-nowrap">{prediction.predicted_disruption_type.toUpperCase()}</td>
                          <td className="px-4 py-2 whitespace-nowrap">{prediction.model_confidence ? `${(prediction.model_confidence * 100).toFixed(0)}%` : '-'}</td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <button
                              className="text-blue-600 hover:underline text-sm"
                              onClick={() => router.push(`/dashboard/flights?flight_id=${prediction.flight_id}`)}
                            >
                              View Analysis
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* How it Works */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">How It Works</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Analyzes historical flight data and patterns</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Evaluates weather conditions and forecasts</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Monitors crew duty hours and compliance</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Assesses aircraft maintenance history</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Provides actionable recommendations</p>
                </div>
              </div>
            </div>

            {/* Risk Levels */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Levels</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium">Critical</span>
                  </div>
                  <span className="text-xs text-gray-500">80%+ risk</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-sm font-medium">High</span>
                  </div>
                  <span className="text-xs text-gray-500">60-79% risk</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium">Medium</span>
                  </div>
                  <span className="text-xs text-gray-500">40-59% risk</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Low</span>
                  </div>
                  <span className="text-xs text-gray-500">&lt;40% risk</span>
                </div>
              </div>
            </div>

            {/* Recent Accuracy */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Accuracy</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Last 24 hours</span>
                  <span className="font-medium">92%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Last 7 days</span>
                  <span className="font-medium">87%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Last 30 days</span>
                  <span className="font-medium">84%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 