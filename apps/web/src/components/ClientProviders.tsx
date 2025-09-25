'use client';

import { ErrorBoundary, CorrelationProvider } from '@aibos/ui';

interface ClientProvidersProperties {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProperties): JSX.Element {
  return (
    <ErrorBoundary
      onError={(error, errorInfo, errorId) => {
        console.error('Application Error:', {
          errorId,
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
        });
      }}
    >
      <CorrelationProvider>{children}</CorrelationProvider>
    </ErrorBoundary>
  );
}
