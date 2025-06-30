'use client'

import { useState, useEffect } from 'react'
import { WeatherAPI } from '@/lib/weather-api'
import { getWeatherSourceInfo } from '@/lib/weather-config'
import type { WeatherData } from '@/lib/weather-api'

export default function TestWeatherPage() {
  const [weatherData, setWeatherData] = useState<{ lax: WeatherData, jfk: WeatherData, forecast: WeatherData } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<{ test: string; status: string; details: string }[]>([])

  const weatherSourceInfo = getWeatherSourceInfo()

  useEffect(() => {
    testWeatherAPI()
  }, [])

  const testWeatherAPI = async () => {
    const results = []
    setLoading(true)
    setError(null)

    try {
      const weatherAPI = WeatherAPI.getInstance()
      
      // Test 1: Check API key configuration
      results.push({
        test: 'API Key Configuration',
        status: weatherAPI.isRealWeatherAvailable() ? '✅ PASS' : '⚠️ FALLBACK',
        details: weatherAPI.getWeatherSource()
      })

      // Test 2: Get weather for LAX
      console.log('Testing weather for LAX...')
      const laxWeather = await weatherAPI.getWeatherForAirport('LAX')
      results.push({
        test: 'LAX Weather Data',
        status: '✅ PASS',
        details: `Temp: ${laxWeather.temperature}°C, Wind: ${laxWeather.wind_speed} m/s, Conditions: ${laxWeather.conditions}`
      })

      // Test 3: Get weather for JFK
      console.log('Testing weather for JFK...')
      const jfkWeather = await weatherAPI.getWeatherForAirport('JFK')
      results.push({
        test: 'JFK Weather Data',
        status: '✅ PASS',
        details: `Temp: ${jfkWeather.temperature}°C, Wind: ${jfkWeather.wind_speed} m/s, Conditions: ${jfkWeather.conditions}`
      })

      // Test 4: Get forecast
      console.log('Testing weather forecast...')
      const forecast = await weatherAPI.getWeatherForecast(33.9416, -118.4085, new Date())
      results.push({
        test: 'Weather Forecast',
        status: '✅ PASS',
        details: `Forecast Temp: ${forecast.temperature}°C, Conditions: ${forecast.conditions}`
      })

      setWeatherData({ lax: laxWeather, jfk: jfkWeather, forecast })
      setTestResults(results)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setTestResults([{
        test: 'Weather API Test',
        status: '❌ FAIL',
        details: err instanceof Error ? err.message : 'Unknown error'
      }])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">🌤️ Weather API Test</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🌤️ Weather API Test</h1>
        
        {/* Weather Source Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Weather Data Source</h2>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{weatherSourceInfo.icon}</span>
            <div>
              <p className="font-medium">{weatherSourceInfo.source}</p>
              <p className="text-sm text-gray-600">{weatherSourceInfo.status}</p>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{result.test}</p>
                  <p className="text-sm text-gray-600">{result.details}</p>
                </div>
                <span className="font-bold">{result.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weather Data Display */}
        {weatherData && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Weather Data</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">LAX Airport</h3>
                <div className="space-y-1 text-sm">
                  <p>🌡️ Temperature: {weatherData.lax.temperature}°C</p>
                  <p>💨 Wind: {weatherData.lax.wind_speed} m/s</p>
                  <p>👁️ Visibility: {weatherData.lax.visibility} km</p>
                  <p>💧 Humidity: {weatherData.lax.humidity}%</p>
                  <p>🌤️ Conditions: {weatherData.lax.conditions}</p>
                  <p>🌊 Turbulence: {weatherData.lax.turbulence}/5</p>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">JFK Airport</h3>
                <div className="space-y-1 text-sm">
                  <p>🌡️ Temperature: {weatherData.jfk.temperature}°C</p>
                  <p>💨 Wind: {weatherData.jfk.wind_speed} m/s</p>
                  <p>👁️ Visibility: {weatherData.jfk.visibility} km</p>
                  <p>💧 Humidity: {weatherData.jfk.humidity}%</p>
                  <p>🌤️ Conditions: {weatherData.jfk.conditions}</p>
                  <p>🌊 Turbulence: {weatherData.jfk.turbulence}/5</p>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Forecast</h3>
                <div className="space-y-1 text-sm">
                  <p>🌡️ Temperature: {weatherData.forecast.temperature}°C</p>
                  <p>💨 Wind: {weatherData.forecast.wind_speed} m/s</p>
                  <p>👁️ Visibility: {weatherData.forecast.visibility} km</p>
                  <p>💧 Humidity: {weatherData.forecast.humidity}%</p>
                  <p>🌤️ Conditions: {weatherData.forecast.conditions}</p>
                  <p>🌊 Turbulence: {weatherData.forecast.turbulence}/5</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
            <h3 className="text-red-800 font-semibold">Error</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={testWeatherAPI}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            🔄 Run Tests Again
          </button>
        </div>
      </div>
    </div>
  )
} 