import { CreateAccountCommand } from '../commands/create-account-command';
import { PostJournalEntryCommand } from '../commands/post-journal-entry-command';
import { AccountType } from '../domain/account';
import { JournalEntryLine } from '../domain/journal-entry-line';
import { AccountingService } from '../services/accounting-service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Constants
const TENANT_ID = 'tenant-123';

// Mock dependencies
const mockEventStore = {
  append: vi.fn(),
  getEvents: vi.fn(),
  getStreamVersion: vi.fn(),
};

const mockChartOfAccountsRepository = {
  getById: vi.fn(),
  save: vi.fn(),
};

const mockJournalEntryRepository = {
  getById: vi.fn(),
  save: vi.fn(),
};

const mockAccountingPeriodService = {
  createPeriod: vi.fn(),
  getPeriodStatus: vi.fn(),
  updatePeriodStatus: vi.fn(),
  validateStatusTransition: vi.fn(),
};

const mockTaxComplianceService = {
  addTaxCode: vi.fn(),
  validateTaxLine: vi.fn(),
  calculateTax: vi.fn(),
};

const mockMultiCurrencyService = {
  getExchangeRate: vi.fn(),
  convertAmount: vi.fn(),
  validateCurrencyCode: vi.fn(),
};

describe('AccountingService', () => {
  let accountingService: AccountingService;

  beforeEach(() => {
    vi.clearAllMocks();
    accountingService = new AccountingService(
      mockEventStore as any,
      mockChartOfAccountsRepository as any,
      mockJournalEntryRepository as any,
      mockAccountingPeriodService as any,
      mockTaxComplianceService as any,
      mockMultiCurrencyService as any,
    );
  });

  describe('createAccount', () => {
    it('should create a new account successfully', async () => {
      // Arrange
      const command = new CreateAccountCommand({
        tenantId: TENANT_ID,
        userId: 'user123',
        accountCode: '1000',
        accountName: 'Cash and Cash Equivalents',
        accountType: AccountType.ASSET,
        parentAccountCode: undefined,
        postingAllowed: true,
      });

      mockEventStore.getEvents.mockRejectedValue(new Error('Stream not found'));
      mockEventStore.append.mockResolvedValue(undefined);
      mockChartOfAccountsRepository.save.mockResolvedValue(undefined);

      // Act
      await accountingService.createAccount(command);

      // Assert
      expect(mockEventStore.append).toHaveBeenCalledWith(
        'chart-of-accounts-tenant-123',
        expect.any(Array),
        1,
      );
      expect(mockChartOfAccountsRepository.save).toHaveBeenCalled();
    });

    it('should throw error for invalid account command', async () => {
      // Act & Assert - validation happens in constructor
      expect(() => {
        new CreateAccountCommand({
          tenantId: '', // Invalid tenant ID
          userId: 'user123',
          accountCode: '1000',
          accountName: 'Cash and Cash Equivalents',
          accountType: AccountType.ASSET,
        });
      }).toThrow('Tenant ID is required');
    });
  });

  describe('postJournalEntry', () => {
    it('should post a journal entry successfully', async () => {
      // Arrange
      const command = new PostJournalEntryCommand({
        journalEntryId: 'JE-001',
        tenantId: TENANT_ID,
        userId: 'user123',
        entries: [
          new JournalEntryLine({
            accountCode: '1000',
            debitAmount: 1000,
            creditAmount: 0,
            description: 'Cash received',
          }),
          new JournalEntryLine({
            accountCode: '4000',
            debitAmount: 0,
            creditAmount: 1000,
            description: 'Revenue earned',
          }),
        ],
        reference: 'INV-001',
        description: 'Cash sale transaction',
      });

      mockEventStore.append.mockResolvedValue(undefined);
      mockJournalEntryRepository.save.mockResolvedValue(undefined);

      // Mock the JournalEntryStatusValidator to allow posting from DRAFT status
      const { JournalEntryStatusValidator } = await import('../domain/journal-entry-status');
      vi.spyOn(JournalEntryStatusValidator, 'canPost').mockReturnValue(true);

      // Act
      await accountingService.postJournalEntry(command);

      // Assert
      expect(mockEventStore.append).toHaveBeenCalledWith(
        'journal-entry-JE-001',
        expect.any(Array),
        1,
      );
      expect(mockJournalEntryRepository.save).toHaveBeenCalled();
    });

    it('should validate journal entry balance', async () => {
      // Act & Assert - validation happens in constructor
      expect(() => {
        new PostJournalEntryCommand({
          journalEntryId: 'JE-002',
          tenantId: TENANT_ID,
          userId: 'user123',
          entries: [
            new JournalEntryLine({
              accountCode: '1000',
              debitAmount: 1000,
              creditAmount: 0,
              description: 'Cash received',
            }),
            new JournalEntryLine({
              accountCode: '4000',
              debitAmount: 0,
              creditAmount: 500, // Unbalanced - should be 1000
              description: 'Revenue earned',
            }),
          ],
          reference: 'INV-002',
          description: 'Unbalanced transaction',
        });
      }).toThrow('Journal entry is not balanced');
    });
  });

  describe('getTrialBalance', () => {
    it('should generate trial balance successfully', async () => {
      // Arrange
      const tenantId = TENANT_ID;
      const period = '2024-01';

      // Act
      const trialBalance = await accountingService.getTrialBalance(tenantId, period);

      // Assert
      expect(trialBalance).toBeDefined();
      expect(trialBalance.tenantId).toBe(tenantId);
      expect(trialBalance.accounts).toBeDefined();
      expect(trialBalance.totalDebits).toBeDefined();
      expect(trialBalance.totalCredits).toBeDefined();
      expect(trialBalance.isBalanced).toBeDefined();
    });
  });

  describe('getProfitAndLoss', () => {
    it('should generate profit and loss statement successfully', async () => {
      // Arrange
      const tenantId = TENANT_ID;
      const period = '2024-01';
      const currencyCode = 'MYR';

      // Act
      const pnl = await accountingService.getProfitAndLoss(tenantId, period, currencyCode);

      // Assert
      expect(pnl).toBeDefined();
      expect(pnl.tenantId).toBe(tenantId);
      expect(pnl.period).toBe(period);
      expect(pnl.currencyCode).toBe(currencyCode);
      expect(pnl.revenue).toBeDefined();
      expect(pnl.expenses).toBeDefined();
      expect(pnl.netIncome).toBeDefined();
    });
  });

  describe('getBalanceSheet', () => {
    it('should generate balance sheet successfully', async () => {
      // Arrange
      const tenantId = TENANT_ID;
      const asOfDate = new Date('2024-01-31');
      const currencyCode = 'MYR';

      // Act
      const balanceSheet = await accountingService.getBalanceSheet(
        tenantId,
        asOfDate,
        currencyCode,
      );

      // Assert
      expect(balanceSheet).toBeDefined();
      expect(balanceSheet.tenantId).toBe(tenantId);
      expect(balanceSheet.asOfDate).toEqual(asOfDate);
      expect(balanceSheet.currencyCode).toBe(currencyCode);
      expect(balanceSheet.assets).toBeDefined();
      expect(balanceSheet.liabilities).toBeDefined();
      expect(balanceSheet.equity).toBeDefined();
    });
  });

  describe('validateGLIntegrity', () => {
    it('should validate GL integrity successfully', async () => {
      // Arrange
      const tenantId = TENANT_ID;

      // Act
      const integrityReport = await accountingService.validateGLIntegrity(tenantId);

      // Assert
      expect(integrityReport).toBeDefined();
      expect(integrityReport.tenantId).toBe(tenantId);
      expect(integrityReport.validatedAt).toBeDefined();
      expect(integrityReport.totalAccounts).toBeDefined();
      expect(integrityReport.issuesFound).toBeDefined();
      expect(integrityReport.issues).toBeDefined();
      expect(integrityReport.isHealthy).toBeDefined();
    });
  });
});
