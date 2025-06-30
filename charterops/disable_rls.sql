-- Disable RLS on all tables
ALTER TABLE flights DISABLE ROW LEVEL SECURITY;
ALTER TABLE crew DISABLE ROW LEVEL SECURITY;
ALTER TABLE alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE backup_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE duty_records DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('flights', 'crew', 'alerts', 'backup_plans', 'duty_records')
ORDER BY tablename; 