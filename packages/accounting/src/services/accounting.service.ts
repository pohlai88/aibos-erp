import type {
  CreateAccountCommand,
  PostJournalEntryCommand,
} from '../domain/commands/accounting.commands';
import type { EventStore } from '../domain/interfaces/repositories.interface';
import type { AccountRepository } from '../domain/interfaces/repositories.interface';

import { ChartOfAccounts } from '../domain/aggregates/chart-of-accounts.aggregate';
import { JournalEntry } from '../domain/aggregates/journal-entry.aggregate';
import { Injectable, Logger, Inject } from '@nestjs/common';

@Injectable()
export class AccountingService {
  private readonly logger = new Logger(AccountingService.name);

  constructor(
    @Inject('EventStore')
    private readonly eventStore: EventStore,
    @Inject('AccountRepository')
    private readonly accountRepository: AccountRepository,
  ) {}

  async createAccount(command: CreateAccountCommand): Promise<void> {
    this.logger.log(`Creating account: ${command.accountCode} for tenant: ${command.tenantId}`);

    const chartOfAccounts = await this.loadChartOfAccounts(command.tenantId);
    chartOfAccounts.createAccount(command);

    const events = chartOfAccounts.getUncommittedEvents();
    await this.eventStore.append(
      `chart-of-accounts-${command.tenantId}`,
      events,
      chartOfAccounts.getVersion() - events.length,
      command.tenantId,
    );

    chartOfAccounts.markEventsAsCommitted();

    // Update read model
    await this.updateAccountReadModel(command);

    this.logger.log(`Account created successfully: ${command.accountCode}`);
  }

  async postJournalEntry(command: PostJournalEntryCommand): Promise<void> {
    this.logger.log(
      `Posting journal entry: ${command.journalEntryId} for tenant: ${command.tenantId}`,
    );

    // Validate accounts exist
    await this.validateAccountsExist(command.entries, command.tenantId);

    const journalEntry = new JournalEntry(command.journalEntryId, command.tenantId);
    journalEntry.postEntry(command);

    const events = journalEntry.getUncommittedEvents();
    await this.eventStore.append(
      `journal-entry-${command.journalEntryId}`,
      events,
      journalEntry.getVersion() - events.length,
      command.tenantId,
    );

    journalEntry.markEventsAsCommitted();

    // Update read models
    await this.updateGeneralLedger(command);

    this.logger.log(`Journal entry posted successfully: ${command.journalEntryId}`);
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
    entries: Array<{
      accountCode: string;
      debitAmount: number;
      creditAmount: number;
      currency: string;
      description?: string;
    }>,
    tenantId: string,
  ): Promise<void> {
    const accountCodes = entries.map((entry) => entry.accountCode);
    const accounts = await Promise.all(
      accountCodes.map((code) => this.accountRepository.findByCode(code, tenantId)),
    );

    const missingAccounts: string[] = [];
    for (let index = 0; index < accountCodes.length; index++) {
      // eslint-disable-next-line security/detect-object-injection
      const accountCode = accountCodes[index];
      // eslint-disable-next-line security/detect-object-injection
      const account = accounts[index];
      if (!account && accountCode) {
        missingAccounts.push(accountCode);
      }
    }
    if (missingAccounts.length > 0) {
      const missingAccountsList = missingAccounts.join(', ');
      throw new Error(`Accounts not found: ${missingAccountsList}`);
    }
  }

  private async updateGeneralLedger(command: PostJournalEntryCommand): Promise<void> {
    for (const entry of command.entries) {
      await this.accountRepository.updateBalance(
        entry.accountCode,
        entry.debitAmount - entry.creditAmount,
        command.tenantId,
      );
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
