import { DomainEvent } from '@aibos/eventsourcing';

export class AccountCompanionLinksSetEvent extends DomainEvent {
  public readonly eventType = 'AccountCompanionLinksSet' as const;
  constructor(
    public readonly accountCode: string,
    aggregateId: string,
    version: number,
    tenantId: string,
    public readonly accumulatedDepreciationCode?: string,
    public readonly depreciationExpenseCode?: string,
    public readonly allowanceAccountCode?: string,
  ) {
    super(aggregateId, version, tenantId);
  }

  serialize(): Record<string, unknown> {
    return {
      accountCode: this.accountCode,
      accumulatedDepreciationCode: this.accumulatedDepreciationCode,
      depreciationExpenseCode: this.depreciationExpenseCode,
      allowanceAccountCode: this.allowanceAccountCode,
    };
  }
}
