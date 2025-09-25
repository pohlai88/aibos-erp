/* eslint-disable no-unused-vars */
import type { InventoryProjectionRepository } from '../projections/projection-repositories.interface';
import type { StockLevelProjectionRepository } from '../projections/projection-repositories.interface';
import type { StockMovementProjectionRepository } from '../projections/projection-repositories.interface';
import type { InventorySummaryProjectionRepository } from '../projections/projection-repositories.interface';

import { Injectable, Logger } from '@nestjs/common';

export interface InventoryQueryResult {
  readonly sku: string;
  readonly description: string;
  readonly unitOfMeasure: string;
  readonly valuationMethod: string;
  readonly totalStock: number;
  readonly totalValue: number;
  readonly averageCost: number;
  readonly locations: Array<{
    readonly location: string;
    readonly quantity: number;
    readonly unitCost: number;
    readonly totalValue: number;
  }>;
}

export interface StockMovementQueryResult {
  readonly movementId: string;
  readonly sku: string;
  readonly quantity: number;
  readonly unitCost: number;
  readonly location: string;
  readonly movementType: string;
  readonly reference: string;
  readonly timestamp: Date;
}

export interface InventorySummaryQueryResult {
  readonly totalItems: number;
  readonly totalStock: number;
  readonly totalValue: number;
  readonly lowStockItems: number;
  readonly outOfStockItems: number;
  readonly lastUpdated: Date;
}

@Injectable()
export class InventoryQueryService {
  private readonly logger = new Logger(InventoryQueryService.name);

  constructor(
    private readonly inventoryProjectionRepository: InventoryProjectionRepository,
    private readonly stockLevelProjectionRepository: StockLevelProjectionRepository,
    private readonly stockMovementProjectionRepository: StockMovementProjectionRepository,
    private readonly inventorySummaryProjectionRepository: InventorySummaryProjectionRepository,
  ) {}

  async getInventoryBySku(sku: string, tenantId: string): Promise<InventoryQueryResult | null> {
    this.logger.log(`Querying inventory for SKU: ${sku}`);

    const inventoryProjection = await this.inventoryProjectionRepository.findBySku(sku, tenantId);
    if (!inventoryProjection) {
      return null;
    }

    const stockLevels = await this.stockLevelProjectionRepository.findBySku(sku, tenantId);

    return {
      sku: inventoryProjection.sku,
      description: inventoryProjection.description,
      unitOfMeasure: inventoryProjection.unitOfMeasure,
      valuationMethod: inventoryProjection.valuationMethod,
      totalStock: inventoryProjection.totalStock,
      totalValue: inventoryProjection.totalValue,
      averageCost: inventoryProjection.averageCost,
      locations: stockLevels.map((level) => ({
        location: level.location,
        quantity: level.quantity,
        unitCost: level.unitCost,
        totalValue: level.totalValue,
      })),
    };
  }

  async getAllInventory(tenantId: string): Promise<InventoryQueryResult[]> {
    this.logger.log(`Querying all inventory for tenant: ${tenantId}`);

    const inventoryProjections = await this.inventoryProjectionRepository.findAll(tenantId);
    const results: InventoryQueryResult[] = [];

    for (const projection of inventoryProjections) {
      const stockLevels = await this.stockLevelProjectionRepository.findBySku(
        projection.sku,
        tenantId,
      );

      results.push({
        sku: projection.sku,
        description: projection.description,
        unitOfMeasure: projection.unitOfMeasure,
        valuationMethod: projection.valuationMethod,
        totalStock: projection.totalStock,
        totalValue: projection.totalValue,
        averageCost: projection.averageCost,
        locations: stockLevels.map((level) => ({
          location: level.location,
          quantity: level.quantity,
          unitCost: level.unitCost,
          totalValue: level.totalValue,
        })),
      });
    }

    return results;
  }

  async getLowStockItems(threshold: number, tenantId: string): Promise<InventoryQueryResult[]> {
    this.logger.log(`Querying low stock items with threshold: ${threshold}`);

    const lowStockProjections = await this.inventoryProjectionRepository.findByLowStock(
      threshold,
      tenantId,
    );
    const results: InventoryQueryResult[] = [];

    for (const projection of lowStockProjections) {
      const stockLevels = await this.stockLevelProjectionRepository.findBySku(
        projection.sku,
        tenantId,
      );

      results.push({
        sku: projection.sku,
        description: projection.description,
        unitOfMeasure: projection.unitOfMeasure,
        valuationMethod: projection.valuationMethod,
        totalStock: projection.totalStock,
        totalValue: projection.totalValue,
        averageCost: projection.averageCost,
        locations: stockLevels.map((level) => ({
          location: level.location,
          quantity: level.quantity,
          unitCost: level.unitCost,
          totalValue: level.totalValue,
        })),
      });
    }

    return results;
  }

  async getOutOfStockItems(tenantId: string): Promise<InventoryQueryResult[]> {
    this.logger.log(`Querying out of stock items`);

    const outOfStockProjections =
      await this.inventoryProjectionRepository.findByOutOfStock(tenantId);
    const results: InventoryQueryResult[] = [];

    for (const projection of outOfStockProjections) {
      const stockLevels = await this.stockLevelProjectionRepository.findBySku(
        projection.sku,
        tenantId,
      );

      results.push({
        sku: projection.sku,
        description: projection.description,
        unitOfMeasure: projection.unitOfMeasure,
        valuationMethod: projection.valuationMethod,
        totalStock: projection.totalStock,
        totalValue: projection.totalValue,
        averageCost: projection.averageCost,
        locations: stockLevels.map((level) => ({
          location: level.location,
          quantity: level.quantity,
          unitCost: level.unitCost,
          totalValue: level.totalValue,
        })),
      });
    }

    return results;
  }

  async getStockMovementsBySku(sku: string, tenantId: string): Promise<StockMovementQueryResult[]> {
    this.logger.log(`Querying stock movements for SKU: ${sku}`);

    const movements = await this.stockMovementProjectionRepository.findBySku(sku, tenantId);

    return movements.map((movement) => ({
      movementId: movement.movementId,
      sku: movement.sku,
      quantity: movement.quantity,
      unitCost: movement.unitCost,
      location: movement.location,
      movementType: movement.movementType,
      reference: movement.reference,
      timestamp: movement.timestamp,
    }));
  }

  async getStockMovementsByLocation(
    location: string,
    tenantId: string,
  ): Promise<StockMovementQueryResult[]> {
    this.logger.log(`Querying stock movements for location: ${location}`);

    const movements = await this.stockMovementProjectionRepository.findByLocation(
      location,
      tenantId,
    );

    return movements.map((movement) => ({
      movementId: movement.movementId,
      sku: movement.sku,
      quantity: movement.quantity,
      unitCost: movement.unitCost,
      location: movement.location,
      movementType: movement.movementType,
      reference: movement.reference,
      timestamp: movement.timestamp,
    }));
  }

  async getStockMovementsByDateRange(
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<StockMovementQueryResult[]> {
    this.logger.log(`Querying stock movements from ${startDate} to ${endDate}`);

    const movements = await this.stockMovementProjectionRepository.findByDateRange(
      startDate,
      endDate,
      tenantId,
    );

    return movements.map((movement) => ({
      movementId: movement.movementId,
      sku: movement.sku,
      quantity: movement.quantity,
      unitCost: movement.unitCost,
      location: movement.location,
      movementType: movement.movementType,
      reference: movement.reference,
      timestamp: movement.timestamp,
    }));
  }

  async getInventorySummary(tenantId: string): Promise<InventorySummaryQueryResult | null> {
    this.logger.log(`Querying inventory summary for tenant: ${tenantId}`);

    const summary = await this.inventorySummaryProjectionRepository.findByTenant(tenantId);

    if (!summary) {
      return null;
    }

    return {
      totalItems: summary.totalItems,
      totalStock: summary.totalStock,
      totalValue: summary.totalValue,
      lowStockItems: summary.lowStockItems,
      outOfStockItems: summary.outOfStockItems,
      lastUpdated: summary.lastUpdated,
    };
  }
}
