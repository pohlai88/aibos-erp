import {
  cn,
  createPolymorphic,
  type PolymorphicProps as PolymorphicProperties,
  type PolymorphicRef as PolymorphicReference,
  createDualModeStyles,
  createAccessibilityVariants,
  variants,
} from "../../utils";
import * as React from "react";

// Drawer Types
export interface DrawerComponentProperties {
  /** Whether the drawer is open */
  open?: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
  title?: string;
  description?: string;
  side?: "left" | "right" | "top" | "bottom";
  size?: "sm" | "md" | "lg" | "xl" | "full";
  variant?: "default" | "overlay" | "push" | "cover";
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  footer?: React.ReactNode;
  header?: React.ReactNode;
  overlayClassName?: string;
  contentClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
  enableFocusTrap?: boolean;
  enableScrollLock?: boolean;
  enableKeyboardNavigation?: boolean;
  animationDuration?: number;
  animationEasing?: string;
  enableHapticFeedback?: boolean;
  enableAnalytics?: boolean;
  onAnalytics?: (event: DrawerAnalyticsEvent) => void;
  className?: string;
}

export interface DrawerAnalyticsEvent {
  type: "open" | "close" | "interact" | "resize";
  payload: {
    side?: string;
    size?: string;
    variant?: string;
    timestamp: number;
  };
}

// Styles for the Drawer
const drawerOverlayStyles = variants({
  base: "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm",
  variants: {
    variant: {
      default: "bg-background/80",
      overlay: "bg-background/60",
      push: "bg-transparent",
      cover: "bg-background/90",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const drawerContentStyles = variants({
  base: "fixed z-50 bg-card border shadow-xl transition-all duration-300 ease-out",
  variants: {
    side: {
      left: "left-0 top-0 h-full",
      right: "right-0 top-0 h-full",
      top: "top-0 left-0 w-full",
      bottom: "bottom-0 left-0 w-full",
    },
    size: {
      sm: "",
      md: "",
      lg: "",
      xl: "",
      full: "",
    },
    variant: {
      default: "border-border",
      overlay: "border-border/50",
      push: "border-border shadow-2xl",
      cover: "border-border/20",
    },
  },
  defaultVariants: {
    side: "right",
    size: "md",
    variant: "default",
  },
});

const drawerHeaderStyles = variants({
  base: "flex items-center justify-between p-4 border-b border-border",
  variants: {
    variant: {
      default: "bg-card",
      overlay: "bg-card/95",
      push: "bg-card",
      cover: "bg-card/90",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const drawerBodyStyles = variants({
  base: "flex-1 overflow-y-auto p-4",
  variants: {
    variant: {
      default: "bg-card",
      overlay: "bg-card/95",
      push: "bg-card",
      cover: "bg-card/90",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const drawerFooterStyles = variants({
  base: "flex items-center justify-end gap-2 p-4 border-t border-border",
  variants: {
    variant: {
      default: "bg-card",
      overlay: "bg-card/95",
      push: "bg-card",
      cover: "bg-card/90",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const drawerCloseButtonStyles = variants({
  base: "inline-flex items-center justify-center rounded-md p-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground",
  variants: {
    variant: {
      default: "text-muted-foreground hover:text-foreground",
      overlay: "text-muted-foreground/80 hover:text-foreground",
      push: "text-muted-foreground hover:text-foreground",
      cover: "text-muted-foreground/90 hover:text-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

// Drawer Component
export const OverlayDrawer = createPolymorphic<"div", DrawerComponentProperties>(
  ({
    as,
    open = false,
    onClose,
    children,
    title,
    description,
    side = "right",
    size = "md",
    variant = "default",
    closeOnOverlayClick = true,
    closeOnEscape = true,
    showCloseButton = true,
    showHeader = true,
    showFooter = false,
    footer,
    header,
    overlayClassName,
    contentClassName,
    headerClassName,
    footerClassName,
    enableFocusTrap = true,
    enableScrollLock = true,
    animationDuration = 300,
    animationEasing = "ease-out",
    enableHapticFeedback = false,
    enableAnalytics = false,
    onAnalytics,
    className,
    ...props
  }: PolymorphicProperties<"div", DrawerComponentProperties>, ref: PolymorphicReference<"div">) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const [isAnimating, setIsAnimating] = React.useState(false);
    const drawerRef = React.useRef<HTMLDivElement>(null);
    const previousFocusRef = React.useRef<HTMLElement | null>(null);

    // Handle size classes
    const getSizeClasses = React.useCallback(() => {
      const sizeMap: Record<string, string> = {
        sm: side === "left" || side === "right" ? "w-80" : "h-80",
        md: side === "left" || side === "right" ? "w-96" : "h-96",
        lg: side === "left" || side === "right" ? "w-[32rem]" : "h-[32rem]",
        xl: side === "left" || side === "right" ? "w-[40rem]" : "h-[40rem]",
        full: side === "left" || side === "right" ? "w-full" : "h-full",
      };
      return sizeMap[size];
    }, [side, size]);

    // Handle open/close animations
    React.useEffect(() => {
      if (open) {
        setIsVisible(true);
        setIsAnimating(true);
        
        // Store previous focus
        previousFocusRef.current = document.activeElement as HTMLElement;
        
        // Analytics
        if (enableAnalytics && onAnalytics) {
          onAnalytics({
            type: "open",
            payload: { side, size, variant, timestamp: Date.now() },
          });
        }
        
        // Focus trap
        if (enableFocusTrap && drawerRef.current) {
          const focusableElements = drawerRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length > 0) {
            (focusableElements[0] as HTMLElement).focus();
          }
        }
        
        // Scroll lock
        if (enableScrollLock) {
          document.body.style.overflow = "hidden";
        }
        
        // Haptic feedback
        if (enableHapticFeedback && "vibrate" in navigator) {
          navigator.vibrate(50);
        }
        
        const timer = setTimeout(() => setIsAnimating(false), animationDuration);
        return () => clearTimeout(timer);
      } else {
        setIsAnimating(true);
        
        // Restore focus
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
        
        // Restore scroll
        if (enableScrollLock) {
          document.body.style.overflow = "";
        }
        
        const timer = setTimeout(() => {
          setIsVisible(false);
          setIsAnimating(false);
        }, animationDuration);
        return () => clearTimeout(timer);
      }
    }, [open, side, size, variant, enableFocusTrap, enableScrollLock, enableHapticFeedback, enableAnalytics, onAnalytics, animationDuration]);

    // Handle escape key
    React.useEffect(() => {
      if (!open || !closeOnEscape) return;

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          onClose?.();
          if (enableAnalytics && onAnalytics) {
            onAnalytics({
              type: "close",
              payload: { side, size, variant, timestamp: Date.now() },
            });
          }
        }
      };

      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }, [open, closeOnEscape, onClose, side, size, variant, enableAnalytics, onAnalytics]);

    // Handle overlay click
    const handleOverlayClick = (event: React.MouseEvent) => {
      if (closeOnOverlayClick && event.target === event.currentTarget) {
        onClose?.();
        if (enableAnalytics && onAnalytics) {
          onAnalytics({
            type: "close",
            payload: { side, size, variant, timestamp: Date.now() },
          });
        }
      }
    };

    // Handle resize
    const handleResize = React.useCallback(() => {
      if (enableAnalytics && onAnalytics) {
        onAnalytics({
          type: "resize",
          payload: { side, size, variant, timestamp: Date.now() },
        });
      }
    }, [side, size, variant, enableAnalytics, onAnalytics]);

    React.useEffect(() => {
      if (!open) return;
      
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, [open, handleResize]);

    if (!isVisible) return null;

    const Component = as || "div";

    return (
      <Component
        ref={ref}
        className={cn(drawerOverlayStyles({ variant }), overlayClassName)}
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "drawer-title" : undefined}
        aria-describedby={description ? "drawer-description" : undefined}
        {...props}
      >
        <div
          ref={drawerRef}
          className={cn(
            drawerContentStyles({ side, size, variant }),
            getSizeClasses(),
            contentClassName,
            className
          )}
          style={{
            transform: open ? "translateX(0)" : 
              side === "left" ? "translateX(-100%)" :
              side === "right" ? "translateX(100%)" :
              side === "top" ? "translateY(-100%)" :
              "translateY(100%)",
            transition: `transform ${animationDuration}ms ${animationEasing}`,
          }}
        >
          {/* Header */}
          {showHeader && (
            <div className={cn(drawerHeaderStyles({ variant }), headerClassName)}>
              {header || (
                <div className="flex-1">
                  {title && (
                    <h2 id="drawer-title" className="text-lg font-semibold text-foreground">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id="drawer-description" className="text-sm text-muted-foreground mt-1">
                      {description}
                    </p>
                  )}
                </div>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className={cn(drawerCloseButtonStyles({ variant }))}
                  aria-label="Close drawer"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div className={cn(drawerBodyStyles({ variant }))}>
            {children}
          </div>

          {/* Footer */}
          {showFooter && footer && (
            <div className={cn(drawerFooterStyles({ variant }), footerClassName)}>
              {footer}
            </div>
          )}
        </div>
      </Component>
    );
  },
  "OverlayDrawer"
);

// Export styles for external use
export const overlayDrawerVariants = {
  drawerOverlayStyles,
  drawerContentStyles,
  drawerHeaderStyles,
  drawerBodyStyles,
  drawerFooterStyles,
  drawerCloseButtonStyles,
};
