import { z } from 'zod';

export const TrialBalanceQuery = z.object({
  asOf: z.string(), // ISO date
  tenantId: z.string().min(1),
});

export const TrialBalanceRow = z.object({
  accountCode: z.string(),
  accountName: z.string(),
  debit: z.number().default(0),
  credit: z.number().default(0),
  balance: z.number().default(0),
});

export const TrialBalance = z.object({
  asOf: z.string(),
  rows: z.array(TrialBalanceRow),
});

export type TTrialBalanceQuery = z.infer<typeof TrialBalanceQuery>;
export type TTrialBalance = z.infer<typeof TrialBalance>;
export type TTrialBalanceRow = z.infer<typeof TrialBalanceRow>;
