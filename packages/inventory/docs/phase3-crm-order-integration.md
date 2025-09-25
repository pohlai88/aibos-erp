# Inventory Service Phase 3: CRM & Order Management Integration Development Plan

**Cross-Reference:** AI-BOS ERP Phase 2 Detailed Planning  
**Purpose:** Comprehensive implementation plan for CRM & Order Management Integration with Inventory Service  
**Timeline:** 2 weeks (Weeks 15-16)  
**Team:** Backend Engineers (2), Frontend Engineer (1), QA Engineer (1)

---

## 🎯 **Strategic Objectives**

### **Primary Goals**

- Integrate inventory service with Customer Relationship Management (CRM)
- Enable order management workflows with inventory allocation
- Implement customer-specific inventory views and reservations
- Support sales pipeline inventory allocation
- Establish order fulfillment tracking

### **Success Criteria**

- ✅ Order processing: < 500ms response time
- ✅ Customer inventory views: Real-time accuracy
- ✅ Order fulfillment: 100% tracking accuracy
- ✅ Sales pipeline integration: Complete inventory allocation
- ✅ Integration tests: ≥95% coverage

---

## 📋 **Development Categories**

### **Category 1: CRM Integration Services** 👥

**Priority:** HIGH | **Timeline:** Week 15

#### **1.1 Customer-Specific Inventory Management**

**Description:** Enable inventory service to provide customer-specific views and manage customer-related inventory operations.

**Files to Create:**

- `src/integrations/crm-integration.service.ts`
- `src/integrations/interfaces/crm.interface.ts`
- `src/integrations/dto/customer-inventory.dto.ts`
- `src/events/customer-inventory-updated-event.ts`
- `src/services/customer-inventory.service.ts`

**Files to Modify:**

- `src/services/inventory.service.ts` - Add customer-specific methods
- `src/controllers/inventory.controller.ts` - Add customer endpoints
- `src/projections/inventory-projection-handler.ts` - Handle customer events
- `src/index.ts` - Export CRM integration services

**Code Snippets:**

```typescript
// src/integrations/interfaces/crm.interface.ts
export interface CustomerInventoryView {
  readonly customerId: string;
  readonly customerName: string;
  readonly customerTier: CustomerTier;
  readonly inventoryItems: CustomerInventoryItem[];
  readonly totalValue: number;
  readonly lastUpdated: Date;
  readonly tenantId: string;
}

export interface CustomerInventoryItem {
  readonly sku: string;
  readonly description: string;
  readonly availableQuantity: number;
  readonly reservedQuantity: number;
  readonly unitPrice: number;
  readonly customerPrice: number;
  readonly discountPercentage: number;
  readonly leadTime: number;
  readonly location: string;
}

export enum CustomerTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

// src/integrations/crm-integration.service.ts
@Injectable()
export class CrmIntegrationService {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly customerInventoryService: CustomerInventoryService,
    private readonly eventStore: EventStore,
    private readonly logger: Logger,
  ) {}

  async getCustomerInventoryView(
    customerId: string,
    tenantId: string,
  ): Promise<CustomerInventoryView> {
    this.logger.log(`Generating inventory view for customer: ${customerId}`);

    const customer = await this.getCustomerInfo(customerId, tenantId);
    const inventoryItems = await this.customerInventoryService.getCustomerInventoryItems(
      customerId,
      tenantId,
    );

    const totalValue = inventoryItems.reduce(
      (sum, item) => sum + item.availableQuantity * item.customerPrice,
      0,
    );

    return {
      customerId,
      customerName: customer.name,
      customerTier: customer.tier,
      inventoryItems,
      totalValue,
      lastUpdated: new Date(),
      tenantId,
    };
  }

  async updateCustomerPricing(
    customerId: string,
    pricingUpdates: CustomerPricingUpdate[],
    tenantId: string,
  ): Promise<void> {
    this.logger.log(`Updating pricing for customer: ${customerId}`);

    for (const update of pricingUpdates) {
      await this.customerInventoryService.updateCustomerPricing({
        customerId,
        sku: update.sku,
        customerPrice: update.customerPrice,
        discountPercentage: update.discountPercentage,
        tenantId,
      });
    }

    // Emit customer pricing updated event
    await this.eventStore.append(
      `customer-${customerId}`,
      [new CustomerPricingUpdatedEvent(customerId, pricingUpdates, tenantId)],
      0,
    );
  }

  async getCustomerCreditImpact(
    customerId: string,
    sku: string,
    quantity: number,
    tenantId: string,
  ): Promise<CreditImpact> {
    const customer = await this.getCustomerInfo(customerId, tenantId);
    const item = await this.inventoryService.getInventoryBySku(sku, tenantId);
    const totalValue = quantity * item.unitCost;

    return {
      customerId,
      sku,
      quantity,
      totalValue,
      creditLimit: customer.creditLimit,
      currentCreditUsed: customer.currentCreditUsed,
      availableCredit: customer.creditLimit - customer.currentCreditUsed,
      creditImpact: totalValue,
      canProcessOrder: customer.currentCreditUsed + totalValue <= customer.creditLimit,
    };
  }
}
```

**DoD (Definition of Done):**

- [ ] Customer inventory view service implemented
- [ ] Customer-specific pricing management
- [ ] Credit impact calculation for orders
- [ ] Integration tests covering customer scenarios
- [ ] API endpoints documented with OpenAPI specs
- [ ] Performance tests showing < 500ms response time

#### **1.2 Sales Pipeline Inventory Allocation**

**Description:** Integrate inventory service with sales pipeline to allocate inventory for opportunities and leads.

**Files to Create:**

- `src/integrations/sales-pipeline-integration.service.ts`
- `src/domain/sales-opportunity.ts`
- `src/events/opportunity-inventory-allocated-event.ts`
- `src/services/opportunity-inventory.service.ts`

**Files to Modify:**

- `src/services/inventory.service.ts` - Add opportunity allocation methods
- `src/domain/stock-reservation.ts` - Add opportunity reservation type

**Code Snippets:**

```typescript
// src/domain/sales-opportunity.ts
export class SalesOpportunity extends AggregateRoot {
  constructor(
    public readonly opportunityId: string,
    public readonly customerId: string,
    public readonly salesRepId: string,
    public readonly stage: OpportunityStage,
    public readonly probability: number,
    public readonly expectedCloseDate: Date,
    public readonly items: OpportunityItem[],
    public readonly tenantId: string,
  ) {
    super();
  }

  public allocateInventory(): void {
    this.validateInventoryAllocation();

    for (const item of this.items) {
      this.addEvent(
        new OpportunityInventoryAllocatedEvent(
          this.opportunityId,
          item.sku,
          item.quantity,
          item.location,
          this.expectedCloseDate,
          this.tenantId,
          this.version + 1,
        ),
      );
    }
  }

  private validateInventoryAllocation(): void {
    if (this.stage === OpportunityStage.CLOSED_LOST) {
      throw new BusinessRuleViolation('Cannot allocate inventory for lost opportunities');
    }
    if (this.probability < 0.3) {
      throw new BusinessRuleViolation(
        'Cannot allocate inventory for low-probability opportunities',
      );
    }
  }
}

export enum OpportunityStage {
  LEAD = 'LEAD',
  QUALIFIED = 'QUALIFIED',
  PROPOSAL = 'PROPOSAL',
  NEGOTIATION = 'NEGOTIATION',
  CLOSED_WON = 'CLOSED_WON',
  CLOSED_LOST = 'CLOSED_LOST',
}

// src/integrations/sales-pipeline-integration.service.ts
@Injectable()
export class SalesPipelineIntegrationService {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly opportunityInventoryService: OpportunityInventoryService,
    private readonly eventStore: EventStore,
    private readonly logger: Logger,
  ) {}

  async allocateInventoryForOpportunity(opportunityId: string, tenantId: string): Promise<void> {
    this.logger.log(`Allocating inventory for opportunity: ${opportunityId}`);

    const opportunity = await this.loadOpportunity(opportunityId, tenantId);

    // Check inventory availability for all items
    for (const item of opportunity.items) {
      const availableStock = await this.inventoryService.getAvailableStock(
        item.sku,
        item.location,
        tenantId,
      );

      if (availableStock < item.quantity) {
        throw new InsufficientStockError(
          `Insufficient stock for opportunity ${opportunityId}. SKU: ${item.sku}, Available: ${availableStock}, Required: ${item.quantity}`,
        );
      }
    }

    // Allocate inventory
    opportunity.allocateInventory();

    await this.eventStore.append(
      `opportunity-${opportunityId}`,
      opportunity.getUncommittedEvents(),
      opportunity.getVersion(),
    );

    opportunity.markEventsAsCommitted();
  }

  async releaseInventoryForOpportunity(opportunityId: string, tenantId: string): Promise<void> {
    this.logger.log(`Releasing inventory for opportunity: ${opportunityId}`);

    const opportunity = await this.loadOpportunity(opportunityId, tenantId);

    // Release all allocated inventory
    for (const item of opportunity.items) {
      await this.opportunityInventoryService.releaseInventory({
        opportunityId,
        sku: item.sku,
        quantity: item.quantity,
        location: item.location,
        tenantId,
      });
    }
  }

  async getOpportunityInventoryReport(tenantId: string): Promise<OpportunityInventoryReport> {
    const opportunities = await this.getAllActiveOpportunities(tenantId);
    const totalAllocatedValue = opportunities.reduce((sum, opp) => {
      return sum + opp.items.reduce((itemSum, item) => itemSum + item.quantity * item.unitPrice, 0);
    }, 0);

    return {
      totalOpportunities: opportunities.length,
      totalAllocatedValue,
      opportunitiesByStage: this.groupOpportunitiesByStage(opportunities),
      inventoryAllocationBySku: this.getInventoryAllocationBySku(opportunities),
    };
  }
}
```

**DoD (Definition of Done):**

- [ ] Sales opportunity inventory allocation implemented
- [ ] Opportunity stage-based inventory management
- [ ] Inventory release for lost opportunities
- [ ] Sales pipeline inventory reporting
- [ ] Integration tests for opportunity scenarios
- [ ] Performance optimization for allocation queries

---

### **Category 2: Order Management Integration** 📋

**Priority:** HIGH | **Timeline:** Week 15-16

#### **2.1 Order Processing Workflows**

**Description:** Integrate inventory service with order management system for complete order-to-fulfillment workflows.

**Files to Create:**

- `src/integrations/order-management-integration.service.ts`
- `src/domain/order.ts`
- `src/domain/order-line.ts`
- `src/events/order-inventory-allocated-event.ts`
- `src/events/order-fulfillment-started-event.ts`

**Files to Modify:**

- `src/services/inventory.service.ts` - Add order processing methods
- `src/services/reservation-management.service.ts` - Add order reservations
- `src/controllers/inventory-operations.controller.ts` - Add order endpoints

**Code Snippets:**

```typescript
// src/domain/order.ts
export class Order extends AggregateRoot {
  constructor(
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly orderNumber: string,
    public readonly orderDate: Date,
    public readonly status: OrderStatus,
    public readonly lines: OrderLine[],
    public readonly shippingAddress: Address,
    public readonly tenantId: string,
  ) {
    super();
  }

  public allocateInventory(): void {
    this.validateInventoryAllocation();

    for (const line of this.lines) {
      this.addEvent(
        new OrderInventoryAllocatedEvent(
          this.orderId,
          line.sku,
          line.quantity,
          line.location,
          this.tenantId,
          this.version + 1,
        ),
      );
    }

    this.status = OrderStatus.INVENTORY_ALLOCATED;
  }

  public startFulfillment(): void {
    if (this.status !== OrderStatus.INVENTORY_ALLOCATED) {
      throw new BusinessRuleViolation('Order must have inventory allocated before fulfillment');
    }

    this.addEvent(
      new OrderFulfillmentStartedEvent(
        this.orderId,
        this.customerId,
        this.tenantId,
        this.version + 1,
      ),
    );

    this.status = OrderStatus.FULFILLMENT_IN_PROGRESS;
  }

  private validateInventoryAllocation(): void {
    if (this.status !== OrderStatus.PENDING) {
      throw new BusinessRuleViolation('Only pending orders can have inventory allocated');
    }
  }
}

export enum OrderStatus {
  PENDING = 'PENDING',
  INVENTORY_ALLOCATED = 'INVENTORY_ALLOCATED',
  FULFILLMENT_IN_PROGRESS = 'FULFILLMENT_IN_PROGRESS',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

// src/integrations/order-management-integration.service.ts
@Injectable()
export class OrderManagementIntegrationService {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly reservationManagementService: ReservationManagementService,
    private readonly eventStore: EventStore,
    private readonly logger: Logger,
  ) {}

  async processOrder(orderData: OrderData): Promise<OrderProcessingResult> {
    this.logger.log(`Processing order: ${orderData.orderId}`);

    try {
      // Validate inventory availability
      const availabilityCheck = await this.validateInventoryAvailability(orderData);
      if (!availabilityCheck.isAvailable) {
        return {
          orderId: orderData.orderId,
          status: OrderProcessingStatus.INSUFFICIENT_INVENTORY,
          unavailableItems: availabilityCheck.unavailableItems,
          message: 'Insufficient inventory for order fulfillment',
        };
      }

      // Create order aggregate
      const order = new Order(
        orderData.orderId,
        orderData.customerId,
        orderData.orderNumber,
        orderData.orderDate,
        OrderStatus.PENDING,
        orderData.lines,
        orderData.shippingAddress,
        orderData.tenantId,
      );

      // Allocate inventory
      order.allocateInventory();

      // Reserve stock
      await this.reserveStockForOrder(order);

      // Save order events
      await this.eventStore.append(
        `order-${orderData.orderId}`,
        order.getUncommittedEvents(),
        order.getVersion(),
      );

      order.markEventsAsCommitted();

      return {
        orderId: orderData.orderId,
        status: OrderProcessingStatus.SUCCESS,
        message: 'Order processed successfully',
        allocatedItems: orderData.lines,
      };
    } catch (error) {
      this.logger.error(`Error processing order ${orderData.orderId}:`, error);
      return {
        orderId: orderData.orderId,
        status: OrderProcessingStatus.ERROR,
        message: error.message,
      };
    }
  }

  async startOrderFulfillment(orderId: string, tenantId: string): Promise<void> {
    this.logger.log(`Starting fulfillment for order: ${orderId}`);

    const order = await this.loadOrder(orderId, tenantId);
    order.startFulfillment();

    await this.eventStore.append(
      `order-${orderId}`,
      order.getUncommittedEvents(),
      order.getVersion(),
    );

    order.markEventsAsCommitted();
  }

  async cancelOrder(orderId: string, tenantId: string): Promise<void> {
    this.logger.log(`Cancelling order: ${orderId}`);

    const order = await this.loadOrder(orderId, tenantId);

    // Release reserved inventory
    await this.reservationManagementService.releaseOrderReservations(orderId, tenantId);

    // Update order status
    order.cancel();

    await this.eventStore.append(
      `order-${orderId}`,
      order.getUncommittedEvents(),
      order.getVersion(),
    );

    order.markEventsAsCommitted();
  }

  private async validateInventoryAvailability(orderData: OrderData): Promise<AvailabilityCheck> {
    const unavailableItems: UnavailableItem[] = [];

    for (const line of orderData.lines) {
      const availableStock = await this.inventoryService.getAvailableStock(
        line.sku,
        line.location,
        orderData.tenantId,
      );

      if (availableStock < line.quantity) {
        unavailableItems.push({
          sku: line.sku,
          required: line.quantity,
          available: availableStock,
          shortfall: line.quantity - availableStock,
        });
      }
    }

    return {
      isAvailable: unavailableItems.length === 0,
      unavailableItems,
    };
  }

  private async reserveStockForOrder(order: Order): Promise<void> {
    for (const line of order.lines) {
      await this.reservationManagementService.reserveStock({
        reservationId: `order-${order.orderId}-${line.sku}`,
        sku: line.sku,
        quantity: line.quantity,
        location: line.location,
        orderId: order.orderId,
        customerId: order.customerId,
        reservedUntil: this.calculateReservationExpiry(order.orderDate),
        tenantId: order.tenantId,
      });
    }
  }
}
```

**DoD (Definition of Done):**

- [ ] Order processing workflow implemented
- [ ] Inventory allocation for orders
- [ ] Stock reservation for order fulfillment
- [ ] Order cancellation with inventory release
- [ ] Integration tests for order scenarios
- [ ] Performance tests for order processing

#### **2.2 Order Fulfillment Tracking**

**Description:** Implement comprehensive order fulfillment tracking with inventory consumption and shipping integration.

**Files to Create:**

- `src/services/order-fulfillment.service.ts`
- `src/domain/fulfillment.ts`
- `src/events/fulfillment-completed-event.ts`
- `src/integrations/shipping-integration.service.ts`

**Files to Modify:**

- `src/services/inventory.service.ts` - Add fulfillment methods
- `src/domain/stock-movement.ts` - Add fulfillment movement type

**Code Snippets:**

```typescript
// src/domain/fulfillment.ts
export class Fulfillment extends AggregateRoot {
  constructor(
    public readonly fulfillmentId: string,
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly status: FulfillmentStatus,
    public readonly items: FulfillmentItem[],
    public readonly shippingMethod: ShippingMethod,
    public readonly trackingNumber: string,
    public readonly tenantId: string,
  ) {
    super();
  }

  public completeFulfillment(): void {
    this.validateFulfillmentCompletion();

    for (const item of this.items) {
      this.addEvent(
        new FulfillmentCompletedEvent(
          this.fulfillmentId,
          this.orderId,
          item.sku,
          item.quantity,
          item.location,
          this.tenantId,
          this.version + 1,
        ),
      );
    }

    this.status = FulfillmentStatus.COMPLETED;
  }

  private validateFulfillmentCompletion(): void {
    if (this.status !== FulfillmentStatus.IN_PROGRESS) {
      throw new BusinessRuleViolation('Only in-progress fulfillments can be completed');
    }
  }
}

export enum FulfillmentStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
}

// src/services/order-fulfillment.service.ts
@Injectable()
export class OrderFulfillmentService {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly shippingIntegrationService: ShippingIntegrationService,
    private readonly eventStore: EventStore,
    private readonly logger: Logger,
  ) {}

  async startFulfillment(command: StartFulfillmentCommand): Promise<void> {
    this.logger.log(`Starting fulfillment for order: ${command.orderId}`);

    const fulfillment = new Fulfillment(
      command.fulfillmentId,
      command.orderId,
      command.customerId,
      FulfillmentStatus.IN_PROGRESS,
      command.items,
      command.shippingMethod,
      command.trackingNumber,
      command.tenantId,
    );

    // Consume reserved inventory
    await this.consumeReservedInventory(command);

    await this.eventStore.append(
      `fulfillment-${command.fulfillmentId}`,
      fulfillment.getUncommittedEvents(),
      fulfillment.getVersion(),
    );

    fulfillment.markEventsAsCommitted();
  }

  async completeFulfillment(fulfillmentId: string, tenantId: string): Promise<void> {
    this.logger.log(`Completing fulfillment: ${fulfillmentId}`);

    const fulfillment = await this.loadFulfillment(fulfillmentId, tenantId);
    fulfillment.completeFulfillment();

    // Update inventory with actual consumption
    await this.updateInventoryConsumption(fulfillment);

    await this.eventStore.append(
      `fulfillment-${fulfillmentId}`,
      fulfillment.getUncommittedEvents(),
      fulfillment.getVersion(),
    );

    fulfillment.markEventsAsCommitted();
  }

  async trackFulfillment(fulfillmentId: string, tenantId: string): Promise<FulfillmentTracking> {
    const fulfillment = await this.loadFulfillment(fulfillmentId, tenantId);
    const shippingInfo = await this.shippingIntegrationService.getTrackingInfo(
      fulfillment.trackingNumber,
    );

    return {
      fulfillmentId,
      orderId: fulfillment.orderId,
      status: fulfillment.status,
      trackingNumber: fulfillment.trackingNumber,
      shippingInfo,
      estimatedDelivery: shippingInfo.estimatedDelivery,
      lastUpdated: new Date(),
    };
  }

  private async consumeReservedInventory(command: StartFulfillmentCommand): Promise<void> {
    for (const item of command.items) {
      await this.inventoryService.consumeReservedStock({
        sku: item.sku,
        quantity: item.quantity,
        location: item.location,
        orderId: command.orderId,
        fulfillmentId: command.fulfillmentId,
        tenantId: command.tenantId,
      });
    }
  }

  private async updateInventoryConsumption(fulfillment: Fulfillment): Promise<void> {
    for (const item of fulfillment.items) {
      await this.inventoryService.issueStock({
        movementId: `fulfillment-${fulfillment.fulfillmentId}-${item.sku}`,
        sku: item.sku,
        quantity: item.quantity,
        location: item.location,
        reference: fulfillment.orderId,
        tenantId: fulfillment.tenantId,
        userId: 'system',
      });
    }
  }
}
```

**DoD (Definition of Done):**

- [ ] Order fulfillment workflow implemented
- [ ] Inventory consumption tracking
- [ ] Shipping integration for tracking
- [ ] Fulfillment status management
- [ ] Integration tests for fulfillment scenarios
- [ ] Performance optimization for fulfillment operations

---

### **Category 3: Advanced Order Features** ⚡

**Priority:** MEDIUM | **Timeline:** Week 16

#### **3.1 Backorder Management**

**Description:** Implement backorder management system for handling orders when inventory is insufficient.

**Files to Create:**

- `src/domain/backorder.ts`
- `src/services/backorder-management.service.ts`
- `src/events/backorder-created-event.ts`
- `src/events/backorder-fulfilled-event.ts`

**Files to Modify:**

- `src/services/inventory.service.ts` - Add backorder methods
- `src/integrations/order-management-integration.service.ts` - Add backorder handling

**Code Snippets:**

```typescript
// src/domain/backorder.ts
export class Backorder extends AggregateRoot {
  constructor(
    public readonly backorderId: string,
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly items: BackorderItem[],
    public readonly priority: BackorderPriority,
    public readonly createdDate: Date,
    public readonly expectedFulfillmentDate: Date,
    public readonly status: BackorderStatus,
    public readonly tenantId: string,
  ) {
    super();
  }

  public fulfillBackorder(): void {
    this.validateBackorderFulfillment();

    this.addEvent(
      new BackorderFulfilledEvent(
        this.backorderId,
        this.orderId,
        this.customerId,
        this.tenantId,
        this.version + 1,
      ),
    );

    this.status = BackorderStatus.FULFILLED;
  }

  private validateBackorderFulfillment(): void {
    if (this.status !== BackorderStatus.PENDING) {
      throw new BusinessRuleViolation('Only pending backorders can be fulfilled');
    }
  }
}

export enum BackorderPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// src/services/backorder-management.service.ts
@Injectable()
export class BackorderManagementService {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly eventStore: EventStore,
    private readonly logger: Logger,
  ) {}

  async createBackorder(command: CreateBackorderCommand): Promise<void> {
    this.logger.log(`Creating backorder for order: ${command.orderId}`);

    const backorder = new Backorder(
      command.backorderId,
      command.orderId,
      command.customerId,
      command.items,
      command.priority,
      command.createdDate,
      command.expectedFulfillmentDate,
      BackorderStatus.PENDING,
      command.tenantId,
    );

    await this.eventStore.append(
      `backorder-${command.backorderId}`,
      backorder.getUncommittedEvents(),
      backorder.getVersion(),
    );

    backorder.markEventsAsCommitted();
  }

  async processBackorders(tenantId: string): Promise<BackorderProcessingResult> {
    this.logger.log('Processing pending backorders');

    const pendingBackorders = await this.getPendingBackorders(tenantId);
    const fulfilledBackorders: string[] = [];
    const stillPendingBackorders: string[] = [];

    for (const backorder of pendingBackorders) {
      const canFulfill = await this.canFulfillBackorder(backorder);

      if (canFulfill) {
        await this.fulfillBackorder(backorder);
        fulfilledBackorders.push(backorder.backorderId);
      } else {
        stillPendingBackorders.push(backorder.backorderId);
      }
    }

    return {
      processedCount: pendingBackorders.length,
      fulfilledCount: fulfilledBackorders.length,
      stillPendingCount: stillPendingBackorders.length,
      fulfilledBackorders,
      stillPendingBackorders,
    };
  }

  async getBackorderReport(tenantId: string): Promise<BackorderReport> {
    const backorders = await this.getAllBackorders(tenantId);
    const totalBackorderValue = backorders.reduce((sum, backorder) => {
      return (
        sum + backorder.items.reduce((itemSum, item) => itemSum + item.quantity * item.unitPrice, 0)
      );
    }, 0);

    return {
      totalBackorders: backorders.length,
      totalValue: totalBackorderValue,
      backordersByPriority: this.groupBackordersByPriority(backorders),
      backordersByStatus: this.groupBackordersByStatus(backorders),
      averageFulfillmentTime: this.calculateAverageFulfillmentTime(backorders),
    };
  }

  private async canFulfillBackorder(backorder: Backorder): Promise<boolean> {
    for (const item of backorder.items) {
      const availableStock = await this.inventoryService.getAvailableStock(
        item.sku,
        item.location,
        backorder.tenantId,
      );

      if (availableStock < item.quantity) {
        return false;
      }
    }
    return true;
  }

  private async fulfillBackorder(backorder: Backorder): Promise<void> {
    backorder.fulfillBackorder();

    await this.eventStore.append(
      `backorder-${backorder.backorderId}`,
      backorder.getUncommittedEvents(),
      backorder.getVersion(),
    );

    backorder.markEventsAsCommitted();
  }
}
```

**DoD (Definition of Done):**

- [ ] Backorder creation and management
- [ ] Automatic backorder processing
- [ ] Priority-based backorder handling
- [ ] Backorder reporting and analytics
- [ ] Integration tests for backorder scenarios
- [ ] Performance optimization for backorder processing

#### **3.2 Order-to-Inventory Synchronization**

**Description:** Implement real-time synchronization between order management and inventory systems.

**Files to Create:**

- `src/services/order-inventory-sync.service.ts`
- `src/integrations/order-sync-integration.service.ts`
- `src/events/order-inventory-synced-event.ts`

**Files to Modify:**

- `src/services/inventory.service.ts` - Add sync methods
- `src/projections/inventory-projection-handler.ts` - Handle sync events

**Code Snippets:**

```typescript
// src/services/order-inventory-sync.service.ts
@Injectable()
export class OrderInventorySyncService {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly orderSyncIntegrationService: OrderSyncIntegrationService,
    private readonly eventStore: EventStore,
    private readonly logger: Logger,
  ) {}

  async syncOrderWithInventory(orderId: string, tenantId: string): Promise<SyncResult> {
    this.logger.log(`Syncing order ${orderId} with inventory`);

    try {
      const order = await this.orderSyncIntegrationService.getOrder(orderId, tenantId);
      const inventoryImpact = await this.calculateInventoryImpact(order);

      // Update inventory projections
      await this.updateInventoryProjections(order, inventoryImpact);

      // Emit sync event
      await this.eventStore.append(
        `order-sync-${orderId}`,
        [new OrderInventorySyncedEvent(orderId, inventoryImpact, tenantId)],
        0,
      );

      return {
        orderId,
        status: SyncStatus.SUCCESS,
        inventoryImpact,
        syncedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error syncing order ${orderId}:`, error);
      return {
        orderId,
        status: SyncStatus.ERROR,
        error: error.message,
        syncedAt: new Date(),
      };
    }
  }

  async syncAllPendingOrders(tenantId: string): Promise<BulkSyncResult> {
    this.logger.log('Syncing all pending orders');

    const pendingOrders = await this.orderSyncIntegrationService.getPendingOrders(tenantId);
    const syncResults: SyncResult[] = [];

    for (const order of pendingOrders) {
      const result = await this.syncOrderWithInventory(order.orderId, tenantId);
      syncResults.push(result);
    }

    const successCount = syncResults.filter((r) => r.status === SyncStatus.SUCCESS).length;
    const errorCount = syncResults.filter((r) => r.status === SyncStatus.ERROR).length;

    return {
      totalOrders: pendingOrders.length,
      successCount,
      errorCount,
      syncResults,
      syncedAt: new Date(),
    };
  }

  private async calculateInventoryImpact(order: Order): Promise<InventoryImpact> {
    const impact: InventoryImpact = {
      orderId: order.orderId,
      customerId: order.customerId,
      items: [],
      totalValue: 0,
    };

    for (const line of order.lines) {
      const itemImpact = {
        sku: line.sku,
        quantity: line.quantity,
        location: line.location,
        unitCost: line.unitCost,
        totalCost: line.quantity * line.unitCost,
      };

      impact.items.push(itemImpact);
      impact.totalValue += itemImpact.totalCost;
    }

    return impact;
  }

  private async updateInventoryProjections(order: Order, impact: InventoryImpact): Promise<void> {
    for (const item of impact.items) {
      await this.inventoryService.updateProjectionForOrder({
        sku: item.sku,
        quantity: item.quantity,
        location: item.location,
        orderId: order.orderId,
        impact: 'RESERVED',
        tenantId: order.tenantId,
      });
    }
  }
}
```

**DoD (Definition of Done):**

- [ ] Order-inventory synchronization service
- [ ] Real-time sync for order changes
- [ ] Bulk synchronization capabilities
- [ ] Sync error handling and retry logic
- [ ] Integration tests for sync scenarios
- [ ] Performance optimization for sync operations

---

## 🔒 **Anti-Drift Guardrails Applied**

### **Code Quality Guardrails**

- **Contract-First Development:** All integration interfaces defined in `@aibos/contracts`
- **Type Safety:** Strict TypeScript with comprehensive interfaces
- **Error Handling:** Robust error handling with proper logging
- **Validation:** Input validation for all CRM and order endpoints

### **Architecture Guardrails**

- **Event Sourcing:** All state changes through events
- **Idempotency:** All integration operations idempotent
- **Audit Trail:** Complete audit trail for all operations
- **Performance:** Response times < 500ms for all operations

### **Testing Guardrails**

- **Test Coverage:** ≥95% test coverage for all new code
- **Integration Tests:** End-to-end integration tests required
- **Performance Tests:** Load testing for all integration endpoints
- **Contract Tests:** Pact contracts for all external integrations

---

## 📊 **Success Metrics**

### **Performance Metrics**

- Order processing: < 500ms
- Customer inventory views: < 300ms
- Order fulfillment: < 1s
- Backorder processing: < 2s

### **Quality Metrics**

- Test coverage: ≥95%
- Code review: 100% reviewed
- Security scan: 0 critical issues
- Performance tests: All benchmarks met

### **Business Metrics**

- Order accuracy: 100%
- Customer satisfaction: ≥4.5/5
- Fulfillment rate: ≥98%
- Backorder resolution: < 24 hours

---

## 🎯 **Phase 3 Gate Review**

### **Review Criteria**

- ✅ CRM integration operational
- ✅ Order management integration functional
- ✅ Advanced order features implemented
- ✅ Performance benchmarks met
- ✅ Integration tests passing
- ✅ Anti-drift guardrails enforced

### **Go/No-Go Decision**

**Go Criteria:** Inventory service ready for Manufacturing and Quality Management integration  
**No-Go Criteria:** Integration issues, performance problems, or quality concerns

---

## 🚀 **Next Steps Preparation**

### **Prerequisites for Phase 3 Continuation**

- CRM integration validated with real data
- Order management system operational
- Advanced order features tested
- Performance monitoring operational
- Integration documentation complete

### **Phase 3 Continuation Readiness Checklist**

- [ ] CRM workflows tested end-to-end
- [ ] Order management validated
- [ ] Backorder system operational
- [ ] Order-inventory sync functional
- [ ] Integration APIs documented
- [ ] Performance benchmarks established
- [ ] Business stakeholder approval received

This comprehensive development plan ensures the inventory service is ready for Phase 3 commercial operations with robust CRM and order management integration capabilities.
