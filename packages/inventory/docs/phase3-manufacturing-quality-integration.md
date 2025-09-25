# Inventory Service Phase 3: Manufacturing & Quality Management Integration Development Plan

**Cross-Reference:** AI-BOS ERP Phase 2 Detailed Planning  
**Purpose:** Comprehensive implementation plan for Manufacturing & Quality Management Integration with Inventory Service  
**Timeline:** 2 weeks (Weeks 19-20)  
**Team:** Senior Backend Engineers (2), Frontend Engineer (1), QA Engineer (1)

---

## 🎯 **Strategic Objectives**

### **Primary Goals**

- Integrate inventory service with manufacturing workflows
- Enable Bill of Materials (BOM) management
- Implement Material Requirements Planning (MRP)
- Support production order workflows
- Establish quality management integration

### **Success Criteria**

- ✅ BOM processing: < 400ms response time
- ✅ MRP calculations: 100% accuracy
- ✅ Production order tracking: Complete visibility
- ✅ Quality management: Integrated workflows
- ✅ Integration tests: ≥95% coverage

---

## 📋 **Development Categories**

### **Category 1: Manufacturing Integration Services** 🏭

**Priority:** HIGH | **Timeline:** Week 19

#### **1.1 Bill of Materials (BOM) Management**

**Description:** Integrate inventory service with BOM management for production planning and material consumption.

**Files to Create:**

- `src/integrations/manufacturing-integration.service.ts`
- `src/domain/bill-of-materials.ts`
- `src/domain/bom-item.ts`
- `src/events/bom-created-event.ts`
- `src/services/bom-management.service.ts`

**Files to Modify:**

- `src/services/inventory.service.ts` - Add BOM methods
- `src/controllers/inventory-operations.controller.ts` - Add BOM endpoints
- `src/projections/inventory-projection-handler.ts` - Handle BOM events

**Code Snippets:**

```typescript
// src/domain/bill-of-materials.ts
export class BillOfMaterials extends AggregateRoot {
  constructor(
    public readonly bomId: string,
    public readonly finishedGoodSku: string,
    public readonly version: string,
    public readonly items: BOMItem[],
    public readonly status: BOMStatus,
    public readonly effectiveDate: Date,
    public readonly tenantId: string,
  ) {
    super();
  }

  public calculateMaterialRequirements(quantity: number): MaterialRequirement[] {
    return this.items.map((item) => ({
      sku: item.componentSku,
      quantity: item.quantity * quantity,
      unitOfMeasure: item.unitOfMeasure,
      location: item.location,
      leadTime: item.leadTime,
    }));
  }

  public validateBOM(): void {
    this.validateBOMStructure();
    this.validateComponentAvailability();
  }

  private validateBOMStructure(): void {
    if (this.items.length === 0) {
      throw new BusinessRuleViolation('BOM must have at least one component');
    }
  }
}

// src/services/bom-management.service.ts
@Injectable()
export class BOMManagementService {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly eventStore: EventStore,
    private readonly logger: Logger,
  ) {}

  async createBOM(command: CreateBOMCommand): Promise<void> {
    this.logger.log(`Creating BOM for finished good: ${command.finishedGoodSku}`);

    const bom = new BillOfMaterials(
      command.bomId,
      command.finishedGoodSku,
      command.version,
      command.items,
      BOMStatus.DRAFT,
      command.effectiveDate,
      command.tenantId,
    );

    bom.validateBOM();

    await this.eventStore.append(
      `bom-${command.bomId}`,
      bom.getUncommittedEvents(),
      bom.getVersion(),
    );

    bom.markEventsAsCommitted();
  }

  async calculateMRP(bomId: string, quantity: number, tenantId: string): Promise<MRPResult> {
    const bom = await this.loadBOM(bomId, tenantId);
    const requirements = bom.calculateMaterialRequirements(quantity);

    const availability = await Promise.all(
      requirements.map(async (req) => ({
        sku: req.sku,
        required: req.quantity,
        available: await this.inventoryService.getAvailableStock(req.sku, req.location, tenantId),
        shortfall: Math.max(
          0,
          req.quantity -
            (await this.inventoryService.getAvailableStock(req.sku, req.location, tenantId)),
        ),
      })),
    );

    return {
      bomId,
      finishedGoodSku: bom.finishedGoodSku,
      quantity,
      requirements: availability,
      canProduce: availability.every((req) => req.shortfall === 0),
      totalShortfall: availability.reduce((sum, req) => sum + req.shortfall, 0),
    };
  }
}
```

**DoD (Definition of Done):**

- [ ] BOM creation and validation service
- [ ] Material requirement calculations
- [ ] BOM version management
- [ ] Integration tests for BOM scenarios
- [ ] API endpoints documented
- [ ] Performance tests showing < 400ms response time

#### **1.2 Production Order Workflows**

**Description:** Integrate inventory service with production order management for material consumption and finished goods production.

**Files to Create:**

- `src/domain/production-order.ts`
- `src/services/production-order.service.ts`
- `src/events/production-order-started-event.ts`
- `src/events/production-order-completed-event.ts`

**Files to Modify:**

- `src/services/inventory.service.ts` - Add production methods
- `src/domain/stock-movement.ts` - Add production movement types

**Code Snippets:**

```typescript
// src/domain/production-order.ts
export class ProductionOrder extends AggregateRoot {
  constructor(
    public readonly productionOrderId: string,
    public readonly bomId: string,
    public readonly finishedGoodSku: string,
    public readonly quantity: number,
    public readonly status: ProductionOrderStatus,
    public readonly startDate: Date,
    public readonly plannedEndDate: Date,
    public readonly workCenter: string,
    public readonly tenantId: string,
  ) {
    super();
  }

  public startProduction(): void {
    this.validateProductionStart();
    this.consumeMaterials();
    this.addEvent(new ProductionOrderStartedEvent(this.productionOrderId, this.tenantId));
    this.status = ProductionOrderStatus.IN_PROGRESS;
  }

  public completeProduction(actualQuantity: number): void {
    this.validateProductionCompletion(actualQuantity);
    this.produceFinishedGoods(actualQuantity);
    this.addEvent(
      new ProductionOrderCompletedEvent(this.productionOrderId, actualQuantity, this.tenantId),
    );
    this.status = ProductionOrderStatus.COMPLETED;
  }

  private consumeMaterials(): void {
    // Implementation for material consumption
  }

  private produceFinishedGoods(quantity: number): void {
    // Implementation for finished goods production
  }
}

// src/services/production-order.service.ts
@Injectable()
export class ProductionOrderService {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly bomManagementService: BOMManagementService,
    private readonly eventStore: EventStore,
    private readonly logger: Logger,
  ) {}

  async startProduction(command: StartProductionCommand): Promise<void> {
    this.logger.log(`Starting production order: ${command.productionOrderId}`);

    const productionOrder = await this.loadProductionOrder(
      command.productionOrderId,
      command.tenantId,
    );

    // Validate material availability
    const mrpResult = await this.bomManagementService.calculateMRP(
      productionOrder.bomId,
      productionOrder.quantity,
      command.tenantId,
    );

    if (!mrpResult.canProduce) {
      throw new InsufficientMaterialsError(
        `Insufficient materials for production order ${command.productionOrderId}`,
      );
    }

    // Start production
    productionOrder.startProduction();

    await this.eventStore.append(
      `production-order-${command.productionOrderId}`,
      productionOrder.getUncommittedEvents(),
      productionOrder.getVersion(),
    );

    productionOrder.markEventsAsCommitted();
  }

  async completeProduction(command: CompleteProductionCommand): Promise<void> {
    this.logger.log(`Completing production order: ${command.productionOrderId}`);

    const productionOrder = await this.loadProductionOrder(
      command.productionOrderId,
      command.tenantId,
    );
    productionOrder.completeProduction(command.actualQuantity);

    await this.eventStore.append(
      `production-order-${command.productionOrderId}`,
      productionOrder.getUncommittedEvents(),
      productionOrder.getVersion(),
    );

    productionOrder.markEventsAsCommitted();
  }
}
```

**DoD (Definition of Done):**

- [ ] Production order workflow implemented
- [ ] Material consumption tracking
- [ ] Finished goods production
- [ ] Production order status management
- [ ] Integration tests for production scenarios
- [ ] Performance optimization for production operations

---

### **Category 2: Quality Management Integration** ✅

**Priority:** HIGH | **Timeline:** Week 19-20

#### **2.1 Quality Inspection Workflows**

**Description:** Integrate inventory service with quality management for inspection workflows and quality holds.

**Files to Create:**

- `src/integrations/quality-integration.service.ts`
- `src/domain/quality-inspection.ts`
- `src/domain/quality-hold.ts`
- `src/events/quality-inspection-completed-event.ts`

**Files to Modify:**

- `src/services/inventory.service.ts` - Add quality methods
- `src/domain/inventory-item.ts` - Add quality status

**Code Snippets:**

```typescript
// src/domain/quality-inspection.ts
export class QualityInspection extends AggregateRoot {
  constructor(
    public readonly inspectionId: string,
    public readonly sku: string,
    public readonly batchNumber: string,
    public readonly quantity: number,
    public readonly inspectionType: InspectionType,
    public readonly status: InspectionStatus,
    public readonly inspector: string,
    public readonly inspectionDate: Date,
    public readonly tenantId: string,
  ) {
    super();
  }

  public completeInspection(result: InspectionResult): void {
    this.validateInspectionCompletion(result);

    this.addEvent(
      new QualityInspectionCompletedEvent(
        this.inspectionId,
        this.sku,
        this.batchNumber,
        result,
        this.tenantId,
      ),
    );

    this.status = InspectionStatus.COMPLETED;
  }

  private validateInspectionCompletion(result: InspectionResult): void {
    if (this.status !== InspectionStatus.IN_PROGRESS) {
      throw new BusinessRuleViolation('Only in-progress inspections can be completed');
    }
  }
}

// src/integrations/quality-integration.service.ts
@Injectable()
export class QualityIntegrationService {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly eventStore: EventStore,
    private readonly logger: Logger,
  ) {}

  async createQualityInspection(command: CreateQualityInspectionCommand): Promise<void> {
    this.logger.log(
      `Creating quality inspection for SKU: ${command.sku}, Batch: ${command.batchNumber}`,
    );

    const inspection = new QualityInspection(
      command.inspectionId,
      command.sku,
      command.batchNumber,
      command.quantity,
      command.inspectionType,
      InspectionStatus.PENDING,
      command.inspector,
      command.inspectionDate,
      command.tenantId,
    );

    // Place inventory on quality hold
    await this.inventoryService.placeOnQualityHold({
      sku: command.sku,
      batchNumber: command.batchNumber,
      quantity: command.quantity,
      inspectionId: command.inspectionId,
      tenantId: command.tenantId,
    });

    await this.eventStore.append(
      `inspection-${command.inspectionId}`,
      inspection.getUncommittedEvents(),
      inspection.getVersion(),
    );

    inspection.markEventsAsCommitted();
  }

  async completeQualityInspection(command: CompleteQualityInspectionCommand): Promise<void> {
    this.logger.log(`Completing quality inspection: ${command.inspectionId}`);

    const inspection = await this.loadInspection(command.inspectionId, command.tenantId);
    inspection.completeInspection(command.result);

    // Update inventory based on inspection result
    if (command.result.status === InspectionResultStatus.PASSED) {
      await this.inventoryService.releaseFromQualityHold({
        sku: inspection.sku,
        batchNumber: inspection.batchNumber,
        quantity: inspection.quantity,
        inspectionId: command.inspectionId,
        tenantId: command.tenantId,
      });
    } else {
      await this.inventoryService.quarantineInventory({
        sku: inspection.sku,
        batchNumber: inspection.batchNumber,
        quantity: inspection.quantity,
        reason: command.result.failureReason,
        inspectionId: command.inspectionId,
        tenantId: command.tenantId,
      });
    }

    await this.eventStore.append(
      `inspection-${command.inspectionId}`,
      inspection.getUncommittedEvents(),
      inspection.getVersion(),
    );

    inspection.markEventsAsCommitted();
  }
}
```

**DoD (Definition of Done):**

- [ ] Quality inspection workflow implemented
- [ ] Quality hold management
- [ ] Inspection result processing
- [ ] Quarantine inventory management
- [ ] Integration tests for quality scenarios
- [ ] Performance optimization for quality operations

#### **2.2 Non-Conformance Reports (NCR) Integration**

**Description:** Integrate inventory service with NCR management for quality issue tracking and corrective actions.

**Files to Create:**

- `src/domain/non-conformance-report.ts`
- `src/services/ncr-management.service.ts`
- `src/events/ncr-created-event.ts`
- `src/events/corrective-action-implemented-event.ts`

**Files to Modify:**

- `src/services/inventory.service.ts` - Add NCR methods
- `src/integrations/quality-integration.service.ts` - Add NCR handling

**Code Snippets:**

```typescript
// src/domain/non-conformance-report.ts
export class NonConformanceReport extends AggregateRoot {
  constructor(
    public readonly ncrId: string,
    public readonly sku: string,
    public readonly batchNumber: string,
    public readonly issueType: IssueType,
    public readonly severity: SeverityLevel,
    public readonly description: string,
    public readonly reportedBy: string,
    public readonly reportedDate: Date,
    public readonly status: NCRStatus,
    public readonly tenantId: string,
  ) {
    super();
  }

  public implementCorrectiveAction(action: CorrectiveAction): void {
    this.validateCorrectiveAction(action);

    this.addEvent(
      new CorrectiveActionImplementedEvent(
        this.ncrId,
        action.actionId,
        action.description,
        action.implementedBy,
        this.tenantId,
      ),
    );

    this.status = NCRStatus.CORRECTIVE_ACTION_IMPLEMENTED;
  }

  private validateCorrectiveAction(action: CorrectiveAction): void {
    if (this.status !== NCRStatus.INVESTIGATION_COMPLETE) {
      throw new BusinessRuleViolation(
        'Corrective action can only be implemented after investigation is complete',
      );
    }
  }
}

// src/services/ncr-management.service.ts
@Injectable()
export class NCRManagementService {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly eventStore: EventStore,
    private readonly logger: Logger,
  ) {}

  async createNCR(command: CreateNCRCommand): Promise<void> {
    this.logger.log(`Creating NCR for SKU: ${command.sku}, Batch: ${command.batchNumber}`);

    const ncr = new NonConformanceReport(
      command.ncrId,
      command.sku,
      command.batchNumber,
      command.issueType,
      command.severity,
      command.description,
      command.reportedBy,
      command.reportedDate,
      NCRStatus.OPEN,
      command.tenantId,
    );

    // Quarantine affected inventory
    await this.inventoryService.quarantineInventory({
      sku: command.sku,
      batchNumber: command.batchNumber,
      quantity: command.quantity,
      reason: `NCR: ${command.description}`,
      ncrId: command.ncrId,
      tenantId: command.tenantId,
    });

    await this.eventStore.append(
      `ncr-${command.ncrId}`,
      ncr.getUncommittedEvents(),
      ncr.getVersion(),
    );

    ncr.markEventsAsCommitted();
  }

  async implementCorrectiveAction(command: ImplementCorrectiveActionCommand): Promise<void> {
    this.logger.log(`Implementing corrective action for NCR: ${command.ncrId}`);

    const ncr = await this.loadNCR(command.ncrId, command.tenantId);
    ncr.implementCorrectiveAction(command.action);

    await this.eventStore.append(
      `ncr-${command.ncrId}`,
      ncr.getUncommittedEvents(),
      ncr.getVersion(),
    );

    ncr.markEventsAsCommitted();
  }
}
```

**DoD (Definition of Done):**

- [ ] NCR creation and management
- [ ] Corrective action implementation
- [ ] Quality issue tracking
- [ ] Inventory quarantine management
- [ ] Integration tests for NCR scenarios
- [ ] Performance optimization for NCR operations

---

### **Category 3: Advanced Manufacturing Features** ⚡

**Priority:** MEDIUM | **Timeline:** Week 20

#### **3.1 Work Center Management**

**Description:** Integrate inventory service with work center management for production capacity and material allocation.

**Files to Create:**

- `src/domain/work-center.ts`
- `src/services/work-center-management.service.ts`
- `src/events/work-center-created-event.ts`

**Files to Modify:**

- `src/services/production-order.service.ts` - Add work center integration

**Code Snippets:**

```typescript
// src/domain/work-center.ts
export class WorkCenter extends AggregateRoot {
  constructor(
    public readonly workCenterId: string,
    public readonly workCenterName: string,
    public readonly workCenterCode: string,
    public readonly capacity: number,
    public readonly currentLoad: number,
    public readonly efficiency: number,
    public readonly isActive: boolean,
    public readonly tenantId: string,
  ) {
    super();
  }

  public allocateCapacity(requiredCapacity: number): void {
    this.validateCapacityAllocation(requiredCapacity);
    this.currentLoad += requiredCapacity;
  }

  public releaseCapacity(releasedCapacity: number): void {
    this.currentLoad = Math.max(0, this.currentLoad - releasedCapacity);
  }

  private validateCapacityAllocation(requiredCapacity: number): void {
    if (this.currentLoad + requiredCapacity > this.capacity) {
      throw new InsufficientCapacityError(
        `Insufficient work center capacity. Available: ${this.capacity - this.currentLoad}, Required: ${requiredCapacity}`,
      );
    }
  }
}

// src/services/work-center-management.service.ts
@Injectable()
export class WorkCenterManagementService {
  constructor(
    private readonly eventStore: EventStore,
    private readonly logger: Logger,
  ) {}

  async createWorkCenter(command: CreateWorkCenterCommand): Promise<void> {
    this.logger.log(`Creating work center: ${command.workCenterCode}`);

    const workCenter = new WorkCenter(
      command.workCenterId,
      command.workCenterName,
      command.workCenterCode,
      command.capacity,
      0, // currentLoad
      command.efficiency,
      true, // isActive
      command.tenantId,
    );

    await this.eventStore.append(
      `work-center-${command.workCenterId}`,
      workCenter.getUncommittedEvents(),
      workCenter.getVersion(),
    );

    workCenter.markEventsAsCommitted();
  }

  async getWorkCenterUtilization(tenantId: string): Promise<WorkCenterUtilizationReport> {
    const workCenters = await this.getAllWorkCenters(tenantId);

    return workCenters.map((wc) => ({
      workCenterId: wc.workCenterId,
      workCenterCode: wc.workCenterCode,
      capacity: wc.capacity,
      currentLoad: wc.currentLoad,
      utilizationPercentage: (wc.currentLoad / wc.capacity) * 100,
      availableCapacity: wc.capacity - wc.currentLoad,
      efficiency: wc.efficiency,
    }));
  }
}
```

**DoD (Definition of Done):**

- [ ] Work center creation and management
- [ ] Capacity allocation and tracking
- [ ] Work center utilization reporting
- [ ] Production capacity planning
- [ ] Integration tests for work center scenarios
- [ ] Performance optimization for capacity operations

#### **3.2 Manufacturing Reporting**

**Description:** Implement comprehensive manufacturing reporting with inventory integration.

**Files to Create:**

- `src/services/manufacturing-reporting.service.ts`
- `src/reports/manufacturing-summary-report.ts`
- `src/reports/production-efficiency-report.ts`

**Files to Modify:**

- `src/services/inventory-reporting.service.ts` - Add manufacturing reports

**Code Snippets:**

```typescript
// src/services/manufacturing-reporting.service.ts
@Injectable()
export class ManufacturingReportingService {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly productionOrderService: ProductionOrderService,
    private readonly bomManagementService: BOMManagementService,
    private readonly logger: Logger,
  ) {}

  async generateManufacturingSummaryReport(
    tenantId: string,
    period: DateRange,
  ): Promise<ManufacturingSummaryReport> {
    this.logger.log(
      `Generating manufacturing summary report for period: ${period.startDate} to ${period.endDate}`,
    );

    const productionOrders = await this.productionOrderService.getProductionOrdersInPeriod(
      period,
      tenantId,
    );
    const materialConsumption = await this.calculateMaterialConsumption(productionOrders);
    const finishedGoodsProduction = await this.calculateFinishedGoodsProduction(productionOrders);

    return {
      period,
      totalProductionOrders: productionOrders.length,
      completedOrders: productionOrders.filter(
        (po) => po.status === ProductionOrderStatus.COMPLETED,
      ).length,
      totalMaterialConsumption: materialConsumption,
      totalFinishedGoodsProduced: finishedGoodsProduction,
      productionEfficiency: this.calculateProductionEfficiency(productionOrders),
      materialUtilization: this.calculateMaterialUtilization(productionOrders),
    };
  }

  async generateProductionEfficiencyReport(
    tenantId: string,
    period: DateRange,
  ): Promise<ProductionEfficiencyReport> {
    const productionOrders = await this.productionOrderService.getProductionOrdersInPeriod(
      period,
      tenantId,
    );
    const workCenters = await this.getWorkCenterUtilization(tenantId);

    return {
      period,
      overallEfficiency: this.calculateOverallEfficiency(productionOrders),
      workCenterEfficiency: workCenters.map((wc) => ({
        workCenterId: wc.workCenterId,
        workCenterCode: wc.workCenterCode,
        efficiency: wc.efficiency,
        utilization: wc.utilizationPercentage,
        capacity: wc.capacity,
        currentLoad: wc.currentLoad,
      })),
      productionTrends: this.calculateProductionTrends(productionOrders),
    };
  }

  private async calculateMaterialConsumption(
    productionOrders: ProductionOrder[],
  ): Promise<MaterialConsumption> {
    // Implementation for material consumption calculation
    return {
      totalValue: 0,
      items: [],
    };
  }

  private async calculateFinishedGoodsProduction(
    productionOrders: ProductionOrder[],
  ): Promise<FinishedGoodsProduction> {
    // Implementation for finished goods production calculation
    return {
      totalQuantity: 0,
      totalValue: 0,
      items: [],
    };
  }
}
```

**DoD (Definition of Done):**

- [ ] Manufacturing summary reporting
- [ ] Production efficiency reporting
- [ ] Material consumption tracking
- [ ] Work center utilization reporting
- [ ] Integration tests for reporting scenarios
- [ ] Performance optimization for report generation

---

## 🔒 **Anti-Drift Guardrails Applied**

### **Code Quality Guardrails**

- **Contract-First Development:** All integration interfaces defined in `@aibos/contracts`
- **Type Safety:** Strict TypeScript with comprehensive interfaces
- **Error Handling:** Robust error handling with proper logging
- **Validation:** Input validation for all manufacturing and quality endpoints

### **Architecture Guardrails**

- **Event Sourcing:** All state changes through events
- **Idempotency:** All integration operations idempotent
- **Audit Trail:** Complete audit trail for all operations
- **Performance:** Response times < 400ms for all operations

### **Testing Guardrails**

- **Test Coverage:** ≥95% test coverage for all new code
- **Integration Tests:** End-to-end integration tests required
- **Performance Tests:** Load testing for all integration endpoints
- **Contract Tests:** Pact contracts for all external integrations

---

## 📊 **Success Metrics**

### **Performance Metrics**

- BOM processing: < 400ms
- MRP calculations: < 1s
- Production order processing: < 500ms
- Quality inspection: < 300ms

### **Quality Metrics**

- Test coverage: ≥95%
- Code review: 100% reviewed
- Security scan: 0 critical issues
- Performance tests: All benchmarks met

### **Business Metrics**

- Manufacturing accuracy: 100%
- Quality compliance: ≥99%
- Production efficiency: ≥90%
- Material utilization: ≥95%

---

## 🎯 **Phase 3 Gate Review**

### **Review Criteria**

- ✅ Manufacturing integration operational
- ✅ Quality management integration functional
- ✅ Advanced manufacturing features implemented
- ✅ Performance benchmarks met
- ✅ Integration tests passing
- ✅ Anti-drift guardrails enforced

### **Go/No-Go Decision**

**Go Criteria:** Inventory service ready for Production Readiness and Scale  
**No-Go Criteria:** Integration issues, performance problems, or quality concerns

---

## 🚀 **Next Steps Preparation**

### **Prerequisites for Phase 4**

- Manufacturing integration validated with real data
- Quality management system operational
- Advanced manufacturing features tested
- Performance monitoring operational
- Integration documentation complete

### **Phase 4 Readiness Checklist**

- [ ] Manufacturing workflows tested end-to-end
- [ ] Quality management validated
- [ ] Work center management operational
- [ ] Manufacturing reporting functional
- [ ] Integration APIs documented
- [ ] Performance benchmarks established
- [ ] Business stakeholder approval received

This comprehensive development plan ensures the inventory service is ready for Phase 4 production readiness with robust manufacturing and quality management integration capabilities.
