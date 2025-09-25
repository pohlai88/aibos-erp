-- Migration: Create Reconciliation Tables
-- Description: Creates tables for stock reconciliation functionality
-- Version: 002
-- Date: 2025-01-25

-- Create reconciliations table
CREATE TABLE IF NOT EXISTS reconciliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reconciliation_id VARCHAR(255) NOT NULL UNIQUE,
    sku VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    system_quantity DECIMAL(10,2) NOT NULL,
    physical_quantity DECIMAL(10,2) NOT NULL,
    variance DECIMAL(10,2) NOT NULL,
    variance_percentage DECIMAL(5,2) NOT NULL,
    reconciliation_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    reconciled_by VARCHAR(255) NOT NULL,
    notes TEXT,
    tenant_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create reconciliation_history table for audit trail
CREATE TABLE IF NOT EXISTS reconciliation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reconciliation_id VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    performed_by VARCHAR(255) NOT NULL,
    notes TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tenant_id VARCHAR(255) NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reconciliations_sku_tenant ON reconciliations(sku, tenant_id);
CREATE INDEX IF NOT EXISTS idx_reconciliations_location_tenant ON reconciliations(location, tenant_id);
CREATE INDEX IF NOT EXISTS idx_reconciliations_status_tenant ON reconciliations(status, tenant_id);
CREATE INDEX IF NOT EXISTS idx_reconciliations_date_tenant ON reconciliations(created_at, tenant_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_history_reconciliation_id ON reconciliation_history(reconciliation_id);

-- Add constraints
ALTER TABLE reconciliations ADD CONSTRAINT chk_reconciliation_status
    CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'APPROVED', 'REJECTED'));
ALTER TABLE reconciliations ADD CONSTRAINT chk_reconciliation_type
    CHECK (reconciliation_type IN ('CYCLE_COUNT', 'FULL_INVENTORY', 'SPOT_CHECK', 'SYSTEM_RECONCILIATION'));

-- Add comments
COMMENT ON TABLE reconciliations IS 'Stock reconciliation records';
COMMENT ON TABLE reconciliation_history IS 'Audit trail for reconciliation actions';
