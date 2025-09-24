import type { AccountRepository } from '../domain/interfaces/repositories.interface';

import { CreateAccountCommand } from '../commands/create-account-command';
import { PostJournalEntryCommand } from '../commands/post-journal-entry-command';
import { AccountCreatedEvent } from '../events/account-created-event';
import { GeneralLedgerProjection } from '../projections/general-ledger-projection';
import { InMemoryEventStore } from '../services/__tests__/doubles/in-memory-event-store';
import { AccountingService } from '../services/accounting.service';
import { FinancialReportingService } from '../services/financial-reporting.service';
import { KafkaProducerService } from '../services/kafka-producer.service';
import { MultiCurrencyService } from '../services/multi-currency.service';
import { OutboxService } from '../services/outbox.service';
import { TrialBalanceService } from '../services/trial-balance.service';
import { EVENT_STORE, ACCOUNT_REPOSITORY, JOURNAL_ENTRY_REPOSITORY } from '../tokens';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import { vi } from 'vitest';

describe('AccountingService', () => {
  let service: AccountingService;
  let eventStore: InMemoryEventStore;
  let accountRepository: AccountRepository;

  const TENANT_1 = 'tenant-1';
  const ACCOUNTS_PAYABLE = 'Accounts Payable';
  const CASH_ACCOUNT = {
    accountCode: '1000',
    accountName: 'Cash',
    accountType: 'Asset',
    balance: 0,
    isActive: true,
  };
  const PAYABLE_ACCOUNT = {
    accountCode: '2000',
    accountName: ACCOUNTS_PAYABLE,
    accountType: 'Liability',
    balance: 0,
    isActive: true,
  };

  beforeEach(async () => {
    const mockAccountRepository = {
      findByCode: vi.fn().mockImplementation((code: string, tenantId: string) => {
        if (code === '1000' && tenantId.includes('tenant')) {
          return Promise.resolve({ ...CASH_ACCOUNT, tenantId });
        }
        if (code === '2000' && tenantId.includes('tenant')) {
          return Promise.resolve({ ...PAYABLE_ACCOUNT, tenantId });
        }
        return Promise.resolve(undefined);
      }),
      save: vi.fn(),
      updateBalance: vi.fn(),
      findAllByCodes: vi.fn().mockResolvedValue([
        { ...CASH_ACCOUNT, tenantId: TENANT_1 },
        { ...PAYABLE_ACCOUNT, tenantId: TENANT_1 },
      ]),
    };

    eventStore = new InMemoryEventStore();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountingService,
        {
          provide: OutboxService,
          useValue: {
            publishEvents: vi.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: KafkaProducerService,
          useValue: {
            send: vi.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: EVENT_STORE,
          useValue: eventStore,
        },
        {
          provide: ACCOUNT_REPOSITORY,
          useValue: mockAccountRepository,
        },
        {
          provide: JOURNAL_ENTRY_REPOSITORY,
          useValue: mockAccountRepository, // Using same implementation for testing
        },
        {
          provide: MultiCurrencyService,
          useValue: {
            convertAmount: vi
              .fn()
              .mockImplementation(async (amount: number, from: string, to: string) => {
                if (from === to) return amount;
                return amount * 1; // 1:1 rate for testing
              }),
            convertJournalEntry: vi.fn().mockImplementation(async (entries: any[]) => entries),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn().mockReturnValue('MYR'),
          },
        },
        {
          provide: FinancialReportingService,
          useValue: {
            generateProfitAndLoss: vi.fn().mockResolvedValue({}),
            generateBalanceSheet: vi.fn().mockResolvedValue({}),
            generateCashFlowStatement: vi.fn().mockResolvedValue({}),
            calculateFinancialRatios: vi.fn().mockResolvedValue({}),
            generateComprehensiveReport: vi.fn().mockResolvedValue({}),
          },
        },
        {
          provide: TrialBalanceService,
          useValue: {
            generateTrialBalance: vi.fn().mockResolvedValue({}),
            reconcileVariances: vi.fn().mockResolvedValue({}),
            generateExceptionReport: vi.fn().mockResolvedValue({}),
          },
        },
        {
          provide: GeneralLedgerProjection,
          useValue: {
            validateGLIntegrity: vi.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    service = module.get<AccountingService>(AccountingService);
    accountRepository = module.get(ACCOUNT_REPOSITORY);
  });

  describe('createAccount', () => {
    it('should create account successfully', async () => {
      const command = new CreateAccountCommand({
        accountCode: '1000',
        accountName: 'Cash',
        accountType: 'Asset',
        tenantId: TENANT_1,
        userId: 'user-1',
      });

      await service.createAccount(command);

      const streamId = `chart-of-accounts-${TENANT_1}`;
      const events = await eventStore.getEvents(streamId, undefined, TENANT_1);
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('AccountCreated');
      expect(events[0]).toMatchObject({
        accountCode: '1000',
        accountName: 'Cash',
        accountType: 'Asset',
      });
    });

    it('should throw error for duplicate account code', async () => {
      const command = new CreateAccountCommand({
        accountCode: '1000',
        accountName: 'Cash',
        accountType: 'Asset',
        tenantId: TENANT_1,
        userId: 'user-1',
      });

      // Seed prior event in same tenant
      const existingEvent = new AccountCreatedEvent(
        '1000',
        'Cash',
        'Asset',
        undefined,
        TENANT_1,
        1,
        undefined,
        undefined,
        { id: randomUUID() },
      );
      await eventStore.append(`chart-of-accounts-${TENANT_1}`, [existingEvent], 0, TENANT_1);

      await expect(service.createAccount(command)).rejects.toThrow(
        'Account code 1000 already exists',
      );
    });

    it('should reject duplicate account creation', async () => {
      const command = new CreateAccountCommand({
        accountCode: '1200',
        accountName: 'Bank',
        accountType: 'Asset',
        tenantId: TENANT_1,
        userId: 'user-1',
      });
      await service.createAccount(command);
      // Second call should throw error for duplicate
      await expect(service.createAccount(command)).rejects.toThrow(
        'Account code 1200 already exists',
      );
    });

    it('should isolate tenants', async () => {
      await service.createAccount(
        new CreateAccountCommand({
          accountCode: '2000',
          accountName: 'AP',
          accountType: 'Liability',
          tenantId: 'tenant-A',
          userId: 'user-A',
        }),
      );
      await service.createAccount(
        new CreateAccountCommand({
          accountCode: '2000',
          accountName: 'AP',
          accountType: 'Liability',
          tenantId: 'tenant-B',
          userId: 'user-B',
        }),
      );
      const a = await eventStore.getEvents('chart-of-accounts-tenant-A', undefined, 'tenant-A');
      const b = await eventStore.getEvents('chart-of-accounts-tenant-B', undefined, 'tenant-B');
      expect(a).toHaveLength(1);
      expect(b).toHaveLength(1);
    });

    it('should enforce optimistic concurrency in the EventStore', async () => {
      // Seed stream with one event at version 0
      await eventStore.append(
        'chart-of-accounts-tenant-C',
        [
          {
            id: randomUUID(),
            eventType: 'AccountCreated',
            accountCode: '3000',
            accountName: 'Equity',
            accountType: 'Equity',
            occurredAt: new Date(),
            version: 1,
            tenantId: 'tenant-C',
          },
        ],
        0,
        'tenant-C',
      );
      // A second writer incorrectly thinks stream version is still 0 → should throw
      await expect(
        eventStore.append(
          'chart-of-accounts-tenant-C',
          [
            {
              id: randomUUID(),
              eventType: 'AccountCreated',
              accountCode: '3100',
              accountName: 'Other Equity',
              accountType: 'Equity',
              occurredAt: new Date(),
              version: 2,
              tenantId: 'tenant-C',
            },
          ],
          0, // wrong expectedVersion (actual is 1)
          'tenant-C',
        ),
      ).rejects.toThrow(/ConcurrencyError/);
    });
  });

  describe('postJournalEntry', () => {
    it('should post balanced journal entry', async () => {
      const tenantId = `tenant-${Date.now()}-3`;
      // First create accounts
      await service.createAccount(
        new CreateAccountCommand({
          accountCode: '1000',
          accountName: 'Cash',
          accountType: 'Asset',
          tenantId,
          userId: 'user-1',
        }),
      );

      await service.createAccount(
        new CreateAccountCommand({
          accountCode: '2000',
          accountName: ACCOUNTS_PAYABLE,
          accountType: 'Liability',
          tenantId,
          userId: 'user-1',
        }),
      );

      const command = new PostJournalEntryCommand({
        journalEntryId: 'JE-001',
        entries: [
          { accountCode: '1000', debitAmount: 1000, creditAmount: 0, currency: 'USD' },
          { accountCode: '2000', debitAmount: 0, creditAmount: 1000, currency: 'USD' },
        ],
        reference: 'INV-001',
        description: 'Inventory purchase',
        postingDate: new Date(),
        tenantId,
        userId: 'user-1',
      });

      await service.postJournalEntry(command);

      // Verify accounts exist (balance updates now happen in projection)
      const cashAccount = await accountRepository.findByCode('1000', tenantId);
      const payableAccount = await accountRepository.findByCode('2000', tenantId);

      expect(cashAccount).toBeTruthy();
      expect(payableAccount).toBeTruthy();
    });

    it('should reject unbalanced journal entry', async () => {
      const tenantId = `tenant-${Date.now()}-4`;
      // First create accounts
      await service.createAccount(
        new CreateAccountCommand({
          accountCode: '1000',
          accountName: 'Cash',
          accountType: 'Asset',
          tenantId,
          userId: 'user-1',
        }),
      );

      await service.createAccount(
        new CreateAccountCommand({
          accountCode: '2000',
          accountName: ACCOUNTS_PAYABLE,
          accountType: 'Liability',
          tenantId,
          userId: 'user-1',
        }),
      );

      expect(() => {
        new PostJournalEntryCommand({
          journalEntryId: 'JE-001',
          entries: [
            { accountCode: '1000', debitAmount: 1000, creditAmount: 0, currency: 'USD' },
            { accountCode: '2000', debitAmount: 0, creditAmount: 500, currency: 'USD' },
          ],
          reference: 'INV-001',
          description: 'Inventory purchase',
          postingDate: new Date(),
          tenantId,
          userId: 'user-1',
        });
      }).toThrow(
        'Journal entry is not balanced. Debit: 1000.00, Credit: 500.00, Difference: 500.00',
      );
    });
  });
});
