import type {
  CreateAccountCommand,
  PostJournalEntryCommand,
} from '../domain/commands/accounting.commands';
import type { JournalEntryRepository } from '../domain/interfaces/journal-entry-repository.interface';
import type { EventStore } from '../domain/interfaces/repositories.interface';
import type { AccountRepository } from '../domain/interfaces/repositories.interface';

import { ChartOfAccounts } from '../domain/aggregates/chart-of-accounts.aggregate';
import { JournalEntry } from '../domain/aggregates/journal-entry.aggregate';
import { CircuitBreaker } from '../infrastructure/resilience/circuit-breaker';
import { OutboxService } from './outbox.service';
import { Injectable, Logger, Inject } from '@nestjs/common';
// Remove JournalEntryLine import as we'll use the command interface types

@Injectable()
export class AccountingService {
  private readonly logger = new Logger(AccountingService.name);
  private readonly circuitBreaker = new CircuitBreaker({
    failureThreshold: 5,
    recoveryTimeout: 30000,
    monitoringPeriod: 60000,
  });

  constructor(
    @Inject('EventStore')
    private readonly eventStore: EventStore,
    @Inject('AccountRepository')
    private readonly accountRepository: AccountRepository,
    @Inject('JournalEntryRepository')
    private readonly journalEntryRepository: JournalEntryRepository,
    @Inject(OutboxService)
    private readonly outboxService: OutboxService,
  ) {}

  async createAccount(command: CreateAccountCommand): Promise<void> {
    return this.circuitBreaker.execute(async () => {
      this.logger.log(`Creating account: ${command.accountCode} for tenant: ${command.tenantId}`);

      const chartOfAccounts = await this.loadChartOfAccounts(command.tenantId);
      chartOfAccounts.createAccount(command);

      const events = chartOfAccounts.getUncommittedEvents();
      const manager = await this.eventStore.appendWithTransaction(
        `chart-of-accounts-${command.tenantId}`,
        events,
        chartOfAccounts.getVersion() - events.length,
        command.tenantId,
      );

      chartOfAccounts.markEventsAsCommitted();

      // Update read model
      await this.updateAccountReadModel(command);

      // Publish events via outbox (co-transactional with append for exactly-once write)
      await this.outboxService.publishEvents(events, command.tenantId, manager);

      this.logger.log(`Account created successfully: ${command.accountCode}`);
    });
  }

  async postJournalEntry(command: PostJournalEntryCommand): Promise<void> {
    return this.circuitBreaker.execute(async () => {
      this.logger.log(
        `Posting journal entry: ${command.journalEntryId} for tenant: ${command.tenantId}`,
      );

      // Validate accounts exist
      await this.validateAccountsExist(command.entries, command.tenantId);

      const journalEntry = new JournalEntry(command.journalEntryId, command.tenantId);
      journalEntry.postEntry(command);

      const events = journalEntry.getUncommittedEvents();
      const manager = await this.eventStore.appendWithTransaction(
        `journal-entry-${command.journalEntryId}`,
        events,
        journalEntry.getVersion() - events.length,
        command.tenantId,
      );

      journalEntry.markEventsAsCommitted();

      // Publish events via outbox (co-transactional with append for exactly-once write)
      await this.outboxService.publishEvents(events, command.tenantId, manager);

      this.logger.log(`Journal entry posted successfully: ${command.journalEntryId}`);
    });
  }

  private async loadChartOfAccounts(tenantId: string): Promise<ChartOfAccounts> {
    const events = await this.eventStore.getEvents(
      `chart-of-accounts-${tenantId}`,
      undefined,
      tenantId,
    );

    const chartOfAccounts = new ChartOfAccounts(tenantId);
    events.forEach((event) => chartOfAccounts.loadFromHistory(event));

    return chartOfAccounts;
  }

  private async validateAccountsExist(
    entries: ReadonlyArray<{
      accountCode: string;
      debitAmount: number;
      creditAmount: number;
      currency: string;
      description?: string;
    }>,
    tenantId: string,
  ): Promise<void> {
    const accountCodes = Array.from(new Set(entries.map((entry) => entry.accountCode)));
    const foundAccounts = await this.accountRepository.findAllByCodes(accountCodes, tenantId);
    const foundSet = new Set(foundAccounts.map((a) => a.accountCode));
    const missingAccounts = accountCodes.filter((code) => !foundSet.has(code));
    if (missingAccounts.length > 0) {
      throw new Error(`Accounts not found: ${missingAccounts.join(', ')}`);
    }
  }

  private async updateAccountReadModel(command: CreateAccountCommand): Promise<void> {
    await this.accountRepository.save({
      accountCode: command.accountCode,
      accountName: command.accountName,
      accountType: command.accountType,
      parentAccountCode: command.parentAccountCode,
      tenantId: command.tenantId,
      balance: 0,
      isActive: true,
    });
  }
}
