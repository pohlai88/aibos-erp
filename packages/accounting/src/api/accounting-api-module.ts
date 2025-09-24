import type { AccountingService } from '../services/accounting.service';
import type { Express, Request, Response } from 'express';

import { AccountingController } from './controllers/accounting-controller';
import {
  validateCreateAccount,
  validatePostJournalEntry,
  validateReverseJournalEntry,
  validateReconciliation,
  validateQueryParameters,
  errorHandler,
  requestLogger,
} from './middleware/validation-middleware';
import { createAccountingRoutes } from './routes/accounting-routes';

// Constants
const API_BASE_PATH = '/api/accounting';
const HEALTH_ENDPOINT = '/health';
const API_VERSION = '1.0.0';
const TENANT_ID_PARAM = 'Path parameter - Tenant identifier';
const PERIOD_PARAM = 'Path parameter - Accounting period (YYYY-MM)';
const CURRENCY_CODE_PARAM = 'Query parameter (optional) - Currency code, defaults to MYR';

export class AccountingApiModule {
  private readonly controller: AccountingController;

  constructor(private readonly accountingService: AccountingService) {
    this.controller = new AccountingController(accountingService);
  }

  /**
   * Register accounting API routes with the Express app
   */
  public registerRoutes(app: Express): void {
    // Apply global middleware
    app.use(API_BASE_PATH, requestLogger);

    // Create routes with validation middleware
    const router = createAccountingRoutes(this.controller);

    // Apply validation middleware to specific routes
    router.post('/accounts', validateCreateAccount);
    router.post('/journal-entries', validatePostJournalEntry);
    router.post('/journal-entries/:journalEntryId/reverse', validateReverseJournalEntry);
    router.post('/reconciliation/:tenantId/:period', validateReconciliation);

    // Apply query parameter validation to GET routes
    router.get('*', validateQueryParameters);

    // Mount the router
    app.use(API_BASE_PATH, router);

    // Apply error handling middleware
    app.use(API_BASE_PATH, errorHandler);

    // Health check endpoint
    app.get(`${API_BASE_PATH}${HEALTH_ENDPOINT}`, (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: 'Accounting API is healthy',
        timestamp: new Date().toISOString(),
        version: API_VERSION,
      });
    });
  }

  /**
   * Get API documentation
   */
  public getApiDocumentation(): object {
    return {
      title: 'Accounting API',
      version: '1.0.0',
      description:
        'REST API for accounting operations including chart of accounts, journal entries, and financial reporting',
      baseUrl: '/api/accounting',
      endpoints: {
        accounts: {
          'POST /accounts': {
            description: 'Create a new account in the chart of accounts',
            parameters: {
              tenantId: TENANT_ID_PARAM,
            },
            body: {
              accountCode: 'string (required) - Unique account code',
              accountName: 'string (required) - Account display name',
              accountType: 'enum (required) - ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE',
              parentAccountCode: 'string (optional) - Parent account code for hierarchy',
              isActive: 'boolean (optional) - Account status, defaults to true',
              description: 'string (optional) - Account description',
              naturalBalance: 'enum (optional) - DEBIT or CREDIT',
            },
          },
        },
        journalEntries: {
          'POST /journal-entries': {
            description: 'Post a new journal entry',
            parameters: {
              tenantId: TENANT_ID_PARAM,
            },
            body: {
              journalEntryId: 'string (required) - Unique journal entry identifier',
              entries: 'array (required) - Journal entry lines',
              reference: 'string (required) - Reference number',
              description: 'string (required) - Entry description',
              postedBy: 'string (required) - User who posted the entry',
              postingDate: 'string (optional) - ISO 8601 date',
              accountingPeriod: 'string (required) - Accounting period (YYYY-MM)',
              currencyCode: 'string (optional) - Transaction currency, defaults to MYR',
              reportingStandard: 'enum (optional) - MFRS, IFRS, GAAP, LOCAL',
              countryCode: 'enum (optional) - MY, SG, VN, ID, TH, PH',
              industryType: 'enum (optional) - Industry classification',
              fiscalYear: 'number (required) - Fiscal year',
              approval: 'object (optional) - Approval workflow information',
              supportingDocuments: 'array (optional) - Supporting document references',
            },
          },
          'POST /journal-entries/:journalEntryId/reverse': {
            description: 'Reverse an existing journal entry',
            parameters: {
              tenantId: TENANT_ID_PARAM,
              journalEntryId: 'Path parameter - Journal entry identifier',
            },
            body: {
              reason: 'string (required) - Reason for reversal',
              reversedBy: 'string (required) - User who reversed the entry',
            },
          },
        },
        reports: {
          'GET /trial-balance/:tenantId/:period': {
            description: 'Get trial balance for a period',
            parameters: {
              tenantId: TENANT_ID_PARAM,
              period: PERIOD_PARAM,
              asOfDate: 'Query parameter (optional) - Specific date for balance',
            },
          },
          'GET /reports/pnl/:tenantId/:period': {
            description: 'Get profit and loss statement',
            parameters: {
              tenantId: TENANT_ID_PARAM,
              period: PERIOD_PARAM,
              currencyCode: CURRENCY_CODE_PARAM,
            },
          },
          'GET /reports/balance-sheet/:tenantId': {
            description: 'Get balance sheet',
            parameters: {
              tenantId: TENANT_ID_PARAM,
              asOfDate: 'Query parameter (required) - Balance sheet date',
              currencyCode: CURRENCY_CODE_PARAM,
            },
          },
          'GET /reports/cash-flow/:tenantId/:period': {
            description: 'Get cash flow statement',
            parameters: {
              tenantId: TENANT_ID_PARAM,
              period: PERIOD_PARAM,
              currencyCode: CURRENCY_CODE_PARAM,
            },
          },
          'GET /reports/ratios/:tenantId': {
            description: 'Get financial ratios',
            parameters: {
              tenantId: TENANT_ID_PARAM,
              asOfDate: 'Query parameter (required) - Calculation date',
              currencyCode: CURRENCY_CODE_PARAM,
            },
          },
          'GET /reports/comprehensive/:tenantId/:period': {
            description: 'Get comprehensive financial report',
            parameters: {
              tenantId: TENANT_ID_PARAM,
              period: PERIOD_PARAM,
              asOfDate: 'Query parameter (required) - Report date',
              currencyCode: CURRENCY_CODE_PARAM,
            },
          },
          'GET /reports/exceptions/:tenantId/:period': {
            description: 'Get exception report',
            parameters: {
              tenantId: TENANT_ID_PARAM,
              period: PERIOD_PARAM,
            },
          },
        },
        validation: {
          'GET /validation/integrity/:tenantId': {
            description: 'Validate general ledger integrity',
            parameters: {
              tenantId: TENANT_ID_PARAM,
            },
          },
          'POST /reconciliation/:tenantId/:period': {
            description: 'Reconcile trial balance variances',
            parameters: {
              tenantId: TENANT_ID_PARAM,
              period: PERIOD_PARAM,
            },
            body: {
              expectedBalances: 'object (optional) - Expected account balances',
            },
          },
        },
        health: {
          'GET /health': {
            description: 'API health check',
          },
        },
      },
      examples: {
        createAccount: {
          method: 'POST',
          url: '/api/accounting/accounts',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            accountCode: '1000',
            accountName: 'Cash and Cash Equivalents',
            accountType: 'ASSET',
            parentAccountCode: '100',
            isActive: true,
            description: 'Primary cash accounts',
            naturalBalance: 'DEBIT',
          },
        },
        postJournalEntry: {
          method: 'POST',
          url: '/api/accounting/journal-entries',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            journalEntryId: 'JE-2024-001',
            entries: [
              {
                accountCode: '1000',
                debitAmount: 1000,
                description: 'Cash received',
              },
              {
                accountCode: '4000',
                creditAmount: 1000,
                description: 'Revenue earned',
              },
            ],
            reference: 'INV-001',
            description: 'Cash sale transaction',
            postedBy: 'user123',
            accountingPeriod: '2024-01',
            periodStatus: 'OPEN',
            currencyCode: 'MYR',
            reportingStandard: 'MFRS',
            countryCode: 'MY',
            industryType: 'GENERAL',
            fiscalYear: 2024,
          },
        },
      },
    };
  }
}
