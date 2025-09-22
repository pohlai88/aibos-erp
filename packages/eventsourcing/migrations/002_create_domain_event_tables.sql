-- Domain-specific Event Tables with Partitioning
-- Phase 2 Week 7-8: Domain-specific event storage with performance optimization

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create domain-specific event tables with partitioning
-- Accounting Events
CREATE TABLE acc_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id TEXT NOT NULL,                -- e.g., "journal-entry:<id>"
  version INT NOT NULL,                   -- optimistic concurrency
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  metadata JSONB,                         -- {tenantId, userId, schemaVersion, ...}
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  correlation_id UUID,
  causation_id UUID,
  UNIQUE (stream_id, version)
) PARTITION BY RANGE (created_at);

-- Inventory Events
CREATE TABLE inv_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id TEXT NOT NULL,
  version INT NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  metadata JSONB,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  correlation_id UUID,
  causation_id UUID,
  UNIQUE (stream_id, version)
) PARTITION BY RANGE (created_at);

-- Audit Events
CREATE TABLE audit_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id TEXT NOT NULL,
  version INT NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  metadata JSONB,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  correlation_id UUID,
  causation_id UUID,
  UNIQUE (stream_id, version)
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for current and next month
-- Accounting partitions
CREATE TABLE acc_event_2025_01 PARTITION OF acc_event
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01')
  PARTITION BY HASH (tenant_id);

CREATE TABLE acc_event_2025_02 PARTITION OF acc_event
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01')
  PARTITION BY HASH (tenant_id);

-- Tenant hash shards (4-way for performance)
CREATE TABLE acc_event_2025_01_t0 PARTITION OF acc_event_2025_01 
  FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE acc_event_2025_01_t1 PARTITION OF acc_event_2025_01 
  FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE acc_event_2025_01_t2 PARTITION OF acc_event_2025_01 
  FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE acc_event_2025_01_t3 PARTITION OF acc_event_2025_01 
  FOR VALUES WITH (MODULUS 4, REMAINDER 3);

CREATE TABLE acc_event_2025_02_t0 PARTITION OF acc_event_2025_02 
  FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE acc_event_2025_02_t1 PARTITION OF acc_event_2025_02 
  FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE acc_event_2025_02_t2 PARTITION OF acc_event_2025_02 
  FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE acc_event_2025_02_t3 PARTITION OF acc_event_2025_02 
  FOR VALUES WITH (MODULUS 4, REMAINDER 3);

-- Inventory partitions
CREATE TABLE inv_event_2025_01 PARTITION OF inv_event
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01')
  PARTITION BY HASH (tenant_id);

CREATE TABLE inv_event_2025_02 PARTITION OF inv_event
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01')
  PARTITION BY HASH (tenant_id);

CREATE TABLE inv_event_2025_01_t0 PARTITION OF inv_event_2025_01 
  FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE inv_event_2025_01_t1 PARTITION OF inv_event_2025_01 
  FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE inv_event_2025_01_t2 PARTITION OF inv_event_2025_01 
  FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE inv_event_2025_01_t3 PARTITION OF inv_event_2025_01 
  FOR VALUES WITH (MODULUS 4, REMAINDER 3);

CREATE TABLE inv_event_2025_02_t0 PARTITION OF inv_event_2025_02 
  FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE inv_event_2025_02_t1 PARTITION OF inv_event_2025_02 
  FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE inv_event_2025_02_t2 PARTITION OF inv_event_2025_02 
  FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE inv_event_2025_02_t3 PARTITION OF inv_event_2025_02 
  FOR VALUES WITH (MODULUS 4, REMAINDER 3);

-- Audit partitions
CREATE TABLE audit_event_2025_01 PARTITION OF audit_event
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01')
  PARTITION BY HASH (tenant_id);

CREATE TABLE audit_event_2025_02 PARTITION OF audit_event
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01')
  PARTITION BY HASH (tenant_id);

CREATE TABLE audit_event_2025_01_t0 PARTITION OF audit_event_2025_01 
  FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE audit_event_2025_01_t1 PARTITION OF audit_event_2025_01 
  FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE audit_event_2025_01_t2 PARTITION OF audit_event_2025_01 
  FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE audit_event_2025_01_t3 PARTITION OF audit_event_2025_01 
  FOR VALUES WITH (MODULUS 4, REMAINDER 3);

CREATE TABLE audit_event_2025_02_t0 PARTITION OF audit_event_2025_02 
  FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE audit_event_2025_02_t1 PARTITION OF audit_event_2025_02 
  FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE audit_event_2025_02_t2 PARTITION OF audit_event_2025_02 
  FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE audit_event_2025_02_t3 PARTITION OF audit_event_2025_02 
  FOR VALUES WITH (MODULUS 4, REMAINDER 3);

-- Performance indexes
-- Stream and version indexes (for optimistic concurrency)
CREATE INDEX idx_acc_event_stream_version ON acc_event (stream_id, version);
CREATE INDEX idx_inv_event_stream_version ON inv_event (stream_id, version);
CREATE INDEX idx_audit_event_stream_version ON audit_event (stream_id, version);

-- Tenant and time indexes (for projections/replay)
CREATE INDEX idx_acc_event_tenant_time ON acc_event (tenant_id, created_at);
CREATE INDEX idx_inv_event_tenant_time ON inv_event (tenant_id, created_at);
CREATE INDEX idx_audit_event_tenant_time ON audit_event (tenant_id, created_at);

-- Event type indexes (partial indexes for frequent filters)
CREATE INDEX idx_acc_event_type ON acc_event (event_type) WHERE event_type IN ('JournalEntryPosted', 'AccountCreated', 'TrialBalanceGenerated');
CREATE INDEX idx_inv_event_type ON inv_event (event_type) WHERE event_type IN ('StockReceived', 'StockIssued', 'StockAdjusted', 'InventoryReconciled');
CREATE INDEX idx_audit_event_type ON audit_event (event_type) WHERE event_type IN ('UserLogin', 'DataAccess', 'ConfigurationChange');

-- Correlation ID indexes (for tracing)
CREATE INDEX idx_acc_event_correlation ON acc_event (correlation_id) WHERE correlation_id IS NOT NULL;
CREATE INDEX idx_inv_event_correlation ON inv_event (correlation_id) WHERE correlation_id IS NOT NULL;
CREATE INDEX idx_audit_event_correlation ON audit_event (correlation_id) WHERE correlation_id IS NOT NULL;

-- Row Level Security (RLS) for multi-tenancy
ALTER TABLE acc_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE inv_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_event ENABLE ROW LEVEL SECURITY;

-- RLS Policies (tenant isolation)
CREATE POLICY acc_event_tenant_isolation ON acc_event
  FOR ALL TO PUBLIC
  USING (tenant_id = current_setting('app.tenant')::uuid);

CREATE POLICY inv_event_tenant_isolation ON inv_event
  FOR ALL TO PUBLIC
  USING (tenant_id = current_setting('app.tenant')::uuid);

CREATE POLICY audit_event_tenant_isolation ON audit_event
  FOR ALL TO PUBLIC
  USING (tenant_id = current_setting('app.tenant')::uuid);

-- Partition maintenance function
CREATE OR REPLACE FUNCTION create_monthly_partitions(target_date DATE)
RETURNS void AS $$
DECLARE
  start_date DATE;
  end_date DATE;
  partition_name TEXT;
  tenant_shard INT;
BEGIN
  start_date := date_trunc('month', target_date);
  end_date := start_date + INTERVAL '1 month';
  
  -- Create accounting partitions
  partition_name := 'acc_event_' || to_char(start_date, 'YYYY_MM');
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF acc_event FOR VALUES FROM (%L) TO (%L) PARTITION BY HASH (tenant_id)', 
    partition_name, start_date, end_date);
  
  -- Create tenant shards
  FOR tenant_shard IN 0..3 LOOP
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES WITH (MODULUS 4, REMAINDER %s)', 
      partition_name || '_t' || tenant_shard, partition_name, tenant_shard);
  END LOOP;
  
  -- Repeat for inventory and audit tables
  partition_name := 'inv_event_' || to_char(start_date, 'YYYY_MM');
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF inv_event FOR VALUES FROM (%L) TO (%L) PARTITION BY HASH (tenant_id)', 
    partition_name, start_date, end_date);
  
  FOR tenant_shard IN 0..3 LOOP
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES WITH (MODULUS 4, REMAINDER %s)', 
      partition_name || '_t' || tenant_shard, partition_name, tenant_shard);
  END LOOP;
  
  partition_name := 'audit_event_' || to_char(start_date, 'YYYY_MM');
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_event FOR VALUES FROM (%L) TO (%L) PARTITION BY HASH (tenant_id)', 
    partition_name, start_date, end_date);
  
  FOR tenant_shard IN 0..3 LOOP
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES WITH (MODULUS 4, REMAINDER %s)', 
      partition_name || '_t' || tenant_shard, partition_name, tenant_shard);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create partitions for next 3 months
SELECT create_monthly_partitions('2025-03-01'::DATE);
SELECT create_monthly_partitions('2025-04-01'::DATE);
SELECT create_monthly_partitions('2025-05-01'::DATE);
