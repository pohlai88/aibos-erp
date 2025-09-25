import React, { Component, type ReactNode } from 'react';

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
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-red-500"
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
                <h3 className="text-lg font-medium text-gray-900">Something went wrong</h3>
              </div>
            </div>

            <div className="mb-4">
              <p className="mb-2 text-sm text-gray-600">
                We're sorry, but something unexpected happened. Our team has been notified.
              </p>
              <div className="rounded bg-gray-100 p-3 font-mono text-xs text-gray-700">
                <div>Error ID: {this.state.errorId}</div>
                <div>Correlation ID: {this.correlationId}</div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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
