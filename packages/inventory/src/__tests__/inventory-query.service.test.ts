import { InventoryQueryService } from '../services/inventory-query.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('InventoryQueryService', () => {
  let service: InventoryQueryService;
  let mockInventoryProjectionRepository: any;
  let mockStockLevelProjectionRepository: any;
  let mockStockMovementProjectionRepository: any;
  let mockInventorySummaryProjectionRepository: any;

  const tenantId = 'tenant-123';
  const sku = 'SKU-001';
  const location = 'WAREHOUSE-A';
  const testProduct = 'Test Product';
  const unitOfMeasure = 'EA';
  const valuationMethod = 'FIFO';

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

    service = new InventoryQueryService(
      mockInventoryProjectionRepository,
      mockStockLevelProjectionRepository,
      mockStockMovementProjectionRepository,
      mockInventorySummaryProjectionRepository,
    );
  });

  describe('getInventoryBySku', () => {
    it('should return inventory query result when found', async () => {
      const inventoryProjection = {
        sku,
        description: testProduct,
        unitOfMeasure,
        valuationMethod,
        totalStock: 100,
        totalValue: 1050,
        averageCost: 10.5,
        lastUpdated: new Date(),
        tenantId,
      };

      const stockLevels = [
        {
          sku,
          location,
          quantity: 100,
          unitCost: 10.5,
          totalValue: 1050,
          lastMovement: new Date(),
          tenantId,
        },
      ];

      mockInventoryProjectionRepository.findBySku.mockResolvedValue(inventoryProjection);
      mockStockLevelProjectionRepository.findBySku.mockResolvedValue(stockLevels);

      const result = await service.getInventoryBySku(sku, tenantId);

      expect(result).toBeDefined();
      expect(result?.sku).toBe(sku);
      expect(result?.description).toBe(testProduct);
      expect(result?.totalStock).toBe(100);
      expect(result?.locations).toHaveLength(1);
      expect(result?.locations[0].location).toBe(location);
    });

    it('should return null when inventory not found', async () => {
      mockInventoryProjectionRepository.findBySku.mockResolvedValue(null);

      const result = await service.getInventoryBySku(sku, tenantId);

      expect(result).toBeNull();
    });
  });

  describe('getAllInventory', () => {
    it('should return all inventory query results', async () => {
      const inventoryProjections = [
        {
          sku,
          description: testProduct,
          unitOfMeasure,
          valuationMethod,
          totalStock: 100,
          totalValue: 1050,
          averageCost: 10.5,
          lastUpdated: new Date(),
          tenantId,
        },
      ];

      const stockLevels = [
        {
          sku,
          location,
          quantity: 100,
          unitCost: 10.5,
          totalValue: 1050,
          lastMovement: new Date(),
          tenantId,
        },
      ];

      mockInventoryProjectionRepository.findAll.mockResolvedValue(inventoryProjections);
      mockStockLevelProjectionRepository.findBySku.mockResolvedValue(stockLevels);

      const results = await service.getAllInventory(tenantId);

      expect(results).toHaveLength(1);
      expect(results[0].sku).toBe(sku);
      expect(results[0].locations).toHaveLength(1);
    });
  });

  describe('getLowStockItems', () => {
    it('should return low stock items', async () => {
      const lowStockProjections = [
        {
          sku,
          description: testProduct,
          unitOfMeasure,
          valuationMethod,
          totalStock: 5,
          totalValue: 52.5,
          averageCost: 10.5,
          lastUpdated: new Date(),
          tenantId,
        },
      ];

      const stockLevels = [
        {
          sku,
          location,
          quantity: 5,
          unitCost: 10.5,
          totalValue: 52.5,
          lastMovement: new Date(),
          tenantId,
        },
      ];

      mockInventoryProjectionRepository.findByLowStock.mockResolvedValue(lowStockProjections);
      mockStockLevelProjectionRepository.findBySku.mockResolvedValue(stockLevels);

      const results = await service.getLowStockItems(10, tenantId);

      expect(results).toHaveLength(1);
      expect(results[0].sku).toBe(sku);
      expect(results[0].totalStock).toBe(5);
    });
  });

  describe('getOutOfStockItems', () => {
    it('should return out of stock items', async () => {
      const outOfStockProjections = [
        {
          sku,
          description: testProduct,
          unitOfMeasure,
          valuationMethod,
          totalStock: 0,
          totalValue: 0,
          averageCost: 10.5,
          lastUpdated: new Date(),
          tenantId,
        },
      ];

      const stockLevels = [
        {
          sku,
          location,
          quantity: 0,
          unitCost: 10.5,
          totalValue: 0,
          lastMovement: new Date(),
          tenantId,
        },
      ];

      mockInventoryProjectionRepository.findByOutOfStock.mockResolvedValue(outOfStockProjections);
      mockStockLevelProjectionRepository.findBySku.mockResolvedValue(stockLevels);

      const results = await service.getOutOfStockItems(tenantId);

      expect(results).toHaveLength(1);
      expect(results[0].sku).toBe(sku);
      expect(results[0].totalStock).toBe(0);
    });
  });

  describe('getStockMovementsBySku', () => {
    it('should return stock movements for SKU', async () => {
      const movements = [
        {
          movementId: 'movement-001',
          sku,
          quantity: 100,
          unitCost: 10.5,
          location,
          movementType: 'StockReceivedEvent',
          reference: 'PO-001',
          timestamp: new Date(),
          tenantId,
        },
      ];

      mockStockMovementProjectionRepository.findBySku.mockResolvedValue(movements);

      const results = await service.getStockMovementsBySku(sku, tenantId);

      expect(results).toHaveLength(1);
      expect(results[0].sku).toBe(sku);
      expect(results[0].quantity).toBe(100);
      expect(results[0].movementType).toBe('StockReceivedEvent');
    });
  });

  describe('getInventorySummary', () => {
    it('should return inventory summary', async () => {
      const summary = {
        totalItems: 10,
        totalStock: 1000,
        totalValue: 10500,
        lowStockItems: 2,
        outOfStockItems: 1,
        lastUpdated: new Date(),
        tenantId,
      };

      mockInventorySummaryProjectionRepository.findByTenant.mockResolvedValue(summary);

      const result = await service.getInventorySummary(tenantId);

      expect(result).toBeDefined();
      expect(result?.totalItems).toBe(10);
      expect(result?.totalStock).toBe(1000);
      expect(result?.totalValue).toBe(10500);
      expect(result?.lowStockItems).toBe(2);
      expect(result?.outOfStockItems).toBe(1);
    });

    it('should return null when summary not found', async () => {
      mockInventorySummaryProjectionRepository.findByTenant.mockResolvedValue(null);

      const result = await service.getInventorySummary(tenantId);

      expect(result).toBeNull();
    });
  });
});
