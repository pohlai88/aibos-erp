/* eslint-disable no-unused-vars */
import { BusinessRuleViolation } from '../exceptions/business-rule-violation';
import { AggregateRoot } from './aggregate-root';
import { DomainEvent } from './domain-event';

export interface FulfillmentItem {
  readonly sku: string;
  readonly quantity: number;
  readonly location: string;
}

export interface ShippingMethod {
  readonly method: string;
  readonly carrier: string;
  readonly estimatedDays: number;
}

export interface ShippingInfo {
  readonly trackingNumber: string;
  readonly status: string;
  readonly estimatedDelivery: Date;
  readonly carrier: string;
}

export interface StartFulfillmentCommand {
  readonly fulfillmentId: string;
  readonly orderId: string;
  readonly customerId: string;
  readonly items: FulfillmentItem[];
  readonly shippingMethod: ShippingMethod;
  readonly trackingNumber: string;
  readonly tenantId: string;
}

export interface FulfillmentTracking {
  readonly fulfillmentId: string;
  readonly orderId: string;
  readonly status: FulfillmentStatus;
  readonly trackingNumber: string;
  readonly shippingInfo: ShippingInfo;
  readonly estimatedDelivery: Date;
  readonly lastUpdated: Date;
}

export enum FulfillmentStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
}

export class Fulfillment extends AggregateRoot {
  constructor(
    public readonly _fulfillmentId: string,
    public readonly _orderId: string,
    public readonly _customerId: string,
    public _status: FulfillmentStatus,
    public readonly _items: FulfillmentItem[],
    public readonly _shippingMethod: ShippingMethod,
    public readonly _trackingNumber: string,
    public readonly _tenantId: string,
  ) {
    super();
  }

  public completeFulfillment(): void {
    this.validateFulfillmentCompletion();

    for (const item of this._items) {
      this.addEvent(
        new FulfillmentCompletedEvent(
          this._fulfillmentId,
          this._orderId,
          item.sku,
          item.quantity,
          item.location,
          this._tenantId,
          this.version + 1,
        ),
      );
    }

    this._status = FulfillmentStatus.COMPLETED;
  }

  public markAsShipped(): void {
    this.addEvent(
      new FulfillmentShippedEvent(
        this._fulfillmentId,
        this._orderId,
        this._trackingNumber,
        this._tenantId,
        this.version + 1,
      ),
    );

    this._status = FulfillmentStatus.SHIPPED;
  }

  private validateFulfillmentCompletion(): void {
    if (this._status !== FulfillmentStatus.IN_PROGRESS) {
      throw new BusinessRuleViolation('Only in-progress fulfillments can be completed');
    }
  }
}

export class FulfillmentCompletedEvent extends DomainEvent {
  constructor(
    public readonly _fulfillmentId: string,
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
    return 'FulfillmentCompleted';
  }

  public override getAggregateId(): string {
    return this._fulfillmentId;
  }

  public override getTenantId(): string {
    return this._tenantId;
  }

  public override getOccurredAt(): Date {
    return this.occurredAt;
  }
}

export class FulfillmentShippedEvent extends DomainEvent {
  constructor(
    public readonly _fulfillmentId: string,
    public readonly _orderId: string,
    public readonly _trackingNumber: string,
    public readonly _tenantId: string,
    public readonly _version: number,
  ) {
    super();
  }

  public override getEventType(): string {
    return 'FulfillmentShipped';
  }

  public override getAggregateId(): string {
    return this._fulfillmentId;
  }

  public override getTenantId(): string {
    return this._tenantId;
  }

  public override getOccurredAt(): Date {
    return this.occurredAt;
  }
}
