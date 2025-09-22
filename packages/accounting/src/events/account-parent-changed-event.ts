import { DomainEvent } from '@aibos/eventsourcing';

export class AccountParentChangedEvent extends DomainEvent {
  public readonly eventType = 'AccountParentChanged' as const;
  constructor(
    public readonly accountCode: string,
    public readonly oldParentAccountCode: string | undefined,
    public readonly newParentAccountCode: string | undefined,
    aggregateId: string,
    version: number,
    tenantId: string,
  ) {
    super(aggregateId, version, tenantId);
  }

  serialize(): Record<string, unknown> {
    return {
      accountCode: this.accountCode,
      oldParentAccountCode: this.oldParentAccountCode,
      newParentAccountCode: this.newParentAccountCode,
    };
  }
}
