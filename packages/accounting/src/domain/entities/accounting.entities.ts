export interface Account {
  accountCode: string;
  accountName: string;
  accountType: string;
  parentAccountCode?: string;
  tenantId: string;
  balance: number;
  isActive: boolean;
}

export interface JournalEntryLine {
  accountCode: string;
  debitAmount: number;
  creditAmount: number;
  currency: string;
  description?: string;
}

export interface JournalEntry {
  id: string;
  tenantId: string;
  entries: JournalEntryLine[];
  reference?: string;
  description?: string;
  postingDate: Date;
  status: 'DRAFT' | 'POSTED' | 'REVERSED';
}

export interface GeneralLedgerEntry {
  id: string;
  tenantId: string;
  journalId: string;
  accountCode: string;
  debitAmount: number;
  creditAmount: number;
  currency: string;
  postingTs: Date;
  reference?: string;
  description?: string;
}
