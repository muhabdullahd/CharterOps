// Weather API Configuration
// To use real weather data, get a free API key from: https://openweathermap.org/api

export const WEATHER_CONFIG = {
  // OpenWeatherMap API Key
  // Get your free API key at: https://openweathermap.org/api
  // Free tier includes: 1000 calls/day, current weather, 5-day forecast
  OPENWEATHER_API_KEY: process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || null,
  
  // Weather data source preference
  PREFER_REAL_WEATHER: true,
  
  // Cache duration for weather data (in minutes)
  CACHE_DURATION: 10,
  
  // Supported airports (IATA codes)
  SUPPORTED_AIRPORTS: [
    'LAX', 'JFK', 'ORD', 'DFW', 'ATL', 'DEN', 'SFO', 'MIA', 'LAS', 'PHX',
    'CLT', 'SEA', 'MCO', 'IAH', 'BOS', 'DTW', 'MSP', 'FLL', 'BWI', 'IAD'
  ]
}

// Setup instructions for real weather data
export const WEATHER_SETUP_INSTRUCTIONS = `
🌤️ OpenWeatherMap API Setup:

1. Get a FREE API key:
   - Visit: https://openweathermap.org/api
   - Sign up for a free account
   - Get your API key (1000 calls/day free)

2. Add to your environment:
   - Create .env.local file in project root
   - Add: NEXT_PUBLIC_OPENWEATHER_API_KEY=your_api_key_here

3. Restart your development server

4. The AI will now use real weather data for predictions!

Note: Without an API key, the system uses realistic simulated weather data.
`

// Check if real weather is configured
export function isRealWeatherConfigured(): boolean {
  return WEATHER_CONFIG.OPENWEATHER_API_KEY !== null
}

// Get weather source info for display
export function getWeatherSourceInfo(): { source: string, status: string, icon: string } {
  if (isRealWeatherConfigured()) {
    return {
      source: 'OpenWeatherMap API',
      status: 'Live Weather Data',
      icon: '🌤️'
    }
  } else {
    return {
      source: 'Simulated Data',
      status: 'Realistic Patterns',
      icon: '🎲'
    }
  }
} 