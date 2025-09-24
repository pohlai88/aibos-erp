import type { Account, JournalEntry, GeneralLedgerEntry } from '../entities/accounting.entities';
import type { DomainEvent } from '../events/domain-events';

export interface EventStore {
  append(
    streamId: string,
    events: DomainEvent[],
    expectedVersion: number,
    tenantId: string,
  ): Promise<void>;
  getEvents(streamId: string, fromVersion?: number, tenantId?: string): Promise<DomainEvent[]>;
}

export interface AccountRepository {
  findByCode(accountCode: string, tenantId: string): Promise<Account | null>;
  findByTenant(tenantId: string): Promise<Account[]>;
  save(account: Account): Promise<void>;
  updateBalance(accountCode: string, amount: number, tenantId: string): Promise<void>;
}

export interface JournalEntryRepository {
  findById(id: string, tenantId: string): Promise<JournalEntry | null>;
  findByTenant(tenantId: string, limit?: number, offset?: number): Promise<JournalEntry[]>;
  save(journalEntry: JournalEntry): Promise<void>;
}

export interface GeneralLedgerRepository {
  findByAccount(
    accountCode: string,
    tenantId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<GeneralLedgerEntry[]>;
  findByJournal(journalId: string, tenantId: string): Promise<GeneralLedgerEntry[]>;
  save(entry: GeneralLedgerEntry): Promise<void>;
  getTrialBalance(
    tenantId: string,
    asOfDate: Date,
  ): Promise<
    Array<{
      accountCode: string;
      accountName: string;
      debitBalance: number;
      creditBalance: number;
    }>
  >;
}
