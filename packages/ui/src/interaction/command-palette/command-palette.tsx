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

// Command Palette Types
export interface CommandPaletteComponentProperties {
  /** Whether the command palette is open */
  open?: boolean;
  /** Callback when the command palette should close */
  onClose?: () => void;
  /** Callback when a command is selected */
  onCommand?: (command: CommandPaletteItem) => void;
  /** Available commands */
  commands?: CommandPaletteItem[];
  /** Search query */
  query?: string;
  /** Callback when search query changes */
  onQueryChange?: (query: string) => void;
  /** Placeholder text for search input */
  placeholder?: string;
  /** Whether to show keyboard shortcuts */
  showShortcuts?: boolean;
  /** Custom filter function */
  filterCommands?: (commands: CommandPaletteItem[], query: string) => CommandPaletteItem[];
  /** Whether to group commands by category */
  groupByCategory?: boolean;
  /** Custom render function for command items */
  renderCommand?: (command: CommandPaletteItem, index: number) => React.ReactNode;
  /** Whether to enable fuzzy search */
  fuzzySearch?: boolean;
  /** Maximum number of results to show */
  maxResults?: number;
  /** Whether to show command categories */
  showCategories?: boolean;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Whether to enable keyboard navigation */
  keyboardNavigation?: boolean;
  /** Custom keyboard shortcuts */
  shortcuts?: CommandPaletteKeyboardShortcuts;
  /** Whether to show command descriptions */
  showDescriptions?: boolean;
  /** Whether to enable command history */
  enableHistory?: boolean;
  /** Maximum history items */
  maxHistoryItems?: number;
  /** Whether to show recent commands */
  showRecent?: boolean;
  /** Custom theme variant */
  variant?: "default" | "minimal" | "compact";
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Whether to show command icons */
  showIcons?: boolean;
  /** Whether to enable command actions */
  enableActions?: boolean;
  /** Custom action buttons */
  actions?: CommandPaletteAction[];
  /** Whether to show command badges */
  showBadges?: boolean;
  /** Whether to enable command favorites */
  enableFavorites?: boolean;
  /** Whether to show command usage count */
  showUsageCount?: boolean;
  /** Whether to enable command suggestions */
  enableSuggestions?: boolean;
  /** Custom suggestion provider */
  suggestionProvider?: (query: string) => Promise<CommandPaletteItem[]>;
  /** Whether to enable command analytics */
  enableAnalytics?: boolean;
  /** Custom analytics handler */
  onAnalytics?: (event: CommandPaletteAnalyticsEvent) => void;
}

export interface CommandPaletteItem {
  /** Unique identifier for the command */
  id: string;
  /** Display name of the command */
  name: string;
  /** Description of the command */
  description?: string;
  /** Category for grouping commands */
  category?: string;
  /** Icon for the command */
  icon?: React.ReactNode;
  /** Keyboard shortcut */
  shortcut?: string;
  /** Action to execute when command is selected */
  action?: () => void;
  /** Whether the command is disabled */
  disabled?: boolean;
  /** Whether the command is hidden */
  hidden?: boolean;
  /** Custom data for the command */
  data?: Record<string, unknown>;
  /** Badge for the command */
  badge?: string;
  /** Whether the command is a favorite */
  favorite?: boolean;
  /** Usage count for the command */
  usageCount?: number;
  /** Tags for the command */
  tags?: string[];
  /** Whether the command is a suggestion */
  suggestion?: boolean;
  /** Priority for sorting */
  priority?: number;
  /** Custom render function */
  render?: (props: CommandPaletteItemRenderProperties) => React.ReactNode;
}

export interface CommandPaletteItemRenderProperties {
  command: CommandPaletteItem;
  index: number;
  isSelected: boolean;
  isHighlighted: boolean;
}

export interface CommandPaletteAction {
  /** Unique identifier for the action */
  id: string;
  /** Display name of the action */
  name: string;
  /** Icon for the action */
  icon?: React.ReactNode;
  /** Action to execute */
  action: () => void;
  /** Whether the action is disabled */
  disabled?: boolean;
  /** Keyboard shortcut */
  shortcut?: string;
}

export interface CommandPaletteKeyboardShortcuts {
  /** Shortcut to open command palette */
  open?: string;
  /** Shortcut to close command palette */
  close?: string;
  /** Shortcut to navigate up */
  navigateUp?: string;
  /** Shortcut to navigate down */
  navigateDown?: string;
  /** Shortcut to select command */
  select?: string;
  /** Shortcut to clear search */
  clear?: string;
}

export interface CommandPaletteAnalyticsEvent {
  /** Event type */
  type: "open" | "close" | "search" | "select" | "navigate";
  /** Command ID if applicable */
  commandId?: string;
  /** Search query if applicable */
  query?: string;
  /** Timestamp */
  timestamp: number;
  /** Additional data */
  data?: Record<string, unknown>;
}

// Command Palette Styles
const commandPaletteStyles = variants({
  base: "fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 pb-4",
  variants: {
    variant: {
      default: "bg-background/80 backdrop-blur-sm",
      minimal: "bg-background/60 backdrop-blur-sm",
      compact: "bg-background/90 backdrop-blur-sm",
    },
    size: {
      sm: "pt-12",
      md: "pt-16",
      lg: "pt-20",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
});

const commandPaletteContentStyles = variants({
  base: "relative w-full max-w-2xl bg-card border border-border rounded-lg shadow-lg",
  variants: {
    variant: {
      default: "p-6",
      minimal: "p-4",
      compact: "p-2",
    },
    size: {
      sm: "max-w-lg",
      md: "max-w-2xl",
      lg: "max-w-4xl",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
});

const commandPaletteInputStyles = variants({
  base: "w-full px-4 py-3 text-lg bg-transparent border-0 outline-none placeholder:text-muted-foreground",
  variants: {
    variant: {
      default: "text-foreground",
      minimal: "text-foreground text-base",
      compact: "text-foreground text-sm",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const commandPaletteListStyles = variants({
  base: "mt-4 max-h-96 overflow-y-auto",
  variants: {
    variant: {
      default: "space-y-1",
      minimal: "space-y-0.5",
      compact: "space-y-0",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const commandPaletteItemStyles = variants({
  base: "flex items-center px-4 py-3 rounded-lg cursor-pointer transition-colors",
  variants: {
    variant: {
      default: "hover:bg-muted",
      minimal: "hover:bg-muted/50",
      compact: "hover:bg-muted/30",
    },
    state: {
      default: "text-foreground",
      selected: "bg-primary text-primary-foreground",
      highlighted: "bg-accent text-accent-foreground",
      disabled: "text-muted-foreground cursor-not-allowed opacity-50",
    },
  },
  defaultVariants: {
    variant: "default",
    state: "default",
  },
});

const commandPaletteCategoryStyles = variants({
  base: "px-4 py-2 text-sm font-medium text-muted-foreground border-b border-border",
  variants: {
    variant: {
      default: "bg-muted/50",
      minimal: "bg-transparent",
      compact: "bg-transparent text-xs",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const commandPaletteEmptyStyles = variants({
  base: "px-4 py-8 text-center text-muted-foreground",
  variants: {
    variant: {
      default: "text-base",
      minimal: "text-sm",
      compact: "text-xs",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

// Command Palette Component
export const InteractionCommandPalette = createPolymorphic<"div", CommandPaletteComponentProperties>(
  ({
    as,
    open = false,
    onClose,
    onCommand,
    commands = [],
    query = "",
    onQueryChange,
    placeholder = "Search commands...",
    showShortcuts = true,
    filterCommands,
    groupByCategory = true,
    renderCommand,
    fuzzySearch = true,
    maxResults = 50,
    showCategories = true,
    emptyMessage = "No commands found",
    keyboardNavigation = true,
    shortcuts = {
      open: "Ctrl+K",
      close: "Escape",
      navigateUp: "ArrowUp",
      navigateDown: "ArrowDown",
      select: "Enter",
      clear: "Escape",
    },
    showDescriptions = true,
    enableHistory = true,
    maxHistoryItems = 10,
    showRecent = true,
    variant = "default",
    size = "md",
    showIcons = true,
    enableActions = true,
    actions = [],
    showBadges = true,
    enableFavorites = true,
    showUsageCount = false,
    enableSuggestions = true,
    suggestionProvider,
    enableAnalytics = false,
    onAnalytics,
    className,
    ...props
  }: PolymorphicProperties<"div", CommandPaletteComponentProperties>, ref: PolymorphicReference<"div">) => {
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const [filteredCommands, setFilteredCommands] = React.useState<CommandPaletteItem[]>([]);
    const [commandHistory, setCommandHistory] = React.useState<CommandPaletteItem[]>([]);
    const [suggestions, setSuggestions] = React.useState<CommandPaletteItem[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const inputReference = React.useRef<HTMLInputElement>(null);
    const listReference = React.useRef<HTMLDivElement>(null);

    // Filter commands based on query
    const filterCommandsInternal = React.useCallback(
      (commandsToFilter: CommandPaletteItem[], searchQuery: string): CommandPaletteItem[] => {
        if (!searchQuery.trim()) {
          return commandsToFilter.slice(0, maxResults);
        }

        if (filterCommands) {
          return filterCommands(commandsToFilter, searchQuery);
        }

        const filtered = commandsToFilter.filter((command) => {
          if (command.hidden) return false;
          
          const searchLower = searchQuery.toLowerCase();
          const nameMatch = command.name.toLowerCase().includes(searchLower);
          const descriptionMatch = command.description?.toLowerCase().includes(searchLower);
          const categoryMatch = command.category?.toLowerCase().includes(searchLower);
          const tagsMatch = command.tags?.some(tag => tag.toLowerCase().includes(searchLower));
          
          return nameMatch || descriptionMatch || categoryMatch || tagsMatch;
        });

        // Sort by priority, then by usage count, then alphabetically
        return filtered
          .sort((a, b) => {
            if (a.priority !== b.priority) {
              return (b.priority || 0) - (a.priority || 0);
            }
            if (showUsageCount && a.usageCount !== b.usageCount) {
              return (b.usageCount || 0) - (a.usageCount || 0);
            }
            return a.name.localeCompare(b.name);
          })
          .slice(0, maxResults);
      },
      [filterCommands, maxResults, showUsageCount]
    );

    // Update filtered commands when query or commands change
    React.useEffect(() => {
      const filtered = filterCommandsInternal(commands, query);
      setFilteredCommands(filtered);
      setSelectedIndex(0);
    }, [commands, query, filterCommandsInternal]);

    // Handle keyboard navigation
    const handleKeyDown = React.useCallback(
      (event: KeyboardEvent) => {
        if (!keyboardNavigation || !open) return;

        switch (event.key) {
          case "ArrowDown": {
            event.preventDefault();
            setSelectedIndex((previous) => Math.min(previous + 1, filteredCommands.length - 1));
            break;
          }
          case "ArrowUp": {
            event.preventDefault();
            setSelectedIndex((previous) => Math.max(previous - 1, 0));
            break;
          }
          case "Enter": {
            event.preventDefault();
            if (filteredCommands[selectedIndex]) {
              handleCommandSelect(filteredCommands[selectedIndex]);
            }
            break;
          }
          case "Escape": {
            event.preventDefault();
            onClose?.();
            break;
          }
        }
      },
      [keyboardNavigation, open, filteredCommands, selectedIndex, onClose]
    );

    // Handle command selection
    const handleCommandSelect = React.useCallback(
      (command: CommandPaletteItem) => {
        if (command.disabled) return;

        // Add to history
        if (enableHistory) {
          setCommandHistory((previous) => {
            const newHistory = [command, ...previous.filter(c => c.id !== command.id)];
            return newHistory.slice(0, maxHistoryItems);
          });
        }

        // Execute command action
        command.action?.();
        onCommand?.(command);

        // Analytics
        if (enableAnalytics) {
          onAnalytics?.({
            type: "select",
            commandId: command.id,
            query,
            timestamp: Date.now(),
          });
        }

        // Close command palette
        onClose?.();
      },
      [enableHistory, maxHistoryItems, onCommand, enableAnalytics, onAnalytics, query, onClose]
    );

    // Handle query change
    const handleQueryChange = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const newQuery = event.target.value;
        onQueryChange?.(newQuery);

        // Analytics
        if (enableAnalytics) {
          onAnalytics?.({
            type: "search",
            query: newQuery,
            timestamp: Date.now(),
          });
        }
      },
      [onQueryChange, enableAnalytics, onAnalytics]
    );

    // Focus input when opened
    React.useEffect(() => {
      if (open && inputReference.current) {
        inputReference.current.focus();
      }
    }, [open]);

    // Add keyboard event listeners
    React.useEffect(() => {
      if (open) {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
      }
    }, [open, handleKeyDown]);

    // Group commands by category
    const groupedCommands = React.useMemo(() => {
      if (!groupByCategory || !showCategories) {
        return { "": filteredCommands };
      }

      const groups: Record<string, CommandPaletteItem[]> = {};
      for (const command of filteredCommands) {
        const category = command.category || "Other";
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(command);
      }

      return groups;
    }, [filteredCommands, groupByCategory, showCategories]);

    // Render command item
    const renderCommandItem = React.useCallback(
      (command: CommandPaletteItem, index: number) => {
        if (renderCommand) {
          return renderCommand(command, index);
        }

        const isSelected = index === selectedIndex;
        const isHighlighted = isSelected;

        return (
          <div
            key={command.id}
            className={cn(
              commandPaletteItemStyles({
                variant,
                state: command.disabled ? "disabled" : isSelected ? "selected" : isHighlighted ? "highlighted" : "default",
              }),
              command.disabled && "cursor-not-allowed opacity-50"
            )}
            onClick={() => !command.disabled && handleCommandSelect(command)}
          >
            {showIcons && command.icon && (
              <div className="mr-3 flex-shrink-0">
                {command.icon}
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-medium truncate">{command.name}</span>
                {showShortcuts && command.shortcut && (
                  <span className="ml-2 text-xs text-muted-foreground font-mono">
                    {command.shortcut}
                  </span>
                )}
              </div>
              
              {showDescriptions && command.description && (
                <p className="text-sm text-muted-foreground truncate mt-1">
                  {command.description}
                </p>
              )}
              
              {showBadges && command.badge && (
                <span className="inline-block px-2 py-1 text-xs bg-primary/10 text-primary rounded-full mt-1">
                  {command.badge}
                </span>
              )}
            </div>
          </div>
        );
      },
      [renderCommand, selectedIndex, showIcons, showShortcuts, showDescriptions, showBadges, variant, handleCommandSelect]
    );

    if (!open) return null;

    return (
      <div
        ref={ref}
        className={cn(commandPaletteStyles({ variant, size }), className)}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose?.();
          }
        }}
        {...props}
      >
        <div className={cn(commandPaletteContentStyles({ variant, size }))}>
          {/* Search Input */}
          <div className="relative">
            <input
              ref={inputReference}
              type="text"
              value={query}
              onChange={handleQueryChange}
              placeholder={placeholder}
              className={cn(commandPaletteInputStyles({ variant }))}
            />
            {isLoading && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Commands List */}
          <div ref={listReference} className={cn(commandPaletteListStyles({ variant }))}>
            {Object.keys(groupedCommands).length === 0 ? (
              <div className={cn(commandPaletteEmptyStyles({ variant }))}>
                {emptyMessage}
              </div>
            ) : (
              Object.entries(groupedCommands).map(([category, categoryCommands]) => (
                <div key={category}>
                  {showCategories && category && (
                    <div className={cn(commandPaletteCategoryStyles({ variant }))}>
                      {category}
                    </div>
                  )}
                  {categoryCommands.map((command, index) => renderCommandItem(command, index))}
                </div>
              ))
            )}
          </div>

          {/* Actions */}
          {enableActions && actions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Actions</span>
                <div className="flex items-center space-x-2">
                  {actions.map((action) => (
                    <button
                      key={action.id}
                      onClick={action.action}
                      disabled={action.disabled}
                      className="px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {action.icon && <span className="mr-1">{action.icon}</span>}
                      {action.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
  "InteractionCommandPalette"
);

// Export styles for external use
export const interactionCommandPaletteVariants = {
  commandPaletteStyles,
  commandPaletteContentStyles,
  commandPaletteInputStyles,
  commandPaletteListStyles,
  commandPaletteItemStyles,
  commandPaletteCategoryStyles,
  commandPaletteEmptyStyles,
};
