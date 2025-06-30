import { disruptionDetector } from './disruption-detector'
import { crewComplianceEngine } from './crew-compliance'
import { backupActivator } from './backup-activator'
import { supabase, Flight, Alert } from './supabase'

export interface MonitoringStatus {
  isRunning: boolean
  lastCheck: string
  activeAlerts: number
  flightsMonitored: number
  crewComplianceIssues: number
}

export interface DisruptionSummary {
  flight_id: string
  tail_number: string
  origin: string
  destination: string
  status: string
  alerts: Alert[]
  crewIssues: string[]
  hasBackupPlans: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export class DisruptionMonitor {
  private static instance: DisruptionMonitor
  private isRunning = false
  private lastCheck: Date | null = null

  static getInstance(): DisruptionMonitor {
    if (!DisruptionMonitor.instance) {
      DisruptionMonitor.instance = new DisruptionMonitor()
    }
    return DisruptionMonitor.instance
  }

  async startMonitoring(): Promise<void> {
    if (this.isRunning) {
      console.log('Monitoring already running')
      return
    }

    this.isRunning = true
    console.log('Starting comprehensive disruption monitoring...')

    // Start the disruption detector
    await disruptionDetector.startMonitoring(30000) // Check every 30 seconds

    // Set up periodic comprehensive checks
    setInterval(async () => {
      await this.performComprehensiveCheck()
    }, 60000) // Comprehensive check every minute

    // Initial check
    await this.performComprehensiveCheck()
  }

  async stopMonitoring(): Promise<void> {
    this.isRunning = false
    await disruptionDetector.stopMonitoring()
    console.log('Stopped comprehensive disruption monitoring')
  }

  async getStatus(): Promise<MonitoringStatus> {
    const { data: alerts } = await supabase
      .from('alerts')
      .select('*')
      .eq('resolved', false)

    const { data: flights } = await supabase
      .from('flights')
      .select('*')
      .in('status', ['scheduled', 'delayed'])

    const { data: crew } = await supabase
      .from('crew')
      .select('*')
      .eq('rest_compliant', false)

    return {
      isRunning: this.isRunning,
      lastCheck: this.lastCheck?.toISOString() || 'Never',
      activeAlerts: alerts?.length || 0,
      flightsMonitored: flights?.length || 0,
      crewComplianceIssues: crew?.length || 0
    }
  }

  async getDisruptionSummary(): Promise<DisruptionSummary[]> {
    try {
      const { data: flights } = await supabase
        .from('flights')
        .select('*')
        .in('status', ['scheduled', 'delayed'])

      if (!flights) return []

      const summaries: DisruptionSummary[] = []

      for (const flight of flights) {
        // Get alerts for this flight
        const { data: alerts } = await supabase
          .from('alerts')
          .select('*')
          .eq('flight_id', flight.id)
          .eq('resolved', false)

        // Check crew compliance
        const crewCompliance = await crewComplianceEngine.checkFlightCrewCompliance(flight)
        const crewIssues = crewCompliance
          .filter(c => !c.is_compliant)
          .flatMap(c => c.violations)

        // Check for backup plans
        const backupPlans = await backupActivator.getBackupPlans(flight.id)
        const hasBackupPlans = backupPlans.length > 0

        // Determine overall severity
        const severity = this.calculateSeverity(alerts || [], crewIssues, hasBackupPlans)

        summaries.push({
          flight_id: flight.id,
          tail_number: flight.tail_number,
          origin: flight.origin,
          destination: flight.destination,
          status: flight.status,
          alerts: alerts || [],
          crewIssues,
          hasBackupPlans,
          severity
        })
      }

      return summaries.sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        return severityOrder[b.severity] - severityOrder[a.severity]
      })
    } catch (error) {
      console.error('Error getting disruption summary:', error)
      return []
    }
  }

  private async performComprehensiveCheck(): Promise<void> {
    try {
      this.lastCheck = new Date()
      console.log('Performing comprehensive disruption check...')

      // Get all active flights
      const { data: flights } = await supabase
        .from('flights')
        .select('*')
        .in('status', ['scheduled', 'delayed'])

      if (!flights) return

      for (const flight of flights) {
        await this.checkFlightComprehensive(flight)
      }

      console.log('Comprehensive check completed')
    } catch (error) {
      console.error('Error during comprehensive check:', error)
    }
  }

  private async checkFlightComprehensive(flight: Flight): Promise<void> {
    try {
      // Check for existing alerts
      const { data: existingAlerts } = await supabase
        .from('alerts')
        .select('*')
        .eq('flight_id', flight.id)
        .eq('resolved', false)

      const hasActiveAlerts = existingAlerts && existingAlerts.length > 0

      // If flight has active alerts, check if backup plans should be suggested
      if (hasActiveAlerts) {
        await this.suggestBackupPlansIfNeeded(flight)
      }

      // Check crew compliance and update if needed
      await this.updateCrewCompliance(flight)

    } catch (error) {
      console.error(`Error checking flight ${flight.id}:`, error)
    }
  }

  private async suggestBackupPlansIfNeeded(flight: Flight): Promise<void> {
    try {
      // Check if flight already has backup plans
      const existingBackups = await backupActivator.getBackupPlans(flight.id)
      
      if (existingBackups.length === 0) {
        // Get suggestions
        const suggestions = await backupActivator.suggestBackupPlans(flight.id)
        
        if (suggestions.length > 0) {
          // Create an alert suggesting backup plans
          await supabase
            .from('alerts')
            .insert([{
              flight_id: flight.id,
              type: 'mechanical',
              message: `Backup plans available: ${suggestions.length} options suggested`,
              triggered_at: new Date().toISOString(),
              resolved: false
            }])

          console.log(`Suggested ${suggestions.length} backup plans for flight ${flight.id}`)
        }
      }
    } catch (error) {
      console.error('Error suggesting backup plans:', error)
    }
  }

  private async updateCrewCompliance(flight: Flight): Promise<void> {
    try {
      for (const crewId of flight.crew_ids) {
        const compliance = await crewComplianceEngine.performComplianceCheck(crewId)
        
        if (!compliance.is_compliant) {
          // Update crew member's rest_compliant status
          await supabase
            .from('crew')
            .update({ 
              rest_compliant: compliance.rest_compliant,
              current_duty: compliance.current_duty_hours
            })
            .eq('id', crewId)
        }
      }
    } catch (error) {
      console.error('Error updating crew compliance:', error)
    }
  }

  private calculateSeverity(
    alerts: Alert[], 
    crewIssues: string[], 
    hasBackupPlans: boolean
  ): 'low' | 'medium' | 'high' | 'critical' {
    let severity = 'low'

    // Check alert severity
    for (const alert of alerts) {
      if (alert.type === 'mechanical') {
        severity = 'critical'
        break
      } else if (alert.type === 'crew' && crewIssues.length > 0) {
        severity = 'high'
      } else if (alert.type === 'weather') {
        severity = severity === 'low' ? 'medium' : severity
      }
    }

    // Check crew issues
    if (crewIssues.some(issue => issue.includes('Duty violation'))) {
      severity = 'critical'
    } else if (crewIssues.length > 0) {
      severity = severity === 'low' ? 'high' : severity
    }

    // Having backup plans reduces severity
    if (hasBackupPlans && severity === 'critical') {
      severity = 'high'
    } else if (hasBackupPlans && severity === 'high') {
      severity = 'medium'
    }

    return severity as 'low' | 'medium' | 'high' | 'critical'
  }

  async triggerManualCheck(): Promise<void> {
    await this.performComprehensiveCheck()
  }

  async resolveAlert(alertId: string): Promise<void> {
    try {
      await supabase
        .from('alerts')
        .update({ resolved: true })
        .eq('id', alertId)

      console.log(`Alert ${alertId} resolved`)
    } catch (error) {
      console.error('Error resolving alert:', error)
    }
  }

  async getFlightDisruptionDetails(flightId: string): Promise<{
    flight: Flight
    alerts: Alert[]
    crewCompliance: any[]
    backupPlans: any[]
    suggestions: any[]
  } | null> {
    try {
      // Get flight
      const { data: flight } = await supabase
        .from('flights')
        .select('*')
        .eq('id', flightId)
        .single()

      if (!flight) return null

      // Get alerts
      const { data: alerts } = await supabase
        .from('alerts')
        .select('*')
        .eq('flight_id', flightId)
        .order('triggered_at', { ascending: false })

      // Get crew compliance
      const crewCompliance = await crewComplianceEngine.checkFlightCrewCompliance(flight)

      // Get backup plans
      const backupPlans = await backupActivator.getBackupPlans(flightId)

      // Get suggestions
      const suggestions = await backupActivator.suggestBackupPlans(flightId)

      return {
        flight,
        alerts: alerts || [],
        crewCompliance,
        backupPlans,
        suggestions
      }
    } catch (error) {
      console.error('Error getting flight disruption details:', error)
      return null
    }
  }
}

export const disruptionMonitor = DisruptionMonitor.getInstance() 