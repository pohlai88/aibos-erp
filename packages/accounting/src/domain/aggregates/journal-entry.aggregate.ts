import type { PostJournalEntryCommand } from '../commands/accounting.commands';
import type { DomainEvent } from '../events/domain-events';

import { JournalEntryPostedEvent } from '../events/domain-events';
import { AggregateRoot } from './chart-of-accounts.aggregate';

export class JournalEntry extends AggregateRoot {
  private entries: Array<{
    accountCode: string;
    debitAmount: number;
    creditAmount: number;
    currency: string;
    description?: string;
  }> = [];
  private status: 'DRAFT' | 'POSTED' | 'REVERSED' = 'DRAFT';
  private reference?: string;
  private description?: string;
  private postingDate?: Date;

  constructor(
    private readonly id: string,
    private readonly tenantId: string,
  ) {
    super();
  }

  public postEntry(command: PostJournalEntryCommand): void {
    this.validateDoubleEntry(command.entries);

    this.addEvent(
      new JournalEntryPostedEvent(
        this.id,
        command.entries,
        command.reference,
        command.description,
        command.tenantId,
        this.version + 1,
        new Date(),
        undefined, // correlationId
        undefined, // causationId
        command.userId,
      ),
    );
  }

  private validateDoubleEntry(
    entries: Array<{
      accountCode: string;
      debitAmount: number;
      creditAmount: number;
      currency: string;
      description?: string;
    }>,
  ): void {
    const totalDebit = entries.reduce((sum, entry) => sum + entry.debitAmount, 0);
    const totalCredit = entries.reduce((sum, entry) => sum + entry.creditAmount, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error('Journal entry is not balanced');
    }
  }

  protected apply(event: DomainEvent): void {
    if (event instanceof JournalEntryPostedEvent) {
      this.entries = event.entries;
      this.reference = event.reference;
      this.description = event.description;
      this.status = 'POSTED';
      this.postingDate = event.occurredAt;
    }
  }

  public getEntries(): Array<{
    accountCode: string;
    debitAmount: number;
    creditAmount: number;
    currency: string;
    description?: string;
  }> {
    return [...this.entries];
  }

  public getStatus(): 'DRAFT' | 'POSTED' | 'REVERSED' {
    return this.status;
  }

  public getReference(): string | undefined {
    return this.reference;
  }

  public getDescription(): string | undefined {
    return this.description;
  }

  public getPostingDate(): Date | undefined {
    return this.postingDate;
  }
}
