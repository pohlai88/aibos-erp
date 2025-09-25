/* eslint-disable no-unused-vars */
import type { CustomerTier } from '../integrations/interfaces/crm.interface';

import { AggregateRoot } from './aggregate-root';
import { DomainEvent } from './domain-event';

export interface CustomerInfo {
  readonly customerId: string;
  readonly name: string;
  readonly tier: CustomerTier;
  readonly creditLimit: number;
  readonly currentCreditUsed: number;
  readonly tenantId: string;
}

export class Customer extends AggregateRoot {
  constructor(
    public readonly _customerId: string,

    public readonly _name: string,

    public readonly _tier: CustomerTier,

    public readonly _creditLimit: number,

    public readonly _currentCreditUsed: number,

    public readonly _tenantId: string,
  ) {
    super();
  }

  public updateCreditUsage(amount: number): void {
    if (this._currentCreditUsed + amount > this._creditLimit) {
      throw new Error('Credit limit exceeded');
    }

    this.addEvent(
      new CustomerCreditUpdatedEvent(
        this._customerId,
        this._currentCreditUsed + amount,
        this._tenantId,
        this.version + 1,
      ),
    );
  }

  public canProcessOrder(amount: number): boolean {
    return this._currentCreditUsed + amount <= this._creditLimit;
  }
}

export class CustomerCreditUpdatedEvent extends DomainEvent {
  constructor(
    public readonly _customerId: string,

    public readonly _newCreditUsed: number,

    public readonly _tenantId: string,

    public readonly _version: number,
  ) {
    super();
  }

  public override getEventType(): string {
    return 'CustomerCreditUpdated';
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
