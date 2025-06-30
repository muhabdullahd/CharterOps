import { supabase, Flight, Crew, Alert } from './supabase'


export interface WeatherData {
  airport: string
  visibility: number
  ceiling: number
  wind_speed: number
  wind_direction: number
  conditions: string[]
  timestamp: string
}

export interface DisruptionCheck {
  flight_id: string
  type: 'weather' | 'crew' | 'mechanical' | 'airport'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  details: any
}

export class DisruptionDetector {
  private static instance: DisruptionDetector
  private checkInterval: NodeJS.Timeout | null = null
  private isRunning = false

  static getInstance(): DisruptionDetector {
    if (!DisruptionDetector.instance) {
      DisruptionDetector.instance = new DisruptionDetector()
    }
    return DisruptionDetector.instance
  }

  async startMonitoring(intervalMs: number = 30000): Promise<void> {
    if (this.isRunning) return
    
    this.isRunning = true
    console.log('Starting disruption monitoring...')
    
    // Initial check
    await this.performDisruptionCheck()
    
    // Set up periodic checks
    this.checkInterval = setInterval(async () => {
      await this.performDisruptionCheck()
    }, intervalMs)
  }

  async stopMonitoring(): Promise<void> {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    this.isRunning = false
    console.log('Stopped disruption monitoring')
  }

  private async performDisruptionCheck(): Promise<void> {
    try {
      console.log('Performing disruption check...')
      
      // Get active flights
      const { data: flights } = await supabase
        .from('flights')
        .select('*')
        .in('status', ['scheduled', 'delayed'])
        // .gte('departure_time', new Date().toISOString())

      console.log('Flights fetched for disruption check:', flights?.map(f => ({ id: f.id, tail_number: f.tail_number, departure_time: f.departure_time, crew_ids: f.crew_ids })))

      if (!flights) return

      // Get crew data
      const { data: crew } = await supabase
        .from('crew')
        .select('*')

      console.log('Crew fetched for disruption check:', crew?.map(c => ({ id: c.id, name: c.name, rest_compliant: c.rest_compliant, assigned_flight: c.assigned_flight })))

      if (!crew) return

      // Check each flight for disruptions
      for (const flight of flights) {
        console.log(`Checking flight ${flight.id} (${flight.tail_number}) with crew:`, flight.crew_ids)
        const disruptions = await this.checkFlightDisruptions(flight, crew)
        
        if (disruptions.length === 0) {
          console.log(`No disruptions found for flight ${flight.id}`)
        } else {
          console.log(`Disruptions found for flight ${flight.id}:`, disruptions)
        }

        // Create alerts for new disruptions
        for (const disruption of disruptions) {
          await this.createAlertIfNew(disruption)
        }
      }
    } catch (error) {
      console.error('Error during disruption check:', error)
    }
  }

  private async checkFlightDisruptions(flight: Flight, crew: Crew[]): Promise<DisruptionCheck[]> {
    const disruptions: DisruptionCheck[] = []

    // Check weather disruptions
    const weatherDisruption = await this.checkWeatherDisruption(flight)
    if (weatherDisruption) disruptions.push(weatherDisruption)

    // Check crew duty disruptions
    const crewDisruption = await this.checkCrewDutyDisruption(flight, crew)
    if (crewDisruption) disruptions.push(crewDisruption)

    // Check airport/FBO disruptions
    const airportDisruption = await this.checkAirportDisruption(flight)
    if (airportDisruption) disruptions.push(airportDisruption)

    return disruptions
  }

  private async checkWeatherDisruption(flight: Flight): Promise<DisruptionCheck | null> {
    try {
      // Get weather data for origin and destination
      const originWeather = await this.getWeatherData(flight.origin)
      const destWeather = await this.getWeatherData(flight.destination)

      if (!originWeather && !destWeather) return null

      const issues: string[] = []
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'

      // Check origin weather
      if (originWeather) {
        if (originWeather.visibility < 1) {
          issues.push(`Low visibility at ${flight.origin}: ${originWeather.visibility}SM`)
          severity = 'high'
        }
        if (originWeather.ceiling < 500) {
          issues.push(`Low ceiling at ${flight.origin}: ${originWeather.ceiling}ft`)
          severity = 'high'
        }
        if (originWeather.wind_speed > 25) {
          issues.push(`High winds at ${flight.origin}: ${originWeather.wind_speed}kt`)
          severity = 'medium'
        }
      }

      // Check destination weather
      if (destWeather) {
        if (destWeather.visibility < 1) {
          issues.push(`Low visibility at ${flight.destination}: ${destWeather.visibility}SM`)
          severity = 'high'
        }
        if (destWeather.ceiling < 500) {
          issues.push(`Low ceiling at ${flight.destination}: ${destWeather.ceiling}ft`)
          severity = 'high'
        }
        if (destWeather.wind_speed > 25) {
          issues.push(`High winds at ${flight.destination}: ${destWeather.wind_speed}kt`)
          severity = 'medium'
        }
      }

      if (issues.length > 0) {
        return {
          flight_id: flight.id,
          type: 'weather',
          severity,
          message: `Weather Alert: ${issues.join(', ')}`,
          details: { originWeather, destWeather, issues }
        }
      }

      return null
    } catch (error) {
      console.error('Error checking weather disruption:', error)
      return null
    }
  }

  private async checkCrewDutyDisruption(flight: Flight, crew: Crew[]): Promise<DisruptionCheck | null> {
    try {
      const flightCrew = crew.filter(c => flight.crew_ids.includes(c.id))
      const issues: string[] = []
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'

      for (const member of flightCrew) {
        // FAA Part 135 duty limits
        if (member.current_duty > 10) {
          issues.push(`${member.name}: Duty violation (${member.current_duty}h > 10h limit)`)
          severity = 'critical'
        } else if (member.current_duty > 8) {
          issues.push(`${member.name}: Approaching duty limit (${member.current_duty}h)`)
          severity = 'high'
        }

        if (!member.rest_compliant) {
          issues.push(`${member.name}: Insufficient rest period`)
          severity = 'high'
        }
      }

      if (issues.length > 0) {
        return {
          flight_id: flight.id,
          type: 'crew',
          severity,
          message: `Crew Duty Alert: ${issues.join(', ')}`,
          details: { crewIssues: issues, flightCrew }
        }
      }

      return null
    } catch (error) {
      console.error('Error checking crew duty disruption:', error)
      return null
    }
  }

  private async checkAirportDisruption(flight: Flight): Promise<DisruptionCheck | null> {
    try {
      const issues: string[] = []
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'

      // Check for airport curfews (simplified - in real implementation, this would check NOTAMs)
      const currentHour = new Date().getHours()
      
      // Example curfew checks (these would come from NOTAM data)
      const curfewAirports = {
        'KTEB': { start: 23, end: 6 }, // Teterboro curfew
        'KJFK': { start: 0, end: 0 },  // No curfew
        'KLAX': { start: 23, end: 6 }  // LAX curfew
      }

      const originCurfew = curfewAirports[flight.origin as keyof typeof curfewAirports]
      const destCurfew = curfewAirports[flight.destination as keyof typeof curfewAirports]

      if (originCurfew && originCurfew.start !== originCurfew.end) {
        const departureHour = new Date(flight.departure_time).getHours()
        if (departureHour >= originCurfew.start || departureHour <= originCurfew.end) {
          issues.push(`Departure during curfew hours at ${flight.origin}`)
          severity = 'high'
        }
      }

      if (destCurfew && destCurfew.start !== destCurfew.end) {
        const arrivalHour = new Date(flight.arrival_time).getHours()
        if (arrivalHour >= destCurfew.start || arrivalHour <= destCurfew.end) {
          issues.push(`Arrival during curfew hours at ${flight.destination}`)
          severity = 'high'
        }
      }

      if (issues.length > 0) {
        return {
          flight_id: flight.id,
          type: 'airport',
          severity,
          message: `Airport Alert: ${issues.join(', ')}`,
          details: { issues }
        }
      }

      return null
    } catch (error) {
      console.error('Error checking airport disruption:', error)
      return null
    }
  }

  private async getWeatherData(airport: string): Promise<WeatherData | null> {
    try {
      // In a real implementation, this would call AviationWeather.gov API
      // For now, we'll simulate weather data
      const mockWeatherData: Record<string, WeatherData> = {
        'KTEB': {
          airport: 'KTEB',
          visibility: 10,
          ceiling: 2500,
          wind_speed: 15,
          wind_direction: 270,
          conditions: ['VFR'],
          timestamp: new Date().toISOString()
        },
        'KLAX': {
          airport: 'KLAX',
          visibility: 0.5,
          ceiling: 200,
          wind_speed: 8,
          wind_direction: 180,
          conditions: ['IFR', 'FOG'],
          timestamp: new Date().toISOString()
        },
        'KJFK': {
          airport: 'KJFK',
          visibility: 8,
          ceiling: 1500,
          wind_speed: 22,
          wind_direction: 320,
          conditions: ['MVFR'],
          timestamp: new Date().toISOString()
        }
      }

      return mockWeatherData[airport] || null
    } catch (error) {
      console.error('Error fetching weather data:', error)
      return null
    }
  }

  private async createAlertIfNew(disruption: DisruptionCheck): Promise<void> {
    try {
      // Check if this alert already exists
      const { data: existingAlerts } = await supabase
        .from('alerts')
        .select('*')
        .eq('flight_id', disruption.flight_id)
        .eq('type', disruption.type)
        .eq('resolved', false)

      // If no existing alert for this type, create one
      if (!existingAlerts || existingAlerts.length === 0) {
        const alertData = {
          flight_id: disruption.flight_id,
          type: disruption.type,
          message: disruption.message,
          triggered_at: new Date().toISOString(),
          resolved: false
        }

        await supabase
          .from('alerts')
          .insert([alertData])

        console.log(`Created new ${disruption.type} alert for flight ${disruption.flight_id}`)
      }
    } catch (error) {
      console.error('Error creating alert:', error)
    }
  }

  // Public method to manually trigger a disruption check
  async triggerManualCheck(): Promise<void> {
    await this.performDisruptionCheck()
  }
}

export const disruptionDetector = DisruptionDetector.getInstance() 