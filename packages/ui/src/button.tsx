import type { ReactNode } from "react";

import { cn, variants, createPolymorphic } from "./utils";

export interface ButtonProperties {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
}

const buttonVariants = variants({
  base: "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  variants: {
    variant: {
      primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
      secondary:
        "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500",
      ghost: "bg-transparent hover:bg-gray-100 focus:ring-gray-500",
      destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    },
    size: {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
    },
  },
  defaultVariants: { variant: "primary", size: "md" },
});

export const Button = createPolymorphic<"button", ButtonProperties>(
  (
    { as, variant, size, disabled, children, className, onClick, ...props },
    ref,
  ) => {
    const Component = as || "button";

    return (
      <Component
        ref={ref}
        className={cn(
          buttonVariants({
            ...(variant && { variant }),
            ...(size && { size }),
          }),
          className,
        )}
        disabled={disabled}
        onClick={onClick}
        {...props}
      >
        {children}
      </Component>
    );
  },
  "Button",
);
