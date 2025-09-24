import type {
  CreateAccountCommand,
  PostJournalEntryCommand,
} from '../domain/commands/accounting.commands';

import { KafkaProducerService } from '../infrastructure/messaging/kafka-producer.service';
import { InMemoryAccountRepository } from '../infrastructure/repositories/in-memory-account.repository';
import { InMemoryEventStore } from '../infrastructure/repositories/in-memory-event-store.repository';
import { AccountingService } from '../services/accounting.service';
import { OutboxService } from '../services/outbox.service';
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
      ],
    }).compile();

    service = module.get<AccountingService>(AccountingService);
    _eventStore = module.get<InMemoryEventStore>('EventStore');
    accountRepository = module.get<InMemoryAccountRepository>('AccountRepository');
  });

  describe('createAccount', () => {
    it('should create account successfully', async () => {
      const command: CreateAccountCommand = {
        accountCode: '1000',
        accountName: 'Cash',
        accountType: 'Asset',
        tenantId: 'tenant-1',
        userId: 'user-1',
      };

      await service.createAccount(command);

      // Verify account was created
      const account = await accountRepository.findByCode('1000', 'tenant-1');
      expect(account).toBeDefined();
      expect(account?.accountCode).toBe('1000');
      expect(account?.accountName).toBe('Cash');
    });

    it('should throw error for duplicate account code', async () => {
      const command: CreateAccountCommand = {
        accountCode: '1000',
        accountName: 'Cash',
        accountType: 'Asset',
        tenantId: 'tenant-1',
        userId: 'user-1',
      };

      // Create account first time
      await service.createAccount(command);

      // Try to create duplicate
      await expect(service.createAccount(command)).rejects.toThrow('Account code already exists');
    });
  });

  describe('postJournalEntry', () => {
    it('should post balanced journal entry', async () => {
      // First create accounts
      await service.createAccount({
        accountCode: '1000',
        accountName: 'Cash',
        accountType: 'Asset',
        tenantId: 'tenant-1',
        userId: 'user-1',
      });

      await service.createAccount({
        accountCode: '2000',
        accountName: 'Accounts Payable',
        accountType: 'Liability',
        tenantId: 'tenant-1',
        userId: 'user-1',
      });

      const command: PostJournalEntryCommand = {
        journalEntryId: 'JE-001',
        entries: [
          { accountCode: '1000', debitAmount: 1000, creditAmount: 0, currency: 'USD' },
          { accountCode: '2000', debitAmount: 0, creditAmount: 1000, currency: 'USD' },
        ],
        reference: 'INV-001',
        description: 'Inventory purchase',
        postingDate: new Date(),
        tenantId: 'tenant-1',
        userId: 'user-1',
      };

      await service.postJournalEntry(command);

      // Verify accounts exist (balance updates now happen in projection)
      const cashAccount = await accountRepository.findByCode('1000', 'tenant-1');
      const payableAccount = await accountRepository.findByCode('2000', 'tenant-1');

      expect(cashAccount).toBeTruthy();
      expect(payableAccount).toBeTruthy();
    });

    it('should reject unbalanced journal entry', async () => {
      // First create accounts
      await service.createAccount({
        accountCode: '1000',
        accountName: 'Cash',
        accountType: 'Asset',
        tenantId: 'tenant-1',
        userId: 'user-1',
      });

      await service.createAccount({
        accountCode: '2000',
        accountName: 'Accounts Payable',
        accountType: 'Liability',
        tenantId: 'tenant-1',
        userId: 'user-1',
      });

      const command: PostJournalEntryCommand = {
        journalEntryId: 'JE-001',
        entries: [
          { accountCode: '1000', debitAmount: 1000, creditAmount: 0, currency: 'USD' },
          { accountCode: '2000', debitAmount: 0, creditAmount: 500, currency: 'USD' },
        ],
        reference: 'INV-001',
        description: 'Inventory purchase',
        postingDate: new Date(),
        tenantId: 'tenant-1',
        userId: 'user-1',
      };

      await expect(service.postJournalEntry(command)).rejects.toThrow(
        'Journal entry is not balanced',
      );
    });
  });
});
