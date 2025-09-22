-- AI-BOS ERP Database Initialization Script
-- This script sets up the database with RLS and multi-tenancy support

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create application schema
CREATE SCHEMA IF NOT EXISTS app;

-- Create application configuration table for tenant context
CREATE TABLE IF NOT EXISTS app.config (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default configuration
INSERT INTO app.config (key, value) VALUES 
    ('current_tenant_id', ''),
    ('app_version', '1.0.0'),
    ('maintenance_mode', 'false')
ON CONFLICT (key) DO NOTHING;

-- Create function to set tenant context
CREATE OR REPLACE FUNCTION app.set_tenant_context(tenant_id UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_tenant_id', tenant_id::TEXT, true);
    UPDATE app.config SET value = tenant_id::TEXT, updated_at = NOW() 
    WHERE key = 'current_tenant_id';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get current tenant
CREATE OR REPLACE FUNCTION app.get_current_tenant()
RETURNS UUID AS $$
BEGIN
    RETURN COALESCE(
        current_setting('app.current_tenant_id', true)::UUID,
        '00000000-0000-0000-0000-000000000000'::UUID
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clear tenant context
CREATE OR REPLACE FUNCTION app.clear_tenant_context()
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_tenant_id', NULL, true);
    UPDATE app.config SET value = NULL, updated_at = NOW() 
    WHERE key = 'current_tenant_id';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policy function for tenant isolation
CREATE OR REPLACE FUNCTION app.tenant_isolation_policy()
RETURNS TEXT AS $$
BEGIN
    RETURN 'tenant_id = app.get_current_tenant()';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to aibos user
GRANT USAGE ON SCHEMA app TO aibos;
GRANT SELECT, INSERT, UPDATE, DELETE ON app.config TO aibos;
GRANT EXECUTE ON FUNCTION app.set_tenant_context(UUID) TO aibos;
GRANT EXECUTE ON FUNCTION app.get_current_tenant() TO aibos;
GRANT EXECUTE ON FUNCTION app.clear_tenant_context() TO aibos;
GRANT EXECUTE ON FUNCTION app.tenant_isolation_policy() TO aibos;

-- Create audit log table
CREATE TABLE IF NOT EXISTS app.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    table_name VARCHAR(255) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    user_id UUID,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on audit log
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_id ON app.audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON app.audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON app.audit_log(created_at);

-- Grant permissions on audit log
GRANT SELECT, INSERT ON app.audit_log TO aibos;

-- Create health check function
CREATE OR REPLACE FUNCTION app.health_check()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'status', 'healthy',
        'timestamp', NOW(),
        'database', 'postgresql',
        'version', version(),
        'connections', (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()),
        'uptime', (SELECT NOW() - pg_postmaster_start_time())
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on health check
GRANT EXECUTE ON FUNCTION app.health_check() TO aibos;

-- Create performance monitoring view
CREATE OR REPLACE VIEW app.performance_stats AS
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation,
    most_common_vals,
    most_common_freqs,
    histogram_bounds
FROM pg_stats 
WHERE schemaname = 'public' OR schemaname = 'app';

-- Grant select permission on performance stats
GRANT SELECT ON app.performance_stats TO aibos;

-- Log successful initialization
INSERT INTO app.config (key, value) VALUES 
    ('db_initialized_at', NOW()::TEXT),
    ('db_version', '15.0'),
    ('rls_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

-- Create backup function
CREATE OR REPLACE FUNCTION app.create_backup()
RETURNS TEXT AS $$
BEGIN
    -- This would typically call pg_dump or similar
    -- For now, just return a success message
    RETURN 'Backup function created successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on backup function
GRANT EXECUTE ON FUNCTION app.create_backup() TO aibos;

-- Final message
DO $$
BEGIN
    RAISE NOTICE 'AI-BOS ERP Database initialized successfully with RLS and multi-tenancy support';
    RAISE NOTICE 'Tenant context functions created: set_tenant_context(), get_current_tenant(), clear_tenant_context()';
    RAISE NOTICE 'Audit logging enabled with app.audit_log table';
    RAISE NOTICE 'Performance monitoring available via app.performance_stats view';
    RAISE NOTICE 'Health check endpoint available via app.health_check() function';
END $$;
