import type { JournalEntryRepository } from '../domain/interfaces/repositories.interface';
import type { AccountRepository } from '../domain/interfaces/repositories.interface';
import type { EventStore } from '../domain/interfaces/repositories.interface';

import { type CreateAccountCommand } from '../commands/create-account-command';
import { PostJournalEntryCommand } from '../commands/post-journal-entry-command';
import { ChartOfAccounts } from '../domain/chart-of-accounts';
import { JournalEntry } from '../domain/journal-entry';
import { CircuitBreaker } from '../infrastructure/resilience/circuit-breaker';
import { MultiCurrencyService } from './multi-currency.service';
import { OutboxService } from './outbox.service';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
    @Inject(MultiCurrencyService)
    private readonly multiCurrency: MultiCurrencyService,
    @Inject(ConfigService)
    private readonly config: ConfigService,
  ) {}

  async createAccount(command: CreateAccountCommand): Promise<void> {
    return this.circuitBreaker.execute(async () => {
      this.logger.log(`Creating account: ${command.accountCode} for tenant: ${command.tenantId}`);

      const chartOfAccounts = await this.loadChartOfAccounts(command.tenantId);
      chartOfAccounts.createAccount(command);

      const events = chartOfAccounts.getUncommittedEvents();
      const manager = await this.eventStore.appendWithTransaction(
        `chart-of-accounts-${command.tenantId}`,
        events as unknown as Parameters<typeof this.eventStore.appendWithTransaction>[1],
        chartOfAccounts.getVersion() - events.length,
        command.tenantId,
      );

      chartOfAccounts.markEventsAsCommitted();

      // Update read model
      await this.updateAccountReadModel(command);

      // Publish events via outbox (co-transactional with append for exactly-once write)
      await this.outboxService.publishEvents(
        events as unknown as Parameters<typeof this.outboxService.publishEvents>[0],
        command.tenantId,
        manager,
      );

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

      // Validate currency presence & sane values
      for (const [index, entry] of command.entries.entries()) {
        if (!entry.currency || typeof entry.currency !== 'string') {
          throw new Error(`Entry[${index}] missing currency`);
        }
        if ((entry.debitAmount ?? 0) < 0 || (entry.creditAmount ?? 0) < 0) {
          throw new Error(`Entry[${index}] amounts cannot be negative`);
        }
      }

      // Validate balanced (original currency per line), then we'll enforce again post-conversion
      const sumDebit = command.entries.reduce((s, entry) => s + Number(entry.debitAmount || 0), 0);
      const sumCredit = command.entries.reduce(
        (s, entry) => s + Number(entry.creditAmount || 0),
        0,
      );
      if (Math.round((sumDebit - sumCredit) * 100) !== 0) {
        throw new Error('Journal not balanced in original amounts (sum debits != sum credits)');
      }

      // Determine base ledger currency
      const baseCurrency =
        command.baseCurrency || this.config.get<string>('BASE_CURRENCY') || 'MYR';

      // Convert each line to functional/base currency for ledger posting
      const converted = [];
      for (const entry of command.entries) {
        if (entry.currency === baseCurrency) {
          converted.push({
            ...entry,
            fxRate: 1,
            fxDate: command.postingDate,
            functionalCurrency: baseCurrency,
            functionalDebit: entry.debitAmount,
            functionalCredit: entry.creditAmount,
          });
          continue;
        }
        const rate = await this.multiCurrency.convertAmount(
          1,
          entry.currency,
          baseCurrency,
          command.postingDate,
        );
        const fxDebit =
          (entry.debitAmount ?? 0) > 0
            ? await this.multiCurrency.convertAmount(
                entry.debitAmount ?? 0,
                entry.currency,
                baseCurrency,
                command.postingDate,
              )
            : 0;
        const fxCredit =
          (entry.creditAmount ?? 0) > 0
            ? await this.multiCurrency.convertAmount(
                entry.creditAmount ?? 0,
                entry.currency,
                baseCurrency,
                command.postingDate,
              )
            : 0;
        converted.push({
          ...entry,
          fxRate: rate,
          fxDate: command.postingDate,
          functionalCurrency: baseCurrency,
          functionalDebit: fxDebit,
          functionalCredit: fxCredit,
        });
      }

      // Re-check balance after rounding in functional currency
      const fDebit = converted.reduce((s, entry) => s + Number(entry.functionalDebit || 0), 0);
      const fCredit = converted.reduce((s, entry) => s + Number(entry.functionalCredit || 0), 0);
      if (Math.round((fDebit - fCredit) * 100) !== 0) {
        // Let MultiCurrencyService distribute rounding residue if needed
        const rebalanced = await this.multiCurrency.convertJournalEntry(
          command.entries.map((entry) => ({
            accountCode: entry.accountCode,
            currency: entry.currency,
            debitAmount: entry.debitAmount,
            creditAmount: entry.creditAmount,
          })),
          baseCurrency,
          command.postingDate,
        );
        // merge back functional values
        for (let index = 0; index < converted.length; index++) {
          // eslint-disable-next-line security/detect-object-injection
          const convertedEntry = converted[index];
          // eslint-disable-next-line security/detect-object-injection
          const rebalancedEntry = rebalanced[index];
          if (convertedEntry && rebalancedEntry) {
            convertedEntry.functionalDebit = rebalancedEntry.debitAmount;
            convertedEntry.functionalCredit = rebalancedEntry.creditAmount;
            convertedEntry.functionalCurrency = baseCurrency;
          }
        }
      }

      const enrichedCommand = new PostJournalEntryCommand({
        journalEntryId: command.journalEntryId,
        entries: converted,
        reference: command.reference,
        description: command.description,
        postingDate: command.postingDate,
        tenantId: command.tenantId,
        userId: command.userId,
        baseCurrency,
      });

      const journalEntry = new JournalEntry(
        enrichedCommand.journalEntryId,
        enrichedCommand.journalEntryId,
        enrichedCommand.tenantId,
        enrichedCommand.userId,
      );
      journalEntry.approve();
      journalEntry.postEntry(enrichedCommand);

      const events = journalEntry.getUncommittedEvents();
      await this.eventStore.append(
        `journal-entry-${enrichedCommand.journalEntryId}`,
        events as unknown as Parameters<typeof this.eventStore.append>[1],
        journalEntry.getVersion() - events.length,
        enrichedCommand.tenantId,
      );

      journalEntry.markEventsAsCommitted();

      // Publish events via outbox (TIP: co-transactional with append for exactly-once write)
      await this.outboxService.publishEvents(
        events as unknown as Parameters<typeof this.outboxService.publishEvents>[0],
        enrichedCommand.tenantId,
      );

      this.logger.log(`Journal entry posted successfully: ${enrichedCommand.journalEntryId}`);
    });
  }

  private async loadChartOfAccounts(tenantId: string): Promise<ChartOfAccounts> {
    const streamId = `chart-of-accounts-${tenantId}`;
    const events = await this.eventStore.getEvents(streamId, undefined, tenantId);

    if (events.length === 0) {
      // Create new chart of accounts if no events exist
      return new ChartOfAccounts(streamId, tenantId, 'system');
    }

    return ChartOfAccounts.fromEventsStream(
      streamId,
      events as unknown as Parameters<typeof ChartOfAccounts.fromEventsStream>[1],
    );
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

  // Additional methods required by the controller
  async reverseJournalEntry(
    journalEntryId: string,
    _reason: string,
    _reversedBy: string,
    _tenantId: string,
  ): Promise<void> {
    this.logger.log(`Reversing journal entry: ${journalEntryId}`);
    // TODO: Implement journal entry reversal logic
    throw new Error('Journal entry reversal not yet implemented');
  }

  async getTrialBalance(
    tenantId: string,
    _period: string,
    _asOfDate?: Date,
  ): Promise<Record<string, unknown>> {
    this.logger.log(`Getting trial balance for tenant: ${tenantId}`);
    // TODO: Implement trial balance logic
    throw new Error('Trial balance not yet implemented');
  }

  async getProfitAndLoss(
    tenantId: string,
    _period: string,
    _currencyCode: string = 'MYR',
  ): Promise<Record<string, unknown>> {
    this.logger.log(`Getting P&L for tenant: ${tenantId}`);
    // TODO: Implement P&L logic
    throw new Error('Profit and Loss not yet implemented');
  }

  async getBalanceSheet(
    tenantId: string,
    _asOfDate: Date,
    _currencyCode: string = 'MYR',
  ): Promise<Record<string, unknown>> {
    this.logger.log(`Getting balance sheet for tenant: ${tenantId}`);
    // TODO: Implement balance sheet logic
    throw new Error('Balance sheet not yet implemented');
  }

  async getCashFlowStatement(
    tenantId: string,
    _period: string,
    _currencyCode: string = 'MYR',
  ): Promise<Record<string, unknown>> {
    this.logger.log(`Getting cash flow statement for tenant: ${tenantId}`);
    // TODO: Implement cash flow logic
    throw new Error('Cash flow statement not yet implemented');
  }

  async getFinancialRatios(
    tenantId: string,
    _asOfDate: Date,
    _currencyCode: string = 'MYR',
  ): Promise<Record<string, unknown>> {
    this.logger.log(`Getting financial ratios for tenant: ${tenantId}`);
    // TODO: Implement financial ratios logic
    throw new Error('Financial ratios not yet implemented');
  }

  async getComprehensiveReport(
    tenantId: string,
    _period: string,
    _asOfDate: Date,
    _currencyCode: string = 'MYR',
  ): Promise<Record<string, unknown>> {
    this.logger.log(`Getting comprehensive report for tenant: ${tenantId}`);
    // TODO: Implement comprehensive report logic
    throw new Error('Comprehensive report not yet implemented');
  }

  async validateGLIntegrity(tenantId: string): Promise<Record<string, unknown>> {
    this.logger.log(`Validating GL integrity for tenant: ${tenantId}`);
    // TODO: Implement GL integrity validation
    throw new Error('GL integrity validation not yet implemented');
  }

  async reconcileTrialBalance(
    tenantId: string,
    _period: string,
    _expectedBalances?: Map<string, number>,
  ): Promise<Record<string, unknown>> {
    this.logger.log(`Reconciling trial balance for tenant: ${tenantId}`);
    // TODO: Implement trial balance reconciliation
    throw new Error('Trial balance reconciliation not yet implemented');
  }

  async generateExceptionReport(
    tenantId: string,
    _period: string,
  ): Promise<Record<string, unknown>> {
    this.logger.log(`Generating exception report for tenant: ${tenantId}`);
    // TODO: Implement exception report generation
    throw new Error('Exception report generation not yet implemented');
  }
}
