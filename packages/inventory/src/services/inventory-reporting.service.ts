/* eslint-disable no-unused-vars */
import { StockMovement, StockMovementType } from '../domain/stock-movement';
import { ValuationMethod } from '../domain/value-objects/valuation-method';
import { type ValuationService } from './valuation.service';
import { Injectable, Logger } from '@nestjs/common';

export interface StockLevelReport {
  sku: string;
  description: string;
  location: string;
  quantity: number;
  unitCost: number;
  totalValue: number;
  lastMovement: Date;
  tenantId: string;
}

export interface MovementHistoryReport {
  sku: string;
  movementType: string;
  quantity: number;
  unitCost: number;
  location: string;
  reference: string;
  timestamp: Date;
  tenantId: string;
}

export interface ValuationReport {
  sku: string;
  description: string;
  valuationMethod: string;
  totalQuantity: number;
  averageCost: number;
  totalValue: number;
  locations: Array<{
    location: string;
    quantity: number;
    value: number;
  }>;
  tenantId: string;
}

export interface ABCReportItem {
  sku: string;
  description: string;
  totalValue: number;
  percentage: number;
  category: 'A' | 'B' | 'C';
}

@Injectable()
export class InventoryReportingService {
  private readonly logger = new Logger(InventoryReportingService.name);

  constructor(private readonly valuationService: ValuationService) {}

  async generateStockLevelReport(
    inventoryItems: Array<{
      sku: string;
      description: string;
      currentStock: Map<string, number>;
      stockMovements: Array<{
        location: string;
        timestamp: Date;
        unitCost: number;
      }>;
    }>,
    tenantId: string,
    location?: string,
  ): Promise<StockLevelReport[]> {
    this.logger.log(
      `Generating stock level report for tenant: ${tenantId}, location: ${location || 'all'}`,
    );

    const reports: StockLevelReport[] = [];

    for (const item of inventoryItems) {
      const stockLevels = Array.from(item.currentStock.entries());

      for (const [itemLocation, quantity] of stockLevels) {
        if (location && itemLocation !== location) continue;

        // Find the latest movement for this location
        const latestMovement = item.stockMovements
          .filter((movement) => movement.location === itemLocation)
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

        reports.push({
          sku: item.sku,
          description: item.description,
          location: itemLocation,
          quantity,
          unitCost: latestMovement?.unitCost || 0,
          totalValue: quantity * (latestMovement?.unitCost || 0),
          lastMovement: latestMovement?.timestamp || new Date(),
          tenantId,
        });
      }
    }

    return reports.sort((a, b) => a.sku.localeCompare(b.sku));
  }

  async generateMovementHistoryReport(
    sku: string,
    stockMovements: Array<{
      movementId: string;
      quantity: number;
      unitCost: number;
      location: string;
      movementType: string;
      reference: string;
      timestamp: Date;
    }>,
    tenantId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<MovementHistoryReport[]> {
    this.logger.log(`Generating movement history report for SKU: ${sku}, tenant: ${tenantId}`);

    const reports: MovementHistoryReport[] = [];

    for (const movement of stockMovements) {
      if (fromDate && movement.timestamp < fromDate) continue;
      if (toDate && movement.timestamp > toDate) continue;

      reports.push({
        sku,
        movementType: movement.movementType,
        quantity: movement.quantity,
        unitCost: movement.unitCost,
        location: movement.location,
        reference: movement.reference,
        timestamp: movement.timestamp,
        tenantId,
      });
    }

    return reports.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async generateValuationReport(
    sku: string,
    description: string,
    valuationMethod: ValuationMethod,
    stockMovements: Array<{
      quantity: number;
      unitCost: number;
      location: string;
      movementType: string;
    }>,
    currentStock: Map<string, number>,
    tenantId: string,
  ): Promise<ValuationReport> {
    this.logger.log(`Generating valuation report for SKU: ${sku}, tenant: ${tenantId}`);

    const totalQuantity = Array.from(currentStock.values()).reduce((sum, qty) => sum + qty, 0);
    const averageCost = this.valuationService.calculateAverageCost(
      stockMovements.map(
        (m) =>
          new StockMovement(
            'report-' + Date.now(),
            m.quantity,
            m.unitCost,
            m.location,
            m.movementType as StockMovementType,
            'REPORT',
          ),
      ),
      valuationMethod,
    );
    const totalValue = totalQuantity * averageCost;

    const locations = Array.from(currentStock.entries()).map(([location, quantity]) => ({
      location,
      quantity,
      value: quantity * averageCost,
    }));

    return {
      sku,
      description,
      valuationMethod,
      totalQuantity,
      averageCost,
      totalValue,
      locations,
      tenantId,
    };
  }

  async generateABCReport(
    stockLevelReports: StockLevelReport[],
    tenantId: string,
  ): Promise<ABCReportItem[]> {
    this.logger.log(`Generating ABC analysis report for tenant: ${tenantId}`);

    const skuValues = new Map<string, number>();

    // Aggregate values by SKU
    for (const report of stockLevelReports) {
      const currentValue = skuValues.get(report.sku) || 0;
      skuValues.set(report.sku, currentValue + report.totalValue);
    }

    // Sort by value descending
    const sortedSkus = Array.from(skuValues.entries()).sort((a, b) => b[1] - a[1]);

    const totalValue = sortedSkus.reduce((sum, [, value]) => sum + value, 0);
    let cumulativePercentage = 0;

    return sortedSkus.map(([sku, value], _index) => {
      const percentage = (value / totalValue) * 100;
      cumulativePercentage += percentage;

      let category: 'A' | 'B' | 'C';
      if (cumulativePercentage <= 80) {
        category = 'A';
      } else if (cumulativePercentage <= 95) {
        category = 'B';
      } else {
        category = 'C';
      }

      const report = stockLevelReports.find((r) => r.sku === sku);
      return {
        sku,
        description: report?.description || '',
        totalValue: value,
        percentage,
        category,
      };
    });
  }

  async generateInventorySummaryReport(
    inventoryItems: Array<{
      sku: string;
      currentStock: Map<string, number>;
      stockMovements: Array<{
        unitCost: number;
        quantity: number;
      }>;
    }>,
    tenantId: string,
  ): Promise<{
    totalItems: number;
    totalStock: number;
    totalValue: number;
    lowStockItems: number;
    outOfStockItems: number;
    lastUpdated: Date;
  }> {
    this.logger.log(`Generating inventory summary report for tenant: ${tenantId}`);

    let totalStock = 0;
    let totalValue = 0;
    let lowStockItems = 0;
    let outOfStockItems = 0;

    for (const item of inventoryItems) {
      const itemStock = Array.from(item.currentStock.values()).reduce((sum, qty) => sum + qty, 0);
      const averageCost = this.valuationService.calculateAverageCost(
        item.stockMovements.map(
          (m) =>
            new StockMovement(
              'report-' + Date.now(),
              m.quantity,
              m.unitCost,
              'REPORT-LOCATION',
              StockMovementType.RECEIPT,
              'REPORT',
            ),
        ),
        ValuationMethod.WEIGHTED_AVERAGE,
      );

      totalStock += itemStock;
      totalValue += itemStock * averageCost;

      if (itemStock === 0) {
        outOfStockItems++;
      } else if (itemStock < 10) {
        // Assuming low stock threshold of 10
        lowStockItems++;
      }
    }

    return {
      totalItems: inventoryItems.length,
      totalStock,
      totalValue,
      lowStockItems,
      outOfStockItems,
      lastUpdated: new Date(),
    };
  }
}
