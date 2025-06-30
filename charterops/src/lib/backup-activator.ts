import { supabase, Flight, Backup, Crew } from './supabase'
import { crewComplianceEngine } from './crew-compliance'

export interface BackupActivationResult {
  success: boolean
  backup_id: string
  flight_id: string
  activated_crew: string[]
  activated_aircraft: string
  fallback_airport?: string
  message: string
  errors: string[]
}

export interface BackupPlan {
  id: string
  flight_id: string
  crew_ids: string[]
  aircraft_id: string
  fallback_airport?: string
  priority: number
  conditions: string[]
}

export class BackupActivator {
  private static instance: BackupActivator

  static getInstance(): BackupActivator {
    if (!BackupActivator.instance) {
      BackupActivator.instance = new BackupActivator()
    }
    return BackupActivator.instance
  }

  async activateBackupPlan(flightId: string, backupId?: string): Promise<BackupActivationResult> {
    try {
      // Get the flight
      const { data: flight } = await supabase
        .from('flights')
        .select('*')
        .eq('id', flightId)
        .single()

      if (!flight) {
        return {
          success: false,
          backup_id: '',
          flight_id: flightId,
          activated_crew: [],
          activated_aircraft: '',
          message: 'Flight not found',
          errors: ['Flight not found']
        }
      }

      // Get available backup plans
      let backupPlans: Backup[] = []
      
      if (backupId) {
        // Use specific backup plan
        const { data: specificBackup } = await supabase
          .from('backups')
          .select('*')
          .eq('id', backupId)
          .eq('flight_id', flightId)
          .single()

        if (specificBackup) {
          backupPlans = [specificBackup]
        }
      } else {
        // Get all available backup plans for this flight
        const { data: allBackups } = await supabase
          .from('backups')
          .select('*')
          .eq('flight_id', flightId)
          .eq('activated', false)
          .order('priority', { ascending: true })

        backupPlans = allBackups || []
      }

      if (backupPlans.length === 0) {
        return {
          success: false,
          backup_id: '',
          flight_id: flightId,
          activated_crew: [],
          activated_aircraft: '',
          message: 'No available backup plans found',
          errors: ['No backup plans available']
        }
      }

      // Try to activate the best available backup plan
      for (const backup of backupPlans) {
        const result = await this.tryActivateBackup(flight, backup)
        if (result.success) {
          return result
        }
      }

      return {
        success: false,
        backup_id: '',
        flight_id: flightId,
        activated_crew: [],
        activated_aircraft: '',
        message: 'No backup plans could be activated',
        errors: ['All backup plans failed validation']
      }

    } catch (error) {
      console.error('Error activating backup plan:', error)
      return {
        success: false,
        backup_id: '',
        flight_id: flightId,
        activated_crew: [],
        activated_aircraft: '',
        message: 'Error activating backup plan',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async tryActivateBackup(flight: Flight, backup: Backup): Promise<BackupActivationResult> {
    const errors: string[] = []

    // Check if backup crew is available and compliant
    const availableCrew = await this.validateBackupCrew(backup.crew_ids)
    if (availableCrew.length === 0) {
      errors.push('No backup crew available or compliant')
    }

    // Check if backup aircraft is available
    const aircraftAvailable = await this.checkAircraftAvailability(backup.aircraft_id)
    if (!aircraftAvailable) {
      errors.push('Backup aircraft not available')
    }

    // Check if fallback airport is suitable
    if (backup.fallback_airport) {
      const airportSuitable = await this.checkAirportSuitability(backup.fallback_airport)
      if (!airportSuitable) {
        errors.push('Fallback airport not suitable')
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        backup_id: backup.id,
        flight_id: flight.id,
        activated_crew: [],
        activated_aircraft: backup.aircraft_id,
        fallback_airport: backup.fallback_airport,
        message: 'Backup plan validation failed',
        errors
      }
    }

    // Activate the backup plan
    try {
      // Update backup plan status
      await supabase
        .from('backups')
        .update({ 
          activated: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', backup.id)

      // Update flight with new crew and aircraft
      const updatedFlightData: Partial<Flight> = {
        crew_ids: availableCrew.map(c => c.id),
        status: 'scheduled' // Reset to scheduled since we have a backup
      }

      if (backup.fallback_airport) {
        updatedFlightData.destination = backup.fallback_airport
      }

      await supabase
        .from('flights')
        .update(updatedFlightData)
        .eq('id', flight.id)

      // Create activation alert
      await supabase
        .from('alerts')
        .insert([{
          flight_id: flight.id,
          type: 'mechanical',
          message: `Backup plan activated: ${backup.aircraft_id} with crew ${availableCrew.map(c => c.name).join(', ')}`,
          triggered_at: new Date().toISOString(),
          resolved: false
        }])

      return {
        success: true,
        backup_id: backup.id,
        flight_id: flight.id,
        activated_crew: availableCrew.map(c => c.id),
        activated_aircraft: backup.aircraft_id,
        fallback_airport: backup.fallback_airport,
        message: `Backup plan activated successfully with ${backup.aircraft_id}`,
        errors: []
      }

    } catch (error) {
      console.error('Error during backup activation:', error)
      return {
        success: false,
        backup_id: backup.id,
        flight_id: flight.id,
        activated_crew: [],
        activated_aircraft: backup.aircraft_id,
        fallback_airport: backup.fallback_airport,
        message: 'Error during backup activation',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async validateBackupCrew(crewIds: string[]): Promise<Crew[]> {
    const availableCrew: Crew[] = []

    for (const crewId of crewIds) {
      try {
        // Get crew member
        const { data: crew } = await supabase
          .from('crew')
          .select('*')
          .eq('id', crewId)
          .single()

        if (!crew) continue

        // Check compliance
        const compliance = await crewComplianceEngine.performComplianceCheck(crewId)
        
        if (compliance.is_compliant && crew.rest_compliant) {
          availableCrew.push(crew)
        }
      } catch (error) {
        console.error(`Error validating crew ${crewId}:`, error)
      }
    }

    return availableCrew
  }

  private async checkAircraftAvailability(aircraftId: string): Promise<boolean> {
    try {
      // In a real implementation, this would check aircraft maintenance status,
      // current location, and availability from an aircraft management system
      
      // For now, we'll simulate aircraft availability
      const availableAircraft = ['N550BA', 'N550BB', 'N550BC']
      return availableAircraft.includes(aircraftId)
    } catch (error) {
      console.error('Error checking aircraft availability:', error)
      return false
    }
  }

  private async checkAirportSuitability(airportCode: string): Promise<boolean> {
    try {
      // In a real implementation, this would check:
      // - Runway length and weight capacity
      // - FBO availability
      // - Fuel availability
      // - Customs/immigration if international
      
      // For now, we'll simulate airport suitability
      const suitableAirports = ['KTEB', 'KJFK', 'KLAX', 'KSFO', 'KORD', 'KMIA']
      return suitableAirports.includes(airportCode)
    } catch (error) {
      console.error('Error checking airport suitability:', error)
      return false
    }
  }

  async createBackupPlan(flightId: string, backupData: Partial<Backup>): Promise<Backup | null> {
    try {
      const backupPlan = {
        flight_id: flightId,
        crew_ids: backupData.crew_ids || [],
        aircraft_id: backupData.aircraft_id || '',
        fallback_airport: backupData.fallback_airport,
        activated: false,
        priority: backupData.priority || 1
      }

      const { data } = await supabase
        .from('backups')
        .insert([backupPlan])
        .select()

      return data ? data[0] : null
    } catch (error) {
      console.error('Error creating backup plan:', error)
      return null
    }
  }

  async getBackupPlans(flightId: string): Promise<Backup[]> {
    try {
      const { data } = await supabase
        .from('backups')
        .select('*')
        .eq('flight_id', flightId)
        .order('priority', { ascending: true })

      return data || []
    } catch (error) {
      console.error('Error getting backup plans:', error)
      return []
    }
  }

  async suggestBackupPlans(flightId: string): Promise<BackupPlan[]> {
    try {
      // Get available crew
      const availableCrew = await crewComplianceEngine.getCrewAvailability()
      
      // Get the flight
      const { data: flight } = await supabase
        .from('flights')
        .select('*')
        .eq('id', flightId)
        .single()

      if (!flight) return []

      const suggestions: BackupPlan[] = []

      // Suggestion 1: Same route, different crew
      if (availableCrew.length >= 2) {
        suggestions.push({
          id: '',
          flight_id: flightId,
          crew_ids: availableCrew.slice(0, 2).map(c => c.id),
          aircraft_id: flight.tail_number,
          priority: 1,
          conditions: ['Original aircraft available']
        })
      }

      // Suggestion 2: Different aircraft, same route
      const availableAircraft = ['N550BA', 'N550BB', 'N550BC'].filter(a => a !== flight.tail_number)
      if (availableAircraft.length > 0 && availableCrew.length >= 2) {
        suggestions.push({
          id: '',
          flight_id: flightId,
          crew_ids: availableCrew.slice(0, 2).map(c => c.id),
          aircraft_id: availableAircraft[0],
          priority: 2,
          conditions: ['Backup aircraft available']
        })
      }

      // Suggestion 3: Alternative airport
      const alternativeAirports = ['KTEB', 'KJFK', 'KLAX', 'KSFO'].filter(a => a !== flight.destination)
      if (alternativeAirports.length > 0 && availableCrew.length >= 2) {
        suggestions.push({
          id: '',
          flight_id: flightId,
          crew_ids: availableCrew.slice(0, 2).map(c => c.id),
          aircraft_id: flight.tail_number,
          fallback_airport: alternativeAirports[0],
          priority: 3,
          conditions: ['Alternative airport available']
        })
      }

      return suggestions
    } catch (error) {
      console.error('Error suggesting backup plans:', error)
      return []
    }
  }
}

export const backupActivator = BackupActivator.getInstance() 