import type { ReactNode } from "react";

import { cn, variants, createPolymorphic } from "./utils";

export interface CardProperties {
  variant?: "default" | "elevated" | "outlined";
  padding?: "sm" | "md" | "lg";
  children?: ReactNode;
  className?: string;
}

const cardVariants = variants({
  base: "bg-white border border-gray-200 rounded-lg",
  variants: {
    variant: {
      default: "shadow-sm",
      elevated: "shadow-md",
      outlined: "border-2 border-gray-300",
    },
    padding: {
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
    },
  },
  defaultVariants: { variant: "default", padding: "md" },
});

export const Card = createPolymorphic<"div", CardProperties>(
  ({ as, variant, padding, children, className, ...props }, ref) => {
    const Component = as || "div";

    return (
      <Component
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
      </Component>
    );
  },
  "Card",
);

// Card sub-components
export interface CardHeaderProperties {
  children?: ReactNode;
  className?: string;
}

export const CardHeader = createPolymorphic<"div", CardHeaderProperties>(
  ({ as, children, className, ...props }, ref) => {
    const Component = as || "div";

    return (
      <Component
        ref={ref}
        className={cn("flex flex-col space-y-1.5 pb-2", className)}
        {...props}
      >
        {children}
      </Component>
    );
  },
  "CardHeader",
);

export interface CardTitleProperties {
  children?: ReactNode;
  className?: string;
}

export const CardTitle = createPolymorphic<"h3", CardTitleProperties>(
  ({ as, children, className, ...props }, ref) => {
    const Component = as || "h3";

    return (
      <Component
        ref={ref}
        className={cn(
          "text-lg font-semibold leading-none tracking-tight",
          className,
        )}
        {...props}
      >
        {children}
      </Component>
    );
  },
  "CardTitle",
);

export interface CardContentProperties {
  children?: ReactNode;
  className?: string;
}

export const CardContent = createPolymorphic<"div", CardContentProperties>(
  ({ as, children, className, ...props }, ref) => {
    const Component = as || "div";

    return (
      <Component ref={ref} className={cn("pt-0", className)} {...props}>
        {children}
      </Component>
    );
  },
  "CardContent",
);
