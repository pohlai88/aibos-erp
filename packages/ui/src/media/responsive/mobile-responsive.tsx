import {
  createPolymorphic,
  composeRefs as composeReferences,
  dataAttr as dataAttribute,
  ariaAttr as ariaAttribute,
  cn,
  createAccessibilityVariants,
  createDualModeStyles,
  createDualModeProps as createDualModeProperties,
  useIsomorphicLayoutEffect,
} from "../../utils";
import * as React from "react";

/**
 * 📱 MOBILE-FIRST RESPONSIVE UTILITIES
 * 70% of ERP users are mobile-first
 * Field operations: Manufacturing, retail, logistics need mobile
 * Competitive gap: Most ERPs have terrible mobile UX
 */

// Responsive configuration types
export interface BreakpointConfig {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  "2xl": number;
}

export interface TouchConfig {
  target: "button" | "input" | "table" | "card" | "link";
  minSize: number;
  spacing: number;
  feedback: "visual" | "haptic" | "both";
}

export interface PWAConfig {
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  display: "standalone" | "fullscreen" | "minimal-ui";
  orientation: "portrait" | "landscape" | "any";
  icons: Array<{
    src: string;
    sizes: string;
    type: string;
  }>;
}

export interface SyncStrategy {
  mode: "online" | "offline" | "hybrid";
  conflictResolution: "server" | "client" | "manual";
  retryAttempts: number;
  retryDelay: number;
}

export interface OfflineConfig {
  strategy: SyncStrategy;
  cacheSize: number;
  syncInterval: number;
  backgroundSync: boolean;
}

// Responsive Container Component
export interface ResponsiveContainerProperties {
  breakpoints?: Partial<BreakpointConfig>;
  children?: React.ReactNode;
  className?: string;
}

const containerStyles = createAccessibilityVariants({
  beautiful: {
    base: "w-full mx-auto px-4",
    variants: {
      size: {
        xs: "max-w-xs",
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
        "2xl": "max-w-2xl",
        "3xl": "max-w-3xl",
        "4xl": "max-w-4xl",
        "5xl": "max-w-5xl",
        "6xl": "max-w-6xl",
        "7xl": "max-w-7xl",
        full: "max-w-full",
      },
    },
    defaultVariants: { size: "7xl" },
  },
  wcagAAA: {
    base: "w-full mx-auto px-6",
    variants: {
      size: {
        xs: "max-w-xs",
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
        "2xl": "max-w-2xl",
        "3xl": "max-w-3xl",
        "4xl": "max-w-4xl",
        "5xl": "max-w-5xl",
        "6xl": "max-w-6xl",
        "7xl": "max-w-7xl",
        full: "max-w-full",
      },
    },
    defaultVariants: { size: "7xl" },
  },
});

export const ResponsiveContainer = createPolymorphic<
  "div",
  ResponsiveContainerProperties
>(({ as, breakpoints, children, className, ...props }, ref) => {
  const localReference = React.useRef<HTMLDivElement>(null);
  const composedReference = composeReferences(localReference, ref);

  // Dual-mode data attributes
  const dataProperties = createDualModeProperties(
    {
      "data-responsive": "container",
    },
    {
      "data-responsive": "container",
      "data-wcag-compliant": "true",
    },
  );

  const Tag = (as ?? "div") as "div";

  return (
    <Tag
      ref={composedReference}
      className={cn(containerStyles(), className)}
      {...dataProperties}
      {...props}
    >
      {children}
    </Tag>
  );
}, "ResponsiveContainer");

// Touch-Optimized Button Component
export interface TouchButtonProperties {
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  touchOptimized?: boolean;
  hapticFeedback?: boolean;
  className?: string;
  onClick?: () => void;
}

const touchButtonStyles = createAccessibilityVariants({
  beautiful: {
    base: "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "bg-transparent hover:bg-muted/60",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-base",
        lg: "h-12 px-5 text-base",
      },
      touch: {
        true: "min-h-[44px] min-w-[44px] touch-manipulation active:scale-95",
        false: "",
      },
    },
    defaultVariants: { variant: "primary", size: "md", touch: "false" },
  },
  wcagAAA: {
    base: "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[44px] min-w-[44px] touch-manipulation",
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",
        ghost:
          "bg-transparent hover:bg-muted/60 border-2 border-transparent hover:border-muted/20",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
      },
      size: {
        sm: "h-12 px-4 text-sm",
        md: "h-14 px-5 text-base",
        lg: "h-16 px-6 text-lg",
      },
      touch: {
        true: "active:scale-95",
        false: "",
      },
    },
    defaultVariants: { variant: "primary", size: "md", touch: "true" },
  },
});

export const TouchButton = createPolymorphic<"button", TouchButtonProperties>(
  (
    {
      as,
      children,
      variant = "primary",
      size = "md",
      touchOptimized = true,
      hapticFeedback = true,
      className,
      onClick,
      ...props
    },
    ref,
  ) => {
    const localReference = React.useRef<HTMLButtonElement>(null);
    const composedReference = composeReferences(localReference, ref);

    // Handle haptic feedback
    const handleClick = () => {
      if (hapticFeedback && "vibrate" in navigator) {
        navigator.vibrate(50); // Short vibration
      }
      onClick?.();
    };

    // Dual-mode data attributes
    const dataProperties = createDualModeProperties(
      {
        "data-touch": "button",
        "data-optimized": dataAttribute(touchOptimized),
        "data-haptic": dataAttribute(hapticFeedback),
      },
      {
        "data-touch": "button",
        "data-optimized": dataAttribute(touchOptimized),
        "data-haptic": dataAttribute(hapticFeedback),
        "data-wcag-compliant": "true",
        role: "button",
      },
    );

    const Tag = (as ?? "button") as "button";

    return (
      <Tag
        ref={composedReference}
        className={cn(
          touchButtonStyles({
            variant,
            size,
            touch: touchOptimized ? "true" : "false",
          }),
          className,
        )}
        onClick={handleClick}
        {...dataProperties}
        {...props}
      >
        {children}
      </Tag>
    );
  },
  "TouchButton",
);

// Mobile Navigation Component
export interface MobileNavProperties {
  menu: Array<{
    label: string;
    href: string;
    icon?: React.ReactNode;
    badge?: number;
  }>;
  activeItem?: string;
  className?: string;
}

const mobileNavStyles = createAccessibilityVariants({
  beautiful: {
    base: "fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50",
  },
  wcagAAA: {
    base: "fixed bottom-0 left-0 right-0 bg-card border-t-2 border-border z-50 shadow-lg",
  },
});

const navItemStyles = createAccessibilityVariants({
  beautiful: {
    base: "flex flex-col items-center justify-center p-2 text-xs font-medium transition-colors",
    variants: {
      active: {
        true: "text-primary",
        false: "text-muted-foreground hover:text-foreground",
      },
    },
    defaultVariants: { active: "false" },
  },
  wcagAAA: {
    base: "flex flex-col items-center justify-center p-3 text-sm font-semibold transition-colors min-h-[44px]",
    variants: {
      active: {
        true: "text-primary",
        false: "text-muted-foreground hover:text-foreground",
      },
    },
    defaultVariants: { active: "false" },
  },
});

export const MobileNav = createPolymorphic<"nav", MobileNavProperties>(
  ({ as, menu, activeItem, className, ...props }, ref) => {
    const localReference = React.useRef<HTMLElement>(null);
    const composedReference = composeReferences(localReference, ref);

    // Dual-mode data attributes
    const dataProperties = createDualModeProperties(
      {
        "data-nav": "mobile",
        "data-items": menu.length,
      },
      {
        "data-nav": "mobile",
        "data-items": menu.length,
        "data-wcag-compliant": "true",
        role: "navigation",
        "aria-label": "Mobile navigation",
      },
    );

    const Tag = (as ?? "nav") as "nav";

    return (
      <Tag
        ref={composedReference}
        className={cn(mobileNavStyles(), className)}
        {...dataProperties}
        {...props}
      >
        <div className="flex items-center justify-around">
          {menu.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className={cn(
                navItemStyles({
                  active: activeItem === item.href ? "true" : "false",
                }),
                "relative",
              )}
              aria-label={item.label}
            >
              {item.icon && <div className="mb-1">{item.icon}</div>}
              <span>{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </a>
          ))}
        </div>
      </Tag>
    );
  },
  "MobileNav",
);

// Offline Sync Component
export interface OfflineSyncProperties {
  config: OfflineConfig;
  isOnline: boolean;
  lastSync?: Date;
  className?: string;
}

const offlineSyncStyles = createAccessibilityVariants({
  beautiful: {
    base: "fixed top-4 right-4 bg-card border border-border rounded-lg p-3 shadow-sm z-50",
  },
  wcagAAA: {
    base: "fixed top-4 right-4 bg-card border-2 border-border rounded-lg p-4 shadow-md z-50",
  },
});

export const OfflineSync = createPolymorphic<"div", OfflineSyncProperties>(
  ({ as, config, isOnline, lastSync, className, ...props }, ref) => {
    const localReference = React.useRef<HTMLDivElement>(null);
    const composedReference = composeReferences(localReference, ref);

    const [syncStatus, setSyncStatus] = React.useState<
      "idle" | "syncing" | "error"
    >("idle");

    // Dual-mode data attributes
    const dataProperties = createDualModeProperties(
      {
        "data-sync": "offline",
        "data-online": dataAttribute(isOnline),
        "data-status": syncStatus,
      },
      {
        "data-sync": "offline",
        "data-online": dataAttribute(isOnline),
        "data-status": syncStatus,
        "data-wcag-compliant": "true",
        role: "status",
        "aria-label": `Sync status: ${syncStatus}`,
      },
    );

    const Tag = (as ?? "div") as "div";

    return (
      <Tag
        ref={composedReference}
        className={cn(offlineSyncStyles(), className)}
        {...dataProperties}
        {...props}
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              isOnline ? "bg-success" : "bg-warning",
            )}
          />
          <span className="text-sm font-medium">
            {isOnline ? "Online" : "Offline"}
          </span>
          {lastSync && (
            <span className="text-xs text-muted-foreground">
              {new Date(lastSync).toLocaleTimeString()}
            </span>
          )}
        </div>
      </Tag>
    );
  },
  "OfflineSync",
);

/**
 * USAGE EXAMPLES:
 *
 * // Responsive Container
 * <ResponsiveContainer>
 *   <YourContent />
 * </ResponsiveContainer>
 *
 * // Touch-Optimized Button
 * <TouchButton
 *   variant="primary"
 *   size="lg"
 *   touchOptimized={true}
 *   hapticFeedback={true}
 * >
 *   Tap me
 * </TouchButton>
 *
 * // Mobile Navigation
 * <MobileNav
 *   menu={[
 *     { label: "Home", href: "/", icon: <HomeIcon /> },
 *     { label: "Orders", href: "/orders", icon: <OrdersIcon />, badge: 5 },
 *     { label: "Profile", href: "/profile", icon: <ProfileIcon /> }
 *   ]}
 *   activeItem="/orders"
 * />
 *
 * // Offline Sync
 * <OfflineSync
 *   config={offlineConfig}
 *   isOnline={isOnline}
 *   lastSync={lastSyncTime}
 * />
 */
