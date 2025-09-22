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

// Keyboard Types
export interface KeyboardComponentProperties {
  /** Keyboard shortcuts configuration */
  shortcuts?: KeyboardShortcut[];
  /** Whether to enable global shortcuts */
  global?: boolean;
  /** Whether to show visual indicators */
  showIndicators?: boolean;
  /** Whether to enable haptic feedback */
  enableHapticFeedback?: boolean;
  /** Whether to enable analytics */
  enableAnalytics?: boolean;
  /** Analytics callback */
  onAnalytics?: (event: KeyboardAnalyticsEvent) => void;
  /** Custom class name */
  className?: string;
}

export interface KeyboardShortcut {
  /** Unique identifier */
  id: string;
  /** Keyboard combination (e.g., "ctrl+k", "cmd+shift+p") */
  key: string;
  /** Description of the action */
  description: string;
  /** Action to execute */
  action: () => void;
  /** Whether shortcut is enabled */
  enabled?: boolean;
  /** Category for grouping */
  category?: string;
  /** Priority for ordering */
  priority?: number;
  /** Whether to prevent default behavior */
  preventDefault?: boolean;
  /** Whether to stop propagation */
  stopPropagation?: boolean;
  /** Custom icon */
  icon?: React.ReactNode;
  /** Whether shortcut is visible in help */
  visible?: boolean;
}

export interface KeyboardShortcutGroup {
  /** Group identifier */
  id: string;
  /** Group name */
  name: string;
  /** Group description */
  description?: string;
  /** Shortcuts in this group */
  shortcuts: KeyboardShortcut[];
  /** Whether group is collapsed */
  collapsed?: boolean;
}

export interface KeyboardHelpProperties {
  /** Whether help is open */
  open?: boolean;
  /** Callback when help closes */
  onClose?: () => void;
  /** Shortcut groups to display */
  groups?: KeyboardShortcutGroup[];
  /** Search query */
  query?: string;
  /** Whether to show search */
  showSearch?: boolean;
  /** Whether to enable analytics */
  enableAnalytics?: boolean;
  /** Analytics callback */
  onAnalytics?: (event: KeyboardAnalyticsEvent) => void;
  /** Custom class name */
  className?: string;
}

export interface KeyboardAnalyticsEvent {
  type: "shortcut" | "help_open" | "help_close" | "search";
  payload: {
    shortcutId?: string;
    key?: string;
    query?: string;
    timestamp: number;
  };
}

// Styles for Keyboard
const keyboardHelpStyles = variants({
  base: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm",
  variants: {
    variant: {
      default: "bg-background/80",
      minimal: "bg-transparent",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const keyboardHelpContentStyles = variants({
  base: "relative w-full max-w-4xl max-h-[80vh] rounded-lg border bg-card shadow-xl overflow-hidden",
  variants: {
    variant: {
      default: "border-border",
      minimal: "border-border/50",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const keyboardHelpHeaderStyles = variants({
  base: "flex items-center justify-between p-4 border-b border-border",
  variants: {
    variant: {
      default: "bg-card",
      minimal: "bg-card/95",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const keyboardHelpSearchStyles = variants({
  base: "flex items-center gap-2 p-4 border-b border-border",
  variants: {
    variant: {
      default: "bg-card",
      minimal: "bg-card/95",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const keyboardHelpBodyStyles = variants({
  base: "flex-1 overflow-y-auto p-4",
  variants: {
    variant: {
      default: "bg-card",
      minimal: "bg-card/95",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const keyboardGroupStyles = variants({
  base: "mb-6 last:mb-0",
  variants: {
    collapsed: {
      true: "opacity-75",
      false: "opacity-100",
    },
  },
  defaultVariants: {
    collapsed: "false",
  },
});

const keyboardGroupHeaderStyles = variants({
  base: "flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors",
  variants: {
    collapsed: {
      true: "bg-muted/30",
      false: "bg-muted/50",
    },
  },
  defaultVariants: {
    collapsed: "false",
  },
});

const keyboardShortcutStyles = variants({
  base: "flex items-center justify-between p-2 rounded hover:bg-accent/50 transition-colors",
  variants: {
    variant: {
      default: "",
      disabled: "opacity-50 cursor-not-allowed",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const keyboardKeyStyles = variants({
  base: "inline-flex items-center gap-1 px-2 py-1 text-xs font-mono bg-muted border border-border rounded",
  variants: {
    variant: {
      default: "text-foreground",
      primary: "bg-primary text-primary-foreground border-primary",
      secondary: "bg-secondary text-secondary-foreground border-secondary",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

// Keyboard Component
export const Keyboard = createPolymorphic<"div", KeyboardComponentProperties>(
  ({
    as,
    shortcuts = [],
    global = true,
    showIndicators = true,
    enableHapticFeedback = false,
    enableAnalytics = false,
    onAnalytics,
    className,
    ...props
  }: PolymorphicProperties<"div", KeyboardComponentProperties>, ref: PolymorphicReference<"div">) => {
    const [helpOpen, setHelpOpen] = React.useState(false);
    const [activeShortcuts, setActiveShortcuts] = React.useState<Set<string>>(new Set());
    const shortcutsRef = React.useRef<KeyboardShortcut[]>(shortcuts);

    // Update shortcuts ref
    React.useEffect(() => {
      shortcutsRef.current = shortcuts;
    }, [shortcuts]);

    // Parse key combination
    const parseKeyCombination = React.useCallback((key: string) => {
      const parts = key.toLowerCase().split(/[\s+]+/);
      const modifiers: string[] = [];
      let mainKey = "";

      for (const part of parts) {
        if (["ctrl", "cmd", "meta", "alt", "shift"].includes(part)) {
          modifiers.push(part);
        } else {
          mainKey = part;
        }
      }

      return { modifiers, mainKey };
    }, []);

    // Check if shortcut matches
    const matchesShortcut = React.useCallback((event: KeyboardEvent, shortcut: KeyboardShortcut) => {
      const { modifiers, mainKey } = parseKeyCombination(shortcut.key);
      
      // Check main key
      if (event.key.toLowerCase() !== mainKey) return false;
      
      // Check modifiers
      const hasCtrl = modifiers.includes("ctrl") && (event.ctrlKey || event.metaKey);
      const hasAlt = modifiers.includes("alt") && event.altKey;
      const hasShift = modifiers.includes("shift") && event.shiftKey;
      
      const requiredModifiers = modifiers.length;
      const actualModifiers = [hasCtrl, hasAlt, hasShift].filter(Boolean).length;
      
      return requiredModifiers === actualModifiers;
    }, [parseKeyCombination]);

    // Handle keydown
    const handleKeyDown = React.useCallback((event: KeyboardEvent) => {
      const matchingShortcuts = shortcutsRef.current.filter(shortcut => 
        shortcut.enabled !== false && matchesShortcut(event, shortcut)
      );

      for (const shortcut of matchingShortcuts) {
        if (shortcut.preventDefault) {
          event.preventDefault();
        }
        if (shortcut.stopPropagation) {
          event.stopPropagation();
        }

        // Execute action
        shortcut.action();

        // Analytics
        if (enableAnalytics && onAnalytics) {
          onAnalytics({
            type: "shortcut",
            payload: { shortcutId: shortcut.id, key: shortcut.key, timestamp: Date.now() },
          });
        }

        // Haptic feedback
        if (enableHapticFeedback && "vibrate" in navigator) {
          navigator.vibrate(50);
        }

        // Visual indicator
        if (showIndicators) {
          setActiveShortcuts(prev => new Set([...prev, shortcut.id]));
          setTimeout(() => {
            setActiveShortcuts(prev => {
              const newSet = new Set(prev);
              newSet.delete(shortcut.id);
              return newSet;
            });
          }, 200);
        }
      }
    }, [matchesShortcut, enableAnalytics, onAnalytics, enableHapticFeedback, showIndicators]);

    // Add event listeners
    React.useEffect(() => {
      if (global) {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
      }
    }, [global, handleKeyDown]);

    // Open help
    const openHelp = React.useCallback(() => {
      setHelpOpen(true);
      if (enableAnalytics && onAnalytics) {
        onAnalytics({
          type: "help_open",
          payload: { timestamp: Date.now() },
        });
      }
    }, [enableAnalytics, onAnalytics]);

    // Close help
    const closeHelp = React.useCallback(() => {
      setHelpOpen(false);
      if (enableAnalytics && onAnalytics) {
        onAnalytics({
          type: "help_close",
          payload: { timestamp: Date.now() },
        });
      }
    }, [enableAnalytics, onAnalytics]);

    const Component = as || "div";

    return (
      <Component
        ref={ref}
        className={cn("keyboard-shortcuts", className)}
        {...props}
      >
        {/* Visual indicators */}
        {showIndicators && activeShortcuts.size > 0 && (
          <div className="fixed top-4 right-4 z-40 flex flex-col gap-2">
            {Array.from(activeShortcuts).map(shortcutId => {
              const shortcut = shortcuts.find(s => s.id === shortcutId);
              if (!shortcut) return null;
              
              return (
                <div
                  key={shortcutId}
                  className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg shadow-lg animate-in slide-in-from-right-2"
                >
                  {shortcut.icon}
                  <span className="text-sm font-medium">{shortcut.description}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.key.split(/[\s+]+/).map((key, index) => (
                      <React.Fragment key={index}>
                        <kbd className={cn(keyboardKeyStyles({ variant: "primary" }))}>
                          {key}
                        </kbd>
                        {index < shortcut.key.split(/[\s+]+/).length - 1 && (
                          <span className="text-xs text-primary-foreground/70">+</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Help component */}
        {helpOpen && (
          <KeyboardHelp
            open={helpOpen}
            onClose={closeHelp}
            groups={groupShortcuts(shortcuts)}
            enableAnalytics={enableAnalytics}
            onAnalytics={onAnalytics}
          />
        )}
      </Component>
    );
  },
  "Keyboard"
);

// Group shortcuts by category
const groupShortcuts = (shortcuts: KeyboardShortcut[]): KeyboardShortcutGroup[] => {
  const groups: Record<string, KeyboardShortcut[]> = {};
  
  shortcuts.forEach(shortcut => {
    const category = shortcut.category || "General";
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(shortcut);
  });

  return Object.entries(groups).map(([name, shortcuts]) => ({
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    shortcuts: shortcuts.sort((a, b) => (b.priority || 0) - (a.priority || 0)),
  }));
};

// Keyboard Help Component
export const KeyboardHelp = createPolymorphic<"div", KeyboardHelpProperties>(
  ({
    as,
    open = false,
    onClose,
    groups = [],
    query = "",
    showSearch = true,
    enableAnalytics = false,
    onAnalytics,
    className,
    ...props
  }: PolymorphicProperties<"div", KeyboardHelpProperties>, ref: PolymorphicReference<"div">) => {
    const [searchQuery, setSearchQuery] = React.useState(query);
    const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string>>(new Set());
    const searchInputRef = React.useRef<HTMLInputElement>(null);

    // Filter groups based on search
    const filteredGroups = React.useMemo(() => {
      if (!searchQuery.trim()) return groups;
      
      return groups.map(group => ({
        ...group,
        shortcuts: group.shortcuts.filter(shortcut =>
          shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          shortcut.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
          shortcut.category?.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(group => group.shortcuts.length > 0);
    }, [groups, searchQuery]);

    // Handle search
    const handleSearch = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setSearchQuery(value);
      
      if (enableAnalytics && onAnalytics) {
        onAnalytics({
          type: "search",
          payload: { query: value, timestamp: Date.now() },
        });
      }
    }, [enableAnalytics, onAnalytics]);

    // Toggle group collapse
    const toggleGroup = React.useCallback((groupId: string) => {
      setCollapsedGroups(prev => {
        const newSet = new Set(prev);
        if (newSet.has(groupId)) {
          newSet.delete(groupId);
        } else {
          newSet.add(groupId);
        }
        return newSet;
      });
    }, []);

    // Focus search input
    React.useEffect(() => {
      if (open && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, [open]);

    // Handle escape key
    React.useEffect(() => {
      if (!open) return;

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          onClose?.();
        }
      };

      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }, [open, onClose]);

    if (!open) return null;

    const Component = as || "div";

    return (
      <Component
        ref={ref}
        className={cn(keyboardHelpStyles({ variant: "default" }), className)}
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard Shortcuts Help"
        {...props}
      >
        <div className={cn(keyboardHelpContentStyles({ variant: "default" }))}>
          {/* Header */}
          <div className={cn(keyboardHelpHeaderStyles({ variant: "default" }))}>
            <h2 className="text-lg font-semibold text-foreground">Keyboard Shortcuts</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close help"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search */}
          {showSearch && (
            <div className={cn(keyboardHelpSearchStyles({ variant: "default" }))}>
              <div className="relative flex-1">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder="Search shortcuts..."
                  className="w-full px-3 py-2 pl-10 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          )}

          {/* Content */}
          <div className={cn(keyboardHelpBodyStyles({ variant: "default" }))}>
            {filteredGroups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No shortcuts found" : "No shortcuts available"}
              </div>
            ) : (
              filteredGroups.map(group => (
                <div
                  key={group.id}
                  className={cn(keyboardGroupStyles({ collapsed: collapsedGroups.has(group.id) ? "true" : "false" }))}
                >
                  {/* Group Header */}
                  <div
                    className={cn(keyboardGroupHeaderStyles({ collapsed: collapsedGroups.has(group.id) ? "true" : "false" }))}
                    onClick={() => toggleGroup(group.id)}
                  >
                    <div>
                      <h3 className="font-medium text-foreground">{group.name}</h3>
                      {group.description && (
                        <p className="text-sm text-muted-foreground">{group.description}</p>
                      )}
                    </div>
                    <svg
                      className={cn("h-4 w-4 text-muted-foreground transition-transform", collapsedGroups.has(group.id) && "rotate-180")}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* Group Shortcuts */}
                  {!collapsedGroups.has(group.id) && (
                    <div className="mt-2 space-y-1">
                      {group.shortcuts.map(shortcut => (
                        <div
                          key={shortcut.id}
                          className={cn(keyboardShortcutStyles({ variant: shortcut.enabled === false ? "disabled" : "default" }))}
                        >
                          <div className="flex items-center gap-2">
                            {shortcut.icon}
                            <span className="text-sm text-foreground">{shortcut.description}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {shortcut.key.split(/[\s+]+/).map((key, index) => (
                              <React.Fragment key={index}>
                                <kbd className={cn(keyboardKeyStyles({ variant: "default" }))}>
                                  {key}
                                </kbd>
                                {index < shortcut.key.split(/[\s+]+/).length - 1 && (
                                  <span className="text-xs text-muted-foreground">+</span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </Component>
    );
  },
  "KeyboardHelp"
);

// Export styles for external use
export const keyboardVariants = {
  keyboardHelpStyles,
  keyboardHelpContentStyles,
  keyboardHelpHeaderStyles,
  keyboardHelpSearchStyles,
  keyboardHelpBodyStyles,
  keyboardGroupStyles,
  keyboardGroupHeaderStyles,
  keyboardShortcutStyles,
  keyboardKeyStyles,
};
