export abstract class DomainEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly version: number,
    public readonly occurredAt: Date,
    public readonly tenantId: string,
    public readonly correlationId?: string,
    public readonly causationId?: string,
    public readonly userId?: string,
  ) {}

  abstract toJSON(): Record<string, unknown>;

  static fromJSON(
    _data: Record<string, unknown>,
    _metadata: {
      id?: string;
      occurredAt?: Date;
      correlationId?: string;
      causationId?: string;
    },
  ): DomainEvent {
    throw new Error('fromJSON must be implemented by subclasses');
  }
}

export class AccountCreatedEvent extends DomainEvent {
  constructor(
    public readonly accountCode: string,
    public readonly accountName: string,
    public readonly accountType: string,
    public readonly parentAccountCode: string | undefined,
    public override readonly tenantId: string,
    version: number,
    occurredAt: Date = new Date(),
    correlationId?: string,
    causationId?: string,
    userId?: string,
  ) {
    super(accountCode, version, occurredAt, tenantId, correlationId, causationId, userId);
  }

  override toJSON(): Record<string, unknown> {
    return {
      accountCode: this.accountCode,
      accountName: this.accountName,
      accountType: this.accountType,
      parentAccountCode: this.parentAccountCode,
      tenantId: this.tenantId,
    };
  }

  static override fromJSON(
    data: Record<string, unknown>,
    metadata: {
      id?: string;
      occurredAt?: Date;
      correlationId?: string;
      causationId?: string;
    },
  ): AccountCreatedEvent {
    return new AccountCreatedEvent(
      data.accountCode as string,
      data.accountName as string,
      data.accountType as string,
      data.parentAccountCode as string | undefined,
      data.tenantId as string,
      0, // version will be set by event store
      metadata.occurredAt,
      metadata.correlationId,
      metadata.causationId,
    );
  }
}

export class JournalEntryPostedEvent extends DomainEvent {
  constructor(
    public readonly journalId: string,
    public readonly entries: Array<{
      accountCode: string;
      debitAmount: number;
      creditAmount: number;
      currency: string;
      description?: string;
    }>,
    public readonly reference: string | undefined,
    public readonly description: string | undefined,
    public override readonly tenantId: string,
    version: number,
    occurredAt: Date = new Date(),
    correlationId?: string,
    causationId?: string,
    userId?: string,
  ) {
    super(journalId, version, occurredAt, tenantId, correlationId, causationId, userId);
  }

  override toJSON(): Record<string, unknown> {
    return {
      journalId: this.journalId,
      entries: this.entries,
      reference: this.reference,
      description: this.description,
      tenantId: this.tenantId,
    };
  }

  static override fromJSON(
    data: Record<string, unknown>,
    metadata: {
      id?: string;
      occurredAt?: Date;
      correlationId?: string;
      causationId?: string;
    },
  ): JournalEntryPostedEvent {
    return new JournalEntryPostedEvent(
      data.journalId as string,
      data.entries as Array<{
        accountCode: string;
        debitAmount: number;
        creditAmount: number;
        currency: string;
        description?: string;
      }>,
      data.reference as string | undefined,
      data.description as string | undefined,
      data.tenantId as string,
      0, // version will be set by event store
      metadata.occurredAt,
      metadata.correlationId,
      metadata.causationId,
    );
  }
}
