import type { AccountType } from '../domain/account';
import type { DomainEvent } from '@aibos/eventsourcing';

export class AccountCreatedEvent implements DomainEvent {
  public readonly id: string;
  public readonly aggregateId: string;
  public readonly version: number;
  public readonly occurredAt: Date;
  public readonly tenantId: string;
  public readonly correlationId?: string;
  public readonly causationId?: string;
  public readonly eventType = 'AccountCreated';

  public readonly accountCode: string;
  public readonly accountName: string;
  public readonly accountType: AccountType;
  public readonly parentAccountCode?: string;

  constructor(
    accountCode: string,
    accountName: string,
    accountType: AccountType,
    parentAccountCode: string | undefined,
    tenantId: string,
    version: number,
    correlationId?: string,
    causationId?: string,
  ) {
    this.id = crypto.randomUUID();
    this.aggregateId = `chart-of-accounts-${tenantId}`;
    this.version = version;
    this.occurredAt = new Date();
    this.tenantId = tenantId;
    this.correlationId = correlationId;
    this.causationId = causationId;

    this.accountCode = accountCode;
    this.accountName = accountName;
    this.accountType = accountType;
    this.parentAccountCode = parentAccountCode;
  }

  public serialize(): Record<string, unknown> {
    return {
      id: this.id,
      aggregateId: this.aggregateId,
      version: this.version,
      occurredAt: this.occurredAt.toISOString(),
      tenantId: this.tenantId,
      correlationId: this.correlationId,
      causationId: this.causationId,
      accountCode: this.accountCode,
      accountName: this.accountName,
      accountType: this.accountType,
      parentAccountCode: this.parentAccountCode,
    };
  }

  public static deserialize(data: Record<string, unknown>): AccountCreatedEvent {
    return new AccountCreatedEvent(
      data.accountCode as string,
      data.accountName as string,
      data.accountType as AccountType,
      data.parentAccountCode as string | undefined,
      data.tenantId as string,
      data.version as number,
      data.correlationId as string | undefined,
      data.causationId as string | undefined,
    );
  }
}
