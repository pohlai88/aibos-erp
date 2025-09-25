import type { ReactNode, HTMLAttributes, ElementType } from 'react';

import { cn, variants, createPolymorphic, type PolymorphicReference } from '../utils';

export interface CardProperties extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'sm' | 'md' | 'lg';
  children?: ReactNode;
  as?: ElementType;
}

const cardVariants = variants({
  base: 'bg-semantic-background border border-semantic-border rounded-lg',
  variants: {
    variant: {
      default: 'shadow-sm',
      elevated: 'shadow-md',
      outlined: 'border-2 border-semantic-border',
    },
    padding: {
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    },
  },
  defaultVariants: { variant: 'default', padding: 'md' },
  strict: true, // Enable dev-time warnings for unknown variants
});

export const Card = createPolymorphic<'div'>(
  ({ as: Component = 'div', variant, padding, children, className, ...props }, ref: PolymorphicReference<'div'>) => {
    return (
      <Component
        ref={ref}
        className={cn(
          cardVariants({
            variant: variant as 'default' | 'elevated' | 'outlined' | undefined,
            padding: padding as 'sm' | 'md' | 'lg' | undefined,
          }),
          className as string,
        )}
        {...(props as any)}
      >
        {children}
      </Component>
    );
  },
  'Card'
);

// Card sub-components
export interface CardHeaderProperties extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  as?: ElementType;
}

export const CardHeader = createPolymorphic<'div'>(
  ({ as: Component = 'div', children, className, ...props }, ref: PolymorphicReference<'div'>) => {
    return (
      <Component
        ref={ref}
        className={cn('flex flex-col space-y-1.5 pb-2', className as string)}
        {...(props as any)}
      >
        {children}
      </Component>
    );
  },
  'CardHeader'
);

export interface CardTitleProperties extends HTMLAttributes<HTMLHeadingElement> {
  children?: ReactNode;
  as?: ElementType;
}

export const CardTitle = createPolymorphic<'h3'>(
  ({ as: Component = 'h3', children, className, ...props }, ref: PolymorphicReference<'h3'>) => {
    return (
      <Component
        ref={ref}
        className={cn('text-lg font-semibold leading-none tracking-tight', className as string)}
        {...(props as any)}
      >
        {children}
      </Component>
    );
  },
  'CardTitle'
);

export interface CardContentProperties extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  as?: ElementType;
}

export const CardContent = createPolymorphic<'div'>(
  ({ as: Component = 'div', children, className, ...props }, ref: PolymorphicReference<'div'>) => {
    return (
      <Component
        ref={ref}
        className={cn('pt-0', className as string)}
        {...(props as any)}
      >
        {children}
      </Component>
    );
  },
  'CardContent'
);