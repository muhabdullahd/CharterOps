import { supabase, Crew, Flight } from './supabase'

export interface DutyRecord {
  crew_id: string
  flight_id: string
  start_time: string
  end_time: string
  duty_hours: number
  rest_start_time?: string
  rest_end_time?: string
  rest_hours?: number
}

export interface ComplianceCheck {
  crew_id: string
  is_compliant: boolean
  current_duty_hours: number
  rest_compliant: boolean
  rest_hours_required: number
  rest_hours_actual: number
  violations: string[]
  warnings: string[]
}

export class CrewComplianceEngine {
  private static instance: CrewComplianceEngine

  static getInstance(): CrewComplianceEngine {
    if (!CrewComplianceEngine.instance) {
      CrewComplianceEngine.instance = new CrewComplianceEngine()
    }
    return CrewComplianceEngine.instance
  }

  // FAA Part 135 Duty Time Limits
  private readonly DUTY_LIMITS = {
    MAX_DUTY_HOURS: 10,
    MAX_DUTY_HOURS_WITH_REST: 12,
    MIN_REST_HOURS: 10,
    MAX_DUTY_DAYS: 7,
    MAX_DUTY_HOURS_PER_WEEK: 60
  }

  async calculateCrewDuty(crewId: string, flightId: string): Promise<number> {
    try {
      // Get all duty records for this crew member in the last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      
      const { data: dutyRecords } = await supabase
        .from('duty_records')
        .select('*')
        .eq('crew_id', crewId)
        .gte('start_time', twentyFourHoursAgo)
        .order('start_time', { ascending: true })

      if (!dutyRecords) return 0

      let totalDutyHours = 0

      for (const record of dutyRecords) {
        const startTime = new Date(record.start_time)
        const endTime = new Date(record.end_time)
        const dutyHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
        totalDutyHours += dutyHours
      }

      return totalDutyHours
    } catch (error) {
      console.error('Error calculating crew duty:', error)
      return 0
    }
  }

  async checkRestCompliance(crewId: string): Promise<boolean> {
    try {
      // Get the most recent rest period
      const { data: restRecords } = await supabase
        .from('duty_records')
        .select('*')
        .eq('crew_id', crewId)
        .not('rest_start_time', 'is', null)
        .order('rest_start_time', { ascending: false })
        .limit(1)

      if (!restRecords || restRecords.length === 0) {
        return false // No rest record found
      }

      const latestRest = restRecords[0]
      const restStart = new Date(latestRest.rest_start_time!)
      const restEnd = new Date(latestRest.rest_end_time!)
      const restHours = (restEnd.getTime() - restStart.getTime()) / (1000 * 60 * 60)

      return restHours >= this.DUTY_LIMITS.MIN_REST_HOURS
    } catch (error) {
      console.error('Error checking rest compliance:', error)
      return false
    }
  }

  async performComplianceCheck(crewId: string): Promise<ComplianceCheck> {
    try {
      const currentDutyHours = await this.calculateCrewDuty(crewId, '')
      const restCompliant = await this.checkRestCompliance(crewId)
      
      const violations: string[] = []
      const warnings: string[] = []

      // Check duty hour violations
      if (currentDutyHours > this.DUTY_LIMITS.MAX_DUTY_HOURS) {
        violations.push(`Duty hours exceed maximum: ${currentDutyHours.toFixed(1)}h > ${this.DUTY_LIMITS.MAX_DUTY_HOURS}h`)
      } else if (currentDutyHours > this.DUTY_LIMITS.MAX_DUTY_HOURS - 2) {
        warnings.push(`Approaching duty limit: ${currentDutyHours.toFixed(1)}h`)
      }

      // Check rest compliance
      if (!restCompliant) {
        violations.push('Insufficient rest period')
      }

      const isCompliant = violations.length === 0

      return {
        crew_id: crewId,
        is_compliant: isCompliant,
        current_duty_hours: currentDutyHours,
        rest_compliant: restCompliant,
        rest_hours_required: this.DUTY_LIMITS.MIN_REST_HOURS,
        rest_hours_actual: restCompliant ? this.DUTY_LIMITS.MIN_REST_HOURS : 0,
        violations,
        warnings
      }
    } catch (error) {
      console.error('Error performing compliance check:', error)
      return {
        crew_id: crewId,
        is_compliant: false,
        current_duty_hours: 0,
        rest_compliant: false,
        rest_hours_required: this.DUTY_LIMITS.MIN_REST_HOURS,
        rest_hours_actual: 0,
        violations: ['Error checking compliance'],
        warnings: []
      }
    }
  }

  async updateCrewDutyHours(crewId: string, flightId: string, dutyHours: number): Promise<void> {
    try {
      // Update crew member's current duty hours
      await supabase
        .from('crew')
        .update({ 
          current_duty: dutyHours,
          rest_compliant: await this.checkRestCompliance(crewId)
        })
        .eq('id', crewId)

      // Create duty record
      const dutyRecord: DutyRecord = {
        crew_id: crewId,
        flight_id: flightId,
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        duty_hours: dutyHours
      }

      await supabase
        .from('duty_records')
        .insert([dutyRecord])

    } catch (error) {
      console.error('Error updating crew duty hours:', error)
    }
  }

  async startRestPeriod(crewId: string): Promise<void> {
    try {
      const restStartTime = new Date().toISOString()
      
      // Update crew member to indicate rest period
      await supabase
        .from('crew')
        .update({ 
          rest_compliant: false,
          assigned_flight: null
        })
        .eq('id', crewId)

      // Create rest record
      const restRecord = {
        crew_id: crewId,
        flight_id: null,
        start_time: restStartTime,
        end_time: restStartTime,
        duty_hours: 0,
        rest_start_time: restStartTime,
        rest_end_time: null,
        rest_hours: 0
      }

      await supabase
        .from('duty_records')
        .insert([restRecord])

    } catch (error) {
      console.error('Error starting rest period:', error)
    }
  }

  async endRestPeriod(crewId: string): Promise<void> {
    try {
      const restEndTime = new Date().toISOString()
      
      // Get the current rest record
      const { data: restRecords } = await supabase
        .from('duty_records')
        .select('*')
        .eq('crew_id', crewId)
        .not('rest_start_time', 'is', null)
        .is('rest_end_time', null)
        .order('rest_start_time', { ascending: false })
        .limit(1)

      if (restRecords && restRecords.length > 0) {
        const restRecord = restRecords[0]
        const restStart = new Date(restRecord.rest_start_time!)
        const restEnd = new Date(restEndTime)
        const restHours = (restEnd.getTime() - restStart.getTime()) / (1000 * 60 * 60)

        // Update rest record
        await supabase
          .from('duty_records')
          .update({
            rest_end_time: restEndTime,
            rest_hours: restHours
          })
          .eq('id', restRecord.id)

        // Update crew member
        await supabase
          .from('crew')
          .update({ 
            rest_compliant: restHours >= this.DUTY_LIMITS.MIN_REST_HOURS,
            current_duty: 0
          })
          .eq('id', crewId)
      }

    } catch (error) {
      console.error('Error ending rest period:', error)
    }
  }

  async checkFlightCrewCompliance(flight: Flight): Promise<ComplianceCheck[]> {
    try {
      const complianceChecks: ComplianceCheck[] = []

      for (const crewId of flight.crew_ids) {
        const compliance = await this.performComplianceCheck(crewId)
        complianceChecks.push(compliance)
      }

      return complianceChecks
    } catch (error) {
      console.error('Error checking flight crew compliance:', error)
      return []
    }
  }

  async getCrewAvailability(): Promise<Crew[]> {
    try {
      const { data: crew } = await supabase
        .from('crew')
        .select('*')
        .eq('rest_compliant', true)
        .lt('current_duty', this.DUTY_LIMITS.MAX_DUTY_HOURS - 2)

      return crew || []
    } catch (error) {
      console.error('Error getting crew availability:', error)
      return []
    }
  }
}

export const crewComplianceEngine = CrewComplianceEngine.getInstance() 