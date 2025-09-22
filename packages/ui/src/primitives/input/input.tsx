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
 * INPUT COMPONENT
 * Essential form input with dual-mode accessibility
 */
export interface InputProperties {
  type?: "text" | "email" | "password" | "number" | "tel" | "url" | "search";
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  id?: string;
  name?: string;
  autoComplete?: string;
}

// Dual-mode input variants - Beautiful vs WCAG AAA
const inputStyles = createAccessibilityVariants({
  beautiful: {
    base: "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    variants: {
      size: {
        sm: "h-8 px-2 text-xs",
        md: "h-10 px-3 text-sm",
        lg: "h-12 px-4 text-base",
      },
      error: {
        true: "border-destructive focus-visible:ring-destructive",
        false: "",
      },
    },
    defaultVariants: { size: "md", error: "false" },
  },
  wcagAAA: {
    base: "flex w-full rounded-md border-2 border-input bg-background px-4 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-base file:font-semibold placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]",
    variants: {
      size: {
        sm: "h-12 px-3 text-sm min-h-[44px]",
        md: "h-14 px-4 text-base min-h-[44px]",
        lg: "h-16 px-5 text-lg min-h-[44px]",
      },
      error: {
        true: "border-2 border-destructive focus-visible:ring-destructive",
        false: "",
      },
    },
    defaultVariants: { size: "md", error: "false" },
  },
});

export const Input = createPolymorphic<"input", InputProperties>(
  (
    {
      as,
      type = "text",
      placeholder,
      value,
      defaultValue,
      onChange,
      onBlur,
      onFocus,
      disabled = false,
      required = false,
      error = false,
      size = "md",
      className,
      id,
      name,
      autoComplete,
      ...props
    },
    ref,
  ) => {
    const localReference = React.useRef<HTMLInputElement>(null);
    const composedReference = composeReferences(localReference, ref);

    // Dual-mode data attributes
    const dataProperties = createDualModeProperties(
      {
        "data-input": "true",
        "data-type": type,
        "data-size": size,
        "data-error": dataAttribute(error),
        "data-disabled": dataAttribute(disabled),
        "data-mode": "beautiful",
      },
      {
        "data-input": "true",
        "data-type": type,
        "data-size": size,
        "data-error": dataAttribute(error),
        "data-disabled": dataAttribute(disabled),
        "data-mode": "wcag-aaa",
        "data-wcag-compliant": "true",
        role: "textbox",
      },
    );

    // Dual-mode ARIA attributes
    const ariaProperties = createDualModeProperties(
      {
        "aria-invalid": ariaAttribute(error),
        "aria-required": ariaAttribute(required),
        "aria-disabled": ariaAttribute(disabled),
      },
      {
        "aria-invalid": ariaAttribute(error),
        "aria-required": ariaAttribute(required),
        "aria-disabled": ariaAttribute(disabled),
        "aria-describedby": error ? `${id}-error` : undefined,
      },
    );

    const Tag = (as ?? "input") as "input";

    return (
      <>
        <Tag
          ref={composedReference}
          type={type}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          required={required}
          id={id}
          name={name}
          autoComplete={autoComplete}
          className={cn(
            inputStyles({ size, error: error ? "true" : "false" }),
            className,
          )}
          {...dataProperties}
          {...ariaProperties}
          {...props}
        />
        {error && id && (
          <div id={`${id}-error`} className="sr-only">
            This field has an error
          </div>
        )}
      </>
    );
  },
  "Input",
);

// Input Group Component
export interface InputGroupProperties {
  children?: React.ReactNode;
  className?: string;
}

const inputGroupStyles = createAccessibilityVariants({
  beautiful: {
    base: "flex items-center",
  },
  wcagAAA: {
    base: "flex items-center",
  },
});

export const InputGroup = createPolymorphic<"div", InputGroupProperties>(
  ({ as, children, className, ...props }, ref) => {
    const localReference = React.useRef<HTMLDivElement>(null);
    const composedReference = composeReferences(localReference, ref);

    const Tag = (as ?? "div") as "div";

    return (
      <Tag
        ref={composedReference}
        className={cn(inputGroupStyles(), className)}
        {...props}
      >
        {children}
      </Tag>
    );
  },
  "InputGroup",
);

// Input Addon Component
export interface InputAddonProperties {
  children?: React.ReactNode;
  position?: "left" | "right";
  className?: string;
}

const inputAddonStyles = createAccessibilityVariants({
  beautiful: {
    base: "flex items-center justify-center px-3 py-2 text-sm text-muted-foreground border border-input bg-muted",
    variants: {
      position: {
        left: "rounded-l-md border-r-0",
        right: "rounded-r-md border-l-0",
      },
    },
    defaultVariants: { position: "left" },
  },
  wcagAAA: {
    base: "flex items-center justify-center px-4 py-3 text-base font-medium text-muted-foreground border-2 border-input bg-muted min-h-[44px]",
    variants: {
      position: {
        left: "rounded-l-md border-r-0",
        right: "rounded-r-md border-l-0",
      },
    },
    defaultVariants: { position: "left" },
  },
});

export const InputAddon = createPolymorphic<"div", InputAddonProperties>(
  ({ as, children, position = "left", className, ...props }, ref) => {
    const localReference = React.useRef<HTMLDivElement>(null);
    const composedReference = composeReferences(localReference, ref);

    const Tag = (as ?? "div") as "div";

    return (
      <Tag
        ref={composedReference}
        className={cn(inputAddonStyles({ position }), className)}
        {...props}
      >
        {children}
      </Tag>
    );
  },
  "InputAddon",
);

// Legacy export for backward compatibility
export const inputVariants = inputStyles;
