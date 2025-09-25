-- Migration: Create Serial Number Tables
-- Description: Creates tables for serial number management functionality
-- Version: 003
-- Date: 2025-01-25

-- Create serial_numbers table
CREATE TABLE IF NOT EXISTS serial_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number VARCHAR(255) NOT NULL UNIQUE,
    sku VARCHAR(255) NOT NULL,
    batch_id VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    tenant_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create serial_number_history table for audit trail
CREATE TABLE IF NOT EXISTS serial_number_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    performed_by VARCHAR(255) NOT NULL,
    order_id VARCHAR(255),
    reason TEXT,
    notes TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tenant_id VARCHAR(255) NOT NULL
);

-- Create serial_number_traceability table for detailed tracking
CREATE TABLE IF NOT EXISTS serial_number_traceability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number VARCHAR(255) NOT NULL,
    sku VARCHAR(255) NOT NULL,
    batch_id VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tenant_id VARCHAR(255) NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_serial_numbers_sku_tenant ON serial_numbers(sku, tenant_id);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_batch_tenant ON serial_numbers(batch_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_status_tenant ON serial_numbers(status, tenant_id);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_location_tenant ON serial_numbers(location, tenant_id);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_serial_number ON serial_numbers(serial_number);

CREATE INDEX IF NOT EXISTS idx_serial_number_history_serial_number ON serial_number_history(serial_number);
CREATE INDEX IF NOT EXISTS idx_serial_number_history_timestamp ON serial_number_history(timestamp);

CREATE INDEX IF NOT EXISTS idx_serial_number_traceability_serial_number ON serial_number_traceability(serial_number);
CREATE INDEX IF NOT EXISTS idx_serial_number_traceability_sku ON serial_number_traceability(sku);
CREATE INDEX IF NOT EXISTS idx_serial_number_traceability_batch ON serial_number_traceability(batch_id);
CREATE INDEX IF NOT EXISTS idx_serial_number_traceability_timestamp ON serial_number_traceability(timestamp);

-- Add constraints
ALTER TABLE serial_numbers ADD CONSTRAINT chk_serial_number_status
    CHECK (status IN ('AVAILABLE', 'RESERVED', 'SOLD', 'DEFECTIVE', 'QUARANTINED', 'RETURNED', 'SCRAPPED'));

ALTER TABLE serial_number_history ADD CONSTRAINT chk_serial_number_action
    CHECK (action IN ('CREATED', 'RESERVED', 'SOLD', 'QUARANTINED', 'RETURNED', 'SCRAPPED', 'RELEASED_FROM_QUARANTINE', 'STATUS_UPDATED'));

-- Add foreign key constraints (if referenced tables exist)
-- ALTER TABLE serial_numbers ADD CONSTRAINT fk_serial_numbers_batch
--     FOREIGN KEY (batch_id) REFERENCES batches(batch_id);

-- Add comments
COMMENT ON TABLE serial_numbers IS 'Serial number tracking records';
COMMENT ON TABLE serial_number_history IS 'Audit trail for serial number actions';
COMMENT ON TABLE serial_number_traceability IS 'Detailed traceability for serial numbers';

COMMENT ON COLUMN serial_numbers.serial_number IS 'Unique serial number identifier';
COMMENT ON COLUMN serial_numbers.sku IS 'Stock Keeping Unit';
COMMENT ON COLUMN serial_numbers.batch_id IS 'Batch identifier';
COMMENT ON COLUMN serial_numbers.location IS 'Current location of the serial number';
COMMENT ON COLUMN serial_numbers.status IS 'Current status of the serial number';

COMMENT ON COLUMN serial_number_history.action IS 'Action performed on the serial number';
COMMENT ON COLUMN serial_number_history.performed_by IS 'User who performed the action';
COMMENT ON COLUMN serial_number_history.order_id IS 'Order ID if action is order-related';
COMMENT ON COLUMN serial_number_history.reason IS 'Reason for the action';

COMMENT ON COLUMN serial_number_traceability.event_type IS 'Type of event that occurred';
COMMENT ON COLUMN serial_number_traceability.event_data IS 'JSON data associated with the event';
