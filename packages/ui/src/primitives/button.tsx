import type { ReactNode, ButtonHTMLAttributes, ElementType } from 'react';

import { cn, variants, createPolymorphic, type PolymorphicReference } from '../utils';

export interface ButtonProperties extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  children?: ReactNode;
  as?: ElementType;
}

const buttonVariants = variants({
  base: 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-semantic-background disabled:opacity-50 disabled:pointer-events-none',
  variants: {
    variant: {
      primary:
        'bg-semantic-primary text-semantic-primary-foreground hover:bg-semantic-primary/90 focus:ring-semantic-primary',
      secondary:
        'bg-semantic-secondary text-semantic-secondary-foreground hover:bg-semantic-secondary/80 focus:ring-semantic-secondary',
      ghost:
        'bg-transparent hover:bg-semantic-muted focus:ring-semantic-muted',
      destructive:
        'bg-semantic-error text-semantic-error-foreground hover:bg-semantic-error/90 focus:ring-semantic-error',
    },
    size: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
    },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
  strict: true, // Enable dev-time warnings for unknown variants
});

export const Button = createPolymorphic<'button'>(
  ({ as: Component = 'button', variant, size, children, className, ...props }, ref: PolymorphicReference<'button'>) => {
    return (
      <Component
        ref={ref}
        className={cn(
          buttonVariants({
            variant: variant as 'primary' | 'secondary' | 'ghost' | 'destructive' | undefined,
            size: size as 'sm' | 'md' | 'lg' | undefined,
          }),
          className as string,
        )}
        {...(props as any)}
      >
        {children}
      </Component>
    );
  },
  'Button'
);