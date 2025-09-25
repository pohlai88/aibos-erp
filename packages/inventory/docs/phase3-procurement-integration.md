# Inventory Service Phase 3: Procurement Integration Development Plan

**Cross-Reference:** AI-BOS ERP Phase 2 Detailed Planning  
**Purpose:** Comprehensive implementation plan for Procurement Integration with Inventory Service  
**Timeline:** 2 weeks (Weeks 13-14)  
**Team:** Backend Engineers (2), Frontend Engineer (1), QA Engineer (1)

---

## 🎯 **Strategic Objectives**

### **Primary Goals**

- Integrate inventory service with procurement workflows
- Enable Goods Receipt Notes (GRN) processing
- Support Purchase Order validation and tracking
- Implement vendor management integration
- Establish warehouse management system (WMS) foundation

### **Success Criteria**

- ✅ GRN processing: < 300ms response time
- ✅ Purchase Order validation: 100% accuracy
- ✅ Vendor integration: Complete inventory synchronization
- ✅ Warehouse management: Multi-location support
- ✅ Integration tests: ≥95% coverage

---

## 📋 **Development Categories**

### **Category 1: Core Integration Services** 🔗

**Priority:** HIGH | **Timeline:** Week 13

#### **1.1 Goods Receipt Notes (GRN) Integration**

**Description:** Enable inventory service to process Goods Receipt Notes from procurement system.

**Files to Create:**

- `src/integrations/procurement-integration.service.ts`
- `src/integrations/interfaces/procurement.interface.ts`
- `src/integrations/dto/goods-receipt.dto.ts`
- `src/events/goods-receipt-processed-event.ts`

**Files to Modify:**

- `src/services/inventory.service.ts` - Add GRN processing methods
- `src/controllers/inventory-operations.controller.ts` - Add GRN endpoints
- `src/projections/inventory-projection-handler.ts` - Handle GRN events
- `src/index.ts` - Export new integration services

**Code Snippets:**

```typescript
// src/integrations/interfaces/procurement.interface.ts
export interface GoodsReceiptNote {
  readonly grnId: string;
  readonly purchaseOrderId: string;
  readonly vendorId: string;
  readonly receivedDate: Date;
  readonly items: GRNItem[];
  readonly tenantId: string;
  readonly userId: string;
}

export interface GRNItem {
  readonly sku: string;
  readonly quantity: number;
  readonly unitCost: number;
  readonly batchNumber?: string;
  readonly serialNumbers?: string[];
  readonly expiryDate?: Date;
  readonly location: string;
}

// src/integrations/procurement-integration.service.ts
@Injectable()
export class ProcurementIntegrationService {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly eventStore: EventStore,
    private readonly logger: Logger,
  ) {}

  async processGoodsReceipt(grn: GoodsReceiptNote): Promise<void> {
    this.logger.log(`Processing GRN: ${grn.grnId} for PO: ${grn.purchaseOrderId}`);

    for (const item of grn.items) {
      const command: ReceiveStockCommand = {
        movementId: `grn-${grn.grnId}-${item.sku}`,
        sku: item.sku,
        quantity: item.quantity,
        unitCost: item.unitCost,
        location: item.location,
        reference: grn.purchaseOrderId,
        tenantId: grn.tenantId,
        userId: grn.userId,
        batchNumber: item.batchNumber,
        serialNumbers: item.serialNumbers,
        expiryDate: item.expiryDate,
      };

      await this.inventoryService.receiveStock(command);
    }

    // Emit GRN processed event
    await this.eventStore.append(
      `grn-${grn.grnId}`,
      [new GoodsReceiptProcessedEvent(grn.grnId, grn.purchaseOrderId, grn.tenantId)],
      0,
    );
  }

  async validatePurchaseOrder(
    poId: string,
    sku: string,
    quantity: number,
    tenantId: string,
  ): Promise<boolean> {
    // Validate against current stock levels and business rules
    const currentStock = await this.inventoryService.getCurrentStock(sku, tenantId);
    const reservedStock = await this.getReservedStock(sku, tenantId);
    const availableStock = currentStock - reservedStock;

    return availableStock >= quantity;
  }
}
```

**DoD (Definition of Done):**

- [ ] GRN processing service implemented with error handling
- [ ] Purchase Order validation logic with stock level checks
- [ ] Integration tests covering happy path and error scenarios
- [ ] API endpoints documented with OpenAPI specs
- [ ] Performance tests showing < 300ms response time
- [ ] Code review completed with security scan passed

#### **1.2 Vendor Management Integration**

**Description:** Integrate vendor data with inventory management for better procurement workflows.

**Files to Create:**

- `src/integrations/vendor-integration.service.ts`
- `src/integrations/dto/vendor-data.dto.ts`
- `src/events/vendor-inventory-updated-event.ts`

**Files to Modify:**

- `src/services/inventory.service.ts` - Add vendor-specific methods
- `src/domain/inventory-item.ts` - Add vendor information
- `src/infrastructure/database/entities/inventory-item.entity.ts` - Add vendor fields

**Code Snippets:**

```typescript
// src/integrations/dto/vendor-data.dto.ts
export interface VendorInventoryData {
  readonly vendorId: string;
  readonly sku: string;
  readonly vendorSku: string;
  readonly vendorName: string;
  readonly leadTime: number; // days
  readonly minimumOrderQuantity: number;
  readonly priceBreaks: PriceBreak[];
  readonly isActive: boolean;
  readonly tenantId: string;
}

export interface PriceBreak {
  readonly quantity: number;
  readonly unitPrice: number;
  readonly effectiveDate: Date;
}

// src/integrations/vendor-integration.service.ts
@Injectable()
export class VendorIntegrationService {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly logger: Logger,
  ) {}

  async updateVendorInventory(vendorData: VendorInventoryData): Promise<void> {
    this.logger.log(
      `Updating vendor inventory for vendor: ${vendorData.vendorId}, SKU: ${vendorData.sku}`,
    );

    // Update inventory item with vendor information
    await this.inventoryService.updateVendorInformation({
      sku: vendorData.sku,
      vendorId: vendorData.vendorId,
      vendorSku: vendorData.vendorSku,
      vendorName: vendorData.vendorName,
      leadTime: vendorData.leadTime,
      minimumOrderQuantity: vendorData.minimumOrderQuantity,
      tenantId: vendorData.tenantId,
    });
  }

  async getVendorInventory(vendorId: string, tenantId: string): Promise<VendorInventoryData[]> {
    return await this.inventoryService.getInventoryByVendor(vendorId, tenantId);
  }
}
```

**DoD (Definition of Done):**

- [ ] Vendor integration service with CRUD operations
- [ ] Vendor data synchronization with inventory items
- [ ] Lead time and MOQ tracking implemented
- [ ] Integration tests with vendor data scenarios
- [ ] Database migrations for vendor fields
- [ ] API documentation updated

---

### **Category 2: Warehouse Management System (WMS)** 📦

**Priority:** HIGH | **Timeline:** Week 13-14

#### **2.1 Multi-Location Warehouse Management**

**Description:** Enhance inventory service to support multiple warehouse locations with capacity management.

**Files to Create:**

- `src/services/warehouse-management.service.ts`
- `src/domain/warehouse.ts`
- `src/domain/location.ts`
- `src/events/warehouse-created-event.ts`
- `src/events/location-capacity-updated-event.ts`

**Files to Modify:**

- `src/services/inventory.service.ts` - Add warehouse-aware methods
- `src/infrastructure/database/entities/stock-level.entity.ts` - Add warehouse fields
- `src/projections/stock-level-projection.ts` - Handle warehouse events

**Code Snippets:**

```typescript
// src/domain/warehouse.ts
export class Warehouse extends AggregateRoot {
  constructor(
    public readonly warehouseId: string,
    public readonly warehouseName: string,
    public readonly warehouseCode: string,
    public readonly address: Address,
    public readonly tenantId: string,
    public readonly isActive: boolean = true,
  ) {
    super();
  }

  public createLocation(command: CreateLocationCommand): void {
    this.validateLocationCreation(command);

    this.addEvent(
      new LocationCreatedEvent(
        command.locationId,
        command.locationCode,
        command.locationName,
        command.capacity,
        command.locationType,
        this.warehouseId,
        this.tenantId,
        this.version + 1,
      ),
    );
  }

  private validateLocationCreation(command: CreateLocationCommand): void {
    if (!command.locationCode || command.locationCode.length < 3) {
      throw new BusinessRuleViolation('Location code must be at least 3 characters');
    }
    if (command.capacity <= 0) {
      throw new BusinessRuleViolation('Location capacity must be positive');
    }
  }
}

// src/services/warehouse-management.service.ts
@Injectable()
export class WarehouseManagementService {
  constructor(
    private readonly eventStore: EventStore,
    private readonly inventoryService: InventoryService,
    private readonly logger: Logger,
  ) {}

  async createWarehouse(command: CreateWarehouseCommand): Promise<void> {
    const warehouse = new Warehouse(
      command.warehouseId,
      command.warehouseName,
      command.warehouseCode,
      command.address,
      command.tenantId,
    );

    await this.eventStore.append(
      `warehouse-${command.warehouseId}`,
      warehouse.getUncommittedEvents(),
      warehouse.getVersion(),
    );

    warehouse.markEventsAsCommitted();
    this.logger.log(`Created warehouse: ${command.warehouseId}`);
  }

  async updateLocationCapacity(command: UpdateLocationCapacityCommand): Promise<void> {
    const warehouse = await this.loadWarehouse(command.warehouseId, command.tenantId);
    warehouse.updateLocationCapacity(command.locationId, command.newCapacity);

    await this.eventStore.append(
      `warehouse-${command.warehouseId}`,
      warehouse.getUncommittedEvents(),
      warehouse.getVersion(),
    );

    warehouse.markEventsAsCommitted();
  }

  async getLocationUtilization(
    warehouseId: string,
    tenantId: string,
  ): Promise<LocationUtilizationReport> {
    const locations = await this.getWarehouseLocations(warehouseId, tenantId);
    const stockLevels = await this.inventoryService.getAllStockLevelsForWarehouse(
      warehouseId,
      tenantId,
    );

    return locations.map((location) => ({
      locationId: location.locationId,
      locationCode: location.locationCode,
      currentCapacity: this.calculateCurrentCapacity(location, stockLevels),
      maxCapacity: location.capacity,
      utilizationPercentage:
        (this.calculateCurrentCapacity(location, stockLevels) / location.capacity) * 100,
      items: this.getItemsInLocation(location.locationId, stockLevels),
    }));
  }
}
```

**DoD (Definition of Done):**

- [ ] Warehouse domain model with location management
- [ ] Location capacity tracking and utilization reports
- [ ] Multi-location stock level management
- [ ] Warehouse creation and management workflows
- [ ] Integration tests for warehouse operations
- [ ] Database schema updates for warehouse support

#### **2.2 Advanced Location Management**

**Description:** Implement advanced location features like zoning, bin management, and location types.

**Files to Create:**

- `src/domain/location-type.ts`
- `src/domain/location-zone.ts`
- `src/services/location-management.service.ts`
- `src/events/location-zone-created-event.ts`

**Files to Modify:**

- `src/domain/location.ts` - Add zone and type support
- `src/services/warehouse-management.service.ts` - Add zone management

**Code Snippets:**

```typescript
// src/domain/location-type.ts
export enum LocationType {
  RECEIVING = 'RECEIVING',
  STORAGE = 'STORAGE',
  PICKING = 'PICKING',
  SHIPPING = 'SHIPPING',
  QUARANTINE = 'QUARANTINE',
  DAMAGED = 'DAMAGED',
}

// src/domain/location-zone.ts
export class LocationZone {
  constructor(
    public readonly zoneId: string,
    public readonly zoneName: string,
    public readonly zoneCode: string,
    public readonly warehouseId: string,
    public readonly locationType: LocationType,
    public readonly isActive: boolean = true,
  ) {}
}

// src/services/location-management.service.ts
@Injectable()
export class LocationManagementService {
  constructor(
    private readonly eventStore: EventStore,
    private readonly logger: Logger,
  ) {}

  async createLocationZone(command: CreateLocationZoneCommand): Promise<void> {
    const zone = new LocationZone(
      command.zoneId,
      command.zoneName,
      command.zoneCode,
      command.warehouseId,
      command.locationType,
    );

    await this.eventStore.append(
      `warehouse-${command.warehouseId}`,
      [new LocationZoneCreatedEvent(zone, command.tenantId)],
      0,
    );

    this.logger.log(
      `Created location zone: ${command.zoneId} in warehouse: ${command.warehouseId}`,
    );
  }

  async assignLocationToZone(command: AssignLocationToZoneCommand): Promise<void> {
    // Implementation for assigning locations to zones
    const warehouse = await this.loadWarehouse(command.warehouseId, command.tenantId);
    warehouse.assignLocationToZone(command.locationId, command.zoneId);

    await this.eventStore.append(
      `warehouse-${command.warehouseId}`,
      warehouse.getUncommittedEvents(),
      warehouse.getVersion(),
    );

    warehouse.markEventsAsCommitted();
  }
}
```

**DoD (Definition of Done):**

- [ ] Location zone management implemented
- [ ] Location type validation and constraints
- [ ] Zone-based inventory organization
- [ ] Location assignment workflows
- [ ] Integration tests for zone management
- [ ] UI components for zone visualization

---

### **Category 3: Enhanced Inventory Features** ⚡

**Priority:** MEDIUM | **Timeline:** Week 14

#### **3.1 Batch and Serial Number Management**

**Description:** Implement comprehensive batch and serial number tracking for inventory items.

**Files to Create:**

- `src/domain/batch.ts`
- `src/domain/serial-number.ts`
- `src/services/batch-tracking.service.ts`
- `src/events/batch-created-event.ts`
- `src/events/serial-number-tracked-event.ts`

**Files to Modify:**

- `src/domain/stock-movement.ts` - Add batch/serial support
- `src/services/inventory.service.ts` - Add batch tracking methods
- `src/infrastructure/database/entities/stock-movement.entity.ts` - Add batch fields

**Code Snippets:**

```typescript
// src/domain/batch.ts
export class Batch extends AggregateRoot {
  constructor(
    public readonly batchId: string,
    public readonly sku: string,
    public readonly batchNumber: string,
    public readonly manufacturingDate: Date,
    public readonly expiryDate: Date,
    public readonly quantity: number,
    public readonly location: string,
    public readonly tenantId: string,
  ) {
    super();
  }

  public updateQuantity(newQuantity: number): void {
    if (newQuantity < 0) {
      throw new BusinessRuleViolation('Batch quantity cannot be negative');
    }

    this.addEvent(
      new BatchQuantityUpdatedEvent(
        this.batchId,
        this.quantity,
        newQuantity,
        this.tenantId,
        this.version + 1,
      ),
    );
  }

  public isExpired(): boolean {
    return new Date() > this.expiryDate;
  }

  public getDaysToExpiry(): number {
    const today = new Date();
    const timeDiff = this.expiryDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }
}

// src/services/batch-tracking.service.ts
@Injectable()
export class BatchTrackingService {
  constructor(
    private readonly eventStore: EventStore,
    private readonly logger: Logger,
  ) {}

  async createBatch(command: CreateBatchCommand): Promise<void> {
    const batch = new Batch(
      command.batchId,
      command.sku,
      command.batchNumber,
      command.manufacturingDate,
      command.expiryDate,
      command.quantity,
      command.location,
      command.tenantId,
    );

    await this.eventStore.append(
      `batch-${command.batchId}`,
      batch.getUncommittedEvents(),
      batch.getVersion(),
    );

    batch.markEventsAsCommitted();
    this.logger.log(`Created batch: ${command.batchNumber} for SKU: ${command.sku}`);
  }

  async getExpiringItems(daysAhead: number, tenantId: string): Promise<ExpiringItem[]> {
    const batches = await this.getAllBatches(tenantId);
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysAhead);

    return batches
      .filter((batch) => batch.expiryDate <= targetDate && !batch.isExpired())
      .map((batch) => ({
        batchId: batch.batchId,
        sku: batch.sku,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        daysToExpiry: batch.getDaysToExpiry(),
        quantity: batch.quantity,
        location: batch.location,
      }));
  }

  async trackSerialNumber(command: TrackSerialNumberCommand): Promise<void> {
    // Implementation for serial number tracking
    const serialNumber = new SerialNumber(
      command.serialNumber,
      command.sku,
      command.batchId,
      command.location,
      command.status,
      command.tenantId,
    );

    await this.eventStore.append(
      `serial-${command.serialNumber}`,
      serialNumber.getUncommittedEvents(),
      serialNumber.getVersion(),
    );

    serialNumber.markEventsAsCommitted();
  }
}
```

**DoD (Definition of Done):**

- [ ] Batch creation and management workflows
- [ ] Serial number tracking implementation
- [ ] Expiry date monitoring and alerts
- [ ] Batch-based inventory reporting
- [ ] Integration tests for batch operations
- [ ] Database schema for batch/serial tracking

#### **3.2 Stock Reservation Management**

**Description:** Implement stock reservation system for order management integration.

**Files to Create:**

- `src/domain/stock-reservation.ts`
- `src/services/reservation-management.service.ts`
- `src/events/stock-reserved-event.ts`
- `src/events/reservation-released-event.ts`

**Files to Modify:**

- `src/services/inventory.service.ts` - Add reservation methods
- `src/domain/inventory-item.ts` - Add reserved stock tracking

**Code Snippets:**

```typescript
// src/domain/stock-reservation.ts
export class StockReservation extends AggregateRoot {
  constructor(
    public readonly reservationId: string,
    public readonly sku: string,
    public readonly quantity: number,
    public readonly location: string,
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly reservedUntil: Date,
    public readonly tenantId: string,
  ) {
    super();
  }

  public releaseReservation(): void {
    this.addEvent(
      new ReservationReleasedEvent(
        this.reservationId,
        this.sku,
        this.quantity,
        this.location,
        this.tenantId,
        this.version + 1,
      ),
    );
  }

  public isExpired(): boolean {
    return new Date() > this.reservedUntil;
  }
}

// src/services/reservation-management.service.ts
@Injectable()
export class ReservationManagementService {
  constructor(
    private readonly eventStore: EventStore,
    private readonly inventoryService: InventoryService,
    private readonly logger: Logger,
  ) {}

  async reserveStock(command: ReserveStockCommand): Promise<void> {
    // Validate available stock
    const availableStock = await this.inventoryService.getAvailableStock(
      command.sku,
      command.location,
      command.tenantId,
    );

    if (availableStock < command.quantity) {
      throw new InsufficientStockError(
        `Insufficient stock for reservation. Available: ${availableStock}, Required: ${command.quantity}`,
      );
    }

    const reservation = new StockReservation(
      command.reservationId,
      command.sku,
      command.quantity,
      command.location,
      command.orderId,
      command.customerId,
      command.reservedUntil,
      command.tenantId,
    );

    await this.eventStore.append(
      `reservation-${command.reservationId}`,
      reservation.getUncommittedEvents(),
      reservation.getVersion(),
    );

    reservation.markEventsAsCommitted();
    this.logger.log(
      `Reserved ${command.quantity} units of ${command.sku} for order ${command.orderId}`,
    );
  }

  async releaseReservation(reservationId: string, tenantId: string): Promise<void> {
    const reservation = await this.loadReservation(reservationId, tenantId);
    reservation.releaseReservation();

    await this.eventStore.append(
      `reservation-${reservationId}`,
      reservation.getUncommittedEvents(),
      reservation.getVersion(),
    );

    reservation.markEventsAsCommitted();
  }

  async getReservedStock(sku: string, location: string, tenantId: string): Promise<number> {
    const reservations = await this.getActiveReservations(sku, location, tenantId);
    return reservations.reduce((total, reservation) => total + reservation.quantity, 0);
  }
}
```

**DoD (Definition of Done):**

- [ ] Stock reservation system implemented
- [ ] Reservation expiry management
- [ ] Available stock calculation with reservations
- [ ] Reservation release workflows
- [ ] Integration tests for reservation scenarios
- [ ] Performance tests for reservation operations

---

## 🔒 **Anti-Drift Guardrails Applied**

### **Code Quality Guardrails**

- **Contract-First Development:** All integration interfaces defined in `@aibos/contracts`
- **Type Safety:** Strict TypeScript with no `any` types
- **Error Handling:** Comprehensive error handling with proper logging
- **Validation:** Input validation for all integration endpoints

### **Architecture Guardrails**

- **Event Sourcing:** All state changes through events
- **Idempotency:** All integration operations idempotent
- **Audit Trail:** Complete audit trail for all operations
- **Performance:** Response times < 300ms for all operations

### **Testing Guardrails**

- **Test Coverage:** ≥95% test coverage for all new code
- **Integration Tests:** End-to-end integration tests required
- **Performance Tests:** Load testing for all integration endpoints
- **Contract Tests:** Pact contracts for all external integrations

---

## 📊 **Success Metrics**

### **Performance Metrics**

- GRN processing: < 300ms
- Purchase Order validation: < 200ms
- Warehouse operations: < 500ms
- Batch tracking: < 100ms

### **Quality Metrics**

- Test coverage: ≥95%
- Code review: 100% reviewed
- Security scan: 0 critical issues
- Performance tests: All benchmarks met

### **Business Metrics**

- Integration accuracy: 100%
- Data consistency: 100%
- System availability: 99.9%
- User satisfaction: ≥4.5/5

---

## 🎯 **Phase 3 Gate Review**

### **Review Criteria**

- ✅ Procurement integration operational
- ✅ Warehouse management system functional
- ✅ Enhanced inventory features implemented
- ✅ Performance benchmarks met
- ✅ Integration tests passing
- ✅ Anti-drift guardrails enforced

### **Go/No-Go Decision**

**Go Criteria:** Inventory service ready for CRM and Order Management integration  
**No-Go Criteria:** Integration issues, performance problems, or quality concerns

---

## 🚀 **Next Steps Preparation**

### **Prerequisites for Phase 3 Continuation**

- Procurement integration validated with real data
- Warehouse management system operational
- Enhanced inventory features tested
- Performance monitoring operational
- Integration documentation complete

### **Phase 3 Continuation Readiness Checklist**

- [ ] Procurement workflows tested end-to-end
- [ ] Warehouse management validated
- [ ] Batch tracking operational
- [ ] Stock reservation system functional
- [ ] Integration APIs documented
- [ ] Performance benchmarks established
- [ ] Business stakeholder approval received

This comprehensive development plan ensures the inventory service is ready for Phase 3 commercial operations with robust procurement integration and enhanced warehouse management capabilities.
