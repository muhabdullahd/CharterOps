import { NextRequest, NextResponse } from 'next/server'
import { HybridAIEngine } from '@/lib/hybrid-ai-engine'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const flightId = searchParams.get('flight_id')
    
    const engine = HybridAIEngine.getInstance()
    
    if (flightId) {
      // Get prediction for specific flight
      const prediction = await engine.analyzeFlightRisk(flightId)
      return NextResponse.json({ prediction })
    } else {
      // Get predictions for all upcoming flights
      const predictions = await engine.getPredictionsForAllFlights()
      return NextResponse.json({ predictions })
    }
  } catch (error) {
    console.error('Error in hybrid AI predictions API:', error)
    return NextResponse.json(
      { error: 'Failed to get AI predictions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { flight_id } = body
    
    if (!flight_id) {
      return NextResponse.json(
        { error: 'flight_id is required' },
        { status: 400 }
      )
    }
    
    const engine = HybridAIEngine.getInstance()
    const prediction = await engine.analyzeFlightRisk(flight_id)
    
    return NextResponse.json({ prediction })
  } catch (error) {
    console.error('Error in hybrid AI predictions API:', error)
    return NextResponse.json(
      { error: 'Failed to analyze flight risk with AI' },
      { status: 500 }
    )
  }
} 