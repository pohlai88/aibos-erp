/* eslint-disable no-unused-vars */
import { DomainEvent } from '../domain/domain-event';

export class CustomerCreatedEvent extends DomainEvent {
  constructor(
    public readonly _customerId: string,
    public readonly _name: string,
    public readonly _tier: string,
    public readonly _creditLimit: number,
    public readonly _tenantId: string,
    public readonly _version: number,
  ) {
    super();
  }

  public override getEventType(): string {
    return 'CustomerCreated';
  }

  public override getAggregateId(): string {
    return this._customerId;
  }

  public override getTenantId(): string {
    return this._tenantId;
  }

  public override getOccurredAt(): Date {
    return this.occurredAt;
  }
}

export class CustomerUpdatedEvent extends DomainEvent {
  constructor(
    public readonly _customerId: string,
    public readonly _name: string,
    public readonly _tier: string,
    public readonly _creditLimit: number,
    public readonly _tenantId: string,
    public readonly _version: number,
  ) {
    super();
  }

  public override getEventType(): string {
    return 'CustomerUpdated';
  }

  public override getAggregateId(): string {
    return this._customerId;
  }

  public override getTenantId(): string {
    return this._tenantId;
  }

  public override getOccurredAt(): Date {
    return this.occurredAt;
  }
}

export class CustomerPricingUpdatedEvent extends DomainEvent {
  constructor(
    public readonly _customerId: string,
    public readonly _sku: string,
    public readonly _oldPrice: number,
    public readonly _newPrice: number,
    public readonly _discountPercentage: number,
    public readonly _tenantId: string,
    public readonly _version: number,
  ) {
    super();
  }

  public override getEventType(): string {
    return 'CustomerPricingUpdated';
  }

  public override getAggregateId(): string {
    return this._customerId;
  }

  public override getTenantId(): string {
    return this._tenantId;
  }

  public override getOccurredAt(): Date {
    return this.occurredAt;
  }
}

export class CustomerCreditLimitExceededEvent extends DomainEvent {
  constructor(
    public readonly _customerId: string,
    public readonly _requestedAmount: number,
    public readonly _currentCreditUsed: number,
    public readonly _creditLimit: number,
    public readonly _tenantId: string,
    public readonly _version: number,
  ) {
    super();
  }

  public override getEventType(): string {
    return 'CustomerCreditLimitExceeded';
  }

  public override getAggregateId(): string {
    return this._customerId;
  }

  public override getTenantId(): string {
    return this._tenantId;
  }

  public override getOccurredAt(): Date {
    return this.occurredAt;
  }
}
