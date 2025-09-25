# Week 11: Inventory Service Foundation Development Plan

## Overview

This document provides a comprehensive development plan for Week 11 of the AI-BOS ERP project, focusing on establishing the foundation for the Inventory Service using Event Sourcing patterns. This follows the established patterns from the accounting package while implementing inventory-specific domain logic.

## Strategic Objectives

- **Foundation Setup**: Establish inventory package structure following accounting package patterns
- **Domain Modeling**: Implement core inventory domain entities and aggregates
- **Event Sourcing**: Set up event sourcing infrastructure for inventory operations
- **Basic Operations**: Implement core stock movement operations (receive, issue)
- **Testing Framework**: Establish comprehensive testing patterns

## Package Structure Analysis

Based on the accounting package structure, the inventory package will follow this organization:

```
packages/inventory/
├── src/
│   ├── __tests__/                    # Test files
│   ├── api/                          # API layer
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── index.ts
│   ├── commands/                     # Command objects
│   ├── domain/                       # Domain layer
│   │   ├── entities/
│   │   ├── interfaces/
│   │   └── value-objects/
│   ├── events/                       # Domain events
│   ├── infrastructure/               # Infrastructure layer
│   │   ├── database/
│   │   │   ├── entities/
│   │   │   ├── migrations/
│   │   │   └── repositories/
│   │   ├── repositories/
│   │   └── resilience/
│   ├── projections/                 # Read model projections
│   ├── services/                     # Application services
│   ├── types/                        # Type definitions
│   ├── validation/                   # Validation schemas
│   └── index.ts
├── package.json
├── tsconfig.json
├── tsconfig.test.json
├── tsup.config.ts
└── vitest.config.ts
```

## Week 11 Deliverables

### 1. Package Foundation Setup

#### **Inventory Package Creation**

- [ ] Create `packages/inventory/` directory structure
- [ ] Set up package.json with proper dependencies
- [ ] Configure TypeScript configurations (tsconfig.json, tsconfig.test.json)
- [ ] Set up build configuration (tsup.config.ts)
- [ ] Configure testing framework (vitest.config.ts)
- [ ] Add to monorepo workspace configuration

#### **Dependencies Configuration**

```json
{
  "dependencies": {
    "@aibos/eventsourcing": "workspace:*",
    "@aibos/contracts": "workspace:*",
    "@aibos/utils": "workspace:*",
    "@nestjs/common": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0",
    "tsup": "^8.0.0"
  }
}
```

### 2. Domain Layer Implementation

#### **Core Domain Entities**

**InventoryItem Aggregate Root**

```typescript
// packages/inventory/src/domain/inventory-item.ts
import { AggregateRoot } from '@aibos/eventsourcing';
import { StockMovement } from './stock-movement';
import { ValuationMethod } from './value-objects/valuation-method';
import { ReceiveStockCommand } from '../commands/receive-stock-command';
import { IssueStockCommand } from '../commands/issue-stock-command';
import { StockReceivedEvent } from '../events/stock-received-event';
import { StockIssuedEvent } from '../events/stock-issued-event';

export class InventoryItem extends AggregateRoot {
  private sku: string;
  private description: string;
  private unitOfMeasure: string;
  private valuationMethod: ValuationMethod;
  private stockMovements: StockMovement[] = [];
  private currentStock: Map<string, number> = new Map(); // location -> quantity

  constructor(
    id: string,
    sku: string,
    description: string,
    unitOfMeasure: string,
    valuationMethod: ValuationMethod,
    tenantId: string,
    version: number = 0,
  ) {
    super(id, version);
    this.sku = sku;
    this.description = description;
    this.unitOfMeasure = unitOfMeasure;
    this.valuationMethod = valuationMethod;
  }

  public receiveStock(command: ReceiveStockCommand): void {
    this.validateStockReceipt(command);

    const movement = new StockMovement(
      command.movementId,
      command.quantity,
      command.unitCost,
      command.location,
      StockMovementType.RECEIPT,
      command.reference,
    );

    this.stockMovements.push(movement);
    this.updateCurrentStock(command.location, command.quantity);

    this.addEvent(
      new StockReceivedEvent(
        this.sku,
        command.quantity,
        command.unitCost,
        command.location,
        command.reference,
        command.tenantId,
        this.version + 1,
      ),
    );
  }

  public issueStock(command: IssueStockCommand): void {
    this.validateStockIssue(command);

    const issueCost = this.calculateIssueCost(command);
    const movement = new StockMovement(
      command.movementId,
      command.quantity,
      issueCost,
      command.location,
      StockMovementType.ISSUE,
      command.reference,
    );

    this.stockMovements.push(movement);
    this.updateCurrentStock(command.location, -command.quantity);

    this.addEvent(
      new StockIssuedEvent(
        this.sku,
        command.quantity,
        issueCost,
        command.location,
        command.reference,
        command.tenantId,
        this.version + 1,
      ),
    );
  }

  private validateStockReceipt(command: ReceiveStockCommand): void {
    if (command.quantity <= 0) {
      throw new Error('Stock receipt quantity must be positive');
    }
    if (command.unitCost < 0) {
      throw new Error('Unit cost cannot be negative');
    }
    if (!command.location || command.location.trim() === '') {
      throw new Error('Location is required for stock receipt');
    }
  }

  private validateStockIssue(command: IssueStockCommand): void {
    if (command.quantity <= 0) {
      throw new Error('Stock issue quantity must be positive');
    }
    if (!command.location || command.location.trim() === '') {
      throw new Error('Location is required for stock issue');
    }

    const currentStockAtLocation = this.currentStock.get(command.location) || 0;
    if (currentStockAtLocation < command.quantity) {
      throw new Error(
        `Insufficient stock at location ${command.location}. Available: ${currentStockAtLocation}, Required: ${command.quantity}`,
      );
    }
  }

  private calculateIssueCost(command: IssueStockCommand): number {
    switch (this.valuationMethod) {
      case ValuationMethod.FIFO:
        return this.calculateFIFOCost(command.quantity);
      case ValuationMethod.LIFO:
        return this.calculateLIFOCost(command.quantity);
      case ValuationMethod.WEIGHTED_AVERAGE:
        return this.calculateWeightedAverageCost();
      default:
        throw new Error('Invalid valuation method');
    }
  }

  private calculateFIFOCost(quantity: number): number {
    // Implementation for FIFO cost calculation
    const sortedMovements = this.stockMovements
      .filter((m) => m.movementType === StockMovementType.RECEIPT)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    let remainingQuantity = quantity;
    let totalCost = 0;

    for (const movement of sortedMovements) {
      if (remainingQuantity <= 0) break;

      const availableQuantity = movement.quantity;
      const issueQuantity = Math.min(remainingQuantity, availableQuantity);

      totalCost += issueQuantity * movement.unitCost;
      remainingQuantity -= issueQuantity;
    }

    return totalCost / quantity;
  }

  private calculateLIFOCost(quantity: number): number {
    // Implementation for LIFO cost calculation
    const sortedMovements = this.stockMovements
      .filter((m) => m.movementType === StockMovementType.RECEIPT)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    let remainingQuantity = quantity;
    let totalCost = 0;

    for (const movement of sortedMovements) {
      if (remainingQuantity <= 0) break;

      const availableQuantity = movement.quantity;
      const issueQuantity = Math.min(remainingQuantity, availableQuantity);

      totalCost += issueQuantity * movement.unitCost;
      remainingQuantity -= issueQuantity;
    }

    return totalCost / quantity;
  }

  private calculateWeightedAverageCost(): number {
    const receiptMovements = this.stockMovements.filter(
      (m) => m.movementType === StockMovementType.RECEIPT,
    );

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

  private updateCurrentStock(location: string, quantityChange: number): void {
    const currentQuantity = this.currentStock.get(location) || 0;
    this.currentStock.set(location, currentQuantity + quantityChange);
  }

  // Getters
  public getSku(): string {
    return this.sku;
  }
  public getDescription(): string {
    return this.description;
  }
  public getUnitOfMeasure(): string {
    return this.unitOfMeasure;
  }
  public getValuationMethod(): ValuationMethod {
    return this.valuationMethod;
  }
  public getCurrentStock(): Map<string, number> {
    return new Map(this.currentStock);
  }
  public getStockMovements(): StockMovement[] {
    return [...this.stockMovements];
  }
}
```

**StockMovement Value Object**

```typescript
// packages/inventory/src/domain/stock-movement.ts
export enum StockMovementType {
  RECEIPT = 'RECEIPT',
  ISSUE = 'ISSUE',
  TRANSFER = 'TRANSFER',
  ADJUSTMENT = 'ADJUSTMENT',
  CYCLE_COUNT = 'CYCLE_COUNT',
}

export class StockMovement {
  constructor(
    public readonly movementId: string,
    public readonly quantity: number,
    public readonly unitCost: number,
    public readonly location: string,
    public readonly movementType: StockMovementType,
    public readonly reference: string,
    public readonly timestamp: Date = new Date(),
  ) {
    this.validateMovement();
  }

  private validateMovement(): void {
    if (this.quantity <= 0) {
      throw new Error('Movement quantity must be positive');
    }
    if (this.unitCost < 0) {
      throw new Error('Unit cost cannot be negative');
    }
    if (!this.location || this.location.trim() === '') {
      throw new Error('Location is required');
    }
    if (!this.reference || this.reference.trim() === '') {
      throw new Error('Reference is required');
    }
  }
}
```

**ValuationMethod Value Object**

```typescript
// packages/inventory/src/domain/value-objects/valuation-method.ts
export enum ValuationMethod {
  FIFO = 'FIFO',
  LIFO = 'LIFO',
  WEIGHTED_AVERAGE = 'WEIGHTED_AVERAGE',
  STANDARD_COST = 'STANDARD_COST',
  MOVING_AVERAGE = 'MOVING_AVERAGE',
}

export class ValuationMethodValidator {
  static validate(method: string): ValuationMethod {
    const validMethods = Object.values(ValuationMethod);
    if (!validMethods.includes(method as ValuationMethod)) {
      throw new Error(
        `Invalid valuation method: ${method}. Valid methods: ${validMethods.join(', ')}`,
      );
    }
    return method as ValuationMethod;
  }
}
```

### 3. Command Objects

**ReceiveStockCommand**

```typescript
// packages/inventory/src/commands/receive-stock-command.ts
export interface ReceiveStockCommand {
  readonly movementId: string;
  readonly sku: string;
  readonly quantity: number;
  readonly unitCost: number;
  readonly location: string;
  readonly reference: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly batchNumber?: string;
  readonly expiryDate?: Date;
  readonly serialNumbers?: string[];
}
```

**IssueStockCommand**

```typescript
// packages/inventory/src/commands/issue-stock-command.ts
export interface IssueStockCommand {
  readonly movementId: string;
  readonly sku: string;
  readonly quantity: number;
  readonly location: string;
  readonly reference: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly batchNumber?: string;
  readonly serialNumbers?: string[];
}
```

### 4. Domain Events

**StockReceivedEvent**

```typescript
// packages/inventory/src/events/stock-received-event.ts
import { DomainEvent } from '@aibos/eventsourcing';

export class StockReceivedEvent implements DomainEvent {
  constructor(
    public readonly sku: string,
    public readonly quantity: number,
    public readonly unitCost: number,
    public readonly location: string,
    public readonly reference: string,
    public readonly tenantId: string,
    public readonly version: number,
    public readonly timestamp: Date = new Date(),
    public readonly batchNumber?: string,
    public readonly expiryDate?: Date,
    public readonly serialNumbers?: string[],
  ) {}

  getEventType(): string {
    return 'StockReceivedEvent';
  }

  getAggregateId(): string {
    return `inventory-item-${this.sku}-${this.tenantId}`;
  }
}
```

**StockIssuedEvent**

```typescript
// packages/inventory/src/events/stock-issued-event.ts
import { DomainEvent } from '@aibos/eventsourcing';

export class StockIssuedEvent implements DomainEvent {
  constructor(
    public readonly sku: string,
    public readonly quantity: number,
    public readonly unitCost: number,
    public readonly location: string,
    public readonly reference: string,
    public readonly tenantId: string,
    public readonly version: number,
    public readonly timestamp: Date = new Date(),
    public readonly batchNumber?: string,
    public readonly serialNumbers?: string[],
  ) {}

  getEventType(): string {
    return 'StockIssuedEvent';
  }

  getAggregateId(): string {
    return `inventory-item-${this.sku}-${this.tenantId}`;
  }
}
```

### 5. Repository Interfaces

```typescript
// packages/inventory/src/domain/interfaces/repositories.interface.ts
import { InventoryItem } from '../inventory-item';

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
```

### 6. Application Service

**InventoryService**

```typescript
// packages/inventory/src/services/inventory.service.ts
import { Injectable, Logger, Inject } from '@nestjs/common';
import { InventoryItem } from '../domain/inventory-item';
import { ReceiveStockCommand } from '../commands/receive-stock-command';
import { IssueStockCommand } from '../commands/issue-stock-command';
import { InventoryRepository } from '../domain/interfaces/repositories.interface';
import { EventStore } from '../domain/interfaces/repositories.interface';
import { CircuitBreaker } from '../infrastructure/resilience/circuit-breaker';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);
  private readonly circuitBreaker = new CircuitBreaker({
    failureThreshold: 5,
    recoveryTimeout: 30000,
    monitoringPeriod: 60000,
  });

  constructor(
    @Inject('EventStore')
    private readonly eventStore: EventStore,
    @Inject('InventoryRepository')
    private readonly inventoryRepository: InventoryRepository,
  ) {}

  async receiveStock(command: ReceiveStockCommand): Promise<void> {
    return this.circuitBreaker.execute(async () => {
      this.logger.log(
        `Receiving stock for SKU: ${command.sku}, Quantity: ${command.quantity} for tenant: ${command.tenantId}`,
      );

      const inventoryItem = await this.loadInventoryItem(command.sku, command.tenantId);
      inventoryItem.receiveStock(command);

      await this.eventStore.append(
        `inventory-item-${command.sku}-${command.tenantId}`,
        inventoryItem.getUncommittedEvents(),
        inventoryItem.getVersion(),
      );

      inventoryItem.markEventsAsCommitted();
      await this.inventoryRepository.save(inventoryItem);

      this.logger.log(`Stock received successfully for SKU: ${command.sku}`);
    });
  }

  async issueStock(command: IssueStockCommand): Promise<void> {
    return this.circuitBreaker.execute(async () => {
      this.logger.log(
        `Issuing stock for SKU: ${command.sku}, Quantity: ${command.quantity} for tenant: ${command.tenantId}`,
      );

      const inventoryItem = await this.loadInventoryItem(command.sku, command.tenantId);
      inventoryItem.issueStock(command);

      await this.eventStore.append(
        `inventory-item-${command.sku}-${command.tenantId}`,
        inventoryItem.getUncommittedEvents(),
        inventoryItem.getVersion(),
      );

      inventoryItem.markEventsAsCommitted();
      await this.inventoryRepository.save(inventoryItem);

      this.logger.log(`Stock issued successfully for SKU: ${command.sku}`);
    });
  }

  private async loadInventoryItem(sku: string, tenantId: string): Promise<InventoryItem> {
    const inventoryItem = await this.inventoryRepository.findBySku(sku, tenantId);

    if (!inventoryItem) {
      throw new Error(`Inventory item with SKU ${sku} not found for tenant ${tenantId}`);
    }

    return inventoryItem;
  }
}
```

### 7. Testing Framework

**InventoryItem Test Suite**

```typescript
// packages/inventory/src/__tests__/inventory-item.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { InventoryItem } from '../domain/inventory-item';
import { ValuationMethod } from '../domain/value-objects/valuation-method';
import { ReceiveStockCommand } from '../commands/receive-stock-command';
import { IssueStockCommand } from '../commands/issue-stock-command';

describe('InventoryItem', () => {
  let inventoryItem: InventoryItem;
  const tenantId = 'tenant-123';
  const sku = 'SKU-001';
  const description = 'Test Product';
  const unitOfMeasure = 'EA';

  beforeEach(() => {
    inventoryItem = new InventoryItem(
      'item-123',
      sku,
      description,
      unitOfMeasure,
      ValuationMethod.FIFO,
      tenantId,
    );
  });

  describe('receiveStock', () => {
    it('should successfully receive stock', () => {
      const command: ReceiveStockCommand = {
        movementId: 'movement-123',
        sku,
        quantity: 100,
        unitCost: 10.5,
        location: 'WAREHOUSE-A',
        reference: 'PO-001',
        tenantId,
        userId: 'user-123',
      };

      inventoryItem.receiveStock(command);

      expect(inventoryItem.getUncommittedEvents()).toHaveLength(1);
      expect(inventoryItem.getCurrentStock().get('WAREHOUSE-A')).toBe(100);
    });

    it('should throw error for negative quantity', () => {
      const command: ReceiveStockCommand = {
        movementId: 'movement-123',
        sku,
        quantity: -10,
        unitCost: 10.5,
        location: 'WAREHOUSE-A',
        reference: 'PO-001',
        tenantId,
        userId: 'user-123',
      };

      expect(() => inventoryItem.receiveStock(command)).toThrow(
        'Stock receipt quantity must be positive',
      );
    });
  });

  describe('issueStock', () => {
    beforeEach(() => {
      // First receive some stock
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
      inventoryItem.receiveStock(receiveCommand);
      inventoryItem.markEventsAsCommitted();
    });

    it('should successfully issue stock', () => {
      const command: IssueStockCommand = {
        movementId: 'movement-002',
        sku,
        quantity: 50,
        location: 'WAREHOUSE-A',
        reference: 'SO-001',
        tenantId,
        userId: 'user-123',
      };

      inventoryItem.issueStock(command);

      expect(inventoryItem.getUncommittedEvents()).toHaveLength(1);
      expect(inventoryItem.getCurrentStock().get('WAREHOUSE-A')).toBe(50);
    });

    it('should throw error for insufficient stock', () => {
      const command: IssueStockCommand = {
        movementId: 'movement-002',
        sku,
        quantity: 150,
        location: 'WAREHOUSE-A',
        reference: 'SO-001',
        tenantId,
        userId: 'user-123',
      };

      expect(() => inventoryItem.issueStock(command)).toThrow(
        'Insufficient stock at location WAREHOUSE-A',
      );
    });
  });
});
```

## Success Criteria

### Technical Requirements

- [ ] All TypeScript compilation passes without errors
- [ ] All unit tests pass with 95%+ coverage
- [ ] Domain logic follows DDD principles
- [ ] Event sourcing patterns properly implemented
- [ ] Circuit breaker pattern implemented for resilience
- [ ] Proper error handling and validation

### Performance Requirements

- [ ] Stock movement operations complete in < 200ms
- [ ] Memory usage remains stable under load
- [ ] No memory leaks in long-running operations

### Quality Requirements

- [ ] Code follows established patterns from accounting package
- [ ] All business rules properly validated
- [ ] Comprehensive test coverage for domain logic
- [ ] Proper logging and monitoring

## Risk Mitigation

### Technical Risks

- **Event Sourcing Complexity**: Mitigate by following established patterns from accounting package
- **Performance Issues**: Implement proper indexing and caching strategies
- **Data Consistency**: Use transactional event storage

### Business Risks

- **Inventory Accuracy**: Implement comprehensive validation rules
- **Audit Trail**: Ensure all operations are properly logged
- **Compliance**: Follow established patterns for regulatory compliance

## Next Steps

After completing Week 11, the foundation will be ready for Week 12 implementation, which will focus on:

- Advanced inventory operations (transfers, adjustments)
- Valuation calculations and projections
- Reporting and analytics
- Integration with other services
- Performance optimization

This foundation ensures a solid base for building a robust, scalable inventory management system that follows enterprise-grade patterns and practices.
