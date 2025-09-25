import type { AccountingController } from './accounting-controller';
import type { Router } from 'express';

import { Router as ExpressRouter } from 'express';

export function createAccountingRoutes(accountingController: AccountingController): Router {
  const router = ExpressRouter();

  // Account Management Routes
  router.post('/accounts', accountingController.createAccount.bind(accountingController));

  // Journal Entry Routes
  router.post('/journal-entries', accountingController.postJournalEntry.bind(accountingController));
  router.post(
    '/journal-entries/:journalEntryId/reverse',
    accountingController.reverseJournalEntry.bind(accountingController),
  );

  // Trial Balance Routes
  router.get(
    '/trial-balance/:tenantId/:period',
    accountingController.getTrialBalance.bind(accountingController),
  );

  // Financial Reporting Routes
  router.get(
    '/reports/pnl/:tenantId/:period',
    accountingController.getProfitAndLoss.bind(accountingController),
  );
  router.get(
    '/reports/balance-sheet/:tenantId',
    accountingController.getBalanceSheet.bind(accountingController),
  );
  router.get(
    '/reports/cash-flow/:tenantId/:period',
    accountingController.getCashFlowStatement.bind(accountingController),
  );
  router.get(
    '/reports/ratios/:tenantId',
    accountingController.getFinancialRatios.bind(accountingController),
  );
  router.get(
    '/reports/comprehensive/:tenantId/:period',
    accountingController.getComprehensiveReport.bind(accountingController),
  );

  // Validation and Reconciliation Routes
  router.get(
    '/validation/integrity/:tenantId',
    accountingController.validateGLIntegrity.bind(accountingController),
  );
  router.post(
    '/reconciliation/:tenantId/:period',
    accountingController.reconcileTrialBalance.bind(accountingController),
  );
  router.get(
    '/reports/exceptions/:tenantId/:period',
    accountingController.generateExceptionReport.bind(accountingController),
  );

  return router;
}
