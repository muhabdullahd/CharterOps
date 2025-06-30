// Test script for disruption detection system
// Run with: node test-disruption-system.js

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client (you'll need to set these environment variables)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDisruptionSystem() {
  console.log('🧪 Testing Disruption Detection System...\n')

  try {
    // Test 1: Check if we can connect to Supabase
    console.log('1. Testing Supabase connection...')
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

    const { data: testData, error: testError } = await supabase
      .from('flights')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.log('❌ Supabase connection failed:', testError.message)
      return
    }
    console.log('✅ Supabase connection successful')

    // Test 2: Check if we have sample data
    console.log('\n2. Checking sample data...')
    const { data: flights } = await supabase
      .from('flights')
      .select('*')
    
    const { data: crew } = await supabase
      .from('crew')
      .select('*')
    
    const { data: alerts } = await supabase
      .from('alerts')
      .select('*')
      .eq('resolved', false)

    console.log(`✅ Found ${flights?.length || 0} flights`)
    console.log(`✅ Found ${crew?.length || 0} crew members`)
    console.log(`✅ Found ${alerts?.length || 0} active alerts`)

    // Test 3: Test API endpoints
    console.log('\n3. Testing API endpoints...')
    
    // Test monitor status endpoint
    try {
      const statusResponse = await fetch('http://localhost:3000/api/monitor?action=status')
      if (statusResponse.ok) {
        const status = await statusResponse.json()
        console.log('✅ Monitor status endpoint working:', status)
      } else {
        console.log('❌ Monitor status endpoint failed:', statusResponse.status)
      }
    } catch (error) {
      console.log('❌ Monitor status endpoint error:', error.message)
    }

    // Test 4: Create a test alert
    console.log('\n4. Creating test alert...')
    if (flights && flights.length > 0) {
      const testFlight = flights[0]
      const { data: newAlert, error: alertError } = await supabase
        .from('alerts')
        .insert([{
          flight_id: testFlight.id,
          type: 'weather',
          message: 'Test weather alert - Low visibility at destination',
          triggered_at: new Date().toISOString(),
          resolved: false
        }])
        .select()

      if (alertError) {
        console.log('❌ Failed to create test alert:', alertError.message)
      } else {
        console.log('✅ Test alert created:', newAlert[0].id)
      }
    }

    // Test 5: Check crew compliance
    console.log('\n5. Testing crew compliance...')
    if (crew && crew.length > 0) {
      const testCrew = crew[0]
      console.log(`✅ Crew member ${testCrew.name} has ${testCrew.current_duty}h duty time`)
      console.log(`✅ Rest compliant: ${testCrew.rest_compliant}`)
    }

    // Test 6: Test backup plans
    console.log('\n6. Testing backup plans...')
    if (flights && flights.length > 0) {
      const testFlight = flights[0]
      const { data: backups } = await supabase
        .from('backups')
        .select('*')
        .eq('flight_id', testFlight.id)

      console.log(`✅ Found ${backups?.length || 0} backup plans for flight ${testFlight.tail_number}`)
    }

    console.log('\n🎉 Disruption system test completed!')
    console.log('\nNext steps:')
    console.log('1. Start the development server: npm run dev')
    console.log('2. Open http://localhost:3000')
    console.log('3. Log in and start the disruption monitoring')
    console.log('4. Create some test flights and watch for alerts')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testDisruptionSystem() 