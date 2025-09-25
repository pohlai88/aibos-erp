import { type StockAdjustmentEvent } from '../events/stock-adjustment-event';
import { type StockIssuedEvent } from '../events/stock-issued-event';
import { type StockReceivedEvent } from '../events/stock-received-event';
import { type StockTransferEvent } from '../events/stock-transfer-event';
import { Injectable, Logger } from '@nestjs/common';

export interface StockLevel {
  sku: string;
  location: string;
  quantity: number;
  unitCost: number;
  lastUpdated: Date;
  tenantId: string;
}

@Injectable()
export class StockLevelProjection {
  private readonly logger = new Logger(StockLevelProjection.name);
  private stockLevels: Map<string, StockLevel> = new Map();

  async handleStockReceived(event: StockReceivedEvent): Promise<void> {
    const key = this.getKey(event.sku, event.location, event.tenantId);
    const existing = this.stockLevels.get(key);

    if (existing) {
      existing.quantity += event.quantity;
      existing.unitCost = this.calculateWeightedAverage(
        existing.quantity - event.quantity,
        existing.unitCost,
        event.quantity,
        event.unitCost,
      );
      existing.lastUpdated = event.occurredAt;
    } else {
      this.stockLevels.set(key, {
        sku: event.sku,
        location: event.location,
        quantity: event.quantity,
        unitCost: event.unitCost,
        lastUpdated: event.occurredAt,
        tenantId: event.tenantId,
      });
    }

    this.logger.log(
      `Updated stock level for ${event.sku} at ${event.location}: ${this.stockLevels.get(key)?.quantity}`,
    );
  }

  async handleStockIssued(event: StockIssuedEvent): Promise<void> {
    const key = this.getKey(event.sku, event.location, event.tenantId);
    const existing = this.stockLevels.get(key);

    if (existing) {
      existing.quantity -= event.quantity;
      existing.lastUpdated = event.occurredAt;

      if (existing.quantity < 0) {
        this.logger.warn(
          `Negative stock detected for ${event.sku} at ${event.location}: ${existing.quantity}`,
        );
      }
    } else {
      this.logger.error(
        `Stock issue event received for non-existent stock level: ${event.sku} at ${event.location}`,
      );
    }

    this.logger.log(
      `Updated stock level for ${event.sku} at ${event.location}: ${existing?.quantity}`,
    );
  }

  async handleStockTransfer(event: StockTransferEvent): Promise<void> {
    // Handle the issue from source location
    await this.handleStockIssued({
      sku: event.sku,
      quantity: event.quantity,
      unitCost: event.unitCost,
      location: event.fromLocation,
      reference: event.reference,
      tenantId: event.tenantId,
      version: event.version,
      occurredAt: event.occurredAt,
    } as StockIssuedEvent);

    // Handle the receipt at destination location
    await this.handleStockReceived({
      sku: event.sku,
      quantity: event.quantity,
      unitCost: event.unitCost,
      location: event.toLocation,
      reference: event.reference,
      tenantId: event.tenantId,
      version: event.version,
      occurredAt: event.occurredAt,
    } as StockReceivedEvent);
  }

  async handleStockAdjustment(event: StockAdjustmentEvent): Promise<void> {
    const key = this.getKey(event.sku, event.location, event.tenantId);
    const existing = this.stockLevels.get(key);

    const quantityChange = event.adjustmentType === 'INCREASE' ? event.quantity : -event.quantity;

    if (existing) {
      existing.quantity += quantityChange;
      existing.lastUpdated = event.occurredAt;

      if (event.unitCost !== undefined) {
        existing.unitCost = event.unitCost;
      }
    } else {
      this.stockLevels.set(key, {
        sku: event.sku,
        location: event.location,
        quantity: quantityChange,
        unitCost: event.unitCost || 0,
        lastUpdated: event.occurredAt,
        tenantId: event.tenantId,
      });
    }

    this.logger.log(
      `Adjusted stock level for ${event.sku} at ${event.location}: ${this.stockLevels.get(key)?.quantity}`,
    );
  }

  getStockLevel(sku: string, location: string, tenantId: string): StockLevel | null {
    const key = this.getKey(sku, location, tenantId);
    return this.stockLevels.get(key) || null;
  }

  getAllStockLevels(sku: string, tenantId: string): StockLevel[] {
    return Array.from(this.stockLevels.values()).filter(
      (level) => level.sku === sku && level.tenantId === tenantId,
    );
  }

  getAllStockLevelsForTenant(tenantId: string): StockLevel[] {
    return Array.from(this.stockLevels.values()).filter((level) => level.tenantId === tenantId);
  }

  private getKey(sku: string, location: string, tenantId: string): string {
    return `${tenantId}:${sku}:${location}`;
  }

  private calculateWeightedAverage(
    existingQuantity: number,
    existingCost: number,
    newQuantity: number,
    newCost: number,
  ): number {
    const totalQuantity = existingQuantity + newQuantity;
    if (totalQuantity === 0) return 0;

    const totalCost = existingQuantity * existingCost + newQuantity * newCost;
    return totalCost / totalQuantity;
  }
}
