import type { AccountingService } from '../services/accounting.service';
import type { Request, Response } from 'express';

import { CreateAccountCommand } from '../commands/create-account.command';
import { PostJournalEntryCommand } from '../commands/post-journal-entry.command';
// import { JournalEntryLine } from '../../domain/journal-entry-line'; // No longer needed

// Types
interface JournalEntryLineData {
  accountCode: string;
  debitAmount?: number;
  creditAmount?: number;
  description?: string;
}

// Constants
const DEFAULT_CURRENCY = 'MYR';
const TENANT_ID_REQUIRED = 'Tenant ID is required';
const TENANT_ID_AND_PERIOD_REQUIRED = 'Tenant ID and period are required';
const TENANT_ID_AND_JOURNAL_ENTRY_ID_REQUIRED = 'Tenant ID and Journal Entry ID are required';
const FAILED_TO_CREATE_ACCOUNT = 'Failed to create account';
const FAILED_TO_POST_JOURNAL_ENTRY = 'Failed to post journal entry';
const UNKNOWN_ERROR = 'Unknown error';
const AS_OF_DATE_REQUIRED = 'asOfDate parameter is required';

export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  /**
   * Create a new account in the chart of accounts
   * POST /api/accounting/accounts
   */
  public async createAccount(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      if (!tenantId) {
        res.status(400).json({
          success: false,
          message: TENANT_ID_REQUIRED,
          error: TENANT_ID_REQUIRED,
        });
        return;
      }
      if (!tenantId) {
        res.status(400).json({
          success: false,
          message: TENANT_ID_REQUIRED,
          error: TENANT_ID_REQUIRED,
        });
        return;
      }

      const {
        accountCode,
        accountName,
        accountType,
        parentAccountCode,
        isActive,
        _description,
        _naturalBalance,
      } = req.body;

      const command = new CreateAccountCommand({
        tenantId,
        userId: 'user123', // Default user ID for API calls
        accountCode,
        accountName,
        accountType,
        parentAccountCode,
        postingAllowed: isActive,
      });

      await this.accountingService.createAccount(command);

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: {
          accountCode,
          accountName,
          accountType,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : FAILED_TO_CREATE_ACCOUNT,
        error: error instanceof Error ? error.message : UNKNOWN_ERROR,
      });
    }
  }

  /**
   * Post a journal entry
   * POST /api/accounting/journal-entries
   */
  public async postJournalEntry(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      if (!tenantId) {
        res.status(400).json({
          success: false,
          message: TENANT_ID_REQUIRED,
          error: TENANT_ID_REQUIRED,
        });
        return;
      }
      if (!tenantId) {
        res.status(400).json({
          success: false,
          message: TENANT_ID_REQUIRED,
          error: TENANT_ID_REQUIRED,
        });
        return;
      }

      const {
        journalEntryId,
        entries,
        reference,
        description,
        postedBy,
        _postingDate,
        _book,
        _accountingPeriod,
        _periodStatus,
        _isAdjustingEntry,
        _isClosingEntry,
        _isReversingEntry,
        _currencyCode,
        _baseCurrencyCode,
        _exchangeRate,
        _exchangeRateDate,
        _isFXRevaluation,
        _taxLines,
        _totalTaxAmount,
        _reportingStandard,
        _countryCode,
        _industryType,
        _fiscalYear,
        _approval,
        _supportingDocuments,
      } = req.body;

      const command = new PostJournalEntryCommand({
        journalEntryId,
        tenantId,
        userId: postedBy,
        entries: entries.map((entry: JournalEntryLineData) => ({
          accountCode: entry.accountCode,
          debitAmount: entry.debitAmount || 0,
          creditAmount: entry.creditAmount || 0,
          currency: DEFAULT_CURRENCY,
          description: entry.description || '',
        })),
        reference,
        description,
        postingDate: new Date(),
      });

      await this.accountingService.postJournalEntry(command);

      res.status(201).json({
        success: true,
        message: 'Journal entry posted successfully',
        data: {
          journalEntryId,
          reference,
          description,
          totalDebits: command.getTotalDebit(),
          totalCredits: command.getTotalCredit(),
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : FAILED_TO_POST_JOURNAL_ENTRY,
        error: error instanceof Error ? error.message : UNKNOWN_ERROR,
      });
    }
  }

  /**
   * Reverse a journal entry
   * POST /api/accounting/journal-entries/:journalEntryId/reverse
   */
  public async reverseJournalEntry(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, journalEntryId } = req.params;
      if (!tenantId || !journalEntryId) {
        res.status(400).json({
          success: false,
          message: TENANT_ID_AND_JOURNAL_ENTRY_ID_REQUIRED,
          error: TENANT_ID_AND_JOURNAL_ENTRY_ID_REQUIRED,
        });
        return;
      }

      const { reason, reversedBy } = req.body;

      await this.accountingService.reverseJournalEntry(
        journalEntryId,
        reason,
        reversedBy,
        tenantId,
      );

      res.status(200).json({
        success: true,
        message: 'Journal entry reversed successfully',
        data: {
          journalEntryId,
          reason,
          reversedBy,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to reverse journal entry',
        error: error instanceof Error ? error.message : UNKNOWN_ERROR,
      });
    }
  }

  /**
   * Get trial balance
   * GET /api/accounting/trial-balance/:tenantId/:period
   */
  public async getTrialBalance(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, period } = req.params;
      if (!tenantId || !period) {
        res.status(400).json({
          success: false,
          message: TENANT_ID_AND_PERIOD_REQUIRED,
          error: TENANT_ID_AND_PERIOD_REQUIRED,
        });
        return;
      }
      const { asOfDate } = req.query;

      const trialBalance = await this.accountingService.getTrialBalance(
        tenantId,
        period,
        asOfDate ? new Date(asOfDate as string) : undefined,
      );

      res.status(200).json({
        success: true,
        data: trialBalance,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get trial balance',
        error: error instanceof Error ? error.message : UNKNOWN_ERROR,
      });
    }
  }

  /**
   * Get profit and loss statement
   * GET /api/accounting/reports/pnl/:tenantId/:period
   */
  public async getProfitAndLoss(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, period } = req.params;
      if (!tenantId || !period) {
        res.status(400).json({
          success: false,
          message: TENANT_ID_AND_PERIOD_REQUIRED,
          error: TENANT_ID_AND_PERIOD_REQUIRED,
        });
        return;
      }
      const { currencyCode = DEFAULT_CURRENCY } = req.query;

      const pnl = await this.accountingService.getProfitAndLoss(
        tenantId,
        period,
        currencyCode as string,
      );

      res.status(200).json({
        success: true,
        data: pnl,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get profit and loss statement',
        error: error instanceof Error ? error.message : UNKNOWN_ERROR,
      });
    }
  }

  /**
   * Get balance sheet
   * GET /api/accounting/reports/balance-sheet/:tenantId
   */
  public async getBalanceSheet(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      if (!tenantId) {
        res.status(400).json({
          success: false,
          message: TENANT_ID_REQUIRED,
          error: TENANT_ID_REQUIRED,
        });
        return;
      }
      const { asOfDate, currencyCode = 'MYR' } = req.query;

      if (!asOfDate) {
        res.status(400).json({
          success: false,
          message: AS_OF_DATE_REQUIRED,
        });
        return;
      }

      const balanceSheet = await this.accountingService.getBalanceSheet(
        tenantId,
        new Date(asOfDate as string),
        currencyCode as string,
      );

      res.status(200).json({
        success: true,
        data: balanceSheet,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get balance sheet',
        error: error instanceof Error ? error.message : UNKNOWN_ERROR,
      });
    }
  }

  /**
   * Get cash flow statement
   * GET /api/accounting/reports/cash-flow/:tenantId/:period
   */
  public async getCashFlowStatement(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, period } = req.params;
      if (!tenantId || !period) {
        res.status(400).json({
          success: false,
          message: TENANT_ID_AND_PERIOD_REQUIRED,
          error: TENANT_ID_AND_PERIOD_REQUIRED,
        });
        return;
      }
      const { currencyCode = DEFAULT_CURRENCY } = req.query;

      const cashFlow = await this.accountingService.getCashFlowStatement(
        tenantId,
        period,
        currencyCode as string,
      );

      res.status(200).json({
        success: true,
        data: cashFlow,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get cash flow statement',
        error: error instanceof Error ? error.message : UNKNOWN_ERROR,
      });
    }
  }

  /**
   * Get financial ratios
   * GET /api/accounting/reports/ratios/:tenantId
   */
  public async getFinancialRatios(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      if (!tenantId) {
        res.status(400).json({
          success: false,
          message: TENANT_ID_REQUIRED,
          error: TENANT_ID_REQUIRED,
        });
        return;
      }
      const { asOfDate, currencyCode = 'MYR' } = req.query;

      if (!asOfDate) {
        res.status(400).json({
          success: false,
          message: AS_OF_DATE_REQUIRED,
        });
        return;
      }

      const ratios = await this.accountingService.getFinancialRatios(
        tenantId,
        new Date(asOfDate as string),
        currencyCode as string,
      );

      res.status(200).json({
        success: true,
        data: ratios,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get financial ratios',
        error: error instanceof Error ? error.message : UNKNOWN_ERROR,
      });
    }
  }

  /**
   * Get comprehensive financial report
   * GET /api/accounting/reports/comprehensive/:tenantId/:period
   */
  public async getComprehensiveReport(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, period } = req.params;
      if (!tenantId || !period) {
        res.status(400).json({
          success: false,
          message: TENANT_ID_AND_PERIOD_REQUIRED,
          error: TENANT_ID_AND_PERIOD_REQUIRED,
        });
        return;
      }
      const { asOfDate, currencyCode = 'MYR' } = req.query;

      if (!asOfDate) {
        res.status(400).json({
          success: false,
          message: AS_OF_DATE_REQUIRED,
        });
        return;
      }

      const report = await this.accountingService.getComprehensiveReport(
        tenantId,
        period,
        new Date(asOfDate as string),
        currencyCode as string,
      );

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get comprehensive report',
        error: error instanceof Error ? error.message : UNKNOWN_ERROR,
      });
    }
  }

  /**
   * Validate GL integrity
   * GET /api/accounting/validation/integrity/:tenantId
   */
  public async validateGLIntegrity(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      if (!tenantId) {
        res.status(400).json({
          success: false,
          message: TENANT_ID_REQUIRED,
          error: TENANT_ID_REQUIRED,
        });
        return;
      }

      const integrityReport = await this.accountingService.validateGLIntegrity(tenantId);

      res.status(200).json({
        success: true,
        data: integrityReport,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to validate GL integrity',
        error: error instanceof Error ? error.message : UNKNOWN_ERROR,
      });
    }
  }

  /**
   * Reconcile trial balance variances
   * POST /api/accounting/reconciliation/:tenantId/:period
   */
  public async reconcileTrialBalance(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, period } = req.params;
      if (!tenantId || !period) {
        res.status(400).json({
          success: false,
          message: TENANT_ID_AND_PERIOD_REQUIRED,
          error: TENANT_ID_AND_PERIOD_REQUIRED,
        });
        return;
      }
      const { expectedBalances } = req.body;

      const reconciliationReport = await this.accountingService.reconcileTrialBalance(
        tenantId,
        period,
        expectedBalances ? new Map(Object.entries(expectedBalances)) : undefined,
      );

      res.status(200).json({
        success: true,
        data: reconciliationReport,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to reconcile trial balance',
        error: error instanceof Error ? error.message : UNKNOWN_ERROR,
      });
    }
  }

  /**
   * Generate exception report
   * GET /api/accounting/reports/exceptions/:tenantId/:period
   */
  public async generateExceptionReport(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, period } = req.params;
      if (!tenantId || !period) {
        res.status(400).json({
          success: false,
          message: TENANT_ID_AND_PERIOD_REQUIRED,
          error: TENANT_ID_AND_PERIOD_REQUIRED,
        });
        return;
      }

      const exceptionReport = await this.accountingService.generateExceptionReport(
        tenantId,
        period,
      );

      res.status(200).json({
        success: true,
        data: exceptionReport,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate exception report',
        error: error instanceof Error ? error.message : UNKNOWN_ERROR,
      });
    }
  }
}
