import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { disruptionMonitor } from '@/lib/disruption-monitor'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const flightId = searchParams.get('flight_id')

    if (action === 'status') {
      const status = await disruptionMonitor.getStatus()
      return NextResponse.json(status)
    }

    if (action === 'summary') {
      const summary = await disruptionMonitor.getDisruptionSummary()
      return NextResponse.json(summary)
    }

    if (action === 'details' && flightId) {
      const details = await disruptionMonitor.getFlightDisruptionDetails(flightId)
      if (!details) {
        return NextResponse.json({ error: 'Flight not found' }, { status: 404 })
      }
      return NextResponse.json(details)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in monitor GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, alert_id } = body

    if (action === 'start') {
      await disruptionMonitor.startMonitoring()
      return NextResponse.json({ message: 'Monitoring started' })
    }

    if (action === 'stop') {
      await disruptionMonitor.stopMonitoring()
      return NextResponse.json({ message: 'Monitoring stopped' })
    }

    if (action === 'check') {
      await disruptionMonitor.triggerManualCheck()
      return NextResponse.json({ message: 'Manual check triggered' })
    }

    if (action === 'resolve_alert' && alert_id) {
      await disruptionMonitor.resolveAlert(alert_id)
      return NextResponse.json({ message: 'Alert resolved' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in monitor POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 