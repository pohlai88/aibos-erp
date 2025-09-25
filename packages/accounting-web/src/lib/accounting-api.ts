import type { TJournalEntry, TTrialBalance } from '@aibos/accounting-contracts';

import { AccountingApi, TrialBalance } from '@aibos/accounting-contracts';

type FetcherInit = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

type FetcherResponse = {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
};

type Fetcher = (_input: string, _init?: FetcherInit) => Promise<FetcherResponse>;

const defaultFetcher: Fetcher = (_input, _init) => fetch(_input, _init) as Promise<FetcherResponse>;

/** Thin, dependency-free API client. */
export class AccountingClient {
  constructor(private readonly _fetcher: Fetcher = defaultFetcher) {}

  async postJournalEntry(entry: TJournalEntry): Promise<{ id: string }> {
    const res = await this._fetcher(AccountingApi.journalEntry.post, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!res.ok) throw new Error(`Failed to post journal entry: ${res.status}`);
    return res.json() as Promise<{ id: string }>;
  }

  async getTrialBalance(q: { asOf: string; tenantId: string }): Promise<TTrialBalance> {
    const url = new URL(
      AccountingApi.reports.trialBalance,
      globalThis.location?.origin ?? 'http://localhost',
    );
    url.searchParams.set('asOf', q.asOf);
    url.searchParams.set('tenantId', q.tenantId);
    const res = await this._fetcher(url.toString());
    if (!res.ok) throw new Error(`Failed to load trial balance: ${res.status}`);
    const data = await res.json();
    return TrialBalance.parse(data);
  }

  async listAccounts(): Promise<Array<{ id: string; code: string; name: string }>> {
    const res = await this._fetcher(AccountingApi.chartOfAccounts.list);
    if (!res.ok) throw new Error(`Failed to load chart of accounts: ${res.status}`);
    return res.json() as Promise<Array<{ id: string; code: string; name: string }>>;
  }
}
