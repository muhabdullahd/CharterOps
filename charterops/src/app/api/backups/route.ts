import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { backupActivator } from '@/lib/backup-activator'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const flightId = searchParams.get('flight_id')
    const action = searchParams.get('action')

    if (!flightId) {
      return NextResponse.json({ error: 'Flight ID is required' }, { status: 400 })
    }

    if (action === 'suggest') {
      // Get backup plan suggestions
      const suggestions = await backupActivator.suggestBackupPlans(flightId)
      return NextResponse.json(suggestions)
    } else {
      // Get existing backup plans
      const backupPlans = await backupActivator.getBackupPlans(flightId)
      return NextResponse.json(backupPlans)
    }
  } catch (error) {
    console.error('Error in backups GET:', error)
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
    const { flight_id, crew_ids, aircraft_id, fallback_airport, priority, action } = body

    if (action === 'create') {
      if (!flight_id || !aircraft_id) {
        return NextResponse.json({ error: 'Flight ID and aircraft ID are required' }, { status: 400 })
      }

      const backupPlan = await backupActivator.createBackupPlan(flight_id, {
        crew_ids: crew_ids || [],
        aircraft_id,
        fallback_airport,
        priority
      })

      if (!backupPlan) {
        return NextResponse.json({ error: 'Failed to create backup plan' }, { status: 500 })
      }

      return NextResponse.json(backupPlan)
    }

    if (action === 'activate') {
      if (!flight_id) {
        return NextResponse.json({ error: 'Flight ID is required' }, { status: 400 })
      }

      const result = await backupActivator.activateBackupPlan(flight_id, body.backup_id)

      if (!result.success) {
        return NextResponse.json({ 
          error: result.message,
          details: result.errors 
        }, { status: 400 })
      }

      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in backups POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 