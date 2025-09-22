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
 * Button Component - Demonstrates Beautiful + WCAG 2.2 AAA Dual Mode
 * No compromise between beauty and accessibility!
 */
export interface ButtonProperties {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

// Dual-mode button variants - Beautiful vs WCAG AAA
const buttonStyles = createAccessibilityVariants({
  beautiful: {
    base: "inline-flex items-center justify-center rounded-lg font-medium focus:outline-none focus-visible:ring-2 ring-offset-2 transition-colors duration-150",
    variants: {
      intent: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",
        ghost: "bg-transparent hover:bg-muted/60",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-base",
        lg: "h-12 px-5 text-base",
      },
    },
    defaultVariants: { intent: "primary", size: "md" },
  },
  wcagAAA: {
    base: "inline-flex items-center justify-center rounded-lg font-medium focus:outline-none focus-visible:ring-3 ring-offset-2 transition-colors duration-0",
    variants: {
      intent: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md border-2 border-primary/20",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-md border-2 border-secondary/20",
        ghost:
          "bg-transparent hover:bg-muted/60 border-2 border-transparent hover:border-muted/20",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md border-2 border-destructive/20",
      },
      size: {
        sm: "h-9 px-4 text-sm min-w-[44px]", // WCAG AAA minimum touch target
        md: "h-11 px-5 text-base min-w-[44px]",
        lg: "h-13 px-6 text-base min-w-[44px]",
      },
    },
    defaultVariants: { intent: "primary", size: "md" },
  },
});

export const Button = createPolymorphic<"button", ButtonProperties>(
  (
    {
      as,
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled = false,
      children,
      onClick,
      ...props
    },
    ref,
  ) => {
    const localReference = React.useRef<HTMLButtonElement>(null);
    const isDisabled = disabled || loading;

    // Compose refs (Utility #2)
    const composedReference = composeReferences(localReference, ref);

    // Dual-mode data attributes (Utility #3 + Accessibility)
    const dataProperties = createDualModeProperties(
      {
        "data-loading": dataAttribute(loading),
        "data-disabled": dataAttribute(isDisabled),
        "data-mode": "beautiful",
      },
      {
        "data-loading": dataAttribute(loading),
        "data-disabled": dataAttribute(isDisabled),
        "data-mode": "wcag-aaa",
        "data-wcag-compliant": "true",
      },
    );

    // Dual-mode ARIA attributes (Utility #3 + Accessibility)
    const ariaProperties = createDualModeProperties(
      {
        "aria-disabled": ariaAttribute(isDisabled),
        "aria-busy": ariaAttribute(loading),
      },
      {
        "aria-disabled": ariaAttribute(isDisabled),
        "aria-busy": ariaAttribute(loading),
        "aria-describedby": loading ? "loading-description" : undefined,
        role: "button",
      },
    );

    // Dual-mode loading spinner
    const loadingSpinner = createDualModeStyles(
      "mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent",
      "mr-2 h-5 w-5 animate-spin rounded-full border-3 border-current border-t-transparent", // Thicker border for WCAG AAA
    );

    const Tag = (as ?? "button") as "button";

    return (
      <Tag
        ref={composedReference}
        className={cn(buttonStyles({ intent: variant, size }), className)}
        disabled={isDisabled}
        onClick={onClick}
        {...dataProperties}
        {...ariaProperties}
        {...props}
      >
        {loading && <div className={loadingSpinner} />}
        {children}
        {loading && (
          <span className="sr-only" id="loading-description">
            Loading, please wait
          </span>
        )}
      </Tag>
    );
  },
  "Button",
);

// Export button variants for external use
export const buttonVariants = buttonStyles;

/**
 * Usage Examples:
 *
 * // Basic usage - automatically switches between beautiful and WCAG AAA
 * <Button>Click me</Button>
 *
 * // Polymorphic (Utility #1)
 * <Button as="a" href="/dashboard">Dashboard</Button>
 *
 * // Loading state with accessibility
 * <Button loading>Processing...</Button>
 *
 * // Different variants - all respect accessibility mode
 * <Button variant="destructive" size="lg">Delete</Button>
 *
 * // Switch accessibility mode programmatically:
 * // setAccessibilityMode({ mode: "wcag-aaa" }) // Full WCAG 2.2 AAA
 * // setAccessibilityMode({ mode: "beautiful" }) // Beautiful design
 * // setAccessibilityMode({ mode: "auto", userPreference: "wcag-aaa" }) // User choice
 */
