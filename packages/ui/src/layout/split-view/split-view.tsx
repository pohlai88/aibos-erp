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

// Split View Types
export interface SplitViewComponentProperties {
  /** Orientation of the split */
  orientation?: "horizontal" | "vertical";
  /** Initial sizes of panels (in percentage) */
  initialSizes?: number[];
  /** Minimum size of each panel (in pixels) */
  minSizes?: number[];
  /** Maximum size of each panel (in pixels) */
  maxSizes?: number[];
  /** Whether panels can be resized */
  resizable?: boolean;
  /** Whether to show resize handles */
  showHandles?: boolean;
  /** Size of resize handles */
  handleSize?: number;
  /** Children panels */
  children?: React.ReactNode;
  /** Custom resize handle component */
  resizeHandle?: React.ReactNode;
  /** Callback when sizes change */
  onSizesChange?: (sizes: number[]) => void;
  /** Whether to persist sizes in localStorage */
  persistSizes?: boolean;
  /** Storage key for persistence */
  storageKey?: string;
  /** Whether to enable keyboard navigation */
  enableKeyboardNavigation?: boolean;
  /** Whether to enable touch gestures */
  enableTouchGestures?: boolean;
  /** Whether to show size indicators */
  showSizeIndicators?: boolean;
  /** Animation duration for resize */
  animationDuration?: number;
  /** Whether to enable haptic feedback */
  enableHapticFeedback?: boolean;
  /** Whether to enable analytics */
  enableAnalytics?: boolean;
  /** Analytics callback */
  onAnalytics?: (event: SplitViewAnalyticsEvent) => void;
  /** Custom class name */
  className?: string;
}

export interface SplitViewPanelProperties {
  /** Panel content */
  children?: React.ReactNode;
  /** Panel title */
  title?: string;
  /** Panel ID */
  id?: string;
  /** Whether panel is collapsible */
  collapsible?: boolean;
  /** Whether panel is collapsed */
  collapsed?: boolean;
  /** Callback when panel is collapsed/expanded */
  onCollapse?: (collapsed: boolean) => void;
  /** Minimum size when collapsed */
  collapsedSize?: number;
  /** Custom class name */
  className?: string;
}

export interface SplitViewAnalyticsEvent {
  type: "resize" | "collapse" | "expand" | "interact";
  payload: {
    panelId?: string;
    orientation?: string;
    sizes?: number[];
    timestamp: number;
  };
}

// Styles for Split View
const splitViewStyles = variants({
  base: "flex w-full h-full",
  variants: {
    orientation: {
      horizontal: "flex-row",
      vertical: "flex-col",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
});

const splitViewPanelStyles = variants({
  base: "relative overflow-hidden transition-all duration-200 ease-out",
  variants: {
    orientation: {
      horizontal: "h-full",
      vertical: "w-full",
    },
    collapsed: {
      true: "opacity-50",
      false: "opacity-100",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
    collapsed: "false",
  },
});

const splitViewHandleStyles = variants({
  base: "bg-border hover:bg-border/80 transition-colors duration-150 cursor-col-resize relative group",
  variants: {
    orientation: {
      horizontal: "w-1 h-full cursor-col-resize",
      vertical: "h-1 w-full cursor-row-resize",
    },
    active: {
      true: "bg-primary/50",
      false: "bg-border",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
    active: "false",
  },
});

const splitViewHandleIndicatorStyles = variants({
  base: "absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150",
  variants: {
    orientation: {
      horizontal: "left-1/2 -translate-x-1/2",
      vertical: "top-1/2 -translate-y-1/2",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
});

const splitViewPanelHeaderStyles = variants({
  base: "flex items-center justify-between p-2 border-b border-border bg-muted/50",
  variants: {
    orientation: {
      horizontal: "h-10",
      vertical: "h-8",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
});

const splitViewPanelContentStyles = variants({
  base: "flex-1 overflow-auto p-2",
  variants: {
    orientation: {
      horizontal: "h-[calc(100%-2.5rem)]",
      vertical: "h-[calc(100%-2rem)]",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
});

// Split View Component
export const SplitView = createPolymorphic<"div", SplitViewComponentProperties>(
  ({
    as,
    orientation = "horizontal",
    initialSizes = [50, 50],
    minSizes = [100, 100],
    maxSizes = [Infinity, Infinity],
    resizable = true,
    showHandles = true,
    handleSize = 4,
    children,
    resizeHandle,
    onSizesChange,
    persistSizes = false,
    storageKey = "split-view-sizes",
    enableKeyboardNavigation = true,
    enableTouchGestures = true,
    showSizeIndicators = true,
    animationDuration = 200,
    enableHapticFeedback = false,
    enableAnalytics = false,
    onAnalytics,
    className,
    ...props
  }: PolymorphicProperties<"div", SplitViewComponentProperties>, ref: PolymorphicReference<"div">) => {
    const [sizes, setSizes] = React.useState<number[]>(initialSizes);
    const [isResizing, setIsResizing] = React.useState(false);
    const [activeHandle, setActiveHandle] = React.useState<number | null>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const startPosRef = React.useRef<number>(0);
    const startSizesRef = React.useRef<number[]>([]);

    // Load persisted sizes
    React.useEffect(() => {
      if (persistSizes && typeof window !== "undefined") {
        const savedSizes = localStorage.getItem(storageKey);
        if (savedSizes) {
          try {
            const parsedSizes = JSON.parse(savedSizes);
            if (Array.isArray(parsedSizes) && parsedSizes.length === initialSizes.length) {
              setSizes(parsedSizes);
            }
          } catch (error) {
            console.warn("Failed to parse saved split view sizes:", error);
          }
        }
      }
    }, [persistSizes, storageKey, initialSizes.length]);

    // Save sizes to localStorage
    React.useEffect(() => {
      if (persistSizes && typeof window !== "undefined") {
        localStorage.setItem(storageKey, JSON.stringify(sizes));
      }
    }, [sizes, persistSizes, storageKey]);

    // Handle mouse down on resize handle
    const handleMouseDown = React.useCallback((event: React.MouseEvent, handleIndex: number) => {
      if (!resizable) return;
      
      event.preventDefault();
      setIsResizing(true);
      setActiveHandle(handleIndex);
      startPosRef.current = orientation === "horizontal" ? event.clientX : event.clientY;
      startSizesRef.current = [...sizes];

      // Analytics
      if (enableAnalytics && onAnalytics) {
        onAnalytics({
          type: "interact",
          payload: { orientation, sizes, timestamp: Date.now() },
        });
      }

      // Haptic feedback
      if (enableHapticFeedback && "vibrate" in navigator) {
        navigator.vibrate(30);
      }
    }, [resizable, orientation, sizes, enableAnalytics, onAnalytics, enableHapticFeedback]);

    // Handle mouse move
    const handleMouseMove = React.useCallback((event: MouseEvent) => {
      if (!isResizing || activeHandle === null) return;

      const currentPos = orientation === "horizontal" ? event.clientX : event.clientY;
      const delta = currentPos - startPosRef.current;
      
      if (!containerRef.current) return;
      
      const containerSize = orientation === "horizontal" 
        ? containerRef.current.offsetWidth 
        : containerRef.current.offsetHeight;
      
      const deltaPercent = (delta / containerSize) * 100;
      
      const newSizes = [...startSizesRef.current];
      const leftPanelIndex = activeHandle;
      const rightPanelIndex = activeHandle + 1;
      
      // Calculate new sizes
      const newLeftSize = Math.max(
        (minSizes[leftPanelIndex] || 0) / containerSize * 100,
        Math.min(
          (maxSizes[leftPanelIndex] || Infinity) / containerSize * 100,
          (newSizes[leftPanelIndex] || 0) + deltaPercent
        )
      );
      
      const newRightSize = Math.max(
        (minSizes[rightPanelIndex] || 0) / containerSize * 100,
        Math.min(
          (maxSizes[rightPanelIndex] || Infinity) / containerSize * 100,
          (newSizes[rightPanelIndex] || 0) - deltaPercent
        )
      );
      
      newSizes[leftPanelIndex] = newLeftSize;
      newSizes[rightPanelIndex] = newRightSize;
      
      setSizes(newSizes);
      onSizesChange?.(newSizes);
    }, [isResizing, activeHandle, orientation, minSizes, maxSizes, onSizesChange]);

    // Handle mouse up
    const handleMouseUp = React.useCallback(() => {
      if (!isResizing) return;
      
      setIsResizing(false);
      setActiveHandle(null);
      
      // Analytics
      if (enableAnalytics && onAnalytics) {
        onAnalytics({
          type: "resize",
          payload: { orientation, sizes, timestamp: Date.now() },
        });
      }
    }, [isResizing, orientation, sizes, enableAnalytics, onAnalytics]);

    // Add event listeners
    React.useEffect(() => {
      if (isResizing) {
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        return () => {
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
        };
      }
    }, [isResizing, handleMouseMove, handleMouseUp]);

    // Handle keyboard navigation
    React.useEffect(() => {
      if (!enableKeyboardNavigation) return;

      const handleKeyDown = (event: KeyboardEvent) => {
        if (activeHandle === null) return;

        const step = 5; // 5% step
        let newSizes = [...sizes];

        switch (event.key) {
          case "ArrowLeft":
          case "ArrowUp": {
            if (orientation === "horizontal" && event.key === "ArrowLeft") {
              newSizes[activeHandle] = Math.max((minSizes[activeHandle] || 0) / (containerRef.current?.offsetWidth || 1) * 100, (sizes[activeHandle] || 0) - step);
              newSizes[activeHandle + 1] = Math.min((maxSizes[activeHandle + 1] || Infinity) / (containerRef.current?.offsetWidth || 1) * 100, (sizes[activeHandle + 1] || 0) + step);
            } else if (orientation === "vertical" && event.key === "ArrowUp") {
              newSizes[activeHandle] = Math.max((minSizes[activeHandle] || 0) / (containerRef.current?.offsetHeight || 1) * 100, (sizes[activeHandle] || 0) - step);
              newSizes[activeHandle + 1] = Math.min((maxSizes[activeHandle + 1] || Infinity) / (containerRef.current?.offsetHeight || 1) * 100, (sizes[activeHandle + 1] || 0) + step);
            }
            break;
          }
          case "ArrowRight":
          case "ArrowDown": {
            if (orientation === "horizontal" && event.key === "ArrowRight") {
              newSizes[activeHandle] = Math.min((maxSizes[activeHandle] || Infinity) / (containerRef.current?.offsetWidth || 1) * 100, (sizes[activeHandle] || 0) + step);
              newSizes[activeHandle + 1] = Math.max((minSizes[activeHandle + 1] || 0) / (containerRef.current?.offsetWidth || 1) * 100, (sizes[activeHandle + 1] || 0) - step);
            } else if (orientation === "vertical" && event.key === "ArrowDown") {
              newSizes[activeHandle] = Math.min((maxSizes[activeHandle] || Infinity) / (containerRef.current?.offsetHeight || 1) * 100, (sizes[activeHandle] || 0) + step);
              newSizes[activeHandle + 1] = Math.max((minSizes[activeHandle + 1] || 0) / (containerRef.current?.offsetHeight || 1) * 100, (sizes[activeHandle + 1] || 0) - step);
            }
            break;
          }
          case "Escape": {
            setIsResizing(false);
            setActiveHandle(null);
            break;
          }
        }

        if (newSizes !== sizes) {
          setSizes(newSizes);
          onSizesChange?.(newSizes);
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [enableKeyboardNavigation, activeHandle, sizes, orientation, minSizes, maxSizes, onSizesChange]);

    // Render resize handle
    const renderResizeHandle = (index: number) => {
      if (!showHandles || !resizable) return null;

      return (
        <div
          key={`handle-${index}`}
          className={cn(
            splitViewHandleStyles({ 
              orientation, 
              active: activeHandle === index ? "true" : "false"
            }),
            `w-${handleSize}`
          )}
          onMouseDown={(e) => handleMouseDown(e, index)}
          role="separator"
          aria-orientation={orientation}
          aria-label={`Resize panel ${index + 1} and ${index + 2}`}
        >
          {showSizeIndicators && (
            <div className={cn(splitViewHandleIndicatorStyles({ orientation }))}>
              <div className="bg-primary text-primary-foreground text-xs px-1 py-0.5 rounded">
                {Math.round(sizes[index] || 0)}% / {Math.round(sizes[index + 1] || 0)}%
              </div>
            </div>
          )}
          {resizeHandle}
        </div>
      );
    };

    // Render panels
    const renderPanels = () => {
      const panelChildren = React.Children.toArray(children);
      const panels: React.ReactNode[] = [];

      panelChildren.forEach((child, index) => {
        panels.push(
          <div
            key={`panel-${index}`}
            className={cn(splitViewPanelStyles({ orientation }))}
            style={{
              [orientation === "horizontal" ? "width" : "height"]: `${sizes[index]}%`,
              transition: isResizing ? "none" : `all ${animationDuration}ms ease-out`,
            }}
          >
            {child}
          </div>
        );

        // Add resize handle between panels
        if (index < panelChildren.length - 1) {
          panels.push(renderResizeHandle(index));
        }
      });

      return panels;
    };

    const Component = as || "div";

    return (
      <Component
        ref={containerRef}
        className={cn(splitViewStyles({ orientation }), className)}
        {...props}
      >
        {renderPanels()}
      </Component>
    );
  },
  "SplitView"
);

// Split View Panel Component
export const SplitViewPanel = createPolymorphic<"div", SplitViewPanelProperties>(
  ({
    as,
    children,
    title,
    id,
    collapsible = false,
    collapsed = false,
    onCollapse,
    collapsedSize = 50,
    className,
    ...props
  }: PolymorphicProperties<"div", SplitViewPanelProperties>, ref: PolymorphicReference<"div">) => {
    const handleCollapse = React.useCallback(() => {
      onCollapse?.(!collapsed);
    }, [collapsed, onCollapse]);

    const Component = as || "div";

    return (
      <Component
        ref={ref}
        className={cn(splitViewPanelStyles({ collapsed: collapsed ? "true" : "false" }), className)}
        id={id}
        {...props}
      >
        {title && (
          <div className={cn(splitViewPanelHeaderStyles({ orientation: "horizontal" }))}>
            <h3 className="text-sm font-medium text-foreground">{title}</h3>
            {collapsible && (
              <button
                onClick={handleCollapse}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label={collapsed ? "Expand panel" : "Collapse panel"}
              >
                <svg
                  className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
        )}
        <div className={cn(splitViewPanelContentStyles({ orientation: "horizontal" }))}>
          {children}
        </div>
      </Component>
    );
  },
  "SplitViewPanel"
);

// Export styles for external use
export const splitViewVariants = {
  splitViewStyles,
  splitViewPanelStyles,
  splitViewHandleStyles,
  splitViewHandleIndicatorStyles,
  splitViewPanelHeaderStyles,
  splitViewPanelContentStyles,
};

