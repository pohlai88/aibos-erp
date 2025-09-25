import * as React from 'react';

export function FinancialDashboard(): JSX.Element {
  // Placeholder for KPIs; you'll wire to BFF later
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded border p-4">
        <div className="text-xs text-gray-500">Revenue (MTD)</div>
        <div className="text-2xl font-semibold">—</div>
      </div>
      <div className="rounded border p-4">
        <div className="text-xs text-gray-500">Expenses (MTD)</div>
        <div className="text-2xl font-semibold">—</div>
      </div>
    </div>
  );
}
