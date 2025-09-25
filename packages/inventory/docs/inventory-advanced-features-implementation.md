# Inventory Advanced Features Implementation Guide

## 📋 **Overview**

This document provides comprehensive implementation guidance for the missing inventory advanced features identified in the Phase 2 gap analysis. The implementation follows clean monorepo principles, maintains high code quality, and ensures proper integration with the existing event sourcing architecture.

## 🎯 **Implementation Scope**

### **Missing Components to Implement:**

1. **Stock Reconciliation Utilities** (0% → 100%)
2. **Batch/Lot Number Tracking** (30% → 100%)
3. **Serial Number Management** (30% → 100%)
4. **Expiry Date Tracking** (40% → 100%)

---

## 🏗️ **Technical Architecture**

### **Tech Stack**

- **Language**: TypeScript 5.0+
- **Framework**: NestJS 10.0+
- **Event Sourcing**: Custom EventStore implementation
- **Database**: PostgreSQL 15+
- **Testing**: Vitest + Supertest
- **Linting**: ESLint + Prettier
- **Build**: tsup (ESM/CJS)

### **Dependencies**

```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "pg": "^8.11.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/pg": "^8.10.0",
    "@types/uuid": "^9.0.0",
    "vitest": "^1.0.0",
    "supertest": "^6.3.0"
  }
}
```

---

## 🔧 **Implementation Guide**

### **1. Stock Reconciliation Utilities**

#### **1.1 Domain Models**

**File**: `packages/inventory/src/domain/reconciliation.ts`

```typescript
import { AggregateRoot, DomainEvent } from '@aibos/eventsourcing';

export interface ReconciliationData {
  readonly reconciliationId: string;
  readonly sku: string;
  readonly location: string;
  readonly systemQuantity: number;
  readonly physicalQuantity: number;
  readonly variance: number;
  readonly variancePercentage: number;
  readonly reconciliationDate: Date;
  readonly reconciledBy: string;
  readonly status: ReconciliationStatus;
  readonly notes?: string;
  readonly tenantId: string;
}

export enum ReconciliationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum ReconciliationType {
  CYCLE_COUNT = 'CYCLE_COUNT',
  FULL_INVENTORY = 'FULL_INVENTORY',
  SPOT_CHECK = 'SPOT_CHECK',
  SYSTEM_RECONCILIATION = 'SYSTEM_RECONCILIATION',
}

export class Reconciliation extends AggregateRoot {
  constructor(
    public readonly _reconciliationId: string,
    public readonly _sku: string,
    public readonly _location: string,
    public readonly _systemQuantity: number,
    public readonly _physicalQuantity: number,
    public readonly _reconciliationType: ReconciliationType,
    public readonly _reconciledBy: string,
    public readonly _tenantId: string,
    public _status: ReconciliationStatus = ReconciliationStatus.PENDING,
    public readonly _notes?: string,
  ) {
    super();
  }

  public getVariance(): number {
    return this._physicalQuantity - this._systemQuantity;
  }

  public getVariancePercentage(): number {
    if (this._systemQuantity === 0) return 0;
    return (this.getVariance() / this._systemQuantity) * 100;
  }

  public startReconciliation(): void {
    if (this._status !== ReconciliationStatus.PENDING) {
      throw new Error('Reconciliation can only be started from PENDING status');
    }
    this._status = ReconciliationStatus.IN_PROGRESS;

    this.addEvent(
      new ReconciliationStartedEvent(
        this._reconciliationId,
        this._sku,
        this._location,
        this._tenantId,
        this.getVersion() + 1,
      ),
    );
  }

  public completeReconciliation(notes?: string): void {
    if (this._status !== ReconciliationStatus.IN_PROGRESS) {
      throw new Error('Reconciliation must be in progress to complete');
    }
    this._status = ReconciliationStatus.COMPLETED;

    this.addEvent(
      new ReconciliationCompletedEvent(
        this._reconciliationId,
        this._sku,
        this._location,
        this.getVariance(),
        this.getVariancePercentage(),
        this._tenantId,
        this.getVersion() + 1,
        notes,
      ),
    );
  }

  public approveReconciliation(approvedBy: string): void {
    if (this._status !== ReconciliationStatus.COMPLETED) {
      throw new Error('Reconciliation must be completed before approval');
    }
    this._status = ReconciliationStatus.APPROVED;

    this.addEvent(
      new ReconciliationApprovedEvent(
        this._reconciliationId,
        this._sku,
        this._location,
        approvedBy,
        this._tenantId,
        this.getVersion() + 1,
      ),
    );
  }

  public rejectReconciliation(reason: string): void {
    if (this._status !== ReconciliationStatus.COMPLETED) {
      throw new Error('Reconciliation must be completed before rejection');
    }
    this._status = ReconciliationStatus.REJECTED;

    this.addEvent(
      new ReconciliationRejectedEvent(
        this._reconciliationId,
        this._sku,
        this._location,
        reason,
        this._tenantId,
        this.getVersion() + 1,
      ),
    );
  }
}

// Domain Events
export class ReconciliationStartedEvent extends DomainEvent {
  constructor(
    public readonly reconciliationId: string,
    public readonly sku: string,
    public readonly location: string,
    public readonly tenantId: string,
    public readonly version: number,
  ) {
    super();
  }
}

export class ReconciliationCompletedEvent extends DomainEvent {
  constructor(
    public readonly reconciliationId: string,
    public readonly sku: string,
    public readonly location: string,
    public readonly variance: number,
    public readonly variancePercentage: number,
    public readonly tenantId: string,
    public readonly version: number,
    public readonly notes?: string,
  ) {
    super();
  }
}

export class ReconciliationApprovedEvent extends DomainEvent {
  constructor(
    public readonly reconciliationId: string,
    public readonly sku: string,
    public readonly location: string,
    public readonly approvedBy: string,
    public readonly tenantId: string,
    public readonly version: number,
  ) {
    super();
  }
}

export class ReconciliationRejectedEvent extends DomainEvent {
  constructor(
    public readonly reconciliationId: string,
    public readonly sku: string,
    public readonly location: string,
    public readonly reason: string,
    public readonly tenantId: string,
    public readonly version: number,
  ) {
    super();
  }
}
```

#### **1.2 Service Implementation**

**File**: `packages/inventory/src/services/reconciliation.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import type { EventStore } from '../infrastructure/event-store/event-store';
import type { InventoryService } from './inventory.service';
import { Reconciliation, ReconciliationStatus, ReconciliationType } from '../domain/reconciliation';

export interface CreateReconciliationCommand {
  readonly reconciliationId: string;
  readonly sku: string;
  readonly location: string;
  readonly reconciliationType: ReconciliationType;
  readonly reconciledBy: string;
  readonly tenantId: string;
  readonly notes?: string;
}

export interface CompleteReconciliationCommand {
  readonly reconciliationId: string;
  readonly physicalQuantity: number;
  readonly notes?: string;
  readonly tenantId: string;
}

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(
    private readonly _eventStore: EventStore,
    private readonly _inventoryService: InventoryService,
  ) {}

  async createReconciliation(command: CreateReconciliationCommand): Promise<void> {
    this.logger.log(
      `Creating reconciliation for SKU: ${command.sku}, Location: ${command.location}`,
    );

    // Get current system quantity
    const systemQuantity = await this._inventoryService.getAvailableStockForLocation(
      command.sku,
      command.location,
      command.tenantId,
    );

    const reconciliation = new Reconciliation(
      command.reconciliationId,
      command.sku,
      command.location,
      systemQuantity,
      0, // Physical quantity will be set when completed
      command.reconciliationType,
      command.reconciledBy,
      command.tenantId,
      ReconciliationStatus.PENDING,
      command.notes,
    );

    await this._eventStore.append(
      `reconciliation-${command.reconciliationId}`,
      reconciliation.getUncommittedEvents(),
      reconciliation.getVersion(),
    );

    reconciliation.markEventsAsCommitted();
    this.logger.log(`Reconciliation created: ${command.reconciliationId}`);
  }

  async startReconciliation(reconciliationId: string, tenantId: string): Promise<void> {
    this.logger.log(`Starting reconciliation: ${reconciliationId}`);

    const reconciliation = await this.loadReconciliation(reconciliationId, tenantId);
    reconciliation.startReconciliation();

    await this._eventStore.append(
      `reconciliation-${reconciliationId}`,
      reconciliation.getUncommittedEvents(),
      reconciliation.getVersion(),
    );

    reconciliation.markEventsAsCommitted();
    this.logger.log(`Reconciliation started: ${reconciliationId}`);
  }

  async completeReconciliation(command: CompleteReconciliationCommand): Promise<void> {
    this.logger.log(`Completing reconciliation: ${command.reconciliationId}`);

    const reconciliation = await this.loadReconciliation(
      command.reconciliationId,
      command.tenantId,
    );

    // Update physical quantity
    (reconciliation as any)._physicalQuantity = command.physicalQuantity;

    reconciliation.completeReconciliation(command.notes);

    await this._eventStore.append(
      `reconciliation-${command.reconciliationId}`,
      reconciliation.getUncommittedEvents(),
      reconciliation.getVersion(),
    );

    reconciliation.markEventsAsCommitted();
    this.logger.log(`Reconciliation completed: ${command.reconciliationId}`);
  }

  async approveReconciliation(
    reconciliationId: string,
    approvedBy: string,
    tenantId: string,
  ): Promise<void> {
    this.logger.log(`Approving reconciliation: ${reconciliationId}`);

    const reconciliation = await this.loadReconciliation(reconciliationId, tenantId);
    reconciliation.approveReconciliation(approvedBy);

    await this._eventStore.append(
      `reconciliation-${reconciliationId}`,
      reconciliation.getUncommittedEvents(),
      reconciliation.getVersion(),
    );

    reconciliation.markEventsAsCommitted();

    // If approved, create stock adjustment for variance
    const variance = reconciliation.getVariance();
    if (variance !== 0) {
      await this.createStockAdjustmentFromReconciliation(reconciliation, variance, tenantId);
    }

    this.logger.log(`Reconciliation approved: ${reconciliationId}`);
  }

  async getReconciliationVarianceReport(
    tenantId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<
    Array<{
      reconciliationId: string;
      sku: string;
      location: string;
      variance: number;
      variancePercentage: number;
      status: ReconciliationStatus;
      reconciliationDate: Date;
    }>
  > {
    this.logger.log(`Generating reconciliation variance report for tenant: ${tenantId}`);

    // Implementation would query reconciliation projections
    // For now, return empty array as placeholder
    return [];
  }

  private async loadReconciliation(
    reconciliationId: string,
    tenantId: string,
  ): Promise<Reconciliation> {
    const events = await this._eventStore.getEvents(`reconciliation-${reconciliationId}`);

    if (events.length === 0) {
      throw new Error(`Reconciliation ${reconciliationId} not found`);
    }

    // Rebuild reconciliation from events
    // This would be implemented based on the event store structure
    throw new Error('Reconciliation loading not implemented');
  }

  private async createStockAdjustmentFromReconciliation(
    reconciliation: Reconciliation,
    variance: number,
    tenantId: string,
  ): Promise<void> {
    const adjustmentType = variance > 0 ? 'INCREASE' : 'DECREASE';
    const quantity = Math.abs(variance);

    await this._inventoryService.adjustStock({
      adjustmentId: `reconciliation-${reconciliation._reconciliationId}`,
      sku: reconciliation._sku,
      quantity,
      location: reconciliation._location,
      adjustmentType,
      reason: `Reconciliation adjustment - Variance: ${variance}`,
      reference: reconciliation._reconciliationId,
      tenantId,
      userId: 'system',
    });
  }
}
```

#### **1.3 Database Migration**

**File**: `packages/inventory/src/infrastructure/database/migrations/002-create-reconciliation-tables.sql`

```sql
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
```

---

### **2. Complete Batch/Lot Number Tracking**

#### **2.1 Enhanced Batch Domain Model**

**File**: `packages/inventory/src/domain/batch.ts` (Update existing)

```typescript
import { AggregateRoot, DomainEvent } from '@aibos/eventsourcing';

export interface BatchData {
  readonly batchId: string;
  readonly sku: string;
  readonly batchNumber: string;
  readonly manufacturingDate: Date;
  readonly expiryDate: Date;
  readonly quantity: number;
  readonly location: string;
  readonly status: BatchStatus;
  readonly qualityStatus: QualityStatus;
  readonly tenantId: string;
}

export enum BatchStatus {
  ACTIVE = 'ACTIVE',
  QUARANTINED = 'QUARANTINED',
  EXPIRED = 'EXPIRED',
  CONSUMED = 'CONSUMED',
  RECALLED = 'RECALLED',
}

export enum QualityStatus {
  PENDING = 'PENDING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  QUARANTINED = 'QUARANTINED',
}

export class Batch extends AggregateRoot {
  constructor(
    public readonly _batchId: string,
    public readonly _sku: string,
    public readonly _batchNumber: string,
    public readonly _manufacturingDate: Date,
    public readonly _expiryDate: Date,
    public _quantity: number,
    public readonly _location: string,
    public readonly _tenantId: string,
    public _status: BatchStatus = BatchStatus.ACTIVE,
    public _qualityStatus: QualityStatus = QualityStatus.PENDING,
  ) {
    super();
  }

  public isExpired(): boolean {
    return new Date() > this._expiryDate;
  }

  public getDaysToExpiry(): number {
    const today = new Date();
    const timeDiff = this._expiryDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  public getExpiryStatus(): 'EXPIRED' | 'EXPIRING_SOON' | 'GOOD' {
    if (this.isExpired()) return 'EXPIRED';
    if (this.getDaysToExpiry() <= 30) return 'EXPIRING_SOON';
    return 'GOOD';
  }

  public updateQuantity(newQuantity: number): void {
    if (newQuantity < 0) {
      throw new Error('Batch quantity cannot be negative');
    }

    const oldQuantity = this._quantity;
    this._quantity = newQuantity;

    this.addEvent(
      new BatchQuantityUpdatedEvent(
        this._batchId,
        this._sku,
        oldQuantity,
        newQuantity,
        this._tenantId,
        this.getVersion() + 1,
      ),
    );
  }

  public quarantineBatch(reason: string): void {
    if (this._status !== BatchStatus.ACTIVE) {
      throw new Error('Only active batches can be quarantined');
    }

    this._status = BatchStatus.QUARANTINED;
    this._qualityStatus = QualityStatus.QUARANTINED;

    this.addEvent(
      new BatchQuarantinedEvent(
        this._batchId,
        this._sku,
        reason,
        this._tenantId,
        this.getVersion() + 1,
      ),
    );
  }

  public releaseFromQuarantine(): void {
    if (this._status !== BatchStatus.QUARANTINED) {
      throw new Error('Only quarantined batches can be released');
    }

    this._status = BatchStatus.ACTIVE;
    this._qualityStatus = QualityStatus.PASSED;

    this.addEvent(
      new BatchReleasedFromQuarantineEvent(
        this._batchId,
        this._sku,
        this._tenantId,
        this.getVersion() + 1,
      ),
    );
  }

  public consumeQuantity(quantity: number): void {
    if (quantity > this._quantity) {
      throw new Error('Insufficient batch quantity');
    }

    this._quantity -= quantity;

    if (this._quantity === 0) {
      this._status = BatchStatus.CONSUMED;
    }

    this.addEvent(
      new BatchConsumedEvent(
        this._batchId,
        this._sku,
        quantity,
        this._quantity,
        this._tenantId,
        this.getVersion() + 1,
      ),
    );
  }

  public recallBatch(reason: string): void {
    this._status = BatchStatus.RECALLED;

    this.addEvent(
      new BatchRecalledEvent(
        this._batchId,
        this._sku,
        reason,
        this._tenantId,
        this.getVersion() + 1,
      ),
    );
  }
}

// Domain Events
export class BatchQuantityUpdatedEvent extends DomainEvent {
  constructor(
    public readonly batchId: string,
    public readonly sku: string,
    public readonly oldQuantity: number,
    public readonly newQuantity: number,
    public readonly tenantId: string,
    public readonly version: number,
  ) {
    super();
  }
}

export class BatchQuarantinedEvent extends DomainEvent {
  constructor(
    public readonly batchId: string,
    public readonly sku: string,
    public readonly reason: string,
    public readonly tenantId: string,
    public readonly version: number,
  ) {
    super();
  }
}

export class BatchReleasedFromQuarantineEvent extends DomainEvent {
  constructor(
    public readonly batchId: string,
    public readonly sku: string,
    public readonly tenantId: string,
    public readonly version: number,
  ) {
    super();
  }
}

export class BatchConsumedEvent extends DomainEvent {
  constructor(
    public readonly batchId: string,
    public readonly sku: string,
    public readonly consumedQuantity: number,
    public readonly remainingQuantity: number,
    public readonly tenantId: string,
    public readonly version: number,
  ) {
    super();
  }
}

export class BatchRecalledEvent extends DomainEvent {
  constructor(
    public readonly batchId: string,
    public readonly sku: string,
    public readonly reason: string,
    public readonly tenantId: string,
    public readonly version: number,
  ) {
    super();
  }
}
```

#### **2.2 Enhanced Batch Tracking Service**

**File**: `packages/inventory/src/services/batch-tracking.service.ts` (Update existing)

```typescript
import { Injectable, Logger } from '@nestjs/common';
import type { EventStore } from '../infrastructure/event-store/event-store';
import { Batch, BatchStatus, QualityStatus } from '../domain/batch';

@Injectable()
export class BatchTrackingService {
  private readonly logger = new Logger(BatchTrackingService.name);

  constructor(private readonly _eventStore: EventStore) {}

  // ... existing methods ...

  async loadBatch(batchId: string, tenantId: string): Promise<Batch> {
    this.logger.log(`Loading batch: ${batchId}`);

    const events = await this._eventStore.getEvents(`batch-${batchId}`);

    if (events.length === 0) {
      throw new Error(`Batch ${batchId} not found`);
    }

    // Rebuild batch from events
    // This would be implemented based on the event store structure
    // For now, return a mock batch
    return new Batch(
      batchId,
      'MOCK-SKU',
      'MOCK-BATCH',
      new Date(),
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      100,
      'WAREHOUSE-A',
      tenantId,
    );
  }

  async loadBatchesBySku(sku: string, tenantId: string): Promise<Batch[]> {
    this.logger.log(`Loading batches for SKU: ${sku}`);

    // Implementation would query batch projections by SKU
    // For now, return empty array
    return [];
  }

  async loadSerialNumbersByBatch(batchId: string, tenantId: string): Promise<SerialNumber[]> {
    this.logger.log(`Loading serial numbers for batch: ${batchId}`);

    // Implementation would query serial number projections by batch
    // For now, return empty array
    return [];
  }

  async getExpiringBatches(
    daysAhead: number,
    tenantId: string,
  ): Promise<
    Array<{
      batchId: string;
      sku: string;
      batchNumber: string;
      expiryDate: Date;
      daysToExpiry: number;
      quantity: number;
      location: string;
      status: BatchStatus;
    }>
  > {
    this.logger.log(`Getting batches expiring within ${daysAhead} days`);

    const batches = await this.getAllBatches(tenantId);
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysAhead);

    return batches
      .filter((batch) => batch._expiryDate <= targetDate && !batch.isExpired())
      .map((batch) => ({
        batchId: batch._batchId,
        sku: batch._sku,
        batchNumber: batch._batchNumber,
        expiryDate: batch._expiryDate,
        daysToExpiry: batch.getDaysToExpiry(),
        quantity: batch._quantity,
        location: batch._location,
        status: batch._status,
      }));
  }

  async quarantineBatch(batchId: string, reason: string, tenantId: string): Promise<void> {
    this.logger.log(`Quarantining batch: ${batchId}, Reason: ${reason}`);

    const batch = await this.loadBatch(batchId, tenantId);
    batch.quarantineBatch(reason);

    await this._eventStore.append(
      `batch-${batchId}`,
      batch.getUncommittedEvents(),
      batch.getVersion(),
    );

    batch.markEventsAsCommitted();
    this.logger.log(`Batch quarantined: ${batchId}`);
  }

  async releaseBatchFromQuarantine(batchId: string, tenantId: string): Promise<void> {
    this.logger.log(`Releasing batch from quarantine: ${batchId}`);

    const batch = await this.loadBatch(batchId, tenantId);
    batch.releaseFromQuarantine();

    await this._eventStore.append(
      `batch-${batchId}`,
      batch.getUncommittedEvents(),
      batch.getVersion(),
    );

    batch.markEventsAsCommitted();
    this.logger.log(`Batch released from quarantine: ${batchId}`);
  }

  async recallBatch(batchId: string, reason: string, tenantId: string): Promise<void> {
    this.logger.log(`Recalling batch: ${batchId}, Reason: ${reason}`);

    const batch = await this.loadBatch(batchId, tenantId);
    batch.recallBatch(reason);

    await this._eventStore.append(
      `batch-${batchId}`,
      batch.getUncommittedEvents(),
      batch.getVersion(),
    );

    batch.markEventsAsCommitted();
    this.logger.log(`Batch recalled: ${batchId}`);
  }

  async getBatchTraceability(
    batchId: string,
    tenantId: string,
  ): Promise<{
    batch: BatchData;
    movements: Array<{
      movementId: string;
      quantity: number;
      movementType: string;
      timestamp: Date;
      reference: string;
    }>;
    serialNumbers: Array<{
      serialNumber: string;
      status: string;
      location: string;
    }>;
  }> {
    this.logger.log(`Getting traceability for batch: ${batchId}`);

    const batch = await this.loadBatch(batchId, tenantId);

    // Implementation would query movement and serial number projections
    return {
      batch: {
        batchId: batch._batchId,
        sku: batch._sku,
        batchNumber: batch._batchNumber,
        manufacturingDate: batch._manufacturingDate,
        expiryDate: batch._expiryDate,
        quantity: batch._quantity,
        location: batch._location,
        status: batch._status,
        qualityStatus: batch._qualityStatus,
        tenantId: batch._tenantId,
      },
      movements: [],
      serialNumbers: [],
    };
  }
}
```

---

### **3. Complete Serial Number Management**

#### **3.1 Enhanced Serial Number Domain Model**

**File**: `packages/inventory/src/domain/serial-number.ts` (Update existing)

```typescript
import { AggregateRoot, DomainEvent } from '@aibos/eventsourcing';

export interface SerialNumberData {
  readonly serialNumber: string;
  readonly sku: string;
  readonly batchId: string;
  readonly location: string;
  readonly status: SerialNumberStatus;
  readonly tenantId: string;
  readonly createdAt: Date;
  readonly lastUpdated: Date;
}

export enum SerialNumberStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  SOLD = 'SOLD',
  QUARANTINED = 'QUARANTINED',
  DEFECTIVE = 'DEFECTIVE',
  RETURNED = 'RETURNED',
  SCRAPPED = 'SCRAPPED',
}

export class SerialNumber extends AggregateRoot {
  constructor(
    public readonly _serialNumber: string,
    public readonly _sku: string,
    public readonly _batchId: string,
    public readonly _location: string,
    public _status: SerialNumberStatus,
    public readonly _tenantId: string,
  ) {
    super();
  }

  public updateStatus(newStatus: SerialNumberStatus): void {
    if (this._status === newStatus) {
      return; // No change needed
    }

    const oldStatus = this._status;
    this._status = newStatus;

    this.addEvent(
      new SerialNumberStatusUpdatedEvent(
        this._serialNumber,
        this._sku,
        oldStatus,
        newStatus,
        this._tenantId,
        this.getVersion() + 1,
      ),
    );
  }

  public reserveSerialNumber(reservedBy: string, orderId: string): void {
    if (this._status !== SerialNumberStatus.AVAILABLE) {
      throw new Error(`Serial number ${this._serialNumber} is not available for reservation`);
    }

    this._status = SerialNumberStatus.RESERVED;

    this.addEvent(
      new SerialNumberReservedEvent(
        this._serialNumber,
        this._sku,
        reservedBy,
        orderId,
        this._tenantId,
        this.getVersion() + 1,
      ),
    );
  }

  public sellSerialNumber(soldBy: string, orderId: string): void {
    if (this._status !== SerialNumberStatus.RESERVED) {
      throw new Error(`Serial number ${this._serialNumber} must be reserved before sale`);
    }

    this._status = SerialNumberStatus.SOLD;

    this.addEvent(
      new SerialNumberSoldEvent(
        this._serialNumber,
        this._sku,
        soldBy,
        orderId,
        this._tenantId,
        this.getVersion() + 1,
      ),
    );
  }

  public quarantineSerialNumber(reason: string): void {
    if (this._status === SerialNumberStatus.SOLD) {
      throw new Error('Cannot quarantine sold serial number');
    }

    this._status = SerialNumberStatus.QUARANTINED;

    this.addEvent(
      new SerialNumberQuarantinedEvent(
        this._serialNumber,
        this._sku,
        reason,
        this._tenantId,
        this.getVersion() + 1,
      ),
    );
  }

  public returnSerialNumber(returnedBy: string, reason: string): void {
    if (this._status !== SerialNumberStatus.SOLD) {
      throw new Error('Only sold serial numbers can be returned');
    }

    this._status = SerialNumberStatus.RETURNED;

    this.addEvent(
      new SerialNumberReturnedEvent(
        this._serialNumber,
        this._sku,
        returnedBy,
        reason,
        this._tenantId,
        this.getVersion() + 1,
      ),
    );
  }

  public scrapSerialNumber(reason: string): void {
    this._status = SerialNumberStatus.SCRAPPED;

    this.addEvent(
      new SerialNumberScrappedEvent(
        this._serialNumber,
        this._sku,
        reason,
        this._tenantId,
        this.getVersion() + 1,
      ),
    );
  }
}

// Domain Events
export class SerialNumberStatusUpdatedEvent extends DomainEvent {
  constructor(
    public readonly serialNumber: string,
    public readonly sku: string,
    public readonly oldStatus: SerialNumberStatus,
    public readonly newStatus: SerialNumberStatus,
    public readonly tenantId: string,
    public readonly version: number,
  ) {
    super();
  }
}

export class SerialNumberReservedEvent extends DomainEvent {
  constructor(
    public readonly serialNumber: string,
    public readonly sku: string,
    public readonly reservedBy: string,
    public readonly orderId: string,
    public readonly tenantId: string,
    public readonly version: number,
  ) {
    super();
  }
}

export class SerialNumberSoldEvent extends DomainEvent {
  constructor(
    public readonly serialNumber: string,
    public readonly sku: string,
    public readonly soldBy: string,
    public readonly orderId: string,
    public readonly tenantId: string,
    public readonly version: number,
  ) {
    super();
  }
}

export class SerialNumberQuarantinedEvent extends DomainEvent {
  constructor(
    public readonly serialNumber: string,
    public readonly sku: string,
    public readonly reason: string,
    public readonly tenantId: string,
    public readonly version: number,
  ) {
    super();
  }
}

export class SerialNumberReturnedEvent extends DomainEvent {
  constructor(
    public readonly serialNumber: string,
    public readonly sku: string,
    public readonly returnedBy: string,
    public readonly reason: string,
    public readonly tenantId: string,
    public readonly version: number,
  ) {
    super();
  }
}

export class SerialNumberScrappedEvent extends DomainEvent {
  constructor(
    public readonly serialNumber: string,
    public readonly sku: string,
    public readonly reason: string,
    public readonly tenantId: string,
    public readonly version: number,
  ) {
    super();
  }
}
```

---

### **4. Complete Expiry Date Tracking**

#### **4.1 Expiry Tracking Service**

**File**: `packages/inventory/src/services/expiry-tracking.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import type { EventStore } from '../infrastructure/event-store/event-store';
import type { BatchTrackingService } from './batch-tracking.service';

export interface ExpiryAlert {
  readonly batchId: string;
  readonly sku: string;
  readonly batchNumber: string;
  readonly expiryDate: Date;
  readonly daysToExpiry: number;
  readonly quantity: number;
  readonly location: string;
  readonly alertLevel: 'CRITICAL' | 'WARNING' | 'INFO';
}

export interface ExpiryReport {
  readonly totalBatches: number;
  readonly expiringSoon: number;
  readonly expired: number;
  readonly totalValue: number;
  readonly alerts: ExpiryAlert[];
}

@Injectable()
export class ExpiryTrackingService {
  private readonly logger = new Logger(ExpiryTrackingService.name);

  constructor(
    private readonly _eventStore: EventStore,
    private readonly _batchTrackingService: BatchTrackingService,
  ) {}

  async getExpiryAlerts(tenantId: string, daysAhead: number = 30): Promise<ExpiryAlert[]> {
    this.logger.log(`Getting expiry alerts for ${daysAhead} days ahead`);

    const expiringBatches = await this._batchTrackingService.getExpiringBatches(
      daysAhead,
      tenantId,
    );

    return expiringBatches.map((batch) => ({
      batchId: batch.batchId,
      sku: batch.sku,
      batchNumber: batch.batchNumber,
      expiryDate: batch.expiryDate,
      daysToExpiry: batch.daysToExpiry,
      quantity: batch.quantity,
      location: batch.location,
      alertLevel: this.determineAlertLevel(batch.daysToExpiry),
    }));
  }

  async getExpiryReport(tenantId: string): Promise<ExpiryReport> {
    this.logger.log(`Generating expiry report for tenant: ${tenantId}`);

    const allBatches = await this._batchTrackingService.getAllBatches(tenantId);
    const alerts = await this.getExpiryAlerts(tenantId, 30);

    const expiringSoon = alerts.filter(
      (alert) => alert.alertLevel === 'WARNING' || alert.alertLevel === 'CRITICAL',
    ).length;
    const expired = allBatches.filter((batch) => batch.isExpired()).length;
    const totalValue = allBatches.reduce((sum, batch) => sum + batch._quantity * 10, 0); // Mock unit cost

    return {
      totalBatches: allBatches.length,
      expiringSoon,
      expired,
      totalValue,
      alerts,
    };
  }

  async getExpiredBatches(tenantId: string): Promise<
    Array<{
      batchId: string;
      sku: string;
      batchNumber: string;
      expiryDate: Date;
      daysExpired: number;
      quantity: number;
      location: string;
    }>
  > {
    this.logger.log(`Getting expired batches for tenant: ${tenantId}`);

    const allBatches = await this._batchTrackingService.getAllBatches(tenantId);
    const today = new Date();

    return allBatches
      .filter((batch) => batch.isExpired())
      .map((batch) => ({
        batchId: batch._batchId,
        sku: batch._sku,
        batchNumber: batch._batchNumber,
        expiryDate: batch._expiryDate,
        daysExpired: Math.ceil(
          (today.getTime() - batch._expiryDate.getTime()) / (1000 * 3600 * 24),
        ),
        quantity: batch._quantity,
        location: batch._location,
      }));
  }

  async getExpiringSoonBatches(
    tenantId: string,
    daysAhead: number = 30,
  ): Promise<
    Array<{
      batchId: string;
      sku: string;
      batchNumber: string;
      expiryDate: Date;
      daysToExpiry: number;
      quantity: number;
      location: string;
    }>
  > {
    this.logger.log(`Getting batches expiring within ${daysAhead} days`);

    return await this._batchTrackingService.getExpiringBatches(daysAhead, tenantId);
  }

  async scheduleExpiryNotifications(tenantId: string): Promise<void> {
    this.logger.log(`Scheduling expiry notifications for tenant: ${tenantId}`);

    const alerts = await this.getExpiryAlerts(tenantId, 30);

    for (const alert of alerts) {
      if (alert.alertLevel === 'CRITICAL') {
        await this.sendCriticalExpiryNotification(alert, tenantId);
      } else if (alert.alertLevel === 'WARNING') {
        await this.sendWarningExpiryNotification(alert, tenantId);
      }
    }
  }

  private determineAlertLevel(daysToExpiry: number): 'CRITICAL' | 'WARNING' | 'INFO' {
    if (daysToExpiry <= 7) return 'CRITICAL';
    if (daysToExpiry <= 30) return 'WARNING';
    return 'INFO';
  }

  private async sendCriticalExpiryNotification(
    alert: ExpiryAlert,
    tenantId: string,
  ): Promise<void> {
    this.logger.warn(`CRITICAL: Batch ${alert.batchNumber} expires in ${alert.daysToExpiry} days`);
    // Implementation would send email/SMS notifications
  }

  private async sendWarningExpiryNotification(alert: ExpiryAlert, tenantId: string): Promise<void> {
    this.logger.warn(`WARNING: Batch ${alert.batchNumber} expires in ${alert.daysToExpiry} days`);
    // Implementation would send email notifications
  }
}
```

---

## 🛡️ **Guardrails & Quality Assurance**

### **1. Code Quality Standards**

#### **ESLint Configuration**

```json
{
  "extends": ["@typescript-eslint/recommended", "prettier"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "prettier/prettier": "error",
    "sonarjs/no-duplicate-string": "error"
  }
}
```

#### **TypeScript Configuration**

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### **2. Testing Requirements**

#### **Unit Test Template**

```typescript
// File: packages/inventory/src/__tests__/reconciliation.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReconciliationService } from '../services/reconciliation.service';

describe('ReconciliationService', () => {
  let service: ReconciliationService;

  beforeEach(() => {
    // Setup mocks and service instance
  });

  it('should create reconciliation successfully', async () => {
    // Test implementation
  });

  it('should throw error for invalid reconciliation', async () => {
    // Test error scenarios
  });
});
```

#### **Integration Test Template**

```typescript
// File: packages/inventory/src/__tests__/integration/reconciliation-integration.test.ts
import { describe, it, expect } from 'vitest';
import { TestApp } from '../test-setup';

describe('Reconciliation Integration', () => {
  it('should complete full reconciliation workflow', async () => {
    // Integration test implementation
  });
});
```

### **3. Performance Requirements**

- **Database Queries**: All queries must use proper indexes
- **Event Processing**: Batch operations for large datasets
- **Memory Usage**: Implement pagination for large result sets
- **Response Time**: API endpoints must respond within 500ms

### **4. Security Requirements**

- **Input Validation**: All inputs must be validated
- **SQL Injection**: Use parameterized queries only
- **Authorization**: Implement proper tenant isolation
- **Audit Trail**: All operations must be logged

---

## 📋 **Implementation Checklist**

### **Phase 1: Core Infrastructure**

- [ ] Create reconciliation domain models
- [ ] Implement reconciliation service
- [ ] Create database migrations
- [ ] Add reconciliation projections
- [ ] Write unit tests

### **Phase 2: Batch Tracking Enhancement**

- [ ] Enhance batch domain model
- [ ] Implement missing batch service methods
- [ ] Add batch event handlers
- [ ] Create batch projections
- [ ] Write integration tests

### **Phase 3: Serial Number Management**

- [ ] Enhance serial number domain model
- [ ] Implement serial number service methods
- [ ] Add serial number event handlers
- [ ] Create serial number projections
- [ ] Write comprehensive tests

### **Phase 4: Expiry Date Tracking**

- [ ] Implement expiry tracking service
- [ ] Add expiry alert system
- [ ] Create expiry reporting
- [ ] Implement notification system
- [ ] Write end-to-end tests

### **Phase 5: Integration & Testing**

- [ ] Update inventory operations controller
- [ ] Add new API endpoints
- [ ] Update index exports
- [ ] Run full test suite
- [ ] Performance testing
- [ ] Security audit

---

## 🚀 **Deployment Guidelines**

### **Database Migration**

```bash
# Run migrations in order
pnpm run migration:run --package=inventory
```

### **Build Process**

```bash
# Build all packages
pnpm run build

# Build inventory package only
pnpm run build --filter=inventory
```

### **Testing**

```bash
# Run all tests
pnpm run test

# Run inventory tests only
pnpm run test --filter=inventory

# Run with coverage
pnpm run test:coverage --filter=inventory
```

### **Linting**

```bash
# Run linting
pnpm run lint

# Fix linting issues
pnpm run lint:fix
```

---

## 📊 **Success Metrics**

- **Code Coverage**: >90%
- **TypeScript Errors**: 0
- **ESLint Errors**: 0
- **Test Pass Rate**: 100%
- **Performance**: All APIs <500ms response time
- **Security**: No vulnerabilities in dependencies

This implementation guide ensures proper development practices, maintains code quality, and provides a clear path to implementing all missing inventory advanced features.
