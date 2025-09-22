import type { DomainEvent } from '@aibos/eventsourcing';

import { JournalEntryLine } from '../domain/journal-entry-line';

export class JournalEntryPostedEvent implements DomainEvent {
  public readonly id: string;
  public readonly aggregateId: string;
  public readonly version: number;
  public readonly occurredAt: Date;
  public readonly tenantId: string;
  public readonly correlationId?: string;
  public readonly causationId?: string;
  public readonly eventType = 'JournalEntryPosted';

  public readonly journalEntryId: string;
  public readonly entries: JournalEntryLine[];
  public readonly reference: string;
  public readonly description: string;
  public readonly postedBy: string;

  constructor(
    journalEntryId: string,
    entries: JournalEntryLine[],
    reference: string,
    description: string,
    postedBy: string,
    tenantId: string,
    version: number,
    correlationId?: string,
    causationId?: string,
  ) {
    this.id = crypto.randomUUID();
    this.aggregateId = `journal-entry-${journalEntryId}`;
    this.version = version;
    this.occurredAt = new Date();
    this.tenantId = tenantId;
    this.correlationId = correlationId;
    this.causationId = causationId;

    this.journalEntryId = journalEntryId;
    this.entries = entries;
    this.reference = reference;
    this.description = description;
    this.postedBy = postedBy;
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
      journalEntryId: this.journalEntryId,
      entries: this.entries.map((entry) => ({
        accountCode: entry.accountCode,
        description: entry.description,
        debitAmount: entry.debitAmount,
        creditAmount: entry.creditAmount,
        reference: entry.reference,
      })),
      reference: this.reference,
      description: this.description,
      postedBy: this.postedBy,
    };
  }

  public static deserialize(data: Record<string, unknown>): JournalEntryPostedEvent {
    const entries = (data.entries as unknown[]).map((entryData) => {
      const entry = entryData as Record<string, unknown>;
      return {
        accountCode: entry.accountCode as string,
        description: entry.description as string,
        debitAmount: entry.debitAmount as number,
        creditAmount: entry.creditAmount as number,
        reference: entry.reference as string | undefined,
      };
    });

    return new JournalEntryPostedEvent(
      data.journalEntryId as string,
      entries.map(
        (entry) =>
          new JournalEntryLine({
            accountCode: entry.accountCode,
            description: entry.description,
            debitAmount: entry.debitAmount,
            creditAmount: entry.creditAmount,
            reference: entry.reference,
          }),
      ),
      data.reference as string,
      data.description as string,
      data.postedBy as string,
      data.tenantId as string,
      data.version as number,
      data.correlationId as string | undefined,
      data.causationId as string | undefined,
    );
  }
}
