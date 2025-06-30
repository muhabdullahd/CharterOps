import { supabase } from './supabase'
import { Flight } from './supabase'

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
}

export interface PredictionFactor {
  factor: string
  weight: number
  value: number
  description: string
}

export interface MLFeatures {
  // Weather features
  temperature: number
  wind_speed: number
  visibility: number
  precipitation: number
  turbulence: number
  humidity: number
  pressure: number
  
  // Crew features
  total_duty_hours: number
  non_compliant_crew_ratio: number
  crew_experience_avg: number
  rest_hours_remaining: number
  
  // Mechanical features
  recent_maintenance_issues: number
  aircraft_age: number
  last_inspection_days: number
  component_wear_score: number
  
  // Airport features
  airport_alerts_24h: number
  runway_availability: number
  ground_handling_delay: number
  
  // Historical features
  route_disruption_rate: number
  aircraft_disruption_rate: number
  seasonal_factor: number
  time_of_day_factor: number
  
  // Flight features
  flight_duration: number
  distance: number
  passenger_count: number
  cargo_weight: number
}

export class AIPredictiveEngine {
  private static instance: AIPredictiveEngine
  private model: { predict: (features: number[]) => number; getFeatureImportance: () => Record<string, number> } | null = null
  private isModelLoaded = false

  static getInstance(): AIPredictiveEngine {
    if (!AIPredictiveEngine.instance) {
      AIPredictiveEngine.instance = new AIPredictiveEngine()
    }
    return AIPredictiveEngine.instance
  }

  async initialize() {
    if (this.isModelLoaded) return

    try {
      // In a real implementation, you would load a trained model
      // For demo purposes, we'll simulate AI model loading
      console.log('Loading AI model...')
      await this.loadModel()
      this.isModelLoaded = true
      console.log('AI model loaded successfully')
    } catch (error) {
      console.error('Failed to load AI model:', error)
      // Fallback to rule-based system
    }
  }

  private async loadModel() {
    // Simulate model loading delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // In a real implementation, you would:
    // 1. Load a pre-trained TensorFlow.js model
    // 2. Load model weights and architecture
    // 3. Initialize the model for inference
    
    // For demo, we'll create a simulated model
    this.model = {
      predict: (features: number[]) => this.simulateAIPrediction(features),
      getFeatureImportance: () => this.getSimulatedFeatureImportance()
    }
  }

  private simulateAIPrediction(features: number[]): number {
    // Simulate AI model prediction using a neural network-like calculation
    // This is a simplified version - real AI would use actual neural networks
    
    // Normalize features to 0-1 range
    const normalizedFeatures = features.map(f => Math.min(Math.max(f, 0), 1))
    
    // Simulate neural network layers
    const layer1 = this.simulateNeuralLayer(normalizedFeatures, 24, 12)
    const layer2 = this.simulateNeuralLayer(layer1, 12, 6)
    const output = this.simulateNeuralLayer(layer2, 6, 1)
    
    return Math.min(Math.max(output[0], 0), 1)
  }

  private simulateNeuralLayer(inputs: number[], inputSize: number, outputSize: number): number[] {
    const outputs = []
    
    for (let i = 0; i < outputSize; i++) {
      let sum = 0
      for (let j = 0; j < inputSize; j++) {
        // Simulate weights and bias
        const weight = Math.sin(i * j + Date.now() * 0.0001) * 0.5 + 0.5
        sum += inputs[j] * weight
      }
      // Apply activation function (ReLU-like)
      outputs.push(Math.max(0, Math.tanh(sum)))
    }
    
    return outputs
  }

  private getSimulatedFeatureImportance(): Record<string, number> {
    return {
      'weather_conditions': 0.25,
      'crew_duty_hours': 0.20,
      'maintenance_history': 0.18,
      'airport_restrictions': 0.15,
      'historical_patterns': 0.12,
      'flight_duration': 0.10
    }
  }

  async analyzeFlightRisk(flightId: string): Promise<DisruptionPrediction> {
    await this.initialize()

    try {
      // Get flight data
      const { data: flight, error: flightError } = await supabase
        .from('flights')
        .select('*')
        .eq('id', flightId)
        .single()

      if (flightError || !flight) {
        throw new Error('Flight not found')
      }

      // Extract AI features
      const features = await this.extractFeatures(flight)
      
      // Get AI prediction
      const featureArray = this.featuresToArray(features)
      const aiRiskScore = this.model ? this.model.predict(featureArray) : 0;
      
      // Get feature importance for explainability
      const featureImportance = this.model ? this.model.getFeatureImportance() : {};
      
      // Calculate individual factor scores using AI insights
      const factors = await this.calculateAIFactors(features, aiRiskScore, featureImportance)
      
      const riskLevel = this.determineRiskLevel(aiRiskScore)
      const predictedType = this.determinePredictedType(factors)
      const confidence = this.calculateAIConfidence(features, aiRiskScore)

      return {
        flight_id: flightId,
        risk_score: aiRiskScore,
        risk_level: riskLevel,
        predicted_disruption_type: predictedType,
        confidence: confidence,
        factors: factors,
        predicted_time: this.predictDisruptionTime(flight, aiRiskScore),
        recommended_actions: this.generateAIRecommendations(features, aiRiskScore),
        ai_model_version: 'v1.0.0',
        feature_importance: featureImportance
      }
    } catch (error) {
      console.error('Error in AI flight risk analysis:', error)
      throw error
    }
  }

  private async extractFeatures(flight: Flight): Promise<MLFeatures> {
    // Extract comprehensive features for AI analysis
    
    // Weather features (simulated - in real implementation, get from weather API)
    const weatherFeatures = await this.getWeatherFeatures(flight)
    
    // Crew features
    const crewFeatures = await this.getCrewFeatures(flight)
    
    // Mechanical features
    const mechanicalFeatures = await this.getMechanicalFeatures(flight)
    
    // Airport features
    const airportFeatures = await this.getAirportFeatures(flight)
    
    // Historical features
    const historicalFeatures = await this.getHistoricalFeatures(flight)
    
    // Flight features
    const flightFeatures = this.getFlightFeatures(flight)
    
    return {
      ...weatherFeatures,
      ...crewFeatures,
      ...mechanicalFeatures,
      ...airportFeatures,
      ...historicalFeatures,
      ...flightFeatures
    }
  }

  private async getWeatherFeatures(flight: Flight) {
    // Simulate weather data - in real implementation, call weather API
    const departureTime = new Date(flight.departure_time)
    const hour = departureTime.getHours()
    
    return {
      temperature: 15 + 10 * Math.sin(hour * Math.PI / 12) + (Math.random() - 0.5) * 10,
      wind_speed: 5 + Math.random() * 25,
      visibility: 5 + Math.random() * 10,
      precipitation: Math.random() * 100,
      turbulence: Math.random() * 5,
      humidity: 40 + Math.random() * 40,
      pressure: 1000 + (Math.random() - 0.5) * 50
    }
  }

  private async getCrewFeatures(flight: Flight) {
    const crewIds = flight.crew_ids || []
    let totalDutyHours = 0
    let nonCompliantCrew = 0
    let totalExperience = 0

    for (const crewId of crewIds) {
      const { data: crew } = await supabase
        .from('crew')
        .select('*')
        .eq('id', crewId)
        .single()

      if (crew) {
        totalDutyHours += crew.current_duty
        if (!crew.rest_compliant) nonCompliantCrew++
        totalExperience += Math.random() * 20 + 5 // Simulate experience years
      }
    }

    return {
      total_duty_hours: totalDutyHours,
      non_compliant_crew_ratio: crewIds.length > 0 ? nonCompliantCrew / crewIds.length : 0,
      crew_experience_avg: crewIds.length > 0 ? totalExperience / crewIds.length : 0,
      rest_hours_remaining: Math.max(0, 14 - totalDutyHours) // FAA rest requirement
    }
  }

  private async getMechanicalFeatures(flight: Flight) {
    const { data: alerts } = await supabase
      .from('alerts')
      .select('*')
      .eq('type', 'mechanical')
      .eq('flight_id', flight.id)
      .gte('triggered_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    return {
      recent_maintenance_issues: alerts?.length || 0,
      aircraft_age: Math.random() * 20 + 5, // Simulate aircraft age
      last_inspection_days: Math.random() * 365,
      component_wear_score: Math.random()
    }
  }

  private async getAirportFeatures(flight: Flight) {
    const { data: airportAlerts } = await supabase
      .from('alerts')
      .select('*')
      .eq('type', 'airport')
      .or(`flight_id.eq.${flight.id}`)
      .gte('triggered_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    return {
      airport_alerts_24h: airportAlerts?.length || 0,
      runway_availability: Math.random(),
      ground_handling_delay: Math.random() * 2
    }
  }

  private async getHistoricalFeatures(flight: Flight) {
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
      route_disruption_rate: disruptedFlights / totalFlights,
      aircraft_disruption_rate: Math.random() * 0.3,
      seasonal_factor: Math.sin(month * Math.PI / 6), // Seasonal pattern
      time_of_day_factor: Math.sin(hour * Math.PI / 12) // Time of day pattern
    }
  }

  private getFlightFeatures(flight: Flight) {
    const departureTime = new Date(flight.departure_time)
    const arrivalTime = new Date(flight.arrival_time)
    const duration = (arrivalTime.getTime() - departureTime.getTime()) / (1000 * 60 * 60) // hours

    return {
      flight_duration: duration,
      distance: duration * 500 + Math.random() * 200, // Rough distance estimate
      passenger_count: Math.floor(Math.random() * 20) + 1,
      cargo_weight: Math.random() * 1000
    }
  }

  private featuresToArray(features: MLFeatures): number[] {
    return Object.values(features)
  }

  private async calculateAIFactors(features: MLFeatures, aiRiskScore: number, featureImportance: Record<string, number>): Promise<PredictionFactor[]> {
    // Use AI insights to calculate individual factor scores
    const factors: PredictionFactor[] = []

    // Weather factor
    const weatherScore = this.calculateWeatherScore(features)
    factors.push({
      factor: 'weather',
      weight: featureImportance.weather_conditions || 0.25,
      value: weatherScore,
      description: this.generateWeatherDescription(features)
    })

    // Crew factor
    const crewScore = this.calculateCrewScore(features)
    factors.push({
      factor: 'crew',
      weight: featureImportance.crew_duty_hours || 0.20,
      value: crewScore,
      description: this.generateCrewDescription(features)
    })

    // Mechanical factor
    const mechanicalScore = this.calculateMechanicalScore(features)
    factors.push({
      factor: 'mechanical',
      weight: featureImportance.maintenance_history || 0.18,
      value: mechanicalScore,
      description: this.generateMechanicalDescription(features)
    })

    // Airport factor
    const airportScore = this.calculateAirportScore(features)
    factors.push({
      factor: 'airport',
      weight: featureImportance.airport_restrictions || 0.15,
      value: airportScore,
      description: this.generateAirportDescription(features)
    })

    // Historical factor
    const historicalScore = this.calculateHistoricalScore(features)
    factors.push({
      factor: 'historical',
      weight: featureImportance.historical_patterns || 0.12,
      value: historicalScore,
      description: this.generateHistoricalDescription(features)
    })

    return factors
  }

  private calculateWeatherScore(features: MLFeatures): number {
    let score = 0
    
    // AI-enhanced weather scoring
    if (features.temperature < -5 || features.temperature > 35) score += 0.3
    if (features.wind_speed > 20) score += 0.4
    if (features.visibility < 3) score += 0.5
    if (features.precipitation > 50) score += 0.3
    if (features.turbulence > 3) score += 0.4
    if (features.humidity > 80) score += 0.2
    if (features.pressure < 980 || features.pressure > 1030) score += 0.2

    return Math.min(score, 1.0)
  }

  private calculateCrewScore(features: MLFeatures): number {
    let score = 0
    
    if (features.total_duty_hours > 12) score += 0.5
    else if (features.total_duty_hours > 10) score += 0.3
    
    score += features.non_compliant_crew_ratio * 0.6
    
    if (features.rest_hours_remaining < 8) score += 0.3
    
    return Math.min(score, 1.0)
  }

  private calculateMechanicalScore(features: MLFeatures): number {
    let score = 0
    
    score += Math.min(features.recent_maintenance_issues * 0.2, 0.6)
    if (features.aircraft_age > 15) score += 0.2
    if (features.last_inspection_days > 180) score += 0.3
    score += features.component_wear_score * 0.4

    return Math.min(score, 1.0)
  }

  private calculateAirportScore(features: MLFeatures): number {
    let score = 0
    
    score += Math.min(features.airport_alerts_24h * 0.3, 0.6)
    if (features.runway_availability < 0.5) score += 0.4
    score += features.ground_handling_delay * 0.3

    return Math.min(score, 1.0)
  }

  private calculateHistoricalScore(features: MLFeatures): number {
    let score = 0
    
    score += features.route_disruption_rate * 0.4
    score += features.aircraft_disruption_rate * 0.3
    score += Math.abs(features.seasonal_factor) * 0.2
    score += Math.abs(features.time_of_day_factor) * 0.1

    return Math.min(score, 1.0)
  }

  private generateWeatherDescription(features: MLFeatures): string {
    const conditions = []
    if (features.temperature < -5 || features.temperature > 35) conditions.push('extreme temperatures')
    if (features.wind_speed > 20) conditions.push('high winds')
    if (features.visibility < 3) conditions.push('poor visibility')
    if (features.precipitation > 50) conditions.push('heavy precipitation')
    if (features.turbulence > 3) conditions.push('moderate turbulence')
    
    return conditions.length > 0 
      ? `Adverse weather conditions detected: ${conditions.join(', ')}`
      : 'Weather conditions appear favorable for flight operations'
  }

  private generateCrewDescription(features: MLFeatures): string {
    const issues = []
    if (features.total_duty_hours > 10) issues.push('high duty hours')
    if (features.non_compliant_crew_ratio > 0) issues.push('rest compliance issues')
    if (features.rest_hours_remaining < 8) issues.push('insufficient rest time')
    
    return issues.length > 0
      ? `Crew issues detected: ${issues.join(', ')}`
      : 'Crew appears compliant with duty and rest requirements'
  }

  private generateMechanicalDescription(features: MLFeatures): string {
    const issues = []
    if (features.recent_maintenance_issues > 0) issues.push('recent maintenance issues')
    if (features.aircraft_age > 15) issues.push('older aircraft')
    if (features.last_inspection_days > 180) issues.push('inspection overdue')
    if (features.component_wear_score > 0.7) issues.push('component wear concerns')
    
    return issues.length > 0
      ? `Maintenance concerns: ${issues.join(', ')}`
      : 'Aircraft maintenance status appears normal'
  }

  private generateAirportDescription(features: MLFeatures): string {
    const issues = []
    if (features.airport_alerts_24h > 0) issues.push('recent airport alerts')
    if (features.runway_availability < 0.5) issues.push('runway restrictions')
    if (features.ground_handling_delay > 0.5) issues.push('ground handling delays')
    
    return issues.length > 0
      ? `Airport issues detected: ${issues.join(', ')}`
      : 'Airport conditions appear normal'
  }

  private generateHistoricalDescription(features: MLFeatures): string {
    const patterns = []
    if (features.route_disruption_rate > 0.3) patterns.push('high route disruption rate')
    if (features.aircraft_disruption_rate > 0.2) patterns.push('aircraft reliability concerns')
    if (Math.abs(features.seasonal_factor) > 0.5) patterns.push('seasonal risk factors')
    
    return patterns.length > 0
      ? `Historical patterns indicate: ${patterns.join(', ')}`
      : 'Historical data shows normal operational patterns'
  }

  private calculateAIConfidence(features: MLFeatures, aiRiskScore: number): number {
    // AI confidence based on data quality and model certainty
    let confidence = 0.5 // Base confidence
    
    // Data completeness bonus
    const hasWeatherData = features.temperature !== undefined
    const hasCrewData = features.total_duty_hours !== undefined
    const hasMaintenanceData = features.recent_maintenance_issues !== undefined
    
    if (hasWeatherData) confidence += 0.1
    if (hasCrewData) confidence += 0.1
    if (hasMaintenanceData) confidence += 0.1
    
    // Model certainty (simulated)
    const modelCertainty = 1 - Math.abs(aiRiskScore - 0.5) * 2 // Higher confidence for extreme predictions
    confidence += modelCertainty * 0.2
    
    return Math.max(0.3, Math.min(0.95, confidence))
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

  private generateAIRecommendations(features: MLFeatures, riskScore: number): string[] {
    const recommendations: string[] = []

    // AI-generated recommendations based on feature analysis
    if (features.wind_speed > 20) {
      recommendations.push('Consider alternative routing to avoid high wind areas')
    }
    
    if (features.total_duty_hours > 10) {
      recommendations.push('Schedule additional crew or delay departure to ensure compliance')
    }
    
    if (features.recent_maintenance_issues > 2) {
      recommendations.push('Schedule pre-flight inspection and review maintenance logs')
    }
    
    if (features.airport_alerts_24h > 0) {
      recommendations.push('Monitor airport NOTAMs and prepare alternative airports')
    }
    
    if (features.route_disruption_rate > 0.3) {
      recommendations.push('Consider alternative routes based on historical disruption patterns')
    }

    if (riskScore >= 0.8) {
      recommendations.unshift('CRITICAL: Immediate action required - consider flight cancellation')
    } else if (riskScore >= 0.6) {
      recommendations.unshift('HIGH RISK: Proactive measures strongly recommended')
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
      console.error('Error getting AI predictions for all flights:', error)
      return []
    }
  }
} 