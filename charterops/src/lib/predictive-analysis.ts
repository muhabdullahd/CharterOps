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
}

export interface PredictionFactor {
  factor: string
  weight: number
  value: number
  description: string
}

export interface HistoricalData {
  flight_id: string
  departure_time: string
  arrival_time: string
  status: string
  issues: string[]
  weather_conditions: WeatherData
  crew_duty_hours: number
  maintenance_issues: string[]
}

export interface WeatherData {
  temperature: number
  wind_speed: number
  visibility: number
  precipitation: number
  turbulence: number
}

export class PredictiveAnalysisEngine {
  private static instance: PredictiveAnalysisEngine

  static getInstance(): PredictiveAnalysisEngine {
    if (!PredictiveAnalysisEngine.instance) {
      PredictiveAnalysisEngine.instance = new PredictiveAnalysisEngine()
    }
    return PredictiveAnalysisEngine.instance
  }

  async analyzeFlightRisk(flightId: string): Promise<DisruptionPrediction> {
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

      // Get historical data for similar flights
      const historicalData = await this.getHistoricalData(flight)
      
      // Calculate risk factors
      const weatherRisk = await this.calculateWeatherRisk(flight)
      const crewRisk = await this.calculateCrewRisk(flight)
      const mechanicalRisk = await this.calculateMechanicalRisk(flight)
      const airportRisk = await this.calculateAirportRisk(flight)
      const historicalRisk = this.calculateHistoricalRisk(historicalData)

      // Combine risk factors
      const riskFactors: PredictionFactor[] = [
        weatherRisk,
        crewRisk,
        mechanicalRisk,
        airportRisk,
        historicalRisk
      ]

      const totalRiskScore = this.calculateTotalRisk(riskFactors)
      const riskLevel = this.determineRiskLevel(totalRiskScore)
      const predictedType = this.determinePredictedType(riskFactors)
      const confidence = this.calculateConfidence(riskFactors)

      return {
        flight_id: flightId,
        risk_score: totalRiskScore,
        risk_level: riskLevel,
        predicted_disruption_type: predictedType,
        confidence: confidence,
        factors: riskFactors,
        predicted_time: this.predictDisruptionTime(flight, riskFactors),
        recommended_actions: this.generateRecommendations(riskFactors, riskLevel)
      }
    } catch (error) {
      console.error('Error analyzing flight risk:', error)
      throw error
    }
  }

  private async getHistoricalData(flight: Flight): Promise<HistoricalData[]> {
    // Get historical flights with similar characteristics
    const { data: historicalFlights } = await supabase
      .from('flights')
      .select('*')
      .eq('tail_number', flight.tail_number)
      .or(`origin.eq.${flight.origin},destination.eq.${flight.destination}`)
      .gte('departure_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .order('departure_time', { ascending: false })
      .limit(50)

    return historicalFlights?.map(f => ({
      flight_id: f.id,
      departure_time: f.departure_time,
      arrival_time: f.arrival_time,
      status: f.status,
      issues: f.issues,
      weather_conditions: this.generateMockWeatherData(),
      crew_duty_hours: 0, // Would be calculated from duty records
      maintenance_issues: []
    })) || []
  }

  private async calculateWeatherRisk(flight: Flight): Promise<PredictionFactor> {
    // Simulate weather data analysis
    const weatherData = this.generateMockWeatherData()
    const riskScore = this.analyzeWeatherConditions(weatherData)
    
    return {
      factor: 'weather',
      weight: 0.25,
      value: riskScore,
      description: `Weather conditions show ${riskScore > 0.7 ? 'adverse' : riskScore > 0.4 ? 'moderate' : 'favorable'} conditions for flight operations`
    }
  }

  private async calculateCrewRisk(flight: Flight): Promise<PredictionFactor> {
    // Analyze crew duty hours and rest compliance
    const crewIds = flight.crew_ids || []
    let totalDutyHours = 0
    let nonCompliantCrew = 0

    for (const crewId of crewIds) {
      const { data: crew } = await supabase
        .from('crew')
        .select('*')
        .eq('id', crewId)
        .single()

      if (crew) {
        totalDutyHours += crew.current_duty
        if (!crew.rest_compliant) {
          nonCompliantCrew++
        }
      }
    }

    const riskScore = this.calculateCrewRiskScore(totalDutyHours, nonCompliantCrew, crewIds.length)

    return {
      factor: 'crew',
      weight: 0.20,
      value: riskScore,
      description: `Crew duty hours: ${totalDutyHours.toFixed(1)}h, ${nonCompliantCrew} crew members non-compliant`
    }
  }

  private async calculateMechanicalRisk(flight: Flight): Promise<PredictionFactor> {
    // Analyze aircraft maintenance history
    const { data: alerts } = await supabase
      .from('alerts')
      .select('*')
      .eq('type', 'mechanical')
      .eq('flight_id', flight.id)
      .gte('triggered_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days

    const recentIssues = alerts?.length || 0
    const riskScore = Math.min(recentIssues * 0.3, 1.0)

    return {
      factor: 'mechanical',
      weight: 0.25,
      value: riskScore,
      description: `${recentIssues} mechanical issues in the last 7 days`
    }
  }

  private async calculateAirportRisk(flight: Flight): Promise<PredictionFactor> {
    // Analyze airport-specific risks
    const { data: airportAlerts } = await supabase
      .from('alerts')
      .select('*')
      .eq('type', 'airport')
      .or(`flight_id.eq.${flight.id}`)
      .gte('triggered_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours

    const airportIssues = airportAlerts?.length || 0
    const riskScore = Math.min(airportIssues * 0.4, 1.0)

    return {
      factor: 'airport',
      weight: 0.15,
      value: riskScore,
      description: `${airportIssues} airport-related issues in the last 24 hours`
    }
  }

  private calculateHistoricalRisk(historicalData: HistoricalData[]): PredictionFactor {
    // Analyze historical disruption patterns
    const totalFlights = historicalData.length
    const disruptedFlights = historicalData.filter(f => 
      f.status === 'delayed' || f.status === 'diverted' || f.issues.length > 0
    ).length

    const disruptionRate = totalFlights > 0 ? disruptedFlights / totalFlights : 0
    const riskScore = Math.min(disruptionRate * 2, 1.0) // Scale up the rate

    return {
      factor: 'historical',
      weight: 0.15,
      value: riskScore,
      description: `${disruptedFlights}/${totalFlights} flights had disruptions in the last 30 days`
    }
  }

  private calculateTotalRisk(factors: PredictionFactor[]): number {
    return factors.reduce((total, factor) => {
      return total + (factor.value * factor.weight)
    }, 0)
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

  private calculateConfidence(factors: PredictionFactor[]): number {
    // Calculate confidence based on data quality and factor consistency
    const avgValue = factors.reduce((sum, f) => sum + f.value, 0) / factors.length
    const variance = factors.reduce((sum, f) => sum + Math.pow(f.value - avgValue, 2), 0) / factors.length
    
    // Higher confidence when factors are consistent and we have good data
    const consistency = 1 - Math.sqrt(variance)
    const dataQuality = Math.min(factors.length / 5, 1) // Normalize to 0-1
    
    return Math.max(0.3, Math.min(0.95, (consistency + dataQuality) / 2))
  }

  private predictDisruptionTime(flight: Flight, factors: PredictionFactor[]): string {
    const departureTime = new Date(flight.departure_time)
    const riskScore = this.calculateTotalRisk(factors)
    
    // Predict disruption time based on risk level
    let hoursBeforeDeparture = 0
    if (riskScore >= 0.8) hoursBeforeDeparture = 2 // Critical: 2 hours before
    else if (riskScore >= 0.6) hoursBeforeDeparture = 4 // High: 4 hours before
    else if (riskScore >= 0.4) hoursBeforeDeparture = 6 // Medium: 6 hours before
    else hoursBeforeDeparture = 12 // Low: 12 hours before

    const predictedTime = new Date(departureTime.getTime() - hoursBeforeDeparture * 60 * 60 * 1000)
    return predictedTime.toISOString()
  }

  private generateRecommendations(factors: PredictionFactor[], riskLevel: string): string[] {
    const recommendations: string[] = []

    factors.forEach(factor => {
      if (factor.value > 0.6) {
        switch (factor.factor) {
          case 'weather':
            recommendations.push('Monitor weather conditions closely')
            recommendations.push('Consider alternative routing')
            break
          case 'crew':
            recommendations.push('Review crew duty hours and rest compliance')
            recommendations.push('Prepare backup crew assignment')
            break
          case 'mechanical':
            recommendations.push('Schedule aircraft inspection')
            recommendations.push('Review recent maintenance logs')
            break
          case 'airport':
            recommendations.push('Check airport NOTAMs and restrictions')
            recommendations.push('Verify airport availability')
            break
        }
      }
    })

    if (riskLevel === 'critical') {
      recommendations.unshift('Immediate action required')
      recommendations.push('Consider flight cancellation or significant delay')
    } else if (riskLevel === 'high') {
      recommendations.unshift('Proactive measures recommended')
    }

    return recommendations.slice(0, 5) // Limit to 5 recommendations
  }

  private generateMockWeatherData(): WeatherData {
    return {
      temperature: Math.random() * 40 - 10, // -10 to 30°C
      wind_speed: Math.random() * 30, // 0-30 knots
      visibility: Math.random() * 10, // 0-10 miles
      precipitation: Math.random() * 100, // 0-100%
      turbulence: Math.random() * 5 // 0-5 scale
    }
  }

  private analyzeWeatherConditions(weather: WeatherData): number {
    let riskScore = 0
    
    // Temperature extremes
    if (weather.temperature < -5 || weather.temperature > 35) riskScore += 0.2
    
    // High winds
    if (weather.wind_speed > 20) riskScore += 0.3
    
    // Poor visibility
    if (weather.visibility < 3) riskScore += 0.4
    
    // Precipitation
    if (weather.precipitation > 50) riskScore += 0.2
    
    // Turbulence
    if (weather.turbulence > 3) riskScore += 0.3

    return Math.min(riskScore, 1.0)
  }

  private calculateCrewRiskScore(dutyHours: number, nonCompliantCrew: number, totalCrew: number): number {
    let riskScore = 0
    
    // Duty hours risk
    if (dutyHours > 12) riskScore += 0.4
    else if (dutyHours > 10) riskScore += 0.2
    
    // Rest compliance risk
    if (totalCrew > 0) {
      const nonCompliantRate = nonCompliantCrew / totalCrew
      riskScore += nonCompliantRate * 0.6
    }

    return Math.min(riskScore, 1.0)
  }

  async getPredictionsForAllFlights(): Promise<DisruptionPrediction[]> {
    try {
      // Get all upcoming flights
      const { data: flights } = await supabase
        .from('flights')
        .select('*')
        .gte('departure_time', new Date().toISOString())
        .eq('status', 'scheduled')
        .order('departure_time', { ascending: true })

      if (!flights) return []

      // Analyze each flight
      const predictions = await Promise.all(
        flights.map(flight => this.analyzeFlightRisk(flight.id))
      )

      // Sort by risk score (highest first)
      return predictions.sort((a, b) => b.risk_score - a.risk_score)
    } catch (error) {
      console.error('Error getting predictions for all flights:', error)
      return []
    }
  }
} 