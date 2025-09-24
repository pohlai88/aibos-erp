import { CreateAccountCommand } from '../commands/create-account-command';
import { PostJournalEntryCommand } from '../commands/post-journal-entry-command';
import { KafkaProducerService } from '../infrastructure/messaging/kafka-producer.service';
import { InMemoryAccountRepository } from '../infrastructure/repositories/in-memory-account.repository';
import { InMemoryEventStore } from '../infrastructure/repositories/in-memory-event-store.repository';
import { AccountingService } from '../services/accounting.service';
import { MultiCurrencyService } from '../services/multi-currency-service';
import { OutboxService } from '../services/outbox.service';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';

describe('AccountingService', () => {
  let service: AccountingService;
  let _eventStore: InMemoryEventStore;
  let accountRepository: InMemoryAccountRepository;

  beforeEach(async () => {
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
          provide: 'EventStore',
          useClass: InMemoryEventStore,
        },
        {
          provide: 'AccountRepository',
          useClass: InMemoryAccountRepository,
        },
        {
          provide: 'JournalEntryRepository',
          useClass: InMemoryAccountRepository, // Using same implementation for testing
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
      ],
    }).compile();

    service = module.get<AccountingService>(AccountingService);
    _eventStore = module.get<InMemoryEventStore>('EventStore');
    accountRepository = module.get<InMemoryAccountRepository>('AccountRepository');
  });

  describe('createAccount', () => {
    it('should create account successfully', async () => {
      const command = new CreateAccountCommand({
        accountCode: '1000',
        accountName: 'Cash',
        accountType: 'Asset',
        tenantId: `tenant-${Date.now()}-1`,
        userId: 'user-1',
      });

      await service.createAccount(command);

      // Verify account was created
      const account = await accountRepository.findByCode('1000', command.tenantId);
      expect(account).toBeDefined();
      expect(account?.accountCode).toBe('1000');
      expect(account?.accountName).toBe('Cash');
    });

    it('should throw error for duplicate account code', async () => {
      const tenantId = `tenant-${Date.now()}-2`;
      const command = new CreateAccountCommand({
        accountCode: '1000',
        accountName: 'Cash',
        accountType: 'Asset',
        tenantId,
        userId: 'user-1',
      });

      // Create account first time
      await service.createAccount(command);

      // Try to create duplicate
      await expect(service.createAccount(command)).rejects.toThrow(
        'Account code 1000 already exists',
      );
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
          accountName: 'Accounts Payable',
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
          accountName: 'Accounts Payable',
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
