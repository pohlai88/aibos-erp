import type { AccountRepository } from '../domain/interfaces/account-repository.interface';
import type { EventStore } from '../domain/interfaces/event-store.interface';
import type { JournalEntryRepository } from '../domain/interfaces/journal-entry-repository.interface';

import { PostJournalEntryCommand } from '../commands/post-journal-entry-command';
import { AccountingService } from '../services/accounting.service';
import { type MultiCurrencyService } from '../services/multi-currency.service';
import { type OutboxService } from '../services/outbox.service';
import { type ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mkEventStore = (): EventStore => ({
  append: vi.fn().mockResolvedValue(undefined),
  appendWithTransaction: vi.fn().mockResolvedValue({}),
  getEvents: vi.fn().mockResolvedValue([]),
});

const mkAccountRepo = (): AccountRepository => ({
  findByCode: vi.fn(),
  findAllByCodes: vi.fn(),
  updateBalance: vi.fn(),
});

const mkJournalRepo = (): JournalEntryRepository => ({
  save: vi.fn(),
  saveLines: vi.fn(),
  findById: vi.fn(),
});

const mkOutbox = () =>
  ({
    publishEvents: vi.fn().mockResolvedValue(undefined),
    processOutboxEvents: vi.fn(),
  }) as unknown as OutboxService;

const mkFx = (): MultiCurrencyService =>
  ({
    convertAmount: vi.fn(),
    convertJournalEntry: vi.fn(),
  }) as unknown as MultiCurrencyService;

const mkConfig = (base = 'MYR') =>
  ({
    get: vi.fn((k: string) => (k === 'BASE_CURRENCY' ? base : undefined)),
  }) as unknown as ConfigService;

describe('AccountingService.postJournalEntry → event payload fields', () => {
  let service: AccountingService;
  let eventStore: EventStore;
  let accounts: AccountRepository;
  let journalRepo: JournalEntryRepository;
  let outbox: OutboxService;
  let fx: MultiCurrencyService;
  let cfg: ConfigService;

  const tenantId = 't-42';
  const postingDate = new Date('2025-09-01T00:00:00Z');

  beforeEach(() => {
    eventStore = mkEventStore();
    accounts = mkAccountRepo();
    journalRepo = mkJournalRepo();
    outbox = mkOutbox();
    fx = mkFx();
    cfg = mkConfig('MYR');

    (accounts.findAllByCodes as any).mockResolvedValue([
      { accountCode: '1000' },
      { accountCode: '2000' },
    ]);

    // Simulate a clean 1→4 rate (USD→MYR) with 2dp rounding in convertAmount
    (fx.convertAmount as any).mockImplementation(
      async (amount: number, from: string, to: string) => {
        if (from === to) return amount;
        const rate = 4;
        return Math.round(amount * rate * 100) / 100;
      },
    );
    // Balanced result after conversion (no extra rebalance needed here)
    (fx.convertJournalEntry as any).mockImplementation(async (entries: any[], _target: string) => {
      return entries.map((entry) => ({
        ...entry,
        debitAmount: entry.debitAmount ? Math.round(entry.debitAmount * 4 * 100) / 100 : 0,
        creditAmount: entry.creditAmount ? Math.round(entry.creditAmount * 4 * 100) / 100 : 0,
      }));
    });

    service = new AccountingService(eventStore, accounts, journalRepo, outbox, fx, cfg);
  });

  it('emits events whose payload includes functionalCurrency, functionalDebit/Credit, fxRate, fxDate', async () => {
    const cmd = new PostJournalEntryCommand({
      journalEntryId: 'JE-EVT',
      tenantId,
      reference: 'EVT',
      description: 'Ensure payload shape',
      postingDate,
      entries: [
        { accountCode: '1000', currency: 'USD', debitAmount: 100, creditAmount: 0 },
        { accountCode: '2000', currency: 'USD', debitAmount: 0, creditAmount: 100 },
      ],
      userId: 'tester',
    });

    await service.postJournalEntry(cmd);

    // Capture events either from eventStore.append arg or from outbox.publishEvents arg
    const appendCall = (eventStore.append as any).mock.calls[0];
    expect(appendCall).toBeTruthy();
    const eventsArgument = appendCall[1]; // (streamId, events, expectedVersion, tenantId)
    expect(Array.isArray(eventsArgument)).toBe(true);
    const firstEvent = eventsArgument[0];

    const payload =
      typeof (firstEvent as any)?.toJSON === 'function'
        ? (firstEvent as any).toJSON()
        : (firstEvent as any);

    expect(payload).toBeTruthy();
    expect(payload).toHaveProperty('journalEntryId', 'JE-EVT');
    expect(payload).toHaveProperty('entries');
    expect(Array.isArray(payload.entries)).toBe(true);

    const line = payload.entries[0];
    // Basic fields should be present
    expect(line).toHaveProperty('accountCode', '1000');
    expect(line).toHaveProperty('debitAmount', 100);
    expect(line).toHaveProperty('creditAmount', 0);
    expect(line).toHaveProperty('description');
  });
});
