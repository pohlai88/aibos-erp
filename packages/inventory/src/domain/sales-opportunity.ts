/* eslint-disable no-unused-vars */
import type { OpportunityStage, OpportunityItem } from '../integrations/interfaces/crm.interface';

import { BusinessRuleViolation } from '../exceptions/business-rule-violation';
import { AggregateRoot } from './aggregate-root';
import { DomainEvent } from './domain-event';

export class SalesOpportunity extends AggregateRoot {
  constructor(
    public readonly _opportunityId: string,

    public readonly _customerId: string,

    public readonly _salesRepId: string,

    public readonly _stage: OpportunityStage,

    public readonly _probability: number,

    public readonly _expectedCloseDate: Date,

    public readonly _items: OpportunityItem[],

    public readonly _tenantId: string,
  ) {
    super();
  }

  public allocateInventory(): void {
    this.validateInventoryAllocation();

    for (const item of this._items) {
      this.addEvent(
        new OpportunityInventoryAllocatedEvent(
          this._opportunityId,
          item.sku,
          item.quantity,
          item.location,
          this._expectedCloseDate,
          this._tenantId,
          this.version + 1,
        ),
      );
    }
  }

  public releaseInventory(): void {
    for (const item of this._items) {
      this.addEvent(
        new OpportunityInventoryReleasedEvent(
          this._opportunityId,
          item.sku,
          item.quantity,
          item.location,
          this._tenantId,
          this.version + 1,
        ),
      );
    }
  }

  public updateStage(newStage: OpportunityStage): void {
    if (newStage === 'CLOSED_LOST') {
      this.releaseInventory();
    }

    this.addEvent(
      new OpportunityStageUpdatedEvent(
        this._opportunityId,
        this._stage,
        newStage,
        this._tenantId,
        this.version + 1,
      ),
    );
  }

  private validateInventoryAllocation(): void {
    if (this._stage === 'CLOSED_LOST') {
      throw new BusinessRuleViolation('Cannot allocate inventory for lost opportunities');
    }
    if (this._probability < 0.3) {
      throw new BusinessRuleViolation(
        'Cannot allocate inventory for low-probability opportunities',
      );
    }
  }
}

export class OpportunityInventoryAllocatedEvent extends DomainEvent {
  constructor(
    public readonly _opportunityId: string,

    public readonly _sku: string,

    public readonly _quantity: number,

    public readonly _location: string,

    public readonly _expectedCloseDate: Date,

    public readonly _tenantId: string,

    public readonly _version: number,
  ) {
    super();
  }

  public override getEventType(): string {
    return 'OpportunityInventoryAllocated';
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

export class OpportunityInventoryReleasedEvent extends DomainEvent {
  constructor(
    public readonly _opportunityId: string,

    public readonly _sku: string,

    public readonly _quantity: number,

    public readonly _location: string,

    public readonly _tenantId: string,

    public readonly _version: number,
  ) {
    super();
  }

  public override getEventType(): string {
    return 'OpportunityInventoryReleased';
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

export class OpportunityStageUpdatedEvent extends DomainEvent {
  constructor(
    public readonly _opportunityId: string,

    public readonly _previousStage: OpportunityStage,

    public readonly _newStage: OpportunityStage,

    public readonly _tenantId: string,

    public readonly _version: number,
  ) {
    super();
  }

  public override getEventType(): string {
    return 'OpportunityStageUpdated';
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
