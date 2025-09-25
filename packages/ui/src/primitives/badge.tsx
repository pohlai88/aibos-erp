import type { ReactNode, HTMLAttributes, ElementType } from 'react';

import { cn, variants, createPolymorphic, type PolymorphicReference } from '../utils';

export interface BadgeProperties extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'primary';
  size?: 'sm' | 'md';
  children?: ReactNode;
  as?: ElementType;
}

const badgeVariants = variants({
  base: 'inline-flex items-center rounded-full font-medium transition-colors',
  variants: {
    variant: {
      default: 'bg-semantic-primary text-semantic-primary-foreground',
      primary: 'bg-semantic-primary text-semantic-primary-foreground',
      secondary: 'bg-semantic-secondary text-semantic-secondary-foreground',
      destructive: 'bg-semantic-error text-semantic-error-foreground',
      outline: 'border border-semantic-secondary text-semantic-secondary-foreground',
    },
    size: {
      sm: 'px-2 py-1 text-xs',
      md: 'px-2.5 py-0.5 text-sm',
    },
  },
  defaultVariants: { variant: 'default', size: 'md' },
  strict: true, // Enable dev-time warnings for unknown variants
});

export const Badge = createPolymorphic<'span'>(
  ({ as: Component = 'span', variant, size, children, className, ...props }, ref: PolymorphicReference<'span'>) => {
    return (
      <Component
        ref={ref}
        className={cn(
          badgeVariants({
            variant: variant as 'default' | 'primary' | 'secondary' | 'destructive' | 'outline' | undefined,
            size: size as 'sm' | 'md' | undefined,
          }),
          className as string,
        )}
        {...(props as any)}
      >
        {children}
      </Component>
    );
  },
  'Badge'
);