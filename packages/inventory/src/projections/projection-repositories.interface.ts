/* eslint-disable no-unused-vars */
import type { InventoryProjection } from './inventory-projection';
import type { InventorySummaryProjection } from './inventory-projection';
import type { StockLevelProjection } from './inventory-projection';
import type { StockMovementProjection } from './inventory-projection';

export interface InventoryProjectionRepository {
  save(projection: InventoryProjection): Promise<void>;
  findBySku(sku: string, tenantId: string): Promise<InventoryProjection | null>;
  findAll(tenantId: string): Promise<InventoryProjection[]>;
  findByLowStock(threshold: number, tenantId: string): Promise<InventoryProjection[]>;
  findByOutOfStock(tenantId: string): Promise<InventoryProjection[]>;
  delete(sku: string, tenantId: string): Promise<void>;
}

export interface StockLevelProjectionRepository {
  save(projection: StockLevelProjection): Promise<void>;
  findBySku(sku: string, tenantId: string): Promise<StockLevelProjection[]>;
  findByLocation(location: string, tenantId: string): Promise<StockLevelProjection[]>;
  findBySkuAndLocation(
    sku: string,
    location: string,
    tenantId: string,
  ): Promise<StockLevelProjection | null>;
  findAll(tenantId: string): Promise<StockLevelProjection[]>;
  delete(sku: string, location: string, tenantId: string): Promise<void>;
}

export interface StockMovementProjectionRepository {
  save(projection: StockMovementProjection): Promise<void>;
  findBySku(sku: string, tenantId: string): Promise<StockMovementProjection[]>;
  findByLocation(location: string, tenantId: string): Promise<StockMovementProjection[]>;
  findByReference(reference: string, tenantId: string): Promise<StockMovementProjection[]>;
  findByDateRange(
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<StockMovementProjection[]>;
  findAll(tenantId: string): Promise<StockMovementProjection[]>;
  delete(movementId: string, tenantId: string): Promise<void>;
}

export interface InventorySummaryProjectionRepository {
  save(projection: InventorySummaryProjection): Promise<void>;
  findByTenant(tenantId: string): Promise<InventorySummaryProjection | null>;
  delete(tenantId: string): Promise<void>;
}
