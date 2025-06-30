import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { crewComplianceEngine } from '@/lib/crew-compliance'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const crewId = searchParams.get('id')

    if (crewId) {
      // Get specific crew member with compliance check
      const { data: crew } = await supabase
        .from('crew')
        .select('*')
        .eq('id', crewId)
        .single()

      if (!crew) {
        return NextResponse.json({ error: 'Crew member not found' }, { status: 404 })
      }

      const compliance = await crewComplianceEngine.performComplianceCheck(crewId)

      return NextResponse.json({
        ...crew,
        compliance
      })
    } else {
      // Get all crew members
      const { data: crew } = await supabase
        .from('crew')
        .select('*')
        .order('name')

      if (!crew) {
        return NextResponse.json({ error: 'Failed to fetch crew' }, { status: 500 })
      }

      return NextResponse.json(crew)
    }
  } catch (error) {
    console.error('Error in crew GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { crew_id, duty_hours, flight_id, action } = body

    if (!crew_id) {
      return NextResponse.json({ error: 'Crew ID is required' }, { status: 400 })
    }

    if (action === 'update_duty') {
      if (duty_hours === undefined) {
        return NextResponse.json({ error: 'Duty hours are required' }, { status: 400 })
      }

      await crewComplianceEngine.updateCrewDutyHours(crew_id, flight_id || '', duty_hours)
      
      return NextResponse.json({ message: 'Duty hours updated successfully' })
    }

    if (action === 'start_rest') {
      await crewComplianceEngine.startRestPeriod(crew_id)
      
      return NextResponse.json({ message: 'Rest period started' })
    }

    if (action === 'end_rest') {
      await crewComplianceEngine.endRestPeriod(crew_id)
      
      return NextResponse.json({ message: 'Rest period ended' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in crew PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 