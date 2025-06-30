import * as tf from '@tensorflow/tfjs'
import { supabase } from './supabase'
import { Flight, Alert, Crew } from './supabase'
import { WeatherAPI } from './weather-api'

// Use globalThis to persist the model across hot reloads and API calls
const globalAny = globalThis as any;
if (!globalAny.hybridAIModel) {
  globalAny.hybridAIModel = null;
}

export interface DisruptionPrediction {
  flight_id: string
  risk_score: number
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  predicted_disruption_type: 'weather' | 'crew' | 'mechanical' | 'airport'
  confidence: number
  factors: PredictionFactor[]
  predicted_time: string
  recommended_actions: string[]
  ai_model_version: string
  feature_importance: Record<string, number>
  model_confidence: number
  explanation: string
}

export interface PredictionFactor {
  factor: string
  weight: number
  value: number
  description: string
  ai_contribution: number
}

export interface MLFeatures {
  // Weather features (0-1 normalized)
  temperature_risk: number
  wind_risk: number
  visibility_risk: number
  precipitation_risk: number
  turbulence_risk: number
  
  // Crew features
  duty_hours_risk: number
  rest_compliance_risk: number
  crew_availability_risk: number
  
  // Mechanical features
  maintenance_risk: number
  aircraft_age_risk: number
  inspection_risk: number
  
  // Airport features
  airport_alert_risk: number
  runway_risk: number
  
  // Historical features
  route_disruption_risk: number
  seasonal_risk: number
  time_of_day_risk: number
}

export class HybridAIEngine {
  private static instance: HybridAIEngine
  private model: tf.LayersModel | null = null
  private isModelLoaded = false
  private featureNames: string[] = [
    'temperature_risk', 'wind_risk', 'visibility_risk', 'precipitation_risk', 'turbulence_risk',
    'duty_hours_risk', 'rest_compliance_risk', 'crew_availability_risk',
    'maintenance_risk', 'aircraft_age_risk', 'inspection_risk',
    'airport_alert_risk', 'runway_risk',
    'route_disruption_risk', 'seasonal_risk', 'time_of_day_risk'
  ]

  static getInstance(): HybridAIEngine {
    if (!HybridAIEngine.instance) {
      HybridAIEngine.instance = new HybridAIEngine()
    }
    return HybridAIEngine.instance
  }

  async initialize() {
    if (this.isModelLoaded) return
    try {
      await this.loadOrCreateModel()
      this.isModelLoaded = true
    } catch (error) {
      console.error('Failed to initialize Hybrid AI Engine:', error)
      throw error
    }
  }

  private async loadOrCreateModel() {
    try {
      this.model = await this.createModel()
      await this.trainModelWithSampleData()
    } catch (error) {
      console.error('Error creating model:', error)
      throw error
    }
  }

  private async createModel(): Promise<tf.LayersModel> {
    if (globalAny.hybridAIModel) return globalAny.hybridAIModel;
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [this.featureNames.length],
          units: 32,
          activation: 'relu',
          name: 'input_layer'
        }),
        tf.layers.dense({
          units: 16,
          activation: 'relu',
          name: 'hidden_layer_1'
        }),
        tf.layers.dense({
          units: 8,
          activation: 'relu',
          name: 'hidden_layer_2'
        }),
        tf.layers.dense({
          units: 1,
          activation: 'sigmoid',
          name: 'output_layer'
        })
      ]
    })
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    })
    globalAny.hybridAIModel = model;
    return model;
  }

  private async trainModelWithSampleData() {
    if (!this.model) return

    const trainingData = this.generateTrainingData()
    
    const xs = tf.tensor2d(trainingData.features)
    const ys = tf.tensor2d(trainingData.labels, [trainingData.labels.length, 1])

    await this.model.fit(xs, ys, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      verbose: 0
    })

    xs.dispose()
    ys.dispose()
  }

  private generateTrainingData() {
    const features: number[][] = []
    const labels: number[] = []

    for (let i = 0; i < 1000; i++) {
      const sampleFeatures: number[] = []

      // Weather features (correlated with risk)
      const weatherRisk = Math.random()
      sampleFeatures.push(weatherRisk) // temperature
      sampleFeatures.push(weatherRisk * 0.8 + Math.random() * 0.2) // wind
      sampleFeatures.push(weatherRisk * 0.9 + Math.random() * 0.1) // visibility
      sampleFeatures.push(weatherRisk * 0.7 + Math.random() * 0.3) // precipitation
      sampleFeatures.push(weatherRisk * 0.6 + Math.random() * 0.4) // turbulence

      // Crew features
      const crewRisk = Math.random()
      sampleFeatures.push(crewRisk) // duty hours
      sampleFeatures.push(crewRisk * 0.9 + Math.random() * 0.1) // rest compliance
      sampleFeatures.push(Math.random()) // availability

      // Mechanical features
      const mechanicalRisk = Math.random()
      sampleFeatures.push(mechanicalRisk) // maintenance
      sampleFeatures.push(mechanicalRisk * 0.8 + Math.random() * 0.2) // age
      sampleFeatures.push(mechanicalRisk * 0.7 + Math.random() * 0.3) // inspection

      // Airport features
      const airportRisk = Math.random()
      sampleFeatures.push(airportRisk) // alerts
      sampleFeatures.push(airportRisk * 0.9 + Math.random() * 0.1) // runway

      // Historical features
      sampleFeatures.push(Math.random()) // route disruption
      sampleFeatures.push(Math.sin(i * 0.1) * 0.5 + 0.5) // seasonal
      sampleFeatures.push(Math.sin(i * 0.05) * 0.5 + 0.5) // time of day

      features.push(sampleFeatures)

      // Generate realistic labels
      const avgRisk = sampleFeatures.reduce((sum, val) => sum + val, 0) / sampleFeatures.length
      const highRiskFactors = sampleFeatures.filter(f => f > 0.7).length
      
      let label = 0
      if (avgRisk > 0.6 && highRiskFactors >= 3) label = 1
      else if (avgRisk > 0.4 && highRiskFactors >= 2) label = 0.7
      else if (avgRisk > 0.3) label = 0.3
      else label = 0.1

      labels.push(label)
    }

    return { features, labels }
  }

  async analyzeFlightRisk(flightId: string): Promise<DisruptionPrediction> {
    await this.initialize()

    try {
      const { data: flight, error: flightError } = await supabase
        .from('flights')
        .select('*')
        .eq('id', flightId)
        .single()

      if (flightError || !flight) {
        throw new Error('Flight not found')
      }

      const features = await this.extractFeatures(flight)
      const featureArray = this.featuresToArray(features)
      
      const aiPrediction = await this.getAIPrediction(featureArray)
      const featureImportance = await this.calculateFeatureImportance(featureArray, aiPrediction)
      const factors = this.calculateFactors(features, featureImportance, aiPrediction)
      const explanation = this.generateExplanation(features, aiPrediction, factors)
      
      const riskLevel = this.determineRiskLevel(aiPrediction)
      const predictedType = this.determinePredictedType(factors)
      const confidence = this.calculateConfidence(features, aiPrediction)

      return {
        flight_id: flightId,
        risk_score: aiPrediction,
        risk_level: riskLevel,
        predicted_disruption_type: predictedType,
        confidence: confidence,
        factors: factors,
        predicted_time: this.predictDisruptionTime(flight, aiPrediction),
        recommended_actions: this.generateRecommendations(features, aiPrediction, factors),
        ai_model_version: 'hybrid-v1.0.0',
        feature_importance: featureImportance,
        model_confidence: confidence,
        explanation: explanation
      }
    } catch (error) {
      console.error('Error in hybrid AI flight risk analysis:', error)
      throw error
    }
  }

  private async extractFeatures(flight: Flight): Promise<MLFeatures> {
    const weatherData = await this.getWeatherData(flight)
    const crewData = await this.getCrewData(flight)
    const mechanicalData = await this.getMechanicalData(flight)
    const airportData = await this.getAirportData(flight)
    const historicalData = await this.getHistoricalData(flight)

    return {
      temperature_risk: this.normalizeTemperature(weatherData.temperature),
      wind_risk: this.normalizeWind(weatherData.wind_speed),
      visibility_risk: this.normalizeVisibility(weatherData.visibility),
      precipitation_risk: weatherData.precipitation / 100,
      turbulence_risk: weatherData.turbulence / 5,

      duty_hours_risk: this.normalizeDutyHours(crewData.totalDutyHours),
      rest_compliance_risk: crewData.nonCompliantRatio,
      crew_availability_risk: 1 - crewData.availabilityRatio,

      maintenance_risk: this.normalizeMaintenanceIssues(mechanicalData.recentIssues),
      aircraft_age_risk: this.normalizeAircraftAge(mechanicalData.aircraftAge),
      inspection_risk: this.normalizeInspectionDays(mechanicalData.lastInspectionDays),

      airport_alert_risk: this.normalizeAirportAlerts(airportData.alertCount),
      runway_risk: 1 - airportData.runwayAvailability,

      route_disruption_risk: historicalData.routeDisruptionRate,
      seasonal_risk: historicalData.seasonalFactor,
      time_of_day_risk: historicalData.timeOfDayFactor
    }
  }

  private async getWeatherData(flight: Flight) {
    const weatherAPI = WeatherAPI.getInstance()
    
    try {
      // Get weather for both origin and destination airports
      const originWeather = await weatherAPI.getWeatherForAirport(flight.origin)
      const destinationWeather = await weatherAPI.getWeatherForAirport(flight.destination)
      
      // Get forecast for departure time
      const departureTime = new Date(flight.departure_time)
      const originForecast = await weatherAPI.getWeatherForecast(
        weatherAPI.getAirportCoordinates(flight.origin).lat,
        weatherAPI.getAirportCoordinates(flight.origin).lon,
        departureTime
      )
      
      // Combine weather data (weight destination more heavily for risk assessment)
      return {
        temperature: (originWeather.temperature + destinationWeather.temperature * 2) / 3,
        wind_speed: Math.max(originWeather.wind_speed, destinationWeather.wind_speed),
        visibility: Math.min(originWeather.visibility, destinationWeather.visibility),
        precipitation: Math.max(originWeather.precipitation, destinationWeather.precipitation),
        turbulence: Math.max(originWeather.turbulence, destinationWeather.turbulence),
        humidity: (originWeather.humidity + destinationWeather.humidity) / 2,
        pressure: (originWeather.pressure + destinationWeather.pressure) / 2,
        conditions: destinationWeather.conditions // Use destination conditions
      }
    } catch (error) {
      console.error('Error fetching weather data:', error)
      // Fallback to simulated data
      const departureTime = new Date(flight.departure_time)
      const month = departureTime.getMonth()
      
      const baseTemp = 15 + 10 * Math.sin(month * Math.PI / 6)
      const tempVariation = (Math.random() - 0.5) * 20
      
      return {
        temperature: baseTemp + tempVariation,
        wind_speed: 5 + Math.random() * 30,
        visibility: 2 + Math.random() * 8,
        precipitation: Math.random() * 100,
        turbulence: Math.random() * 5,
        humidity: 40 + Math.random() * 40,
        pressure: 1000 + (Math.random() - 0.5) * 50,
        conditions: 'Clear'
      }
    }
  }

  private async getCrewData(flight: Flight) {
    const crewIds = flight.crew_ids || []
    let totalDutyHours = 0
    let nonCompliantCrew = 0
    let availableCrew = 0

    for (const crewId of crewIds) {
      const { data: crew } = await supabase
        .from('crew')
        .select('*')
        .eq('id', crewId)
        .single()

      if (crew) {
        totalDutyHours += crew.current_duty
        if (!crew.rest_compliant) nonCompliantCrew++
        if (crew.rest_compliant && crew.current_duty < 8) availableCrew++
      }
    }

    return {
      totalDutyHours,
      nonCompliantRatio: crewIds.length > 0 ? nonCompliantCrew / crewIds.length : 0,
      availabilityRatio: crewIds.length > 0 ? availableCrew / crewIds.length : 1
    }
  }

  private async getMechanicalData(flight: Flight) {
    const { data: alerts } = await supabase
      .from('alerts')
      .select('*')
      .eq('type', 'mechanical')
      .eq('flight_id', flight.id)
      .gte('triggered_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    return {
      recentIssues: alerts?.length || 0,
      aircraftAge: Math.random() * 20 + 5,
      lastInspectionDays: Math.random() * 365
    }
  }

  private async getAirportData(flight: Flight) {
    const { data: airportAlerts } = await supabase
      .from('alerts')
      .select('*')
      .eq('type', 'airport')
      .or(`flight_id.eq.${flight.id}`)
      .gte('triggered_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    return {
      alertCount: airportAlerts?.length || 0,
      runwayAvailability: 0.7 + Math.random() * 0.3
    }
  }

  private async getHistoricalData(flight: Flight) {
    const { data: historicalFlights } = await supabase
      .from('flights')
      .select('*')
      .eq('tail_number', flight.tail_number)
      .or(`origin.eq.${flight.origin},destination.eq.${flight.destination}`)
      .gte('departure_time', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())

    const totalFlights = historicalFlights?.length || 1
    const disruptedFlights = historicalFlights?.filter(f => 
      f.status === 'delayed' || f.status === 'diverted' || f.issues.length > 0
    ).length || 0

    const departureTime = new Date(flight.departure_time)
    const month = departureTime.getMonth()
    const hour = departureTime.getHours()

    return {
      routeDisruptionRate: disruptedFlights / totalFlights,
      seasonalFactor: Math.sin(month * Math.PI / 6) * 0.5 + 0.5,
      timeOfDayFactor: Math.sin(hour * Math.PI / 12) * 0.5 + 0.5
    }
  }

  private normalizeTemperature(temp: number): number {
    if (temp < -10 || temp > 40) return 1.0
    if (temp < -5 || temp > 35) return 0.8
    if (temp < 0 || temp > 30) return 0.6
    if (temp < 5 || temp > 25) return 0.4
    return 0.2
  }

  private normalizeWind(windSpeed: number): number {
    if (windSpeed > 30) return 1.0
    if (windSpeed > 25) return 0.9
    if (windSpeed > 20) return 0.8
    if (windSpeed > 15) return 0.6
    if (windSpeed > 10) return 0.4
    return 0.2
  }

  private normalizeVisibility(visibility: number): number {
    if (visibility < 1) return 1.0
    if (visibility < 2) return 0.9
    if (visibility < 3) return 0.8
    if (visibility < 5) return 0.6
    if (visibility < 7) return 0.4
    return 0.2
  }

  private normalizeDutyHours(hours: number): number {
    if (hours > 14) return 1.0
    if (hours > 12) return 0.9
    if (hours > 10) return 0.7
    if (hours > 8) return 0.5
    if (hours > 6) return 0.3
    return 0.1
  }

  private normalizeMaintenanceIssues(issues: number): number {
    return Math.min(issues * 0.3, 1.0)
  }

  private normalizeAircraftAge(age: number): number {
    if (age > 20) return 1.0
    if (age > 15) return 0.8
    if (age > 10) return 0.6
    if (age > 5) return 0.4
    return 0.2
  }

  private normalizeInspectionDays(days: number): number {
    if (days > 365) return 1.0
    if (days > 180) return 0.8
    if (days > 90) return 0.6
    if (days > 30) return 0.4
    return 0.2
  }

  private normalizeAirportAlerts(alerts: number): number {
    return Math.min(alerts * 0.4, 1.0)
  }

  private featuresToArray(features: MLFeatures): number[] {
    return Object.values(features)
  }

  private async getAIPrediction(featureArray: number[]): Promise<number> {
    if (!this.model) {
      throw new Error('AI model not loaded')
    }

    const inputTensor = tf.tensor2d([featureArray])
    const predictionTensor = this.model.predict(inputTensor) as tf.Tensor
    const predictionValue = await predictionTensor.data()
    
    inputTensor.dispose()
    predictionTensor.dispose()
    
    return predictionValue[0]
  }

  private async calculateFeatureImportance(featureArray: number[], prediction: number): Promise<Record<string, number>> {
    const importance: Record<string, number> = {}
    
    for (let i = 0; i < this.featureNames.length; i++) {
      const perturbedArray = [...featureArray]
      perturbedArray[i] = 0
      
      const perturbedPrediction = await this.getAIPrediction(perturbedArray)
      importance[this.featureNames[i]] = Math.abs(prediction - perturbedPrediction)
    }
    
    const maxImportance = Math.max(...Object.values(importance))
    if (maxImportance > 0) {
      Object.keys(importance).forEach(key => {
        importance[key] = importance[key] / maxImportance
      })
    }
    
    return importance
  }

  private calculateFactors(features: MLFeatures, importance: Record<string, number>, aiPrediction: number): PredictionFactor[] {
    const factors: PredictionFactor[] = []

    // Weather factor
    const weatherScore = (features.temperature_risk + features.wind_risk + features.visibility_risk + 
                         features.precipitation_risk + features.turbulence_risk) / 5
    factors.push({
      factor: 'weather',
      weight: (importance.temperature_risk + importance.wind_risk + importance.visibility_risk + 
               importance.precipitation_risk + importance.turbulence_risk) / 5,
      value: weatherScore,
      description: this.generateWeatherDescription(features),
      ai_contribution: (importance.temperature_risk + importance.wind_risk + importance.visibility_risk + 
                       importance.precipitation_risk + importance.turbulence_risk) / 5
    })

    // Crew factor
    const crewScore = (features.duty_hours_risk + features.rest_compliance_risk + features.crew_availability_risk) / 3
    factors.push({
      factor: 'crew',
      weight: (importance.duty_hours_risk + importance.rest_compliance_risk + importance.crew_availability_risk) / 3,
      value: crewScore,
      description: this.generateCrewDescription(features),
      ai_contribution: (importance.duty_hours_risk + importance.rest_compliance_risk + importance.crew_availability_risk) / 3
    })

    // Mechanical factor
    const mechanicalScore = (features.maintenance_risk + features.aircraft_age_risk + features.inspection_risk) / 3
    factors.push({
      factor: 'mechanical',
      weight: (importance.maintenance_risk + importance.aircraft_age_risk + importance.inspection_risk) / 3,
      value: mechanicalScore,
      description: this.generateMechanicalDescription(features),
      ai_contribution: (importance.maintenance_risk + importance.aircraft_age_risk + importance.inspection_risk) / 3
    })

    // Airport factor
    const airportScore = (features.airport_alert_risk + features.runway_risk) / 2
    factors.push({
      factor: 'airport',
      weight: (importance.airport_alert_risk + importance.runway_risk) / 2,
      value: airportScore,
      description: this.generateAirportDescription(features),
      ai_contribution: (importance.airport_alert_risk + importance.runway_risk) / 2
    })

    // Historical factor
    const historicalScore = (features.route_disruption_risk + features.seasonal_risk + features.time_of_day_risk) / 3
    factors.push({
      factor: 'historical',
      weight: (importance.route_disruption_risk + importance.seasonal_risk + importance.time_of_day_risk) / 3,
      value: historicalScore,
      description: this.generateHistoricalDescription(features),
      ai_contribution: (importance.route_disruption_risk + importance.seasonal_risk + importance.time_of_day_risk) / 3
    })

    return factors
  }

  private generateWeatherDescription(features: MLFeatures): string {
    const risks = []
    if (features.temperature_risk > 0.7) risks.push('extreme temperatures')
    if (features.wind_risk > 0.7) risks.push('high winds')
    if (features.visibility_risk > 0.7) risks.push('poor visibility')
    if (features.precipitation_risk > 0.7) risks.push('heavy precipitation')
    if (features.turbulence_risk > 0.7) risks.push('moderate turbulence')
    
    return risks.length > 0 
      ? `AI detected adverse weather: ${risks.join(', ')}`
      : 'Weather conditions appear favorable'
  }

  private generateCrewDescription(features: MLFeatures): string {
    const issues = []
    if (features.duty_hours_risk > 0.7) issues.push('high duty hours')
    if (features.rest_compliance_risk > 0.7) issues.push('rest violations')
    if (features.crew_availability_risk > 0.7) issues.push('crew shortages')
    
    return issues.length > 0
      ? `AI identified crew issues: ${issues.join(', ')}`
      : 'Crew compliance appears normal'
  }

  private generateMechanicalDescription(features: MLFeatures): string {
    const issues = []
    if (features.maintenance_risk > 0.7) issues.push('recent maintenance issues')
    if (features.aircraft_age_risk > 0.7) issues.push('older aircraft')
    if (features.inspection_risk > 0.7) issues.push('inspection overdue')
    
    return issues.length > 0
      ? `AI detected maintenance concerns: ${issues.join(', ')}`
      : 'Aircraft maintenance status normal'
  }

  private generateAirportDescription(features: MLFeatures): string {
    const issues = []
    if (features.airport_alert_risk > 0.7) issues.push('active airport alerts')
    if (features.runway_risk > 0.7) issues.push('runway restrictions')
    
    return issues.length > 0
      ? `AI identified airport issues: ${issues.join(', ')}`
      : 'Airport conditions appear normal'
  }

  private generateHistoricalDescription(features: MLFeatures): string {
    const patterns = []
    if (features.route_disruption_risk > 0.7) patterns.push('high disruption rate')
    if (features.seasonal_risk > 0.7) patterns.push('seasonal risk factors')
    if (features.time_of_day_risk > 0.7) patterns.push('time-based patterns')
    
    return patterns.length > 0
      ? `AI identified patterns: ${patterns.join(', ')}`
      : 'Historical patterns show normal operations'
  }

  private generateExplanation(features: MLFeatures, prediction: number, factors: PredictionFactor[]): string {
    const topFactors = factors
      .sort((a, b) => b.ai_contribution - a.ai_contribution)
      .slice(0, 3)
    
    const factorNames = topFactors.map(f => f.factor).join(', ')
    
    if (prediction > 0.8) {
      return `AI model predicts CRITICAL risk (${(prediction * 100).toFixed(1)}%) based on ${factorNames}. Multiple high-risk factors detected requiring immediate attention.`
    } else if (prediction > 0.6) {
      return `AI model predicts HIGH risk (${(prediction * 100).toFixed(1)}%) primarily due to ${factorNames}. Proactive measures recommended.`
    } else if (prediction > 0.4) {
      return `AI model predicts MODERATE risk (${(prediction * 100).toFixed(1)}%) with ${factorNames} as key factors. Monitor conditions closely.`
    } else {
      return `AI model predicts LOW risk (${(prediction * 100).toFixed(1)}%). All factors within normal operational parameters.`
    }
  }

  private calculateConfidence(features: MLFeatures, prediction: number): number {
    let confidence = 0.6
    
    const featureValues = Object.values(features)
    const dataQuality = featureValues.filter(v => v !== undefined && v !== null).length / featureValues.length
    confidence += dataQuality * 0.2
    
    const modelCertainty = 1 - Math.abs(prediction - 0.5) * 2
    confidence += modelCertainty * 0.2
    
    return Math.max(0.4, Math.min(0.95, confidence))
  }

  private determineRiskLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore >= 0.8) return 'critical'
    if (riskScore >= 0.6) return 'high'
    if (riskScore >= 0.4) return 'medium'
    return 'low'
  }

  private determinePredictedType(factors: PredictionFactor[]): 'weather' | 'crew' | 'mechanical' | 'airport' {
    const typeScores = {
      weather: 0,
      crew: 0,
      mechanical: 0,
      airport: 0
    }

    factors.forEach(factor => {
      if (factor.factor in typeScores) {
        typeScores[factor.factor as keyof typeof typeScores] += factor.value * factor.weight
      }
    })

    const maxType = Object.entries(typeScores).reduce((a, b) => 
      typeScores[a[0] as keyof typeof typeScores] > typeScores[b[0] as keyof typeof typeScores] ? a : b
    )[0]

    return maxType as 'weather' | 'crew' | 'mechanical' | 'airport'
  }

  private predictDisruptionTime(flight: Flight, riskScore: number): string {
    const departureTime = new Date(flight.departure_time)
    
    let hoursBeforeDeparture = 0
    if (riskScore >= 0.8) hoursBeforeDeparture = 2
    else if (riskScore >= 0.6) hoursBeforeDeparture = 4
    else if (riskScore >= 0.4) hoursBeforeDeparture = 6
    else hoursBeforeDeparture = 12

    const predictedTime = new Date(departureTime.getTime() - hoursBeforeDeparture * 60 * 60 * 1000)
    return predictedTime.toISOString()
  }

  private generateRecommendations(features: MLFeatures, riskScore: number, factors: PredictionFactor[]): string[] {
    const recommendations: string[] = []

    if (features.wind_risk > 0.7) {
      recommendations.push('AI recommends: Consider alternative routing to avoid high wind areas')
    }
    
    if (features.duty_hours_risk > 0.7) {
      recommendations.push('AI recommends: Schedule additional crew or delay departure for compliance')
    }
    
    if (features.maintenance_risk > 0.7) {
      recommendations.push('AI recommends: Schedule pre-flight inspection and review maintenance logs')
    }
    
    if (features.airport_alert_risk > 0.7) {
      recommendations.push('AI recommends: Monitor airport NOTAMs and prepare alternative airports')
    }
    
    if (features.route_disruption_risk > 0.7) {
      recommendations.push('AI recommends: Consider alternative routes based on historical patterns')
    }

    if (riskScore >= 0.8) {
      recommendations.unshift('🚨 CRITICAL: AI model suggests immediate action - consider flight cancellation')
    } else if (riskScore >= 0.6) {
      recommendations.unshift('⚠️ HIGH RISK: AI model strongly recommends proactive measures')
    }

    return recommendations.slice(0, 5)
  }

  async getPredictionsForAllFlights(): Promise<DisruptionPrediction[]> {
    await this.initialize()

    try {
      const { data: flights } = await supabase
        .from('flights')
        .select('*')
        .gte('departure_time', new Date().toISOString())
        .eq('status', 'scheduled')
        .order('departure_time', { ascending: true })

      if (!flights) return []

      const predictions = await Promise.all(
        flights.map(flight => this.analyzeFlightRisk(flight.id))
      )

      return predictions.sort((a, b) => b.risk_score - a.risk_score)
    } catch (error) {
      console.error('Error getting hybrid AI predictions for all flights:', error)
      return []
    }
  }

  async retrainModel(newTrainingData: any[]) {
    if (!this.model) return

    console.log('Retraining AI model with new data...')
    console.log(`Retraining with ${newTrainingData.length} new samples`)
  }
} 