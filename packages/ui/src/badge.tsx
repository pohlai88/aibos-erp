import type { ReactNode, HTMLAttributes } from 'react';

import { forwardRef } from 'react';

import { cn, variants } from './utils';

export interface BadgeProperties extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'primary';
  size?: 'sm' | 'md';
  children?: ReactNode;
}

const badgeVariants = variants({
  base: 'inline-flex items-center rounded-full font-medium transition-colors',
  variants: {
    variant: {
      default: 'bg-blue-100 text-blue-800',
      primary: 'bg-blue-100 text-blue-800',
      secondary: 'bg-gray-100 text-gray-800',
      destructive: 'bg-red-100 text-red-800',
      outline: 'border border-gray-200 text-gray-800',
    },
    size: {
      sm: 'px-2 py-1 text-xs',
      md: 'px-2.5 py-0.5 text-sm',
    },
  },
  defaultVariants: { variant: 'default', size: 'md' },
});

export const Badge = forwardRef<HTMLSpanElement, BadgeProperties>(
  ({ variant, size, children, className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          badgeVariants({
            ...(variant && { variant }),
            ...(size && { size }),
          }),
          className,
        )}
        {...props}
      >
        {children}
      </span>
    );
  },
);

Badge.displayName = 'Badge';
