'use client'

import { useState, useEffect } from 'react'
import { DisruptionPrediction, PredictionFactor } from '@/lib/hybrid-ai-engine'
import { AlertTriangle, TrendingUp, Clock, Target, CheckCircle, XCircle, AlertCircle, Info, Brain, Zap, Cloud } from 'lucide-react'
import { format } from 'date-fns'
import { getWeatherSourceInfo } from '@/lib/weather-config'

interface PredictiveAnalysisPanelProps {
  flightId?: string
  showAllFlights?: boolean
}

export default function PredictiveAnalysisPanel({ flightId, showAllFlights = false }: PredictiveAnalysisPanelProps) {
  const [predictions, setPredictions] = useState<DisruptionPrediction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedPrediction, setExpandedPrediction] = useState<string | null>(null)

  useEffect(() => {
    fetchPredictions()
  }, [flightId, showAllFlights])

  const fetchPredictions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const url = flightId 
        ? `/api/predictions?flight_id=${flightId}`
        : '/api/predictions'
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch AI predictions')
      }
      
      const data = await response.json()
      const predictionsData = flightId ? [data.prediction] : data.predictions
      setPredictions(predictionsData || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRiskLevelIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return <XCircle className="h-4 w-4" />
      case 'high':
        return <AlertTriangle className="h-4 w-4" />
      case 'medium':
        return <AlertCircle className="h-4 w-4" />
      case 'low':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getDisruptionTypeColor = (type: string) => {
    switch (type) {
      case 'weather':
        return 'bg-blue-100 text-blue-800'
      case 'crew':
        return 'bg-yellow-100 text-yellow-800'
      case 'mechanical':
        return 'bg-red-100 text-red-800'
      case 'airport':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`
  }

  const formatRiskScore = (score: number) => {
    return `${Math.round(score * 100)}%`
  }

  const weatherSourceInfo = getWeatherSourceInfo()

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">AI Predictive Analysis</h2>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">AI Predictive Analysis</h2>
        </div>
        <div className="p-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-medium text-gray-900">AI Predictive Analysis</h2>
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
              Hybrid AI v1.0.0
            </span>
          </div>
          <div className="flex items-center space-x-3">
            {/* Weather Data Source Indicator */}
            <div className="flex items-center space-x-1 text-xs">
              <Cloud className="h-3 w-3 text-blue-600" />
              <span className="text-gray-600">{weatherSourceInfo.icon} {weatherSourceInfo.source}</span>
            </div>
            <button
              onClick={fetchPredictions}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        {predictions.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">No AI predictions available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {predictions.map((prediction) => (
              <div
                key={prediction.flight_id}
                className={`border rounded-lg p-4 ${getRiskLevelColor(prediction.risk_level)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      {getRiskLevelIcon(prediction.risk_level)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium">
                          Flight {prediction.flight_id.slice(0, 8)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(prediction.risk_level)}`}>
                          {prediction.risk_level.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDisruptionTypeColor(prediction.predicted_disruption_type)}`}>
                          {prediction.predicted_disruption_type.toUpperCase()}
                        </span>
                        <div className="flex items-center space-x-1 text-xs text-purple-600">
                          <Brain className="h-3 w-3" />
                          <span>{formatConfidence(prediction.model_confidence)}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">AI Risk Score:</span>
                          <span className="ml-1 font-medium">{formatRiskScore(prediction.risk_score)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Model Confidence:</span>
                          <span className="ml-1 font-medium">{formatConfidence(prediction.model_confidence)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Predicted:</span>
                          <span className="ml-1 font-medium">
                            {format(new Date(prediction.predicted_time), 'MMM dd, HH:mm')}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Model Version:</span>
                          <span className="ml-1 font-medium text-xs">{prediction.ai_model_version}</span>
                        </div>
                      </div>

                      {/* AI Explanation */}
                      <div className="bg-gray-50 rounded p-3 mb-3">
                        <div className="flex items-start space-x-2">
                          <Zap className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700">{prediction.explanation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedPrediction(expandedPrediction === prediction.flight_id ? null : prediction.flight_id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {expandedPrediction === prediction.flight_id ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      <Info className="h-4 w-4" />
                    )}
                  </button>
                </div>
                
                {expandedPrediction === prediction.flight_id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {/* Risk Factors with AI Contribution */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">AI Risk Factors</h4>
                      <div className="space-y-2">
                        {prediction.factors.map((factor, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                              <span className="capitalize">{factor.factor}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${factor.value * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-600 w-8">{formatRiskScore(factor.value)}</span>
                              <span className="text-xs text-purple-600">AI: {formatRiskScore(factor.ai_contribution)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Feature Importance */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">AI Feature Importance</h4>
                      <div className="space-y-1">
                        {Object.entries(prediction.feature_importance)
                          .sort(([,a], [,b]) => b - a)
                          .slice(0, 5)
                          .map(([feature, importance], index) => (
                            <div key={index} className="flex items-center justify-between text-xs">
                              <span className="text-gray-600 capitalize">{feature.replace(/_/g, ' ')}</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-12 bg-gray-200 rounded-full h-1">
                                  <div 
                                    className="bg-purple-600 h-1 rounded-full" 
                                    style={{ width: `${importance * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-purple-600 w-8">{formatRiskScore(importance)}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Factor Descriptions */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">AI Analysis Details</h4>
                      <div className="space-y-1">
                        {prediction.factors.map((factor, index) => (
                          <p key={index} className="text-xs text-gray-600">
                            <span className="font-medium capitalize">{factor.factor}:</span> {factor.description}
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* AI Recommendations */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">AI Recommendations</h4>
                      <div className="space-y-1">
                        {prediction.recommended_actions.map((action, index) => (
                          <div key={index} className="flex items-start space-x-2 text-xs">
                            <Brain className="h-3 w-3 text-purple-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 