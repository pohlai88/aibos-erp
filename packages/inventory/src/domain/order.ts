/* eslint-disable no-unused-vars */
import { OrderCancelledEvent, OrderFulfillmentStartedEvent } from '../events/order-events';
import { BusinessRuleViolation } from '../exceptions/business-rule-violation';
import { AggregateRoot } from './aggregate-root';
import { DomainEvent } from './domain-event';

export interface OrderAddress {
  readonly street: string;
  readonly city: string;
  readonly state: string;
  readonly postalCode: string;
  readonly country: string;
}

export interface OrderLine {
  readonly sku: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly location: string;
  readonly unitCost: number;
}

export interface OrderData {
  readonly orderId: string;
  readonly customerId: string;
  readonly orderNumber: string;
  readonly orderDate: Date;
  readonly lines: OrderLine[];
  readonly shippingAddress: OrderAddress;
  readonly tenantId: string;
}

export interface AvailabilityCheck {
  readonly isAvailable: boolean;
  readonly unavailableItems: UnavailableItem[];
}

export interface UnavailableItem {
  readonly sku: string;
  readonly required: number;
  readonly available: number;
  readonly shortfall: number;
}

export interface OrderProcessingResult {
  readonly orderId: string;
  readonly status: OrderProcessingStatus;
  readonly message: string;
  readonly unavailableItems?: UnavailableItem[];
  readonly allocatedItems?: OrderLine[];
}

export enum OrderProcessingStatus {
  SUCCESS = 'SUCCESS',
  INSUFFICIENT_INVENTORY = 'INSUFFICIENT_INVENTORY',
  ERROR = 'ERROR',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  INVENTORY_ALLOCATED = 'INVENTORY_ALLOCATED',
  FULFILLMENT_IN_PROGRESS = 'FULFILLMENT_IN_PROGRESS',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export class Order extends AggregateRoot {
  constructor(
    public readonly _orderId: string,

    public readonly _customerId: string,

    public readonly _orderNumber: string,

    public readonly _orderDate: Date,
    public _status: OrderStatus,

    public readonly _lines: OrderLine[],

    public readonly _shippingAddress: OrderAddress,

    public readonly _tenantId: string,
  ) {
    super();
  }

  public allocateInventory(): void {
    this.validateInventoryAllocation();

    for (const line of this._lines) {
      this.addEvent(
        new OrderInventoryAllocatedEvent(
          this._orderId,
          line.sku,
          line.quantity,
          line.location,
          this._tenantId,
          this.version + 1,
        ),
      );
    }

    this._status = OrderStatus.INVENTORY_ALLOCATED;
  }

  public startFulfillment(): void {
    if (this._status !== OrderStatus.INVENTORY_ALLOCATED) {
      throw new BusinessRuleViolation('Order must have inventory allocated before fulfillment');
    }

    this.addEvent(
      new OrderFulfillmentStartedEvent(
        this._orderId,
        'fulfillment-' + this._orderId, // Generate fulfillment ID
        this._customerId,
        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        this._tenantId,
        this.version + 1,
      ),
    );

    this._status = OrderStatus.FULFILLMENT_IN_PROGRESS;
  }

  public cancel(): void {
    this.addEvent(
      new OrderCancelledEvent(this._orderId, this._customerId, this._tenantId, this.version + 1),
    );

    this._status = OrderStatus.CANCELLED;
  }

  private validateInventoryAllocation(): void {
    if (this._status !== OrderStatus.PENDING) {
      throw new BusinessRuleViolation('Only pending orders can have inventory allocated');
    }
  }
}

export class OrderInventoryAllocatedEvent extends DomainEvent {
  constructor(
    public readonly _orderId: string,

    public readonly _sku: string,

    public readonly _quantity: number,

    public readonly _location: string,

    public readonly _tenantId: string,

    public readonly _version: number,
  ) {
    super();
  }

  public override getEventType(): string {
    return 'OrderInventoryAllocated';
  }

  public override getAggregateId(): string {
    return this._orderId;
  }

  public override getTenantId(): string {
    return this._tenantId;
  }

  public override getOccurredAt(): Date {
    return this.occurredAt;
  }
}

// Event classes moved to ./events/order-events.ts to avoid duplicate exports
