import type { VirtualTableColumn } from '@aibos/ui';

import { AccountingClient } from '../lib/accounting-api';
import { AsyncLoading, SkeletonTable, VirtualTable } from '@aibos/ui';
import * as React from 'react';

interface Account {
  id: string;
  code: string;
  name: string;
}

export function ChartOfAccounts(): JSX.Element {
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadAccounts = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const client = new AccountingClient();
        const data = await client.listAccounts();
        setAccounts(data);
      } catch (error_) {
        setError((error_ as Error)?.message ?? 'Failed to load accounts');
      } finally {
        setLoading(false);
      }
    };

    void loadAccounts();
  }, []);

  const columns: VirtualTableColumn<Account>[] = React.useMemo(
    () => [
      {
        key: 'code',
        header: 'Account Code',
        width: 150,
        sortable: true,
      },
      {
        key: 'name',
        header: 'Account Name',
        width: 400,
        sortable: true,
      },
      {
        key: 'actions',
        header: 'Actions',
        width: 100,
        render: (_, row) => (
          <button
            type="button"
            className="text-blue-600 hover:text-blue-800"
            onClick={() => {
              // TODO: Implement account detail view
              console.log('View account:', row.id);
            }}
          >
            View
          </button>
        ),
      },
    ],
    [],
  );

  const handleRowClick = React.useCallback((account: Account) => {
    // TODO: Implement account detail navigation
    console.log('Account clicked:', account.code);
  }, []);

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Chart of Accounts</h2>
        <p className="text-sm text-gray-600">Manage your account structure</p>
      </div>

      <AsyncLoading
        isLoading={loading}
        error={error ? new Error(error) : undefined}
        loadingComponent={<SkeletonTable rows={15} columns={3} className="h-96" />}
        errorComponent={(error) => (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="mb-2 text-red-500">
                <svg
                  className="mx-auto h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <p className="text-sm text-gray-600">{error.message}</p>
            </div>
          </div>
        )}
      >
        <VirtualTable
          data={accounts as unknown as Record<string, unknown>[]}
          columns={columns as unknown as VirtualTableColumn<Record<string, unknown>>[]}
          height={600}
          rowHeight={40}
          onRowClick={
            handleRowClick as unknown as (row: Record<string, unknown>, index: number) => void
          }
          emptyMessage="No accounts found"
          className="rounded-lg border border-gray-200"
        />
      </AsyncLoading>
    </div>
  );
}
