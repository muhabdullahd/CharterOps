// Test script to verify OpenWeatherMap API is working
const API_KEY = '8f250323ef1a37366b61c3fe92cf4888';

async function testWeatherAPI() {
  console.log('🌤️ Testing OpenWeatherMap API...\n');
  
  // Test coordinates for LAX airport
  const lat = 33.9416;
  const lon = -118.4085;
  
  try {
    // Test current weather
    console.log('📍 Testing current weather for LAX airport...');
    const currentResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );
    
    if (!currentResponse.ok) {
      throw new Error(`Current weather API error: ${currentResponse.status}`);
    }
    
    const currentData = await currentResponse.json();
    console.log('✅ Current weather API working!');
    console.log(`   Temperature: ${currentData.main?.temp}°C`);
    console.log(`   Conditions: ${currentData.weather?.[0]?.main}`);
    console.log(`   Wind Speed: ${currentData.wind?.speed} m/s`);
    console.log(`   Humidity: ${currentData.main?.humidity}%`);
    console.log(`   Visibility: ${(currentData.visibility || 10000) / 1000} km`);
    
    // Test forecast
    console.log('\n📅 Testing 5-day forecast...');
    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );
    
    if (!forecastResponse.ok) {
      throw new Error(`Forecast API error: ${forecastResponse.status}`);
    }
    
    const forecastData = await forecastResponse.json();
    console.log('✅ Forecast API working!');
    console.log(`   Forecast entries: ${forecastData.list?.length || 0}`);
    console.log(`   City: ${forecastData.city?.name}`);
    
    // Test our weather parsing
    console.log('\n🧠 Testing our weather data parsing...');
    const weatherData = parseWeatherData(currentData);
    console.log('✅ Weather data parsing working!');
    console.log('   Parsed data:', JSON.stringify(weatherData, null, 2));
    
    console.log('\n🎉 All weather API tests passed! The system is ready to use real weather data.');
    
  } catch (error) {
    console.error('❌ Weather API test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   - Check if API key is valid');
    console.log('   - Wait 2 hours after signing up (API key activation delay)');
    console.log('   - Check daily API limit (1,000 calls/day free)');
  }
}

function parseWeatherData(apiData) {
  const main = apiData.main || {};
  const wind = apiData.wind || {};
  const weather = apiData.weather?.[0] || {};
  const rain = apiData.rain || {};
  
  // Calculate turbulence based on wind speed and weather conditions
  const windSpeed = wind.speed || 0;
  const turbulence = calculateTurbulence(windSpeed, weather.main);
  
  return {
    temperature: main.temp || 20,
    wind_speed: windSpeed,
    visibility: (apiData.visibility || 10000) / 1000, // Convert to km
    precipitation: rain['1h'] || 0,
    turbulence: turbulence,
    humidity: main.humidity || 50,
    pressure: main.pressure || 1013,
    conditions: weather.main || 'Clear'
  };
}

function calculateTurbulence(windSpeed, weatherCondition) {
  let baseTurbulence = Math.min(windSpeed / 10, 3);
  
  switch (weatherCondition?.toLowerCase()) {
    case 'thunderstorm':
      baseTurbulence += 2;
      break;
    case 'rain':
    case 'drizzle':
      baseTurbulence += 0.5;
      break;
    case 'snow':
      baseTurbulence += 1;
      break;
    case 'fog':
    case 'mist':
      baseTurbulence += 0.3;
      break;
  }
  
  return Math.min(5, Math.max(0, baseTurbulence));
}

// Run the test
testWeatherAPI(); 