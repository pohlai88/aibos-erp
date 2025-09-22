import { DomainEvent } from '@aibos/eventsourcing';

export class AccountPostingPolicyChangedEvent extends DomainEvent {
  public readonly eventType = 'AccountPostingPolicyChanged' as const;
  constructor(
    public readonly accountCode: string,
    public readonly postingAllowed: boolean,
    aggregateId: string,
    version: number,
    tenantId: string,
  ) {
    super(aggregateId, version, tenantId);
  }

  serialize(): Record<string, unknown> {
    return {
      accountCode: this.accountCode,
      postingAllowed: this.postingAllowed,
    };
  }
}
