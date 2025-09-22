import {
  createPolymorphic,
  composeRefs as composeReferences,
  dataAttr as dataAttribute,
  ariaAttr as ariaAttribute,
  cn,
  createAccessibilityVariants,
  createDualModeStyles,
  createDualModeProps as createDualModeProperties,
  type PolymorphicProps as PolymorphicProperties,
  type PolymorphicRef as PolymorphicReference,
} from "../utils";
import {
  Home,
  User,
  Settings,
  Search,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Edit,
  Trash,
  Save,
  Download,
  Upload,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Mail,
  Phone,
  Calendar,
  Clock,
  MapPin,
  Building,
  Users,
  Package,
  ShoppingCart,
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import * as React from "react";

/**
 * ICON COMPONENT SYSTEM
 * Comprehensive icon system with Lucide React integration
 */
export interface IconProperties {
  name: keyof typeof iconMap;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

// Icon mapping for easy access
export const iconMap = {
  // Navigation
  home: Home,
  user: User,
  settings: Settings,
  search: Search,
  menu: Menu,
  close: X,

  // Arrows
  "chevron-down": ChevronDown,
  "chevron-up": ChevronUp,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,

  // Actions
  plus: Plus,
  minus: Minus,
  edit: Edit,
  trash: Trash,
  save: Save,
  download: Download,
  upload: Upload,

  // Visibility
  eye: Eye,
  "eye-off": EyeOff,
  lock: Lock,
  unlock: Unlock,

  // Communication
  mail: Mail,
  phone: Phone,
  calendar: Calendar,
  clock: Clock,
  "map-pin": MapPin,

  // Business
  building: Building,
  users: Users,
  package: Package,
  "shopping-cart": ShoppingCart,
  "credit-card": CreditCard,
  "dollar-sign": DollarSign,

  // Charts
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  "bar-chart": BarChart3,
  "pie-chart": PieChart,
  "line-chart": LineChart,
  activity: Activity,

  // Status
  "alert-circle": AlertCircle,
  "check-circle": CheckCircle,
  info: Info,
  "alert-triangle": AlertTriangle,
  "x-circle": XCircle,
} as const;

// Icon size variants
const iconStyles = createAccessibilityVariants({
  beautiful: {
    base: "inline-flex items-center justify-center text-current",
    variants: {
      size: {
        xs: "h-3 w-3",
        sm: "h-4 w-4",
        md: "h-5 w-5",
        lg: "h-6 w-6",
        xl: "h-8 w-8",
      },
    },
    defaultVariants: { size: "md" },
  },
  wcagAAA: {
    base: "inline-flex items-center justify-center text-current",
    variants: {
      size: {
        xs: "h-4 w-4",
        sm: "h-5 w-5",
        md: "h-6 w-6",
        lg: "h-8 w-8",
        xl: "h-10 w-10",
      },
    },
    defaultVariants: { size: "md" },
  },
});

export const Icon = createPolymorphic<"span", IconProperties>(
  (
    {
      as,
      name,
      size = "md",
      className,
      onClick,
      disabled = false,
      ...props
    }: PolymorphicProperties<"span", IconProperties>,
    ref: PolymorphicReference<"span">,
  ) => {
    const localReference = React.useRef<HTMLSpanElement>(null);
    const composedReference = composeReferences(localReference, ref);

    const IconComponent = iconMap[name];

    if (!IconComponent) {
      console.warn(`Icon "${name}" not found`);
      return null;
    }

    // Dual-mode data attributes
    const dataProperties = createDualModeProperties(
      {
        "data-icon": "true",
        "data-name": name,
        "data-size": size,
        "data-disabled": dataAttribute(disabled),
        "data-mode": "beautiful",
      },
      {
        "data-icon": "true",
        "data-name": name,
        "data-size": size,
        "data-disabled": dataAttribute(disabled),
        "data-mode": "wcag-aaa",
        "data-wcag-compliant": "true",
        role: onClick ? "button" : "img",
        "aria-label": `${name} icon`,
        "aria-disabled": ariaAttribute(disabled),
      },
    );

    const Tag = (as ?? "span") as "span";

    return (
      <Tag
        ref={composedReference}
        className={cn(
          iconStyles({ size }),
          onClick &&
            !disabled &&
            "cursor-pointer hover:opacity-80 transition-opacity",
          disabled && "opacity-50 cursor-not-allowed",
          className,
        )}
        onClick={disabled ? undefined : onClick}
        {...dataProperties}
        {...props}
      >
        <IconComponent className="h-full w-full" />
      </Tag>
    );
  },
  "Icon",
);

// Icon Button Component
export interface IconButtonProperties {
  icon: keyof typeof iconMap;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
  "aria-label": string;
}

const iconButtonStyles = createAccessibilityVariants({
  beautiful: {
    base: "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-muted hover:text-muted-foreground",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        xs: "h-6 w-6",
        sm: "h-8 w-8",
        md: "h-10 w-10",
        lg: "h-12 w-12",
        xl: "h-14 w-14",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
  wcagAAA: {
    base: "inline-flex items-center justify-center rounded-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-h-[44px] min-w-[44px]",
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",
        ghost:
          "hover:bg-muted hover:text-muted-foreground border-2 border-transparent hover:border-muted/20",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
      },
      size: {
        xs: "h-12 w-12",
        sm: "h-12 w-12",
        md: "h-14 w-14",
        lg: "h-16 w-16",
        xl: "h-18 w-18",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
});

export const IconButton = createPolymorphic<"button", IconButtonProperties>(
  (
    {
      as,
      icon,
      size = "md",
      variant = "primary",
      disabled = false,
      loading = false,
      className,
      onClick,
      "aria-label": ariaLabel,
      ...props
    },
    ref,
  ) => {
    const localReference = React.useRef<HTMLButtonElement>(null);
    const composedReference = composeReferences(localReference, ref);

    // Dual-mode data attributes
    const dataProperties = createDualModeProperties(
      {
        "data-icon-button": "true",
        "data-icon": icon,
        "data-variant": variant,
        "data-size": size,
        "data-disabled": dataAttribute(disabled),
        "data-loading": dataAttribute(loading),
        "data-mode": "beautiful",
      },
      {
        "data-icon-button": "true",
        "data-icon": icon,
        "data-variant": variant,
        "data-size": size,
        "data-disabled": dataAttribute(disabled),
        "data-loading": dataAttribute(loading),
        "data-mode": "wcag-aaa",
        "data-wcag-compliant": "true",
        role: "button",
        "aria-disabled": ariaAttribute(disabled),
        "aria-busy": ariaAttribute(loading),
      },
    );

    const Tag = (as ?? "button") as "button";

    return (
      <Tag
        ref={composedReference}
        className={cn(iconButtonStyles({ variant, size }), className)}
        onClick={disabled || loading ? undefined : onClick}
        disabled={disabled || loading}
        aria-label={ariaLabel}
        {...dataProperties}
        {...props}
      >
        {loading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <Icon name={icon} size={size} />
        )}
      </Tag>
    );
  },
  "IconButton",
);

// Icon Text Component (Icon + Text)
export interface IconTextProperties {
  icon: keyof typeof iconMap;
  children?: React.ReactNode;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  spacing?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const iconTextStyles = createAccessibilityVariants({
  beautiful: {
    base: "inline-flex items-center",
    variants: {
      spacing: {
        xs: "gap-1",
        sm: "gap-1.5",
        md: "gap-2",
        lg: "gap-3",
      },
    },
    defaultVariants: { spacing: "sm" },
  },
  wcagAAA: {
    base: "inline-flex items-center",
    variants: {
      spacing: {
        xs: "gap-1.5",
        sm: "gap-2",
        md: "gap-2.5",
        lg: "gap-3",
      },
    },
    defaultVariants: { spacing: "sm" },
  },
});

export const IconText = createPolymorphic<"span", IconTextProperties>(
  (
    { as, icon, children, size = "md", spacing = "sm", className, ...props },
    ref,
  ) => {
    const localReference = React.useRef<HTMLSpanElement>(null);
    const composedReference = composeReferences(localReference, ref);

    const Tag = (as ?? "span") as "span";

    return (
      <Tag
        ref={composedReference}
        className={cn(iconTextStyles({ spacing }), className)}
        {...props}
      >
        <Icon name={icon} size={size} />
        {children && <span>{children}</span>}
      </Tag>
    );
  },
  "IconText",
);

// Legacy export for backward compatibility
export const iconVariants = iconStyles;
