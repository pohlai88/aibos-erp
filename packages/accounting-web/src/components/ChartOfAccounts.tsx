import * as React from 'react';
import type { VirtualTableColumn } from '@aibos/ui';
import { AsyncLoading, SkeletonTable, VirtualTable, tokens } from '@aibos/ui';
import { AccountingClient } from '../lib/accounting-api';

interface Account extends Record<string, unknown> {
  id: string;
  code: string;
  name: string;
}

type ChartOfAccountsProps = {
  /**
   * Optional hook to surface user interaction outside this component
   * (analytics, audit trail, navigation).
   */
  onViewAccount?: (accountId: string) => void;
  /**
   * Optional company scope to enable multi-company reuse without forking UI.
   */
  companyId?: string;
};

export function ChartOfAccounts(props: ChartOfAccountsProps): JSX.Element {
  const { onViewAccount, companyId } = props;
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadAccounts = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const client = new AccountingClient();
        // companyId reserved for future: list accounts within a scope
        // (server can ignore if not supported yet)
        const data = await client.listAccounts({ companyId });
        setAccounts(data);
      } catch (error_) {
        setError((error_ as Error)?.message ?? 'Failed to load accounts');
      } finally {
        setLoading(false);
      }
    };

    void loadAccounts();
  }, [companyId]);

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
        width: 112,
        render: (_value, row) => {
          const handleView = (): void => {
            if (onViewAccount) onViewAccount(row.id);
            // Keep console for local dev trace without relying on it
            // eslint-disable-next-line no-console
            console.log('View account:', row.id);
          };
          return (
            <button
              type="button"
              aria-label={`View account ${row.code} – ${row.name}`}
              onClick={handleView}
              style={{
                color: tokens.colors.primary[600],
                padding: tokens.spacing[1],
                borderRadius: tokens.borderRadius.sm,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: tokens.typography.fontSize.sm,
                fontWeight: tokens.typography.fontWeight.medium,
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleView();
              }}
            >
              View
            </button>
          );
        },
      },
    ],
    [onViewAccount],
  );

  const handleRowClick = React.useCallback((account: Account) => {
    // Single source for navigation/analytics
    if (onViewAccount) onViewAccount(account.id);
    // eslint-disable-next-line no-console
    console.log('Account clicked:', account.code);
  }, [onViewAccount]);

  return (
    <div
      style={{
        width: '100%',
        padding: tokens.spacing[4],
        background: tokens.colors.neutral[50],
        borderRadius: tokens.borderRadius['2xl'],
        border: `1px solid ${tokens.colors.neutral[200]}`,
      }}
      aria-label="Chart of Accounts container"
    >
      <div
        style={{
          marginBottom: tokens.spacing[3],
        }}
      >
        <h2
          style={{
            fontSize: tokens.typography.fontSize.xl,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: tokens.colors.neutral[900],
            margin: 0,
          }}
        >
          Chart of Accounts
        </h2>
        <p
          style={{
            fontSize: tokens.typography.fontSize.sm,
            color: tokens.colors.neutral[600],
            margin: 0,
            marginTop: tokens.spacing[1],
          }}
        >
          Manage your account structure
        </p>
      </div>

      <AsyncLoading
        isLoading={loading}
        error={error ? new Error(error) : undefined}
        loadingComponent={
          <div style={{ height: 384 }}>
            <SkeletonTable rows={15} columns={3} />
          </div>
        }
        errorComponent={(error: Error) => (
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: tokens.spacing[6],
              textAlign: 'center',
              color: tokens.colors.error[600],
            }}
          >
            <div>
              <div style={{ marginBottom: tokens.spacing[2] }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <p style={{ fontSize: tokens.typography.fontSize.sm }}>{error.message}</p>
            </div>
          </div>
        )}
      >
        <VirtualTable
          data={accounts}
          columns={columns}
          height={600}
          rowHeight={40}
          onRowClick={(row: Account) => handleRowClick(row)}
          emptyMessage="No accounts found"
          className="rounded-lg border border-semantic-border"
        />
      </AsyncLoading>
    </div>
  );
}