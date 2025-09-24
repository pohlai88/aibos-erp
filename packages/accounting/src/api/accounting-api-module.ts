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
const _PERIOD_PARAM = 'Path parameter - Accounting period (YYYY-MM)';
const _CURRENCY_CODE_PARAM = 'Query parameter (optional) - Currency code, defaults to MYR';

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
        'REST API for core accounting operations - chart of accounts and journal entries',
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
              postingDate: 'string (optional) - ISO 8601 date',
              currencyCode: 'string (optional) - Transaction currency, defaults to MYR',
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
            currencyCode: 'MYR',
          },
        },
      },
    };
  }
}
