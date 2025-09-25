'use client';

import React, { Component, type ReactNode, type HTMLAttributes, type ElementType } from 'react';
import { cn, variants, createPolymorphic, type PolymorphicReference } from '../utils';

export interface ErrorBoundaryState {
  hasError: boolean;
  errorId: string;
  error: Error | undefined;
  errorInfo: React.ErrorInfo | undefined;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorId: string, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo, errorId: string) => void;
  correlationId?: string;
}

const errorBoundaryVariants = variants({
  base: 'flex min-h-screen items-center justify-center bg-semantic-background',
  variants: {
    size: {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    },
    variant: {
      default: 'max-w-md',
      wide: 'max-w-lg',
      full: 'max-w-full',
    },
  },
  defaultVariants: { size: 'md', variant: 'default' },
  strict: true, // Enable dev-time warnings for unknown variants
});

const errorCardVariants = variants({
  base: 'w-full rounded-lg bg-semantic-card shadow-lg',
  variants: {
    size: {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    },
  },
  defaultVariants: { size: 'md' },
  strict: true,
});

const errorButtonVariants = variants({
  base: 'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  variants: {
    variant: {
      primary: 'bg-semantic-primary text-semantic-primary-foreground hover:bg-semantic-primary/90 focus:ring-semantic-primary',
      secondary: 'bg-semantic-secondary text-semantic-secondary-foreground hover:bg-semantic-secondary/80 focus:ring-semantic-secondary',
    },
  },
  defaultVariants: { variant: 'primary' },
  strict: true,
});

/**
 * Enterprise-grade error boundary with correlation ID tracking
 * Provides comprehensive error handling and user-friendly fallbacks
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private correlationId: string;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.correlationId = props.correlationId || crypto.randomUUID();
    this.state = {
      hasError: false,
      errorId: '',
      error: undefined,
      errorInfo: undefined,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      errorId: crypto.randomUUID(),
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const errorId = this.state.errorId;

    // Update state with error info
    this.setState({ errorInfo });

    // Log error with correlation ID
    console.error(`[ErrorBoundary] Error ${errorId} (Correlation: ${this.correlationId}):`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      correlationId: this.correlationId,
      errorId,
      timestamp: new Date().toISOString(),
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo, errorId);

    // Emit error event for observability
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(
        new window.CustomEvent('error-boundary', {
          detail: {
            errorId,
            correlationId: this.correlationId,
            error: error.message,
            componentStack: errorInfo.componentStack,
            timestamp: new Date().toISOString(),
          },
        }),
      );
    }
  }

  private handleRetry = (): void => {
    this.setState({
      hasError: false,
      errorId: '',
      error: undefined,
      errorInfo: undefined,
    });
  };

  override render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorId, this.handleRetry);
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorId={this.state.errorId}
          correlationId={this.correlationId}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

export interface ErrorFallbackProps extends HTMLAttributes<HTMLDivElement> {
  error: Error;
  errorId: string;
  correlationId: string;
  onRetry: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'wide' | 'full';
  className?: string;
  as?: ElementType;
}

/**
 * Polymorphic error fallback component with enhanced styling
 */
export const ErrorFallback = createPolymorphic<'div'>(
  ({ 
    as: Component = 'div', 
    error, 
    errorId, 
    correlationId, 
    onRetry, 
    size = 'md',
    variant = 'default',
    className,
    ...props 
  }, ref: PolymorphicReference<'div'>) => {
    return (
      <Component
        ref={ref}
        className={cn(
          errorBoundaryVariants({ 
            size: size as 'sm' | 'md' | 'lg' | undefined,
            variant: variant as 'default' | 'wide' | 'full' | undefined
          }),
          className as string
        )}
        {...(props as any)}
      >
        <div className={cn(errorCardVariants({ size: size as 'sm' | 'md' | 'lg' | undefined }))}>
          <div className="mb-4 flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-8 w-8 text-semantic-error"
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
            <div className="ml-3">
              <h3 className="text-lg font-medium text-semantic-foreground">Something went wrong</h3>
            </div>
          </div>
          <div className="mb-4">
            <p className="mb-2 text-sm text-semantic-muted-foreground">
              We're sorry, but something unexpected happened. Our team has been notified.
            </p>
            <div className="rounded bg-semantic-muted p-3 font-mono text-xs text-semantic-muted-foreground">
              <div>Error ID: {errorId as string}</div>
              <div>Correlation ID: {correlationId as string}</div>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onRetry as React.MouseEventHandler<HTMLButtonElement>}
              className={cn(errorButtonVariants({ variant: 'primary' as 'primary' | 'secondary' }))}
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className={cn(errorButtonVariants({ variant: 'secondary' as 'primary' | 'secondary' }))}
            >
              Reload Page
            </button>
          </div>
        </div>
      </Component>
    );
  },
  'ErrorFallback'
);

export interface ErrorIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  as?: ElementType;
}

const errorIconVariants = variants({
  base: 'flex-shrink-0 text-semantic-error',
  variants: {
    size: {
      sm: 'h-6 w-6',
      md: 'h-8 w-8',
      lg: 'h-12 w-12',
    },
  },
  defaultVariants: { size: 'md' },
  strict: true,
});

/**
 * Polymorphic error icon component
 */
export const ErrorIcon = createPolymorphic<'div'>(
  ({ as: Component = 'div', size = 'md', className, ...props }, ref: PolymorphicReference<'div'>) => {
    return (
      <Component
        ref={ref}
        className={cn(errorIconVariants({ size: size as 'sm' | 'md' | 'lg' }), className as string)}
        {...(props as any)}
      >
        <svg
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
      </Component>
    );
  },
  'ErrorIcon'
);

export interface ErrorDetailsProps extends HTMLAttributes<HTMLDivElement> {
  errorId: string;
  correlationId: string;
  error?: Error;
  className?: string;
  as?: ElementType;
}

/**
 * Polymorphic error details component
 */
export const ErrorDetails = createPolymorphic<'div'>(
  ({ as: Component = 'div', errorId, correlationId, error, className, ...props }, ref: PolymorphicReference<'div'>) => {
    return (
      <Component
        ref={ref}
        className={cn('rounded bg-semantic-muted p-3 font-mono text-xs text-semantic-muted-foreground', className as string)}
        {...(props as any)}
      >
        <div>Error ID: {errorId as string}</div>
        <div>Correlation ID: {correlationId as string}</div>
        {error && (
          <>
            <div className="mt-2 pt-2 border-t border-semantic-border">
              <div className="font-semibold">Error Details:</div>
              <div className="mt-1">{(error as Error).message}</div>
            </div>
          </>
        )}
      </Component>
    );
  },
  'ErrorDetails'
);

export interface ErrorActionsProps extends HTMLAttributes<HTMLDivElement> {
  onRetry: () => void;
  onReload?: () => void;
  className?: string;
  as?: ElementType;
}

/**
 * Polymorphic error actions component
 */
export const ErrorActions = createPolymorphic<'div'>(
  ({ as: Component = 'div', onRetry, onReload, className, ...props }, ref: PolymorphicReference<'div'>) => {
    return (
      <Component
        ref={ref}
        className={cn('flex space-x-3', className as string)}
        {...(props as any)}
      >
        <button
          onClick={onRetry as React.MouseEventHandler<HTMLButtonElement>}
          className={cn(errorButtonVariants({ variant: 'primary' as 'primary' | 'secondary' }))}
        >
          Try Again
        </button>
        <button
          onClick={(onReload as React.MouseEventHandler<HTMLButtonElement>) || (() => window.location.reload())}
          className={cn(errorButtonVariants({ variant: 'secondary' as 'primary' | 'secondary' }))}
        >
          Reload Page
        </button>
      </Component>
    );
  },
  'ErrorActions'
);

/**
 * Hook to get current correlation ID
 */
export function useCorrelationId(): string {
  const [correlationId] = React.useState(() => crypto.randomUUID());
  return correlationId;
}

/**
 * Higher-order component for automatic error boundary wrapping
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>,
): React.ComponentType<P> {
  const WrappedComponent = (props: P): JSX.Element => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}