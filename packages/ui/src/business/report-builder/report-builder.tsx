import * as React from "react";
import {
  cn,
  createPolymorphic,
  type PolymorphicProps as PolymorphicProperties,
  type PolymorphicRef as PolymorphicReference,
  variants,
} from "../../utils";

// Report Builder Types
export interface ReportBuilderProperties {
  /** Whether the report builder is enabled */
  enabled?: boolean;
  /** Whether to show the toolbar */
  showToolbar?: boolean;
  /** Whether to show the sidebar */
  showSidebar?: boolean;
  /** Whether to show the canvas */
  showCanvas?: boolean;
  /** Whether to enable drag and drop */
  enableDragDrop?: boolean;
  /** Whether to enable real-time preview */
  enablePreview?: boolean;
  /** Whether to enable auto-save */
  enableAutoSave?: boolean;
  /** Auto-save interval in milliseconds */
  autoSaveInterval?: number;
  /** Whether to enable templates */
  enableTemplates?: boolean;
  /** Whether to enable data sources */
  enableDataSources?: boolean;
  /** Whether to enable filters */
  enableFilters?: boolean;
  /** Whether to enable sorting */
  enableSorting?: boolean;
  /** Whether to enable grouping */
  enableGrouping?: boolean;
  /** Whether to enable calculations */
  enableCalculations?: boolean;
  /** Whether to enable charts */
  enableCharts?: boolean;
  /** Whether to enable tables */
  enableTables?: boolean;
  /** Whether to enable text elements */
  enableTextElements?: boolean;
  /** Whether to enable images */
  enableImages?: boolean;
  /** Whether to enable shapes */
  enableShapes?: boolean;
  /** Whether to enable collaboration */
  enableCollaboration?: boolean;
  /** Whether to enable version control */
  enableVersionControl?: boolean;
  /** Whether to enable export */
  enableExport?: boolean;
  /** Export formats */
  exportFormats?: ReportExportFormat[];
  /** Whether to enable sharing */
  enableSharing?: boolean;
  /** Whether to enable scheduling */
  enableScheduling?: boolean;
  /** Whether to enable notifications */
  enableNotifications?: boolean;
  /** Whether to enable analytics */
  enableAnalytics?: boolean;
  /** Custom analytics handler */
  onAnalytics?: (event: ReportAnalyticsEvent) => void;
  /** Whether to enable logging */
  enableLogging?: boolean;
  /** Custom logging handler */
  onLog?: (log: ReportLog) => void;
  /** Whether to enable debugging */
  enableDebugging?: boolean;
  /** Custom debugging handler */
  onDebug?: (debug: ReportDebug) => void;
  /** Whether to enable persistence */
  enablePersistence?: boolean;
  /** Storage key for persistence */
  storageKey?: string;
  /** Whether to enable undo/redo */
  enableUndoRedo?: boolean;
  /** Custom undo/redo handler */
  onUndoRedo?: (action: ReportUndoRedoAction) => void;
  /** Whether to enable validation */
  enableValidation?: boolean;
  /** Custom validation handler */
  onValidation?: (validation: ReportValidation) => void;
  /** Whether to enable accessibility */
  enableAccessibility?: boolean;
  /** Whether to enable keyboard shortcuts */
  enableKeyboardShortcuts?: boolean;
  /** Custom keyboard shortcuts */
  shortcuts?: ReportKeyboardShortcuts;
  /** Whether to enable touch support */
  enableTouchSupport?: boolean;
  /** Whether to enable mobile optimization */
  enableMobileOptimization?: boolean;
  /** Whether to enable responsive design */
  enableResponsiveDesign?: boolean;
  /** Whether to enable dark mode */
  enableDarkMode?: boolean;
  /** Whether to enable high contrast */
  enableHighContrast?: boolean;
  /** Whether to enable animations */
  enableAnimations?: boolean;
  /** Animation duration in milliseconds */
  animationDuration?: number;
  /** Whether to enable performance monitoring */
  enablePerformanceMonitoring?: boolean;
  /** Performance monitoring handler */
  onPerformanceMonitoring?: (metrics: ReportPerformanceMetrics) => void;
}

export interface ReportElement {
  /** Unique identifier */
  id: string;
  /** Element type */
  type: ReportElementType;
  /** Element position */
  position: ReportPosition;
  /** Element size */
  size: ReportSize;
  /** Element data */
  data: Record<string, unknown>;
  /** Element styling */
  styling?: ReportStyling;
  /** Element properties */
  properties?: Record<string, unknown>;
  /** Element metadata */
  metadata?: Record<string, unknown>;
  /** Element validation */
  validation?: ReportValidation;
  /** Element accessibility */
  accessibility?: ReportAccessibility;
  /** Element collaboration */
  collaboration?: ReportCollaboration;
  /** Element persistence */
  persistence?: ReportPersistence;
  /** Element export */
  export?: ReportExport;
  /** Element sharing */
  sharing?: ReportSharing;
  /** Element scheduling */
  scheduling?: ReportScheduling;
  /** Element notifications */
  notifications?: ReportNotifications;
  /** Element analytics */
  analytics?: ReportAnalytics;
  /** Element logging */
  logging?: ReportLogging;
  /** Element debugging */
  debugging?: ReportDebugging;
  /** Element undo/redo */
  undoRedo?: ReportUndoRedo;
}

export type ReportElementType = 
  | "text" 
  | "image" 
  | "chart" 
  | "table" 
  | "shape" 
  | "filter" 
  | "calculation" 
  | "group" 
  | "section" 
  | "header" 
  | "footer" 
  | "page-break" 
  | "watermark";

export interface ReportPosition {
  /** X coordinate */
  x: number;
  /** Y coordinate */
  y: number;
  /** Z index */
  z?: number;
}

export interface ReportSize {
  /** Width */
  width: number;
  /** Height */
  height: number;
}

export interface ReportStyling {
  /** Font family */
  fontFamily?: string;
  /** Font size */
  fontSize?: number;
  /** Font weight */
  fontWeight?: string;
  /** Font color */
  fontColor?: string;
  /** Background color */
  backgroundColor?: string;
  /** Border color */
  borderColor?: string;
  /** Border width */
  borderWidth?: number;
  /** Border style */
  borderStyle?: string;
  /** Border radius */
  borderRadius?: number;
  /** Padding */
  padding?: number;
  /** Margin */
  margin?: number;
  /** Text alignment */
  textAlign?: "left" | "center" | "right" | "justify";
  /** Vertical alignment */
  verticalAlign?: "top" | "middle" | "bottom";
  /** Opacity */
  opacity?: number;
  /** Shadow */
  shadow?: string;
  /** Transform */
  transform?: string;
  /** Transition */
  transition?: string;
  /** Animation */
  animation?: string;
}

export interface ReportValidation {
  /** Validation rules */
  rules: ReportValidationRule[];
  /** Validation errors */
  errors: ReportValidationError[];
  /** Validation warnings */
  warnings: ReportValidationWarning[];
  /** Validation suggestions */
  suggestions: ReportValidationSuggestion[];
}

export interface ReportValidationRule {
  /** Rule identifier */
  id: string;
  /** Rule name */
  name: string;
  /** Rule description */
  description: string;
  /** Rule type */
  type: "required" | "format" | "range" | "custom";
  /** Rule expression */
  expression: string;
  /** Rule severity */
  severity: "error" | "warning" | "info";
  /** Rule enabled */
  enabled: boolean;
}

export interface ReportValidationError {
  /** Error identifier */
  id: string;
  /** Error message */
  message: string;
  /** Error element ID */
  elementId: string;
  /** Error timestamp */
  timestamp: number;
  /** Error data */
  data?: Record<string, unknown>;
}

export interface ReportValidationWarning {
  /** Warning identifier */
  id: string;
  /** Warning message */
  message: string;
  /** Warning element ID */
  elementId: string;
  /** Warning timestamp */
  timestamp: number;
  /** Warning data */
  data?: Record<string, unknown>;
}

export interface ReportValidationSuggestion {
  /** Suggestion identifier */
  id: string;
  /** Suggestion message */
  message: string;
  /** Suggestion element ID */
  elementId: string;
  /** Suggestion timestamp */
  timestamp: number;
  /** Suggestion data */
  data?: Record<string, unknown>;
}

export interface ReportAccessibility {
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
  /** Focus management */
  focusManagement?: boolean;
  /** Tab order */
  tabOrder?: string[];
}

export interface ReportCollaboration {
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

export interface ReportPersistence {
  /** Persistence key */
  key: string;
  /** Persistence mode */
  mode: "local" | "session" | "remote";
  /** Persistence data */
  data: Record<string, unknown>;
  /** Persistence metadata */
  metadata?: Record<string, unknown>;
}

export interface ReportExport {
  /** Export format */
  format: ReportExportFormat;
  /** Export data */
  data: Record<string, unknown>;
  /** Export metadata */
  metadata?: Record<string, unknown>;
}

export type ReportExportFormat = 
  | "pdf" 
  | "excel" 
  | "csv" 
  | "json" 
  | "xml" 
  | "html" 
  | "png" 
  | "jpg" 
  | "svg";

export interface ReportSharing {
  /** Sharing mode */
  mode: "public" | "private" | "restricted";
  /** Sharing permissions */
  permissions?: string[];
  /** Sharing metadata */
  metadata?: Record<string, unknown>;
}

export interface ReportScheduling {
  /** Schedule enabled */
  enabled: boolean;
  /** Schedule frequency */
  frequency: "daily" | "weekly" | "monthly" | "yearly" | "custom";
  /** Schedule time */
  time: string;
  /** Schedule timezone */
  timezone: string;
  /** Schedule recipients */
  recipients: string[];
  /** Schedule metadata */
  metadata?: Record<string, unknown>;
}

export interface ReportNotifications {
  /** Notification enabled */
  enabled: boolean;
  /** Notification types */
  types: ReportNotificationType[];
  /** Notification recipients */
  recipients: string[];
  /** Notification metadata */
  metadata?: Record<string, unknown>;
}

export type ReportNotificationType = 
  | "email" 
  | "sms" 
  | "push" 
  | "webhook" 
  | "slack" 
  | "teams";

export interface ReportAnalytics {
  /** Analytics enabled */
  enabled: boolean;
  /** Analytics events */
  events: ReportAnalyticsEvent[];
  /** Analytics metadata */
  metadata?: Record<string, unknown>;
}

export interface ReportAnalyticsEvent {
  /** Event type */
  type: "view" | "edit" | "export" | "share" | "schedule" | "collaborate";
  /** Event element ID */
  elementId?: string;
  /** Event timestamp */
  timestamp: number;
  /** Event data */
  data?: Record<string, unknown>;
}

export interface ReportLogging {
  /** Logging enabled */
  enabled: boolean;
  /** Logging level */
  level: "debug" | "info" | "warn" | "error";
  /** Logging events */
  events: ReportLog[];
  /** Logging metadata */
  metadata?: Record<string, unknown>;
}

export interface ReportLog {
  /** Log level */
  level: "debug" | "info" | "warn" | "error";
  /** Log message */
  message: string;
  /** Log timestamp */
  timestamp: number;
  /** Log data */
  data?: Record<string, unknown>;
}

export interface ReportDebugging {
  /** Debugging enabled */
  enabled: boolean;
  /** Debugging level */
  level: "basic" | "detailed" | "verbose";
  /** Debugging events */
  events: ReportDebug[];
  /** Debugging metadata */
  metadata?: Record<string, unknown>;
}

export interface ReportDebug {
  /** Debug type */
  type: "element" | "data" | "styling" | "validation" | "performance";
  /** Debug message */
  message: string;
  /** Debug timestamp */
  timestamp: number;
  /** Debug data */
  data?: Record<string, unknown>;
}

export interface ReportUndoRedo {
  /** Undo/redo enabled */
  enabled: boolean;
  /** Undo/redo actions */
  actions: ReportUndoRedoAction[];
  /** Undo/redo metadata */
  metadata?: Record<string, unknown>;
}

export interface ReportUndoRedoAction {
  /** Action type */
  type: "undo" | "redo";
  /** Action element */
  element: ReportElement;
  /** Action timestamp */
  timestamp: number;
  /** Action metadata */
  metadata?: Record<string, unknown>;
}

export interface ReportKeyboardShortcuts {
  /** Shortcut for new report */
  newReport?: string;
  /** Shortcut for save report */
  saveReport?: string;
  /** Shortcut for open report */
  openReport?: string;
  /** Shortcut for export report */
  exportReport?: string;
  /** Shortcut for print report */
  printReport?: string;
  /** Shortcut for undo */
  undo?: string;
  /** Shortcut for redo */
  redo?: string;
  /** Shortcut for copy */
  copy?: string;
  /** Shortcut for paste */
  paste?: string;
  /** Shortcut for delete */
  delete?: string;
  /** Shortcut for select all */
  selectAll?: string;
  /** Shortcut for zoom in */
  zoomIn?: string;
  /** Shortcut for zoom out */
  zoomOut?: string;
  /** Shortcut for fit to page */
  fitToPage?: string;
}

export interface ReportPerformanceMetrics {
  /** Render time */
  renderTime: number;
  /** Memory usage */
  memoryUsage: number;
  /** CPU usage */
  cpuUsage: number;
  /** Network usage */
  networkUsage: number;
  /** Cache hit rate */
  cacheHitRate: number;
  /** Error rate */
  errorRate: number;
  /** User satisfaction */
  userSatisfaction: number;
}

// Report Builder Styles
const reportBuilderStyles = variants({
  base: "report-builder",
  variants: {
    variant: {
      default: "report-builder-default",
      minimal: "report-builder-minimal",
      compact: "report-builder-compact",
    },
    size: {
      sm: "report-builder-sm",
      md: "report-builder-md",
      lg: "report-builder-lg",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
});

const reportBuilderToolbarStyles = variants({
  base: "flex items-center gap-2 p-2 bg-muted/50 border-b border-border",
  variants: {
    variant: {
      default: "bg-muted/50",
      minimal: "bg-transparent",
      compact: "bg-muted/30",
    },
    size: {
      sm: "p-1 gap-1",
      md: "p-2 gap-2",
      lg: "p-3 gap-3",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
});

const reportBuilderSidebarStyles = variants({
  base: "w-64 bg-muted/30 border-r border-border overflow-y-auto",
  variants: {
    variant: {
      default: "bg-muted/30",
      minimal: "bg-transparent",
      compact: "bg-muted/20",
    },
    size: {
      sm: "w-48",
      md: "w-64",
      lg: "w-80",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
});

const reportBuilderCanvasStyles = variants({
  base: "flex-1 bg-background relative overflow-auto",
  variants: {
    variant: {
      default: "bg-background",
      minimal: "bg-muted/10",
      compact: "bg-muted/5",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const reportBuilderElementStyles = variants({
  base: "absolute border border-border bg-background cursor-move select-none",
  variants: {
    variant: {
      default: "border-border",
      minimal: "border-muted",
      compact: "border-muted/50",
    },
    state: {
      default: "opacity-100",
      selected: "ring-2 ring-primary opacity-100",
      dragging: "opacity-50 scale-105",
      disabled: "opacity-50 cursor-not-allowed",
    },
  },
  defaultVariants: {
    variant: "default",
    state: "default",
  },
});

const reportBuilderButtonStyles = variants({
  base: "px-3 py-1 text-sm rounded-md transition-colors",
  variants: {
    variant: {
      default: "hover:bg-muted",
      minimal: "hover:bg-muted/50",
      compact: "hover:bg-muted/30",
    },
    state: {
      default: "text-foreground",
      active: "bg-primary text-primary-foreground",
      disabled: "text-muted-foreground cursor-not-allowed opacity-50",
    },
  },
  defaultVariants: {
    variant: "default",
    state: "default",
  },
});

// Report Builder Component
export const ReportBuilder = createPolymorphic<"div", ReportBuilderProperties>(
  ({
    as,
    enabled = true,
    showToolbar = true,
    showSidebar = true,
    showCanvas = true,
    enableDragDrop = true,
    enablePreview = true,
    enableAutoSave = true,
    autoSaveInterval = 30000,
    enableTemplates = true,
    enableDataSources = true,
    enableFilters = true,
    enableSorting = true,
    enableGrouping = true,
    enableCalculations = true,
    enableCharts = true,
    enableTables = true,
    enableTextElements = true,
    enableImages = true,
    enableShapes = true,
    enableCollaboration = false,
    enableVersionControl = false,
    enableExport = true,
    exportFormats = ["pdf", "excel", "csv"],
    enableSharing = true,
    enableScheduling = true,
    enableNotifications = true,
    enableAnalytics = false,
    onAnalytics,
    enableLogging = false,
    onLog,
    enableDebugging = false,
    onDebug,
    enablePersistence = true,
    storageKey = "aibos-report-builder",
    enableUndoRedo = true,
    onUndoRedo,
    enableValidation = true,
    onValidation,
    enableAccessibility = true,
    enableKeyboardShortcuts = true,
    shortcuts = {
      newReport: "Ctrl+N",
      saveReport: "Ctrl+S",
      openReport: "Ctrl+O",
      exportReport: "Ctrl+E",
      printReport: "Ctrl+P",
      undo: "Ctrl+Z",
      redo: "Ctrl+Y",
      copy: "Ctrl+C",
      paste: "Ctrl+V",
      delete: "Delete",
      selectAll: "Ctrl+A",
      zoomIn: "Ctrl++",
      zoomOut: "Ctrl+-",
      fitToPage: "Ctrl+0",
    },
    enableTouchSupport = true,
    enableMobileOptimization = true,
    enableResponsiveDesign = true,
    enableDarkMode = true,
    enableHighContrast = false,
    enableAnimations = true,
    animationDuration = 200,
    enablePerformanceMonitoring = false,
    onPerformanceMonitoring,
    className,
    ...props
  }: PolymorphicProperties<"div", ReportBuilderProperties>, ref: PolymorphicReference<"div">) => {
    const [elements, setElements] = React.useState<ReportElement[]>([]);
    const [selectedElement, setSelectedElement] = React.useState<string | null>(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const [dragData, setDragData] = React.useState<ReportElement | null>(null);
    const [canvasSize, setCanvasSize] = React.useState<ReportSize>({ width: 800, height: 600 });
    const [zoom, setZoom] = React.useState(1);
    const [pan, setPan] = React.useState<ReportPosition>({ x: 0, y: 0 });
    const [undoStack, setUndoStack] = React.useState<ReportElement[][]>([]);
    const [redoStack, setRedoStack] = React.useState<ReportElement[][]>([]);
    const [validationErrors, setValidationErrors] = React.useState<ReportValidationError[]>([]);
    const [validationWarnings, setValidationWarnings] = React.useState<ReportValidationWarning[]>([]);

    // Auto-save functionality
    React.useEffect(() => {
      if (enableAutoSave && enablePersistence) {
        const interval = setInterval(() => {
          localStorage.setItem(storageKey, JSON.stringify(elements));
          
          if (enableLogging) {
            onLog?.({
              level: "info",
              message: "Report auto-saved",
              timestamp: Date.now(),
              data: { elementCount: elements.length },
            });
          }
        }, autoSaveInterval);

        return () => clearInterval(interval);
      }
    }, [elements, enableAutoSave, enablePersistence, storageKey, autoSaveInterval, enableLogging, onLog]);

    // Load saved report
    React.useEffect(() => {
      if (enablePersistence && typeof window !== "undefined") {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          try {
            const parsedElements = JSON.parse(saved);
            setElements(parsedElements);
          } catch (error) {
            console.warn("Failed to load saved report:", error);
          }
        }
      }
    }, [enablePersistence, storageKey]);

    // Add element
    const addElement = React.useCallback((element: ReportElement) => {
      setElements(prev => {
        const newElements = [...prev, element];
        
        // Add to undo stack
        if (enableUndoRedo) {
          setUndoStack(prevStack => [...prevStack, prev]);
          setRedoStack([]);
        }

        // Analytics
        if (enableAnalytics) {
          onAnalytics?.({
            type: "edit",
            elementId: element.id,
            timestamp: Date.now(),
            data: { elementType: element.type },
          });
        }

        // Logging
        if (enableLogging) {
          onLog?.({
            level: "info",
            message: `Element added: ${element.type}`,
            timestamp: Date.now(),
            data: { elementId: element.id, elementType: element.type },
          });
        }

        // Debugging
        if (enableDebugging) {
          onDebug?.({
            type: "element",
            message: "Element added to report",
            timestamp: Date.now(),
            data: { element, totalElements: newElements.length },
          });
        }

        return newElements;
      });
    }, [enableUndoRedo, enableAnalytics, onAnalytics, enableLogging, onLog, enableDebugging, onDebug]);

    // Remove element
    const removeElement = React.useCallback((elementId: string) => {
      setElements(prev => {
        const newElements = prev.filter(el => el.id !== elementId);
        
        // Add to undo stack
        if (enableUndoRedo) {
          setUndoStack(prevStack => [...prevStack, prev]);
          setRedoStack([]);
        }

        // Clear selection if removed element was selected
        if (selectedElement === elementId) {
          setSelectedElement(null);
        }

        return newElements;
      });
    }, [enableUndoRedo, selectedElement]);

    // Update element
    const updateElement = React.useCallback((elementId: string, updates: Partial<ReportElement>) => {
      setElements(prev => {
        const newElements = prev.map(el => 
          el.id === elementId ? { ...el, ...updates } : el
        );
        
        // Add to undo stack
        if (enableUndoRedo) {
          setUndoStack(prevStack => [...prevStack, prev]);
          setRedoStack([]);
        }

        return newElements;
      });
    }, [enableUndoRedo]);

    // Undo
    const undo = React.useCallback(() => {
      if (undoStack.length === 0) return;

      const previousState = undoStack[undoStack.length - 1];
      if (previousState) {
        setRedoStack(prev => [...prev, elements]);
        setUndoStack(prev => prev.slice(0, -1));
        setElements(previousState);
      }

      if (enableUndoRedo) {
        onUndoRedo?.({
          type: "undo",
          element: elements[0] || {} as ReportElement,
          timestamp: Date.now(),
        });
      }
    }, [undoStack, elements, enableUndoRedo, onUndoRedo]);

    // Redo
    const redo = React.useCallback(() => {
      if (redoStack.length === 0) return;

      const nextState = redoStack[redoStack.length - 1];
      if (nextState) {
        setUndoStack(prev => [...prev, elements]);
        setRedoStack(prev => prev.slice(0, -1));
        setElements(nextState);
      }

      if (enableUndoRedo) {
        onUndoRedo?.({
          type: "redo",
          element: elements[0] || {} as ReportElement,
          timestamp: Date.now(),
        });
      }
    }, [redoStack, elements, enableUndoRedo, onUndoRedo]);

    // Keyboard shortcuts
    const handleKeyDown = React.useCallback((event: KeyboardEvent) => {
      if (!enableKeyboardShortcuts) return;

      const isCtrl = event.ctrlKey || event.metaKey;

      if (isCtrl && event.key === "z") {
        event.preventDefault();
        undo();
      } else if (isCtrl && event.key === "y") {
        event.preventDefault();
        redo();
      } else if (isCtrl && event.key === "s") {
        event.preventDefault();
        // Save report
        if (enablePersistence) {
          localStorage.setItem(storageKey, JSON.stringify(elements));
        }
      } else if (event.key === "Delete" && selectedElement) {
        event.preventDefault();
        removeElement(selectedElement);
      }
    }, [enableKeyboardShortcuts, undo, redo, enablePersistence, storageKey, elements, selectedElement, removeElement]);

    // Add keyboard event listeners
    React.useEffect(() => {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // Render element
    const renderElement = React.useCallback((element: ReportElement) => {
      const isSelected = selectedElement === element.id;

      return (
        <div
          key={element.id}
          className={cn(
            reportBuilderElementStyles({
              variant: "default",
              state: isSelected ? "selected" : "default",
            })
          )}
          style={{
            left: element.position.x,
            top: element.position.y,
            width: element.size.width,
            height: element.size.height,
            transform: `scale(${zoom})`,
            transition: enableAnimations ? `all ${animationDuration}ms ease` : "none",
          }}
          onClick={() => setSelectedElement(element.id)}
          onDoubleClick={() => {
            // Edit element
            console.log("Edit element:", element.id);
          }}
        >
          <div className="p-2 h-full overflow-hidden">
            <div className="text-xs text-muted-foreground mb-1">{element.type}</div>
            <div className="text-sm">
              {element.type === "text" && (
                <div>{element.data.content as string || "Text Element"}</div>
              )}
              {element.type === "image" && (
                <div className="flex items-center justify-center h-full bg-muted rounded">
                  <span className="text-xs text-muted-foreground">Image</span>
                </div>
              )}
              {element.type === "chart" && (
                <div className="flex items-center justify-center h-full bg-muted rounded">
                  <span className="text-xs text-muted-foreground">Chart</span>
                </div>
              )}
              {element.type === "table" && (
                <div className="flex items-center justify-center h-full bg-muted rounded">
                  <span className="text-xs text-muted-foreground">Table</span>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }, [selectedElement, zoom, enableAnimations, animationDuration]);

    // Render toolbar
    const renderToolbar = React.useCallback(() => {
      if (!showToolbar) return null;

      return (
        <div className={cn(reportBuilderToolbarStyles({ variant: "default", size: "md" }))}>
          <button
            onClick={() => addElement({
              id: `text-${Date.now()}`,
              type: "text",
              position: { x: 100, y: 100 },
              size: { width: 200, height: 50 },
              data: { content: "New Text Element" },
            })}
            className={cn(reportBuilderButtonStyles({ variant: "default", state: "default" }))}
            title={enableKeyboardShortcuts ? "Add Text Element" : "Add Text Element"}
          >
            📝 Text
          </button>
          <button
            onClick={() => addElement({
              id: `image-${Date.now()}`,
              type: "image",
              position: { x: 100, y: 200 },
              size: { width: 200, height: 150 },
              data: { src: "", alt: "New Image" },
            })}
            className={cn(reportBuilderButtonStyles({ variant: "default", state: "default" }))}
            title="Add Image Element"
          >
            🖼️ Image
          </button>
          <button
            onClick={() => addElement({
              id: `chart-${Date.now()}`,
              type: "chart",
              position: { x: 100, y: 300 },
              size: { width: 300, height: 200 },
              data: { type: "bar", data: [] },
            })}
            className={cn(reportBuilderButtonStyles({ variant: "default", state: "default" }))}
            title="Add Chart Element"
          >
            📊 Chart
          </button>
          <button
            onClick={() => addElement({
              id: `table-${Date.now()}`,
              type: "table",
              position: { x: 100, y: 400 },
              size: { width: 400, height: 200 },
              data: { columns: [], rows: [] },
            })}
            className={cn(reportBuilderButtonStyles({ variant: "default", state: "default" }))}
            title="Add Table Element"
          >
            📋 Table
          </button>
          
          <div className="flex-1" />
          
          <button
            onClick={undo}
            disabled={undoStack.length === 0}
            className={cn(reportBuilderButtonStyles({ 
              variant: "minimal", 
              state: undoStack.length === 0 ? "disabled" : "default" 
            }))}
            title={enableKeyboardShortcuts ? `Undo (${shortcuts.undo})` : "Undo"}
          >
            ↶ Undo
          </button>
          <button
            onClick={redo}
            disabled={redoStack.length === 0}
            className={cn(reportBuilderButtonStyles({ 
              variant: "minimal", 
              state: redoStack.length === 0 ? "disabled" : "default" 
            }))}
            title={enableKeyboardShortcuts ? `Redo (${shortcuts.redo})` : "Redo"}
          >
            ↷ Redo
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(prev => Math.min(prev + 0.1, 2))}
              className={cn(reportBuilderButtonStyles({ variant: "minimal", state: "default" }))}
              title={enableKeyboardShortcuts ? `Zoom In (${shortcuts.zoomIn})` : "Zoom In"}
            >
              🔍+
            </button>
            <span className="text-sm text-muted-foreground">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.1))}
              className={cn(reportBuilderButtonStyles({ variant: "minimal", state: "default" }))}
              title={enableKeyboardShortcuts ? `Zoom Out (${shortcuts.zoomOut})` : "Zoom Out"}
            >
              🔍-
            </button>
          </div>
        </div>
      );
    }, [showToolbar, addElement, enableKeyboardShortcuts, shortcuts, undo, redo, undoStack.length, redoStack.length, zoom]);

    // Render sidebar
    const renderSidebar = React.useCallback(() => {
      if (!showSidebar) return null;

      return (
        <div className={cn(reportBuilderSidebarStyles({ variant: "default", size: "md" }))}>
          <div className="p-4">
            <h3 className="text-sm font-medium mb-3">Elements</h3>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Drag elements to canvas</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 border border-border rounded cursor-pointer hover:bg-muted/50">
                  📝 Text
                </div>
                <div className="p-2 border border-border rounded cursor-pointer hover:bg-muted/50">
                  🖼️ Image
                </div>
                <div className="p-2 border border-border rounded cursor-pointer hover:bg-muted/50">
                  📊 Chart
                </div>
                <div className="p-2 border border-border rounded cursor-pointer hover:bg-muted/50">
                  📋 Table
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-3">Properties</h3>
              {selectedElement && (
                <div className="space-y-2 text-xs">
                  <div>Element: {elements.find(el => el.id === selectedElement)?.type}</div>
                  <div>Position: {elements.find(el => el.id === selectedElement)?.position.x}, {elements.find(el => el.id === selectedElement)?.position.y}</div>
                  <div>Size: {elements.find(el => el.id === selectedElement)?.size.width} × {elements.find(el => el.id === selectedElement)?.size.height}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }, [showSidebar, selectedElement, elements]);

    // Render canvas
    const renderCanvas = React.useCallback(() => {
      if (!showCanvas) return null;

      return (
        <div className={cn(reportBuilderCanvasStyles({ variant: "default" }))}>
          <div
            className="relative"
            style={{
              width: canvasSize.width * zoom,
              height: canvasSize.height * zoom,
              transform: `translate(${pan.x}px, ${pan.y}px)`,
              backgroundImage: "radial-gradient(circle, #ccc 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          >
            {elements.map(renderElement)}
          </div>
        </div>
      );
    }, [showCanvas, canvasSize, zoom, pan, elements, renderElement]);

    return (
      <div
        ref={ref}
        className={cn(reportBuilderStyles({ variant: "default", size: "md" }), className)}
        {...props}
      >
        {/* Toolbar */}
        {renderToolbar()}

        {/* Main Content */}
        <div className="flex h-full">
          {/* Sidebar */}
          {renderSidebar()}

          {/* Canvas */}
          {renderCanvas()}
        </div>

        {/* Statistics */}
        <div className="absolute bottom-4 right-4 p-2 bg-muted/80 rounded text-xs">
          <div>Elements: {elements.length}</div>
          <div>Selected: {selectedElement || "None"}</div>
          <div>Zoom: {Math.round(zoom * 100)}%</div>
          <div>Errors: {validationErrors.length}</div>
          <div>Warnings: {validationWarnings.length}</div>
        </div>
      </div>
    );
  },
  "ReportBuilder"
);

// Export styles for external use
export const reportBuilderVariants = {
  reportBuilderStyles,
  reportBuilderToolbarStyles,
  reportBuilderSidebarStyles,
  reportBuilderCanvasStyles,
  reportBuilderElementStyles,
  reportBuilderButtonStyles,
};
