import type { StartFulfillmentCommand, FulfillmentTracking } from '../domain/fulfillment';
import type { EventStore } from '../infrastructure/event-store/event-store';
import type { InventoryService } from './inventory.service';
import type { Logger } from '@nestjs/common';

import { Fulfillment } from '../domain/fulfillment';
/* eslint-disable no-unused-vars */
import { Injectable } from '@nestjs/common';

@Injectable()
export class OrderFulfillmentService {
  constructor(
    private readonly _inventoryService: InventoryService,

    private readonly _eventStore: EventStore,

    private readonly _logger: Logger,
  ) {}

  async startFulfillment(command: StartFulfillmentCommand): Promise<void> {
    this._logger.log(`Starting fulfillment for order: ${command.orderId}`);

    const fulfillment = new Fulfillment(
      command.fulfillmentId,
      command.orderId,
      command.customerId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      'IN_PROGRESS' as any, // FulfillmentStatus.IN_PROGRESS
      command.items,
      command.shippingMethod,
      command.trackingNumber,
      command.tenantId,
    );

    // Consume reserved inventory
    await this._consumeReservedInventory(command);

    await this._eventStore.append(
      `fulfillment-${command.fulfillmentId}`,
      fulfillment.getUncommittedEvents(),
      fulfillment.getVersion(),
    );

    fulfillment.markEventsAsCommitted();
  }

  async completeFulfillment(fulfillmentId: string, tenantId: string): Promise<void> {
    this._logger.log(`Completing fulfillment: ${fulfillmentId}`);

    const fulfillment = await this._loadFulfillment(fulfillmentId, tenantId);
    fulfillment.completeFulfillment();

    // Update inventory with actual consumption
    await this._updateInventoryConsumption(fulfillment);

    await this._eventStore.append(
      `fulfillment-${fulfillmentId}`,
      fulfillment.getUncommittedEvents(),
      fulfillment.getVersion(),
    );

    fulfillment.markEventsAsCommitted();
  }

  async trackFulfillment(fulfillmentId: string, tenantId: string): Promise<FulfillmentTracking> {
    const fulfillment = await this._loadFulfillment(fulfillmentId, tenantId);
    const shippingInfo = await this._getTrackingInfo(fulfillment._trackingNumber);

    return {
      fulfillmentId,
      orderId: fulfillment._orderId,
      status: fulfillment._status,
      trackingNumber: fulfillment._trackingNumber,
      shippingInfo,
      estimatedDelivery: shippingInfo.estimatedDelivery,
      lastUpdated: new Date(),
    };
  }

  private async _consumeReservedInventory(command: StartFulfillmentCommand): Promise<void> {
    for (const item of command.items) {
      // For now, log the action - in production this would consume reserved stock
      this._logger.log(
        `Consuming reserved stock: ${item.sku}, quantity: ${item.quantity}, location: ${item.location}`,
      );
    }
  }

  private async _updateInventoryConsumption(fulfillment: Fulfillment): Promise<void> {
    for (const item of fulfillment._items) {
      await this._inventoryService.issueStock({
        movementId: `fulfillment-${fulfillment._fulfillmentId}-${item.sku}`,
        sku: item.sku,
        quantity: item.quantity,
        location: item.location,
        reference: fulfillment._orderId,
        tenantId: fulfillment._tenantId,
        userId: 'system',
      });
    }
  }

  private async _getTrackingInfo(trackingNumber: string): Promise<{
    trackingNumber: string;
    status: string;
    estimatedDelivery: Date;
    carrier: string;
  }> {
    // For now, return mock data - in production this would integrate with shipping carriers
    return {
      trackingNumber,
      status: 'In Transit',
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      carrier: 'FedEx',
    };
  }

  private async _loadFulfillment(fulfillmentId: string, tenantId: string): Promise<Fulfillment> {
    // For now, return mock data - in production this would load from event store
    return new Fulfillment(
      fulfillmentId,
      'order-001',
      'customer-001',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      'IN_PROGRESS' as any, // FulfillmentStatus.IN_PROGRESS
      [
        {
          sku: 'SKU-001',
          quantity: 10,
          location: 'WAREHOUSE-A',
        },
      ],
      {
        method: 'Standard',
        carrier: 'FedEx',
        estimatedDays: 3,
      },
      'TRK123456789',
      tenantId,
    );
  }
}
