import type {
  BackorderData,
  BackorderItem,
  BackorderPriority,
  BackorderStatus,
  FulfillmentPlan,
} from '../domain/backorder';
import type { EventStore } from '../infrastructure/event-store/event-store';
import type { InventoryService } from './inventory.service';
import type { Logger } from '@nestjs/common';

/* eslint-disable no-unused-vars */
import { Backorder } from '../domain/backorder';
import { Injectable } from '@nestjs/common';

const WAREHOUSE_A = 'WAREHOUSE-A';

@Injectable()
export class BackorderManagementService {
  constructor(
    private readonly _inventoryService: InventoryService,

    private readonly _eventStore: EventStore,

    private readonly _logger: Logger,
  ) {}

  async createBackorder(backorderData: BackorderData): Promise<void> {
    this._logger.log(`Creating backorder: ${backorderData.backorderId}`);

    const backorder = new Backorder(
      backorderData.backorderId,
      backorderData.orderId,
      backorderData.customerId,
      backorderData.backorderDate,
      backorderData.items,
      backorderData.expectedFulfillmentDate,
      backorderData.status,
      backorderData.tenantId,
    );

    await this._eventStore.append(
      `backorder-${backorderData.backorderId}`,
      backorder.getUncommittedEvents(),
      backorder.getVersion(),
    );

    backorder.markEventsAsCommitted();
  }

  async fulfillBackorderPartially(
    backorderId: string,
    fulfilledItems: BackorderItem[],
    tenantId: string,
  ): Promise<void> {
    this._logger.log(`Partially fulfilling backorder: ${backorderId}`);

    const backorder = await this._loadBackorder(backorderId, tenantId);
    backorder.fulfillPartially(fulfilledItems);

    await this._eventStore.append(
      `backorder-${backorderId}`,
      backorder.getUncommittedEvents(),
      backorder.getVersion(),
    );

    backorder.markEventsAsCommitted();
  }

  async fulfillBackorderCompletely(backorderId: string, tenantId: string): Promise<void> {
    this._logger.log(`Completely fulfilling backorder: ${backorderId}`);

    const backorder = await this._loadBackorder(backorderId, tenantId);
    backorder.fulfillCompletely();

    await this._eventStore.append(
      `backorder-${backorderId}`,
      backorder.getUncommittedEvents(),
      backorder.getVersion(),
    );

    backorder.markEventsAsCommitted();
  }

  async cancelBackorder(backorderId: string, tenantId: string): Promise<void> {
    this._logger.log(`Cancelling backorder: ${backorderId}`);

    const backorder = await this._loadBackorder(backorderId, tenantId);
    backorder.cancel();

    await this._eventStore.append(
      `backorder-${backorderId}`,
      backorder.getUncommittedEvents(),
      backorder.getVersion(),
    );

    backorder.markEventsAsCommitted();
  }

  async updateFulfillmentDate(
    backorderId: string,
    newFulfillmentDate: Date,
    tenantId: string,
  ): Promise<void> {
    this._logger.log(`Updating fulfillment date for backorder: ${backorderId}`);

    const backorder = await this._loadBackorder(backorderId, tenantId);
    backorder.updateExpectedFulfillmentDate(newFulfillmentDate);

    await this._eventStore.append(
      `backorder-${backorderId}`,
      backorder.getUncommittedEvents(),
      backorder.getVersion(),
    );

    backorder.markEventsAsCommitted();
  }

  async getBackordersByCustomer(customerId: string, tenantId: string): Promise<BackorderData[]> {
    this._logger.log(`Getting backorders for customer: ${customerId}`);

    // For now, return mock data - in production this would query the database
    const mockBackorders: BackorderData[] = [
      {
        backorderId: `backorder-${customerId}-001`,
        orderId: `order-${customerId}-001`,
        customerId,
        backorderDate: new Date(),
        items: [
          {
            sku: 'SKU-001',
            quantity: 50,
            unitPrice: 25.0,
            location: WAREHOUSE_A,
            priority: 'HIGH' as BackorderPriority,
          },
        ],
        expectedFulfillmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'PENDING' as BackorderStatus,
        tenantId,
      },
    ];

    return mockBackorders;
  }

  async getBackordersByPriority(
    priority: BackorderPriority,
    tenantId: string,
  ): Promise<BackorderData[]> {
    this._logger.log(`Getting backorders by priority: ${priority}`);

    // For now, return mock data - in production this would query the database
    const mockBackorders: BackorderData[] = [
      {
        backorderId: `backorder-urgent-001`,
        orderId: 'order-urgent-001',
        customerId: 'customer-urgent-001',
        backorderDate: new Date(),
        items: [
          {
            sku: 'SKU-URGENT-001',
            quantity: 100,
            unitPrice: 50.0,
            location: WAREHOUSE_A,
            priority,
          },
        ],
        expectedFulfillmentDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        status: 'PENDING' as BackorderStatus,
        tenantId,
      },
    ];

    return mockBackorders;
  }

  async generateFulfillmentPlan(backorderId: string, tenantId: string): Promise<FulfillmentPlan> {
    this._logger.log(`Generating fulfillment plan for backorder: ${backorderId}`);

    const backorder = await this._loadBackorder(backorderId, tenantId);

    // For now, return mock data - in production this would analyze inventory and generate a plan
    return {
      backorderId,
      fulfillmentDate: backorder._expectedFulfillmentDate,
      itemsToFulfill: backorder._items,
      sourceLocation: WAREHOUSE_A,
      notes: 'Generated fulfillment plan based on current inventory levels',
    };
  }

  private async _loadBackorder(backorderId: string, tenantId: string): Promise<Backorder> {
    // For now, return mock data - in production this would load from event store
    const mockBackorderData: BackorderData = {
      backorderId,
      orderId: 'order-001',
      customerId: 'customer-001',
      backorderDate: new Date(),
      items: [
        {
          sku: 'SKU-001',
          quantity: 50,
          unitPrice: 25.0,
          location: WAREHOUSE_A,
          priority: 'HIGH' as BackorderPriority,
        },
      ],
      expectedFulfillmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'PENDING' as BackorderStatus,
      tenantId,
    };

    return new Backorder(
      mockBackorderData.backorderId,
      mockBackorderData.orderId,
      mockBackorderData.customerId,
      mockBackorderData.backorderDate,
      mockBackorderData.items,
      mockBackorderData.expectedFulfillmentDate,
      mockBackorderData.status,
      mockBackorderData.tenantId,
    );
  }
}
