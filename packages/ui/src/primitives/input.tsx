import type { ChangeEvent, ElementType } from 'react';

import { cn, variants, createPolymorphic, type PolymorphicReference } from '../utils';

export interface InputProperties {
  variant?: 'default' | 'error';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  as?: ElementType;
}

const inputVariants = variants({
  base: 'flex w-full rounded-md border bg-semantic-background text-semantic-foreground px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-semantic-background disabled:opacity-50 disabled:pointer-events-none',
  variants: {
    variant: {
      default: 'border-semantic-input focus:ring-semantic-primary focus:border-semantic-primary',
      error: 'border-semantic-error focus:ring-semantic-error focus:border-semantic-error',
    },
    size: {
      sm: 'h-8 px-2 text-xs',
      md: 'h-10 px-3 text-sm',
      lg: 'h-12 px-4 text-base',
    },
  },
  defaultVariants: { variant: 'default', size: 'md' },
  strict: true, // Enable dev-time warnings for unknown variants
});

export const Input = createPolymorphic<'input', InputProperties>(
  ({ as, variant, size, disabled, placeholder, className, value, onChange, ...props }, ref: PolymorphicReference<'input'>) => {
    const Component = as || 'input';

    return (
      <Component
        ref={ref}
        type="text"
        className={cn(
          inputVariants({
            ...(variant && { variant }),
            ...(size && { size }),
          }),
          className,
        )}
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        {...props}
      />
    );
  },
  'Input',
);