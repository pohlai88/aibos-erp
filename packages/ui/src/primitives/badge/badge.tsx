import {
  createPolymorphic,
  composeRefs as composeReferences,
  dataAttr as dataAttribute,
  ariaAttr as ariaAttribute,
  cn,
  createAccessibilityVariants,
  createDualModeStyles,
  createDualModeProps as createDualModeProperties,
} from "../../utils";
import * as React from "react";

/**
 * REFACTORED BADGE COMPONENT
 * Now uses our dual-mode system for Beautiful + WCAG AAA compliance
 */
export interface BadgeProperties {
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "warning"
    | "info"
    | "pending"
    | "processing"
    | "completed"
    | "cancelled";
  size?: "sm" | "md" | "lg";
  state?: "default" | "loading" | "disabled";
  children?: React.ReactNode;
  className?: string;
}

// Dual-mode badge variants - Beautiful vs WCAG AAA
const badgeStyles = createAccessibilityVariants({
  beautiful: {
    base: "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        success: "border-transparent bg-success text-white hover:bg-success/80",
        warning: "border-transparent bg-warning text-white hover:bg-warning/80",
        info: "border-transparent bg-info text-white hover:bg-info/80",
        outline: "text-foreground border-border",
        // ERP-specific status variants
        pending: "border-transparent bg-pending text-white hover:bg-pending/80",
        processing:
          "border-transparent bg-processing text-white hover:bg-processing/80",
        completed:
          "border-transparent bg-completed text-white hover:bg-completed/80",
        cancelled:
          "border-transparent bg-cancelled text-white hover:bg-cancelled/80",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
  wcagAAA: {
    base: "inline-flex items-center rounded-full border-2 px-3 py-1 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[44px]",
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80 shadow-sm",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 shadow-sm",
        success:
          "border-transparent bg-success text-white hover:bg-success/80 shadow-sm",
        warning:
          "border-transparent bg-warning text-white hover:bg-warning/80 shadow-sm",
        info: "border-transparent bg-info text-white hover:bg-info/80 shadow-sm",
        outline: "text-foreground border-2 border-border",
        // ERP-specific status variants
        pending:
          "border-transparent bg-pending text-white hover:bg-pending/80 shadow-sm",
        processing:
          "border-transparent bg-processing text-white hover:bg-processing/80 shadow-sm",
        completed:
          "border-transparent bg-completed text-white hover:bg-completed/80 shadow-sm",
        cancelled:
          "border-transparent bg-cancelled text-white hover:bg-cancelled/80 shadow-sm",
      },
      size: {
        sm: "px-3 py-1 text-sm min-h-[44px]",
        md: "px-3 py-1 text-sm min-h-[44px]",
        lg: "px-4 py-1.5 text-base min-h-[44px]",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
});

export const Badge = createPolymorphic<"div", BadgeProperties>(
  (
    {
      as,
      variant = "default",
      size = "md",
      state = "default",
      children,
      className,
      ...props
    },
    ref,
  ) => {
    const localReference = React.useRef<HTMLDivElement>(null);
    const composedReference = composeReferences(localReference, ref);

    // Dual-mode data attributes
    const dataProperties = createDualModeProperties(
      {
        "data-variant": variant,
        "data-size": size,
        "data-state": state,
        "data-mode": "beautiful",
      },
      {
        "data-variant": variant,
        "data-size": size,
        "data-state": state,
        "data-mode": "wcag-aaa",
        "data-wcag-compliant": "true",
        role: "status",
      },
    );

    // Dual-mode ARIA attributes
    const ariaProperties = createDualModeProperties(
      {
        "aria-label": typeof children === "string" ? children : undefined,
      },
      {
        "aria-label": typeof children === "string" ? children : undefined,
        "aria-live": "polite",
        "aria-atomic": "true",
      },
    );

    const Tag = (as ?? "div") as "div";

    return (
      <Tag
        ref={composedReference}
        className={cn(badgeStyles({ variant, size }), className)}
        {...dataProperties}
        {...ariaProperties}
        {...props}
      >
        {children}
      </Tag>
    );
  },
  "Badge",
);

// Legacy export for backward compatibility
export const badgeVariants = badgeStyles;
