'use client'

import { useState, useEffect } from 'react'
import { X, Cloud, Wind, Eye, Thermometer, AlertTriangle, CheckCircle } from 'lucide-react'

interface WeatherInfoModalProps {
  origin: string
  destination: string
  isOpen: boolean
  onClose: () => void
}

interface WeatherData {
  airport: string
  visibility: number
  ceiling: number
  wind_speed: number
  wind_direction: number
  temperature: number
  conditions: string[]
  timestamp: string
  metar?: string
}

export default function WeatherInfoModal({ 
  origin, 
  destination, 
  isOpen, 
  onClose 
}: WeatherInfoModalProps) {
  const [weatherData, setWeatherData] = useState<{
    origin: WeatherData | null
    destination: WeatherData | null
  }>({ origin: null, destination: null })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchWeatherData = async () => {
      setLoading(true)
      try {
        // Simulate API call - in real implementation this would call AviationWeather.gov
        const mockWeatherData: Record<string, WeatherData> = {
          'KTEB': {
            airport: 'KTEB',
            visibility: 10,
            ceiling: 2500,
            wind_speed: 15,
            wind_direction: 270,
            temperature: 72,
            conditions: ['VFR'],
            timestamp: new Date().toISOString(),
            metar: 'KTEB 151555Z 27015KT 10SM FEW025 22/12 A3001'
          },
          'KLAX': {
            airport: 'KLAX',
            visibility: 0.5,
            ceiling: 200,
            wind_speed: 8,
            wind_direction: 180,
            temperature: 68,
            conditions: ['IFR', 'FOG'],
            timestamp: new Date().toISOString(),
            metar: 'KLAX 151555Z 18008KT 1/2SM FG OVC002 20/18 A2998'
          },
          'KJFK': {
            airport: 'KJFK',
            visibility: 8,
            ceiling: 1500,
            wind_speed: 22,
            wind_direction: 320,
            temperature: 75,
            conditions: ['MVFR'],
            timestamp: new Date().toISOString(),
            metar: 'KJFK 151555Z 32022G30KT 8SM BKN015 24/15 A2995'
          },
          'KSFO': {
            airport: 'KSFO',
            visibility: 3,
            ceiling: 800,
            wind_speed: 12,
            wind_direction: 240,
            temperature: 65,
            conditions: ['MVFR', 'MIST'],
            timestamp: new Date().toISOString(),
            metar: 'KSFO 151555Z 24012KT 3SM BR BKN008 18/16 A3002'
          }
        }

        setWeatherData({
          origin: mockWeatherData[origin] || null,
          destination: mockWeatherData[destination] || null
        })
      } finally {
        setLoading(false)
      }
    }

    if (isOpen) {
      fetchWeatherData()
    }
  }, [isOpen, origin, destination])

  const getFlightCategory = (visibility: number, ceiling: number) => {
    if (visibility >= 5 && ceiling >= 3000) return { category: 'VFR', color: 'text-green-600', bg: 'bg-green-50' }
    if (visibility >= 3 && ceiling >= 1000) return { category: 'MVFR', color: 'text-blue-600', bg: 'bg-blue-50' }
    if (visibility >= 1 && ceiling >= 500) return { category: 'IFR', color: 'text-red-600', bg: 'bg-red-50' }
    return { category: 'LIFR', color: 'text-purple-600', bg: 'bg-purple-50' }
  }

  const getWindDirection = (degrees: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    const index = Math.round(degrees / 22.5) % 16
    return directions[index]
  }

  const WeatherCard = ({ data, title }: { data: WeatherData | null; title: string }) => {
    if (!data) {
      return (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-500">Weather data unavailable</p>
        </div>
      )
    }

    const flightCategory = getFlightCategory(data.visibility, data.ceiling)
    const windDirection = getWindDirection(data.wind_direction)

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">{title}</h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${flightCategory.color} ${flightCategory.bg}`}>
            {flightCategory.category}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <Eye className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">{data.visibility} SM</p>
              <p className="text-xs text-gray-500">Visibility</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Cloud className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">{data.ceiling} ft</p>
              <p className="text-xs text-gray-500">Ceiling</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Wind className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">{data.wind_speed} kt {windDirection}</p>
              <p className="text-xs text-gray-500">Wind</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Thermometer className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">{data.temperature}°F</p>
              <p className="text-xs text-gray-500">Temperature</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-xs font-medium text-gray-700">Conditions:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {data.conditions.map((condition) => (
                <span
                  key={condition}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800"
                >
                  {condition}
                </span>
              ))}
            </div>
          </div>
          
          {data.metar && (
            <div>
              <p className="text-xs font-medium text-gray-700">METAR:</p>
              <p className="text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded mt-1">{data.metar}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Cloud className="h-6 w-6 text-blue-600" />
              <h2 className="text-lg font-medium text-gray-900">Weather Information</h2>
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
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading weather data...</p>
            </div>
          ) : (
            <>
              {/* Weather Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <WeatherCard data={weatherData.origin} title={`${origin} - Origin`} />
                <WeatherCard data={weatherData.destination} title={`${destination} - Destination`} />
              </div>

              {/* Flight Impact Analysis */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-medium text-gray-900 mb-3">Flight Impact Analysis</h3>
                <div className="space-y-3">
                  {weatherData.origin && weatherData.destination && (
                    <>
                      {weatherData.origin.visibility < 3 && (
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-red-700">
                            Low visibility at {origin} may require IFR procedures
                          </span>
                        </div>
                      )}
                      
                      {weatherData.destination.visibility < 3 && (
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-red-700">
                            Low visibility at {destination} may require alternate airport
                          </span>
                        </div>
                      )}
                      
                      {weatherData.origin.wind_speed > 20 && (
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm text-yellow-700">
                            High winds at {origin} may affect takeoff performance
                          </span>
                        </div>
                      )}
                      
                      {weatherData.destination.wind_speed > 20 && (
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm text-yellow-700">
                            High winds at {destination} may affect landing approach
                          </span>
                        </div>
                      )}
                      
                      {(weatherData.origin.visibility >= 5 && weatherData.destination.visibility >= 5) && (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-700">
                            Weather conditions are suitable for VFR flight
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Recommendations</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Monitor weather conditions closely during flight</p>
                  <p>• Have alternate airports identified</p>
                  <p>• Consider filing IFR flight plan if conditions deteriorate</p>
                  <p>• Brief passengers on potential delays due to weather</p>
                  <p>• Ensure aircraft is equipped for current conditions</p>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 