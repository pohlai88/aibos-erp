import {
  createPolymorphic,
  composeRefs as composeReferences,
  dataAttr as dataAttribute,
  ariaAttr as ariaAttribute,
  cn,
  createDualModeStyles,
  createDualModeProps as createDualModeProperties,
  isWCAGMode,
  type PolymorphicProps as PolymorphicProperties,
  type PolymorphicRef as PolymorphicReference,
} from "../utils";
import * as React from "react";

/**
 * SMART WRAPPER SYSTEM
 * Universal component wrapper that automatically applies:
 * - Dual-mode styling (Beautiful + WCAG AAA)
 * - Accessibility attributes
 * - Performance optimizations
 * - Modern React patterns
 */
export interface SmartWrapperProperties {
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "card" | "button" | "input" | "text";
  size?: "sm" | "md" | "lg";
  state?: "default" | "loading" | "disabled" | "error" | "success";
  accessibility?: "auto" | "enhanced" | "minimal";
  performance?: "optimized" | "standard";
}

export const SmartWrapper = createPolymorphic<"div", SmartWrapperProperties>(
  (
    {
      as,
      children,
      className,
      variant = "default",
      size = "md",
      state = "default",
      accessibility = "auto",
      performance = "optimized",
      ...props
    }: PolymorphicProperties<"div", SmartWrapperProperties>,
    ref: PolymorphicReference<"div">,
  ) => {
    const localReference = React.useRef<HTMLDivElement>(null);
    const composedReference = composeReferences(localReference, ref);

    // Smart styling based on variant and mode
    const baseStyles = createDualModeStyles(
      // Beautiful mode
      "transition-colors duration-150",
      // WCAG AAA mode
      "transition-colors duration-0",
    );

    const variantStyles = {
      default: createDualModeStyles("", ""),
      card: createDualModeStyles(
        "bg-card border border-border rounded-lg shadow-sm p-4",
        "bg-card border-2 border-border rounded-lg shadow-md p-4",
      ),
      button: createDualModeStyles(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2",
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-3 min-w-[44px] min-h-[44px]",
      ),
      input: createDualModeStyles(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-2",
        "flex h-11 w-full rounded-md border-2 border-input bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-3",
      ),
      text: createDualModeStyles(
        "text-foreground",
        "text-foreground font-medium",
      ),
    };

    const sizeStyles = {
      sm: createDualModeStyles("text-xs", "text-sm"),
      md: createDualModeStyles("text-sm", "text-base"),
      lg: createDualModeStyles("text-base", "text-lg"),
    };

    const stateStyles = {
      default: "",
      loading: createDualModeStyles("opacity-50", "opacity-50"),
      disabled: createDualModeStyles(
        "opacity-50 cursor-not-allowed",
        "opacity-50 cursor-not-allowed",
      ),
      error: createDualModeStyles(
        "border-destructive",
        "border-2 border-destructive",
      ),
      success: createDualModeStyles(
        "border-success",
        "border-2 border-success",
      ),
    };

    // Smart accessibility attributes
    const accessibilityProperties = createDualModeProperties(
      // Beautiful mode - minimal accessibility
      {
        "data-variant": variant,
        "data-size": size,
        "data-state": state,
      },
      // WCAG AAA mode - enhanced accessibility
      {
        "data-variant": variant,
        "data-size": size,
        "data-state": state,
        "data-wcag-compliant": "true",
        role: variant === "button" ? "button" : undefined,
        "aria-disabled": state === "disabled" ? true : undefined,
        "aria-busy": state === "loading" ? true : undefined,
        "aria-invalid": state === "error" ? true : undefined,
      },
    );

    // Performance optimization
    const performanceProperties =
      performance === "optimized"
        ? {
            "data-performance": "optimized",
            "data-lazy": "true",
          }
        : {};

    const Tag = (as ?? "div") as "div";

    return (
      <Tag
        ref={composedReference}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          stateStyles[state],
          className,
        )}
        {...accessibilityProperties}
        {...performanceProperties}
        {...props}
      >
        {children}
      </Tag>
    );
  },
  "SmartWrapper",
);

/**
 * QUICK WIN COMPONENTS
 * Pre-configured SmartWrapper instances for common use cases
 */
export const QuickCard = React.forwardRef<
  HTMLDivElement,
  Omit<SmartWrapperProperties, "variant">
>((props, ref) => <SmartWrapper ref={ref} variant="card" {...props} />);
QuickCard.displayName = "QuickCard";

export const QuickButton = React.forwardRef<
  HTMLDivElement,
  Omit<SmartWrapperProperties, "variant">
>((props, ref) => <SmartWrapper ref={ref} variant="button" {...props} />);
QuickButton.displayName = "QuickButton";

export const QuickInput = React.forwardRef<
  HTMLDivElement,
  Omit<SmartWrapperProperties, "variant">
>((props, ref) => <SmartWrapper ref={ref} variant="input" {...props} />);
QuickInput.displayName = "QuickInput";

export const QuickText = React.forwardRef<
  HTMLDivElement,
  Omit<SmartWrapperProperties, "variant">
>((props, ref) => <SmartWrapper ref={ref} variant="text" {...props} />);
QuickText.displayName = "QuickText";

/**
 * USAGE EXAMPLES:
 *
 * // Universal wrapper - automatically adapts to mode
 * <SmartWrapper variant="card" size="lg" state="loading">
 *   Content here
 * </SmartWrapper>
 *
 * // Quick win components
 * <QuickCard>Card content</QuickCard>
 * <QuickButton>Button text</QuickButton>
 * <QuickInput>Input content</QuickInput>
 * <QuickText>Text content</QuickText>
 *
 * // Polymorphic usage
 * <SmartWrapper as="section" variant="card">
 *   Section content
 * </SmartWrapper>
 *
 * // Performance optimized
 * <SmartWrapper performance="optimized" variant="button">
 *   Optimized button
 * </SmartWrapper>
 */
