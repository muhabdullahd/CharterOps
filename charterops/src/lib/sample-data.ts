import { supabase } from './supabase'

export async function generateSampleData() {
  try {
    // Generate sample flights
    const sampleFlights = [
      {
        tail_number: 'N12345',
        origin: 'KLAX',
        destination: 'KJFK',
        departure_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        arrival_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        crew_ids: [],
        status: 'scheduled' as const,
        issues: []
      },
      {
        tail_number: 'N67890',
        origin: 'KORD',
        destination: 'KLAX',
        departure_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
        arrival_time: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
        crew_ids: [],
        status: 'scheduled' as const,
        issues: []
      },
      {
        tail_number: 'N11111',
        origin: 'KDFW',
        destination: 'KORD',
        departure_time: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), // 1 hour from now
        arrival_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        crew_ids: [],
        status: 'scheduled' as const,
        issues: []
      },
      {
        tail_number: 'N22222',
        origin: 'KJFK',
        destination: 'KLAX',
        departure_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
        arrival_time: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        crew_ids: [],
        status: 'scheduled' as const,
        issues: []
      },
      {
        tail_number: 'N33333',
        origin: 'KLAX',
        destination: 'KDFW',
        departure_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
        arrival_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        crew_ids: [],
        status: 'scheduled' as const,
        issues: []
      }
    ]

    // Generate sample crew
    const sampleCrew = [
      {
        name: 'John Smith',
        current_duty: 6.5,
        assigned_flight: null,
        rest_compliant: true
      },
      {
        name: 'Sarah Johnson',
        current_duty: 8.2,
        assigned_flight: null,
        rest_compliant: false
      },
      {
        name: 'Mike Davis',
        current_duty: 4.1,
        assigned_flight: null,
        rest_compliant: true
      },
      {
        name: 'Lisa Wilson',
        current_duty: 10.5,
        assigned_flight: null,
        rest_compliant: false
      },
      {
        name: 'Tom Brown',
        current_duty: 2.3,
        assigned_flight: null,
        rest_compliant: true
      }
    ]

    // Insert sample flights
    const { data: flights, error: flightsError } = await supabase
      .from('flights')
      .insert(sampleFlights)
      .select()

    if (flightsError) {
      console.error('Error inserting sample flights:', flightsError)
      return
    }

    console.log('Inserted sample flights:', flights)

    // Insert sample crew
    const { data: crew, error: crewError } = await supabase
      .from('crew')
      .insert(sampleCrew)
      .select()

    if (crewError) {
      console.error('Error inserting sample crew:', crewError)
      return
    }

    console.log('Inserted sample crew:', crew)

    // Generate some sample alerts for testing
    if (flights && flights.length > 0) {
      const sampleAlerts = [
        {
          flight_id: flights[0].id,
          type: 'weather' as const,
          message: 'Thunderstorm warning in destination area',
          triggered_at: new Date().toISOString(),
          resolved: false
        },
        {
          flight_id: flights[1].id,
          type: 'crew' as const,
          message: 'Crew duty time approaching limit',
          triggered_at: new Date().toISOString(),
          resolved: false
        },
        {
          flight_id: flights[2].id,
          type: 'mechanical' as const,
          message: 'Minor maintenance issue reported',
          triggered_at: new Date().toISOString(),
          resolved: false
        }
      ]

      const { data: alerts, error: alertsError } = await supabase
        .from('alerts')
        .insert(sampleAlerts)
        .select()

      if (alertsError) {
        console.error('Error inserting sample alerts:', alertsError)
      } else {
        console.log('Inserted sample alerts:', alerts)
      }
    }

    console.log('Sample data generation completed successfully!')
  } catch (error) {
    console.error('Error generating sample data:', error)
  }
}

// Function to clear all sample data
export async function clearSampleData() {
  try {
    // Clear in reverse order due to foreign key constraints
    await supabase.from('prediction_accuracy').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('predictions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('alerts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('backups').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('duty_records').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('crew').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('flights').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    console.log('Sample data cleared successfully!')
  } catch (error) {
    console.error('Error clearing sample data:', error)
  }
} 