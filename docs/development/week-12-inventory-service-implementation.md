# Week 12: Inventory Service Implementation Development Plan

## Overview

This document provides a comprehensive development plan for Week 12 of the AI-BOS ERP project, focusing on implementing advanced inventory operations, valuation strategies, projections, and reporting capabilities. This builds upon the foundation established in Week 11.

## Strategic Objectives

- **Advanced Operations**: Implement stock transfers, adjustments, and cycle counting
- **Valuation Engine**: Complete valuation calculation engine with all methods
- **Projections**: Implement read model projections for real-time queries
- **Reporting APIs**: Build comprehensive inventory reporting capabilities
- **Integration**: Establish integration points with accounting and other services
- **Performance**: Optimize for production-scale operations

## Week 12 Deliverables

### 1. Advanced Stock Operations

#### **Stock Transfer Operations**

**TransferStockCommand**

```typescript
// packages/inventory/src/commands/transfer-stock-command.ts
export interface TransferStockCommand {
  readonly transferId: string;
  readonly sku: string;
  readonly quantity: number;
  readonly fromLocation: string;
  readonly toLocation: string;
  readonly reference: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly batchNumber?: string;
  readonly serialNumbers?: string[];
  readonly reason?: string;
}
```

**StockTransferEvent**

```typescript
// packages/inventory/src/events/stock-transfer-event.ts
import { DomainEvent } from '@aibos/eventsourcing';

export class StockTransferEvent implements DomainEvent {
  constructor(
    public readonly sku: string,
    public readonly quantity: number,
    public readonly fromLocation: string,
    public readonly toLocation: string,
    public readonly reference: string,
    public readonly tenantId: string,
    public readonly version: number,
    public readonly timestamp: Date = new Date(),
    public readonly batchNumber?: string,
    public readonly serialNumbers?: string[],
    public readonly reason?: string,
  ) {}

  getEventType(): string {
    return 'StockTransferEvent';
  }

  getAggregateId(): string {
    return `inventory-item-${this.sku}-${this.tenantId}`;
  }
}
```

**Enhanced InventoryItem with Transfer Operations**

```typescript
// packages/inventory/src/domain/inventory-item.ts (enhanced)
export class InventoryItem extends AggregateRoot {
  // ... existing code ...

  public transferStock(command: TransferStockCommand): void {
    this.validateStockTransfer(command);

    // Create two movements: issue from source, receipt at destination
    const issueMovement = new StockMovement(
      `${command.transferId}-issue`,
      command.quantity,
      this.calculateTransferCost(command),
      command.fromLocation,
      StockMovementType.ISSUE,
      command.reference,
    );

    const receiptMovement = new StockMovement(
      `${command.transferId}-receipt`,
      command.quantity,
      issueMovement.unitCost,
      command.toLocation,
      StockMovementType.RECEIPT,
      command.reference,
    );

    this.stockMovements.push(issueMovement, receiptMovement);
    this.updateCurrentStock(command.fromLocation, -command.quantity);
    this.updateCurrentStock(command.toLocation, command.quantity);

    this.addEvent(
      new StockTransferEvent(
        this.sku,
        command.quantity,
        command.fromLocation,
        command.toLocation,
        command.reference,
        command.tenantId,
        this.version + 1,
        undefined,
        command.batchNumber,
        command.serialNumbers,
        command.reason,
      ),
    );
  }

  private validateStockTransfer(command: TransferStockCommand): void {
    if (command.quantity <= 0) {
      throw new Error('Transfer quantity must be positive');
    }
    if (command.fromLocation === command.toLocation) {
      throw new Error('Source and destination locations cannot be the same');
    }

    const currentStockAtSource = this.currentStock.get(command.fromLocation) || 0;
    if (currentStockAtSource < command.quantity) {
      throw new Error(
        `Insufficient stock at source location ${command.fromLocation}. Available: ${currentStockAtSource}, Required: ${command.quantity}`,
      );
    }
  }

  private calculateTransferCost(command: TransferStockCommand): number {
    // Use the same valuation method as issue operations
    return this.calculateIssueCost({
      movementId: command.transferId,
      sku: command.sku,
      quantity: command.quantity,
      location: command.fromLocation,
      reference: command.reference,
      tenantId: command.tenantId,
      userId: command.userId,
    } as IssueStockCommand);
  }
}
```

#### **Stock Adjustment Operations**

**AdjustStockCommand**

```typescript
// packages/inventory/src/commands/adjust-stock-command.ts
export interface AdjustStockCommand {
  readonly adjustmentId: string;
  readonly sku: string;
  readonly location: string;
  readonly quantityAdjustment: number; // Can be positive or negative
  readonly reason: string;
  readonly reference: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly batchNumber?: string;
  readonly serialNumbers?: string[];
  readonly unitCost?: number; // Optional for cost adjustments
}
```

**StockAdjustmentEvent**

```typescript
// packages/inventory/src/events/stock-adjustment-event.ts
import { DomainEvent } from '@aibos/eventsourcing';

export class StockAdjustmentEvent implements DomainEvent {
  constructor(
    public readonly sku: string,
    public readonly location: string,
    public readonly quantityAdjustment: number,
    public readonly reason: string,
    public readonly reference: string,
    public readonly tenantId: string,
    public readonly version: number,
    public readonly timestamp: Date = new Date(),
    public readonly batchNumber?: string,
    public readonly serialNumbers?: string[],
    public readonly unitCost?: number,
  ) {}

  getEventType(): string {
    return 'StockAdjustmentEvent';
  }

  getAggregateId(): string {
    return `inventory-item-${this.sku}-${this.tenantId}`;
  }
}
```

#### **Cycle Count Operations**

**CycleCountCommand**

```typescript
// packages/inventory/src/commands/cycle-count-command.ts
export interface CycleCountCommand {
  readonly cycleCountId: string;
  readonly sku: string;
  readonly location: string;
  readonly countedQuantity: number;
  readonly reference: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly batchNumber?: string;
  readonly serialNumbers?: string[];
  readonly notes?: string;
}
```

### 2. Advanced Valuation Engine

#### **ValuationService**

```typescript
// packages/inventory/src/services/valuation.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ValuationMethod } from '../domain/value-objects/valuation-method';
import { StockMovement, StockMovementType } from '../domain/stock-movement';

@Injectable()
export class ValuationService {
  private readonly logger = new Logger(ValuationService.name);

  calculateValuation(
    movements: StockMovement[],
    method: ValuationMethod,
    issueQuantity: number,
  ): number {
    switch (method) {
      case ValuationMethod.FIFO:
        return this.calculateFIFOValuation(movements, issueQuantity);
      case ValuationMethod.LIFO:
        return this.calculateLIFOValuation(movements, issueQuantity);
      case ValuationMethod.WEIGHTED_AVERAGE:
        return this.calculateWeightedAverageValuation(movements);
      case ValuationMethod.STANDARD_COST:
        return this.calculateStandardCostValuation(movements);
      case ValuationMethod.MOVING_AVERAGE:
        return this.calculateMovingAverageValuation(movements);
      default:
        throw new Error(`Unsupported valuation method: ${method}`);
    }
  }

  private calculateFIFOValuation(movements: StockMovement[], issueQuantity: number): number {
    const receiptMovements = movements
      .filter((m) => m.movementType === StockMovementType.RECEIPT)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    let remainingQuantity = issueQuantity;
    let totalCost = 0;

    for (const movement of receiptMovements) {
      if (remainingQuantity <= 0) break;

      const availableQuantity = movement.quantity;
      const issueQuantity = Math.min(remainingQuantity, availableQuantity);

      totalCost += issueQuantity * movement.unitCost;
      remainingQuantity -= issueQuantity;
    }

    return remainingQuantity > 0 ? 0 : totalCost / issueQuantity;
  }

  private calculateLIFOValuation(movements: StockMovement[], issueQuantity: number): number {
    const receiptMovements = movements
      .filter((m) => m.movementType === StockMovementType.RECEIPT)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    let remainingQuantity = issueQuantity;
    let totalCost = 0;

    for (const movement of receiptMovements) {
      if (remainingQuantity <= 0) break;

      const availableQuantity = movement.quantity;
      const issueQuantity = Math.min(remainingQuantity, availableQuantity);

      totalCost += issueQuantity * movement.unitCost;
      remainingQuantity -= issueQuantity;
    }

    return remainingQuantity > 0 ? 0 : totalCost / issueQuantity;
  }

  private calculateWeightedAverageValuation(movements: StockMovement[]): number {
    const receiptMovements = movements.filter((m) => m.movementType === StockMovementType.RECEIPT);

    if (receiptMovements.length === 0) {
      return 0;
    }

    const totalCost = receiptMovements.reduce(
      (sum, movement) => sum + movement.quantity * movement.unitCost,
      0,
    );
    const totalQuantity = receiptMovements.reduce((sum, movement) => sum + movement.quantity, 0);

    return totalCost / totalQuantity;
  }

  private calculateStandardCostValuation(movements: StockMovement[]): number {
    // Standard cost is typically set by management and doesn't change with movements
    // This would need to be retrieved from a standard cost table
    const latestReceipt = movements
      .filter((m) => m.movementType === StockMovementType.RECEIPT)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    return latestReceipt?.unitCost || 0;
  }

  private calculateMovingAverageValuation(movements: StockMovement[]): number {
    // Moving average recalculates after each receipt
    const sortedMovements = movements.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    let totalCost = 0;
    let totalQuantity = 0;

    for (const movement of sortedMovements) {
      if (movement.movementType === StockMovementType.RECEIPT) {
        totalCost += movement.quantity * movement.unitCost;
        totalQuantity += movement.quantity;
      } else if (movement.movementType === StockMovementType.ISSUE) {
        // Issues don't affect the moving average calculation
        continue;
      }
    }

    return totalQuantity > 0 ? totalCost / totalQuantity : 0;
  }
}
```

### 3. Read Model Projections

#### **StockLevelProjection**

```typescript
// packages/inventory/src/projections/stock-level-projection.ts
import { Injectable, Logger } from '@nestjs/common';
import { StockReceivedEvent } from '../events/stock-received-event';
import { StockIssuedEvent } from '../events/stock-issued-event';
import { StockTransferEvent } from '../events/stock-transfer-event';
import { StockAdjustmentEvent } from '../events/stock-adjustment-event';

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
      existing.lastUpdated = event.timestamp;
    } else {
      this.stockLevels.set(key, {
        sku: event.sku,
        location: event.location,
        quantity: event.quantity,
        unitCost: event.unitCost,
        lastUpdated: event.timestamp,
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
      existing.lastUpdated = event.timestamp;

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
      unitCost: 0, // Will be calculated
      location: event.fromLocation,
      reference: event.reference,
      tenantId: event.tenantId,
      version: event.version,
      timestamp: event.timestamp,
    } as StockIssuedEvent);

    // Handle the receipt at destination location
    await this.handleStockReceived({
      sku: event.sku,
      quantity: event.quantity,
      unitCost: 0, // Will be calculated
      location: event.toLocation,
      reference: event.reference,
      tenantId: event.tenantId,
      version: event.version,
      timestamp: event.timestamp,
    } as StockReceivedEvent);
  }

  async handleStockAdjustment(event: StockAdjustmentEvent): Promise<void> {
    const key = this.getKey(event.sku, event.location, event.tenantId);
    const existing = this.stockLevels.get(key);

    if (existing) {
      existing.quantity += event.quantityAdjustment;
      existing.lastUpdated = event.timestamp;

      if (event.unitCost !== undefined) {
        existing.unitCost = event.unitCost;
      }
    } else {
      this.stockLevels.set(key, {
        sku: event.sku,
        location: event.location,
        quantity: event.quantityAdjustment,
        unitCost: event.unitCost || 0,
        lastUpdated: event.timestamp,
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
```

### 4. Reporting APIs

#### **InventoryReportingService**

```typescript
// packages/inventory/src/services/inventory-reporting.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { StockLevelProjection } from '../projections/stock-level-projection';
import { InventoryRepository } from '../domain/interfaces/repositories.interface';

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

@Injectable()
export class InventoryReportingService {
  private readonly logger = new Logger(InventoryReportingService.name);

  constructor(
    private readonly stockLevelProjection: StockLevelProjection,
    private readonly inventoryRepository: InventoryRepository,
  ) {}

  async generateStockLevelReport(tenantId: string, location?: string): Promise<StockLevelReport[]> {
    this.logger.log(
      `Generating stock level report for tenant: ${tenantId}, location: ${location || 'all'}`,
    );

    const inventoryItems = await this.inventoryRepository.findAll(tenantId);
    const reports: StockLevelReport[] = [];

    for (const item of inventoryItems) {
      const stockLevels = this.stockLevelProjection.getAllStockLevels(item.getSku(), tenantId);

      for (const level of stockLevels) {
        if (location && level.location !== location) continue;

        reports.push({
          sku: level.sku,
          description: item.getDescription(),
          location: level.location,
          quantity: level.quantity,
          unitCost: level.unitCost,
          totalValue: level.quantity * level.unitCost,
          lastMovement: level.lastUpdated,
          tenantId: level.tenantId,
        });
      }
    }

    return reports.sort((a, b) => a.sku.localeCompare(b.sku));
  }

  async generateMovementHistoryReport(
    sku: string,
    tenantId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<MovementHistoryReport[]> {
    this.logger.log(`Generating movement history report for SKU: ${sku}, tenant: ${tenantId}`);

    const inventoryItem = await this.inventoryRepository.findBySku(sku, tenantId);
    if (!inventoryItem) {
      throw new Error(`Inventory item with SKU ${sku} not found`);
    }

    const movements = inventoryItem.getStockMovements();
    const reports: MovementHistoryReport[] = [];

    for (const movement of movements) {
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

  async generateValuationReport(sku: string, tenantId: string): Promise<ValuationReport> {
    this.logger.log(`Generating valuation report for SKU: ${sku}, tenant: ${tenantId}`);

    const inventoryItem = await this.inventoryRepository.findBySku(sku, tenantId);
    if (!inventoryItem) {
      throw new Error(`Inventory item with SKU ${sku} not found`);
    }

    const stockLevels = this.stockLevelProjection.getAllStockLevels(sku, tenantId);
    const totalQuantity = stockLevels.reduce((sum, level) => sum + level.quantity, 0);
    const totalValue = stockLevels.reduce((sum, level) => sum + level.quantity * level.unitCost, 0);
    const averageCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;

    const locations = stockLevels.map((level) => ({
      location: level.location,
      quantity: level.quantity,
      value: level.quantity * level.unitCost,
    }));

    return {
      sku,
      description: inventoryItem.getDescription(),
      valuationMethod: inventoryItem.getValuationMethod(),
      totalQuantity,
      averageCost,
      totalValue,
      locations,
      tenantId,
    };
  }

  async generateABCReport(tenantId: string): Promise<
    Array<{
      sku: string;
      description: string;
      totalValue: number;
      percentage: number;
      category: 'A' | 'B' | 'C';
    }>
  > {
    this.logger.log(`Generating ABC analysis report for tenant: ${tenantId}`);

    const stockLevelReport = await this.generateStockLevelReport(tenantId);
    const skuValues = new Map<string, number>();

    // Aggregate values by SKU
    for (const report of stockLevelReport) {
      const currentValue = skuValues.get(report.sku) || 0;
      skuValues.set(report.sku, currentValue + report.totalValue);
    }

    // Sort by value descending
    const sortedSkus = Array.from(skuValues.entries()).sort((a, b) => b[1] - a[1]);

    const totalValue = sortedSkus.reduce((sum, [, value]) => sum + value, 0);
    let cumulativePercentage = 0;

    const abcReport = sortedSkus.map(([sku, value], index) => {
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

      const report = stockLevelReport.find((r) => r.sku === sku);
      return {
        sku,
        description: report?.description || '',
        totalValue: value,
        percentage,
        category,
      };
    });

    return abcReport;
  }
}
```

### 5. API Controllers

#### **InventoryController**

```typescript
// packages/inventory/src/api/controllers/inventory.controller.ts
import { Controller, Post, Get, Body, Param, Query, Logger } from '@nestjs/common';
import { InventoryService } from '../../services/inventory.service';
import { InventoryReportingService } from '../../services/inventory-reporting.service';
import { ReceiveStockCommand } from '../../commands/receive-stock-command';
import { IssueStockCommand } from '../../commands/issue-stock-command';
import { TransferStockCommand } from '../../commands/transfer-stock-command';
import { AdjustStockCommand } from '../../commands/adjust-stock-command';

@Controller('inventory')
export class InventoryController {
  private readonly logger = new Logger(InventoryController.name);

  constructor(
    private readonly inventoryService: InventoryService,
    private readonly reportingService: InventoryReportingService,
  ) {}

  @Post('receive')
  async receiveStock(
    @Body() command: ReceiveStockCommand,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.inventoryService.receiveStock(command);
      return { success: true, message: 'Stock received successfully' };
    } catch (error) {
      this.logger.error(`Failed to receive stock: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  @Post('issue')
  async issueStock(
    @Body() command: IssueStockCommand,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.inventoryService.issueStock(command);
      return { success: true, message: 'Stock issued successfully' };
    } catch (error) {
      this.logger.error(`Failed to issue stock: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  @Post('transfer')
  async transferStock(
    @Body() command: TransferStockCommand,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.inventoryService.transferStock(command);
      return { success: true, message: 'Stock transferred successfully' };
    } catch (error) {
      this.logger.error(`Failed to transfer stock: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  @Post('adjust')
  async adjustStock(
    @Body() command: AdjustStockCommand,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.inventoryService.adjustStock(command);
      return { success: true, message: 'Stock adjusted successfully' };
    } catch (error) {
      this.logger.error(`Failed to adjust stock: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  @Get('stock-levels/:tenantId')
  async getStockLevels(
    @Param('tenantId') tenantId: string,
    @Query('location') location?: string,
  ): Promise<any[]> {
    return this.reportingService.generateStockLevelReport(tenantId, location);
  }

  @Get('movement-history/:sku/:tenantId')
  async getMovementHistory(
    @Param('sku') sku: string,
    @Param('tenantId') tenantId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ): Promise<any[]> {
    const from = fromDate ? new Date(fromDate) : undefined;
    const to = toDate ? new Date(toDate) : undefined;
    return this.reportingService.generateMovementHistoryReport(sku, tenantId, from, to);
  }

  @Get('valuation/:sku/:tenantId')
  async getValuationReport(
    @Param('sku') sku: string,
    @Param('tenantId') tenantId: string,
  ): Promise<any> {
    return this.reportingService.generateValuationReport(sku, tenantId);
  }

  @Get('abc-analysis/:tenantId')
  async getABCAnalysis(@Param('tenantId') tenantId: string): Promise<any[]> {
    return this.reportingService.generateABCReport(tenantId);
  }
}
```

### 6. Database Infrastructure

#### **Inventory Database Entities**

```typescript
// packages/inventory/src/infrastructure/database/entities/inventory-item.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('inventory_items')
export class InventoryItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  sku: string;

  @Column()
  description: string;

  @Column()
  unitOfMeasure: string;

  @Column()
  valuationMethod: string;

  @Column()
  tenantId: string;

  @Column()
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

```typescript
// packages/inventory/src/infrastructure/database/entities/stock-level.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('stock_levels')
@Index(['sku', 'location', 'tenantId'], { unique: true })
export class StockLevelEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sku: string;

  @Column()
  location: string;

  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitCost: number;

  @Column()
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 7. Comprehensive Testing

#### **Integration Tests**

```typescript
// packages/inventory/src/__tests__/inventory-service.integration.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InventoryService } from '../services/inventory.service';
import { ValuationService } from '../services/valuation.service';
import { InventoryReportingService } from '../services/inventory-reporting.service';
import { ReceiveStockCommand } from '../commands/receive-stock-command';
import { IssueStockCommand } from '../commands/issue-stock-command';
import { TransferStockCommand } from '../commands/transfer-stock-command';

describe('Inventory Service Integration Tests', () => {
  let inventoryService: InventoryService;
  let reportingService: InventoryReportingService;
  const tenantId = 'tenant-123';
  const sku = 'SKU-001';

  beforeEach(() => {
    // Setup test dependencies
    inventoryService = new InventoryService(/* mock dependencies */);
    reportingService = new InventoryReportingService(/* mock dependencies */);
  });

  describe('Complete Stock Movement Workflow', () => {
    it('should handle complete stock lifecycle', async () => {
      // 1. Receive initial stock
      const receiveCommand: ReceiveStockCommand = {
        movementId: 'movement-001',
        sku,
        quantity: 100,
        unitCost: 10.5,
        location: 'WAREHOUSE-A',
        reference: 'PO-001',
        tenantId,
        userId: 'user-123',
      };

      await inventoryService.receiveStock(receiveCommand);

      // 2. Issue some stock
      const issueCommand: IssueStockCommand = {
        movementId: 'movement-002',
        sku,
        quantity: 30,
        location: 'WAREHOUSE-A',
        reference: 'SO-001',
        tenantId,
        userId: 'user-123',
      };

      await inventoryService.issueStock(issueCommand);

      // 3. Transfer stock between locations
      const transferCommand: TransferStockCommand = {
        transferId: 'transfer-001',
        sku,
        quantity: 20,
        fromLocation: 'WAREHOUSE-A',
        toLocation: 'WAREHOUSE-B',
        reference: 'TR-001',
        tenantId,
        userId: 'user-123',
      };

      await inventoryService.transferStock(transferCommand);

      // 4. Verify final stock levels
      const stockLevels = await reportingService.generateStockLevelReport(tenantId);
      const warehouseA = stockLevels.find((level) => level.location === 'WAREHOUSE-A');
      const warehouseB = stockLevels.find((level) => level.location === 'WAREHOUSE-B');

      expect(warehouseA?.quantity).toBe(50); // 100 - 30 - 20
      expect(warehouseB?.quantity).toBe(20); // 0 + 20
    });
  });

  describe('Valuation Methods', () => {
    it('should correctly calculate FIFO valuation', async () => {
      // Test FIFO calculation with multiple receipts
      const firstReceipt: ReceiveStockCommand = {
        movementId: 'movement-001',
        sku,
        quantity: 100,
        unitCost: 10.0,
        location: 'WAREHOUSE-A',
        reference: 'PO-001',
        tenantId,
        userId: 'user-123',
      };

      const secondReceipt: ReceiveStockCommand = {
        movementId: 'movement-002',
        sku,
        quantity: 50,
        unitCost: 12.0,
        location: 'WAREHOUSE-A',
        reference: 'PO-002',
        tenantId,
        userId: 'user-123',
      };

      await inventoryService.receiveStock(firstReceipt);
      await inventoryService.receiveStock(secondReceipt);

      const issueCommand: IssueStockCommand = {
        movementId: 'movement-003',
        sku,
        quantity: 75,
        location: 'WAREHOUSE-A',
        reference: 'SO-001',
        tenantId,
        userId: 'user-123',
      };

      await inventoryService.issueStock(issueCommand);

      // FIFO should use first 75 units at $10.00 each
      const valuationReport = await reportingService.generateValuationReport(sku, tenantId);
      expect(valuationReport.averageCost).toBe(10.0);
    });
  });
});
```

## Success Criteria

### Technical Requirements

- [ ] All advanced stock operations implemented and tested
- [ ] Valuation engine supports all methods (FIFO, LIFO, Weighted Average, Standard Cost, Moving Average)
- [ ] Read model projections provide real-time data
- [ ] Reporting APIs return accurate data
- [ ] Integration tests cover complete workflows
- [ ] Performance meets requirements (< 200ms for operations)

### Business Requirements

- [ ] Stock transfers work correctly between locations
- [ ] Stock adjustments handle positive and negative quantities
- [ ] Cycle counting provides accurate reconciliation
- [ ] Valuation calculations are mathematically correct
- [ ] Reports provide actionable business insights
- [ ] ABC analysis correctly categorizes inventory

### Quality Requirements

- [ ] 95%+ test coverage across all components
- [ ] All business rules properly validated
- [ ] Comprehensive error handling
- [ ] Proper logging and monitoring
- [ ] Documentation complete and accurate

## Performance Optimization

### Database Optimization

- [ ] Proper indexing on frequently queried columns
- [ ] Partitioning for large datasets
- [ ] Connection pooling configuration
- [ ] Query optimization for reporting

### Caching Strategy

- [ ] Redis caching for frequently accessed stock levels
- [ ] In-memory caching for valuation calculations
- [ ] Cache invalidation strategies
- [ ] Performance monitoring

## Integration Points

### Accounting Service Integration

- [ ] Journal entry generation for inventory movements
- [ ] Cost of goods sold calculations
- [ ] Inventory valuation adjustments
- [ ] Financial reporting integration

### Other Service Integrations

- [ ] Purchase order service for goods receipts
- [ ] Sales order service for stock issues
- [ ] Warehouse management for location tracking
- [ ] Product catalog for SKU management

## Risk Mitigation

### Technical Risks

- **Performance Issues**: Implement proper indexing and caching
- **Data Consistency**: Use transactional event storage
- **Memory Usage**: Implement efficient data structures
- **Concurrency**: Use proper locking mechanisms

### Business Risks

- **Inventory Accuracy**: Implement comprehensive validation
- **Audit Trail**: Ensure complete event logging
- **Compliance**: Follow regulatory requirements
- **Data Integrity**: Implement data validation rules

## Next Steps

After completing Week 12, the inventory service will be production-ready with:

- Complete stock movement operations
- Advanced valuation capabilities
- Real-time reporting and analytics
- Integration with other services
- Comprehensive testing and monitoring

This implementation provides a solid foundation for enterprise-grade inventory management that can scale with business growth while maintaining data integrity and performance.
