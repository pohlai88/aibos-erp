import type { TTrialBalanceQuery } from '@aibos/accounting-contracts';

import { useAccounting } from '../hooks/useAccounting';
import * as React from 'react';

type Properties = { query: TTrialBalanceQuery };

export function TrialBalance({ query }: Properties): JSX.Element {
  const { trialBalance, loadTrialBalance, loading, error } = useAccounting();

  React.useEffect(() => {
    void loadTrialBalance(query);
  }, [query, loadTrialBalance]);

  if (loading && !trialBalance) return <div>Loading…</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;
  if (!trialBalance) return <div>No data available</div>;

  return (
    <div className="w-full overflow-auto">
      <div className="mb-2 text-sm text-gray-600">
        As of {new Date(trialBalance.asOf).toLocaleDateString()}
      </div>
      <table className="min-w-full border text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="border px-3 py-2 text-left">Account</th>
            <th className="border px-3 py-2 text-right">Debit</th>
            <th className="border px-3 py-2 text-right">Credit</th>
            <th className="border px-3 py-2 text-right">Balance</th>
          </tr>
        </thead>
        <tbody>
          {trialBalance.rows.map((r, index) => (
            <tr key={index}>
              <td className="border px-3 py-1">
                {r.accountCode} — {r.accountName}
              </td>
              <td className="border px-3 py-1 text-right">{r.debit.toLocaleString()}</td>
              <td className="border px-3 py-1 text-right">{r.credit.toLocaleString()}</td>
              <td className="border px-3 py-1 text-right">{r.balance.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
