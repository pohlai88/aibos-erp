import type {
  OrderData,
  OrderProcessingResult,
  AvailabilityCheck,
  UnavailableItem,
} from '../domain/order';
import type { EventStore } from '../infrastructure/event-store/event-store';
import type { InventoryService } from '../services/inventory.service';
import type { ReservationManagementService } from '../services/reservation-management.service';
import type { Logger } from '@nestjs/common';

import { Order, OrderProcessingStatus } from '../domain/order';
/* eslint-disable no-unused-vars */
import { Injectable } from '@nestjs/common';

@Injectable()
export class OrderManagementIntegrationService {
  constructor(
    private readonly _inventoryService: InventoryService,

    private readonly _reservationManagementService: ReservationManagementService,

    private readonly _eventStore: EventStore,

    private readonly _logger: Logger,
  ) {}

  async processOrder(orderData: OrderData): Promise<OrderProcessingResult> {
    this._logger.log(`Processing order: ${orderData.orderId}`);

    try {
      // Validate inventory availability
      const availabilityCheck = await this._validateInventoryAvailability(orderData);
      if (!availabilityCheck.isAvailable) {
        return {
          orderId: orderData.orderId,
          status: OrderProcessingStatus.INSUFFICIENT_INVENTORY,
          unavailableItems: availabilityCheck.unavailableItems,
          message: 'Insufficient inventory for order fulfillment',
        };
      }

      // Create order aggregate
      const order = new Order(
        orderData.orderId,
        orderData.customerId,
        orderData.orderNumber,
        orderData.orderDate,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'PENDING' as any, // OrderStatus.PENDING
        orderData.lines,
        orderData.shippingAddress,
        orderData.tenantId,
      );

      // Allocate inventory
      order.allocateInventory();

      // Reserve stock
      await this._reserveStockForOrder(order);

      // Save order events
      await this._eventStore.append(
        `order-${orderData.orderId}`,
        order.getUncommittedEvents(),
        order.getVersion(),
      );

      order.markEventsAsCommitted();

      return {
        orderId: orderData.orderId,
        status: OrderProcessingStatus.SUCCESS,
        message: 'Order processed successfully',
        allocatedItems: orderData.lines,
      };
    } catch (error) {
      this._logger.error(`Error processing order ${orderData.orderId}:`, error);
      return {
        orderId: orderData.orderId,
        status: OrderProcessingStatus.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async startOrderFulfillment(orderId: string, tenantId: string): Promise<void> {
    this._logger.log(`Starting fulfillment for order: ${orderId}`);

    const order = await this._loadOrder(orderId, tenantId);
    order.startFulfillment();

    await this._eventStore.append(
      `order-${orderId}`,
      order.getUncommittedEvents(),
      order.getVersion(),
    );

    order.markEventsAsCommitted();
  }

  async cancelOrder(orderId: string, tenantId: string): Promise<void> {
    this._logger.log(`Cancelling order: ${orderId}`);

    const order = await this._loadOrder(orderId, tenantId);

    // Release reserved inventory
    await this._reservationManagementService.releaseOrderReservations(orderId, tenantId);

    // Update order status
    order.cancel();

    await this._eventStore.append(
      `order-${orderId}`,
      order.getUncommittedEvents(),
      order.getVersion(),
    );

    order.markEventsAsCommitted();
  }

  private async _validateInventoryAvailability(orderData: OrderData): Promise<AvailabilityCheck> {
    const unavailableItems: UnavailableItem[] = [];

    for (const line of orderData.lines) {
      const availableStock = await this._inventoryService.getAvailableStock(
        line.sku,
        line.location,
        orderData.tenantId,
      );

      if (availableStock < line.quantity) {
        unavailableItems.push({
          sku: line.sku,
          required: line.quantity,
          available: availableStock,
          shortfall: line.quantity - availableStock,
        });
      }
    }

    return {
      isAvailable: unavailableItems.length === 0,
      unavailableItems,
    };
  }

  private async _reserveStockForOrder(order: Order): Promise<void> {
    for (const line of order._lines) {
      await this._reservationManagementService.reserveStock({
        reservationId: `order-${order._orderId}-${line.sku}`,
        sku: line.sku,
        quantity: line.quantity,
        location: line.location,
        orderId: order._orderId,
        customerId: order._customerId,
        reservedUntil: this._calculateReservationExpiry(order._orderDate),
        tenantId: order._tenantId,
      });
    }
  }

  private _calculateReservationExpiry(orderDate: Date): Date {
    // Reserve for 7 days from order date
    return new Date(orderDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  private async _loadOrder(orderId: string, tenantId: string): Promise<Order> {
    // For now, return mock data - in production this would load from event store
    const mockOrderData: OrderData = {
      orderId,
      customerId: 'customer-001',
      orderNumber: `ORD-${orderId}`,
      orderDate: new Date(),
      lines: [
        {
          sku: 'SKU-001',
          quantity: 10,
          unitPrice: 50.0,
          location: 'WAREHOUSE-A',
          unitCost: 30.0,
        },
      ],
      shippingAddress: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        postalCode: '12345',
        country: 'USA',
      },
      tenantId,
    };

    return new Order(
      mockOrderData.orderId,
      mockOrderData.customerId,
      mockOrderData.orderNumber,
      mockOrderData.orderDate,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      'PENDING' as any, // OrderStatus.PENDING
      mockOrderData.lines,
      mockOrderData.shippingAddress,
      mockOrderData.tenantId,
    );
  }
}
