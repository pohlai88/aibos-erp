/* eslint-disable no-unused-vars */
import type { InventoryProjectionRepository } from './projection-repositories.interface';
import type { StockLevelProjectionRepository } from './projection-repositories.interface';
import type { StockMovementProjectionRepository } from './projection-repositories.interface';
import type { InventorySummaryProjectionRepository } from './projection-repositories.interface';

import { type CycleCountEvent } from '../events/cycle-count-event';
import { type StockAdjustmentEvent } from '../events/stock-adjustment-event';
import { type StockIssuedEvent } from '../events/stock-issued-event';
import { type StockReceivedEvent } from '../events/stock-received-event';
import { type StockTransferEvent } from '../events/stock-transfer-event';
import { type InventoryProjection } from './inventory-projection';
import { type StockLevelProjection } from './inventory-projection';
import { type StockMovementProjection } from './inventory-projection';
import { type InventorySummaryProjection } from './inventory-projection';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class InventoryProjectionHandler {
  private readonly logger = new Logger(InventoryProjectionHandler.name);

  constructor(
    private readonly inventoryProjectionRepository: InventoryProjectionRepository,
    private readonly stockLevelProjectionRepository: StockLevelProjectionRepository,
    private readonly stockMovementProjectionRepository: StockMovementProjectionRepository,
    private readonly inventorySummaryProjectionRepository: InventorySummaryProjectionRepository,
  ) {}

  async handleStockReceived(event: StockReceivedEvent): Promise<void> {
    this.logger.log(`Handling StockReceivedEvent for SKU: ${event.sku}`);

    // Update inventory projection
    await this.updateInventoryProjection(event.sku, event.tenantId);

    // Update stock level projection
    await this.updateStockLevelProjection(
      event.sku,
      event.location,
      event.quantity,
      event.unitCost,
      event.tenantId,
    );

    // Save stock movement projection
    await this.saveStockMovementProjection(event);

    // Update summary projection
    await this.updateInventorySummaryProjection(event.tenantId);
  }

  async handleStockIssued(event: StockIssuedEvent): Promise<void> {
    this.logger.log(`Handling StockIssuedEvent for SKU: ${event.sku}`);

    // Update inventory projection
    await this.updateInventoryProjection(event.sku, event.tenantId);

    // Update stock level projection
    await this.updateStockLevelProjection(
      event.sku,
      event.location,
      -event.quantity,
      event.unitCost,
      event.tenantId,
    );

    // Save stock movement projection
    await this.saveStockMovementProjection(event);

    // Update summary projection
    await this.updateInventorySummaryProjection(event.tenantId);
  }

  async handleStockTransfer(event: StockTransferEvent): Promise<void> {
    this.logger.log(`Handling StockTransferEvent for SKU: ${event.sku}`);

    // Update inventory projection
    await this.updateInventoryProjection(event.sku, event.tenantId);

    // Update stock level projections for both locations
    await this.updateStockLevelProjection(
      event.sku,
      event.fromLocation,
      -event.quantity,
      event.unitCost || 0,
      event.tenantId,
    );

    await this.updateStockLevelProjection(
      event.sku,
      event.toLocation,
      event.quantity,
      event.unitCost || 0,
      event.tenantId,
    );

    // Save stock movement projection
    await this.saveStockMovementProjection(event);

    // Update summary projection
    await this.updateInventorySummaryProjection(event.tenantId);
  }

  async handleStockAdjustment(event: StockAdjustmentEvent): Promise<void> {
    this.logger.log(`Handling StockAdjustmentEvent for SKU: ${event.sku}`);

    // Update inventory projection
    await this.updateInventoryProjection(event.sku, event.tenantId);

    // Update stock level projection
    const quantityChange = event.adjustmentType === 'INCREASE' ? event.quantity : -event.quantity;
    await this.updateStockLevelProjection(
      event.sku,
      event.location,
      quantityChange,
      event.unitCost || 0,
      event.tenantId,
    );

    // Save stock movement projection
    await this.saveStockMovementProjection(event);

    // Update summary projection
    await this.updateInventorySummaryProjection(event.tenantId);
  }

  async handleCycleCount(event: CycleCountEvent): Promise<void> {
    this.logger.log(`Handling CycleCountEvent for SKU: ${event.sku}`);

    // Update inventory projection
    await this.updateInventoryProjection(event.sku, event.tenantId);

    // Update stock level projection
    await this.updateStockLevelProjection(
      event.sku,
      event.location,
      0, // Cycle count doesn't change stock levels directly
      0,
      event.tenantId,
    );

    // Save stock movement projection
    await this.saveStockMovementProjection(event);

    // Update summary projection
    await this.updateInventorySummaryProjection(event.tenantId);
  }

  private async updateInventoryProjection(sku: string, tenantId: string): Promise<void> {
    // This would typically load the aggregate and calculate the projection
    // For now, we'll create a placeholder projection
    const projection: InventoryProjection = {
      sku,
      description: 'Product Description', // Would come from aggregate
      unitOfMeasure: 'EA', // Would come from aggregate
      valuationMethod: 'FIFO', // Would come from aggregate
      totalStock: 0, // Would be calculated from stock levels
      totalValue: 0, // Would be calculated from stock levels
      averageCost: 0, // Would be calculated from movements
      lastUpdated: new Date(),
      tenantId,
    };

    await this.inventoryProjectionRepository.save(projection);
  }

  private async updateStockLevelProjection(
    sku: string,
    location: string,
    quantityChange: number,
    unitCost: number,
    tenantId: string,
  ): Promise<void> {
    const existingProjection = await this.stockLevelProjectionRepository.findBySkuAndLocation(
      sku,
      location,
      tenantId,
    );

    if (existingProjection) {
      const updatedProjection: StockLevelProjection = {
        ...existingProjection,
        quantity: existingProjection.quantity + quantityChange,
        unitCost: unitCost || existingProjection.unitCost,
        totalValue:
          (existingProjection.quantity + quantityChange) *
          (unitCost || existingProjection.unitCost),
        lastMovement: new Date(),
      };

      await this.stockLevelProjectionRepository.save(updatedProjection);
    } else {
      const newProjection: StockLevelProjection = {
        sku,
        location,
        quantity: quantityChange,
        unitCost,
        totalValue: quantityChange * unitCost,
        lastMovement: new Date(),
        tenantId,
      };

      await this.stockLevelProjectionRepository.save(newProjection);
    }
  }

  private async saveStockMovementProjection(event: {
    id: string;
    sku: string;
    quantity?: number;
    countedQuantity?: number;
    unitCost?: number;
    location?: string;
    fromLocation?: string;
    eventType: string;
    reference: string;
    occurredAt: Date;
    tenantId: string;
  }): Promise<void> {
    const projection: StockMovementProjection = {
      movementId: event.id,
      sku: event.sku,
      quantity: event.quantity || event.countedQuantity || 0,
      unitCost: event.unitCost || 0,
      location: event.location || event.fromLocation || '',
      movementType: event.eventType,
      reference: event.reference,
      timestamp: event.occurredAt,
      tenantId: event.tenantId,
    };

    await this.stockMovementProjectionRepository.save(projection);
  }

  private async updateInventorySummaryProjection(tenantId: string): Promise<void> {
    // This would typically aggregate data from all projections
    const summary: InventorySummaryProjection = {
      totalItems: 0, // Would be calculated from inventory projections
      totalStock: 0, // Would be calculated from stock level projections
      totalValue: 0, // Would be calculated from stock level projections
      lowStockItems: 0, // Would be calculated from inventory projections
      outOfStockItems: 0, // Would be calculated from inventory projections
      lastUpdated: new Date(),
      tenantId,
    };

    await this.inventorySummaryProjectionRepository.save(summary);
  }
}
