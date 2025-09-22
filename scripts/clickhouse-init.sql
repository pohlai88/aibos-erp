-- AI-BOS ERP ClickHouse Analytics Database Initialization
-- This script sets up ClickHouse for analytics and reporting

-- Create analytics database
CREATE DATABASE IF NOT EXISTS aibos_analytics;

-- Use the analytics database
USE aibos_analytics;

-- Create tenant dimension table
CREATE TABLE IF NOT EXISTS tenants (
    tenant_id UUID,
    tenant_name String,
    subdomain String,
    domain String,
    company_name String,
    created_at DateTime64(3),
    updated_at DateTime64(3)
) ENGINE = MergeTree()
ORDER BY tenant_id
SETTINGS index_granularity = 8192;

-- Create user activity events table
CREATE TABLE IF NOT EXISTS user_activity_events (
    event_id UUID,
    tenant_id UUID,
    user_id UUID,
    event_type String,
    event_data String,
    ip_address String,
    user_agent String,
    session_id String,
    created_at DateTime64(3)
) ENGINE = MergeTree()
ORDER BY (tenant_id, created_at, event_type)
SETTINGS index_granularity = 8192;

-- Create API performance metrics table
CREATE TABLE IF NOT EXISTS api_performance_metrics (
    metric_id UUID,
    tenant_id UUID,
    endpoint String,
    method String,
    status_code UInt16,
    response_time_ms UInt32,
    request_size_bytes UInt32,
    response_size_bytes UInt32,
    user_id UUID,
    ip_address String,
    created_at DateTime64(3)
) ENGINE = MergeTree()
ORDER BY (tenant_id, created_at, endpoint)
SETTINGS index_granularity = 8192;

-- Create business metrics table
CREATE TABLE IF NOT EXISTS business_metrics (
    metric_id UUID,
    tenant_id UUID,
    metric_name String,
    metric_value Float64,
    metric_unit String,
    dimensions Map(String, String),
    created_at DateTime64(3)
) ENGINE = MergeTree()
ORDER BY (tenant_id, created_at, metric_name)
SETTINGS index_granularity = 8192;

-- Create financial transactions table
CREATE TABLE IF NOT EXISTS financial_transactions (
    transaction_id UUID,
    tenant_id UUID,
    account_id UUID,
    transaction_type String,
    amount Decimal(15,2),
    currency String,
    description String,
    reference String,
    created_at DateTime64(3),
    posted_at DateTime64(3)
) ENGINE = MergeTree()
ORDER BY (tenant_id, created_at, transaction_type)
SETTINGS index_granularity = 8192;

-- Create inventory movements table
CREATE TABLE IF NOT EXISTS inventory_movements (
    movement_id UUID,
    tenant_id UUID,
    item_id UUID,
    warehouse_id UUID,
    movement_type String,
    quantity Decimal(15,3),
    unit_cost Decimal(15,2),
    total_cost Decimal(15,2),
    reference String,
    created_at DateTime64(3)
) ENGINE = MergeTree()
ORDER BY (tenant_id, created_at, movement_type)
SETTINGS index_granularity = 8192;

-- Create materialized view for daily user activity summary
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_user_activity_summary
ENGINE = SummingMergeTree()
ORDER BY (tenant_id, date, event_type)
AS SELECT
    tenant_id,
    toDate(created_at) as date,
    event_type,
    count() as event_count,
    uniqExact(user_id) as unique_users,
    uniqExact(session_id) as unique_sessions
FROM user_activity_events
GROUP BY tenant_id, date, event_type;

-- Create materialized view for API performance summary
CREATE MATERIALIZED VIEW IF NOT EXISTS api_performance_summary
ENGINE = SummingMergeTree()
ORDER BY (tenant_id, date, endpoint, method)
AS SELECT
    tenant_id,
    toDate(created_at) as date,
    endpoint,
    method,
    count() as request_count,
    avg(response_time_ms) as avg_response_time_ms,
    max(response_time_ms) as max_response_time_ms,
    countIf(status_code >= 400) as error_count
FROM api_performance_metrics
GROUP BY tenant_id, date, endpoint, method;

-- Create materialized view for financial summary
CREATE MATERIALIZED VIEW IF NOT EXISTS financial_summary
ENGINE = SummingMergeTree()
ORDER BY (tenant_id, date, transaction_type, currency)
AS SELECT
    tenant_id,
    toDate(created_at) as date,
    transaction_type,
    currency,
    count() as transaction_count,
    sum(amount) as total_amount,
    avg(amount) as avg_amount
FROM financial_transactions
GROUP BY tenant_id, date, transaction_type, currency;

-- Create materialized view for inventory summary
CREATE MATERIALIZED VIEW IF NOT EXISTS inventory_summary
ENGINE = SummingMergeTree()
ORDER BY (tenant_id, date, movement_type)
AS SELECT
    tenant_id,
    toDate(created_at) as date,
    movement_type,
    count() as movement_count,
    sum(quantity) as total_quantity,
    sum(total_cost) as total_cost,
    avg(unit_cost) as avg_unit_cost
FROM inventory_movements
GROUP BY tenant_id, date, movement_type;

-- Create function for tenant data isolation
CREATE OR REPLACE FUNCTION tenant_data_filter(tenant_id UUID)
RETURNS String
AS 'tenant_id = ' || tenant_id::String;

-- Create sample data for testing
INSERT INTO tenants VALUES
    ('00000000-0000-0000-0000-000000000000', 'AI-BOS ERP Demo', 'demo', 'demo.aibos-erp.com', 'AI-BOS ERP Demo Company', now(), now());

-- Create sample user activity events
INSERT INTO user_activity_events VALUES
    (generateUUIDv4(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'login', '{"success": true}', '127.0.0.1', 'Mozilla/5.0', 'session-123', now()),
    (generateUUIDv4(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'page_view', '{"page": "/dashboard"}', '127.0.0.1', 'Mozilla/5.0', 'session-123', now());

-- Create sample API performance metrics
INSERT INTO api_performance_metrics VALUES
    (generateUUIDv4(), '00000000-0000-0000-0000-000000000000', '/api/auth/login', 'POST', 200, 150, 1024, 2048, '00000000-0000-0000-0000-000000000001', '127.0.0.1', now()),
    (generateUUIDv4(), '00000000-0000-0000-0000-000000000000', '/api/dashboard', 'GET', 200, 75, 512, 4096, '00000000-0000-0000-0000-000000000001', '127.0.0.1', now());

-- Create sample business metrics
INSERT INTO business_metrics VALUES
    (generateUUIDv4(), '00000000-0000-0000-0000-000000000000', 'active_users', 150.0, 'count', {'source': 'web'}, now()),
    (generateUUIDv4(), '00000000-0000-0000-0000-000000000000', 'revenue', 50000.0, 'USD', {'period': 'monthly'}, now());

-- Grant permissions to aibos user
GRANT ALL ON aibos_analytics.* TO 'aibos'@'%';

-- Log successful initialization
SELECT 'AI-BOS ERP ClickHouse Analytics Database initialized successfully' as message;
