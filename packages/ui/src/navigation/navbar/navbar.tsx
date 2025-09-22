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
 * NAVBAR COMPONENT
 * Essential navigation bar with dual-mode accessibility
 */
export interface NavbarProperties {
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "sticky" | "fixed";
  size?: "sm" | "md" | "lg";
}

export interface NavbarBrandProperties {
  children?: React.ReactNode;
  href?: string;
  className?: string;
}

export interface NavbarNavProperties {
  children?: React.ReactNode;
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export interface NavbarItemProperties {
  children?: React.ReactNode;
  href?: string;
  active?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}

export interface NavbarToggleProperties {
  expanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  className?: string;
}

// Navbar Root Component
const navbarStyles = createAccessibilityVariants({
  beautiful: {
    base: "w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
    variants: {
      variant: {
        default: "relative",
        sticky: "sticky top-0 z-50",
        fixed: "fixed top-0 left-0 right-0 z-50",
      },
      size: {
        sm: "h-12",
        md: "h-16",
        lg: "h-20",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
  wcagAAA: {
    base: "w-full border-b-2 border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm",
    variants: {
      variant: {
        default: "relative",
        sticky: "sticky top-0 z-50",
        fixed: "fixed top-0 left-0 right-0 z-50",
      },
      size: {
        sm: "h-14",
        md: "h-18",
        lg: "h-22",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
});

export const Navbar = createPolymorphic<"nav", NavbarProperties>(
  (
    { as, children, className, variant = "default", size = "md", ...props },
    ref,
  ) => {
    const localReference = React.useRef<HTMLElement>(null);
    const composedReference = composeReferences(localReference, ref);

    // Dual-mode data attributes
    const dataProperties = createDualModeProperties(
      {
        "data-navbar": "true",
        "data-variant": variant,
        "data-size": size,
        "data-mode": "beautiful",
      },
      {
        "data-navbar": "true",
        "data-variant": variant,
        "data-size": size,
        "data-mode": "wcag-aaa",
        "data-wcag-compliant": "true",
        role: "navigation",
        "aria-label": "Main navigation",
      },
    );

    const Tag = (as ?? "nav") as "nav";

    return (
      <Tag
        ref={composedReference}
        className={cn(navbarStyles({ variant, size }), className)}
        {...dataProperties}
        {...props}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-full">
            {children}
          </div>
        </div>
      </Tag>
    );
  },
  "Navbar",
);

// Navbar Brand Component
const navbarBrandStyles = createAccessibilityVariants({
  beautiful: {
    base: "flex items-center space-x-2 text-lg font-semibold text-foreground hover:text-primary transition-colors",
  },
  wcagAAA: {
    base: "flex items-center space-x-2 text-xl font-bold text-foreground hover:text-primary transition-colors min-h-[44px]",
  },
});

export const NavbarBrand = createPolymorphic<"a", NavbarBrandProperties>(
  ({ as, children, href, className, ...props }, ref) => {
    const localReference = React.useRef<HTMLAnchorElement>(null);
    const composedReference = composeReferences(localReference, ref);

    const Tag = (as ?? "a") as "a";

    return (
      <Tag
        ref={composedReference}
        href={href}
        className={cn(navbarBrandStyles(), className)}
        {...props}
      >
        {children}
      </Tag>
    );
  },
  "NavbarBrand",
);

// Navbar Nav Component
const navbarNavStyles = createAccessibilityVariants({
  beautiful: {
    base: "flex items-center space-x-1",
    variants: {
      orientation: {
        horizontal: "flex-row space-x-1",
        vertical: "flex-col space-y-1",
      },
    },
    defaultVariants: { orientation: "horizontal" },
  },
  wcagAAA: {
    base: "flex items-center space-x-2",
    variants: {
      orientation: {
        horizontal: "flex-row space-x-2",
        vertical: "flex-col space-y-2",
      },
    },
    defaultVariants: { orientation: "horizontal" },
  },
});

export const NavbarNav = createPolymorphic<"ul", NavbarNavProperties>(
  ({ as, children, className, orientation = "horizontal", ...props }, ref) => {
    const localReference = React.useRef<HTMLUListElement>(null);
    const composedReference = composeReferences(localReference, ref);

    const Tag = (as ?? "ul") as "ul";

    return (
      <Tag
        ref={composedReference}
        className={cn(navbarNavStyles({ orientation }), className)}
        {...props}
      >
        {children}
      </Tag>
    );
  },
  "NavbarNav",
);

// Navbar Item Component
const navbarItemStyles = createAccessibilityVariants({
  beautiful: {
    base: "inline-flex items-center px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors",
    variants: {
      active: {
        true: "text-foreground bg-muted",
        false: "",
      },
      disabled: {
        true: "opacity-50 cursor-not-allowed",
        false: "",
      },
    },
    defaultVariants: { active: "false", disabled: "false" },
  },
  wcagAAA: {
    base: "inline-flex items-center px-4 py-3 text-base font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors min-h-[44px]",
    variants: {
      active: {
        true: "text-foreground bg-muted border-2 border-border",
        false: "",
      },
      disabled: {
        true: "opacity-50 cursor-not-allowed",
        false: "",
      },
    },
    defaultVariants: { active: "false", disabled: "false" },
  },
});

export const NavbarItem = createPolymorphic<"li", NavbarItemProperties>(
  (
    {
      as,
      children,
      href,
      active = false,
      disabled = false,
      className,
      onClick,
      ...props
    },
    ref,
  ) => {
    const localReference = React.useRef<HTMLLIElement>(null);
    const composedReference = composeReferences(localReference, ref);

    const handleClick = () => {
      if (!disabled) {
        onClick?.();
      }
    };

    // Dual-mode data attributes
    const dataProperties = createDualModeProperties(
      {
        "data-navbar-item": "true",
        "data-active": dataAttribute(active),
        "data-disabled": dataAttribute(disabled),
        "data-mode": "beautiful",
      },
      {
        "data-navbar-item": "true",
        "data-active": dataAttribute(active),
        "data-disabled": dataAttribute(disabled),
        "data-mode": "wcag-aaa",
        "data-wcag-compliant": "true",
        role: "menuitem",
        "aria-current": active ? "page" : undefined,
        "aria-disabled": ariaAttribute(disabled),
      },
    );

    const Tag = (as ?? "li") as "li";

    return (
      <Tag
        ref={composedReference}
        className={cn(
          navbarItemStyles({
            active: active ? "true" : "false",
            disabled: disabled ? "true" : "false",
          }),
          className,
        )}
        onClick={handleClick}
        {...dataProperties}
        {...props}
      >
        {href ? (
          <a href={href} className="block w-full">
            {children}
          </a>
        ) : (
          children
        )}
      </Tag>
    );
  },
  "NavbarItem",
);

// Navbar Toggle Component (for mobile)
const navbarToggleStyles = createAccessibilityVariants({
  beautiful: {
    base: "inline-flex items-center justify-center p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors md:hidden",
  },
  wcagAAA: {
    base: "inline-flex items-center justify-center p-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors md:hidden min-h-[44px] min-w-[44px]",
  },
});

export const NavbarToggle = createPolymorphic<"button", NavbarToggleProperties>(
  ({ as, expanded = false, onToggle, className, ...props }, ref) => {
    const localReference = React.useRef<HTMLButtonElement>(null);
    const composedReference = composeReferences(localReference, ref);

    const handleClick = () => {
      onToggle?.(!expanded);
    };

    // Dual-mode data attributes
    const dataProperties = createDualModeProperties(
      {
        "data-navbar-toggle": "true",
        "data-expanded": dataAttribute(expanded),
        "data-mode": "beautiful",
      },
      {
        "data-navbar-toggle": "true",
        "data-expanded": dataAttribute(expanded),
        "data-mode": "wcag-aaa",
        "data-wcag-compliant": "true",
        role: "button",
        "aria-expanded": expanded,
        "aria-label": "Toggle navigation menu",
        "aria-controls": "navbar-menu",
      },
    );

    const Tag = (as ?? "button") as "button";

    return (
      <Tag
        ref={composedReference}
        className={cn(navbarToggleStyles(), className)}
        onClick={handleClick}
        {...dataProperties}
        {...props}
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          {expanded ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </Tag>
    );
  },
  "NavbarToggle",
);

// Legacy export for backward compatibility
export const navbarVariants = navbarStyles;
