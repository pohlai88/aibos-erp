import { AccountingController } from '../api/accounting-controller';
import { AccountType } from '../domain/account';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Constants
const TENANT_ID = 'tenant-123';
const ACCOUNT_CODE = '1000';
const JOURNAL_ENTRY_ID = 'JE-001';
const ERROR_MESSAGE =
  'Journal entry is not balanced. Debit: 1000.00, Credit: 500.00, Difference: 500.00';
const CASH_AND_CASH_EQUIVALENTS = 'Cash and Cash Equivalents';
const CASH_RECEIVED = 'Cash received';
const REVENUE_EARNED = 'Revenue earned';
const INVALID_ACCOUNT_CODE = 'Account code is required';
const CASH_SALE_TRANSACTION = 'Cash sale transaction';

// Mock Express Request and Response
const createMockRequest = (body: any = {}, params: any = {}, query: any = {}) => ({
  body,
  params,
  query,
});

const createMockResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('AccountingController', () => {
  let controller: AccountingController;
  let mockAccountingService: any;

  beforeEach(() => {
    mockAccountingService = {
      createAccount: vi.fn(),
      postJournalEntry: vi.fn(),
      reverseJournalEntry: vi.fn(),
      getTrialBalance: vi.fn(),
      getProfitAndLoss: vi.fn(),
      getBalanceSheet: vi.fn(),
      getCashFlowStatement: vi.fn(),
      getFinancialRatios: vi.fn(),
      getComprehensiveReport: vi.fn(),
      validateGLIntegrity: vi.fn(),
      reconcileTrialBalance: vi.fn(),
      generateExceptionReport: vi.fn(),
    };

    controller = new AccountingController(mockAccountingService);
  });

  describe('createAccount', () => {
    it('should create account successfully', async () => {
      // Arrange
      const req = createMockRequest(
        {
          accountCode: ACCOUNT_CODE,
          accountName: CASH_AND_CASH_EQUIVALENTS,
          accountType: AccountType.ASSET,
          parentAccountCode: '100',
          isActive: true,
          description: 'Primary cash accounts',
          naturalBalance: 'DEBIT',
        },
        { tenantId: TENANT_ID },
      );
      const res = createMockResponse();

      mockAccountingService.createAccount.mockResolvedValue(undefined);

      // Act
      await controller.createAccount(req as any, res as any);

      // Assert
      expect(mockAccountingService.createAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: TENANT_ID,
          accountCode: ACCOUNT_CODE,
          accountName: CASH_AND_CASH_EQUIVALENTS,
          accountType: AccountType.ASSET,
        }),
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Account created successfully',
        data: {
          accountCode: ACCOUNT_CODE,
          accountName: CASH_AND_CASH_EQUIVALENTS,
          accountType: AccountType.ASSET,
        },
      });
    });

    it('should handle validation errors', async () => {
      // Arrange
      const req = createMockRequest(
        {
          accountCode: '', // Invalid empty code
          accountName: CASH_AND_CASH_EQUIVALENTS,
          accountType: AccountType.ASSET,
        },
        { tenantId: TENANT_ID },
      );
      const res = createMockResponse();

      mockAccountingService.createAccount.mockRejectedValue(new Error('Account code is required'));

      // Act
      await controller.createAccount(req as any, res as any);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: INVALID_ACCOUNT_CODE,
        error: INVALID_ACCOUNT_CODE,
      });
    });
  });

  describe('postJournalEntry', () => {
    it('should post journal entry successfully', async () => {
      // Arrange
      const req = createMockRequest(
        {
          journalEntryId: JOURNAL_ENTRY_ID,
          entries: [
            {
              accountCode: ACCOUNT_CODE,
              debitAmount: 1000,
              description: CASH_RECEIVED,
            },
            {
              accountCode: '4000',
              creditAmount: 1000,
              description: REVENUE_EARNED,
            },
          ],
          reference: 'INV-001',
          description: CASH_SALE_TRANSACTION,
          postedBy: 'user123',
          accountingPeriod: '2024-01',
          periodStatus: 'OPEN',
          currencyCode: 'MYR',
          reportingStandard: 'MFRS',
          countryCode: 'MY',
          industryType: 'GENERAL',
          fiscalYear: 2024,
        },
        { tenantId: TENANT_ID },
      );
      const res = createMockResponse();

      mockAccountingService.postJournalEntry.mockResolvedValue(undefined);

      // Act
      await controller.postJournalEntry(req as any, res as any);

      // Assert
      expect(mockAccountingService.postJournalEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          journalEntryId: JOURNAL_ENTRY_ID,
          tenantId: TENANT_ID,
          entries: expect.any(Array),
          reference: 'INV-001',
          description: CASH_SALE_TRANSACTION,
          userId: 'user123',
        }),
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Journal entry posted successfully',
        data: expect.objectContaining({
          journalEntryId: JOURNAL_ENTRY_ID,
          reference: 'INV-001',
          description: CASH_SALE_TRANSACTION,
        }),
      });
    });

    it('should handle journal entry errors', async () => {
      // Arrange
      const req = createMockRequest(
        {
          journalEntryId: JOURNAL_ENTRY_ID,
          entries: [
            {
              accountCode: ACCOUNT_CODE,
              debitAmount: 1000,
              description: CASH_RECEIVED,
            },
            {
              accountCode: '4000',
              creditAmount: 500, // Unbalanced
              description: REVENUE_EARNED,
            },
          ],
          reference: 'INV-001',
          description: 'Unbalanced transaction',
          postedBy: 'user123',
          accountingPeriod: '2024-01',
          periodStatus: 'OPEN',
          currencyCode: 'MYR',
          reportingStandard: 'MFRS',
          countryCode: 'MY',
          industryType: 'GENERAL',
          fiscalYear: 2024,
        },
        { tenantId: TENANT_ID },
      );
      const res = createMockResponse();

      mockAccountingService.postJournalEntry.mockRejectedValue(new Error(ERROR_MESSAGE));

      // Act
      await controller.postJournalEntry(req as any, res as any);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGE,
        error: ERROR_MESSAGE,
      });
    });
  });

  describe('getTrialBalance', () => {
    it('should get trial balance successfully', async () => {
      // Arrange
      const mockTrialBalance = {
        tenantId: TENANT_ID,
        asOfDate: new Date('2024-01-31'),
        accounts: [
          {
            accountCode: ACCOUNT_CODE,
            accountName: 'Cash',
            accountType: AccountType.ASSET,
            debitBalance: 1000,
            creditBalance: 0,
            currencyCode: 'MYR',
          },
        ],
        totalDebits: 1000,
        totalCredits: 1000,
        isBalanced: true,
      };

      const req = createMockRequest({}, { tenantId: TENANT_ID, period: '2024-01' }, {});
      const res = createMockResponse();

      mockAccountingService.getTrialBalance.mockResolvedValue(mockTrialBalance);

      // Act
      await controller.getTrialBalance(req as any, res as any);

      // Assert
      expect(mockAccountingService.getTrialBalance).toHaveBeenCalledWith(
        TENANT_ID,
        '2024-01',
        undefined,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockTrialBalance,
      });
    });

    it('should get trial balance with asOfDate', async () => {
      // Arrange
      const mockTrialBalance = {
        tenantId: TENANT_ID,
        asOfDate: new Date('2024-01-15'),
        accounts: [],
        totalDebits: 0,
        totalCredits: 0,
        isBalanced: true,
      };

      const req = createMockRequest(
        {},
        { tenantId: TENANT_ID, period: '2024-01' },
        { asOfDate: '2024-01-15T00:00:00.000Z' },
      );
      const res = createMockResponse();

      mockAccountingService.getTrialBalance.mockResolvedValue(mockTrialBalance);

      // Act
      await controller.getTrialBalance(req as any, res as any);

      // Assert
      expect(mockAccountingService.getTrialBalance).toHaveBeenCalledWith(
        TENANT_ID,
        '2024-01',
        new Date('2024-01-15T00:00:00.000Z'),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockTrialBalance,
      });
    });
  });

  describe('getProfitAndLoss', () => {
    it('should get profit and loss statement successfully', async () => {
      // Arrange
      const mockPnl = {
        tenantId: TENANT_ID,
        period: '2024-01',
        currencyCode: 'MYR',
        revenue: {
          totalRevenue: 10000,
          categories: [],
        },
        expenses: {
          totalExpenses: 7000,
          categories: [],
        },
        netIncome: 3000,
      };

      const req = createMockRequest(
        {},
        { tenantId: TENANT_ID, period: '2024-01' },
        { currencyCode: 'MYR' },
      );
      const res = createMockResponse();

      mockAccountingService.getProfitAndLoss.mockResolvedValue(mockPnl);

      // Act
      await controller.getProfitAndLoss(req as any, res as any);

      // Assert
      expect(mockAccountingService.getProfitAndLoss).toHaveBeenCalledWith(
        TENANT_ID,
        '2024-01',
        'MYR',
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockPnl,
      });
    });
  });

  describe('getBalanceSheet', () => {
    it('should get balance sheet successfully', async () => {
      // Arrange
      const mockBalanceSheet = {
        tenantId: TENANT_ID,
        asOfDate: new Date('2024-01-31'),
        currencyCode: 'MYR',
        assets: {
          currentAssets: [],
          nonCurrentAssets: [],
          totalAssets: 0,
        },
        liabilities: {
          currentLiabilities: [],
          nonCurrentLiabilities: [],
          totalLiabilities: 0,
        },
        equity: {
          totalEquity: 0,
        },
      };

      const req = createMockRequest(
        {},
        { tenantId: TENANT_ID },
        { asOfDate: '2024-01-31T00:00:00.000Z', currencyCode: 'MYR' },
      );
      const res = createMockResponse();

      mockAccountingService.getBalanceSheet.mockResolvedValue(mockBalanceSheet);

      // Act
      await controller.getBalanceSheet(req as any, res as any);

      // Assert
      expect(mockAccountingService.getBalanceSheet).toHaveBeenCalledWith(
        TENANT_ID,
        new Date('2024-01-31T00:00:00.000Z'),
        'MYR',
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockBalanceSheet,
      });
    });

    it('should require asOfDate parameter', async () => {
      // Arrange
      const req = createMockRequest({}, { tenantId: TENANT_ID }, {});
      const res = createMockResponse();

      // Act
      await controller.getBalanceSheet(req as any, res as any);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'asOfDate parameter is required',
      });
    });
  });

  describe('validateGLIntegrity', () => {
    it('should validate GL integrity successfully', async () => {
      // Arrange
      const mockIntegrityReport = {
        tenantId: TENANT_ID,
        validatedAt: new Date(),
        totalAccounts: 10,
        issuesFound: 0,
        issues: [],
        isHealthy: true,
      };

      const req = createMockRequest({}, { tenantId: TENANT_ID }, {});
      const res = createMockResponse();

      mockAccountingService.validateGLIntegrity.mockResolvedValue(mockIntegrityReport);

      // Act
      await controller.validateGLIntegrity(req as any, res as any);

      // Assert
      expect(mockAccountingService.validateGLIntegrity).toHaveBeenCalledWith(TENANT_ID);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockIntegrityReport,
      });
    });
  });
});
