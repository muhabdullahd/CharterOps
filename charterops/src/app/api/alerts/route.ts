import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { flight_id, type, message } = body

    // Validate required fields
    if (!flight_id || !type || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate alert type
    const validTypes = ['weather', 'crew', 'mechanical', 'airport']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid alert type' }, { status: 400 })
    }

    const alertData = {
      flight_id,
      type,
      message,
      triggered_at: new Date().toISOString(),
      resolved: false
    }

    const { data } = await supabase
      .from('alerts')
      .insert([alertData])
      .select()

    if (!data) {
      return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 })
    }

    // Update flight status if it's a mechanical alert
    if (type === 'mechanical') {
      // First get current issues
      const { data: flightData } = await supabase
        .from('flights')
        .select('issues')
        .eq('id', flight_id)
        .single()

      const currentIssues = flightData?.issues || []
      const updatedIssues = [...currentIssues, message]

      await supabase
        .from('flights')
        .update({ 
          status: 'delayed',
          issues: updatedIssues
        })
        .eq('id', flight_id)
    }

    return NextResponse.json(data[0])
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 