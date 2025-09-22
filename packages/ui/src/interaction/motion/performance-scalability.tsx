import {
  createPolymorphic,
  composeRefs as composeReferences,
  dataAttr as dataAttribute,
  ariaAttr as ariaAttribute,
  cn,
  createAccessibilityVariants,
  createDualModeStyles,
  createDualModeProps as createDualModeProperties,
  createLazyComponent,
  createOptimizedRendering,
} from "../../utils";
import * as React from "react";

/**
 * 🚀 PERFORMANCE & SCALABILITY UTILITIES
 * Enterprise scale: Large companies have massive data volumes
 * User experience: Slow = frustrated users = churn
 * Technical differentiation: Performance is a competitive advantage
 */

// Performance configuration types
export interface LazyStrategy {
  threshold: number;
  rootMargin: string;
  fallback: React.ComponentType;
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export interface OptimisticConfig {
  action: string;
  rollback: () => void;
  timeout: number;
}

export interface SyncManager {
  jobs: Array<{
    id: string;
    type: string;
    data: unknown;
    retries: number;
    status: "pending" | "running" | "completed" | "failed";
  }>;
  addJob: (job: unknown) => void;
  removeJob: (id: string) => void;
  retryJob: (id: string) => void;
}

export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  bundleSize: number;
  cacheHitRate: number;
  errorRate: number;
}

// Virtualized List Component
export interface VirtualizedListProperties<T = unknown> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
}

const virtualizedStyles = createAccessibilityVariants({
  beautiful: {
    base: "relative overflow-auto",
  },
  wcagAAA: {
    base: "relative overflow-auto",
  },
});

export const VirtualizedList = createPolymorphic<
  "div",
  VirtualizedListProperties
>(
  (
    {
      as,
      items,
      itemHeight,
      containerHeight,
      overscan = 5,
      renderItem,
      className,
      ...props
    },
    ref,
  ) => {
    const localReference = React.useRef<HTMLDivElement>(null);
    const composedReference = composeReferences(localReference, ref);

    const [scrollTop, setScrollTop] = React.useState(0);

    // Calculate visible range
    const visibleStart = Math.max(
      0,
      Math.floor(scrollTop / itemHeight) - overscan,
    );
    const visibleEnd = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan,
    );

    // Get visible items
    const visibleItems = items.slice(visibleStart, visibleEnd + 1);

    // Handle scroll
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    };

    // Dual-mode data attributes
    const dataProperties = createDualModeProperties(
      {
        "data-virtualized": "list",
        "data-items": items.length,
        "data-visible": visibleItems.length,
      },
      {
        "data-virtualized": "list",
        "data-items": items.length,
        "data-visible": visibleItems.length,
        "data-wcag-compliant": "true",
        role: "list",
        "aria-label": `Virtualized list with ${items.length} items`,
      },
    );

    const Tag = (as ?? "div") as "div";

    return (
      <Tag
        ref={composedReference}
        className={cn(virtualizedStyles(), className)}
        style={{ height: containerHeight }}
        onScroll={handleScroll}
        {...dataProperties}
        {...props}
      >
        <div
          style={{ height: items.length * itemHeight, position: "relative" }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={visibleStart + index}
              style={{
                position: "absolute",
                top: (visibleStart + index) * itemHeight,
                left: 0,
                right: 0,
                height: itemHeight,
              }}
            >
              {renderItem(item, visibleStart + index)}
            </div>
          ))}
        </div>
      </Tag>
    );
  },
  "VirtualizedList",
);

// Optimistic Update Component
export interface OptimisticUpdateProperties {
  action: string;
  onConfirm: () => void;
  onRollback: () => void;
  timeout?: number;
  children?: React.ReactNode;
  className?: string;
}

const optimisticStyles = createAccessibilityVariants({
  beautiful: {
    base: "relative transition-all duration-200",
    variants: {
      state: {
        pending: "opacity-50",
        confirmed: "opacity-100",
        rolledback: "opacity-100",
      },
    },
    defaultVariants: { state: "pending" },
  },
  wcagAAA: {
    base: "relative transition-all duration-0",
    variants: {
      state: {
        pending: "opacity-50 border-2 border-warning",
        confirmed: "opacity-100 border-2 border-success",
        rolledback: "opacity-100 border-2 border-destructive",
      },
    },
    defaultVariants: { state: "pending" },
  },
});

export const OptimisticUpdate = createPolymorphic<
  "div",
  OptimisticUpdateProperties
>(
  (
    {
      as,
      action,
      onConfirm,
      onRollback,
      timeout = 5000,
      children,
      className,
      ...props
    },
    ref,
  ) => {
    const localReference = React.useRef<HTMLDivElement>(null);
    const composedReference = composeReferences(localReference, ref);

    const [state, setState] = React.useState<
      "pending" | "confirmed" | "rolledback"
    >("pending");
    const [timeLeft, setTimeLeft] = React.useState(timeout);

    // Countdown timer
    React.useEffect(() => {
      if (state !== "pending") return;

      const timer = setInterval(() => {
        setTimeLeft((previous) => {
          if (previous <= 1000) {
            setState("rolledback");
            onRollback();
            return 0;
          }
          return previous - 1000;
        });
      }, 1000);

      return () => clearInterval(timer);
    }, [state, onRollback]);

    // Handle confirm
    const handleConfirm = () => {
      setState("confirmed");
      onConfirm();
    };

    // Handle rollback
    const handleRollback = () => {
      setState("rolledback");
      onRollback();
    };

    // Dual-mode data attributes
    const dataProperties = createDualModeProperties(
      {
        "data-optimistic": "update",
        "data-action": action,
        "data-state": state,
        "data-timeleft": timeLeft,
      },
      {
        "data-optimistic": "update",
        "data-action": action,
        "data-state": state,
        "data-timeleft": timeLeft,
        "data-wcag-compliant": "true",
        role: "region",
        "aria-label": `Optimistic update: ${action}`,
      },
    );

    const Tag = (as ?? "div") as "div";

    return (
      <Tag
        ref={composedReference}
        className={cn(optimisticStyles({ state }), className)}
        {...dataProperties}
        {...props}
      >
        {children}

        {state === "pending" && (
          <div className="absolute top-2 right-2 flex items-center gap-2">
            <button
              onClick={handleConfirm}
              className="px-2 py-1 text-xs bg-success text-success-foreground rounded hover:bg-success/90"
            >
              Confirm
            </button>
            <button
              onClick={handleRollback}
              className="px-2 py-1 text-xs bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
            >
              Rollback
            </button>
            <span className="text-xs text-muted-foreground">
              {Math.ceil(timeLeft / 1000)}s
            </span>
          </div>
        )}

        {state === "confirmed" && (
          <div className="absolute top-2 right-2 text-xs text-success font-medium">
            ✓ Confirmed
          </div>
        )}

        {state === "rolledback" && (
          <div className="absolute top-2 right-2 text-xs text-destructive font-medium">
            ↶ Rolled back
          </div>
        )}
      </Tag>
    );
  },
  "OptimisticUpdate",
);

// Background Sync Manager Component
export interface BackgroundSyncProperties {
  manager: SyncManager;
  className?: string;
}

const syncStyles = createAccessibilityVariants({
  beautiful: {
    base: "bg-card border border-border rounded-lg p-4 shadow-sm",
  },
  wcagAAA: {
    base: "bg-card border-2 border-border rounded-lg p-4 shadow-md",
  },
});

export const BackgroundSync = createPolymorphic<
  "div",
  BackgroundSyncProperties
>(({ as, manager, className, ...props }, ref) => {
  const localReference = React.useRef<HTMLDivElement>(null);
  const composedReference = composeReferences(localReference, ref);

  const [isExpanded, setIsExpanded] = React.useState(false);

  // Dual-mode data attributes
  const dataProperties = createDualModeProperties(
    {
      "data-sync": "background",
      "data-jobs": manager.jobs.length,
      "data-expanded": dataAttribute(isExpanded),
    },
    {
      "data-sync": "background",
      "data-jobs": manager.jobs.length,
      "data-expanded": dataAttribute(isExpanded),
      "data-wcag-compliant": "true",
      role: "region",
      "aria-label": "Background sync manager",
      "aria-expanded": isExpanded,
    },
  );

  const Tag = (as ?? "div") as "div";

  return (
    <Tag
      ref={composedReference}
      className={cn(syncStyles(), className)}
      {...dataProperties}
      {...props}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Background Sync</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-muted-foreground hover:text-foreground"
          aria-label={
            isExpanded ? "Collapse sync details" : "Expand sync details"
          }
        >
          {isExpanded ? "−" : "+"}
        </button>
      </div>

      <div className="mt-2 text-sm text-muted-foreground">
        {manager.jobs.length} job(s) pending
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-2">
          {manager.jobs.map((job) => (
            <div
              key={job.id}
              className="flex items-center justify-between p-2 bg-muted/50 rounded"
            >
              <div>
                <span className="text-sm font-medium">{job.type}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {job.status} ({job.retries} retries)
                </span>
              </div>
              <div className="flex gap-1">
                {job.status === "failed" && (
                  <button
                    onClick={() => manager.retryJob(job.id)}
                    className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
                  >
                    Retry
                  </button>
                )}
                <button
                  onClick={() => manager.removeJob(job.id)}
                  className="px-2 py-1 text-xs bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Tag>
  );
}, "BackgroundSync");

// Performance Monitor Component
export interface PerformanceMonitorProperties {
  metrics: PerformanceMetrics;
  className?: string;
}

const monitorStyles = createAccessibilityVariants({
  beautiful: {
    base: "bg-card border border-border rounded-lg p-4 shadow-sm",
  },
  wcagAAA: {
    base: "bg-card border-2 border-border rounded-lg p-4 shadow-md",
  },
});

export const PerformanceMonitor = createPolymorphic<
  "div",
  PerformanceMonitorProperties
>(({ as, metrics, className, ...props }, ref) => {
  const localReference = React.useRef<HTMLDivElement>(null);
  const composedReference = composeReferences(localReference, ref);

  // Dual-mode data attributes
  const dataProperties = createDualModeProperties(
    {
      "data-monitor": "performance",
      "data-render-time": metrics.renderTime,
      "data-memory": metrics.memoryUsage,
      "data-bundle": metrics.bundleSize,
    },
    {
      "data-monitor": "performance",
      "data-render-time": metrics.renderTime,
      "data-memory": metrics.memoryUsage,
      "data-bundle": metrics.bundleSize,
      "data-wcag-compliant": "true",
      role: "region",
      "aria-label": "Performance metrics",
    },
  );

  const Tag = (as ?? "div") as "div";

  return (
    <Tag
      ref={composedReference}
      className={cn(monitorStyles(), className)}
      {...dataProperties}
      {...props}
    >
      <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="text-sm font-medium">Render Time</div>
          <div className="text-2xl font-bold text-primary">
            {metrics.renderTime}ms
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Memory Usage</div>
          <div className="text-2xl font-bold text-secondary">
            {(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Bundle Size</div>
          <div className="text-2xl font-bold text-success">
            {(metrics.bundleSize / 1024).toFixed(1)}KB
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Cache Hit Rate</div>
          <div className="text-2xl font-bold text-warning">
            {(metrics.cacheHitRate * 100).toFixed(1)}%
          </div>
        </div>
      </div>
    </Tag>
  );
}, "PerformanceMonitor");

/**
 * USAGE EXAMPLES:
 *
 * // Virtualized List
 * <VirtualizedList
 *   items={largeDataSet}
 *   itemHeight={50}
 *   containerHeight={400}
 *   renderItem={(item, index) => <ListItem key={index} item={item} />}
 * />
 *
 * // Optimistic Update
 * <OptimisticUpdate
 *   action="Update user profile"
 *   onConfirm={() => console.log("Confirmed")}
 *   onRollback={() => console.log("Rolled back")}
 *   timeout={5000}
 * >
 *   <UserProfileForm />
 * </OptimisticUpdate>
 *
 * // Background Sync
 * <BackgroundSync manager={syncManager} />
 *
 * // Performance Monitor
 * <PerformanceMonitor metrics={performanceMetrics} />
 */
