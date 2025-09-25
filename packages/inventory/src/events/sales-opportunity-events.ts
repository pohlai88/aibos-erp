/* eslint-disable no-unused-vars */
import { DomainEvent } from '../domain/domain-event';

export class SalesOpportunityCreatedEvent extends DomainEvent {
  constructor(
    public readonly _opportunityId: string,
    public readonly _customerId: string,
    public readonly _salesRepId: string,
    public readonly _stage: string,
    public readonly _probability: number,
    public readonly _expectedCloseDate: Date,
    public readonly _tenantId: string,
    public readonly _version: number,
  ) {
    super();
  }

  public override getEventType(): string {
    return 'SalesOpportunityCreated';
  }

  public override getAggregateId(): string {
    return this._opportunityId;
  }

  public override getTenantId(): string {
    return this._tenantId;
  }

  public override getOccurredAt(): Date {
    return this.occurredAt;
  }
}

export class SalesOpportunityStageUpdatedEvent extends DomainEvent {
  constructor(
    public readonly _opportunityId: string,
    public readonly _previousStage: string,
    public readonly _newStage: string,
    public readonly _probability: number,
    public readonly _tenantId: string,
    public readonly _version: number,
  ) {
    super();
  }

  public override getEventType(): string {
    return 'SalesOpportunityStageUpdated';
  }

  public override getAggregateId(): string {
    return this._opportunityId;
  }

  public override getTenantId(): string {
    return this._tenantId;
  }

  public override getOccurredAt(): Date {
    return this.occurredAt;
  }
}

export class SalesOpportunityClosedEvent extends DomainEvent {
  constructor(
    public readonly _opportunityId: string,
    public readonly _customerId: string,
    public readonly _stage: string,
    public readonly _won: boolean,
    public readonly _finalValue: number,
    public readonly _tenantId: string,
    public readonly _version: number,
  ) {
    super();
  }

  public override getEventType(): string {
    return 'SalesOpportunityClosed';
  }

  public override getAggregateId(): string {
    return this._opportunityId;
  }

  public override getTenantId(): string {
    return this._tenantId;
  }

  public override getOccurredAt(): Date {
    return this.occurredAt;
  }
}

export class SalesOpportunityInventoryAllocatedEvent extends DomainEvent {
  constructor(
    public readonly _opportunityId: string,
    public readonly _sku: string,
    public readonly _quantity: number,
    public readonly _location: string,
    public readonly _allocatedValue: number,
    public readonly _tenantId: string,
    public readonly _version: number,
  ) {
    super();
  }

  public override getEventType(): string {
    return 'SalesOpportunityInventoryAllocated';
  }

  public override getAggregateId(): string {
    return this._opportunityId;
  }

  public override getTenantId(): string {
    return this._tenantId;
  }

  public override getOccurredAt(): Date {
    return this.occurredAt;
  }
}

export class SalesOpportunityInventoryReleasedEvent extends DomainEvent {
  constructor(
    public readonly _opportunityId: string,
    public readonly _sku: string,
    public readonly _quantity: number,
    public readonly _location: string,
    public readonly _releasedValue: number,
    public readonly _tenantId: string,
    public readonly _version: number,
  ) {
    super();
  }

  public override getEventType(): string {
    return 'SalesOpportunityInventoryReleased';
  }

  public override getAggregateId(): string {
    return this._opportunityId;
  }

  public override getTenantId(): string {
    return this._tenantId;
  }

  public override getOccurredAt(): Date {
    return this.occurredAt;
  }
}
