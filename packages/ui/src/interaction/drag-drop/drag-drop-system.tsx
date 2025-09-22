import * as React from "react";
import {
  cn,
  createPolymorphic,
  type PolymorphicProps as PolymorphicProperties,
  type PolymorphicRef as PolymorphicReference,
  variants,
} from "../../utils";

// Drag & Drop System Types
export interface DragDropSystemProperties {
  /** Whether drag and drop is enabled */
  enabled?: boolean;
  /** Whether to show drag handles */
  showDragHandles?: boolean;
  /** Whether to enable multi-select */
  enableMultiSelect?: boolean;
  /** Whether to enable drag preview */
  enableDragPreview?: boolean;
  /** Whether to enable drop zones */
  enableDropZones?: boolean;
  /** Whether to enable drag sorting */
  enableSorting?: boolean;
  /** Whether to enable drag reordering */
  enableReordering?: boolean;
  /** Whether to enable drag cloning */
  enableCloning?: boolean;
  /** Whether to enable drag nesting */
  enableNesting?: boolean;
  /** Whether to enable drag validation */
  enableValidation?: boolean;
  /** Custom validation function */
  validateDrop?: (dragData: DragDropData, dropTarget: DragDropTarget) => boolean;
  /** Whether to enable drag feedback */
  enableFeedback?: boolean;
  /** Whether to enable drag animations */
  enableAnimations?: boolean;
  /** Animation duration in milliseconds */
  animationDuration?: number;
  /** Whether to enable drag constraints */
  enableConstraints?: boolean;
  /** Drag constraints */
  constraints?: DragDropConstraints;
  /** Whether to enable drag snapping */
  enableSnapping?: boolean;
  /** Snap configuration */
  snapConfig?: DragDropSnapConfig;
  /** Whether to enable drag auto-scroll */
  enableAutoScroll?: boolean;
  /** Auto-scroll configuration */
  autoScrollConfig?: DragDropAutoScrollConfig;
  /** Whether to enable drag keyboard navigation */
  enableKeyboardNavigation?: boolean;
  /** Whether to enable drag touch support */
  enableTouchSupport?: boolean;
  /** Whether to enable drag accessibility */
  enableAccessibility?: boolean;
  /** Whether to enable drag analytics */
  enableAnalytics?: boolean;
  /** Custom analytics handler */
  onAnalytics?: (event: DragDropAnalyticsEvent) => void;
  /** Whether to enable drag logging */
  enableLogging?: boolean;
  /** Custom logging handler */
  onLog?: (log: DragDropLog) => void;
  /** Whether to enable drag debugging */
  enableDebugging?: boolean;
  /** Custom debugging handler */
  onDebug?: (debug: DragDropDebug) => void;
  /** Whether to enable drag collaboration */
  enableCollaboration?: boolean;
  /** Custom collaboration handler */
  onCollaboration?: (event: DragDropCollaborationEvent) => void;
  /** Whether to enable drag notifications */
  enableNotifications?: boolean;
  /** Custom notification handler */
  onNotification?: (notification: DragDropNotification) => void;
  /** Whether to enable drag persistence */
  enablePersistence?: boolean;
  /** Storage key for persistence */
  storageKey?: string;
  /** Whether to enable drag export */
  enableExport?: boolean;
  /** Custom export handler */
  onExport?: (data: DragDropData[]) => Promise<void>;
  /** Whether to enable drag import */
  enableImport?: boolean;
  /** Custom import handler */
  onImport?: (data: string) => Promise<DragDropData[]>;
  /** Whether to enable drag sharing */
  enableSharing?: boolean;
  /** Custom sharing handler */
  onShare?: (data: DragDropData[]) => Promise<void>;
  /** Whether to enable drag undo/redo */
  enableUndoRedo?: boolean;
  /** Custom undo/redo handler */
  onUndoRedo?: (action: DragDropUndoRedoAction) => void;
}

export interface DragDropData {
  /** Unique identifier */
  id: string;
  /** Data type */
  type: string;
  /** Data payload */
  payload: Record<string, unknown>;
  /** Data metadata */
  metadata?: Record<string, unknown>;
  /** Data position */
  position?: DragDropPosition;
  /** Data size */
  size?: DragDropSize;
  /** Data constraints */
  constraints?: DragDropConstraints;
  /** Data validation */
  validation?: DragDropValidation;
  /** Data styling */
  styling?: DragDropStyling;
  /** Data accessibility */
  accessibility?: DragDropAccessibility;
  /** Data collaboration */
  collaboration?: DragDropCollaboration;
  /** Data persistence */
  persistence?: DragDropPersistence;
  /** Data export */
  export?: DragDropExport;
  /** Data import */
  import?: DragDropImport;
  /** Data sharing */
  sharing?: DragDropSharing;
  /** Data undo/redo */
  undoRedo?: DragDropUndoRedo;
}

export interface DragDropTarget {
  /** Target identifier */
  id: string;
  /** Target type */
  type: string;
  /** Target position */
  position: DragDropPosition;
  /** Target size */
  size: DragDropSize;
  /** Target constraints */
  constraints?: DragDropConstraints;
  /** Target validation */
  validation?: DragDropValidation;
  /** Target styling */
  styling?: DragDropStyling;
  /** Target accessibility */
  accessibility?: DragDropAccessibility;
  /** Target collaboration */
  collaboration?: DragDropCollaboration;
  /** Target persistence */
  persistence?: DragDropPersistence;
  /** Target export */
  export?: DragDropExport;
  /** Target import */
  import?: DragDropImport;
  /** Target sharing */
  sharing?: DragDropSharing;
  /** Target undo/redo */
  undoRedo?: DragDropUndoRedo;
}

export interface DragDropPosition {
  /** X coordinate */
  x: number;
  /** Y coordinate */
  y: number;
  /** Z index */
  z?: number;
}

export interface DragDropSize {
  /** Width */
  width: number;
  /** Height */
  height: number;
  /** Depth */
  depth?: number;
}

export interface DragDropConstraints {
  /** Minimum position */
  minPosition?: DragDropPosition;
  /** Maximum position */
  maxPosition?: DragDropPosition;
  /** Minimum size */
  minSize?: DragDropSize;
  /** Maximum size */
  maxSize?: DragDropSize;
  /** Allowed drop zones */
  allowedDropZones?: string[];
  /** Forbidden drop zones */
  forbiddenDropZones?: string[];
  /** Allowed data types */
  allowedDataTypes?: string[];
  /** Forbidden data types */
  forbiddenDataTypes?: string[];
}

export interface DragDropValidation {
  /** Validation function */
  validate: (data: DragDropData, target: DragDropTarget) => boolean;
  /** Validation error message */
  errorMessage?: string;
  /** Validation warnings */
  warnings?: string[];
  /** Validation suggestions */
  suggestions?: string[];
}

export interface DragDropStyling {
  /** Drag preview styles */
  dragPreview?: React.CSSProperties;
  /** Drop zone styles */
  dropZone?: React.CSSProperties;
  /** Drag handle styles */
  dragHandle?: React.CSSProperties;
  /** Drag ghost styles */
  dragGhost?: React.CSSProperties;
  /** Drop indicator styles */
  dropIndicator?: React.CSSProperties;
}

export interface DragDropAccessibility {
  /** ARIA labels */
  ariaLabels?: Record<string, string>;
  /** ARIA descriptions */
  ariaDescriptions?: Record<string, string>;
  /** Keyboard shortcuts */
  keyboardShortcuts?: Record<string, string>;
  /** Screen reader support */
  screenReaderSupport?: boolean;
  /** High contrast support */
  highContrastSupport?: boolean;
}

export interface DragDropCollaboration {
  /** User ID */
  userId: string;
  /** Session ID */
  sessionId: string;
  /** Collaboration mode */
  mode: "view" | "edit" | "comment";
  /** Collaboration permissions */
  permissions?: string[];
  /** Collaboration metadata */
  metadata?: Record<string, unknown>;
}

export interface DragDropPersistence {
  /** Persistence key */
  key: string;
  /** Persistence mode */
  mode: "local" | "session" | "remote";
  /** Persistence data */
  data: Record<string, unknown>;
  /** Persistence metadata */
  metadata?: Record<string, unknown>;
}

export interface DragDropExport {
  /** Export format */
  format: "json" | "csv" | "xml" | "yaml";
  /** Export data */
  data: Record<string, unknown>;
  /** Export metadata */
  metadata?: Record<string, unknown>;
}

export interface DragDropImport {
  /** Import format */
  format: "json" | "csv" | "xml" | "yaml";
  /** Import data */
  data: Record<string, unknown>;
  /** Import metadata */
  metadata?: Record<string, unknown>;
}

export interface DragDropSharing {
  /** Sharing mode */
  mode: "public" | "private" | "restricted";
  /** Sharing permissions */
  permissions?: string[];
  /** Sharing metadata */
  metadata?: Record<string, unknown>;
}

export interface DragDropUndoRedo {
  /** Action type */
  action: "drag" | "drop" | "sort" | "reorder" | "clone" | "nest";
  /** Action data */
  data: Record<string, unknown>;
  /** Action metadata */
  metadata?: Record<string, unknown>;
}

export interface DragDropSnapConfig {
  /** Snap grid size */
  gridSize?: number;
  /** Snap tolerance */
  tolerance?: number;
  /** Snap targets */
  targets?: DragDropPosition[];
  /** Snap mode */
  mode?: "grid" | "targets" | "both";
}

export interface DragDropAutoScrollConfig {
  /** Auto-scroll speed */
  speed?: number;
  /** Auto-scroll threshold */
  threshold?: number;
  /** Auto-scroll direction */
  direction?: "horizontal" | "vertical" | "both";
  /** Auto-scroll boundaries */
  boundaries?: DragDropPosition[];
}

export interface DragDropAnalyticsEvent {
  /** Event type */
  type: "dragStart" | "dragMove" | "dragEnd" | "drop" | "sort" | "reorder" | "clone" | "nest";
  /** Data ID */
  dataId?: string;
  /** Target ID */
  targetId?: string;
  /** Timestamp */
  timestamp: number;
  /** Additional data */
  data?: Record<string, unknown>;
}

export interface DragDropCollaborationEvent {
  /** Event type */
  type: "join" | "leave" | "update" | "conflict" | "resolve";
  /** User ID */
  userId: string;
  /** Session ID */
  sessionId: string;
  /** Data ID */
  dataId?: string;
  /** Target ID */
  targetId?: string;
  /** Timestamp */
  timestamp: number;
  /** Additional data */
  data?: Record<string, unknown>;
}

export interface DragDropNotification {
  /** Notification type */
  type: "success" | "error" | "warning" | "info";
  /** Notification message */
  message: string;
  /** Notification timestamp */
  timestamp: number;
  /** Additional data */
  data?: Record<string, unknown>;
}

export interface DragDropLog {
  /** Log level */
  level: "debug" | "info" | "warn" | "error";
  /** Log message */
  message: string;
  /** Log timestamp */
  timestamp: number;
  /** Additional data */
  data?: Record<string, unknown>;
}

export interface DragDropDebug {
  /** Debug type */
  type: "drag" | "drop" | "sort" | "reorder" | "clone" | "nest";
  /** Debug message */
  message: string;
  /** Debug timestamp */
  timestamp: number;
  /** Additional data */
  data?: Record<string, unknown>;
}

export interface DragDropUndoRedoAction {
  /** Action type */
  type: "undo" | "redo";
  /** Action data */
  data: DragDropData;
  /** Action timestamp */
  timestamp: number;
  /** Additional data */
  metadata?: Record<string, unknown>;
}

// Drag & Drop System Styles
const dragDropSystemStyles = variants({
  base: "drag-drop-system",
  variants: {
    variant: {
      default: "drag-drop-default",
      minimal: "drag-drop-minimal",
      compact: "drag-drop-compact",
    },
    size: {
      sm: "drag-drop-sm",
      md: "drag-drop-md",
      lg: "drag-drop-lg",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
});

const dragDropContainerStyles = variants({
  base: "relative min-h-32 border-2 border-dashed border-border rounded-lg transition-colors",
  variants: {
    variant: {
      default: "border-border",
      minimal: "border-muted",
      compact: "border-muted/50",
    },
    state: {
      default: "bg-background",
      dragOver: "bg-primary/10 border-primary",
      dragActive: "bg-primary/20 border-primary",
      dropReady: "bg-success/10 border-success",
      dropInvalid: "bg-error/10 border-error",
    },
  },
  defaultVariants: {
    variant: "default",
    state: "default",
  },
});

const dragDropItemStyles = variants({
  base: "relative cursor-move select-none transition-all",
  variants: {
    variant: {
      default: "hover:shadow-md",
      minimal: "hover:shadow-sm",
      compact: "hover:shadow-xs",
    },
    state: {
      default: "opacity-100",
      dragging: "opacity-50 scale-105",
      dragOver: "opacity-75",
      disabled: "opacity-50 cursor-not-allowed",
    },
  },
  defaultVariants: {
    variant: "default",
    state: "default",
  },
});

const dragDropHandleStyles = variants({
  base: "absolute top-1 left-1 w-4 h-4 bg-muted rounded cursor-move hover:bg-muted-foreground transition-colors",
  variants: {
    variant: {
      default: "bg-muted",
      minimal: "bg-muted/50",
      compact: "bg-muted/30",
    },
    state: {
      default: "opacity-60",
      hover: "opacity-100",
      active: "opacity-100 bg-primary",
    },
  },
  defaultVariants: {
    variant: "default",
    state: "default",
  },
});

const dragDropPreviewStyles = variants({
  base: "fixed pointer-events-none z-50 opacity-80 transform rotate-3",
  variants: {
    variant: {
      default: "shadow-lg",
      minimal: "shadow-md",
      compact: "shadow-sm",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const dragDropIndicatorStyles = variants({
  base: "absolute border-2 border-dashed border-primary bg-primary/10 rounded transition-all",
  variants: {
    variant: {
      default: "border-primary",
      minimal: "border-primary/50",
      compact: "border-primary/30",
    },
    position: {
      before: "top-0 left-0 right-0 h-1",
      after: "bottom-0 left-0 right-0 h-1",
      inside: "inset-0",
    },
  },
  defaultVariants: {
    variant: "default",
    position: "before",
  },
});

// Drag & Drop System Component
export const DragDropSystem = createPolymorphic<"div", DragDropSystemProperties>(
  ({
    as,
    enabled = true,
    showDragHandles = true,
    enableMultiSelect = false,
    enableDragPreview = true,
    enableDropZones = true,
    enableSorting = true,
    enableReordering = true,
    enableCloning = false,
    enableNesting = false,
    enableValidation = true,
    validateDrop,
    enableFeedback = true,
    enableAnimations = true,
    animationDuration = 200,
    enableConstraints = true,
    constraints,
    enableSnapping = false,
    snapConfig,
    enableAutoScroll = true,
    autoScrollConfig,
    enableKeyboardNavigation = true,
    enableTouchSupport = true,
    enableAccessibility = true,
    enableAnalytics = false,
    onAnalytics,
    enableLogging = false,
    onLog,
    enableDebugging = false,
    onDebug,
    enableCollaboration = false,
    onCollaboration,
    enableNotifications = true,
    onNotification,
    enablePersistence = false,
    storageKey = "aibos-drag-drop-state",
    enableExport = false,
    onExport,
    enableImport = false,
    onImport,
    enableSharing = false,
    onShare,
    enableUndoRedo = false,
    onUndoRedo,
    className,
    ...props
  }: PolymorphicProperties<"div", DragDropSystemProperties>, ref: PolymorphicReference<"div">) => {
    const [dragData, setDragData] = React.useState<DragDropData | null>(null);
    const [dragPosition, setDragPosition] = React.useState<DragDropPosition | null>(null);
    const [dropTarget, setDropTarget] = React.useState<DragDropTarget | null>(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const [isDragOver, setIsDragOver] = React.useState(false);
    const [dragPreview, setDragPreview] = React.useState<React.ReactNode>(null);
    const [dropIndicator, setDropIndicator] = React.useState<DragDropPosition | null>(null);
    const [selectedItems, setSelectedItems] = React.useState<string[]>([]);
    const [dragHistory, setDragHistory] = React.useState<DragDropData[]>([]);

    // Drag start handler
    const handleDragStart = React.useCallback((event: React.DragEvent, data: DragDropData) => {
      if (!enabled) return;

      event.dataTransfer.setData("application/json", JSON.stringify(data));
      event.dataTransfer.effectAllowed = "move";

      setDragData(data);
      setIsDragging(true);

      // Analytics
      if (enableAnalytics) {
        onAnalytics?.({
          type: "dragStart",
          dataId: data.id,
          timestamp: Date.now(),
        });
      }

      // Logging
      if (enableLogging) {
        onLog?.({
          level: "info",
          message: `Drag started: ${data.type}`,
          timestamp: Date.now(),
          data: { dataId: data.id, dataType: data.type },
        });
      }

      // Debugging
      if (enableDebugging) {
        onDebug?.({
          type: "drag",
          message: "Drag operation started",
          timestamp: Date.now(),
          data: { data, position: dragPosition },
        });
      }
    }, [enabled, enableAnalytics, onAnalytics, enableLogging, onLog, enableDebugging, onDebug, dragPosition]);

    // Drag over handler
    const handleDragOver = React.useCallback((event: React.DragEvent, target: DragDropTarget) => {
      if (!enabled || !isDragging) return;

      event.preventDefault();
      event.dataTransfer.dropEffect = "move";

      setDropTarget(target);
      setIsDragOver(true);

      // Update drop indicator position
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      setDropIndicator({ x, y });

      // Auto-scroll
      if (enableAutoScroll) {
        const scrollThreshold = autoScrollConfig?.threshold || 50;
        const scrollSpeed = autoScrollConfig?.speed || 5;
        
        if (y < scrollThreshold) {
          window.scrollBy(0, -scrollSpeed);
        } else if (y > rect.height - scrollThreshold) {
          window.scrollBy(0, scrollSpeed);
        }
      }
    }, [enabled, isDragging, enableAutoScroll, autoScrollConfig]);

    // Drag leave handler
    const handleDragLeave = React.useCallback(() => {
      setIsDragOver(false);
      setDropIndicator(null);
    }, []);

    // Drop handler
    const handleDrop = React.useCallback(async (event: React.DragEvent, target: DragDropTarget) => {
      if (!enabled || !isDragging || !dragData) return;

      event.preventDefault();

      try {
        const data = JSON.parse(event.dataTransfer.getData("application/json")) as DragDropData;

        // Validation
        if (enableValidation && validateDrop && !validateDrop(data, target)) {
          if (enableNotifications) {
            onNotification?.({
              type: "error",
              message: "Invalid drop target",
              timestamp: Date.now(),
            });
          }
          return;
        }

        // Update position
        const rect = event.currentTarget.getBoundingClientRect();
        const newPosition: DragDropPosition = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        };

        // Update data with new position
        const updatedData: DragDropData = {
          ...data,
          position: newPosition,
        };

        // Add to history for undo/redo
        if (enableUndoRedo) {
          setDragHistory(prev => [...prev, updatedData]);
          onUndoRedo?.({
            type: "undo",
            data: updatedData,
            timestamp: Date.now(),
          });
        }

        // Persistence
        if (enablePersistence) {
          localStorage.setItem(storageKey, JSON.stringify(updatedData));
        }

        // Export
        if (enableExport) {
          await onExport?.([updatedData]);
        }

        // Analytics
        if (enableAnalytics) {
          onAnalytics?.({
            type: "drop",
            dataId: data.id,
            targetId: target.id,
            timestamp: Date.now(),
          });
        }

        // Notifications
        if (enableNotifications) {
          onNotification?.({
            type: "success",
            message: `Dropped ${data.type} successfully`,
            timestamp: Date.now(),
          });
        }

        // Logging
        if (enableLogging) {
          onLog?.({
            level: "info",
            message: `Drop completed: ${data.type}`,
            timestamp: Date.now(),
            data: { dataId: data.id, targetId: target.id },
          });
        }

        // Debugging
        if (enableDebugging) {
          onDebug?.({
            type: "drop",
            message: "Drop operation completed",
            timestamp: Date.now(),
            data: { data: updatedData, target, position: newPosition },
          });
        }

      } catch (error) {
        if (enableNotifications) {
          onNotification?.({
            type: "error",
            message: `Drop failed: ${error}`,
            timestamp: Date.now(),
          });
        }
      } finally {
        // Cleanup
        setDragData(null);
        setIsDragging(false);
        setIsDragOver(false);
        setDropTarget(null);
        setDropIndicator(null);
      }
    }, [enabled, isDragging, dragData, enableValidation, validateDrop, enableNotifications, onNotification, enableUndoRedo, onUndoRedo, enablePersistence, storageKey, enableExport, onExport, enableAnalytics, onAnalytics, enableLogging, onLog, enableDebugging, onDebug]);

    // Drag end handler
    const handleDragEnd = React.useCallback(() => {
      setDragData(null);
      setIsDragging(false);
      setIsDragOver(false);
      setDropTarget(null);
      setDropIndicator(null);

      // Analytics
      if (enableAnalytics) {
        onAnalytics?.({
          type: "dragEnd",
          timestamp: Date.now(),
        });
      }
    }, [enableAnalytics, onAnalytics]);

    // Keyboard navigation
    const handleKeyDown = React.useCallback((event: KeyboardEvent) => {
      if (!enableKeyboardNavigation || !isDragging) return;

      const step = 10;
      let newPosition = dragPosition;

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          newPosition = { ...dragPosition!, x: Math.max(0, dragPosition!.x - step) };
          break;
        case "ArrowRight":
          event.preventDefault();
          newPosition = { ...dragPosition!, x: dragPosition!.x + step };
          break;
        case "ArrowUp":
          event.preventDefault();
          newPosition = { ...dragPosition!, y: Math.max(0, dragPosition!.y - step) };
          break;
        case "ArrowDown":
          event.preventDefault();
          newPosition = { ...dragPosition!, y: dragPosition!.y + step };
          break;
        case "Escape":
          event.preventDefault();
          handleDragEnd();
          break;
      }

      if (newPosition && newPosition !== dragPosition) {
        setDragPosition(newPosition);
      }
    }, [enableKeyboardNavigation, isDragging, dragPosition, handleDragEnd]);

    // Add keyboard event listeners
    React.useEffect(() => {
      if (enableKeyboardNavigation) {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
      }
    }, [enableKeyboardNavigation, handleKeyDown]);

    // Render drag handle
    const renderDragHandle = React.useCallback((data: DragDropData) => {
      if (!showDragHandles) return null;

      return (
        <div
          className={cn(dragDropHandleStyles({ variant: "default", state: "default" }))}
          draggable={enabled}
          onDragStart={(e) => handleDragStart(e, data)}
          title="Drag to move"
        >
          ⋮⋮
        </div>
      );
    }, [showDragHandles, enabled, handleDragStart]);

    // Render drag item
    const renderDragItem = React.useCallback((data: DragDropData) => {
      const isSelected = selectedItems.includes(data.id);
      const isBeingDragged = dragData?.id === data.id;

      return (
        <div
          key={data.id}
          className={cn(
            dragDropItemStyles({
              variant: "default",
              state: isBeingDragged ? "dragging" : "default",
            }),
            isSelected && "ring-2 ring-primary"
          )}
          style={{
            position: "absolute",
            left: data.position?.x || 0,
            top: data.position?.y || 0,
            width: data.size?.width || 100,
            height: data.size?.height || 100,
            transition: enableAnimations ? `all ${animationDuration}ms ease` : "none",
          }}
          draggable={enabled}
          onDragStart={(e) => handleDragStart(e, data)}
          onDragEnd={handleDragEnd}
          onClick={() => {
            if (enableMultiSelect) {
              setSelectedItems(prev =>
                prev.includes(data.id)
                  ? prev.filter(id => id !== data.id)
                  : [...prev, data.id]
              );
            }
          }}
        >
          {renderDragHandle(data)}
          <div className="p-2 bg-background border border-border rounded">
            <div className="text-sm font-medium">{data.type}</div>
            <div className="text-xs text-muted-foreground">{data.id}</div>
          </div>
        </div>
      );
    }, [selectedItems, dragData, enabled, handleDragStart, handleDragEnd, enableMultiSelect, enableAnimations, animationDuration, renderDragHandle]);

    // Render drop zone
    const renderDropZone = React.useCallback((target: DragDropTarget) => {
      return (
        <div
          className={cn(
            dragDropContainerStyles({
              variant: "default",
              state: isDragOver ? "dragOver" : "default",
            })
          )}
          onDragOver={(e) => handleDragOver(e, target)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, target)}
        >
          {isDragOver && dropIndicator && (
            <div
              className={cn(dragDropIndicatorStyles({ variant: "default", position: "before" }))}
              style={{
                left: dropIndicator.x,
                top: dropIndicator.y,
              }}
            />
          )}
          <div className="p-4 text-center text-muted-foreground">
            Drop zone: {target.type}
          </div>
        </div>
      );
    }, [isDragOver, dropIndicator, handleDragOver, handleDragLeave, handleDrop]);

    // Sample data for demonstration
    const sampleData: DragDropData[] = React.useMemo(() => [
      {
        id: "item-1",
        type: "card",
        payload: { title: "Card 1", content: "Sample content" },
        position: { x: 10, y: 10 },
        size: { width: 120, height: 80 },
      },
      {
        id: "item-2",
        type: "card",
        payload: { title: "Card 2", content: "Sample content" },
        position: { x: 150, y: 10 },
        size: { width: 120, height: 80 },
      },
    ], []);

    const sampleTarget: DragDropTarget = React.useMemo(() => ({
      id: "drop-zone-1",
      type: "container",
      position: { x: 0, y: 0 },
      size: { width: 400, height: 300 },
    }), []);

    return (
      <div
        ref={ref}
        className={cn(dragDropSystemStyles({ variant: "default", size: "md" }), className)}
        {...props}
      >
        {/* Drop Zone */}
        {enableDropZones && renderDropZone(sampleTarget)}

        {/* Drag Items */}
        <div className="relative">
          {sampleData.map(renderDragItem)}
        </div>

        {/* Drag Preview */}
        {enableDragPreview && isDragging && dragData && (
          <div
            className={cn(dragDropPreviewStyles({ variant: "default" }))}
            style={{
              left: dragPosition?.x || 0,
              top: dragPosition?.y || 0,
              width: dragData.size?.width || 100,
              height: dragData.size?.height || 100,
            }}
          >
            <div className="p-2 bg-background border border-border rounded shadow-lg">
              <div className="text-sm font-medium">{dragData.type}</div>
              <div className="text-xs text-muted-foreground">{dragData.id}</div>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="mt-4 p-2 bg-muted/30 rounded text-xs">
          <div>Items: {sampleData.length}</div>
          <div>Selected: {selectedItems.length}</div>
          <div>Dragging: {isDragging ? "Yes" : "No"}</div>
          <div>Drop Zone: {isDragOver ? "Active" : "Inactive"}</div>
        </div>
      </div>
    );
  },
  "DragDropSystem"
);

// Export styles for external use
export const dragDropSystemVariants = {
  dragDropSystemStyles,
  dragDropContainerStyles,
  dragDropItemStyles,
  dragDropHandleStyles,
  dragDropPreviewStyles,
  dragDropIndicatorStyles,
};
