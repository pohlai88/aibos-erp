import React, { createContext, useContext, useMemo } from 'react';

export interface CorrelationContextValue {
  correlationId: string;
  userId?: string;
  tenantId?: string;
  operation?: string;
  component?: string;
}

const CorrelationContext = createContext<CorrelationContextValue | undefined>(undefined);

export interface CorrelationProviderProps {
  children: React.ReactNode;
  correlationId?: string;
  userId?: string;
  tenantId?: string;
  operation?: string;
  component?: string;
}

/**
 * Provides correlation ID context throughout the component tree
 * Enables request tracing and debugging across components
 */
export function CorrelationProvider({
  children,
  correlationId,
  userId,
  tenantId,
  operation,
  component,
}: CorrelationProviderProps): JSX.Element {
  const value = useMemo(
    () => ({
      correlationId: correlationId || crypto.randomUUID(),
      userId,
      tenantId,
      operation,
      component,
    }),
    [correlationId, userId, tenantId, operation, component],
  );

  return <CorrelationContext.Provider value={value}>{children}</CorrelationContext.Provider>;
}

/**
 * Hook to access correlation context
 */
export function useCorrelationContext(): CorrelationContextValue {
  const context = useContext(CorrelationContext);

  if (!context) {
    // Return default values if no context is provided
    return {
      correlationId: crypto.randomUUID(),
    };
  }

  return context;
}

/**
 * Hook to create a new correlation ID for a specific operation
 */
export function useOperationCorrelation(operation: string): CorrelationContextValue {
  const parentContext = useCorrelationContext();

  return useMemo(
    () => ({
      ...parentContext,
      correlationId: crypto.randomUUID(),
      operation,
    }),
    [parentContext, operation],
  );
}
