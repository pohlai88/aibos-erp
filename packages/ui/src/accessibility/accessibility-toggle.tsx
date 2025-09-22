import {
  createPolymorphic,
  composeRefs as composeReferences,
  dataAttr as dataAttribute,
  ariaAttr as ariaAttribute,
  cn,
  setAccessibilityMode,
  getAccessibilityMode,
  createDualModeStyles,
  type PolymorphicProps as PolymorphicProperties,
  type PolymorphicRef as PolymorphicReference,
} from "../utils";
import * as React from "react";

/**
 * Accessibility Toggle Component
 * Allows users to switch between Beautiful and WCAG 2.2 AAA modes
 * No compromise - both modes are fully implemented!
 */
export interface AccessibilityToggleProperties {
  className?: string;
  showLabels?: boolean;
  size?: "sm" | "md" | "lg";
}

export const AccessibilityToggle = createPolymorphic<
  "div",
  AccessibilityToggleProperties
>(
  (
    {
      as,
      className,
      showLabels = true,
      size = "md",
      ...props
    }: PolymorphicProperties<"div", AccessibilityToggleProperties>,
    ref: PolymorphicReference<"div">,
  ) => {
    const localReference = React.useRef<HTMLDivElement>(null);
    const [currentMode, setCurrentMode] = React.useState(
      getAccessibilityMode(),
    );

    // Compose refs
    const composedReference = composeReferences(localReference, ref);

    const handleModeChange = (mode: "beautiful" | "wcag-aaa") => {
      setAccessibilityMode({
        mode: "auto",
        userPreference: mode,
        forceMode: true,
      });
      setCurrentMode(getAccessibilityMode());
    };

    const isWCAGMode =
      currentMode.mode === "wcag-aaa" ||
      (currentMode.mode === "auto" &&
        currentMode.userPreference === "wcag-aaa");

    // Dual-mode styles
    const containerStyles = createDualModeStyles(
      "flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border",
      "flex items-center gap-3 p-3 rounded-lg bg-muted/50 border-2 border-border shadow-md",
    );

    const buttonStyles = createDualModeStyles(
      "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
      "px-4 py-2 text-base font-medium rounded-md transition-colors min-w-[44px] min-h-[44px] border-2",
    );

    const activeStyles = createDualModeStyles(
      "bg-primary text-primary-foreground shadow-sm",
      "bg-primary text-primary-foreground shadow-md border-primary/20",
    );

    const inactiveStyles = createDualModeStyles(
      "bg-transparent text-muted-foreground hover:bg-muted/60",
      "bg-transparent text-muted-foreground hover:bg-muted/60 border-transparent hover:border-muted/20",
    );

    const Tag = (as ?? "div") as "div";

    return (
      <Tag
        ref={composedReference}
        className={cn(containerStyles, className)}
        {...props}
      >
        {showLabels && (
          <span
            className={createDualModeStyles(
              "text-sm text-muted-foreground",
              "text-base text-muted-foreground font-medium",
            )}
          >
            Accessibility:
          </span>
        )}

        <button
          className={cn(
            buttonStyles,
            isWCAGMode ? inactiveStyles : activeStyles,
          )}
          onClick={() => handleModeChange("beautiful")}
          aria-pressed={!isWCAGMode}
          aria-label="Switch to beautiful mode"
          data-mode="beautiful"
        >
          🎨 Beautiful
        </button>

        <button
          className={cn(
            buttonStyles,
            isWCAGMode ? activeStyles : inactiveStyles,
          )}
          onClick={() => handleModeChange("wcag-aaa")}
          aria-pressed={isWCAGMode}
          aria-label="Switch to WCAG 2.2 AAA accessibility mode"
          data-mode="wcag-aaa"
        >
          ♿ WCAG AAA
        </button>

        <div className="ml-2 text-xs text-muted-foreground">
          {isWCAGMode ? "7:1 contrast" : "4.5:1 contrast"}
        </div>
      </Tag>
    );
  },
  "AccessibilityToggle",
);

/**
 * Usage Examples:
 *
 * // Basic toggle
 * <AccessibilityToggle />
 *
 * // Without labels
 * <AccessibilityToggle showLabels={false} />
 *
 * // Different sizes
 * <AccessibilityToggle size="lg" />
 *
 * // Custom styling
 * <AccessibilityToggle className="my-custom-styles" />
 *
 * // Programmatic control
 * setAccessibilityMode({ mode: "wcag-aaa" }) // Force WCAG AAA
 * setAccessibilityMode({ mode: "beautiful" }) // Force Beautiful
 * setAccessibilityMode({ mode: "auto", userPreference: "wcag-aaa" }) // User choice
 */
