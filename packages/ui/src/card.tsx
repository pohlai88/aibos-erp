import type { ReactNode, HTMLAttributes } from 'react';

import { forwardRef } from 'react';

import { cn, variants } from './utils';

export interface CardProperties extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'sm' | 'md' | 'lg';
  children?: ReactNode;
}

const cardVariants = variants({
  base: 'bg-white border border-gray-200 rounded-lg',
  variants: {
    variant: {
      default: 'shadow-sm',
      elevated: 'shadow-md',
      outlined: 'border-2 border-gray-300',
    },
    padding: {
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    },
  },
  defaultVariants: { variant: 'default', padding: 'md' },
});

export const Card = forwardRef<HTMLDivElement, CardProperties>(
  ({ variant, padding, children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({
            ...(variant && { variant }),
            ...(padding && { padding }),
          }),
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';

// Card sub-components
export interface CardHeaderProperties extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProperties>(
  ({ children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('flex flex-col space-y-1.5 pb-2', className)} {...props}>
        {children}
      </div>
    );
  },
);

CardHeader.displayName = 'CardHeader';

export interface CardTitleProperties extends HTMLAttributes<HTMLHeadingElement> {
  children?: ReactNode;
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProperties>(
  ({ children, className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn('text-lg font-semibold leading-none tracking-tight', className)}
        {...props}
      >
        {children}
      </h3>
    );
  },
);

CardTitle.displayName = 'CardTitle';

export interface CardContentProperties extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export const CardContent = forwardRef<HTMLDivElement, CardContentProperties>(
  ({ children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('pt-0', className)} {...props}>
        {children}
      </div>
    );
  },
);

CardContent.displayName = 'CardContent';
