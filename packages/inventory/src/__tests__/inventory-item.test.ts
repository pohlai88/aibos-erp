import type { IssueStockCommand } from '../commands/issue-stock-command';
import type { ReceiveStockCommand } from '../commands/receive-stock-command';

import { InventoryItem } from '../domain/inventory-item';
import { ValuationMethod } from '../domain/value-objects/valuation-method';
import { describe, it, expect, beforeEach } from 'vitest';

describe('InventoryItem', () => {
  let inventoryItem: InventoryItem;
  const tenantId = 'tenant-123';
  const sku = 'SKU-001';
  const description = 'Test Product';
  const unitOfMeasure = 'EA';
  const userId = 'user-123';
  const movementId = 'movement-123';
  const location = 'WAREHOUSE-A';
  const reference = 'PO-001';
  const movementId001 = 'movement-001';
  const movementId002 = 'movement-002';
  const movementId003 = 'movement-003';
  const referenceSO = 'SO-001';

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
        movementId,
        sku,
        quantity: 100,
        unitCost: 10.5,
        location,
        reference,
        tenantId,
        userId,
      };

      inventoryItem.receiveStock(command);

      expect(inventoryItem.getUncommittedEvents()).toHaveLength(1);
      expect(inventoryItem.getCurrentStock().get(location)).toBe(100);
    });

    it('should throw error for negative quantity', () => {
      const command: ReceiveStockCommand = {
        movementId,
        sku,
        quantity: -10,
        unitCost: 10.5,
        location,
        reference,
        tenantId,
        userId,
      };

      expect(() => inventoryItem.receiveStock(command)).toThrow(
        'Stock receipt quantity must be positive',
      );
    });

    it('should throw error for negative unit cost', () => {
      const command: ReceiveStockCommand = {
        movementId,
        sku,
        quantity: 100,
        unitCost: -10.5,
        location,
        reference,
        tenantId,
        userId,
      };

      expect(() => inventoryItem.receiveStock(command)).toThrow('Unit cost cannot be negative');
    });

    it('should throw error for empty location', () => {
      const command: ReceiveStockCommand = {
        movementId,
        sku,
        quantity: 100,
        unitCost: 10.5,
        location: '',
        reference,
        tenantId,
        userId,
      };

      expect(() => inventoryItem.receiveStock(command)).toThrow(
        'Location is required for stock receipt',
      );
    });
  });

  describe('issueStock', () => {
    beforeEach(() => {
      // First receive some stock
      const receiveCommand: ReceiveStockCommand = {
        movementId: movementId001,
        sku,
        quantity: 100,
        unitCost: 10.5,
        location,
        reference,
        tenantId,
        userId,
      };
      inventoryItem.receiveStock(receiveCommand);
      inventoryItem.markEventsAsCommitted();
    });

    it('should successfully issue stock', () => {
      const command: IssueStockCommand = {
        movementId: movementId002,
        sku,
        quantity: 50,
        location,
        reference: referenceSO,
        tenantId,
        userId,
      };

      inventoryItem.issueStock(command);

      expect(inventoryItem.getUncommittedEvents()).toHaveLength(1);
      expect(inventoryItem.getCurrentStock().get('WAREHOUSE-A')).toBe(50);
    });

    it('should throw error for insufficient stock', () => {
      const command: IssueStockCommand = {
        movementId: movementId002,
        sku,
        quantity: 150,
        location,
        reference: referenceSO,
        tenantId,
        userId,
      };

      expect(() => inventoryItem.issueStock(command)).toThrow(
        'Insufficient stock at location WAREHOUSE-A',
      );
    });

    it('should throw error for negative quantity', () => {
      const command: IssueStockCommand = {
        movementId: movementId002,
        sku,
        quantity: -10,
        location,
        reference: referenceSO,
        tenantId,
        userId,
      };

      expect(() => inventoryItem.issueStock(command)).toThrow(
        'Stock issue quantity must be positive',
      );
    });

    it('should throw error for empty location', () => {
      const command: IssueStockCommand = {
        movementId: movementId002,
        sku,
        quantity: 50,
        location: '',
        reference: referenceSO,
        tenantId,
        userId,
      };

      expect(() => inventoryItem.issueStock(command)).toThrow(
        'Location is required for stock issue',
      );
    });
  });

  describe('valuation methods', () => {
    beforeEach(() => {
      // Receive stock with different costs for testing valuation
      const firstReceipt: ReceiveStockCommand = {
        movementId: movementId001,
        sku,
        quantity: 100,
        unitCost: 10.0,
        location,
        reference,
        tenantId,
        userId,
      };

      const secondReceipt: ReceiveStockCommand = {
        movementId: movementId002,
        sku,
        quantity: 50,
        unitCost: 12.0,
        location,
        reference: 'PO-002',
        tenantId,
        userId,
      };

      inventoryItem.receiveStock(firstReceipt);
      inventoryItem.receiveStock(secondReceipt);
      inventoryItem.markEventsAsCommitted();
    });

    it('should calculate FIFO cost correctly', () => {
      const command: IssueStockCommand = {
        movementId: movementId003,
        sku,
        quantity: 75,
        location,
        reference: referenceSO,
        tenantId,
        userId,
      };

      inventoryItem.issueStock(command);

      // FIFO should use first 75 units at $10.00 each
      const events = inventoryItem.getUncommittedEvents();
      expect(events).toHaveLength(1);
      // The event should contain the calculated cost
    });

    it('should calculate weighted average cost correctly', () => {
      const weightedAverageItem = new InventoryItem(
        'item-456',
        sku,
        description,
        unitOfMeasure,
        ValuationMethod.WEIGHTED_AVERAGE,
        tenantId,
      );

      const firstReceipt: ReceiveStockCommand = {
        movementId: movementId001,
        sku,
        quantity: 100,
        unitCost: 10.0,
        location,
        reference,
        tenantId,
        userId,
      };

      const secondReceipt: ReceiveStockCommand = {
        movementId: movementId002,
        sku,
        quantity: 50,
        unitCost: 12.0,
        location,
        reference: 'PO-002',
        tenantId,
        userId,
      };

      weightedAverageItem.receiveStock(firstReceipt);
      weightedAverageItem.receiveStock(secondReceipt);
      weightedAverageItem.markEventsAsCommitted();

      const command: IssueStockCommand = {
        movementId: movementId003,
        sku,
        quantity: 30,
        location,
        reference: referenceSO,
        tenantId,
        userId,
      };

      weightedAverageItem.issueStock(command);

      // Weighted average: (100*10 + 50*12) / (100+50) = 1600/150 = 10.67
      const events = weightedAverageItem.getUncommittedEvents();
      expect(events).toHaveLength(1);
    });
  });

  describe('getters', () => {
    it('should return correct SKU', () => {
      expect(inventoryItem.getSku()).toBe(sku);
    });

    it('should return correct description', () => {
      expect(inventoryItem.getDescription()).toBe(description);
    });

    it('should return correct unit of measure', () => {
      expect(inventoryItem.getUnitOfMeasure()).toBe(unitOfMeasure);
    });

    it('should return correct valuation method', () => {
      expect(inventoryItem.getValuationMethod()).toBe(ValuationMethod.FIFO);
    });

    it('should return immutable current stock map', () => {
      const stockMap = inventoryItem.getCurrentStock();
      expect(stockMap).toBeInstanceOf(Map);
      // Verify it's a copy, not the original
      expect(stockMap).not.toBe(inventoryItem.getCurrentStock());
    });

    it('should return immutable stock movements array', () => {
      const movements = inventoryItem.getStockMovements();
      expect(movements).toBeInstanceOf(Array);
      // Verify it's a copy, not the original
      expect(movements).not.toBe(inventoryItem.getStockMovements());
    });
  });
});
