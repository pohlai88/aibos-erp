import type { ReactNode } from "react";

import { cn, variants, createPolymorphic } from "./utils";

export interface BadgeProperties {
  variant?: "default" | "secondary" | "destructive" | "outline";
  size?: "sm" | "md";
  children?: ReactNode;
  className?: string;
}

const badgeVariants = variants({
  base: "inline-flex items-center rounded-full font-medium transition-colors",
  variants: {
    variant: {
      default: "bg-blue-100 text-blue-800",
      secondary: "bg-gray-100 text-gray-800",
      destructive: "bg-red-100 text-red-800",
      outline: "border border-gray-200 text-gray-800",
    },
    size: {
      sm: "px-2 py-1 text-xs",
      md: "px-2.5 py-0.5 text-sm",
    },
  },
  defaultVariants: { variant: "default", size: "md" },
});

export const Badge = createPolymorphic<"span", BadgeProperties>(
  ({ as, variant, size, children, className, ...props }, ref) => {
    const Component = as || "span";

    return (
      <Component
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
      </Component>
    );
  },
  "Badge",
);
