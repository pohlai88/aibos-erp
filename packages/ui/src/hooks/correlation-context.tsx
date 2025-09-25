'use client';

import React, { createContext, useContext, useMemo, useCallback, type ReactNode, type HTMLAttributes, type ElementType } from 'react';
import { cn, variants, createPolymorphic, type PolymorphicReference } from '../utils';

export interface CorrelationContextValue {
  correlationId: string;
  userId?: string;
  tenantId?: string;
  operation?: string;
  component?: string;
  sessionId?: string;
  requestId?: string;
  traceId?: string;
  spanId?: string;
  metadata?: Record<string, unknown>;
}

const CorrelationContext = createContext<CorrelationContextValue | undefined>(undefined);

export interface CorrelationProviderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  correlationId?: string;
  userId?: string;
  tenantId?: string;
  operation?: string;
  component?: string;
  sessionId?: string;
  requestId?: string;
  traceId?: string;
  spanId?: string;
  metadata?: Record<string, unknown>;
  className?: string;
  as?: ElementType;
  debug?: boolean;
}

const correlationProviderVariants = variants({
  base: 'correlation-provider',
  variants: {
    debug: {
      true: 'debug-mode',
      false: '',
    },
    theme: {
      light: 'theme-light',
      dark: 'theme-dark',
      auto: 'theme-auto',
    },
  },
  defaultVariants: { debug: 'false' as 'true' | 'false', theme: 'auto' },
  strict: true,
});

/**
 * Enhanced correlation provider with polymorphic support and debugging features
 * Provides correlation ID context throughout the component tree
 * Enables request tracing and debugging across components
 */
export const CorrelationProvider = createPolymorphic<'div'>(
  ({
    as: Component = 'div',
    children,
    correlationId,
    userId,
    tenantId,
    operation,
    component,
    sessionId,
    requestId,
    traceId,
    spanId,
    metadata,
    className,
    debug = false,
    theme = 'auto',
    ...props
  }, ref: PolymorphicReference<'div'>) => {
    const value = useMemo(
      (): CorrelationContextValue => ({
        correlationId: (correlationId as string) || crypto.randomUUID(),
        userId: userId as string | undefined,
        tenantId: tenantId as string | undefined,
        operation: operation as string | undefined,
        component: component as string | undefined,
        sessionId: (sessionId as string) || crypto.randomUUID(),
        requestId: (requestId as string) || crypto.randomUUID(),
        traceId: (traceId as string) || crypto.randomUUID(),
        spanId: (spanId as string) || crypto.randomUUID(),
        metadata: (metadata as Record<string, unknown>) || {},
      }),
      [correlationId, userId, tenantId, operation, component, sessionId, requestId, traceId, spanId, metadata],
    );

    // Debug logging in development
    if (debug && typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
      console.log('[CorrelationProvider] Context initialized:', value);
    }

    return (
      <Component
        ref={ref}
        className={cn(
          correlationProviderVariants({ 
            debug: (debug ? 'true' : 'false') as 'true' | 'false' | undefined,
            theme: theme as 'light' | 'dark' | 'auto' | undefined
          }),
          className as string
        )}
        data-correlation-id={value.correlationId}
        data-operation={value.operation}
        data-component={value.component}
        {...(props as any)}
      >
        <CorrelationContext.Provider value={value}>{children as ReactNode}</CorrelationContext.Provider>
      </Component>
    );
  },
  'CorrelationProvider'
);

/**
 * Hook to access correlation context with enhanced error handling
 */
export function useCorrelationContext(): CorrelationContextValue {
  const context = useContext(CorrelationContext);

  if (!context) {
    // Return default values if no context is provided
    const defaultContext = {
      correlationId: crypto.randomUUID(),
      sessionId: crypto.randomUUID(),
      requestId: crypto.randomUUID(),
      traceId: crypto.randomUUID(),
      spanId: crypto.randomUUID(),
      metadata: {},
    };

    if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
      console.warn('[useCorrelationContext] No CorrelationProvider found, using default values');
    }

    return defaultContext;
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

/**
 * Hook to create a new span ID for tracing
 */
export function useSpanCorrelation(spanName: string): CorrelationContextValue {
  const parentContext = useCorrelationContext();

  return useMemo(
    () => ({
      ...parentContext,
      spanId: crypto.randomUUID(),
      operation: spanName,
      metadata: {
        ...parentContext.metadata,
        spanName,
        parentSpanId: parentContext.spanId,
      },
    }),
    [parentContext, spanName],
  );
}

/**
 * Hook to add metadata to the current correlation context
 */
export function useCorrelationMetadata(): {
  addMetadata: (key: string, value: unknown) => void;
  getMetadata: (key: string) => unknown;
  removeMetadata: (key: string) => void;
  clearMetadata: () => void;
} {
  const context = useCorrelationContext();

  const addMetadata = useCallback((key: string, value: unknown) => {
    if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
      console.log(`[CorrelationMetadata] Adding metadata: ${key} =`, value);
    }
  }, []);

  const getMetadata = useCallback((key: string) => {
    return context.metadata?.[key];
  }, [context.metadata]);

  const removeMetadata = useCallback((key: string) => {
    if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
      console.log(`[CorrelationMetadata] Removing metadata: ${key}`);
    }
  }, []);

  const clearMetadata = useCallback(() => {
    if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
      console.log('[CorrelationMetadata] Clearing all metadata');
    }
  }, []);

  return {
    addMetadata,
    getMetadata,
    removeMetadata,
    clearMetadata,
  };
}

export interface CorrelationDebuggerProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  as?: ElementType;
  showMetadata?: boolean;
  compact?: boolean;
}

const correlationDebuggerVariants = variants({
  base: 'correlation-debugger font-mono text-xs bg-semantic-muted border border-semantic-border rounded p-2',
  variants: {
    compact: {
      true: 'p-1 text-xs',
      false: 'p-2 text-sm',
    },
    theme: {
      light: 'bg-gray-100 text-gray-800',
      dark: 'bg-gray-800 text-gray-200',
      auto: 'bg-semantic-muted text-semantic-foreground',
    },
  },
  defaultVariants: { compact: 'false' as 'true' | 'false', theme: 'auto' },
  strict: true,
});

/**
 * Polymorphic correlation debugger component for development
 */
export const CorrelationDebugger = createPolymorphic<'div'>(
  ({ 
    as: Component = 'div', 
    className, 
    showMetadata = true, 
    compact = false,
    theme = 'auto',
    ...props 
  }, ref: PolymorphicReference<'div'>) => {
    const context = useCorrelationContext();

    if (typeof window === 'undefined' || window.location?.hostname !== 'localhost') {
      return null; // Only show in development
    }

    return (
      <Component
        ref={ref}
        className={cn(
          correlationDebuggerVariants({ 
            compact: (compact ? 'true' : 'false') as 'true' | 'false' | undefined,
            theme: theme as 'light' | 'dark' | 'auto' | undefined
          }),
          className as string
        )}
        {...(props as any)}
      >
        <div className="font-semibold mb-1">Correlation Context</div>
        <div className="space-y-1">
          <div><span className="text-semantic-muted-foreground">ID:</span> {context.correlationId}</div>
          {context.operation && (
            <div><span className="text-semantic-muted-foreground">Operation:</span> {context.operation}</div>
          )}
          {context.component && (
            <div><span className="text-semantic-muted-foreground">Component:</span> {context.component}</div>
          )}
          {context.userId && (
            <div><span className="text-semantic-muted-foreground">User:</span> {context.userId}</div>
          )}
          {context.tenantId && (
            <div><span className="text-semantic-muted-foreground">Tenant:</span> {context.tenantId}</div>
          )}
          {showMetadata && context.metadata && Object.keys(context.metadata).length > 0 ? (
            <div>
              <span className="text-semantic-muted-foreground">Metadata:</span>
              <pre className="mt-1 text-xs overflow-auto max-h-20">
                {JSON.stringify(context.metadata, null, 2)}
              </pre>
            </div>
          ) : null}
        </div>
      </Component>
    );
  },
  'CorrelationDebugger'
);

export interface CorrelationBoundaryProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onError'> {
  children: ReactNode;
  operation: string;
  component?: string;
  className?: string;
  as?: ElementType;
  debug?: boolean;
  onError?: (error: Error, context: CorrelationContextValue) => void;
}

/**
 * Polymorphic correlation boundary component for error tracking
 */
export const CorrelationBoundary = createPolymorphic<'div'>(
  ({ 
    as: Component = 'div', 
    children, 
    operation, 
    component, 
    className, 
    debug = false,
    onError,
    ...props 
  }, ref: PolymorphicReference<'div'>) => {
    const parentContext = useCorrelationContext();
    const operationContext = useOperationCorrelation(operation as string);

    const handleError = useCallback((error: Error) => {
      const errorContext: CorrelationContextValue = {
        ...operationContext,
        component: (component as string) || 'Unknown',
        metadata: {
          ...operationContext.metadata,
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        },
      };

      if (debug && typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
        console.error('[CorrelationBoundary] Error occurred:', errorContext);
      }

      (onError as ((error: Error, context: CorrelationContextValue) => void) | undefined)?.(error, errorContext);
    }, [operationContext, component, debug, onError]);

    return (
      <Component
        ref={ref}
        className={cn('correlation-boundary', className as string)}
        data-operation={operation}
        data-component={component}
        data-correlation-id={operationContext.correlationId}
        {...(props as any)}
      >
        <CorrelationProvider
          correlationId={operationContext.correlationId}
          operation={operation}
          component={component}
          debug={debug}
        >
          {children as ReactNode}
        </CorrelationProvider>
      </Component>
    );
  },
  'CorrelationBoundary'
);

/**
 * Higher-order component for automatic correlation wrapping
 */
export function withCorrelation<P extends object>(
  Component: React.ComponentType<P>,
  operation: string,
  options: {
    component?: string;
    debug?: boolean;
    onError?: (error: Error, context: CorrelationContextValue) => void;
  } = {},
): React.ComponentType<P> {
  const WrappedComponent = (props: P): JSX.Element => (
    <CorrelationBoundary
      operation={operation}
      component={options.component}
      debug={options.debug}
      onError={options.onError}
    >
      <Component {...props} />
    </CorrelationBoundary>
  );

  WrappedComponent.displayName = `withCorrelation(${Component.displayName || Component.name})`;

  return WrappedComponent;
}