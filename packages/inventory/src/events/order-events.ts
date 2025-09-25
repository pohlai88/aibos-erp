/* eslint-disable no-unused-vars */
import { DomainEvent } from '../domain/domain-event';

export class OrderCreatedEvent extends DomainEvent {
  constructor(
    public readonly _orderId: string,
    public readonly _customerId: string,
    public readonly _orderNumber: string,
    public readonly _orderDate: Date,
    public readonly _totalValue: number,
    public readonly _tenantId: string,
    public readonly _version: number,
  ) {
    super();
  }

  public override getEventType(): string {
    return 'OrderCreated';
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

export class OrderStatusUpdatedEvent extends DomainEvent {
  constructor(
    public readonly _orderId: string,
    public readonly _previousStatus: string,
    public readonly _newStatus: string,
    public readonly _reason: string,
    public readonly _tenantId: string,
    public readonly _version: number,
  ) {
    super();
  }

  public override getEventType(): string {
    return 'OrderStatusUpdated';
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

export class OrderFulfillmentStartedEvent extends DomainEvent {
  constructor(
    public readonly _orderId: string,
    public readonly _fulfillmentId: string,
    public readonly _customerId: string,
    public readonly _estimatedDeliveryDate: Date,
    public readonly _tenantId: string,
    public readonly _version: number,
  ) {
    super();
  }

  public override getEventType(): string {
    return 'OrderFulfillmentStarted';
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

export class OrderFulfillmentCompletedEvent extends DomainEvent {
  constructor(
    public readonly _orderId: string,
    public readonly _fulfillmentId: string,
    public readonly _customerId: string,
    public readonly _actualDeliveryDate: Date,
    public readonly _tenantId: string,
    public readonly _version: number,
  ) {
    super();
  }

  public override getEventType(): string {
    return 'OrderFulfillmentCompleted';
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

export class OrderBackorderCreatedEvent extends DomainEvent {
  constructor(
    public readonly _orderId: string,
    public readonly _backorderId: string,
    public readonly _customerId: string,
    public readonly _unavailableItems: Array<{ sku: string; quantity: number }>,
    public readonly _expectedFulfillmentDate: Date,
    public readonly _tenantId: string,
    public readonly _version: number,
  ) {
    super();
  }

  public override getEventType(): string {
    return 'OrderBackorderCreated';
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

export class OrderCancelledEvent extends DomainEvent {
  constructor(
    public readonly _orderId: string,
    public readonly _customerId: string,
    public readonly _tenantId: string,
    public readonly _version: number,
  ) {
    super();
  }

  public override getEventType(): string {
    return 'OrderCancelled';
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

export class OrderPaymentReceivedEvent extends DomainEvent {
  constructor(
    public readonly _orderId: string,
    public readonly _customerId: string,
    public readonly _paymentAmount: number,
    public readonly _paymentMethod: string,
    public readonly _paymentDate: Date,
    public readonly _tenantId: string,
    public readonly _version: number,
  ) {
    super();
  }

  public override getEventType(): string {
    return 'OrderPaymentReceived';
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
