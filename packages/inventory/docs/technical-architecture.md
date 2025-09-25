# Inventory Advanced Features - Technical Architecture

## 🏗️ **System Architecture Overview**

This document outlines the technical architecture for implementing the missing inventory advanced features. The architecture follows Domain-Driven Design (DDD) principles, Event Sourcing patterns, and clean monorepo structure.

## 📐 **Architecture Diagram**

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Layer                                │
├─────────────────────────────────────────────────────────────────┤
│  Inventory Operations Controller                                 │
│  ├── Reconciliation Endpoints                                   │
│  ├── Batch Management Endpoints                                 │
│  ├── Serial Number Endpoints                                    │
│  └── Expiry Tracking Endpoints                                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer                              │
├─────────────────────────────────────────────────────────────────┤
│  Reconciliation Service    │  Batch Tracking Service             │
│  Serial Number Service     │  Expiry Tracking Service           │
│  Notification Service      │  Reporting Service                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Domain Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  Reconciliation Aggregate │  Batch Aggregate                    │
│  Serial Number Aggregate   │  Expiry Alert Aggregate            │
│  Domain Events            │  Value Objects                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                          │
├─────────────────────────────────────────────────────────────────┤
│  Event Store (PostgreSQL) │  Projections                       │
│  Database Repositories    │  Notification Services             │
│  External Integrations    │  Monitoring & Logging              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ **Technology Stack**

### **Core Technologies**

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.0+
- **Framework**: NestJS 10.0+
- **Database**: PostgreSQL 15+
- **Event Store**: Custom PostgreSQL-based implementation
- **Testing**: Vitest + Supertest
- **Build**: tsup (ESM/CJS)

### **Dependencies**

#### **Production Dependencies**

```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@aibos/eventsourcing": "^1.0.0",
    "pg": "^8.11.0",
    "uuid": "^9.0.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "nodemailer": "^6.9.0",
    "twilio": "^4.19.0",
    "cron": "^3.1.0",
    "rxjs": "^7.8.0"
  }
}
```

#### **Development Dependencies**

```json
{
  "devDependencies": {
    "@types/pg": "^8.10.0",
    "@types/uuid": "^9.0.0",
    "@types/nodemailer": "^6.4.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "vitest": "^1.0.0",
    "supertest": "^6.3.0",
    "tsup": "^7.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

## 🏛️ **Domain Architecture**

### **Aggregate Design**

#### **Reconciliation Aggregate**

```typescript
export class Reconciliation extends AggregateRoot {
  // Core Properties
  private readonly _reconciliationId: string;
  private readonly _sku: string;
  private readonly _location: string;
  private readonly _systemQuantity: number;
  private readonly _physicalQuantity: number;
  private readonly _reconciliationType: ReconciliationType;
  private readonly _reconciledBy: string;
  private readonly _tenantId: string;
  private _status: ReconciliationStatus;
  private readonly _notes?: string;

  // Business Methods
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
    this.addEvent(new ReconciliationStartedEvent(/* ... */));
  }

  public completeReconciliation(notes?: string): void {
    if (this._status !== ReconciliationStatus.IN_PROGRESS) {
      throw new Error('Reconciliation must be in progress to complete');
    }
    this._status = ReconciliationStatus.COMPLETED;
    this.addEvent(new ReconciliationCompletedEvent(/* ... */));
  }
}
```

#### **Batch Aggregate**

```typescript
export class Batch extends AggregateRoot {
  // Core Properties
  private readonly _batchId: string;
  private readonly _sku: string;
  private readonly _batchNumber: string;
  private readonly _manufacturingDate: Date;
  private readonly _expiryDate: Date;
  private _quantity: number;
  private readonly _location: string;
  private readonly _tenantId: string;
  private _status: BatchStatus;
  private _qualityStatus: QualityStatus;

  // Business Methods
  public isExpired(): boolean {
    return new Date() > this._expiryDate;
  }

  public getDaysToExpiry(): number {
    const today = new Date();
    const timeDiff = this._expiryDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  public quarantineBatch(reason: string): void {
    if (this._status !== BatchStatus.ACTIVE) {
      throw new Error('Only active batches can be quarantined');
    }
    this._status = BatchStatus.QUARANTINED;
    this._qualityStatus = QualityStatus.QUARANTINED;
    this.addEvent(new BatchQuarantinedEvent(/* ... */));
  }

  public consumeQuantity(quantity: number): void {
    if (quantity > this._quantity) {
      throw new Error('Insufficient batch quantity');
    }
    this._quantity -= quantity;
    if (this._quantity === 0) {
      this._status = BatchStatus.CONSUMED;
    }
    this.addEvent(new BatchConsumedEvent(/* ... */));
  }
}
```

#### **Serial Number Aggregate**

```typescript
export class SerialNumber extends AggregateRoot {
  // Core Properties
  private readonly _serialNumber: string;
  private readonly _sku: string;
  private readonly _batchId: string;
  private readonly _location: string;
  private _status: SerialNumberStatus;
  private readonly _tenantId: string;

  // Business Methods
  public reserveSerialNumber(reservedBy: string, orderId: string): void {
    if (this._status !== SerialNumberStatus.AVAILABLE) {
      throw new Error(`Serial number ${this._serialNumber} is not available for reservation`);
    }
    this._status = SerialNumberStatus.RESERVED;
    this.addEvent(new SerialNumberReservedEvent(/* ... */));
  }

  public sellSerialNumber(soldBy: string, orderId: string): void {
    if (this._status !== SerialNumberStatus.RESERVED) {
      throw new Error(`Serial number ${this._serialNumber} must be reserved before sale`);
    }
    this._status = SerialNumberStatus.SOLD;
    this.addEvent(new SerialNumberSoldEvent(/* ... */));
  }

  public returnSerialNumber(returnedBy: string, reason: string): void {
    if (this._status !== SerialNumberStatus.SOLD) {
      throw new Error('Only sold serial numbers can be returned');
    }
    this._status = SerialNumberStatus.RETURNED;
    this.addEvent(new SerialNumberReturnedEvent(/* ... */));
  }
}
```

---

## 🔄 **Event Sourcing Architecture**

### **Event Store Implementation**

#### **Event Structure**

```typescript
export interface DomainEvent {
  readonly id: string;
  readonly aggregateId: string;
  readonly eventType: string;
  readonly occurredAt: Date;
  readonly version: number;
  readonly tenantId: string;
  readonly data: Record<string, unknown>;
  readonly metadata?: Record<string, unknown>;
}
```

#### **Event Store Interface**

```typescript
export interface EventStore {
  append(streamId: string, events: DomainEvent[], expectedVersion: number): Promise<void>;
  getEvents(streamId: string, fromVersion?: number): Promise<DomainEvent[]>;
  getEventsByType(eventType: string, tenantId: string): Promise<DomainEvent[]>;
  createSnapshot(aggregateId: string, version: number, data: unknown): Promise<void>;
  getSnapshot(aggregateId: string): Promise<{ version: number; data: unknown } | null>;
  getStreamVersion(streamId: string): Promise<number>;
  streamExists(streamId: string): Promise<boolean>;
  deleteStream(streamId: string): Promise<void>;
  close(): Promise<void>;
}
```

#### **PostgreSQL Event Store**

```typescript
export class PostgreSQLEventStore implements EventStore {
  constructor(private readonly connection: Pool) {}

  async append(streamId: string, events: DomainEvent[], expectedVersion: number): Promise<void> {
    const client = await this.connection.connect();
    try {
      await client.query('BEGIN');

      // Check current version
      const currentVersion = await this.getStreamVersion(streamId);
      if (currentVersion !== expectedVersion) {
        throw new ConcurrencyError(`Expected version ${expectedVersion}, got ${currentVersion}`);
      }

      // Insert events
      for (const event of events) {
        await client.query(
          'INSERT INTO inv_event (id, stream_id, version, event_type, event_data, metadata, tenant_id, created_at, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          [
            event.id,
            streamId,
            event.version,
            event.eventType,
            JSON.stringify(event.data),
            JSON.stringify(event.metadata || {}),
            event.tenantId,
            event.occurredAt,
            'system',
          ],
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getEvents(streamId: string, fromVersion: number = 0): Promise<DomainEvent[]> {
    const result = await this.connection.query(
      'SELECT * FROM inv_event WHERE stream_id = $1 AND version >= $2 ORDER BY version ASC',
      [streamId, fromVersion],
    );

    return result.rows.map(this.deserializeEvent);
  }

  private deserializeEvent(row: any): DomainEvent {
    return {
      id: row.id,
      aggregateId: row.stream_id,
      eventType: row.event_type,
      occurredAt: row.created_at,
      version: row.version,
      tenantId: row.tenant_id,
      data: JSON.parse(row.event_data),
      metadata: JSON.parse(row.metadata || '{}'),
    };
  }
}
```

---

## 🗄️ **Database Schema**

### **Core Tables**

#### **Reconciliation Tables**

```sql
-- Reconciliations table
CREATE TABLE reconciliations (
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

-- Reconciliation history for audit trail
CREATE TABLE reconciliation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reconciliation_id VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    performed_by VARCHAR(255) NOT NULL,
    notes TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tenant_id VARCHAR(255) NOT NULL
);
```

#### **Batch Tables**

```sql
-- Batches table
CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id VARCHAR(255) NOT NULL UNIQUE,
    sku VARCHAR(255) NOT NULL,
    batch_number VARCHAR(255) NOT NULL,
    manufacturing_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    location VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    quality_status VARCHAR(50) NOT NULL,
    tenant_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Batch movements for traceability
CREATE TABLE batch_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id VARCHAR(255) NOT NULL,
    movement_id VARCHAR(255) NOT NULL,
    quantity_change DECIMAL(10,2) NOT NULL,
    movement_type VARCHAR(50) NOT NULL,
    reference VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tenant_id VARCHAR(255) NOT NULL
);
```

#### **Serial Number Tables**

```sql
-- Serial numbers table
CREATE TABLE serial_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number VARCHAR(255) NOT NULL UNIQUE,
    sku VARCHAR(255) NOT NULL,
    batch_id VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    tenant_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Serial number history for traceability
CREATE TABLE serial_number_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    performed_by VARCHAR(255) NOT NULL,
    reference VARCHAR(255),
    notes TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tenant_id VARCHAR(255) NOT NULL
);
```

### **Indexes and Constraints**

```sql
-- Performance indexes
CREATE INDEX idx_reconciliations_sku_tenant ON reconciliations(sku, tenant_id);
CREATE INDEX idx_reconciliations_status_tenant ON reconciliations(status, tenant_id);
CREATE INDEX idx_batches_sku_tenant ON batches(sku, tenant_id);
CREATE INDEX idx_batches_expiry_date ON batches(expiry_date);
CREATE INDEX idx_serial_numbers_batch_id ON serial_numbers(batch_id);
CREATE INDEX idx_serial_numbers_status ON serial_numbers(status);

-- Constraints
ALTER TABLE reconciliations ADD CONSTRAINT chk_reconciliation_status
    CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'APPROVED', 'REJECTED'));
ALTER TABLE batches ADD CONSTRAINT chk_batch_status
    CHECK (status IN ('ACTIVE', 'QUARANTINED', 'EXPIRED', 'CONSUMED', 'RECALLED'));
ALTER TABLE serial_numbers ADD CONSTRAINT chk_serial_status
    CHECK (status IN ('AVAILABLE', 'RESERVED', 'SOLD', 'QUARANTINED', 'DEFECTIVE', 'RETURNED', 'SCRAPPED'));
```

---

## 🔧 **Service Layer Architecture**

### **Service Dependencies**

#### **Reconciliation Service**

```typescript
@Injectable()
export class ReconciliationService {
  constructor(
    private readonly _eventStore: EventStore,
    private readonly _inventoryService: InventoryService,
    private readonly _logger: Logger,
  ) {}

  async createReconciliation(command: CreateReconciliationCommand): Promise<void> {
    // Implementation
  }

  async completeReconciliation(command: CompleteReconciliationCommand): Promise<void> {
    // Implementation
  }

  async approveReconciliation(
    reconciliationId: string,
    approvedBy: string,
    tenantId: string,
  ): Promise<void> {
    // Implementation
  }
}
```

#### **Batch Tracking Service**

```typescript
@Injectable()
export class BatchTrackingService {
  constructor(
    private readonly _eventStore: EventStore,
    private readonly _logger: Logger,
  ) {}

  async loadBatch(batchId: string, tenantId: string): Promise<Batch> {
    // Implementation
  }

  async quarantineBatch(batchId: string, reason: string, tenantId: string): Promise<void> {
    // Implementation
  }

  async getBatchTraceability(batchId: string, tenantId: string): Promise<BatchTraceabilityReport> {
    // Implementation
  }
}
```

#### **Serial Number Management Service**

```typescript
@Injectable()
export class SerialNumberManagementService {
  constructor(
    private readonly _eventStore: EventStore,
    private readonly _logger: Logger,
  ) {}

  async trackSerialNumber(command: TrackSerialNumberCommand): Promise<void> {
    // Implementation
  }

  async reserveSerialNumber(command: ReserveSerialNumberCommand): Promise<void> {
    // Implementation
  }

  async sellSerialNumber(command: SellSerialNumberCommand): Promise<void> {
    // Implementation
  }
}
```

#### **Expiry Tracking Service**

```typescript
@Injectable()
export class ExpiryTrackingService {
  constructor(
    private readonly _eventStore: EventStore,
    private readonly _batchTrackingService: BatchTrackingService,
    private readonly _notificationService: NotificationService,
    private readonly _logger: Logger,
  ) {}

  async getExpiryAlerts(tenantId: string, daysAhead: number = 30): Promise<ExpiryAlert[]> {
    // Implementation
  }

  async scheduleExpiryNotifications(tenantId: string): Promise<void> {
    // Implementation
  }
}
```

---

## 📊 **Projection Architecture**

### **Projection Handlers**

#### **Reconciliation Projection Handler**

```typescript
@Injectable()
export class ReconciliationProjectionHandler {
  constructor(
    private readonly _reconciliationProjectionRepository: ReconciliationProjectionRepository,
    private readonly _logger: Logger,
  ) {}

  async handleReconciliationStarted(event: ReconciliationStartedEvent): Promise<void> {
    const projection: ReconciliationProjection = {
      reconciliationId: event.reconciliationId,
      sku: event.sku,
      location: event.location,
      status: 'IN_PROGRESS',
      tenantId: event.tenantId,
      startedAt: event.occurredAt,
    };

    await this._reconciliationProjectionRepository.save(projection);
  }

  async handleReconciliationCompleted(event: ReconciliationCompletedEvent): Promise<void> {
    const projection = await this._reconciliationProjectionRepository.findByReconciliationId(
      event.reconciliationId,
      event.tenantId,
    );

    if (projection) {
      projection.status = 'COMPLETED';
      projection.variance = event.variance;
      projection.variancePercentage = event.variancePercentage;
      projection.completedAt = event.occurredAt;

      await this._reconciliationProjectionRepository.save(projection);
    }
  }
}
```

#### **Batch Projection Handler**

```typescript
@Injectable()
export class BatchProjectionHandler {
  constructor(
    private readonly _batchProjectionRepository: BatchProjectionRepository,
    private readonly _logger: Logger,
  ) {}

  async handleBatchCreated(event: BatchCreatedEvent): Promise<void> {
    const projection: BatchProjection = {
      batchId: event.batchId,
      sku: event.sku,
      batchNumber: event.batchNumber,
      manufacturingDate: event.manufacturingDate,
      expiryDate: event.expiryDate,
      quantity: event.quantity,
      location: event.location,
      status: 'ACTIVE',
      qualityStatus: 'PENDING',
      tenantId: event.tenantId,
      createdAt: event.occurredAt,
    };

    await this._batchProjectionRepository.save(projection);
  }

  async handleBatchQuarantined(event: BatchQuarantinedEvent): Promise<void> {
    const projection = await this._batchProjectionRepository.findByBatchId(
      event.batchId,
      event.tenantId,
    );

    if (projection) {
      projection.status = 'QUARANTINED';
      projection.qualityStatus = 'QUARANTINED';
      projection.quarantineReason = event.reason;
      projection.quarantinedAt = event.occurredAt;

      await this._batchProjectionRepository.save(projection);
    }
  }
}
```

---

## 🔔 **Notification Architecture**

### **Notification Service**

```typescript
@Injectable()
export class NotificationService {
  constructor(
    private readonly _emailService: EmailNotificationService,
    private readonly _smsService: SmsNotificationService,
    private readonly _logger: Logger,
  ) {}

  async sendExpiryAlert(alert: ExpiryAlert, tenantId: string): Promise<void> {
    const recipients = await this.getNotificationRecipients(tenantId, 'EXPIRY_ALERT');

    for (const recipient of recipients) {
      if (alert.alertLevel === 'CRITICAL') {
        await this._emailService.sendCriticalExpiryAlert(recipient, alert);
        await this._smsService.sendCriticalExpiryAlert(recipient, alert);
      } else if (alert.alertLevel === 'WARNING') {
        await this._emailService.sendWarningExpiryAlert(recipient, alert);
      }
    }
  }

  async sendReconciliationNotification(
    reconciliation: Reconciliation,
    tenantId: string,
  ): Promise<void> {
    const recipients = await this.getNotificationRecipients(tenantId, 'RECONCILIATION');

    for (const recipient of recipients) {
      await this._emailService.sendReconciliationNotification(recipient, reconciliation);
    }
  }

  private async getNotificationRecipients(
    tenantId: string,
    notificationType: string,
  ): Promise<NotificationRecipient[]> {
    // Implementation to get recipients based on tenant and notification type
    return [];
  }
}
```

### **Email Notification Service**

```typescript
@Injectable()
export class EmailNotificationService {
  constructor(
    private readonly _transporter: Transporter,
    private readonly _logger: Logger,
  ) {}

  async sendCriticalExpiryAlert(
    recipient: NotificationRecipient,
    alert: ExpiryAlert,
  ): Promise<void> {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: recipient.email,
      subject: `CRITICAL: Batch ${alert.batchNumber} expires in ${alert.daysToExpiry} days`,
      html: this.generateExpiryAlertEmail(alert, 'CRITICAL'),
    };

    await this._transporter.sendMail(mailOptions);
    this._logger.log(`Critical expiry alert sent to ${recipient.email}`);
  }

  private generateExpiryAlertEmail(alert: ExpiryAlert, level: string): string {
    return `
      <h2>${level} Expiry Alert</h2>
      <p>Batch ${alert.batchNumber} (SKU: ${alert.sku}) expires in ${alert.daysToExpiry} days.</p>
      <p>Location: ${alert.location}</p>
      <p>Quantity: ${alert.quantity}</p>
      <p>Please take immediate action.</p>
    `;
  }
}
```

---

## 🧪 **Testing Architecture**

### **Test Structure**

```
__tests__/
├── unit/
│   ├── domain/
│   │   ├── reconciliation.test.ts
│   │   ├── batch.test.ts
│   │   └── serial-number.test.ts
│   ├── services/
│   │   ├── reconciliation.service.test.ts
│   │   ├── batch-tracking.service.test.ts
│   │   ├── serial-number-management.service.test.ts
│   │   └── expiry-tracking.service.test.ts
│   └── infrastructure/
│       ├── event-store.test.ts
│       └── projections.test.ts
├── integration/
│   ├── reconciliation-integration.test.ts
│   ├── batch-tracking-integration.test.ts
│   ├── serial-number-integration.test.ts
│   └── expiry-tracking-integration.test.ts
└── e2e/
    ├── reconciliation-workflow.test.ts
    ├── batch-lifecycle.test.ts
    ├── serial-number-tracking.test.ts
    └── expiry-alert-system.test.ts
```

### **Test Utilities**

```typescript
export class TestEventStore implements EventStore {
  private events: Map<string, DomainEvent[]> = new Map();

  async append(streamId: string, events: DomainEvent[], expectedVersion: number): Promise<void> {
    const existingEvents = this.events.get(streamId) || [];
    if (existingEvents.length !== expectedVersion) {
      throw new ConcurrencyError(
        `Expected version ${expectedVersion}, got ${existingEvents.length}`,
      );
    }
    this.events.set(streamId, [...existingEvents, ...events]);
  }

  async getEvents(streamId: string, fromVersion: number = 0): Promise<DomainEvent[]> {
    const events = this.events.get(streamId) || [];
    return events.filter((event) => event.version >= fromVersion);
  }

  // ... other methods
}

export class TestDataBuilder {
  static createReconciliationCommand(
    overrides: Partial<CreateReconciliationCommand> = {},
  ): CreateReconciliationCommand {
    return {
      reconciliationId: 'RECON-001',
      sku: 'SKU-001',
      location: 'WAREHOUSE-A',
      reconciliationType: ReconciliationType.CYCLE_COUNT,
      reconciledBy: 'user-001',
      tenantId: 'tenant-001',
      ...overrides,
    };
  }

  static createBatchCommand(overrides: Partial<CreateBatchCommand> = {}): CreateBatchCommand {
    return {
      batchId: 'BATCH-001',
      sku: 'SKU-001',
      batchNumber: 'BATCH-001',
      manufacturingDate: new Date(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      quantity: 100,
      location: 'WAREHOUSE-A',
      tenantId: 'tenant-001',
      ...overrides,
    };
  }
}
```

---

## 📈 **Performance Considerations**

### **Database Optimization**

- **Indexes**: All foreign keys and frequently queried columns indexed
- **Partitioning**: Large tables partitioned by tenant_id
- **Connection Pooling**: PostgreSQL connection pool configured
- **Query Optimization**: All queries analyzed and optimized

### **Caching Strategy**

- **Redis**: Projection data cached for read operations
- **Memory Cache**: Frequently accessed aggregates cached
- **CDN**: Static assets served from CDN

### **Monitoring & Observability**

- **Metrics**: Prometheus metrics for all services
- **Logging**: Structured logging with correlation IDs
- **Tracing**: Distributed tracing for request flows
- **Health Checks**: Comprehensive health check endpoints

This technical architecture provides a solid foundation for implementing all missing inventory advanced features while maintaining high performance, scalability, and maintainability.
