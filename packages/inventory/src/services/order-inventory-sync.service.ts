import type { EventStore } from '../infrastructure/event-store/event-store';
import type { OrderManagementIntegrationService } from '../integrations/order-management-integration.service';
import type { BackorderManagementService } from './backorder-management.service';
import type { InventoryService } from './inventory.service';
import type { Logger } from '@nestjs/common';

import { BackorderPriority, BackorderStatus } from '../domain/backorder';
/* eslint-disable no-unused-vars */
import { Injectable } from '@nestjs/common';

const UNKNOWN_ERROR = 'Unknown error';

export interface SyncEvent {
  readonly eventType: string;
  readonly aggregateId: string;
  readonly tenantId: string;
  readonly occurredAt: Date;
  readonly data: unknown;
}

export interface InventorySyncStatus {
  readonly isSynced: boolean;
  readonly lastSyncDate: Date;
  readonly pendingEvents: number;
  readonly errors: string[];
}

export interface OrderInventorySyncResult {
  readonly orderId: string;
  readonly syncStatus: InventorySyncStatus;
  readonly inventoryImpact: {
    readonly reservedQuantity: number;
    readonly availableQuantity: number;
    readonly backorderCreated: boolean;
  };
}

@Injectable()
export class OrderInventorySyncService {
  constructor(
    private readonly _inventoryService: InventoryService,

    private readonly _orderManagementService: OrderManagementIntegrationService,

    private readonly _backorderManagementService: BackorderManagementService,

    private readonly _eventStore: EventStore,

    private readonly _logger: Logger,
  ) {}

  async syncOrderWithInventory(
    orderId: string,
    tenantId: string,
  ): Promise<OrderInventorySyncResult> {
    this._logger.log(`Syncing order ${orderId} with inventory`);

    try {
      // Get order data
      const orderData = await this._getOrderData(orderId, tenantId);

      // Check inventory availability
      const inventoryStatus = await this._checkInventoryAvailability(orderData, tenantId);

      // Process inventory allocation or backorder creation
      const inventoryImpact = await this._processInventoryImpact(
        orderData,
        inventoryStatus,
        tenantId,
      );

      // Update sync status
      const syncStatus: InventorySyncStatus = {
        isSynced: true,
        lastSyncDate: new Date(),
        pendingEvents: 0,
        errors: [],
      };

      return {
        orderId,
        syncStatus,
        inventoryImpact,
      };
    } catch (error) {
      this._logger.error(`Error syncing order ${orderId}:`, error);

      const syncStatus: InventorySyncStatus = {
        isSynced: false,
        lastSyncDate: new Date(),
        pendingEvents: 1,
        errors: [error instanceof Error ? error.message : UNKNOWN_ERROR],
      };

      return {
        orderId,
        syncStatus,
        inventoryImpact: {
          reservedQuantity: 0,
          availableQuantity: 0,
          backorderCreated: false,
        },
      };
    }
  }

  async syncInventoryWithOrders(tenantId: string): Promise<{
    syncedOrders: number;
    createdBackorders: number;
    errors: string[];
  }> {
    this._logger.log('Syncing inventory with all pending orders');

    const results = {
      syncedOrders: 0,
      createdBackorders: 0,
      errors: [] as string[],
    };

    try {
      // Get all pending orders
      const pendingOrders = await this._getPendingOrders(tenantId);

      for (const order of pendingOrders) {
        try {
          const syncResult = await this.syncOrderWithInventory(order.orderId, tenantId);

          if (syncResult.syncStatus.isSynced) {
            results.syncedOrders++;
            if (syncResult.inventoryImpact.backorderCreated) {
              results.createdBackorders++;
            }
          } else {
            results.errors.push(`Failed to sync order ${order.orderId}`);
          }
        } catch (error) {
          results.errors.push(
            `Error syncing order ${order.orderId}: ${error instanceof Error ? error.message : UNKNOWN_ERROR}`,
          );
        }
      }
    } catch (error) {
      results.errors.push(
        `Error getting pending orders: ${error instanceof Error ? error.message : UNKNOWN_ERROR}`,
      );
    }

    return results;
  }

  async handleInventoryUpdate(sku: string, location: string, tenantId: string): Promise<void> {
    this._logger.log(`Handling inventory update for SKU: ${sku}, Location: ${location}`);

    try {
      // Check if there are any backorders for this SKU
      const backorders = await this._getBackordersForSku(sku, tenantId);

      for (const backorder of backorders) {
        // Check if we can now fulfill the backorder
        const canFulfill = await this._canFulfillBackorder(backorder, tenantId);

        if (canFulfill) {
          await this._fulfillBackorder(backorder, tenantId);
        }
      }
    } catch (error) {
      this._logger.error(`Error handling inventory update for SKU ${sku}:`, error);
    }
  }

  private async _getOrderData(
    orderId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    tenantId: string,
  ): Promise<{
    orderId: string;
    customerId: string;
    items: Array<{ sku: string; quantity: number; location: string }>;
  }> {
    // For now, return mock data - in production this would load from order service
    return {
      orderId,
      customerId: 'customer-001',
      items: [
        {
          sku: 'SKU-001',
          quantity: 50,
          location: 'WAREHOUSE-A',
        },
      ],
    };
  }

  private async _checkInventoryAvailability(
    orderData: { items: Array<{ sku: string; quantity: number; location: string }> },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    tenantId: string,
  ): Promise<{
    isAvailable: boolean;
    unavailableItems: Array<{ sku: string; required: number; available: number }>;
  }> {
    const unavailableItems: Array<{ sku: string; required: number; available: number }> = [];

    for (const item of orderData.items) {
      // For now, return mock data - in production this would check actual inventory
      const availableStock = 30; // Mock available stock

      if (availableStock < item.quantity) {
        unavailableItems.push({
          sku: item.sku,
          required: item.quantity,
          available: availableStock,
        });
      }
    }

    return {
      isAvailable: unavailableItems.length === 0,
      unavailableItems,
    };
  }

  private async _processInventoryImpact(
    orderData: {
      orderId: string;
      customerId: string;
      items: Array<{ sku: string; quantity: number; location: string }>;
    },
    inventoryStatus: {
      isAvailable: boolean;
      unavailableItems: Array<{ sku: string; required: number; available: number }>;
    },
    tenantId: string,
  ): Promise<{
    reservedQuantity: number;
    availableQuantity: number;
    backorderCreated: boolean;
  }> {
    if (inventoryStatus.isAvailable) {
      // Reserve inventory for the order
      const totalReserved = orderData.items.reduce((sum, item) => sum + item.quantity, 0);

      return {
        reservedQuantity: totalReserved,
        availableQuantity: 0,
        backorderCreated: false,
      };
    } else {
      // Create backorder
      await this._createBackorderForUnavailableItems(
        orderData,
        inventoryStatus.unavailableItems,
        tenantId,
      );

      return {
        reservedQuantity: 0,
        availableQuantity: inventoryStatus.unavailableItems.reduce(
          (sum, item) => sum + item.available,
          0,
        ),
        backorderCreated: true,
      };
    }
  }

  private async _createBackorderForUnavailableItems(
    orderData: { orderId: string; customerId: string },
    unavailableItems: Array<{ sku: string; required: number; available: number }>,
    tenantId: string,
  ): Promise<void> {
    const backorderData = {
      backorderId: `backorder-${orderData.orderId}`,
      orderId: orderData.orderId,
      customerId: orderData.customerId,
      backorderDate: new Date(),
      items: unavailableItems.map((item) => ({
        sku: item.sku,
        quantity: item.required - item.available,
        unitPrice: 25.0, // Mock price
        location: 'WAREHOUSE-A',
        priority: BackorderPriority.HIGH,
      })),
      expectedFulfillmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: BackorderStatus.PENDING,
      tenantId,
    };

    await this._backorderManagementService.createBackorder(backorderData);
  }

  private async _getPendingOrders(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    tenantId: string,
  ): Promise<Array<{ orderId: string }>> {
    // For now, return mock data - in production this would query the order service
    return [{ orderId: 'order-001' }, { orderId: 'order-002' }];
  }

  private async _getBackordersForSku(
    sku: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    tenantId: string,
  ): Promise<Array<{ backorderId: string }>> {
    // For now, return mock data - in production this would query backorders
    return [{ backorderId: `backorder-${sku}-001` }];
  }

  private async _canFulfillBackorder(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    backorder: { backorderId: string },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    tenantId: string,
  ): Promise<boolean> {
    // For now, return mock data - in production this would check actual inventory
    return true;
  }

  private async _fulfillBackorder(
    backorder: { backorderId: string },
    tenantId: string,
  ): Promise<void> {
    await this._backorderManagementService.fulfillBackorderCompletely(
      backorder.backorderId,
      tenantId,
    );
  }
}
