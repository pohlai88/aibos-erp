-- Event Sourcing Database Schema
-- This migration creates the core tables for the Event Store

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS eventsourcing;

-- Event streams table
CREATE TABLE eventsourcing.streams (
  stream_id VARCHAR(255) PRIMARY KEY,
  version INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Events table
CREATE TABLE eventsourcing.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stream_id VARCHAR(255) NOT NULL,
  version INTEGER NOT NULL,
  event_type VARCHAR(255) NOT NULL,
  event_data JSONB NOT NULL,
  metadata JSONB,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL,
  correlation_id UUID,
  causation_id UUID,
  UNIQUE(stream_id, version),
  FOREIGN KEY (stream_id) REFERENCES eventsourcing.streams(stream_id) ON DELETE CASCADE
);

-- Snapshots table
CREATE TABLE eventsourcing.snapshots (
  stream_id VARCHAR(255) PRIMARY KEY,
  version INTEGER NOT NULL,
  snapshot_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (stream_id) REFERENCES eventsourcing.streams(stream_id) ON DELETE CASCADE
);

-- Outbox events table
CREATE TABLE eventsourcing.outbox_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aggregate_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(255) NOT NULL,
  event_data JSONB NOT NULL,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  retry_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  correlation_id UUID,
  causation_id UUID
);

-- Idempotency keys table
CREATE TABLE eventsourcing.idempotency_keys (
  key VARCHAR(255) PRIMARY KEY,
  request_id VARCHAR(255) NOT NULL,
  response_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_events_stream_id ON eventsourcing.events(stream_id);
CREATE INDEX idx_events_tenant_id ON eventsourcing.events(tenant_id);
CREATE INDEX idx_events_created_at ON eventsourcing.events(created_at);
CREATE INDEX idx_events_event_type ON eventsourcing.events(event_type);
CREATE INDEX idx_events_correlation_id ON eventsourcing.events(correlation_id);

CREATE INDEX idx_outbox_events_status ON eventsourcing.outbox_events(status);
CREATE INDEX idx_outbox_events_created_at ON eventsourcing.outbox_events(created_at);
CREATE INDEX idx_outbox_events_tenant_id ON eventsourcing.outbox_events(tenant_id);

CREATE INDEX idx_idempotency_keys_expires_at ON eventsourcing.idempotency_keys(expires_at);

-- Row Level Security (RLS) for multi-tenancy
ALTER TABLE eventsourcing.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventsourcing.outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventsourcing.idempotency_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies (to be configured per tenant)
-- These will be created dynamically when tenants are set up

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION eventsourcing.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_streams_updated_at 
    BEFORE UPDATE ON eventsourcing.streams 
    FOR EACH ROW EXECUTE FUNCTION eventsourcing.update_updated_at_column();

-- Partitioning for events table (for better performance with large datasets)
-- This will be implemented in a future migration based on usage patterns

COMMENT ON TABLE eventsourcing.streams IS 'Event streams for Event Sourcing';
COMMENT ON TABLE eventsourcing.events IS 'Domain events storage';
COMMENT ON TABLE eventsourcing.snapshots IS 'Aggregate snapshots for performance optimization';
COMMENT ON TABLE eventsourcing.outbox_events IS 'Outbox pattern for reliable messaging';
COMMENT ON TABLE eventsourcing.idempotency_keys IS 'Idempotency key storage';



