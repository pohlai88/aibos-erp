import type { TJournalEntry } from '@aibos/accounting-contracts';

import { AccountingClient } from '../lib/accounting-api';
import { TrialBalance, type TTrialBalance } from '@aibos/accounting-contracts';
import * as React from 'react';

/**
 * Lightweight hook without extra deps (no SWR/React Query).
 * It exposes imperative methods + simple state.
 */
export function useAccounting(client = new AccountingClient()): {
  loading: boolean;
  error: string | null;
  trialBalance: TTrialBalance | null;
  postJournalEntry: (_entry: TJournalEntry) => Promise<{ id: string }>;
  loadTrialBalance: (_q: { asOf: string; tenantId: string }) => Promise<TTrialBalance>;
} {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [trialBalance, setTrialBalance] = React.useState<TTrialBalance | null>(null);

  const postJournalEntry = React.useCallback(
    async (entry: TJournalEntry) => {
      setLoading(true);
      setError(null);
      try {
        return await client.postJournalEntry(entry);
      } catch (error_: unknown) {
        setError((error_ as Error)?.message ?? 'Unknown error');
        throw error_;
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  const loadTrialBalance = React.useCallback(
    async (q: { asOf: string; tenantId: string }) => {
      setLoading(true);
      setError(null);
      try {
        const data = await client.getTrialBalance(q);
        setTrialBalance(TrialBalance.parse(data));
        return data;
      } catch (error_: unknown) {
        setError((error_ as Error)?.message ?? 'Unknown error');
        throw error_;
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  return { loading, error, trialBalance, postJournalEntry, loadTrialBalance };
}
