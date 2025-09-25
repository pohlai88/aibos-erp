import { InventoryOperationsController } from '../controllers/inventory-operations.controller';
import { InventoryService } from '../services/inventory.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('InventoryOperationsController', () => {
  let controller: InventoryOperationsController;
  let mockInventoryService: any;

  const tenantId = 'tenant-123';
  const sku = 'SKU-001';
  const location = 'WAREHOUSE-A';
  const userId = 'user-123';
  const movementId = 'movement-001';
  const poReference = 'PO-001';
  const invalidDataTest = 'should throw 400 for invalid data';

  beforeEach(() => {
    mockInventoryService = {
      receiveStock: vi.fn(),
      issueStock: vi.fn(),
      transferStock: vi.fn(),
      adjustStock: vi.fn(),
      performCycleCount: vi.fn(),
    };

    controller = new InventoryOperationsController(mockInventoryService);
  });

  describe('receiveStock', () => {
    it('should receive stock successfully', async () => {
      const dto = {
        movementId,
        sku,
        quantity: 100,
        unitCost: 10.5,
        location,
        reference: poReference,
        tenantId,
        userId,
        batchNumber: 'BATCH-001',
        expiryDate: '2024-12-31T00:00:00Z',
      };

      mockInventoryService.receiveStock.mockResolvedValue(undefined);

      const result = await controller.receiveStock(dto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Stock received successfully');
      expect(result.operationId).toBe(dto.movementId);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(mockInventoryService.receiveStock).toHaveBeenCalledWith({
        ...dto,
        expiryDate: new Date(dto.expiryDate),
      });
    });

    it(invalidDataTest, async () => {
      const dto = {
        movementId,
        sku,
        quantity: -100, // Invalid quantity
        unitCost: 10.5,
        location,
        reference: poReference,
        tenantId,
        userId,
      };

      mockInventoryService.receiveStock.mockRejectedValue(new Error('Invalid quantity'));

      await expect(controller.receiveStock(dto)).rejects.toThrow(
        'Failed to receive stock: Invalid quantity',
      );
    });
  });

  describe('issueStock', () => {
    it('should issue stock successfully', async () => {
      const dto = {
        movementId: 'movement-002',
        sku,
        quantity: 50,
        location,
        reference: 'SO-001',
        tenantId,
        userId,
      };

      mockInventoryService.issueStock.mockResolvedValue(undefined);

      const result = await controller.issueStock(dto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Stock issued successfully');
      expect(result.operationId).toBe(dto.movementId);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(mockInventoryService.issueStock).toHaveBeenCalledWith(dto);
    });

    it(invalidDataTest, async () => {
      const dto = {
        movementId: 'movement-002',
        sku,
        quantity: 150, // More than available
        location,
        reference: 'SO-001',
        tenantId,
        userId,
      };

      mockInventoryService.issueStock.mockRejectedValue(new Error('Insufficient stock'));

      await expect(controller.issueStock(dto)).rejects.toThrow(
        'Failed to issue stock: Insufficient stock',
      );
    });
  });

  describe('transferStock', () => {
    it('should transfer stock successfully', async () => {
      const dto = {
        transferId: 'transfer-001',
        sku,
        quantity: 25,
        fromLocation: location,
        toLocation: 'WAREHOUSE-B',
        reference: 'TR-001',
        tenantId,
        userId,
        reason: 'Stock rebalancing',
      };

      mockInventoryService.transferStock.mockResolvedValue(undefined);

      const result = await controller.transferStock(dto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Stock transferred successfully');
      expect(result.operationId).toBe(dto.transferId);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(mockInventoryService.transferStock).toHaveBeenCalledWith(dto);
    });

    it(invalidDataTest, async () => {
      const dto = {
        transferId: 'transfer-001',
        sku,
        quantity: 25,
        fromLocation: location,
        toLocation: location, // Same location
        reference: 'TR-001',
        tenantId,
        userId,
      };

      mockInventoryService.transferStock.mockRejectedValue(
        new Error('Source and destination locations cannot be the same'),
      );

      await expect(controller.transferStock(dto)).rejects.toThrow(
        'Failed to transfer stock: Source and destination locations cannot be the same',
      );
    });
  });

  describe('adjustStock', () => {
    it('should adjust stock successfully', async () => {
      const dto = {
        adjustmentId: 'adjustment-001',
        sku,
        quantity: 10,
        location,
        adjustmentType: 'INCREASE' as const,
        reason: 'Found additional stock',
        reference: 'ADJ-001',
        tenantId,
        userId,
        unitCost: 10.5,
      };

      mockInventoryService.adjustStock.mockResolvedValue(undefined);

      const result = await controller.adjustStock(dto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Stock adjusted successfully');
      expect(result.operationId).toBe(dto.adjustmentId);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(mockInventoryService.adjustStock).toHaveBeenCalledWith(dto);
    });

    it(invalidDataTest, async () => {
      const dto = {
        adjustmentId: 'adjustment-001',
        sku,
        quantity: 0, // Invalid quantity
        location,
        adjustmentType: 'INCREASE' as const,
        reason: 'Test adjustment',
        reference: 'ADJ-001',
        tenantId,
        userId,
      };

      mockInventoryService.adjustStock.mockRejectedValue(
        new Error('Adjustment quantity must be positive'),
      );

      await expect(controller.adjustStock(dto)).rejects.toThrow(
        'Failed to adjust stock: Adjustment quantity must be positive',
      );
    });
  });

  describe('performCycleCount', () => {
    it('should perform cycle count successfully', async () => {
      const dto = {
        cycleCountId: 'cycle-count-001',
        sku,
        location,
        countedQuantity: 100,
        reference: 'CC-001',
        tenantId,
        userId,
        countedBy: 'John Doe',
        countedAt: '2024-01-15T10:00:00Z',
        notes: 'Physical count completed',
      };

      mockInventoryService.performCycleCount.mockResolvedValue(undefined);

      const result = await controller.performCycleCount(dto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Cycle count completed successfully');
      expect(result.operationId).toBe(dto.cycleCountId);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(mockInventoryService.performCycleCount).toHaveBeenCalledWith({
        ...dto,
        countedAt: new Date(dto.countedAt),
      });
    });

    it(invalidDataTest, async () => {
      const dto = {
        cycleCountId: 'cycle-count-001',
        sku,
        location,
        countedQuantity: -10, // Invalid quantity
        reference: 'CC-001',
        tenantId,
        userId,
        countedBy: 'John Doe',
        countedAt: '2024-01-15T10:00:00Z',
      };

      mockInventoryService.performCycleCount.mockRejectedValue(
        new Error('Counted quantity cannot be negative'),
      );

      await expect(controller.performCycleCount(dto)).rejects.toThrow(
        'Failed to perform cycle count: Counted quantity cannot be negative',
      );
    });
  });
});
