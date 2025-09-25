/** Centralized paths (BFF or Next route handlers can implement these) */
export const AccountingApi = {
  journalEntry: {
    post: '/api/accounting/journal-entries',
  },
  reports: {
    trialBalance: '/api/accounting/reports/trial-balance',
  },
  chartOfAccounts: {
    list: '/api/accounting/chart-of-accounts',
  },
} as const;
