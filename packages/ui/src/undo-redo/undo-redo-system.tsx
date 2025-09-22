import * as React from "react";
import {
  cn,
  createPolymorphic,
  type PolymorphicProps as PolymorphicProperties,
  type PolymorphicRef as PolymorphicReference,
  variants,
} from "../utils";

// Undo/Redo System Types
export interface UndoRedoSystemProperties {
  /** Maximum number of history entries */
  maxHistorySize?: number;
  /** Whether to enable undo functionality */
  enableUndo?: boolean;
  /** Whether to enable redo functionality */
  enableRedo?: boolean;
  /** Whether to show undo/redo controls */
  showControls?: boolean;
  /** Whether to show keyboard shortcuts */
  showShortcuts?: boolean;
  /** Whether to enable keyboard shortcuts */
  keyboardShortcuts?: boolean;
  /** Custom keyboard shortcuts */
  shortcuts?: UndoRedoKeyboardShortcuts;
  /** Whether to persist history */
  persistHistory?: boolean;
  /** Storage key for persistence */
  storageKey?: string;
  /** Whether to show history list */
  showHistory?: boolean;
  /** Whether to enable history filtering */
  enableFiltering?: boolean;
  /** Whether to show action descriptions */
  showDescriptions?: boolean;
  /** Whether to enable action grouping */
  enableGrouping?: boolean;
  /** Grouping time threshold in milliseconds */
  groupingThreshold?: number;
  /** Whether to show action timestamps */
  showTimestamps?: boolean;
  /** Whether to enable action search */
  enableSearch?: boolean;
  /** Whether to show action icons */
  showIcons?: boolean;
  /** Whether to enable action preview */
  enablePreview?: boolean;
  /** Whether to show action statistics */
  showStatistics?: boolean;
  /** Whether to enable action analytics */
  enableAnalytics?: boolean;
  /** Custom analytics handler */
  onAnalytics?: (event: UndoRedoAnalyticsEvent) => void;
  /** Whether to enable action validation */
  enableValidation?: boolean;
  /** Custom validation function */
  validateAction?: (action: UndoRedoAction) => boolean;
  /** Whether to enable action confirmation */
  enableConfirmation?: boolean;
  /** Custom confirmation function */
  confirmAction?: (action: UndoRedoAction) => Promise<boolean>;
  /** Whether to enable action rollback */
  enableRollback?: boolean;
  /** Custom rollback function */
  rollbackAction?: (action: UndoRedoAction) => Promise<void>;
  /** Whether to enable action replay */
  enableReplay?: boolean;
  /** Custom replay function */
  replayAction?: (action: UndoRedoAction) => Promise<void>;
  /** Whether to enable action export */
  enableExport?: boolean;
  /** Custom export function */
  exportActions?: (actions: UndoRedoAction[]) => Promise<void>;
  /** Whether to enable action import */
  enableImport?: boolean;
  /** Custom import function */
  importActions?: (data: string) => Promise<UndoRedoAction[]>;
  /** Whether to enable action sharing */
  enableSharing?: boolean;
  /** Custom sharing function */
  shareActions?: (actions: UndoRedoAction[]) => Promise<void>;
  /** Whether to enable action collaboration */
  enableCollaboration?: boolean;
  /** Custom collaboration handler */
  onCollaboration?: (event: UndoRedoCollaborationEvent) => void;
  /** Whether to enable action notifications */
  enableNotifications?: boolean;
  /** Custom notification handler */
  onNotification?: (notification: UndoRedoNotification) => void;
  /** Whether to enable action logging */
  enableLogging?: boolean;
  /** Custom logging handler */
  onLog?: (log: UndoRedoLog) => void;
  /** Whether to enable action debugging */
  enableDebugging?: boolean;
  /** Custom debugging handler */
  onDebug?: (debug: UndoRedoDebug) => void;
}

export interface UndoRedoAction {
  /** Unique action identifier */
  id: string;
  /** Action type */
  type: string;
  /** Action description */
  description: string;
  /** Action timestamp */
  timestamp: number;
  /** Action data */
  data: Record<string, unknown>;
  /** Action metadata */
  metadata?: Record<string, unknown>;
  /** Whether this action can be undone */
  canUndo?: boolean;
  /** Whether this action can be redone */
  canRedo?: boolean;
  /** Action icon */
  icon?: React.ReactNode;
  /** Action color */
  color?: string;
  /** Action category */
  category?: string;
  /** Action tags */
  tags?: string[];
  /** Action priority */
  priority?: number;
  /** Action dependencies */
  dependencies?: string[];
  /** Action conflicts */
  conflicts?: string[];
  /** Action validation */
  validation?: UndoRedoActionValidation;
  /** Action rollback data */
  rollbackData?: Record<string, unknown>;
  /** Action replay data */
  replayData?: Record<string, unknown>;
  /** Action export data */
  exportData?: Record<string, unknown>;
  /** Action import data */
  importData?: Record<string, unknown>;
  /** Action sharing data */
  sharingData?: Record<string, unknown>;
  /** Action collaboration data */
  collaborationData?: Record<string, unknown>;
  /** Action notification data */
  notificationData?: Record<string, unknown>;
  /** Action logging data */
  loggingData?: Record<string, unknown>;
  /** Action debugging data */
  debuggingData?: Record<string, unknown>;
}

export interface UndoRedoActionValidation {
  /** Validation function */
  validate: (action: UndoRedoAction) => boolean;
  /** Validation error message */
  errorMessage?: string;
  /** Validation warnings */
  warnings?: string[];
  /** Validation suggestions */
  suggestions?: string[];
}

export interface UndoRedoKeyboardShortcuts {
  /** Shortcut for undo */
  undo?: string;
  /** Shortcut for redo */
  redo?: string;
  /** Shortcut for clear history */
  clear?: string;
  /** Shortcut for toggle history */
  toggle?: string;
}

export interface UndoRedoAnalyticsEvent {
  /** Event type */
  type: "undo" | "redo" | "clear" | "group" | "filter" | "search" | "export" | "import" | "share" | "collaborate";
  /** Action ID */
  actionId?: string;
  /** Timestamp */
  timestamp: number;
  /** Additional data */
  data?: Record<string, unknown>;
}

export interface UndoRedoCollaborationEvent {
  /** Event type */
  type: "join" | "leave" | "update" | "conflict" | "resolve";
  /** User ID */
  userId: string;
  /** Action ID */
  actionId?: string;
  /** Timestamp */
  timestamp: number;
  /** Additional data */
  data?: Record<string, unknown>;
}

export interface UndoRedoNotification {
  /** Notification type */
  type: "success" | "error" | "warning" | "info";
  /** Notification message */
  message: string;
  /** Notification timestamp */
  timestamp: number;
  /** Additional data */
  data?: Record<string, unknown>;
}

export interface UndoRedoLog {
  /** Log level */
  level: "debug" | "info" | "warn" | "error";
  /** Log message */
  message: string;
  /** Log timestamp */
  timestamp: number;
  /** Additional data */
  data?: Record<string, unknown>;
}

export interface UndoRedoDebug {
  /** Debug type */
  type: "action" | "history" | "state" | "performance";
  /** Debug message */
  message: string;
  /** Debug timestamp */
  timestamp: number;
  /** Additional data */
  data?: Record<string, unknown>;
}

// Undo/Redo System Styles
const undoRedoSystemStyles = variants({
  base: "undo-redo-system",
  variants: {
    variant: {
      default: "undo-redo-default",
      minimal: "undo-redo-minimal",
      compact: "undo-redo-compact",
    },
    size: {
      sm: "undo-redo-sm",
      md: "undo-redo-md",
      lg: "undo-redo-lg",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
});

const undoRedoControlsStyles = variants({
  base: "flex items-center gap-2 p-2 bg-muted/50 rounded-lg",
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

const undoRedoButtonStyles = variants({
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

const undoRedoHistoryStyles = variants({
  base: "max-h-64 overflow-y-auto border border-border rounded-lg bg-background",
  variants: {
    variant: {
      default: "bg-background",
      minimal: "bg-muted/20",
      compact: "bg-muted/10",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const undoRedoHistoryItemStyles = variants({
  base: "p-2 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors",
  variants: {
    variant: {
      default: "hover:bg-muted/50",
      minimal: "hover:bg-muted/30",
      compact: "hover:bg-muted/20",
    },
    state: {
      default: "text-foreground",
      active: "bg-primary/10 text-primary",
      disabled: "text-muted-foreground opacity-50",
    },
  },
  defaultVariants: {
    variant: "default",
    state: "default",
  },
});

// Undo/Redo System Component
export const UndoRedoSystem = createPolymorphic<"div", UndoRedoSystemProperties>(
  ({
    as,
    maxHistorySize = 50,
    enableUndo = true,
    enableRedo = true,
    showControls = true,
    showShortcuts = true,
    keyboardShortcuts = true,
    shortcuts = {
      undo: "Ctrl+Z",
      redo: "Ctrl+Y",
      clear: "Ctrl+Shift+Z",
      toggle: "Ctrl+Shift+H",
    },
    persistHistory = false,
    storageKey = "aibos-undo-redo-history",
    showHistory = false,
    enableFiltering = true,
    showDescriptions = true,
    enableGrouping = true,
    groupingThreshold = 1000,
    showTimestamps = true,
    enableSearch = true,
    showIcons = true,
    enablePreview = true,
    showStatistics = false,
    enableAnalytics = false,
    onAnalytics,
    enableValidation = true,
    validateAction,
    enableConfirmation = false,
    confirmAction,
    enableRollback = true,
    rollbackAction,
    enableReplay = true,
    replayAction,
    enableExport = false,
    exportActions,
    enableImport = false,
    importActions,
    enableSharing = false,
    shareActions,
    enableCollaboration = false,
    onCollaboration,
    enableNotifications = true,
    onNotification,
    enableLogging = false,
    onLog,
    enableDebugging = false,
    onDebug,
    className,
    ...props
  }: PolymorphicProperties<"div", UndoRedoSystemProperties>, ref: PolymorphicReference<"div">) => {
    const [history, setHistory] = React.useState<UndoRedoAction[]>([]);
    const [currentIndex, setCurrentIndex] = React.useState(-1);
    const [isHistoryVisible, setIsHistoryVisible] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [filterCategory, setFilterCategory] = React.useState<string | null>(null);
    const [groupedActions, setGroupedActions] = React.useState<Record<string, UndoRedoAction[]>>({});

    // Load persisted history
    React.useEffect(() => {
      if (persistHistory && typeof window !== "undefined") {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          try {
            const parsedHistory = JSON.parse(saved);
            setHistory(parsedHistory);
            setCurrentIndex(parsedHistory.length - 1);
          } catch (error) {
            console.warn("Failed to load undo/redo history:", error);
          }
        }
      }
    }, [persistHistory, storageKey]);

    // Save history
    const saveHistory = React.useCallback((newHistory: UndoRedoAction[]) => {
      if (persistHistory && typeof window !== "undefined") {
        localStorage.setItem(storageKey, JSON.stringify(newHistory));
      }
    }, [persistHistory, storageKey]);

    // Add action to history
    const addAction = React.useCallback((action: UndoRedoAction) => {
      setHistory(prevHistory => {
        const newHistory = [...prevHistory.slice(0, currentIndex + 1), action];
        const trimmedHistory = newHistory.slice(-maxHistorySize);
        saveHistory(trimmedHistory);
        return trimmedHistory;
      });
      setCurrentIndex(prevIndex => Math.min(prevIndex + 1, maxHistorySize - 1));

      // Analytics
      if (enableAnalytics) {
        onAnalytics?.({
          type: "undo",
          actionId: action.id,
          timestamp: Date.now(),
        });
      }

      // Logging
      if (enableLogging) {
        onLog?.({
          level: "info",
          message: `Action added: ${action.description}`,
          timestamp: Date.now(),
          data: { actionId: action.id, actionType: action.type },
        });
      }

      // Debugging
      if (enableDebugging) {
        onDebug?.({
          type: "action",
          message: `Action added to history`,
          timestamp: Date.now(),
          data: { action, historySize: history.length + 1 },
        });
      }
    }, [currentIndex, maxHistorySize, saveHistory, enableAnalytics, onAnalytics, enableLogging, onLog, enableDebugging, onDebug, history.length]);

    // Undo action
    const undoAction = React.useCallback(async () => {
      if (currentIndex < 0 || !enableUndo) return;

      const action = history[currentIndex];
      if (!action || !action.canUndo) return;

      // Validation
      if (enableValidation && validateAction && !validateAction(action)) {
        if (enableNotifications) {
          onNotification?.({
            type: "error",
            message: "Cannot undo this action",
            timestamp: Date.now(),
          });
        }
        return;
      }

      // Confirmation
      if (enableConfirmation && confirmAction && !(await confirmAction(action))) {
        return;
      }

      // Rollback
      if (enableRollback && rollbackAction) {
        try {
          await rollbackAction(action);
        } catch (error) {
          if (enableNotifications) {
            onNotification?.({
              type: "error",
              message: `Failed to undo action: ${error}`,
              timestamp: Date.now(),
            });
          }
          return;
        }
      }

      setCurrentIndex(prevIndex => prevIndex - 1);

      // Analytics
      if (enableAnalytics) {
        onAnalytics?.({
          type: "undo",
          actionId: action.id,
          timestamp: Date.now(),
        });
      }

      // Notifications
      if (enableNotifications) {
        onNotification?.({
          type: "success",
          message: `Undid: ${action.description}`,
          timestamp: Date.now(),
        });
      }
    }, [currentIndex, enableUndo, history, enableValidation, validateAction, enableConfirmation, confirmAction, enableRollback, rollbackAction, enableNotifications, onNotification, enableAnalytics, onAnalytics]);

    // Redo action
    const redoAction = React.useCallback(async () => {
      if (currentIndex >= history.length - 1 || !enableRedo) return;

      const action = history[currentIndex + 1];
      if (!action || !action.canRedo) return;

      // Validation
      if (enableValidation && validateAction && !validateAction(action)) {
        if (enableNotifications) {
          onNotification?.({
            type: "error",
            message: "Cannot redo this action",
            timestamp: Date.now(),
          });
        }
        return;
      }

      // Confirmation
      if (enableConfirmation && confirmAction && !(await confirmAction(action))) {
        return;
      }

      // Replay
      if (enableReplay && replayAction) {
        try {
          await replayAction(action);
        } catch (error) {
          if (enableNotifications) {
            onNotification?.({
              type: "error",
              message: `Failed to redo action: ${error}`,
              timestamp: Date.now(),
            });
          }
          return;
        }
      }

      setCurrentIndex(prevIndex => prevIndex + 1);

      // Analytics
      if (enableAnalytics) {
        onAnalytics?.({
          type: "redo",
          actionId: action.id,
          timestamp: Date.now(),
        });
      }

      // Notifications
      if (enableNotifications) {
        onNotification?.({
          type: "success",
          message: `Redid: ${action.description}`,
          timestamp: Date.now(),
        });
      }
    }, [currentIndex, history, enableRedo, enableValidation, validateAction, enableConfirmation, confirmAction, enableReplay, replayAction, enableNotifications, onNotification, enableAnalytics, onAnalytics]);

    // Clear history
    const clearHistory = React.useCallback(() => {
      setHistory([]);
      setCurrentIndex(-1);
      saveHistory([]);

      // Analytics
      if (enableAnalytics) {
        onAnalytics?.({
          type: "clear",
          timestamp: Date.now(),
        });
      }

      // Notifications
      if (enableNotifications) {
        onNotification?.({
          type: "info",
          message: "History cleared",
          timestamp: Date.now(),
        });
      }
    }, [saveHistory, enableAnalytics, onAnalytics, enableNotifications, onNotification]);

    // Handle keyboard shortcuts
    const handleKeyDown = React.useCallback((event: KeyboardEvent) => {
      if (!keyboardShortcuts) return;

      const isCtrl = event.ctrlKey || event.metaKey;
      const isShift = event.shiftKey;

      if (isCtrl && !isShift && event.key === "z") {
        event.preventDefault();
        undoAction();
      } else if (isCtrl && (event.key === "y" || (isShift && event.key === "Z"))) {
        event.preventDefault();
        redoAction();
      } else if (isCtrl && isShift && event.key === "Z") {
        event.preventDefault();
        clearHistory();
      } else if (isCtrl && isShift && event.key === "H") {
        event.preventDefault();
        setIsHistoryVisible(prev => !prev);
      }
    }, [keyboardShortcuts, undoAction, redoAction, clearHistory]);

    // Add keyboard event listeners
    React.useEffect(() => {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // Group actions
    React.useEffect(() => {
      if (enableGrouping) {
        const groups: Record<string, UndoRedoAction[]> = {};
        history.forEach(action => {
          const category = action.category || "Other";
          if (!groups[category]) {
            groups[category] = [];
          }
          groups[category].push(action);
        });
        setGroupedActions(groups);
      }
    }, [history, enableGrouping]);

    // Filtered history
    const filteredHistory = React.useMemo(() => {
      let filtered = history;

      if (searchQuery) {
        filtered = filtered.filter(action =>
          action.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          action.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          action.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }

      if (filterCategory) {
        filtered = filtered.filter(action => action.category === filterCategory);
      }

      return filtered;
    }, [history, searchQuery, filterCategory]);

    // Available actions
    const canUndo = currentIndex >= 0 && enableUndo;
    const canRedo = currentIndex < history.length - 1 && enableRedo;

    // Render action item
    const renderActionItem = React.useCallback((action: UndoRedoAction, index: number) => {
      const isActive = index === currentIndex;
      const isDisabled = !action.canUndo && !action.canRedo;

      return (
        <div
          key={action.id}
          className={cn(
            undoRedoHistoryItemStyles({
              variant: "default",
              state: isActive ? "active" : isDisabled ? "disabled" : "default",
            })
          )}
        >
          <div className="flex items-center gap-2">
            {showIcons && action.icon && (
              <span className="text-sm">{action.icon}</span>
            )}
            <div className="flex-1">
              <div className="text-sm font-medium">{action.description}</div>
              {showDescriptions && (
                <div className="text-xs text-muted-foreground">{action.type}</div>
              )}
              {showTimestamps && (
                <div className="text-xs text-muted-foreground">
                  {new Date(action.timestamp).toLocaleString()}
                </div>
              )}
            </div>
            {action.color && (
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: action.color }}
              />
            )}
          </div>
        </div>
      );
    }, [currentIndex, showIcons, showDescriptions, showTimestamps]);

    return (
      <div
        ref={ref}
        className={cn(undoRedoSystemStyles({ variant: "default", size: "md" }), className)}
        {...props}
      >
        {/* Controls */}
        {showControls && (
          <div className={cn(undoRedoControlsStyles({ variant: "default", size: "md" }))}>
            <button
              onClick={undoAction}
              disabled={!canUndo}
              className={cn(
                undoRedoButtonStyles({
                  variant: "default",
                  state: canUndo ? "default" : "disabled",
                })
              )}
              title={showShortcuts ? `Undo (${shortcuts.undo})` : "Undo"}
            >
              ↶ Undo
            </button>
            <button
              onClick={redoAction}
              disabled={!canRedo}
              className={cn(
                undoRedoButtonStyles({
                  variant: "default",
                  state: canRedo ? "default" : "disabled",
                })
              )}
              title={showShortcuts ? `Redo (${shortcuts.redo})` : "Redo"}
            >
              ↷ Redo
            </button>
            <button
              onClick={clearHistory}
              disabled={history.length === 0}
              className={cn(
                undoRedoButtonStyles({
                  variant: "minimal",
                  state: history.length === 0 ? "disabled" : "default",
                })
              )}
              title={showShortcuts ? `Clear (${shortcuts.clear})` : "Clear History"}
            >
              🗑️ Clear
            </button>
            <button
              onClick={() => setIsHistoryVisible(prev => !prev)}
              className={cn(
                undoRedoButtonStyles({
                  variant: "minimal",
                  state: "default",
                })
              )}
              title={showShortcuts ? `Toggle History (${shortcuts.toggle})` : "Toggle History"}
            >
              📋 History
            </button>
          </div>
        )}

        {/* History */}
        {showHistory && isHistoryVisible && (
          <div className="mt-2">
            {/* Search and Filter */}
            {(enableSearch || enableFiltering) && (
              <div className="mb-2 space-y-2">
                {enableSearch && (
                  <input
                    type="text"
                    placeholder="Search actions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-1 text-sm border border-border rounded-md bg-background"
                  />
                )}
                {enableFiltering && (
                  <select
                    value={filterCategory || ""}
                    onChange={(e) => setFilterCategory(e.target.value || null)}
                    className="px-3 py-1 text-sm border border-border rounded-md bg-background"
                  >
                    <option value="">All Categories</option>
                    {Object.keys(groupedActions).map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* History List */}
            <div className={cn(undoRedoHistoryStyles({ variant: "default" }))}>
              {filteredHistory.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No actions in history
                </div>
              ) : (
                filteredHistory.map((action, index) => renderActionItem(action, index))
              )}
            </div>
          </div>
        )}

        {/* Statistics */}
        {showStatistics && (
          <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
            <div>Total Actions: {history.length}</div>
            <div>Current Position: {currentIndex + 1}</div>
            <div>Can Undo: {canUndo ? "Yes" : "No"}</div>
            <div>Can Redo: {canRedo ? "Yes" : "No"}</div>
          </div>
        )}
      </div>
    );
  },
  "UndoRedoSystem"
);

// Export styles for external use
export const undoRedoSystemVariants = {
  undoRedoSystemStyles,
  undoRedoControlsStyles,
  undoRedoButtonStyles,
  undoRedoHistoryStyles,
  undoRedoHistoryItemStyles,
};

// Export the addAction function for external use
export const useUndoRedo = () => {
  const [system, setSystem] = React.useState<typeof UndoRedoSystem | null>(null);

  const addAction = React.useCallback((action: UndoRedoAction) => {
    if (system) {
      // This would need to be implemented with a ref or context
      console.log("Adding action:", action);
    }
  }, [system]);

  return { addAction };
};
