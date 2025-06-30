# 🌤️ Real Weather Data Setup

## Get Live Weather Data for AI Predictions

The CharterOps AI system can use real weather data from OpenWeatherMap to make more accurate predictions. Here's how to set it up:

## 🚀 Quick Setup (5 minutes)

### 1. Get Free API Key
- Visit: https://openweathermap.org/api
- Click "Sign Up" (free account)
- Go to "API keys" section
- Copy your API key

### 2. Add to Environment
Create a `.env.local` file in your project root:
```bash
# .env.local
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_api_key_here
```

### 3. Restart Server
```bash
npm run dev
```

### 4. Verify Setup
Look for this message in your console:
```
🌤️ OpenWeatherMap API configured - using real weather data
```

## 📊 What You'll See

### With Real Weather Data:
- 🌤️ **OpenWeatherMap API** indicator in the UI
- **Live weather conditions** for airports
- **Real-time forecasts** for departure times
- **More accurate AI predictions** based on actual weather

### Without API Key (Fallback):
- 🎲 **Simulated Data** indicator in the UI
- **Realistic weather patterns** based on location/time
- **Still impressive AI** with TensorFlow.js neural networks

## 🔧 API Limits

**Free Tier Includes:**
- 1,000 API calls per day
- Current weather data
- 5-day weather forecast
- Perfect for demos and development

## 🛠️ Troubleshooting

### "Weather API error: 401"
- Check your API key is correct
- Wait 2 hours after signing up (API key activation delay)

### "Weather API error: 429"
- You've hit the daily limit (1,000 calls)
- Wait until tomorrow or upgrade plan

### No weather data showing
- Check browser console for errors
- Verify `.env.local` file is in project root
- Restart development server

## 🎯 Demo Tips

### For Maximum Impact:
1. **Get the API key** - Shows real external data integration
2. **Use real airport codes** - LAX, JFK, ORD, SFO, etc.
3. **Point out the weather indicator** - Shows live vs simulated data
4. **Explain the AI features** - TensorFlow.js + real weather = impressive

### What Makes This Impressive:
- ✅ **Real external API integration**
- ✅ **Live weather data** for airports
- ✅ **Fallback system** (works without API key)
- ✅ **Professional aviation context**
- ✅ **Real AI** with TensorFlow.js

## 🔮 Next Steps

Once you have real weather data working, you can:
- Add more airports to the supported list
- Implement weather caching for better performance
- Add aviation-specific weather services
- Integrate with flight planning systems

The AI system will automatically use real weather data when available, making your predictions much more accurate and impressive for demos! 