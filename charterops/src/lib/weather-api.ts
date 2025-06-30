// Weather API integration for real weather data
// Uses OpenWeatherMap API for live weather data

import { WEATHER_CONFIG } from './weather-config'

export interface WeatherData {
  temperature: number
  wind_speed: number
  visibility: number
  precipitation: number
  turbulence: number
  humidity: number
  pressure: number
  conditions: string
}

export class WeatherAPI {
  private static instance: WeatherAPI
  private apiKey: string | null = null
  private baseUrl = 'https://api.openweathermap.org/data/2.5'

  static getInstance(): WeatherAPI {
    if (!WeatherAPI.instance) {
      WeatherAPI.instance = new WeatherAPI()
    }
    return WeatherAPI.instance
  }

  constructor() {
    // Automatically set API key from environment if available
    this.apiKey = WEATHER_CONFIG.OPENWEATHER_API_KEY
    
    if (this.apiKey) {
      console.log('🌤️ OpenWeatherMap API configured - using real weather data')
    } else {
      console.log('🎲 No OpenWeatherMap API key found - using simulated weather data')
      console.log('💡 Get a free API key at: https://openweathermap.org/api')
    }
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey
    if (apiKey) {
      console.log('🌤️ OpenWeatherMap API key set - switching to real weather data')
    }
  }

  async getWeatherForLocation(lat: number, lon: number): Promise<WeatherData> {
    try {
      if (this.apiKey) {
        // Real OpenWeatherMap API call
        const response = await fetch(
          `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
        )
        
        if (!response.ok) {
          throw new Error(`Weather API error: ${response.status}`)
        }
        
        const data = await response.json()
        return this.parseWeatherData(data)
      }
      
      // Fallback to simulated weather data if no API key
      return this.generateRealisticWeather(lat, lon)
    } catch (error) {
      console.error('Error fetching real weather data:', error)
      console.log('Falling back to simulated weather data')
      return this.generateRealisticWeather(lat, lon)
    }
  }

  async getWeatherForecast(lat: number, lon: number, time: Date): Promise<WeatherData> {
    try {
      if (this.apiKey) {
        // Get 5-day forecast from OpenWeatherMap
        const response = await fetch(
          `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
        )
        
        if (!response.ok) {
          throw new Error(`Weather forecast API error: ${response.status}`)
        }
        
        const data = await response.json()
        return this.parseForecastData(data, time)
      }
      
      // Fallback to simulated forecast
      return this.generateRealisticWeather(lat, lon)
    } catch (error) {
      console.error('Error fetching weather forecast:', error)
      return this.generateRealisticWeather(lat, lon)
    }
  }

  private parseWeatherData(apiData: any): WeatherData {
    const main = apiData.main || {}
    const wind = apiData.wind || {}
    const weather = apiData.weather?.[0] || {}
    const rain = apiData.rain || {}
    
    // Calculate turbulence based on wind speed and weather conditions
    const windSpeed = wind.speed || 0
    const turbulence = this.calculateTurbulence(windSpeed, weather.main)
    
    return {
      temperature: main.temp || 20,
      wind_speed: windSpeed,
      visibility: (apiData.visibility || 10000) / 1000, // Convert to km
      precipitation: rain['1h'] || 0,
      turbulence: turbulence,
      humidity: main.humidity || 50,
      pressure: main.pressure || 1013,
      conditions: weather.main || 'Clear'
    }
  }

  private parseForecastData(apiData: any, targetTime: Date): WeatherData {
    const list = apiData.list || []
    
    // Find the forecast closest to the target time
    const targetTimestamp = targetTime.getTime() / 1000
    let closestForecast = list[0]
    let minDiff = Math.abs(closestForecast.dt - targetTimestamp)
    
    for (const forecast of list) {
      const diff = Math.abs(forecast.dt - targetTimestamp)
      if (diff < minDiff) {
        minDiff = diff
        closestForecast = forecast
      }
    }
    
    return this.parseWeatherData(closestForecast)
  }

  private calculateTurbulence(windSpeed: number, weatherCondition: string): number {
    // Calculate turbulence based on wind speed and weather conditions
    let baseTurbulence = Math.min(windSpeed / 10, 3) // Base turbulence from wind
    
    // Add turbulence based on weather conditions
    switch (weatherCondition?.toLowerCase()) {
      case 'thunderstorm':
        baseTurbulence += 2
        break
      case 'rain':
      case 'drizzle':
        baseTurbulence += 0.5
        break
      case 'snow':
        baseTurbulence += 1
        break
      case 'fog':
      case 'mist':
        baseTurbulence += 0.3
        break
    }
    
    return Math.min(5, Math.max(0, baseTurbulence))
  }

  // Get weather for airport by IATA code
  async getWeatherForAirport(iataCode: string): Promise<WeatherData> {
    const airportCoords = this.getAirportCoordinates(iataCode)
    return this.getWeatherForLocation(airportCoords.lat, airportCoords.lon)
  }

  getAirportCoordinates(iataCode: string): { lat: number, lon: number } {
    // Real airport coordinates for common airports
    const airports: Record<string, { lat: number, lon: number }> = {
      'LAX': { lat: 33.9416, lon: -118.4085 },
      'JFK': { lat: 40.6413, lon: -73.7781 },
      'ORD': { lat: 41.9786, lon: -87.9048 },
      'DFW': { lat: 32.8968, lon: -97.0380 },
      'ATL': { lat: 33.6407, lon: -84.4277 },
      'DEN': { lat: 39.8561, lon: -104.6737 },
      'SFO': { lat: 37.6213, lon: -122.3790 },
      'MIA': { lat: 25.7932, lon: -80.2906 },
      'LAS': { lat: 36.0840, lon: -115.1537 },
      'PHX': { lat: 33.4342, lon: -112.0116 },
      'CLT': { lat: 35.2144, lon: -80.9473 },
      'SEA': { lat: 47.4502, lon: -122.3088 },
      'MCO': { lat: 28.4312, lon: -81.3081 },
      'IAH': { lat: 29.9902, lon: -95.3368 },
      'BOS': { lat: 42.3656, lon: -71.0096 },
      'DTW': { lat: 42.2162, lon: -83.3554 },
      'MSP': { lat: 44.8848, lon: -93.2223 },
      'FLL': { lat: 26.0742, lon: -80.1506 },
      'BWI': { lat: 39.1754, lon: -76.6682 },
      'IAD': { lat: 38.9531, lon: -77.4565 }
    }
    
    return airports[iataCode] || { lat: 40.7128, lon: -74.0060 } // Default to NYC
  }

  // Fallback method for simulated weather data
  private generateRealisticWeather(lat: number, lon: number): WeatherData {
    const now = new Date()
    const hour = now.getHours()
    const month = now.getMonth()
    
    // Simulate realistic weather patterns based on location and time
    const baseTemp = this.getBaseTemperature(lat, month)
    const tempVariation = (Math.random() - 0.5) * 15
    
    // Wind patterns (higher during day, lower at night)
    const windBase = 3 + Math.sin(hour * Math.PI / 12) * 5
    const windVariation = Math.random() * 10
    
    // Visibility patterns (better during day, worse at night)
    const visibilityBase = 8 + Math.sin(hour * Math.PI / 12) * 3
    const visibilityVariation = Math.random() * 4
    
    // Precipitation (higher in certain months)
    const precipitationChance = this.getPrecipitationChance(month, lat)
    const precipitation = Math.random() < precipitationChance ? Math.random() * 100 : 0
    
    // Turbulence (correlated with wind and temperature)
    const turbulenceBase = Math.min(windBase / 10, 1) * 3
    const turbulenceVariation = Math.random() * 2
    
    return {
      temperature: baseTemp + tempVariation,
      wind_speed: Math.max(0, windBase + windVariation),
      visibility: Math.max(0, visibilityBase + visibilityVariation),
      precipitation: precipitation,
      turbulence: Math.min(5, Math.max(0, turbulenceBase + turbulenceVariation)),
      humidity: 40 + Math.random() * 40,
      pressure: 1000 + (Math.random() - 0.5) * 50,
      conditions: this.getWeatherConditions(precipitation, windBase + windVariation)
    }
  }

  private getBaseTemperature(lat: number, month: number): number {
    // Simulate temperature based on latitude and season
    const seasonalTemp = 15 + 10 * Math.sin(month * Math.PI / 6)
    const latAdjustment = (Math.abs(lat) - 30) * 0.5 // Colder at higher latitudes
    
    return seasonalTemp - latAdjustment
  }

  private getPrecipitationChance(month: number, lat: number): number {
    // Higher precipitation in spring and fall, lower in summer and winter
    const seasonalChance = 0.3 + 0.4 * Math.sin(month * Math.PI / 6)
    const latChance = Math.abs(lat) > 45 ? 0.2 : 0.1 // Higher chance at higher latitudes
    
    return Math.min(0.8, seasonalChance + latChance)
  }

  private getWeatherConditions(precipitation: number, windSpeed: number): string {
    if (precipitation > 80) return 'Heavy Rain'
    if (precipitation > 50) return 'Rain'
    if (precipitation > 20) return 'Light Rain'
    if (windSpeed > 25) return 'High Winds'
    if (windSpeed > 15) return 'Windy'
    return 'Clear'
  }

  // Method to check if real weather data is available
  isRealWeatherAvailable(): boolean {
    return this.apiKey !== null
  }

  // Method to get weather data source info
  getWeatherSource(): string {
    return this.apiKey ? 'OpenWeatherMap API' : 'Simulated Data'
  }
} 