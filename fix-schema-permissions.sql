-- Grant public schema permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant all necessary permissions on all tables in public schema
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;

-- Verify permissions
SELECT 
    schemaname,
    tablename,
    has_table_privilege('authenticated', schemaname||'.'||tablename, 'SELECT') as can_select,
    has_table_privilege('authenticated', schemaname||'.'||tablename, 'INSERT') as can_insert
FROM pg_tables 
WHERE schemaname = 'public' 
LIMIT 5;
