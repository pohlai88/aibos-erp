import type { AccountType } from '../domain/account';

import { DomainEvent } from '@aibos/eventsourcing';

export class AccountBalanceUpdatedEvent extends DomainEvent {
  public readonly eventType = 'AccountBalanceUpdated' as const;
  constructor(
    public readonly accountCode: string,
    public readonly balance: number,
    aggregateId: string,
    version: number,
    tenantId: string,
  ) {
    super(aggregateId, version, tenantId);
  }

  serialize(): Record<string, unknown> {
    return {
      accountCode: this.accountCode,
      balance: this.balance,
    };
  }
}

export class AccountStateUpdatedEvent extends DomainEvent {
  public readonly eventType = 'AccountStateUpdated' as const;
  constructor(
    public readonly accountCode: string,
    public readonly accountName: string,
    public readonly accountType: AccountType,
    public readonly parentAccountCode: string | undefined,
    public readonly isActive: boolean,
    aggregateId: string,
    version: number,
    tenantId: string,
  ) {
    super(aggregateId, version, tenantId);
  }

  serialize(): Record<string, unknown> {
    return {
      accountCode: this.accountCode,
      accountName: this.accountName,
      accountType: this.accountType,
      parentAccountCode: this.parentAccountCode,
      isActive: this.isActive,
    };
  }
}
