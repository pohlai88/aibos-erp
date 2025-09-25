/* eslint-disable no-unused-vars */
import { BusinessRuleViolation } from '../exceptions/business-rule-violation';
import { AggregateRoot } from './aggregate-root';
import { DomainEvent } from './domain-event';

export interface BackorderItem {
  readonly sku: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly location: string;
  readonly priority: BackorderPriority;
}

export interface BackorderData {
  readonly backorderId: string;
  readonly orderId: string;
  readonly customerId: string;
  readonly backorderDate: Date;
  readonly items: BackorderItem[];
  readonly expectedFulfillmentDate: Date;
  readonly status: BackorderStatus;
  readonly tenantId: string;
}

export enum BackorderPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum BackorderStatus {
  PENDING = 'PENDING',
  PARTIALLY_FULFILLED = 'PARTIALLY_FULFILLED',
  FULFILLED = 'FULFILLED',
  CANCELLED = 'CANCELLED',
}

export interface FulfillmentPlan {
  readonly backorderId: string;
  readonly fulfillmentDate: Date;
  readonly itemsToFulfill: BackorderItem[];
  readonly sourceLocation: string;
  readonly notes: string;
}

export class Backorder extends AggregateRoot {
  constructor(
    public readonly _backorderId: string,

    public readonly _orderId: string,

    public readonly _customerId: string,

    public readonly _backorderDate: Date,

    public readonly _items: BackorderItem[],

    public _expectedFulfillmentDate: Date,

    public _status: BackorderStatus,

    public readonly _tenantId: string,
  ) {
    super();
  }

  public fulfillPartially(fulfilledItems: BackorderItem[]): void {
    this.validatePartialFulfillment(fulfilledItems);

    for (const item of fulfilledItems) {
      this.addEvent(
        new BackorderPartiallyFulfilledEvent(
          this._backorderId,
          this._orderId,
          item.sku,
          item.quantity,
          this._tenantId,
          this.version + 1,
        ),
      );
    }

    this._status = BackorderStatus.PARTIALLY_FULFILLED;
  }

  public fulfillCompletely(): void {
    this.addEvent(
      new BackorderFulfilledEvent(
        this._backorderId,
        this._orderId,
        this._customerId,
        this._tenantId,
        this.version + 1,
      ),
    );

    this._status = BackorderStatus.FULFILLED;
  }

  public cancel(): void {
    this.addEvent(
      new BackorderCancelledEvent(
        this._backorderId,
        this._orderId,
        this._customerId,
        this._tenantId,
        this.version + 1,
      ),
    );

    this._status = BackorderStatus.CANCELLED;
  }

  public updateExpectedFulfillmentDate(newDate: Date): void {
    this.addEvent(
      new BackorderFulfillmentDateUpdatedEvent(
        this._backorderId,
        this._expectedFulfillmentDate,
        newDate,
        this._tenantId,
        this.version + 1,
      ),
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any)._expectedFulfillmentDate = newDate;
  }

  private validatePartialFulfillment(fulfilledItems: BackorderItem[]): void {
    if (this._status === BackorderStatus.CANCELLED) {
      throw new BusinessRuleViolation('Cannot fulfill a cancelled backorder');
    }

    if (this._status === BackorderStatus.FULFILLED) {
      throw new BusinessRuleViolation('Backorder is already fully fulfilled');
    }

    // Validate that fulfilled items exist in the backorder
    for (const fulfilledItem of fulfilledItems) {
      const backorderItem = this._items.find((item) => item.sku === fulfilledItem.sku);
      if (!backorderItem) {
        throw new BusinessRuleViolation(`Item ${fulfilledItem.sku} not found in backorder`);
      }
    }
  }
}

export class BackorderPartiallyFulfilledEvent extends DomainEvent {
  constructor(
    public readonly _backorderId: string,

    public readonly _orderId: string,

    public readonly _sku: string,

    public readonly _quantity: number,

    public readonly _tenantId: string,

    public readonly _version: number,
  ) {
    super();
  }

  public override getEventType(): string {
    return 'BackorderPartiallyFulfilled';
  }

  public override getAggregateId(): string {
    return this._backorderId;
  }

  public override getTenantId(): string {
    return this._tenantId;
  }

  public override getOccurredAt(): Date {
    return this.occurredAt;
  }
}

export class BackorderFulfilledEvent extends DomainEvent {
  constructor(
    public readonly _backorderId: string,

    public readonly _orderId: string,

    public readonly _customerId: string,

    public readonly _tenantId: string,

    public readonly _version: number,
  ) {
    super();
  }

  public override getEventType(): string {
    return 'BackorderFulfilled';
  }

  public override getAggregateId(): string {
    return this._backorderId;
  }

  public override getTenantId(): string {
    return this._tenantId;
  }

  public override getOccurredAt(): Date {
    return this.occurredAt;
  }
}

export class BackorderCancelledEvent extends DomainEvent {
  constructor(
    public readonly _backorderId: string,

    public readonly _orderId: string,

    public readonly _customerId: string,

    public readonly _tenantId: string,

    public readonly _version: number,
  ) {
    super();
  }

  public override getEventType(): string {
    return 'BackorderCancelled';
  }

  public override getAggregateId(): string {
    return this._backorderId;
  }

  public override getTenantId(): string {
    return this._tenantId;
  }

  public override getOccurredAt(): Date {
    return this.occurredAt;
  }
}

export class BackorderFulfillmentDateUpdatedEvent extends DomainEvent {
  constructor(
    public readonly _backorderId: string,

    public readonly _previousDate: Date,

    public readonly _newDate: Date,

    public readonly _tenantId: string,

    public readonly _version: number,
  ) {
    super();
  }

  public override getEventType(): string {
    return 'BackorderFulfillmentDateUpdated';
  }

  public override getAggregateId(): string {
    return this._backorderId;
  }

  public override getTenantId(): string {
    return this._tenantId;
  }

  public override getOccurredAt(): Date {
    return this.occurredAt;
  }
}
