import { z } from 'zod';

/** ULIDs/UUIDs allowed */
export const Id = z.string().min(1);

export const Money = z.object({
  currency: z.string().min(3).max(3),
  amount: z.number().finite(),
});

export const JournalEntryLine = z.object({
  id: Id.optional(),
  accountId: Id,
  /** + for debit, - for credit (store sign-safe) */
  amount: Money,
  memo: z.string().max(512).optional(),
  departmentId: Id.optional(),
  projectId: Id.optional(),
  segment: z.string().max(64).optional(),
});

export const JournalEntry = z.object({
  id: Id.optional(),
  reference: z.string().max(64).optional(),
  description: z.string().max(512).optional(),
  postedBy: z.string().max(128),
  postingDate: z.string(), // ISO date
  tenantId: Id,
  lines: z
    .array(JournalEntryLine)
    .min(2)
    .refine(
      (lines) => {
        const sum = lines.reduce((accumulator, l) => accumulator + l.amount.amount, 0);
        return Math.abs(sum) < 1e-9; // balanced
      },
      { message: 'Journal entry must be balanced (sum = 0)' },
    ),
});

export type TJournalEntry = z.infer<typeof JournalEntry>;
export type TJournalEntryLine = z.infer<typeof JournalEntryLine>;
