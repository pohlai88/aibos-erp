import { EventStore } from '../infrastructure/event-store/event-store';
import { ProcurementIntegrationService } from '../integrations/procurement-integration.service';
import { VendorIntegrationService } from '../integrations/vendor-integration.service';
import { BatchTrackingService } from '../services/batch-tracking.service';
import { InventoryService } from '../services/inventory.service';
import { ReservationManagementService } from '../services/reservation-management.service';
import { WarehouseManagementService } from '../services/warehouse-management.service';
import { Logger } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Procurement Integration Tests', () => {
  let procurementService: ProcurementIntegrationService;
  let vendorService: VendorIntegrationService;
  let warehouseService: WarehouseManagementService;
  let batchService: BatchTrackingService;
  let reservationService: ReservationManagementService;
  let mockInventoryService: any;
  let mockEventStore: any;

  const tenantId = 'tenant-123';
  const vendorId = 'vendor-001';
  const sku = 'SKU-001';
  const warehouseId = 'warehouse-001';
  const batchId = 'batch-001';
  const reservationId = 'reservation-001';
  const warehouseLocation = 'WAREHOUSE-A';
  const vendorSku = 'VENDOR-SKU-001';
  const vendorName = 'Test Vendor';
  const orderId = 'order-001';
  const customerId = 'customer-001';
  const userId = 'user-123';

  beforeEach(() => {
    mockInventoryService = {
      receiveStock: vi.fn(),
      getCurrentStock: vi.fn().mockResolvedValue(100),
      getAvailableStock: vi.fn().mockResolvedValue(80),
      updateVendorInformation: vi.fn(),
      getInventoryByVendor: vi.fn().mockResolvedValue([]),
      updateVendorPricing: vi.fn(),
      getVendorData: vi.fn().mockResolvedValue(null),
      getAllStockLevelsForWarehouse: vi.fn().mockResolvedValue([]),
    };

    mockEventStore = {
      append: vi.fn().mockResolvedValue(undefined),
    };

    const mockLogger = {
      log: vi.fn(),
      error: vi.fn(),
    };

    procurementService = new ProcurementIntegrationService(
      mockInventoryService,
      mockEventStore,
      mockLogger as any,
    );

    vendorService = new VendorIntegrationService(
      mockInventoryService,
      mockEventStore,
      mockLogger as any,
    );

    warehouseService = new WarehouseManagementService(
      mockEventStore,
      mockInventoryService,
      mockLogger as any,
    );

    batchService = new BatchTrackingService(mockEventStore, mockLogger as any);

    reservationService = new ReservationManagementService(
      mockEventStore,
      mockInventoryService,
      mockLogger as any,
    );
  });

  describe('Goods Receipt Notes (GRN) Processing', () => {
    it('should process GRN successfully', async () => {
      const grn = {
        grnId: 'grn-001',
        purchaseOrderId: 'po-001',
        vendorId,
        receivedDate: new Date(),
        items: [
          {
            sku,
            quantity: 50,
            unitCost: 10.5,
            location: warehouseLocation,
            batchNumber: 'BATCH-001',
          },
        ],
        tenantId,
        userId: userId,
      };

      const result = await procurementService.processGoodsReceipt(grn);

      expect(result.status).toBe('SUCCESS');
      expect(result.processedItems).toBe(1);
      expect(result.totalItems).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(mockInventoryService.receiveStock).toHaveBeenCalledTimes(1);
      expect(mockEventStore.append).toHaveBeenCalledTimes(1);
    });

    it('should handle partial GRN processing', async () => {
      mockInventoryService.receiveStock.mockRejectedValueOnce(new Error('Item not found'));

      const grn = {
        grnId: 'grn-002',
        purchaseOrderId: 'po-002',
        vendorId,
        receivedDate: new Date(),
        items: [
          {
            sku: 'SKU-001',
            quantity: 50,
            unitCost: 10.5,
            location: warehouseLocation,
          },
          {
            sku: 'SKU-002',
            quantity: 25,
            unitCost: 15.0,
            location: warehouseLocation,
          },
        ],
        tenantId,
        userId: userId,
      };

      const result = await procurementService.processGoodsReceipt(grn);

      expect(result.status).toBe('PARTIAL');
      expect(result.processedItems).toBe(1);
      expect(result.totalItems).toBe(2);
      expect(result.errors).toHaveLength(1);
    });

    it('should validate purchase order correctly', async () => {
      const validation = await procurementService.validatePurchaseOrder(
        'po-001',
        sku,
        50,
        tenantId,
      );

      expect(validation.isValid).toBe(true);
      expect(validation.availableStock).toBe(100);
      expect(validation.shortfall).toBeUndefined();
    });

    it('should detect insufficient stock for purchase order', async () => {
      mockInventoryService.getCurrentStock.mockResolvedValue(30);

      const validation = await procurementService.validatePurchaseOrder(
        'po-002',
        sku,
        50,
        tenantId,
      );

      expect(validation.isValid).toBe(false);
      expect(validation.availableStock).toBe(30);
      expect(validation.shortfall).toBe(20);
    });
  });

  describe('Vendor Management Integration', () => {
    it('should update vendor inventory successfully', async () => {
      const vendorData = {
        vendorId,
        sku,
        vendorSku: vendorSku,
        vendorName: vendorName,
        leadTime: 7,
        minimumOrderQuantity: 100,
        priceBreaks: [
          {
            quantity: 100,
            unitPrice: 10.0,
            effectiveDate: new Date(),
          },
        ],
        isActive: true,
        tenantId,
      };

      await vendorService.updateVendorInventory(vendorData);

      expect(mockInventoryService.updateVendorInformation).toHaveBeenCalledWith({
        sku,
        vendorId,
        vendorSku: vendorSku,
        vendorName: vendorName,
        leadTime: 7,
        minimumOrderQuantity: 100,
        tenantId,
      });
      expect(mockEventStore.append).toHaveBeenCalledTimes(1);
    });

    it('should get vendor inventory', async () => {
      const vendorInventory = await vendorService.getVendorInventory(vendorId, tenantId);

      expect(mockInventoryService.getInventoryByVendor).toHaveBeenCalledWith(vendorId, tenantId);
      expect(Array.isArray(vendorInventory)).toBe(true);
    });

    it('should update vendor pricing', async () => {
      const pricingUpdates = [
        {
          sku,
          customerPrice: 12.0,
          discountPercentage: 10,
        },
      ];

      await vendorService.updateVendorPricing(vendorId, pricingUpdates, tenantId);

      expect(mockInventoryService.updateVendorPricing).toHaveBeenCalledWith({
        sku,
        vendorId,
        customerPrice: 12.0,
        discountPercentage: 10,
        tenantId,
      });
    });
  });

  describe('Warehouse Management', () => {
    it('should create warehouse successfully', async () => {
      const createCommand = {
        warehouseId,
        warehouseName: 'Test Warehouse',
        warehouseCode: 'TW001',
        address: {
          street: '123 Main St',
          city: 'Test City',
          state: 'TS',
          postalCode: '12345',
          country: 'Test Country',
        },
        tenantId,
      };

      await warehouseService.createWarehouse(createCommand);

      expect(mockEventStore.append).toHaveBeenCalledTimes(1);
    });

    it('should get location utilization', async () => {
      const utilization = await warehouseService.getLocationUtilization(warehouseId, tenantId);

      expect(mockInventoryService.getAllStockLevelsForWarehouse).toHaveBeenCalledWith(
        warehouseId,
        tenantId,
      );
      expect(Array.isArray(utilization)).toBe(true);
    });
  });

  describe('Batch Tracking', () => {
    it('should create batch successfully', async () => {
      const createCommand = {
        batchId,
        sku,
        batchNumber: 'BATCH-001',
        manufacturingDate: new Date('2024-01-01'),
        expiryDate: new Date('2024-12-31'),
        quantity: 100,
        location: warehouseLocation,
        tenantId,
      };

      await batchService.createBatch(createCommand);

      expect(mockEventStore.append).toHaveBeenCalledTimes(1);
    });

    it('should get expiring items', async () => {
      const expiringItems = await batchService.getExpiringItems(30, tenantId);

      expect(Array.isArray(expiringItems)).toBe(true);
    });

    it('should track serial number', async () => {
      const trackCommand = {
        serialNumber: 'SN001',
        sku,
        batchId,
        location: warehouseLocation,
        status: 'AVAILABLE' as any,
        tenantId,
      };

      await batchService.trackSerialNumber(trackCommand);

      expect(mockEventStore.append).toHaveBeenCalledTimes(1);
    });
  });

  describe('Stock Reservation Management', () => {
    it('should reserve stock successfully', async () => {
      const reserveCommand = {
        reservationId,
        sku,
        quantity: 25,
        location: warehouseLocation,
        orderId: orderId,
        customerId: customerId,
        reservedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        tenantId,
      };

      await reservationService.reserveStock(reserveCommand);

      expect(mockInventoryService.getAvailableStock).toHaveBeenCalledWith(
        sku,
        warehouseLocation,
        tenantId,
      );
      expect(mockEventStore.append).toHaveBeenCalledTimes(1);
    });

    it('should throw error for insufficient stock reservation', async () => {
      mockInventoryService.getAvailableStock.mockResolvedValue(10);

      const reserveCommand = {
        reservationId,
        sku,
        quantity: 25,
        location: warehouseLocation,
        orderId: orderId,
        customerId: customerId,
        reservedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        tenantId,
      };

      await expect(reservationService.reserveStock(reserveCommand)).rejects.toThrow(
        'Insufficient stock for reservation',
      );
    });

    it('should release reservation', async () => {
      await reservationService.releaseReservation(reservationId, tenantId);

      expect(mockEventStore.append).toHaveBeenCalledTimes(1);
    });

    it('should get reserved stock quantity', async () => {
      const reservedQuantity = await reservationService.getReservedStock(
        sku,
        warehouseLocation,
        tenantId,
      );

      expect(typeof reservedQuantity).toBe('number');
    });
  });

  describe('Integration Workflows', () => {
    it('should handle complete procurement workflow', async () => {
      // 1. Create warehouse
      const createWarehouseCommand = {
        warehouseId,
        warehouseName: 'Test Warehouse',
        warehouseCode: 'TW001',
        address: {
          street: '123 Main St',
          city: 'Test City',
          state: 'TS',
          postalCode: '12345',
          country: 'Test Country',
        },
        tenantId,
      };

      await warehouseService.createWarehouse(createWarehouseCommand);

      // 2. Update vendor information
      const vendorData = {
        vendorId,
        sku,
        vendorSku: vendorSku,
        vendorName: vendorName,
        leadTime: 7,
        minimumOrderQuantity: 100,
        priceBreaks: [],
        isActive: true,
        tenantId,
      };

      await vendorService.updateVendorInventory(vendorData);

      // 3. Process GRN
      const grn = {
        grnId: 'grn-001',
        purchaseOrderId: 'po-001',
        vendorId,
        receivedDate: new Date(),
        items: [
          {
            sku,
            quantity: 100,
            unitCost: 10.5,
            location: warehouseId,
            batchNumber: 'BATCH-001',
          },
        ],
        tenantId,
        userId: userId,
      };

      const grnResult = await procurementService.processGoodsReceipt(grn);

      // 4. Create batch
      const createBatchCommand = {
        batchId,
        sku,
        batchNumber: 'BATCH-001',
        manufacturingDate: new Date('2024-01-01'),
        expiryDate: new Date('2024-12-31'),
        quantity: 100,
        location: warehouseId,
        tenantId,
      };

      await batchService.createBatch(createBatchCommand);

      // 5. Reserve stock
      const reserveCommand = {
        reservationId,
        sku,
        quantity: 25,
        location: warehouseId,
        orderId: orderId,
        customerId: customerId,
        reservedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        tenantId,
      };

      await reservationService.reserveStock(reserveCommand);

      // Verify all operations completed successfully
      expect(grnResult.status).toBe('SUCCESS');
      expect(mockEventStore.append).toHaveBeenCalledTimes(5); // One for each operation
    });
  });
});
