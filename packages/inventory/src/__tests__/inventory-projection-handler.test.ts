import { CycleCountEvent } from '../events/cycle-count-event';
import { StockAdjustmentEvent } from '../events/stock-adjustment-event';
import { StockIssuedEvent } from '../events/stock-issued-event';
import { StockReceivedEvent } from '../events/stock-received-event';
import { StockTransferEvent } from '../events/stock-transfer-event';
import { InventoryProjectionHandler } from '../projections/inventory-projection-handler';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('InventoryProjectionHandler', () => {
  let handler: InventoryProjectionHandler;
  let mockInventoryProjectionRepository: any;
  let mockStockLevelProjectionRepository: any;
  let mockStockMovementProjectionRepository: any;
  let mockInventorySummaryProjectionRepository: any;

  const tenantId = 'tenant-123';
  const sku = 'SKU-001';
  const location = 'WAREHOUSE-A';
  const locationB = 'WAREHOUSE-B';
  const reference = 'REF-001';

  beforeEach(() => {
    mockInventoryProjectionRepository = {
      save: vi.fn(),
      findBySku: vi.fn(),
      findAll: vi.fn(),
      findByLowStock: vi.fn(),
      findByOutOfStock: vi.fn(),
      delete: vi.fn(),
    };

    mockStockLevelProjectionRepository = {
      save: vi.fn(),
      findBySku: vi.fn(),
      findByLocation: vi.fn(),
      findBySkuAndLocation: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
    };

    mockStockMovementProjectionRepository = {
      save: vi.fn(),
      findBySku: vi.fn(),
      findByLocation: vi.fn(),
      findByReference: vi.fn(),
      findByDateRange: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
    };

    mockInventorySummaryProjectionRepository = {
      save: vi.fn(),
      findByTenant: vi.fn(),
      delete: vi.fn(),
    };

    handler = new InventoryProjectionHandler(
      mockInventoryProjectionRepository,
      mockStockLevelProjectionRepository,
      mockStockMovementProjectionRepository,
      mockInventorySummaryProjectionRepository,
    );
  });

  describe('handleStockReceived', () => {
    it('should handle stock received event correctly', async () => {
      const event = new StockReceivedEvent(sku, 100, 10.5, location, reference, tenantId, 1);

      await handler.handleStockReceived(event);

      expect(mockInventoryProjectionRepository.save).toHaveBeenCalledTimes(1);
      expect(mockStockLevelProjectionRepository.save).toHaveBeenCalledTimes(1);
      expect(mockStockMovementProjectionRepository.save).toHaveBeenCalledTimes(1);
      expect(mockInventorySummaryProjectionRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleStockIssued', () => {
    it('should handle stock issued event correctly', async () => {
      const event = new StockIssuedEvent(sku, 50, 10.5, location, reference, tenantId, 1);

      await handler.handleStockIssued(event);

      expect(mockInventoryProjectionRepository.save).toHaveBeenCalledTimes(1);
      expect(mockStockLevelProjectionRepository.save).toHaveBeenCalledTimes(1);
      expect(mockStockMovementProjectionRepository.save).toHaveBeenCalledTimes(1);
      expect(mockInventorySummaryProjectionRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleStockTransfer', () => {
    it('should handle stock transfer event correctly', async () => {
      const event = new StockTransferEvent(
        sku,
        50,
        location,
        locationB,
        reference,
        tenantId,
        1,
        10.5,
      );

      await handler.handleStockTransfer(event);

      expect(mockInventoryProjectionRepository.save).toHaveBeenCalledTimes(1);
      expect(mockStockLevelProjectionRepository.save).toHaveBeenCalledTimes(2); // From and to locations
      expect(mockStockMovementProjectionRepository.save).toHaveBeenCalledTimes(1);
      expect(mockInventorySummaryProjectionRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleStockAdjustment', () => {
    it('should handle stock adjustment event correctly', async () => {
      const event = new StockAdjustmentEvent(
        sku,
        25,
        location,
        'INCREASE',
        'Found additional stock',
        reference,
        tenantId,
        1,
        10.5,
      );

      await handler.handleStockAdjustment(event);

      expect(mockInventoryProjectionRepository.save).toHaveBeenCalledTimes(1);
      expect(mockStockLevelProjectionRepository.save).toHaveBeenCalledTimes(1);
      expect(mockStockMovementProjectionRepository.save).toHaveBeenCalledTimes(1);
      expect(mockInventorySummaryProjectionRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleCycleCount', () => {
    it('should handle cycle count event correctly', async () => {
      const event = new CycleCountEvent(
        sku,
        location,
        100,
        reference,
        tenantId,
        1,
        'John Doe',
        new Date(),
      );

      await handler.handleCycleCount(event);

      expect(mockInventoryProjectionRepository.save).toHaveBeenCalledTimes(1);
      expect(mockStockLevelProjectionRepository.save).toHaveBeenCalledTimes(1);
      expect(mockStockMovementProjectionRepository.save).toHaveBeenCalledTimes(1);
      expect(mockInventorySummaryProjectionRepository.save).toHaveBeenCalledTimes(1);
    });
  });
});
