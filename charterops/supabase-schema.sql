-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    role TEXT CHECK (role IN ('dispatcher', 'pilot', 'ops_manager')) DEFAULT 'dispatcher',
    org_id UUID DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create flights table
CREATE TABLE IF NOT EXISTS public.flights (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tail_number TEXT NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
    arrival_time TIMESTAMP WITH TIME ZONE NOT NULL,
    crew_ids UUID[] DEFAULT '{}',
    status TEXT CHECK (status IN ('scheduled', 'delayed', 'diverted', 'completed')) DEFAULT 'scheduled',
    issues TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create crew table
CREATE TABLE IF NOT EXISTS public.crew (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    current_duty DECIMAL(4,1) DEFAULT 0.0,
    assigned_flight UUID REFERENCES public.flights(id) ON DELETE SET NULL,
    rest_compliant BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create duty_records table for tracking crew duty hours and rest periods
CREATE TABLE IF NOT EXISTS public.duty_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    crew_id UUID REFERENCES public.crew(id) ON DELETE CASCADE NOT NULL,
    flight_id UUID REFERENCES public.flights(id) ON DELETE SET NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duty_hours DECIMAL(4,1) DEFAULT 0.0,
    rest_start_time TIMESTAMP WITH TIME ZONE,
    rest_end_time TIMESTAMP WITH TIME ZONE,
    rest_hours DECIMAL(4,1) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    flight_id UUID REFERENCES public.flights(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('weather', 'crew', 'mechanical', 'airport', 'predictive')) NOT NULL,
    message TEXT NOT NULL,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    flight_id UUID REFERENCES public.flights(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('delay_notice', 'reroute_update', 'crew_reassignment')) NOT NULL,
    text TEXT NOT NULL,
    recipients TEXT[] NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create backups table
CREATE TABLE IF NOT EXISTS public.backups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    flight_id UUID REFERENCES public.flights(id) ON DELETE CASCADE NOT NULL,
    crew_ids UUID[] DEFAULT '{}',
    aircraft_id TEXT NOT NULL,
    fallback_airport TEXT NOT NULL,
    activated BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create predictions table for storing AI predictions
CREATE TABLE IF NOT EXISTS public.predictions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    flight_id UUID REFERENCES public.flights(id) ON DELETE CASCADE NOT NULL,
    risk_score DECIMAL(3,2) NOT NULL,
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')) NOT NULL,
    predicted_disruption_type TEXT CHECK (predicted_disruption_type IN ('weather', 'crew', 'mechanical', 'airport')) NOT NULL,
    confidence DECIMAL(3,2) NOT NULL,
    factors JSONB NOT NULL,
    predicted_time TIMESTAMP WITH TIME ZONE NOT NULL,
    recommended_actions TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prediction_accuracy table for tracking prediction accuracy
CREATE TABLE IF NOT EXISTS public.prediction_accuracy (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    prediction_id UUID REFERENCES public.predictions(id) ON DELETE CASCADE NOT NULL,
    flight_id UUID REFERENCES public.flights(id) ON DELETE CASCADE NOT NULL,
    was_accurate BOOLEAN NOT NULL,
    actual_disruption_type TEXT CHECK (actual_disruption_type IN ('weather', 'crew', 'mechanical', 'airport', 'none')),
    actual_disruption_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_flights_status ON public.flights(status);
CREATE INDEX IF NOT EXISTS idx_flights_departure_time ON public.flights(departure_time);
CREATE INDEX IF NOT EXISTS idx_alerts_flight_id ON public.alerts(flight_id);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON public.alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_messages_flight_id ON public.messages(flight_id);
CREATE INDEX IF NOT EXISTS idx_backups_flight_id ON public.backups(flight_id);
CREATE INDEX IF NOT EXISTS idx_duty_records_crew_id ON public.duty_records(crew_id);
CREATE INDEX IF NOT EXISTS idx_duty_records_start_time ON public.duty_records(start_time);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duty_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own data
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Flights are viewable by all authenticated users (for now)
DROP POLICY IF EXISTS "Authenticated users can view flights" ON public.flights;
CREATE POLICY "Authenticated users can view flights" ON public.flights
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert flights" ON public.flights;
CREATE POLICY "Authenticated users can insert flights" ON public.flights
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update flights" ON public.flights;
CREATE POLICY "Authenticated users can update flights" ON public.flights
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Crew policies
DROP POLICY IF EXISTS "Authenticated users can view crew" ON public.crew;
CREATE POLICY "Authenticated users can view crew" ON public.crew
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert crew" ON public.crew;
CREATE POLICY "Authenticated users can insert crew" ON public.crew
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update crew" ON public.crew;
CREATE POLICY "Authenticated users can update crew" ON public.crew
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Duty records policies
DROP POLICY IF EXISTS "Authenticated users can view duty records" ON public.duty_records;
CREATE POLICY "Authenticated users can view duty records" ON public.duty_records
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert duty records" ON public.duty_records;
CREATE POLICY "Authenticated users can insert duty records" ON public.duty_records
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update duty records" ON public.duty_records;
CREATE POLICY "Authenticated users can update duty records" ON public.duty_records
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Alerts policies
DROP POLICY IF EXISTS "Authenticated users can view alerts" ON public.alerts;
CREATE POLICY "Authenticated users can view alerts" ON public.alerts
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert alerts" ON public.alerts;
CREATE POLICY "Authenticated users can insert alerts" ON public.alerts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update alerts" ON public.alerts;
CREATE POLICY "Authenticated users can update alerts" ON public.alerts
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Messages policies
DROP POLICY IF EXISTS "Authenticated users can view messages" ON public.messages;
CREATE POLICY "Authenticated users can view messages" ON public.messages
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public.messages;
CREATE POLICY "Authenticated users can insert messages" ON public.messages
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Backups policies
DROP POLICY IF EXISTS "Authenticated users can view backups" ON public.backups;
CREATE POLICY "Authenticated users can view backups" ON public.backups
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert backups" ON public.backups;
CREATE POLICY "Authenticated users can insert backups" ON public.backups
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update backups" ON public.backups;
CREATE POLICY "Authenticated users can update backups" ON public.backups
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Predictions policies
DROP POLICY IF EXISTS "Authenticated users can view predictions" ON public.predictions;
CREATE POLICY "Authenticated users can view predictions" ON public.predictions
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert predictions" ON public.predictions;
CREATE POLICY "Authenticated users can insert predictions" ON public.predictions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update predictions" ON public.predictions;
CREATE POLICY "Authenticated users can update predictions" ON public.predictions
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Prediction accuracy policies
DROP POLICY IF EXISTS "Authenticated users can view prediction accuracy" ON public.prediction_accuracy;
CREATE POLICY "Authenticated users can view prediction accuracy" ON public.prediction_accuracy
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert prediction accuracy" ON public.prediction_accuracy;
CREATE POLICY "Authenticated users can insert prediction accuracy" ON public.prediction_accuracy
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update prediction accuracy" ON public.prediction_accuracy;
CREATE POLICY "Authenticated users can update prediction accuracy" ON public.prediction_accuracy
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role)
    VALUES (NEW.id, NEW.email, 'dispatcher');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample data for testing
INSERT INTO public.crew (name, current_duty, rest_compliant) VALUES
    ('Captain John Smith', 6.5, true),
    ('First Officer Sarah Johnson', 4.2, true),
    ('Captain Mike Davis', 8.1, false),
    ('First Officer Lisa Wilson', 3.8, true);

INSERT INTO public.flights (tail_number, origin, destination, departure_time, arrival_time, crew_ids, status) VALUES
    ('N550BA', 'KTEB', 'KLAX', NOW() + INTERVAL '2 hours', NOW() + INTERVAL '5 hours', ARRAY[]::UUID[], 'scheduled'),
    ('N550BB', 'KJFK', 'KSFO', NOW() + INTERVAL '4 hours', NOW() + INTERVAL '7 hours', ARRAY[]::UUID[], 'scheduled'),
    ('N550BC', 'KORD', 'KMIA', NOW() - INTERVAL '1 hour', NOW() + INTERVAL '2 hours', ARRAY[]::UUID[], 'delayed'); 