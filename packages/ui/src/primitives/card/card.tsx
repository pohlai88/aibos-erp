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
 * REFACTORED CARD COMPONENT
 * Now uses our dual-mode system for Beautiful + WCAG AAA compliance
 */
export interface CardProperties {
  variant?: "default" | "elevated" | "outlined" | "filled";
  size?: "sm" | "md" | "lg";
  children?: React.ReactNode;
  className?: string;
}

// Dual-mode card variants - Beautiful vs WCAG AAA
const cardStyles = createAccessibilityVariants({
  beautiful: {
    base: "bg-card text-card-foreground border border-border rounded-lg shadow-sm transition-all duration-200 hover:shadow-md",
    variants: {
      variant: {
        default: "",
        elevated: "shadow-md hover:shadow-lg",
        outlined: "border-2",
        filled: "bg-muted/50",
      },
      size: {
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
  wcagAAA: {
    base: "bg-card text-card-foreground border-2 border-border rounded-lg shadow-md transition-all duration-0 hover:shadow-lg",
    variants: {
      variant: {
        default: "",
        elevated: "shadow-lg hover:shadow-xl",
        outlined: "border-4",
        filled: "bg-muted/70",
      },
      size: {
        sm: "p-4",
        md: "p-5",
        lg: "p-7",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
});

export const Card = createPolymorphic<"div", CardProperties>(
  (
    { as, variant = "default", size = "md", children, className, ...props },
    ref,
  ) => {
    const localReference = React.useRef<HTMLDivElement>(null);
    const composedReference = composeReferences(localReference, ref);

    // Dual-mode data attributes
    const dataProperties = createDualModeProperties(
      {
        "data-card": "true",
        "data-variant": variant,
        "data-size": size,
        "data-mode": "beautiful",
      },
      {
        "data-card": "true",
        "data-variant": variant,
        "data-size": size,
        "data-mode": "wcag-aaa",
        "data-wcag-compliant": "true",
        role: "region",
      },
    );

    const Tag = (as ?? "div") as "div";

    return (
      <Tag
        ref={composedReference}
        className={cn(cardStyles({ variant, size }), className)}
        {...dataProperties}
        {...props}
      >
        {children}
      </Tag>
    );
  },
  "Card",
);

// Card Header Component
export interface CardHeaderProperties {
  children?: React.ReactNode;
  className?: string;
}

const cardHeaderStyles = createAccessibilityVariants({
  beautiful: {
    base: "flex flex-col space-y-1.5 p-6",
  },
  wcagAAA: {
    base: "flex flex-col space-y-2 p-7",
  },
});

export const CardHeader = createPolymorphic<"div", CardHeaderProperties>(
  ({ as, children, className, ...props }, ref) => {
    const localReference = React.useRef<HTMLDivElement>(null);
    const composedReference = composeReferences(localReference, ref);

    const Tag = (as ?? "div") as "div";

    return (
      <Tag
        ref={composedReference}
        className={cn(cardHeaderStyles(), className)}
        {...props}
      >
        {children}
      </Tag>
    );
  },
  "CardHeader",
);

// Card Title Component
export interface CardTitleProperties {
  children?: React.ReactNode;
  className?: string;
}

const cardTitleStyles = createAccessibilityVariants({
  beautiful: {
    base: "text-2xl font-semibold leading-none tracking-tight",
  },
  wcagAAA: {
    base: "text-2xl font-bold leading-none tracking-tight",
  },
});

export const CardTitle = createPolymorphic<"h3", CardTitleProperties>(
  ({ as, children, className, ...props }, ref) => {
    const localReference = React.useRef<HTMLHeadingElement>(null);
    const composedReference = composeReferences(localReference, ref);

    const Tag = (as ?? "h3") as "h3";

    return (
      <Tag
        ref={composedReference}
        className={cn(cardTitleStyles(), className)}
        {...props}
      >
        {children}
      </Tag>
    );
  },
  "CardTitle",
);

// Card Description Component
export interface CardDescriptionProperties {
  children?: React.ReactNode;
  className?: string;
}

const cardDescriptionStyles = createAccessibilityVariants({
  beautiful: {
    base: "text-sm text-muted-foreground",
  },
  wcagAAA: {
    base: "text-base text-muted-foreground font-medium",
  },
});

export const CardDescription = createPolymorphic<
  "p",
  CardDescriptionProperties
>(({ as, children, className, ...props }, ref) => {
  const localReference = React.useRef<HTMLParagraphElement>(null);
  const composedReference = composeReferences(localReference, ref);

  const Tag = (as ?? "p") as "p";

  return (
    <Tag
      ref={composedReference}
      className={cn(cardDescriptionStyles(), className)}
      {...props}
    >
      {children}
    </Tag>
  );
}, "CardDescription");

// Card Content Component
export interface CardContentProperties {
  children?: React.ReactNode;
  className?: string;
}

const cardContentStyles = createAccessibilityVariants({
  beautiful: {
    base: "p-6 pt-0",
  },
  wcagAAA: {
    base: "p-7 pt-0",
  },
});

export const CardContent = createPolymorphic<"div", CardContentProperties>(
  ({ as, children, className, ...props }, ref) => {
    const localReference = React.useRef<HTMLDivElement>(null);
    const composedReference = composeReferences(localReference, ref);

    const Tag = (as ?? "div") as "div";

    return (
      <Tag
        ref={composedReference}
        className={cn(cardContentStyles(), className)}
        {...props}
      >
        {children}
      </Tag>
    );
  },
  "CardContent",
);

// Card Footer Component
export interface CardFooterProperties {
  children?: React.ReactNode;
  className?: string;
}

const cardFooterStyles = createAccessibilityVariants({
  beautiful: {
    base: "flex items-center p-6 pt-0",
  },
  wcagAAA: {
    base: "flex items-center p-7 pt-0",
  },
});

export const CardFooter = createPolymorphic<"div", CardFooterProperties>(
  ({ as, children, className, ...props }, ref) => {
    const localReference = React.useRef<HTMLDivElement>(null);
    const composedReference = composeReferences(localReference, ref);

    const Tag = (as ?? "div") as "div";

    return (
      <Tag
        ref={composedReference}
        className={cn(cardFooterStyles(), className)}
        {...props}
      >
        {children}
      </Tag>
    );
  },
  "CardFooter",
);

// Legacy export for backward compatibility
export const cardVariants = cardStyles;
