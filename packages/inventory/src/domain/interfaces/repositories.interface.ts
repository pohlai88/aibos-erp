/* eslint-disable no-unused-vars */
import type { InventoryItem } from '../inventory-item';

export interface InventoryRepository {
  save(inventoryItem: InventoryItem): Promise<void>;
  findById(id: string, tenantId: string): Promise<InventoryItem | null>;
  findBySku(sku: string, tenantId: string): Promise<InventoryItem | null>;
  findAll(tenantId: string): Promise<InventoryItem[]>;
  delete(id: string, tenantId: string): Promise<void>;
}

export interface StockLevelRepository {
  updateStockLevel(
    sku: string,
    location: string,
    quantityChange: number,
    movementType: string,
    tenantId: string,
  ): Promise<void>;

  getStockLevel(sku: string, location: string, tenantId: string): Promise<number>;
  getAllStockLevels(sku: string, tenantId: string): Promise<Map<string, number>>;
}

export interface EventStore {
  append(streamId: string, events: unknown[], expectedVersion: number): Promise<void>;
  appendWithTransaction(
    streamId: string,
    events: unknown[],
    expectedVersion: number,
  ): Promise<void>;
  getEvents(streamId: string, fromVersion?: number): Promise<unknown[]>;
}
