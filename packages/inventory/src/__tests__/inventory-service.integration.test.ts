import { type AdjustStockCommand } from '../commands/adjust-stock-command';
import { type CycleCountCommand } from '../commands/cycle-count-command';
import { type IssueStockCommand } from '../commands/issue-stock-command';
import { type ReceiveStockCommand } from '../commands/receive-stock-command';
import { type TransferStockCommand } from '../commands/transfer-stock-command';
import { InventoryItem } from '../domain/inventory-item';
import { ValuationMethod } from '../domain/value-objects/valuation-method';
import { InventoryReportingService } from '../services/inventory-reporting.service';
import { InventoryService } from '../services/inventory.service';
import { ValuationService } from '../services/valuation.service';
import { describe, it, expect, beforeEach } from 'vitest';

describe('Inventory Service Integration Tests', () => {
  let inventoryItem: InventoryItem;
  let valuationService: ValuationService;
  let reportingService: InventoryReportingService;
  const tenantId = 'tenant-123';
  const sku = 'SKU-001';
  const description = 'Test Product';
  const unitOfMeasure = 'EA';
  const userId = 'user-123';
  const warehouseA = 'WAREHOUSE-A';
  const warehouseB = 'WAREHOUSE-B';
  const itemId = 'item-123';
  const poReference = 'PO-001';
  const movement001 = 'movement-001';
  const movement002 = 'movement-002';
  const movement003 = 'movement-003';

  beforeEach(() => {
    inventoryItem = new InventoryItem(
      itemId,
      sku,
      description,
      unitOfMeasure,
      ValuationMethod.FIFO,
      tenantId,
    );
    valuationService = new ValuationService();
    reportingService = new InventoryReportingService(valuationService);
  });

  describe('Complete Stock Movement Workflow', () => {
    it('should handle complete stock lifecycle', () => {
      // 1. Receive initial stock
      const receiveCommand: ReceiveStockCommand = {
        movementId: movement001,
        sku,
        quantity: 100,
        unitCost: 10.5,
        location: warehouseA,
        reference: poReference,
        tenantId,
        userId,
      };

      inventoryItem.receiveStock(receiveCommand);
      inventoryItem.markEventsAsCommitted();

      expect(inventoryItem.getCurrentStock().get(warehouseA)).toBe(100);

      // 2. Issue some stock
      const issueCommand: IssueStockCommand = {
        movementId: movement002,
        sku,
        quantity: 30,
        location: warehouseA,
        reference: 'SO-001',
        tenantId,
        userId,
      };

      inventoryItem.issueStock(issueCommand);
      inventoryItem.markEventsAsCommitted();

      expect(inventoryItem.getCurrentStock().get(warehouseA)).toBe(70);

      // 3. Transfer stock between locations
      const transferCommand: TransferStockCommand = {
        transferId: 'transfer-001',
        sku,
        quantity: 20,
        fromLocation: warehouseA,
        toLocation: warehouseB,
        reference: 'TR-001',
        tenantId,
        userId,
      };

      inventoryItem.transferStock(transferCommand);
      inventoryItem.markEventsAsCommitted();

      // 4. Verify final stock levels
      expect(inventoryItem.getCurrentStock().get(warehouseA)).toBe(50); // 100 - 30 - 20
      expect(inventoryItem.getCurrentStock().get(warehouseB)).toBe(20); // 0 + 20
    });

    it('should handle stock adjustments', () => {
      // First receive some stock
      const receiveCommand: ReceiveStockCommand = {
        movementId: movement001,
        sku,
        quantity: 100,
        unitCost: 10.0,
        location: warehouseA,
        reference: poReference,
        tenantId,
        userId,
      };

      inventoryItem.receiveStock(receiveCommand);
      inventoryItem.markEventsAsCommitted();

      // Increase stock
      const increaseCommand: AdjustStockCommand = {
        adjustmentId: 'adj-001',
        sku,
        quantity: 10,
        location: warehouseA,
        adjustmentType: 'INCREASE',
        reason: 'Found missing stock',
        reference: 'ADJ-001',
        tenantId,
        userId,
      };

      inventoryItem.adjustStock(increaseCommand);
      inventoryItem.markEventsAsCommitted();

      expect(inventoryItem.getCurrentStock().get(warehouseA)).toBe(110);

      // Decrease stock
      const decreaseCommand: AdjustStockCommand = {
        adjustmentId: 'adj-002',
        sku,
        quantity: 5,
        location: warehouseA,
        adjustmentType: 'DECREASE',
        reason: 'Damaged stock',
        reference: 'ADJ-002',
        tenantId,
        userId,
      };

      inventoryItem.adjustStock(decreaseCommand);
      inventoryItem.markEventsAsCommitted();

      expect(inventoryItem.getCurrentStock().get(warehouseA)).toBe(105);
    });

    it('should handle cycle counting', () => {
      // First receive some stock
      const receiveCommand: ReceiveStockCommand = {
        movementId: movement001,
        sku,
        quantity: 100,
        unitCost: 10.0,
        location: warehouseA,
        reference: poReference,
        tenantId,
        userId,
      };

      inventoryItem.receiveStock(receiveCommand);
      inventoryItem.markEventsAsCommitted();

      // Perform cycle count with variance
      const cycleCountCommand: CycleCountCommand = {
        cycleCountId: 'cc-001',
        sku,
        location: warehouseA,
        countedQuantity: 95, // 5 units short
        reference: 'CC-001',
        tenantId,
        userId,
        countedBy: 'Auditor 1',
        countedAt: new Date(),
      };

      inventoryItem.performCycleCount(cycleCountCommand);
      inventoryItem.markEventsAsCommitted();

      // Should create adjustment for variance
      expect(inventoryItem.getCurrentStock().get(warehouseA)).toBe(95);
      expect(inventoryItem.getUncommittedEvents()).toHaveLength(0); // Events committed
    });
  });

  describe('Valuation Methods', () => {
    it('should correctly calculate FIFO valuation', () => {
      // Receive multiple stocks for valuation testing
      inventoryItem.receiveStock({
        movementId: movement001,
        sku,
        quantity: 100,
        unitCost: 10.0,
        location: warehouseA,
        reference: poReference,
        tenantId,
        userId,
      });

      inventoryItem.receiveStock({
        movementId: movement002,
        sku,
        quantity: 50,
        unitCost: 12.0,
        location: warehouseA,
        reference: 'PO-002',
        tenantId,
        userId,
      });

      inventoryItem.markEventsAsCommitted();

      // Issue stock - FIFO should use first 75 units at $10.00 each
      const issueCommand: IssueStockCommand = {
        movementId: movement003,
        sku,
        quantity: 75,
        location: warehouseA,
        reference: 'SO-001',
        tenantId,
        userId,
      };

      inventoryItem.issueStock(issueCommand);

      // Verify FIFO cost calculation
      const issuedEvent = inventoryItem.getUncommittedEvents()[0];
      expect(issuedEvent.serialize().unitCost).toBeCloseTo(10.0);
    });

    it('should correctly calculate Weighted Average valuation', () => {
      // Create new item with Weighted Average method
      const weightedAverageItem = new InventoryItem(
        'item-456',
        sku,
        description,
        unitOfMeasure,
        ValuationMethod.WEIGHTED_AVERAGE,
        tenantId,
      );

      weightedAverageItem.receiveStock({
        movementId: movement001,
        sku,
        quantity: 100,
        unitCost: 10.0,
        location: warehouseA,
        reference: poReference,
        tenantId,
        userId,
      });

      weightedAverageItem.receiveStock({
        movementId: movement002,
        sku,
        quantity: 50,
        unitCost: 12.0,
        location: warehouseA,
        reference: 'PO-002',
        tenantId,
        userId,
      });

      weightedAverageItem.markEventsAsCommitted();

      // Issue stock - Weighted Average should use average cost
      const issueCommand: IssueStockCommand = {
        movementId: movement003,
        sku,
        quantity: 75,
        location: warehouseA,
        reference: 'SO-001',
        tenantId,
        userId,
      };

      weightedAverageItem.issueStock(issueCommand);

      // Verify Weighted Average cost calculation
      // Total cost = (100*10) + (50*12) = 1000 + 600 = 1600
      // Total quantity = 150
      // Weighted average = 1600 / 150 = 10.666...
      const issuedEvent = weightedAverageItem.getUncommittedEvents()[0];
      expect(issuedEvent.serialize().unitCost).toBeCloseTo(10.666, 2);
    });
  });

  describe('Reporting Integration', () => {
    it('should generate accurate stock level reports', async () => {
      // Setup inventory data
      inventoryItem.receiveStock({
        movementId: movement001,
        sku,
        quantity: 100,
        unitCost: 10.0,
        location: warehouseA,
        reference: poReference,
        tenantId,
        userId,
      });

      inventoryItem.receiveStock({
        movementId: movement002,
        sku,
        quantity: 50,
        unitCost: 12.0,
        location: 'WAREHOUSE-B',
        reference: 'PO-002',
        tenantId,
        userId,
      });

      inventoryItem.markEventsAsCommitted();

      // Generate stock level report
      const stockLevelReport = await reportingService.generateStockLevelReport(
        [
          {
            sku,
            description,
            currentStock: inventoryItem.getCurrentStock(),
            stockMovements: inventoryItem.getStockMovements().map((movement) => ({
              location: movement.location,
              timestamp: movement.timestamp,
              unitCost: movement.unitCost,
            })),
          },
        ],
        tenantId,
      );

      expect(stockLevelReport).toHaveLength(2);
      expect(stockLevelReport[0].sku).toBe(sku);
      expect(stockLevelReport[0].quantity).toBe(100);
      expect(stockLevelReport[1].quantity).toBe(50);
    });

    it('should generate accurate valuation reports', async () => {
      // Setup inventory data
      inventoryItem.receiveStock({
        movementId: movement001,
        sku,
        quantity: 100,
        unitCost: 10.0,
        location: warehouseA,
        reference: poReference,
        tenantId,
        userId,
      });

      inventoryItem.receiveStock({
        movementId: movement002,
        sku,
        quantity: 50,
        unitCost: 12.0,
        location: warehouseA,
        reference: 'PO-002',
        tenantId,
        userId,
      });

      inventoryItem.markEventsAsCommitted();

      // Generate valuation report
      const valuationReport = await reportingService.generateValuationReport(
        sku,
        description,
        ValuationMethod.WEIGHTED_AVERAGE,
        inventoryItem.getStockMovements().map((movement) => ({
          quantity: movement.quantity,
          unitCost: movement.unitCost,
          location: movement.location,
          movementType: movement.movementType,
        })),
        inventoryItem.getCurrentStock(),
        tenantId,
      );

      expect(valuationReport.sku).toBe(sku);
      expect(valuationReport.totalQuantity).toBe(150);
      expect(valuationReport.averageCost).toBeCloseTo(10.666, 2);
      expect(valuationReport.totalValue).toBeCloseTo(1600, 2);
    });
  });

  describe('Error Handling', () => {
    it('should prevent negative stock levels', () => {
      // Try to issue more stock than available
      const issueCommand: IssueStockCommand = {
        movementId: movement001,
        sku,
        quantity: 150, // More than available
        location: warehouseA,
        reference: 'SO-001',
        tenantId,
        userId,
      };

      expect(() => inventoryItem.issueStock(issueCommand)).toThrow(
        `Insufficient stock at location ${warehouseA}`,
      );
    });

    it('should prevent invalid stock transfers', () => {
      // Try to transfer to the same location
      const transferCommand: TransferStockCommand = {
        transferId: 'transfer-001',
        sku,
        quantity: 10,
        fromLocation: warehouseA,
        toLocation: warehouseA, // Same location
        reference: 'TR-001',
        tenantId,
        userId,
      };

      expect(() => inventoryItem.transferStock(transferCommand)).toThrow(
        'Source and destination locations cannot be the same',
      );
    });

    it('should validate cycle count inputs', () => {
      const cycleCountCommand: CycleCountCommand = {
        cycleCountId: 'cc-001',
        sku,
        location: warehouseA,
        countedQuantity: -10, // Negative quantity
        reference: 'CC-001',
        tenantId,
        userId,
        countedBy: 'Auditor 1',
        countedAt: new Date(),
      };

      expect(() => inventoryItem.performCycleCount(cycleCountCommand)).toThrow(
        'Counted quantity cannot be negative',
      );
    });
  });
});
