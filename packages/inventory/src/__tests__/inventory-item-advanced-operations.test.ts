import type { AdjustStockCommand } from '../commands/adjust-stock-command';
import type { CycleCountCommand } from '../commands/cycle-count-command';
import type { TransferStockCommand } from '../commands/transfer-stock-command';

import { InventoryItem } from '../domain/inventory-item';
import { ValuationMethod } from '../domain/value-objects/valuation-method';
import { describe, it, expect, beforeEach } from 'vitest';

describe('InventoryItem Advanced Operations', () => {
  let inventoryItem: InventoryItem;
  const tenantId = 'tenant-123';
  const sku = 'SKU-001';
  const description = 'Test Product';
  const unitOfMeasure = 'EA';
  const userId = 'user-123';
  const transferId = 'transfer-123';
  const adjustmentId = 'adjustment-123';
  const cycleCountId = 'cycle-count-123';
  const locationA = 'WAREHOUSE-A';
  const locationB = 'WAREHOUSE-B';
  const reference = 'REF-001';

  beforeEach(() => {
    inventoryItem = new InventoryItem(
      'item-123',
      sku,
      description,
      unitOfMeasure,
      ValuationMethod.FIFO,
      tenantId,
    );

    // First receive some stock at location A
    inventoryItem.receiveStock({
      movementId: 'movement-001',
      sku,
      quantity: 100,
      unitCost: 10.5,
      location: locationA,
      reference: 'PO-001',
      tenantId,
      userId,
    });
    inventoryItem.markEventsAsCommitted();
  });

  describe('transferStock', () => {
    it('should successfully transfer stock between locations', () => {
      const command: TransferStockCommand = {
        transferId,
        sku,
        quantity: 50,
        fromLocation: locationA,
        toLocation: locationB,
        reference,
        tenantId,
        userId,
      };

      inventoryItem.transferStock(command);

      expect(inventoryItem.getUncommittedEvents()).toHaveLength(1);
      expect(inventoryItem.getCurrentStock().get(locationA)).toBe(50);
      expect(inventoryItem.getCurrentStock().get(locationB)).toBe(50);
    });

    it('should throw error for insufficient stock at source location', () => {
      const command: TransferStockCommand = {
        transferId,
        sku,
        quantity: 150,
        fromLocation: locationA,
        toLocation: locationB,
        reference,
        tenantId,
        userId,
      };

      expect(() => inventoryItem.transferStock(command)).toThrow(
        'Insufficient stock at source location WAREHOUSE-A. Available: 100, Required: 150',
      );
    });

    it('should throw error for same source and destination locations', () => {
      const command: TransferStockCommand = {
        transferId,
        sku,
        quantity: 50,
        fromLocation: locationA,
        toLocation: locationA,
        reference,
        tenantId,
        userId,
      };

      expect(() => inventoryItem.transferStock(command)).toThrow(
        'Source and destination locations cannot be the same',
      );
    });

    it('should throw error for zero or negative transfer quantity', () => {
      const command: TransferStockCommand = {
        transferId,
        sku,
        quantity: 0,
        fromLocation: locationA,
        toLocation: locationB,
        reference,
        tenantId,
        userId,
      };

      expect(() => inventoryItem.transferStock(command)).toThrow(
        'Transfer quantity must be positive',
      );
    });
  });

  describe('adjustStock', () => {
    it('should successfully increase stock', () => {
      const command: AdjustStockCommand = {
        adjustmentId,
        sku,
        quantity: 25,
        location: locationA,
        adjustmentType: 'INCREASE',
        reason: 'Found additional stock',
        reference,
        tenantId,
        userId,
      };

      inventoryItem.adjustStock(command);

      expect(inventoryItem.getUncommittedEvents()).toHaveLength(1);
      expect(inventoryItem.getCurrentStock().get(locationA)).toBe(125);
    });

    it('should successfully decrease stock', () => {
      const command: AdjustStockCommand = {
        adjustmentId,
        sku,
        quantity: 25,
        location: locationA,
        adjustmentType: 'DECREASE',
        reason: 'Damaged goods',
        reference,
        tenantId,
        userId,
      };

      inventoryItem.adjustStock(command);

      expect(inventoryItem.getUncommittedEvents()).toHaveLength(1);
      expect(inventoryItem.getCurrentStock().get(locationA)).toBe(75);
    });

    it('should throw error for zero or negative adjustment quantity', () => {
      const command: AdjustStockCommand = {
        adjustmentId,
        sku,
        quantity: 0,
        location: locationA,
        adjustmentType: 'INCREASE',
        reason: 'Test adjustment',
        reference,
        tenantId,
        userId,
      };

      expect(() => inventoryItem.adjustStock(command)).toThrow(
        'Adjustment quantity must be positive',
      );
    });

    it('should throw error for empty location', () => {
      const command: AdjustStockCommand = {
        adjustmentId,
        sku,
        quantity: 25,
        location: '',
        adjustmentType: 'INCREASE',
        reason: 'Test adjustment',
        reference,
        tenantId,
        userId,
      };

      expect(() => inventoryItem.adjustStock(command)).toThrow(
        'Location is required for stock adjustment',
      );
    });

    it('should throw error for empty reason', () => {
      const command: AdjustStockCommand = {
        adjustmentId,
        sku,
        quantity: 25,
        location: locationA,
        adjustmentType: 'INCREASE',
        reason: '',
        reference,
        tenantId,
        userId,
      };

      expect(() => inventoryItem.adjustStock(command)).toThrow(
        'Reason is required for stock adjustment',
      );
    });
  });

  describe('performCycleCount', () => {
    it('should record cycle count with no variance', () => {
      const command: CycleCountCommand = {
        cycleCountId,
        sku,
        location: locationA,
        countedQuantity: 100,
        reference,
        tenantId,
        userId,
        countedBy: 'John Doe',
        countedAt: new Date(),
      };

      inventoryItem.performCycleCount(command);

      expect(inventoryItem.getUncommittedEvents()).toHaveLength(1);
      expect(inventoryItem.getCurrentStock().get(locationA)).toBe(100);
    });

    it('should record cycle count with positive variance and create adjustment', () => {
      const command: CycleCountCommand = {
        cycleCountId,
        sku,
        location: locationA,
        countedQuantity: 110,
        reference,
        tenantId,
        userId,
        countedBy: 'John Doe',
        countedAt: new Date(),
      };

      inventoryItem.performCycleCount(command);

      expect(inventoryItem.getUncommittedEvents()).toHaveLength(2); // Cycle count + adjustment
      expect(inventoryItem.getCurrentStock().get(locationA)).toBe(110);
    });

    it('should record cycle count with negative variance and create adjustment', () => {
      const command: CycleCountCommand = {
        cycleCountId,
        sku,
        location: locationA,
        countedQuantity: 90,
        reference,
        tenantId,
        userId,
        countedBy: 'John Doe',
        countedAt: new Date(),
      };

      inventoryItem.performCycleCount(command);

      expect(inventoryItem.getUncommittedEvents()).toHaveLength(2); // Cycle count + adjustment
      expect(inventoryItem.getCurrentStock().get(locationA)).toBe(90);
    });

    it('should throw error for negative counted quantity', () => {
      const command: CycleCountCommand = {
        cycleCountId,
        sku,
        location: locationA,
        countedQuantity: -10,
        reference,
        tenantId,
        userId,
        countedBy: 'John Doe',
        countedAt: new Date(),
      };

      expect(() => inventoryItem.performCycleCount(command)).toThrow(
        'Counted quantity cannot be negative',
      );
    });

    it('should throw error for empty location', () => {
      const command: CycleCountCommand = {
        cycleCountId,
        sku,
        location: '',
        countedQuantity: 100,
        reference,
        tenantId,
        userId,
        countedBy: 'John Doe',
        countedAt: new Date(),
      };

      expect(() => inventoryItem.performCycleCount(command)).toThrow(
        'Location is required for cycle count',
      );
    });

    it('should throw error for empty counter name', () => {
      const command: CycleCountCommand = {
        cycleCountId,
        sku,
        location: locationA,
        countedQuantity: 100,
        reference,
        tenantId,
        userId,
        countedBy: '',
        countedAt: new Date(),
      };

      expect(() => inventoryItem.performCycleCount(command)).toThrow(
        'Counter name is required for cycle count',
      );
    });
  });
});
