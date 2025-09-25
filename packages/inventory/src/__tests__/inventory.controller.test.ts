import { InventoryController } from '../controllers/inventory.controller';
import { InventoryQueryService } from '../services/inventory-query.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('InventoryController', () => {
  let controller: InventoryController;
  let mockInventoryQueryService: any;

  const tenantId = 'tenant-123';
  const sku = 'SKU-001';
  const location = 'WAREHOUSE-A';
  const testDescription = 'Test Product';
  const movementId = 'movement-001';

  beforeEach(() => {
    mockInventoryQueryService = {
      getInventorySummary: vi.fn(),
      getAllInventory: vi.fn(),
      getInventoryBySku: vi.fn(),
      getLowStockItems: vi.fn(),
      getOutOfStockItems: vi.fn(),
      getStockMovementsBySku: vi.fn(),
      getStockMovementsByLocation: vi.fn(),
      getStockMovementsByDateRange: vi.fn(),
    };

    controller = new InventoryController(mockInventoryQueryService);
  });

  describe('getInventorySummary', () => {
    it('should return inventory summary when found', async () => {
      const summary = {
        totalItems: 10,
        totalStock: 1000,
        totalValue: 10500,
        lowStockItems: 2,
        outOfStockItems: 1,
        lastUpdated: new Date(),
      };

      mockInventoryQueryService.getInventorySummary.mockResolvedValue(summary);

      const result = await controller.getInventorySummary(tenantId);

      expect(result).toEqual(summary);
      expect(mockInventoryQueryService.getInventorySummary).toHaveBeenCalledWith(tenantId);
    });

    it('should throw 404 when summary not found', async () => {
      mockInventoryQueryService.getInventorySummary.mockResolvedValue(null);

      await expect(controller.getInventorySummary(tenantId)).rejects.toThrow(
        'Inventory summary not found',
      );
    });
  });

  describe('getAllInventory', () => {
    it('should return all inventory items', async () => {
      const inventoryItems = [
        {
          sku,
          description: testDescription,
          unitOfMeasure: 'EA',
          valuationMethod: 'FIFO',
          totalStock: 100,
          totalValue: 1050,
          averageCost: 10.5,
          locations: [
            {
              location,
              quantity: 100,
              unitCost: 10.5,
              totalValue: 1050,
            },
          ],
        },
      ];

      mockInventoryQueryService.getAllInventory.mockResolvedValue(inventoryItems);

      const result = await controller.getAllInventory(tenantId);

      expect(result).toEqual(inventoryItems);
      expect(mockInventoryQueryService.getAllInventory).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('getInventoryBySku', () => {
    it('should return inventory item when found', async () => {
      const inventoryItem = {
        sku,
        description: 'Test Product',
        unitOfMeasure: 'EA',
        valuationMethod: 'FIFO',
        totalStock: 100,
        totalValue: 1050,
        averageCost: 10.5,
        locations: [
          {
            location,
            quantity: 100,
            unitCost: 10.5,
            totalValue: 1050,
          },
        ],
      };

      mockInventoryQueryService.getInventoryBySku.mockResolvedValue(inventoryItem);

      const result = await controller.getInventoryBySku(tenantId, sku);

      expect(result).toEqual(inventoryItem);
      expect(mockInventoryQueryService.getInventoryBySku).toHaveBeenCalledWith(sku, tenantId);
    });

    it('should throw 404 when inventory item not found', async () => {
      mockInventoryQueryService.getInventoryBySku.mockResolvedValue(null);

      await expect(controller.getInventoryBySku(tenantId, sku)).rejects.toThrow(
        'Inventory item not found',
      );
    });
  });

  describe('getLowStockItems', () => {
    it('should return low stock items with default threshold', async () => {
      const lowStockItems = [
        {
          sku,
          description: testDescription,
          unitOfMeasure: 'EA',
          valuationMethod: 'FIFO',
          totalStock: 5,
          totalValue: 52.5,
          averageCost: 10.5,
          locations: [
            {
              location,
              quantity: 5,
              unitCost: 10.5,
              totalValue: 52.5,
            },
          ],
        },
      ];

      mockInventoryQueryService.getLowStockItems.mockResolvedValue(lowStockItems);

      const result = await controller.getLowStockItems(tenantId);

      expect(result).toEqual(lowStockItems);
      expect(mockInventoryQueryService.getLowStockItems).toHaveBeenCalledWith(10, tenantId);
    });

    it('should return low stock items with custom threshold', async () => {
      const lowStockItems = [
        {
          sku,
          description: testDescription,
          unitOfMeasure: 'EA',
          valuationMethod: 'FIFO',
          totalStock: 5,
          totalValue: 52.5,
          averageCost: 10.5,
          locations: [
            {
              location,
              quantity: 5,
              unitCost: 10.5,
              totalValue: 52.5,
            },
          ],
        },
      ];

      mockInventoryQueryService.getLowStockItems.mockResolvedValue(lowStockItems);

      const result = await controller.getLowStockItems(tenantId, '5');

      expect(result).toEqual(lowStockItems);
      expect(mockInventoryQueryService.getLowStockItems).toHaveBeenCalledWith(5, tenantId);
    });
  });

  describe('getOutOfStockItems', () => {
    it('should return out of stock items', async () => {
      const outOfStockItems = [
        {
          sku,
          description: testDescription,
          unitOfMeasure: 'EA',
          valuationMethod: 'FIFO',
          totalStock: 0,
          totalValue: 0,
          averageCost: 10.5,
          locations: [
            {
              location,
              quantity: 0,
              unitCost: 10.5,
              totalValue: 0,
            },
          ],
        },
      ];

      mockInventoryQueryService.getOutOfStockItems.mockResolvedValue(outOfStockItems);

      const result = await controller.getOutOfStockItems(tenantId);

      expect(result).toEqual(outOfStockItems);
      expect(mockInventoryQueryService.getOutOfStockItems).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('getStockMovementsBySku', () => {
    it('should return stock movements for SKU', async () => {
      const movements = [
        {
          movementId,
          sku,
          quantity: 100,
          unitCost: 10.5,
          location,
          movementType: 'StockReceivedEvent',
          reference: 'PO-001',
          timestamp: new Date(),
        },
      ];

      mockInventoryQueryService.getStockMovementsBySku.mockResolvedValue(movements);

      const result = await controller.getStockMovementsBySku(tenantId, sku);

      expect(result).toEqual(movements);
      expect(mockInventoryQueryService.getStockMovementsBySku).toHaveBeenCalledWith(sku, tenantId);
    });
  });

  describe('getStockMovementsByLocation', () => {
    it('should return stock movements for location', async () => {
      const movements = [
        {
          movementId,
          sku,
          quantity: 100,
          unitCost: 10.5,
          location,
          movementType: 'StockReceivedEvent',
          reference: 'PO-001',
          timestamp: new Date(),
        },
      ];

      mockInventoryQueryService.getStockMovementsByLocation.mockResolvedValue(movements);

      const result = await controller.getStockMovementsByLocation(tenantId, location);

      expect(result).toEqual(movements);
      expect(mockInventoryQueryService.getStockMovementsByLocation).toHaveBeenCalledWith(
        location,
        tenantId,
      );
    });
  });

  describe('getStockMovementsByDateRange', () => {
    it('should return stock movements for date range', async () => {
      const movements = [
        {
          movementId,
          sku,
          quantity: 100,
          unitCost: 10.5,
          location,
          movementType: 'StockReceivedEvent',
          reference: 'PO-001',
          timestamp: new Date(),
        },
      ];

      mockInventoryQueryService.getStockMovementsByDateRange.mockResolvedValue(movements);

      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-01-31T23:59:59Z';

      const result = await controller.getStockMovementsByDateRange(tenantId, startDate, endDate);

      expect(result).toEqual(movements);
      expect(mockInventoryQueryService.getStockMovementsByDateRange).toHaveBeenCalledWith(
        new Date(startDate),
        new Date(endDate),
        tenantId,
      );
    });

    it('should throw 400 for invalid date format', async () => {
      const startDate = 'invalid-date';
      const endDate = '2024-01-31T23:59:59Z';

      await expect(
        controller.getStockMovementsByDateRange(tenantId, startDate, endDate),
      ).rejects.toThrow('Invalid date format');
    });
  });
});
