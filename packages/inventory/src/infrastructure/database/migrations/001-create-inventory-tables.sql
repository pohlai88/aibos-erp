-- Migration: Create Inventory Tables
-- Description: Creates the core inventory management tables
-- Version: 001
-- Date: 2025-01-25

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    unit_of_measure VARCHAR(50) NOT NULL,
    valuation_method VARCHAR(50) NOT NULL,
    tenant_id VARCHAR(255) NOT NULL,
    version INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create stock_levels table
CREATE TABLE IF NOT EXISTS stock_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    tenant_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sku, location, tenant_id)
);

-- Create stock_movements table
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movement_id VARCHAR(255) NOT NULL,
    sku VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    location VARCHAR(255) NOT NULL,
    movement_type VARCHAR(50) NOT NULL,
    reference VARCHAR(255) NOT NULL,
    tenant_id VARCHAR(255) NOT NULL,
    batch_number VARCHAR(255),
    serial_numbers TEXT,
    reason TEXT,
    counted_by VARCHAR(255),
    notes TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_sku_tenant ON inventory_items(sku, tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_levels_sku_tenant ON stock_levels(sku, tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_levels_location_tenant ON stock_levels(location, tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_sku_tenant ON stock_movements(sku, tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_location_tenant ON stock_movements(location, tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_timestamp_tenant ON stock_movements(timestamp, tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_movement_type ON stock_movements(movement_type);

-- Add constraints
ALTER TABLE inventory_items ADD CONSTRAINT chk_quantity_positive CHECK (version >= 0);
ALTER TABLE stock_levels ADD CONSTRAINT chk_stock_quantity_non_negative CHECK (quantity >= 0);
ALTER TABLE stock_movements ADD CONSTRAINT chk_movement_quantity_positive CHECK (quantity > 0);

-- Add comments
COMMENT ON TABLE inventory_items IS 'Core inventory item definitions';
COMMENT ON TABLE stock_levels IS 'Current stock levels by location';
COMMENT ON TABLE stock_movements IS 'Historical stock movement transactions';

COMMENT ON COLUMN inventory_items.valuation_method IS 'FIFO, LIFO, WEIGHTED_AVERAGE, STANDARD_COST, MOVING_AVERAGE';
COMMENT ON COLUMN stock_movements.movement_type IS 'RECEIPT, ISSUE, TRANSFER, ADJUSTMENT, CYCLE_COUNT';
