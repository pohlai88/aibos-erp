import { Id } from './journal-entry';
import { z } from 'zod';

export const AccountType = z.enum([
  'ASSET',
  'LIABILITY',
  'EQUITY',
  'REVENUE',
  'EXPENSE',
  'CONTRA_ASSET',
  'CONTRA_LIABILITY',
  'CONTRA_EQUITY',
]);

export const NormalBalance = z.enum(['DEBIT', 'CREDIT']);

export const Account = z.object({
  id: Id,
  code: z.string().min(1).max(32),
  name: z.string().min(1).max(128),
  type: AccountType,
  normalBalance: NormalBalance,
  parentId: Id.optional(),
  isPostingAllowed: z.boolean().default(true),
  mfrsSection: z.string().max(64).optional(), // place for MFRS mapping tag
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export type TAccount = z.infer<typeof Account>;
