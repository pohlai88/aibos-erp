import type { ChangeEvent } from "react";

import { cn, variants, createPolymorphic } from "./utils";

export interface InputProperties {
  variant?: "default" | "error";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}

const inputVariants = variants({
  base: "flex w-full rounded-md border bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  variants: {
    variant: {
      default: "border-gray-300 focus:ring-blue-500 focus:border-blue-500",
      error: "border-red-300 focus:ring-red-500 focus:border-red-500",
    },
    size: {
      sm: "h-8 px-2 text-xs",
      md: "h-10 px-3 text-sm",
      lg: "h-12 px-4 text-base",
    },
  },
  defaultVariants: { variant: "default", size: "md" },
});

export const Input = createPolymorphic<"input", InputProperties>(
  (
    {
      as,
      variant,
      size,
      disabled,
      placeholder,
      className,
      value,
      onChange,
      ...props
    },
    ref,
  ) => {
    const Component = as || "input";

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
  "Input",
);
