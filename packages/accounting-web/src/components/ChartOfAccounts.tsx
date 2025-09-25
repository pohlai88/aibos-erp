import { AccountingClient } from '../lib/accounting-api';
import * as React from 'react';

export function ChartOfAccounts(): JSX.Element {
  const [rows, setRows] = React.useState<Array<{ id: string; code: string; name: string }>>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const client = new AccountingClient();
    client
      .listAccounts()
      .then(setRows)
      .catch((error_) => setError((error_ as Error)?.message ?? 'Failed to load accounts'));
  }, []);

  if (error) return <div className="text-red-600">{error}</div>;
  return (
    <ul className="space-y-1">
      {rows.map((r) => (
        <li key={r.id} className="rounded border p-2">
          {r.code} — {r.name}
        </li>
      ))}
    </ul>
  );
}
