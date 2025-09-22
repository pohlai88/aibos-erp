// Core utilities and foundations
export * from "./types";
export * from "./constants";

// Re-export specific utilities to avoid conflicts
export {
  cn,
  isNonEmptyString,
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatDate,
  formatRelativeTime,
  debounce,
  throttle,
  generateId,
  isEmpty,
  deepClone,
  getInitials,
  truncateText,
  isValidEmail,
  isValidUrl,
  sleep,
  retry,
  formatCompactNumber,
  clearFormatCaches,
  getFormatCacheStats,
  createPolymorphic,
  composeRefs,
  dataAttr,
  ariaAttr,
  useIsomorphicLayoutEffect,
  variants,
  setAccessibilityMode,
  getAccessibilityMode,
  isWCAGMode,
  createDualModeStyles,
  createDualModeProps,
  createAccessibilityVariants,
  createLazyComponent,
  createOptimizedRendering,
} from "../utils";

// Re-export types with explicit names to avoid conflicts
export type {
  PolymorphicProps,
  PolymorphicRef,
  AccessibilityMode,
  AccessibilityConfig,
} from "../utils";
