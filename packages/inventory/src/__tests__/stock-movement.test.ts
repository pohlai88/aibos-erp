import { StockMovement, StockMovementType } from '../domain/stock-movement';
import { describe, it, expect } from 'vitest';

describe('StockMovement', () => {
  const movementId = 'movement-123';
  const quantity = 100;
  const unitCost = 10.5;
  const location = 'WAREHOUSE-A';
  const reference = 'PO-001';
  const referenceSO = 'SO-001';
  const referenceTR = 'TR-001';
  const referenceADJ = 'ADJ-001';
  const referenceCC = 'CC-001';
  const movementTypeReceipt = StockMovementType.RECEIPT;
  const movementTypeIssue = StockMovementType.ISSUE;
  const movementTypeTransfer = StockMovementType.TRANSFER;
  const movementTypeAdjustment = StockMovementType.ADJUSTMENT;
  const movementTypeCycleCount = StockMovementType.CYCLE_COUNT;
  describe('constructor validation', () => {
    it('should create valid stock movement', () => {
      const movement = new StockMovement(
        movementId,
        quantity,
        unitCost,
        location,
        movementTypeReceipt,
        reference,
      );

      expect(movement.movementId).toBe(movementId);
      expect(movement.quantity).toBe(quantity);
      expect(movement.unitCost).toBe(10.5);
      expect(movement.location).toBe(location);
      expect(movement.movementType).toBe(movementTypeReceipt);
      expect(movement.reference).toBe(reference);
      expect(movement.timestamp).toBeInstanceOf(Date);
    });

    it('should throw error for zero quantity', () => {
      expect(() => {
        new StockMovement(movementId, 0, unitCost, location, movementTypeReceipt, reference);
      }).toThrow('Movement quantity must be positive');
    });

    it('should throw error for negative quantity', () => {
      expect(() => {
        new StockMovement(movementId, -10, unitCost, location, movementTypeReceipt, reference);
      }).toThrow('Movement quantity must be positive');
    });

    it('should throw error for negative unit cost', () => {
      expect(() => {
        new StockMovement(movementId, quantity, -10.5, location, movementTypeReceipt, reference);
      }).toThrow('Unit cost cannot be negative');
    });

    it('should throw error for empty location', () => {
      expect(() => {
        new StockMovement(movementId, quantity, 10.5, '', movementTypeReceipt, reference);
      }).toThrow('Location is required');
    });

    it('should throw error for whitespace-only location', () => {
      expect(() => {
        new StockMovement(movementId, quantity, 10.5, '   ', movementTypeReceipt, reference);
      }).toThrow('Location is required');
    });

    it('should throw error for empty reference', () => {
      expect(() => {
        new StockMovement(movementId, quantity, 10.5, location, movementTypeReceipt, '');
      }).toThrow('Reference is required');
    });

    it('should throw error for whitespace-only reference', () => {
      expect(() => {
        new StockMovement(movementId, quantity, unitCost, location, movementTypeReceipt, '   ');
      }).toThrow('Reference is required');
    });
  });

  describe('movement types', () => {
    it('should accept RECEIPT movement type', () => {
      const movement = new StockMovement(
        movementId,
        quantity,
        unitCost,
        location,
        movementTypeReceipt,
        reference,
      );

      expect(movement.movementType).toBe(movementTypeReceipt);
    });

    it('should accept ISSUE movement type', () => {
      const movement = new StockMovement(
        movementId,
        quantity,
        unitCost,
        location,
        movementTypeIssue,
        referenceSO,
      );

      expect(movement.movementType).toBe(movementTypeIssue);
    });

    it('should accept TRANSFER movement type', () => {
      const movement = new StockMovement(
        movementId,
        quantity,
        unitCost,
        location,
        movementTypeTransfer,
        referenceTR,
      );

      expect(movement.movementType).toBe(movementTypeTransfer);
    });

    it('should accept ADJUSTMENT movement type', () => {
      const movement = new StockMovement(
        movementId,
        quantity,
        unitCost,
        location,
        movementTypeAdjustment,
        referenceADJ,
      );

      expect(movement.movementType).toBe(movementTypeAdjustment);
    });

    it('should accept CYCLE_COUNT movement type', () => {
      const movement = new StockMovement(
        movementId,
        quantity,
        unitCost,
        location,
        movementTypeCycleCount,
        referenceCC,
      );

      expect(movement.movementType).toBe(movementTypeCycleCount);
    });
  });

  describe('timestamp', () => {
    it('should use current timestamp by default', () => {
      const beforeCreation = new Date();
      const movement = new StockMovement(
        movementId,
        quantity,
        unitCost,
        location,
        movementTypeReceipt,
        reference,
      );
      const afterCreation = new Date();

      expect(movement.timestamp.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(movement.timestamp.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });

    it('should accept custom timestamp', () => {
      const customTimestamp = new Date('2023-01-01T00:00:00Z');
      const movement = new StockMovement(
        movementId,
        quantity,
        unitCost,
        location,
        movementTypeReceipt,
        reference,
        customTimestamp,
      );

      expect(movement.timestamp).toBe(customTimestamp);
    });
  });
});
