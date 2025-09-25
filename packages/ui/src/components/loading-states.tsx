import type { ReactNode, HTMLAttributes, ElementType } from 'react';
import React from 'react';
import { cn, variants, createPolymorphic, type PolymorphicReference } from '../utils';

export interface LoadingStateProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  className?: string;
  as?: ElementType;
}

const loadingSpinnerVariants = variants({
  base: 'flex flex-col items-center justify-center',
  variants: {
    size: {
      small: 'h-4 w-4',
      medium: 'h-8 w-8',
      large: 'h-12 w-12',
    },
  },
  defaultVariants: { size: 'medium' },
  strict: true, // Enable dev-time warnings for unknown variants
});

/**
 * Standardized loading spinner component
 */
export const LoadingSpinner = createPolymorphic<'div'>(
  ({ as: Component = 'div', size = 'medium', text, className, ...props }, ref: PolymorphicReference<'div'>) => {
    return (
      <Component
        ref={ref}
        className={cn(loadingSpinnerVariants({ size: size as 'small' | 'medium' | 'large' }), className as string)}
        {...(props as any)}
      >
        <div className={cn(
          'animate-spin rounded-full border-2 border-semantic-secondary border-t-semantic-primary',
          loadingSpinnerVariants({ size: size as 'small' | 'medium' | 'large' })
        )} />
        {text && (
          <p className="mt-2 text-sm text-semantic-secondary">{text as string}</p>
        )}
      </Component>
    );
  },
  'LoadingSpinner'
);

export interface SkeletonLoaderProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  lines?: number;
  as?: ElementType;
}

/**
 * Skeleton loader for content placeholders
 */
export const SkeletonLoader = createPolymorphic<'div'>(
  ({ as: Component = 'div', className, lines = 3, ...props }, ref: PolymorphicReference<'div'>) => {
    const linesCount = lines as number;
    return (
      <Component
        ref={ref}
        className={cn('animate-pulse', className as string)}
        {...(props as any)}
      >
        {Array.from({ length: linesCount }).map((_, index: number) => (
          <div
            key={index}
            className={cn(
              'mb-2 h-4 rounded bg-semantic-secondary',
              index === linesCount - 1 ? 'w-3/4' : 'w-full'
            )}
          />
        ))}
      </Component>
    );
  },
  'SkeletonLoader'
);

export interface AsyncLoadingProps extends HTMLAttributes<HTMLDivElement> {
  isLoading: boolean;
  error?: Error | null;
  children: ReactNode;
  loadingComponent?: ReactNode;
  errorComponent?: (error: Error) => ReactNode;
  className?: string;
  as?: ElementType;
}

/**
 * Loading state wrapper for async operations
 */
export const AsyncLoading = createPolymorphic<'div'>(
  ({ 
    as: Component = 'div', 
    isLoading, 
    error, 
    children, 
    loadingComponent, 
    errorComponent, 
    className, 
    ...props 
  }, ref: PolymorphicReference<'div'>) => {
    if (error) {
      return (
        <Component
          ref={ref}
          className={cn(className as string)}
          {...(props as any)}
        >
          {errorComponent ? (
            (errorComponent as (error: Error) => ReactNode)(error as Error)
          ) : (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="mb-2 text-semantic-error">
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
                <p className="text-sm text-semantic-secondary">{(error as Error).message}</p>
              </div>
            </div>
          )}
        </Component>
      );
    }

    if (isLoading) {
      return (
        <Component
          ref={ref}
          className={cn(className as string)}
          {...(props as any)}
        >
          {loadingComponent || <LoadingSpinner text="Loading..." />}
        </Component>
      );
    }

    return (
      <Component
        ref={ref}
        className={cn(className as string)}
        {...(props as any)}
      >
        {children}
      </Component>
    );
  },
  'AsyncLoading'
);

export interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  loadingText?: string;
  children: ReactNode;
  as?: ElementType;
}

const loadingButtonVariants = variants({
  base: 'relative inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  variants: {
    variant: {
      primary: 'bg-semantic-primary text-semantic-primary-foreground hover:bg-semantic-primary/90 focus:ring-semantic-primary',
      secondary: 'bg-semantic-secondary text-semantic-secondary-foreground hover:bg-semantic-secondary/80 focus:ring-semantic-secondary',
      ghost: 'bg-transparent hover:bg-semantic-muted focus:ring-semantic-muted',
    },
    size: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
    },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
  strict: true,
});

/**
 * Loading button component
 */
export const LoadingButton = createPolymorphic<'button'>(
  ({ 
    as: Component = 'button', 
    isLoading, 
    loadingText = 'Loading...', 
    children, 
    disabled, 
    className, 
    variant = 'primary',
    size = 'md',
    ...props 
  }, ref: PolymorphicReference<'button'>) => {
    return (
      <Component
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          loadingButtonVariants({ 
            variant: variant as 'primary' | 'secondary' | 'ghost' | undefined,
            size: size as 'sm' | 'md' | 'lg' | undefined
          }),
          className as string
        )}
        {...(props as any)}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-semantic-secondary border-t-semantic-primary-foreground" />
          </div>
        )}
        <span className={isLoading ? 'opacity-0' : 'opacity-100'}>
          {(isLoading ? loadingText : children) as ReactNode}
        </span>
      </Component>
    );
  },
  'LoadingButton'
);

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  animate?: boolean;
  as?: ElementType;
}

/**
 * Enhanced Skeleton Loading Components for Better UX
 */
export const Skeleton = createPolymorphic<'div'>(
  ({ 
    as: Component = 'div', 
    className, 
    width = '100%', 
    height = '1rem', 
    rounded = false, 
    animate = true, 
    ...props 
  }, ref: PolymorphicReference<'div'>) => {
    return (
      <Component
        ref={ref}
        className={cn(
          'bg-semantic-secondary',
          (rounded as boolean) && 'rounded-full',
          !(rounded as boolean) && 'rounded',
          (animate as boolean) && 'animate-pulse',
          className as string,
        )}
        style={{ width, height }}
        {...(props as any)}
      />
    );
  },
  'Skeleton'
);

export interface SkeletonCardProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  showAvatar?: boolean;
  lines?: number;
  as?: ElementType;
}

export const SkeletonCard = createPolymorphic<'div'>(
  ({ as: Component = 'div', className, showAvatar = false, lines = 3, ...props }, ref: PolymorphicReference<'div'>) => {
    const linesCount = lines as number;
    return (
      <Component
        ref={ref}
        className={cn('rounded-lg border border-semantic-border p-4', className as string)}
        {...(props as any)}
      >
        <div className="flex items-start space-x-3">
          {(showAvatar as boolean) && <Skeleton width={40} height={40} rounded />}
          <div className="flex-1 space-y-2">
            <Skeleton width="60%" height="1rem" />
            {Array.from({ length: linesCount }).map((_, index) => (
              <Skeleton
                key={index}
                width={index === linesCount - 1 ? '40%' : '100%'}
                height="0.875rem"
              />
            ))}
          </div>
        </div>
      </Component>
    );
  },
  'SkeletonCard'
);

export interface SkeletonTableProps extends HTMLAttributes<HTMLDivElement> {
  rows?: number;
  columns?: number;
  className?: string;
  as?: ElementType;
}

export const SkeletonTable = createPolymorphic<'div'>(
  ({ as: Component = 'div', rows = 5, columns = 4, className, ...props }, ref: PolymorphicReference<'div'>) => {
    const rowsCount = rows as number;
    const columnsCount = columns as number;
    return (
      <Component
        ref={ref}
        className={cn('overflow-hidden rounded-lg border border-semantic-border', className as string)}
        {...(props as any)}
      >
        {/* Header */}
        <div className="border-b border-semantic-border bg-semantic-muted p-3">
          <div className="flex space-x-4">
            {Array.from({ length: columnsCount }).map((_, index) => (
              <Skeleton key={index} width="25%" height="1rem" />
            ))}
          </div>
        </div>
        {/* Rows */}
        {Array.from({ length: rowsCount }).map((_, rowIndex) => (
          <div key={rowIndex} className="border-b border-semantic-border p-3 last:border-b-0">
            <div className="flex space-x-4">
              {Array.from({ length: columnsCount }).map((_, colIndex) => (
                <Skeleton
                  key={colIndex}
                  width={colIndex === 0 ? '30%' : '20%'}
                  height="0.875rem"
                />
              ))}
            </div>
          </div>
        ))}
      </Component>
    );
  },
  'SkeletonTable'
);

export interface SkeletonDashboardProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  as?: ElementType;
}

export const SkeletonDashboard = createPolymorphic<'div'>(
  ({ as: Component = 'div', className, ...props }, ref: PolymorphicReference<'div'>) => {
    return (
      <Component
        ref={ref}
        className={cn('space-y-6', className as string)}
        {...(props as any)}
      >
        {/* Header */}
        <div className="space-y-2">
          <Skeleton width="200px" height="2rem" />
          <Skeleton width="400px" height="1rem" />
        </div>
        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-lg border border-semantic-border p-4">
              <Skeleton width="60%" height="0.875rem" className="mb-2" />
              <Skeleton width="80%" height="1.5rem" className="mb-1" />
              <Skeleton width="40%" height="0.75rem" />
            </div>
          ))}
        </div>
        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="rounded-lg border border-semantic-border p-4">
              <Skeleton width="120px" height="1.25rem" className="mb-4" />
              <Skeleton width="100%" height="200px" />
            </div>
          ))}
        </div>
        {/* Table */}
        <SkeletonTable rows={6} columns={5} />
      </Component>
    );
  },
  'SkeletonDashboard'
);

export interface SkeletonFormProps extends HTMLAttributes<HTMLDivElement> {
  fields?: number;
  className?: string;
  as?: ElementType;
}

export const SkeletonForm = createPolymorphic<'div'>(
  ({ as: Component = 'div', fields = 4, className, ...props }, ref: PolymorphicReference<'div'>) => {
    const fieldsCount = fields as number;
    return (
      <Component
        ref={ref}
        className={cn('space-y-4', className as string)}
        {...(props as any)}
      >
        {Array.from({ length: fieldsCount }).map((_, index) => (
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
      </Component>
    );
  },
  'SkeletonForm'
);