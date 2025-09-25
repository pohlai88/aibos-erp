import type { DomainEvent } from '@aibos/eventsourcing';

import { type PostJournalEntryCommand } from '../commands/post-journal-entry.command';
import { JournalEntryPostedEvent } from '../events/journal-entry-posted.event';
import { JournalEntryLine } from './journal-entry-line';
import { JournalEntryStatus, JournalEntryStatusValidator } from './journal-entry-status.domain';
import { AggregateRoot } from '@aibos/eventsourcing';

export class JournalEntry extends AggregateRoot {
  private entries: JournalEntryLine[] = [];
  private status: JournalEntryStatus = JournalEntryStatus.DRAFT;
  private reference: string = '';
  private description: string = '';
  private postedAt?: Date;
  private postedBy?: string;

  constructor(
    id: string,
    public readonly _journalEntryId: string = '',
    public readonly _tenantId: string = '',
    public readonly _userId: string = '',
    version: number = 0,
  ) {
    super(id, version);
  }

  public approve(): void {
    if (this.status !== JournalEntryStatus.DRAFT) {
      throw new Error(`Cannot approve journal entry in ${this.status} status`);
    }
    this.status = JournalEntryStatus.APPROVED;
  }

  public postEntry(command: PostJournalEntryCommand): void {
    this.validatePosting(command);

    // Convert command entries to JournalEntryLine objects
    this.entries = command.entries.map(
      (entry) =>
        new JournalEntryLine({
          accountCode: entry.accountCode,
          debitAmount: entry.debitAmount,
          creditAmount: entry.creditAmount,
          description: entry.description || command.description || 'Journal entry line',
        }),
    );
    this.reference = command.reference || '';
    this.description = command.description || '';
    this.status = JournalEntryStatus.POSTED;
    this.postedAt = new Date();
    this.postedBy = command.userId;

    this.addEvent(
      new JournalEntryPostedEvent(
        this._journalEntryId,
        this.entries,
        this.reference,
        this.description,
        this.postedBy,
        this._tenantId,
        this.getVersion() + 1,
      ),
    );
  }

  public reverse(reason: string, reversedBy: string): void {
    if (!JournalEntryStatusValidator.canReverse(this.status)) {
      throw new Error(`Cannot reverse journal entry in ${this.status} status`);
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error('Reversal reason is required');
    }

    this.status = JournalEntryStatus.REVERSED;

    // Create reversal entries (opposite of original entries)
    const reversalEntries = this.entries.map(
      (entry) =>
        new JournalEntryLine({
          accountCode: entry.accountCode,
          description: `Reversal: ${entry.description}`,
          debitAmount: entry.creditAmount, // Swap debit/credit
          creditAmount: entry.debitAmount,
          reference: `REV-${this.reference}`,
        }),
    );

    this.addEvent(
      new JournalEntryPostedEvent(
        `REV-${this._journalEntryId}`,
        reversalEntries,
        `REV-${this.reference}`,
        `Reversal: ${this.description} - ${reason}`,
        reversedBy,
        this._tenantId,
        this.getVersion() + 1,
      ),
    );
  }

  public getEntries(): JournalEntryLine[] {
    return [...this.entries];
  }

  public getStatus(): JournalEntryStatus {
    return this.status;
  }

  public getReference(): string {
    return this.reference;
  }

  public getDescription(): string {
    return this.description;
  }

  public getPostedAt(): Date | undefined {
    return this.postedAt;
  }

  public getPostedBy(): string | undefined {
    return this.postedBy;
  }

  public getTotalDebit(): number {
    return this.entries.reduce((sum, entry) => sum + entry.debitAmount, 0);
  }

  public getTotalCredit(): number {
    return this.entries.reduce((sum, entry) => sum + entry.creditAmount, 0);
  }

  public getAccountCodes(): string[] {
    return this.entries.map((entry) => entry.accountCode);
  }

  public isPosted(): boolean {
    return this.status === JournalEntryStatus.POSTED;
  }

  public isReversed(): boolean {
    return this.status === JournalEntryStatus.REVERSED;
  }

  public isDraft(): boolean {
    return this.status === JournalEntryStatus.DRAFT;
  }

  private validatePosting(command: PostJournalEntryCommand): void {
    if (!JournalEntryStatusValidator.canPost(this.status)) {
      throw new Error(`Cannot post journal entry in ${this.status} status`);
    }

    // Additional business validations
    this.validateBusinessRules(command);
  }

  private validateBusinessRules(command: PostJournalEntryCommand): void {
    // Validate minimum and maximum number of entries
    if (command.entries.length < 2) {
      throw new Error('Journal entry must have at least two lines');
    }

    if (command.entries.length > 100) {
      throw new Error('Journal entry cannot have more than 100 lines');
    }

    // Validate amounts are reasonable (business rule)
    const maxAmount = 1_000_000; // $1M limit per entry
    for (const entry of command.entries) {
      if (entry.debitAmount > maxAmount || entry.creditAmount > maxAmount) {
        throw new Error(`Entry amount cannot exceed ${maxAmount.toLocaleString()}`);
      }
    }

    // Validate reference format (business rule) - only if reference is provided
    if (command.reference && !/^[A-Z0-9-]{3,20}$/.test(command.reference)) {
      throw new Error('Reference must be 3-20 alphanumeric characters with hyphens');
    }
  }

  protected apply(event: DomainEvent): void {
    this.applyEvent(event);
  }

  public static fromEventsStream(streamId: string, events: DomainEvent[]): JournalEntry {
    const journalEntryId = streamId.replace('journal-entry-', '');
    const journalEntry = new JournalEntry(journalEntryId, journalEntryId, 'unknown', 'system');

    for (const event of events) {
      journalEntry.applyEvent(event);
    }

    return journalEntry;
  }

  private applyEvent(event: DomainEvent): void {
    switch (event.constructor.name) {
      case 'JournalEntryPostedEvent':
        this.applyJournalEntryPosted(event as JournalEntryPostedEvent);
        break;
    }
  }

  private applyJournalEntryPosted(event: JournalEntryPostedEvent): void {
    this.entries = [...event.entries];
    this.reference = event.reference;
    this.description = event.description;
    this.status = JournalEntryStatus.POSTED;
    this.postedAt = event.occurredAt;
    this.postedBy = event.postedBy;
  }
}
