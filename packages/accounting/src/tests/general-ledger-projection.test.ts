import { AccountType } from '../domain/account.domain';
import { JournalEntryLine } from '../domain/journal-entry-line';
import {
  AccountBalanceUpdatedEvent,
  AccountStateUpdatedEvent,
} from '../events/account-updated.event';
import { JournalEntryPostedEvent } from '../events/journal-entry-posted.event';
import { GeneralLedgerProjection } from '../projections/general-ledger.projection';
import { describe, it, expect, beforeEach } from 'vitest';

// Constants
const JOURNAL_ENTRY_ID = 'JE-001';
const TENANT_ID = 'tenant-123';
const ACCOUNT_CODE_CASH = '1000';
const ACCOUNT_CODE_REVENUE = '4000';
const ACCOUNT_CODE_AR = '1100';
const CASH_RECEIVED = 'Cash received';
const REVENUE_EARNED = 'Revenue earned';
const INV_001 = 'INV-001';
const CASH_SALE_TRANSACTION = 'Cash sale transaction';
const USER_123 = 'user123';
const CHART_OF_ACCOUNTS_TENANT_123 = 'chart-of-accounts-tenant-123';
const ACCOUNT_NAME_REVENUE = 'Revenue Account';

describe('GeneralLedgerProjection', () => {
  let projection: GeneralLedgerProjection;

  beforeEach(() => {
    projection = new GeneralLedgerProjection();
  });

  describe('updateFromJournalEntry', () => {
    it('should update account balances from journal entry', async () => {
      // Arrange
      const journalEntryEvent = new JournalEntryPostedEvent(
        JOURNAL_ENTRY_ID,
        [
          new JournalEntryLine({
            accountCode: ACCOUNT_CODE_CASH,
            debitAmount: 1000,
            creditAmount: 0,
            description: CASH_RECEIVED,
          }),
          new JournalEntryLine({
            accountCode: ACCOUNT_CODE_REVENUE,
            debitAmount: 0,
            creditAmount: 1000,
            description: REVENUE_EARNED,
          }),
        ],
        INV_001,
        CASH_SALE_TRANSACTION,
        USER_123,
        TENANT_ID,
        1,
      );

      // Act
      await projection.updateFromJournalEntry(journalEntryEvent);

      // Assert
      const cashBalance = projection.getAccountBalance('1000', TENANT_ID);
      const revenueBalance = projection.getAccountBalance('4000', TENANT_ID);

      expect(cashBalance).toBeDefined();
      expect(cashBalance?.balance).toBe(1000);
      expect(cashBalance?.accountCode).toBe('1000');

      expect(revenueBalance).toBeDefined();
      expect(revenueBalance?.balance).toBe(-1000); // Credit balance is negative
      expect(revenueBalance?.accountCode).toBe('4000');
    });

    it('should accumulate balances across multiple journal entries', async () => {
      // Arrange
      const firstEntry = new JournalEntryPostedEvent(
        JOURNAL_ENTRY_ID,
        [
          new JournalEntryLine({
            accountCode: ACCOUNT_CODE_CASH,
            debitAmount: 1000,
            creditAmount: 0,
            description: CASH_RECEIVED,
          }),
          new JournalEntryLine({
            accountCode: ACCOUNT_CODE_REVENUE,
            debitAmount: 0,
            creditAmount: 1000,
            description: REVENUE_EARNED,
          }),
        ],
        INV_001,
        CASH_SALE_TRANSACTION,
        USER_123,
        TENANT_ID,
        1,
      );

      const secondEntry = new JournalEntryPostedEvent(
        'JE-002',
        [
          new JournalEntryLine({
            accountCode: ACCOUNT_CODE_CASH,
            debitAmount: 500,
            creditAmount: 0,
            description: 'Additional cash',
          }),
          new JournalEntryLine({
            accountCode: ACCOUNT_CODE_REVENUE,
            debitAmount: 0,
            creditAmount: 500,
            description: 'More revenue',
          }),
        ],
        'INV-002',
        'Second transaction',
        USER_123,
        TENANT_ID,
        1,
      );

      // Act
      await projection.updateFromJournalEntry(firstEntry);
      await projection.updateFromJournalEntry(secondEntry);

      // Assert
      const cashBalance = projection.getAccountBalance('1000', TENANT_ID);
      const revenueBalance = projection.getAccountBalance('4000', TENANT_ID);

      expect(cashBalance?.balance).toBe(1500); // 1000 + 500
      expect(revenueBalance?.balance).toBe(-1500); // -1000 + (-500)
    });
  });

  describe('updateFromAccountBalance', () => {
    it('should update account balance from balance event', async () => {
      // Arrange
      const balanceEvent = new AccountBalanceUpdatedEvent(
        '1000',
        2500,
        CHART_OF_ACCOUNTS_TENANT_123,
        1,
        TENANT_ID,
        'event-123',
        new Date(),
      );

      // Act
      await projection.updateFromAccountBalance(balanceEvent);

      // Assert
      const balance = projection.getAccountBalance('1000', TENANT_ID);
      expect(balance).toBeDefined();
      expect(balance?.balance).toBe(2500);
      expect(balance?.accountCode).toBe('1000');
    });
  });

  describe('getTrialBalanceData', () => {
    it('should generate trial balance data', async () => {
      // Arrange
      const journalEntryEvent = new JournalEntryPostedEvent(
        JOURNAL_ENTRY_ID,
        [
          new JournalEntryLine({
            accountCode: ACCOUNT_CODE_CASH,
            debitAmount: 1000,
            creditAmount: 0,
            description: CASH_RECEIVED,
          }),
          new JournalEntryLine({
            accountCode: ACCOUNT_CODE_REVENUE,
            debitAmount: 0,
            creditAmount: 1000,
            description: REVENUE_EARNED,
          }),
        ],
        INV_001,
        CASH_SALE_TRANSACTION,
        USER_123,
        TENANT_ID,
        1,
      );

      await projection.updateFromJournalEntry(journalEntryEvent);

      // Act
      const trialBalance = projection.getTrialBalanceData(TENANT_ID);

      // Assert
      expect(trialBalance).toBeDefined();
      expect(trialBalance.tenantId).toBe(TENANT_ID);
      expect(trialBalance.accounts).toHaveLength(2);
      expect(trialBalance.totalDebits).toBe(1000);
      expect(trialBalance.totalCredits).toBe(1000);
      expect(trialBalance.isBalanced).toBe(true);
    });
  });

  describe('validateGLIntegrity', () => {
    it('should detect negative balances on debit accounts', async () => {
      // Arrange
      const balanceEvent = new AccountBalanceUpdatedEvent(
        '1000', // Asset account (debit account)
        -500, // Negative balance (should be flagged)
        CHART_OF_ACCOUNTS_TENANT_123,
        1,
        TENANT_ID,
        'event-123',
        new Date(),
      );

      await projection.updateFromAccountBalance(balanceEvent);

      // Act
      const integrityReport = projection.validateGLIntegrity(TENANT_ID);

      // Assert
      expect(integrityReport.isHealthy).toBe(false);
      expect(integrityReport.issuesFound).toBeGreaterThan(0);
      expect(integrityReport.issues[0]).toContain('Debit account 1000 has negative balance: -500');
    });

    it('should detect positive balances on credit accounts', async () => {
      // Arrange
      // First set the account type
      const stateEvent = new AccountStateUpdatedEvent(
        '4000', // Revenue account (credit account)
        ACCOUNT_NAME_REVENUE, // Account name
        AccountType.REVENUE, // Explicitly set as REVENUE account
        undefined, // No parent
        true, // Active
        CHART_OF_ACCOUNTS_TENANT_123,
        1,
        TENANT_ID,
        'event-state-123',
        new Date(),
      );

      // Then set the balance
      const balanceEvent = new AccountBalanceUpdatedEvent(
        '4000', // Revenue account (credit account)
        500, // Positive balance (should be flagged)
        CHART_OF_ACCOUNTS_TENANT_123,
        2,
        TENANT_ID,
        'event-balance-123',
        new Date(),
      );

      await projection.updateFromAccountState(stateEvent);
      await projection.updateFromAccountBalance(balanceEvent);

      // Act
      const integrityReport = projection.validateGLIntegrity(TENANT_ID);

      // Assert
      expect(integrityReport.isHealthy).toBe(false);
      expect(integrityReport.issuesFound).toBeGreaterThan(0);
      expect(integrityReport.issues[0]).toContain('Credit account 4000 has positive balance: 500');
    });
  });

  describe('getAccountBalancesByType', () => {
    it('should filter balances by account type', async () => {
      // Arrange
      const assetEntry = new JournalEntryPostedEvent(
        JOURNAL_ENTRY_ID,
        [
          new JournalEntryLine({
            accountCode: ACCOUNT_CODE_CASH,
            debitAmount: 1000,
            creditAmount: 0,
            description: CASH_RECEIVED,
          }),
          new JournalEntryLine({
            accountCode: ACCOUNT_CODE_REVENUE,
            debitAmount: 0,
            creditAmount: 1000,
            description: REVENUE_EARNED,
          }),
        ],
        INV_001,
        CASH_SALE_TRANSACTION,
        USER_123,
        TENANT_ID,
        1,
      );

      await projection.updateFromJournalEntry(assetEntry);

      // Set up account types correctly
      await projection.updateFromAccountState(
        new AccountStateUpdatedEvent(
          ACCOUNT_CODE_CASH,
          'Cash Account',
          AccountType.ASSET,
          undefined,
          true,
          CHART_OF_ACCOUNTS_TENANT_123,
          1,
          TENANT_ID,
          'state-event-1',
          new Date(),
        ),
      );

      await projection.updateFromAccountState(
        new AccountStateUpdatedEvent(
          ACCOUNT_CODE_REVENUE,
          ACCOUNT_NAME_REVENUE,
          AccountType.REVENUE,
          undefined,
          true,
          CHART_OF_ACCOUNTS_TENANT_123,
          2,
          TENANT_ID,
          'state-event-2',
          new Date(),
        ),
      );

      // Act
      const assetBalances = projection.getAccountBalancesByType(TENANT_ID, AccountType.ASSET);

      // Assert
      expect(assetBalances).toHaveLength(1);
      expect(assetBalances[0]?.accountCode).toBe('1000');
      expect(assetBalances[0]?.accountType).toBe(AccountType.ASSET);
    });
  });

  describe('getTotalBalanceByType', () => {
    it('should calculate total balance by account type', async () => {
      // Arrange
      const firstEntry = new JournalEntryPostedEvent(
        JOURNAL_ENTRY_ID,
        [
          new JournalEntryLine({
            accountCode: ACCOUNT_CODE_CASH,
            debitAmount: 1000,
            creditAmount: 0,
            description: CASH_RECEIVED,
          }),
          new JournalEntryLine({
            accountCode: ACCOUNT_CODE_REVENUE,
            debitAmount: 0,
            creditAmount: 1000,
            description: REVENUE_EARNED,
          }),
        ],
        INV_001,
        'First transaction',
        USER_123,
        TENANT_ID,
        1,
      );

      const secondEntry = new JournalEntryPostedEvent(
        'JE-002',
        [
          new JournalEntryLine({
            accountCode: ACCOUNT_CODE_AR,
            debitAmount: 500,
            creditAmount: 0,
            description: 'Accounts receivable',
          }),
          new JournalEntryLine({
            accountCode: ACCOUNT_CODE_REVENUE,
            debitAmount: 0,
            creditAmount: 500,
            description: 'More revenue',
          }),
        ],
        'INV-002',
        'Second transaction',
        USER_123,
        TENANT_ID,
        1,
      );

      await projection.updateFromJournalEntry(firstEntry);
      await projection.updateFromJournalEntry(secondEntry);

      // Set up account types correctly
      await projection.updateFromAccountState(
        new AccountStateUpdatedEvent(
          ACCOUNT_CODE_CASH,
          'Cash Account',
          AccountType.ASSET,
          undefined,
          true,
          CHART_OF_ACCOUNTS_TENANT_123,
          1,
          TENANT_ID,
          'state-event-1',
          new Date(),
        ),
      );

      await projection.updateFromAccountState(
        new AccountStateUpdatedEvent(
          ACCOUNT_CODE_AR,
          'Accounts Receivable',
          AccountType.ASSET,
          undefined,
          true,
          CHART_OF_ACCOUNTS_TENANT_123,
          2,
          TENANT_ID,
          'state-event-2',
          new Date(),
        ),
      );

      await projection.updateFromAccountState(
        new AccountStateUpdatedEvent(
          ACCOUNT_CODE_REVENUE,
          ACCOUNT_NAME_REVENUE,
          AccountType.REVENUE,
          undefined,
          true,
          CHART_OF_ACCOUNTS_TENANT_123,
          3,
          TENANT_ID,
          'state-event-3',
          new Date(),
        ),
      );

      // Act
      const totalAssetBalance = projection.getTotalBalanceByType(TENANT_ID, AccountType.ASSET);

      // Assert
      expect(totalAssetBalance).toBe(1500); // 1000 + 500
    });
  });
});
