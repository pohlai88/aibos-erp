import type { AccountBalanceUpdatedEvent } from '../events/account-updated-event';
import type { JournalEntryPostedEvent } from '../events/journal-entry-posted-event';
import type {
  ProfitAndLossStatement,
  BalanceSheet,
  CashFlowStatement,
  FinancialRatios,
  ComprehensiveFinancialReport,
} from './financial-reporting-service';
import type {
  TrialBalanceData,
  ReconciliationReport,
  ExceptionReport,
  GLIntegrityReport,
} from './trial-balance-service';
import type { DomainEvent } from '@aibos/eventsourcing';

import { type CreateAccountCommand } from '../commands/create-account-command';
import { type PostJournalEntryCommand } from '../commands/post-journal-entry-command';
import { ChartOfAccounts } from '../domain/chart-of-accounts';
import { JournalEntry } from '../domain/journal-entry';
import { GeneralLedgerProjection } from '../projections/general-ledger-projection';
import { type AccountingPeriodService } from './accounting-period-service';
import { FinancialReportingService } from './financial-reporting-service';
import { type MultiCurrencyService } from './multi-currency-service';
import { type TaxComplianceService } from './tax-compliance-service';
import { TrialBalanceService } from './trial-balance-service';

/**
 * Event store interface (to be implemented by the eventsourcing package)
 */
export interface EventStore {
  append(streamId: string, events: DomainEvent[], expectedVersion: number): Promise<void>;
  getEvents(streamId: string, fromVersion?: number): Promise<DomainEvent[]>;
  getStreamVersion(streamId: string): Promise<number>;
}

/**
 * Repository interfaces
 */
export interface ChartOfAccountsRepository {
  getById(id: string): Promise<ChartOfAccounts | undefined>;
  save(chartOfAccounts: ChartOfAccounts): Promise<void>;
}

export interface JournalEntryRepository {
  getById(id: string): Promise<JournalEntry | undefined>;
  save(journalEntry: JournalEntry): Promise<void>;
}

/**
 * Accounting Service
 *
 * Main service orchestrating all accounting operations. Implements the
 * complete accounting workflow from account creation to financial reporting.
 *
 * Key Features:
 * - Chart of accounts management
 * - Journal entry posting with validation
 * - General ledger projections
 * - Trial balance reconciliation
 * - Financial reporting
 * - Multi-currency support
 * - Tax compliance
 * - Period management
 *
 * Architecture:
 * - Event-driven design
 * - CQRS pattern
 * - Domain-driven design
 * - Repository pattern
 * - Service layer pattern
 */
export class AccountingService {
  private readonly glProjection: GeneralLedgerProjection;
  private readonly trialBalanceService: TrialBalanceService;
  private readonly financialReportingService: FinancialReportingService;

  constructor(
    private readonly eventStore: EventStore,
    private readonly chartOfAccountsRepository: ChartOfAccountsRepository,
    private readonly journalEntryRepository: JournalEntryRepository,
    private readonly accountingPeriodService: AccountingPeriodService,
    private readonly taxComplianceService: TaxComplianceService,
    private readonly multiCurrencyService: MultiCurrencyService,
  ) {
    this.glProjection = new GeneralLedgerProjection();
    this.trialBalanceService = new TrialBalanceService(this.glProjection);
    this.financialReportingService = new FinancialReportingService(this.glProjection);
  }

  /**
   * Create a new account in the chart of accounts
   */
  public async createAccount(command: CreateAccountCommand): Promise<void> {
    // Validate command
    command.validate();

    // Load or create chart of accounts
    const chartOfAccounts = await this.loadChartOfAccounts(command.tenantId);

    // Create the account
    chartOfAccounts.createAccount(command);

    // Save to event store
    await this.eventStore.append(
      `chart-of-accounts-${command.tenantId}`,
      chartOfAccounts.getUncommittedEvents(),
      chartOfAccounts.getVersion(),
    );

    // Mark events as committed
    chartOfAccounts.markEventsAsCommitted();

    // Save to repository
    await this.chartOfAccountsRepository.save(chartOfAccounts);
  }

  /**
   * Post a journal entry
   */
  public async postJournalEntry(command: PostJournalEntryCommand): Promise<void> {
    // Command validation is handled in the constructor

    // Period validation would be implemented when AccountingPeriodService is fully implemented

    // Tax validation would be implemented when tax fields are added to JournalEntryLine

    // Create journal entry
    const journalEntry = new JournalEntry(
      command.journalEntryId,
      command.journalEntryId,
      command.tenantId,
      command.userId,
    );

    // Post the entry
    journalEntry.postEntry(command);

    // Save to event store
    await this.eventStore.append(
      `journal-entry-${command.journalEntryId}`,
      journalEntry.getUncommittedEvents(),
      journalEntry.getVersion(),
    );

    // Mark events as committed
    journalEntry.markEventsAsCommitted();

    // Save to repository
    await this.journalEntryRepository.save(journalEntry);

    // Update GL projections
    await this.updateGeneralLedger(journalEntry.getUncommittedEvents());
  }

  /**
   * Reverse a journal entry
   */
  public async reverseJournalEntry(
    journalEntryId: string,
    reason: string,
    reversedBy: string,
    _tenantId: string,
  ): Promise<void> {
    // Load journal entry
    const journalEntry = await this.journalEntryRepository.getById(journalEntryId);
    if (!journalEntry) {
      throw new Error(`Journal entry ${journalEntryId} not found`);
    }

    // Reverse the entry
    journalEntry.reverse(reason, reversedBy);

    // Save to event store
    await this.eventStore.append(
      `journal-entry-${journalEntryId}`,
      journalEntry.getUncommittedEvents(),
      journalEntry.getVersion(),
    );

    // Mark events as committed
    journalEntry.markEventsAsCommitted();

    // Save to repository
    await this.journalEntryRepository.save(journalEntry);

    // Update GL projections
    await this.updateGeneralLedger(journalEntry.getUncommittedEvents());
  }

  /**
   * Get trial balance
   */
  public async getTrialBalance(
    tenantId: string,
    period: string,
    asOfDate?: Date,
  ): Promise<TrialBalanceData> {
    return this.trialBalanceService.generateTrialBalance(tenantId, period, asOfDate);
  }

  /**
   * Get financial reports
   */
  public async getProfitAndLoss(
    tenantId: string,
    period: string,
    currencyCode: string = 'MYR',
  ): Promise<ProfitAndLossStatement> {
    return this.financialReportingService.generateProfitAndLoss(tenantId, period, currencyCode);
  }

  public async getBalanceSheet(
    tenantId: string,
    asOfDate: Date,
    currencyCode: string = 'MYR',
  ): Promise<BalanceSheet> {
    return this.financialReportingService.generateBalanceSheet(tenantId, asOfDate, currencyCode);
  }

  public async getCashFlowStatement(
    tenantId: string,
    period: string,
    currencyCode: string = 'MYR',
  ): Promise<CashFlowStatement> {
    return this.financialReportingService.generateCashFlowStatement(tenantId, period, currencyCode);
  }

  public async getFinancialRatios(
    tenantId: string,
    asOfDate: Date,
    currencyCode: string = 'MYR',
  ): Promise<FinancialRatios> {
    return this.financialReportingService.calculateFinancialRatios(
      tenantId,
      asOfDate,
      currencyCode,
    );
  }

  /**
   * Get comprehensive financial report
   */
  public async getComprehensiveReport(
    tenantId: string,
    period: string,
    asOfDate: Date,
    currencyCode: string = 'MYR',
  ): Promise<ComprehensiveFinancialReport> {
    return this.financialReportingService.generateComprehensiveReport(
      tenantId,
      period,
      asOfDate,
      currencyCode,
    );
  }

  /**
   * Validate GL integrity
   */
  public async validateGLIntegrity(tenantId: string): Promise<GLIntegrityReport> {
    return this.glProjection.validateGLIntegrity(tenantId);
  }

  /**
   * Reconcile trial balance variances
   */
  public async reconcileTrialBalance(
    tenantId: string,
    period: string,
    expectedBalances?: Map<string, number>,
  ): Promise<ReconciliationReport> {
    return this.trialBalanceService.reconcileVariances(tenantId, period, expectedBalances);
  }

  /**
   * Generate exception report
   */
  public async generateExceptionReport(tenantId: string, period: string): Promise<ExceptionReport> {
    return this.trialBalanceService.generateExceptionReport(tenantId, period);
  }

  /**
   * Load chart of accounts from event store
   */
  private async loadChartOfAccounts(tenantId: string): Promise<ChartOfAccounts> {
    const streamId = `chart-of-accounts-${tenantId}`;

    try {
      const events = await this.eventStore.getEvents(streamId);
      return ChartOfAccounts.fromEventsStream(streamId, events);
    } catch (error) {
      // If stream doesn't exist, create new chart of accounts
      if (error instanceof Error && error.message.includes('not found')) {
        return new ChartOfAccounts(streamId, tenantId, 'system');
      }
      throw error;
    }
  }

  /**
   * Update general ledger projections from events
   */
  private async updateGeneralLedger(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      if (event.eventType === 'JournalEntryPosted') {
        await this.glProjection.updateFromJournalEntry(event as unknown as JournalEntryPostedEvent);
      } else if (event.eventType === 'AccountBalanceUpdated') {
        await this.glProjection.updateFromAccountBalance(
          event as unknown as AccountBalanceUpdatedEvent,
        );
      }
    }
  }

  /**
   * Extract accounting period from command
   */
  private extractPeriodFromCommand(_command: PostJournalEntryCommand): string {
    // This would typically extract from command metadata or current date
    // For now, return current month
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}
