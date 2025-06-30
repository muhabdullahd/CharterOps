import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file')
}

// Create client with fallback values for development
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

// Database types
export interface User {
  id: string
  email: string
  role: 'dispatcher' | 'pilot' | 'ops_manager'
  org_id: string
  created_at: string
}

export interface Flight {
  id: string
  tail_number: string
  origin: string
  destination: string
  departure_time: string
  arrival_time: string
  crew_ids: string[]
  status: 'scheduled' | 'delayed' | 'diverted' | 'completed'
  issues: string[]
  created_at: string
  updated_at: string
}

export interface Crew {
  id: string
  name: string
  current_duty: number
  assigned_flight: string | null
  rest_compliant: boolean
  created_at: string
  updated_at: string
}

export interface Alert {
  id: string
  flight_id: string
  type: 'weather' | 'crew' | 'mechanical' | 'airport' | 'predictive'
  message: string
  triggered_at: string
  resolved: boolean
  created_at: string
}

export interface Message {
  id: string
  flight_id: string
  type: 'delay_notice' | 'reroute_update' | 'crew_reassignment'
  text: string
  recipients: string[]
  sent_at: string
  created_at: string
}

export interface Backup {
  id: string
  flight_id: string
  crew_ids: string[]
  aircraft_id: string
  fallback_airport: string
  activated: boolean
  priority?: number
  created_at: string
  updated_at: string
}

export interface Prediction {
  id: string
  flight_id: string
  risk_score: number
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  predicted_disruption_type: 'weather' | 'crew' | 'mechanical' | 'airport'
  confidence: number
  factors: any
  predicted_time: string
  recommended_actions: string[]
  created_at: string
  updated_at: string
}

export interface PredictionAccuracy {
  id: string
  prediction_id: string
  flight_id: string
  was_accurate: boolean
  actual_disruption_type: 'weather' | 'crew' | 'mechanical' | 'airport' | 'none'
  actual_disruption_time: string | null
  notes: string | null
  created_at: string
} 