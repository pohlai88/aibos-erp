import React from 'react';
import { cn } from './utils';

export interface LoadingStateProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  className?: string;
}

/**
 * Standardized loading spinner component
 */
export function LoadingSpinner({
  size = 'medium',
  text,
  className = '',
}: LoadingStateProps): JSX.Element {
  const getSizeClass = (size: 'small' | 'medium' | 'large'): string => {
    switch (size) {
      case 'small':
        return 'h-4 w-4';
      case 'large':
        return 'h-12 w-12';
      default:
        return 'h-8 w-8';
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${getSizeClass(size)}`}
      />
      {text && <p className="mt-2 text-sm text-gray-600">{text}</p>}
    </div>
  );
}

/**
 * Skeleton loader for content placeholders
 */
export function SkeletonLoader({
  className = '',
  lines = 3,
}: {
  className?: string;
  lines?: number;
}): JSX.Element {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, index: number) => (
        <div
          key={index}
          className={`mb-2 h-4 rounded bg-gray-200 ${index === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

/**
 * Loading state wrapper for async operations
 */
export interface AsyncLoadingProps {
  isLoading: boolean;
  error?: Error | null;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: (error: Error) => React.ReactNode;
  className?: string;
}

export function AsyncLoading({
  isLoading,
  error,
  children,
  loadingComponent,
  errorComponent,
  className = '',
}: AsyncLoadingProps): JSX.Element {
  if (error) {
    return (
      <div className={className}>
        {errorComponent ? (
          errorComponent(error)
        ) : (
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
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={className}>{loadingComponent || <LoadingSpinner text="Loading..." />}</div>
    );
  }

  return <div className={className}>{children}</div>;
}

/**
 * Loading button component
 */
export interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function LoadingButton({
  isLoading,
  loadingText = 'Loading...',
  children,
  disabled,
  className = '',
  ...props
}: LoadingButtonProps): JSX.Element {
  return (
    <button {...props} disabled={disabled || isLoading} className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white" />
        </div>
      )}
      <span className={isLoading ? 'opacity-0' : 'opacity-100'}>
        {isLoading ? loadingText : children}
      </span>
    </button>
  );
}

/**
 * Enhanced Skeleton Loading Components for Better UX
 */

export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  animate?: boolean;
}

export function Skeleton({
  className = '',
  width = '100%',
  height = '1rem',
  rounded = false,
  animate = true,
}: SkeletonProps): JSX.Element {
  return (
    <div
      className={cn(
        'bg-gray-200',
        rounded && 'rounded-full',
        !rounded && 'rounded',
        animate && 'animate-pulse',
        className,
      )}
      style={{ width, height }}
    />
  );
}

export interface SkeletonCardProps {
  className?: string;
  showAvatar?: boolean;
  lines?: number;
}

export function SkeletonCard({
  className = '',
  showAvatar = false,
  lines = 3,
}: SkeletonCardProps): JSX.Element {
  return (
    <div className={cn('rounded-lg border border-gray-200 p-4', className)}>
      <div className="flex items-start space-x-3">
        {showAvatar && <Skeleton width={40} height={40} rounded />}
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height="1rem" />
          {Array.from({ length: lines }).map((_, index) => (
            <Skeleton key={index} width={index === lines - 1 ? '40%' : '100%'} height="0.875rem" />
          ))}
        </div>
      </div>
    </div>
  );
}

export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className = '',
}: SkeletonTableProps): JSX.Element {
  return (
    <div className={cn('overflow-hidden rounded-lg border border-gray-200', className)}>
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 p-3">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} width="25%" height="1rem" />
          ))}
        </div>
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="border-b border-gray-100 p-3 last:border-b-0">
          <div className="flex space-x-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} width={colIndex === 0 ? '30%' : '20%'} height="0.875rem" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export interface SkeletonDashboardProps {
  className?: string;
}

export function SkeletonDashboard({ className = '' }: SkeletonDashboardProps): JSX.Element {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="space-y-2">
        <Skeleton width="200px" height="2rem" />
        <Skeleton width="400px" height="1rem" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-lg border border-gray-200 p-4">
            <Skeleton width="60%" height="0.875rem" className="mb-2" />
            <Skeleton width="80%" height="1.5rem" className="mb-1" />
            <Skeleton width="40%" height="0.75rem" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="rounded-lg border border-gray-200 p-4">
            <Skeleton width="120px" height="1.25rem" className="mb-4" />
            <Skeleton width="100%" height="200px" />
          </div>
        ))}
      </div>

      {/* Table */}
      <SkeletonTable rows={6} columns={5} />
    </div>
  );
}

export interface SkeletonFormProps {
  fields?: number;
  className?: string;
}

export function SkeletonForm({ fields = 4, className = '' }: SkeletonFormProps): JSX.Element {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton width="120px" height="0.875rem" />
          <Skeleton width="100%" height="2.5rem" />
        </div>
      ))}

      {/* Submit Button */}
      <div className="flex justify-end space-x-3 pt-4">
        <Skeleton width="80px" height="2.5rem" />
        <Skeleton width="100px" height="2.5rem" />
      </div>
    </div>
  );
}
