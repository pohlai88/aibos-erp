export interface CreateAccountCommand {
  accountCode: string;
  accountName: string;
  accountType: string;
  parentAccountCode?: string;
  tenantId: string;
  userId: string;
}

export interface PostJournalEntryCommand {
  journalEntryId: string;
  entries: Array<{
    accountCode: string;
    debitAmount: number;
    creditAmount: number;
    currency: string;
    description?: string;
  }>;
  reference?: string;
  description?: string;
  postingDate: Date;
  tenantId: string;
  userId: string;
  baseCurrency?: string;
}

export interface GetTrialBalanceCommand {
  tenantId: string;
  asOfDate: Date;
}

export interface GetFinancialReportCommand {
  tenantId: string;
  fromDate: Date;
  toDate: Date;
  reportType: 'PROFIT_AND_LOSS' | 'BALANCE_SHEET' | 'CASH_FLOW';
}
