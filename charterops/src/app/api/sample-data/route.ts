import { NextRequest, NextResponse } from 'next/server'
import { generateSampleData, clearSampleData } from '@/lib/sample-data'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'generate') {
      await generateSampleData()
      return NextResponse.json({ message: 'Sample data generated successfully' })
    } else if (action === 'clear') {
      await clearSampleData()
      return NextResponse.json({ message: 'Sample data cleared successfully' })
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "generate" or "clear"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error in sample data API:', error)
    return NextResponse.json(
      { error: 'Failed to process sample data request' },
      { status: 500 }
    )
  }
} 