import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const origin = searchParams.get('origin')

    let query = supabase
      .from('flights')
      .select('*')
      .order('departure_time', { ascending: true })

    if (status) {
      query = query.eq('status', status)
    }

    if (origin) {
      query = query.eq('origin', origin)
    }

    const { data } = await query

    if (!data) {
      return NextResponse.json({ error: 'Failed to fetch flights' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
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
    const { tail_number, origin, destination, departure_time, arrival_time, crew_ids } = body

    // Validate required fields
    if (!tail_number || !origin || !destination || !departure_time || !arrival_time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const flightData = {
      tail_number,
      origin,
      destination,
      departure_time,
      arrival_time,
      crew_ids: crew_ids || [],
      status: 'scheduled',
      issues: []
    }

    const { data } = await supabase
      .from('flights')
      .insert([flightData])
      .select()

    if (!data) {
      return NextResponse.json({ error: 'Failed to create flight' }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 