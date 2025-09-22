import {
  cn,
  createPolymorphic,
  type PolymorphicProps as PolymorphicProperties,
  type PolymorphicRef as PolymorphicReference,
  variants,
} from "../utils";
import * as React from "react";

// Density System Types
export interface DensitySystemProperties {
  /** Current density level */
  density?: "compact" | "comfortable" | "spacious";
  /** Callback when density changes */
  onDensityChange?: (density: DensityLevel) => void;
  /** Whether to show density controls */
  showControls?: boolean;
  /** Whether to persist density preference */
  persistPreference?: boolean;
  /** Storage key for persistence */
  storageKey?: string;
  /** Whether to apply density globally */
  global?: boolean;
  /** Custom density configurations */
  configurations?: DensityConfiguration[];
  /** Whether to show density indicator */
  showIndicator?: boolean;
  /** Whether to enable keyboard shortcuts */
  keyboardShortcuts?: boolean;
  /** Custom keyboard shortcuts */
  shortcuts?: DensityKeyboardShortcuts;
  /** Whether to show density preview */
  showPreview?: boolean;
  /** Whether to enable density animations */
  enableAnimations?: boolean;
  /** Animation duration in milliseconds */
  animationDuration?: number;
  /** Whether to show density tooltips */
  showTooltips?: boolean;
  /** Custom density labels */
  labels?: DensityLabels;
  /** Whether to enable density presets */
  enablePresets?: boolean;
  /** Custom density presets */
  presets?: DensityPreset[];
  /** Whether to show density statistics */
  showStatistics?: boolean;
  /** Whether to enable density comparison */
  enableComparison?: boolean;
  /** Whether to show density recommendations */
  showRecommendations?: boolean;
  /** Custom density provider */
  densityProvider?: DensityProvider;
  /** Whether to enable density analytics */
  enableAnalytics?: boolean;
  /** Custom analytics handler */
  onAnalytics?: (event: DensityAnalyticsEvent) => void;
}

export interface DensityLevel {
  /** Density level identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description */
  description?: string;
  /** CSS custom properties */
  properties: Record<string, string>;
  /** Whether this is the default level */
  default?: boolean;
  /** Icon for the density level */
  icon?: React.ReactNode;
  /** Color theme for the density level */
  color?: string;
  /** Whether this level is disabled */
  disabled?: boolean;
  /** Custom data */
  data?: Record<string, unknown>;
}

export interface DensityConfiguration {
  /** Configuration identifier */
  id: string;
  /** Configuration name */
  name: string;
  /** Density levels for this configuration */
  levels: DensityLevel[];
  /** Whether this is the default configuration */
  default?: boolean;
  /** Description */
  description?: string;
  /** Icon */
  icon?: React.ReactNode;
  /** Whether this configuration is disabled */
  disabled?: boolean;
}

export interface DensityKeyboardShortcuts {
  /** Shortcut to cycle through densities */
  cycle?: string;
  /** Shortcut for compact density */
  compact?: string;
  /** Shortcut for comfortable density */
  comfortable?: string;
  /** Shortcut for spacious density */
  spacious?: string;
  /** Shortcut to toggle density controls */
  toggle?: string;
}

export interface DensityLabels {
  /** Label for compact density */
  compact?: string;
  /** Label for comfortable density */
  comfortable?: string;
  /** Label for spacious density */
  spacious?: string;
  /** Label for density controls */
  controls?: string;
  /** Label for density indicator */
  indicator?: string;
}

export interface DensityPreset {
  /** Preset identifier */
  id: string;
  /** Preset name */
  name: string;
  /** Preset description */
  description?: string;
  /** Density level for this preset */
  density: string;
  /** Whether this preset is disabled */
  disabled?: boolean;
  /** Icon for the preset */
  icon?: React.ReactNode;
  /** Custom data */
  data?: Record<string, unknown>;
}

export interface DensityProvider {
  /** Get current density */
  getDensity: () => DensityLevel;
  /** Set density */
  setDensity: (density: DensityLevel) => void;
  /** Get available densities */
  getAvailableDensities: () => DensityLevel[];
  /** Get density configuration */
  getConfiguration: () => DensityConfiguration;
  /** Set density configuration */
  setConfiguration: (config: DensityConfiguration) => void;
}

export interface DensityAnalyticsEvent {
  /** Event type */
  type: "change" | "preset" | "configuration" | "shortcut" | "preview";
  /** Density level ID */
  densityId?: string;
  /** Configuration ID */
  configurationId?: string;
  /** Preset ID */
  presetId?: string;
  /** Timestamp */
  timestamp: number;
  /** Additional data */
  data?: Record<string, unknown>;
}

// Default density levels
const defaultDensityLevels: DensityLevel[] = [
  {
    id: "compact",
    name: "Compact",
    description: "Maximum information density",
    properties: {
      "--density-padding": "0.25rem",
      "--density-margin": "0.125rem",
      "--density-gap": "0.25rem",
      "--density-font-size": "0.875rem",
      "--density-line-height": "1.25",
      "--density-border-radius": "0.25rem",
    },
    default: true,
    color: "blue",
  },
  {
    id: "comfortable",
    name: "Comfortable",
    description: "Balanced density for most users",
    properties: {
      "--density-padding": "0.5rem",
      "--density-margin": "0.25rem",
      "--density-gap": "0.5rem",
      "--density-font-size": "1rem",
      "--density-line-height": "1.5",
      "--density-border-radius": "0.375rem",
    },
    color: "green",
  },
  {
    id: "spacious",
    name: "Spacious",
    description: "Relaxed spacing for accessibility",
    properties: {
      "--density-padding": "0.75rem",
      "--density-margin": "0.5rem",
      "--density-gap": "0.75rem",
      "--density-font-size": "1.125rem",
      "--density-line-height": "1.75",
      "--density-border-radius": "0.5rem",
    },
    color: "purple",
  },
];

// Density System Styles
const densitySystemStyles = variants({
  base: "density-system",
  variants: {
    density: {
      compact: "density-compact",
      comfortable: "density-comfortable",
      spacious: "density-spacious",
    },
    variant: {
      default: "density-default",
      minimal: "density-minimal",
      compact: "density-compact-ui",
    },
  },
  defaultVariants: {
    density: "comfortable",
    variant: "default",
  },
});

const densityControlsStyles = variants({
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

const densityButtonStyles = variants({
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

const densityIndicatorStyles = variants({
  base: "inline-flex items-center gap-1 text-xs text-muted-foreground",
  variants: {
    variant: {
      default: "text-muted-foreground",
      minimal: "text-muted-foreground/70",
      compact: "text-muted-foreground/50",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

// Density System Component
export const DensitySystem = createPolymorphic<"div", DensitySystemProperties>(
  ({
    as,
    density = "comfortable",
    onDensityChange,
    showControls = true,
    persistPreference = true,
    storageKey = "aibos-density-preference",
    global = true,
    configurations = [{ id: "default", name: "Default", levels: defaultDensityLevels, default: true }],
    showIndicator = true,
    keyboardShortcuts = true,
    shortcuts = {
      cycle: "Ctrl+Shift+D",
      compact: "Ctrl+1",
      comfortable: "Ctrl+2",
      spacious: "Ctrl+3",
      toggle: "Ctrl+Alt+D",
    },
    showPreview = false,
    enableAnimations = true,
    animationDuration = 200,
    showTooltips = true,
    labels = {
      compact: "Compact",
      comfortable: "Comfortable",
      spacious: "Spacious",
      controls: "Density Controls",
      indicator: "Density",
    },
    enablePresets = true,
    presets = [],
    showStatistics = false,
    enableComparison = false,
    showRecommendations = false,
    densityProvider,
    enableAnalytics = false,
    onAnalytics,
    className,
    ...props
  }: PolymorphicProperties<"div", DensitySystemProperties>, ref: PolymorphicReference<"div">) => {
    const [currentDensity, setCurrentDensity] = React.useState<DensityLevel>(defaultDensityLevels[1]!);
    const [isControlsVisible, setIsControlsVisible] = React.useState(false);
    const [isPreviewMode, setIsPreviewMode] = React.useState(false);
    const [previewDensity, setPreviewDensity] = React.useState<DensityLevel | null>(null);

    // Apply density styles to document
    React.useEffect(() => {
      if (global) {
        const root = document.documentElement;
        const densityLevel = previewDensity || currentDensity;
        
        // Apply CSS custom properties
        for (const [property, value] of Object.entries(densityLevel.properties)) {
          root.style.setProperty(property, value);
        }

        // Add density class to body
        document.body.className = document.body.className
          .replaceAll(/density-\w+/g, '')
          .trim() + ` density-${densityLevel.id}`;

        return () => {
          // Cleanup on unmount
          for (const property of Object.keys(densityLevel.properties)) {
            root.style.removeProperty(property);
          }
          document.body.className = document.body.className.replaceAll(/density-\w+/g, '').trim();
        };
      }
    }, [currentDensity, previewDensity, global]);

    // Load persisted preference
    React.useEffect(() => {
      if (persistPreference && typeof window !== "undefined") {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const savedDensity = configurations
            .flatMap(c => c.levels)
            .find(l => l.id === saved);
          if (savedDensity) {
            setCurrentDensity(savedDensity);
          }
        }
      }
    }, [persistPreference, storageKey, configurations]);

    // Save preference
    const savePreference = React.useCallback((densityLevel: DensityLevel) => {
      if (persistPreference && typeof window !== "undefined") {
        localStorage.setItem(storageKey, densityLevel.id);
      }
    }, [persistPreference, storageKey]);

    // Handle density change
    const handleDensityChange = React.useCallback((densityLevel: DensityLevel) => {
      if (densityLevel.disabled) return;

      setCurrentDensity(densityLevel);
      savePreference(densityLevel);
      onDensityChange?.(densityLevel);

      // Analytics
      if (enableAnalytics) {
        onAnalytics?.({
          type: "change",
          densityId: densityLevel.id,
          timestamp: Date.now(),
        });
      }
    }, [onDensityChange, savePreference, enableAnalytics, onAnalytics]);

    // Handle keyboard shortcuts
    const handleKeyDown = React.useCallback((event: KeyboardEvent) => {
      if (!keyboardShortcuts) return;

      const isCtrl = event.ctrlKey || event.metaKey;
      const isShift = event.shiftKey;
      const isAlt = event.altKey;

      if (isCtrl && isShift && event.key === "D") {
        event.preventDefault();
        setIsControlsVisible(previous => !previous);
      } else if (isCtrl && isAlt && event.key === "D") {
        event.preventDefault();
        setIsControlsVisible(previous => !previous);
      } else if (isCtrl && event.key === "1") {
        event.preventDefault();
        const compactLevel = configurations.flatMap(c => c.levels).find(l => l.id === "compact");
        if (compactLevel) handleDensityChange(compactLevel);
      } else if (isCtrl && event.key === "2") {
        event.preventDefault();
        const comfortableLevel = configurations.flatMap(c => c.levels).find(l => l.id === "comfortable");
        if (comfortableLevel) handleDensityChange(comfortableLevel);
      } else if (isCtrl && event.key === "3") {
        event.preventDefault();
        const spaciousLevel = configurations.flatMap(c => c.levels).find(l => l.id === "spacious");
        if (spaciousLevel) handleDensityChange(spaciousLevel);
      }
    }, [keyboardShortcuts, configurations, handleDensityChange]);

    // Add keyboard event listeners
    React.useEffect(() => {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // Handle preset selection
    const handlePresetSelect = React.useCallback((preset: DensityPreset) => {
      if (preset.disabled) return;

      const densityLevel = configurations
        .flatMap(c => c.levels)
        .find(l => l.id === preset.density);
      
      if (densityLevel) {
        handleDensityChange(densityLevel);
      }

      // Analytics
      if (enableAnalytics) {
        onAnalytics?.({
          type: "preset",
          presetId: preset.id,
          densityId: preset.density,
          timestamp: Date.now(),
        });
      }
    }, [configurations, handleDensityChange, enableAnalytics, onAnalytics]);

    // Handle preview
    const handlePreview = React.useCallback((densityLevel: DensityLevel) => {
      if (showPreview) {
        setIsPreviewMode(true);
        setPreviewDensity(densityLevel);
        
        // Auto-clear preview after delay
        setTimeout(() => {
          setIsPreviewMode(false);
          setPreviewDensity(null);
        }, 2000);
      }
    }, [showPreview]);

    // Get available density levels
    const availableLevels = React.useMemo(() => {
      return configurations.flatMap(c => c.levels);
    }, [configurations]);

    // Render density button
    const renderDensityButton = React.useCallback((densityLevel: DensityLevel) => {
      const isActive = currentDensity.id === densityLevel.id;
      const isDisabled = densityLevel.disabled;

      return (
        <button
          key={densityLevel.id}
          onClick={() => handleDensityChange(densityLevel)}
          onMouseEnter={() => handlePreview(densityLevel)}
          disabled={isDisabled}
          className={cn(
            densityButtonStyles({
              variant: "default",
              state: isActive ? "active" : (isDisabled ? "disabled" : "default"),
            })
          )}
          title={showTooltips ? densityLevel.description : undefined}
        >
          {densityLevel.icon && <span className="mr-1">{densityLevel.icon}</span>}
          {densityLevel.name}
        </button>
      );
    }, [currentDensity, handleDensityChange, handlePreview, showTooltips]);

    // Render preset button
    const renderPresetButton = React.useCallback((preset: DensityPreset) => {
      const isDisabled = preset.disabled;

      return (
        <button
          key={preset.id}
          onClick={() => handlePresetSelect(preset)}
          disabled={isDisabled}
          className={cn(
            densityButtonStyles({
              variant: "minimal",
              state: isDisabled ? "disabled" : "default",
            })
          )}
          title={showTooltips ? preset.description : undefined}
        >
          {preset.icon && <span className="mr-1">{preset.icon}</span>}
          {preset.name}
        </button>
      );
    }, [handlePresetSelect, showTooltips]);

    return (
      <div
        ref={ref}
        className={cn(densitySystemStyles({ density: currentDensity.id as "compact" | "comfortable" | "spacious" }), className)}
        {...props}
      >
        {/* Density Controls */}
        {showControls && (
          <div className={cn(densityControlsStyles({ variant: "default", size: "md" }))}>
            <span className="text-sm font-medium">{labels.controls}:</span>
            <div className="flex items-center gap-1">
              {availableLevels.map(renderDensityButton)}
            </div>
            
            {/* Presets */}
            {enablePresets && presets.length > 0 && (
              <div className="flex items-center gap-1 ml-2 pl-2 border-l border-border">
                <span className="text-xs text-muted-foreground">Presets:</span>
                {presets.map(renderPresetButton)}
              </div>
            )}
          </div>
        )}

        {/* Density Indicator */}
        {showIndicator && (
          <div className={cn(densityIndicatorStyles({ variant: "default" }))}>
            <span>{labels.indicator}:</span>
            <span className="font-medium">{currentDensity.name}</span>
            {keyboardShortcuts && (
              <span className="text-xs opacity-60">
                ({shortcuts.cycle})
              </span>
            )}
          </div>
        )}

        {/* Statistics */}
        {showStatistics && (
          <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
            <div>Current: {currentDensity.name}</div>
            <div>Available: {availableLevels.length} levels</div>
            <div>Presets: {presets.length}</div>
          </div>
        )}

        {/* Recommendations */}
        {showRecommendations && (
          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-xs">
            <div className="font-medium text-blue-700 dark:text-blue-300">Recommendations:</div>
            <div className="text-blue-600 dark:text-blue-400">
              • Use Compact for data-heavy interfaces
              • Use Comfortable for general use
              • Use Spacious for accessibility
            </div>
          </div>
        )}
      </div>
    );
  },
  "DensitySystem"
);

// Export styles for external use
export const densitySystemVariants = {
  densitySystemStyles,
  densityControlsStyles,
  densityButtonStyles,
  densityIndicatorStyles,
};
