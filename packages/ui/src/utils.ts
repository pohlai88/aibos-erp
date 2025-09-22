import { clsx } from "clsx";
import * as React from "react";
import { twMerge } from "tailwind-merge";

type ClassValue = string | false | null | undefined;

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx and tailwind-merge for optimal class handling
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 1. POLYMORPHIC COMPONENT TYPES (with optional Radix Slot)
 * Build components that can render as any tag (as prop) without losing IntelliSense or ref types
 */
type AsProperty<As extends React.ElementType> = {
  as?: As;
};

type PropertiesToOmit<
  As extends React.ElementType,
  P,
> = keyof (As extends unknown ? React.ComponentPropsWithRef<As> : never) &
  keyof P;

export type PolymorphicProps<As extends React.ElementType, P> = Omit<
  React.ComponentPropsWithRef<As>,
  PropertiesToOmit<As, P>
> &
  P &
  AsProperty<As>;

export type PolymorphicRef<As extends React.ElementType> =
  React.ComponentPropsWithRef<As>["ref"];

export function createPolymorphic<
  DefaultAs extends React.ElementType,
  OwnProperties extends object = {},
>(
  render: (
    props: PolymorphicProps<DefaultAs, OwnProperties>,
    ref: PolymorphicRef<DefaultAs>,
  ) => React.ReactElement | null,
  displayName: string,
) {
  const Comp = React.forwardRef(render) as unknown as <
    As extends React.ElementType = DefaultAs,
  >(
    props: PolymorphicProps<As, OwnProperties> & { ref?: PolymorphicRef<As> },
  ) => React.ReactElement | null;

  (Comp as React.ComponentType<unknown>).displayName = displayName;
  return Comp;
}

/**
 * 2. composeRefs (merge DOM refs safely)
 * Many libs (Radix, React-Aria) forward refs. You'll often need to merge your own ref with a child's
 */
export function composeRefs<T>(
  ...references: Array<React.Ref<T> | undefined>
): React.RefCallback<T> {
  return (node: T) => {
    for (const ref of references) {
      if (!ref) continue;
      if (typeof ref === "function") ref(node);
      else (ref as React.MutableRefObject<T | null>).current = node;
    }
  };
}

/**
 * 3. dataAttr / ariaAttr
 * Cleanly set boolean-to-attribute mappings for Tailwind state styling and WCAG-friendly ARIA flags
 */
export const dataAttr = (cond?: boolean) => (cond ? "" : undefined);
export const ariaAttr = (cond?: boolean) => (cond ? true : undefined);

/**
 * 4. useIsomorphicLayoutEffect
 * Prevent hydration warnings by using useLayoutEffect on the client and useEffect on the server
 */
export const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

/**
 * ACCESSIBILITY MODE SYSTEM
 * Beautiful + WCAG 2.2 AAA Toggle - No Compromise!
 */
export type AccessibilityMode = "beautiful" | "wcag-aaa" | "auto";

export interface AccessibilityConfig {
  mode: AccessibilityMode;
  userPreference?: "beautiful" | "wcag-aaa";
  systemPreference?: "beautiful" | "wcag-aaa";
  forceMode?: boolean;
}

// Global accessibility context
let globalAccessibilityConfig: AccessibilityConfig = {
  mode: "auto",
  userPreference: undefined,
  systemPreference: undefined,
  forceMode: false,
};

export function setAccessibilityMode(config: AccessibilityConfig): void {
  globalAccessibilityConfig = { ...globalAccessibilityConfig, ...config };

  // Update CSS custom properties for real-time switching
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    const isWCAGMode =
      config.mode === "wcag-aaa" ||
      (config.mode === "auto" && config.userPreference === "wcag-aaa");

    root.dataset.accessibilityMode = isWCAGMode ? "wcag-aaa" : "beautiful";

    // Update CSS variables for immediate visual changes
    if (isWCAGMode) {
      root.style.setProperty("--contrast-ratio", "7:1"); // WCAG AAA minimum
      root.style.setProperty("--focus-ring-width", "3px");
      root.style.setProperty("--focus-ring-offset", "2px");
      root.style.setProperty("--animation-duration", "0ms"); // Respect reduced motion
    } else {
      root.style.setProperty("--contrast-ratio", "4.5:1"); // WCAG AA minimum
      root.style.setProperty("--focus-ring-width", "2px");
      root.style.setProperty("--focus-ring-offset", "1px");
      root.style.setProperty("--animation-duration", "150ms");
    }
  }
}

export function getAccessibilityMode(): AccessibilityConfig {
  return { ...globalAccessibilityConfig };
}

export function isWCAGMode(): boolean {
  const config = getAccessibilityMode();
  return (
    config.mode === "wcag-aaa" ||
    (config.mode === "auto" && config.userPreference === "wcag-aaa")
  );
}

/**
 * DUAL-MODE STYLING UTILITIES
 * Automatically applies beautiful or WCAG AAA styles based on mode
 */
export function createDualModeStyles(
  beautiful: string,
  wcagAAA: string,
): string {
  const config = getAccessibilityMode();
  const useWCAG =
    config.mode === "wcag-aaa" ||
    (config.mode === "auto" && config.userPreference === "wcag-aaa");

  return useWCAG ? wcagAAA : beautiful;
}

export function createDualModeProps(
  beautiful: Record<string, unknown>,
  wcagAAA: Record<string, unknown>,
) {
  const config = getAccessibilityMode();
  const useWCAG =
    config.mode === "wcag-aaa" ||
    (config.mode === "auto" && config.userPreference === "wcag-aaa");

  return useWCAG ? wcagAAA : beautiful;
}

/**
 * ACCESSIBILITY-AWARE VARIANTS
 * Automatically switches between beautiful and WCAG AAA variants
 */
export function createAccessibilityVariants(schema: {
  beautiful: VariantSchema;
  wcagAAA: VariantSchema;
}) {
  return (options?: Record<string, string | undefined>) => {
    const config = getAccessibilityMode();
    const useWCAG =
      config.mode === "wcag-aaa" ||
      (config.mode === "auto" && config.userPreference === "wcag-aaa");

    const selectedSchema = useWCAG ? schema.wcagAAA : schema.beautiful;
    return variants(selectedSchema)(options);
  };
}

/**
 * 5. Minimal variants() helper (CVA-style, no dependency)
 * A tiny, framework-agnostic way to express Tailwind variants without pulling a lib
 */

type VariantSchema = {
  base?: ClassValue;
  variants?: Record<string, Record<string, ClassValue>>;
  defaultVariants?: Record<string, string>;
  compoundVariants?: Array<{ classes: ClassValue } & Record<string, string>>;
};

export function variants(schema: VariantSchema) {
  return (options?: Record<string, string | undefined>) => {
    const chosen = { ...schema.defaultVariants, ...options };
    const parts: ClassValue[] = [];

    if (schema.base) parts.push(schema.base);

    if (schema.variants) {
      for (const key of Object.keys(schema.variants)) {
        const value = chosen[key];
        if (value && schema.variants[key]?.[value]) {
          parts.push(schema.variants[key][value]);
        }
      }
    }

    if (schema.compoundVariants) {
      for (const cv of schema.compoundVariants) {
        const { classes, ...conds } = cv;
        const match = Object.entries(conds).every(([k, v]) => chosen[k] === v);
        if (match && classes) parts.push(classes);
      }
    }

    return parts.filter(Boolean).join(" ");
  };
}

/** Narrow helpers */
export const isNonEmptyString = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0;

/** Intl.NumberFormat cache for performance */
const numberFormatCache = new Map<string, Intl.NumberFormat>();
const currencyFormatCache = new Map<string, Intl.NumberFormat>();
const percentFormatCache = new Map<string, Intl.NumberFormat>();

function getCachedNumberFormat(locale: string): Intl.NumberFormat {
  if (!numberFormatCache.has(locale)) {
    numberFormatCache.set(locale, new Intl.NumberFormat(locale));
  }
  return numberFormatCache.get(locale)!;
}

function getCachedCurrencyFormat(
  locale: string,
  currency: string,
): Intl.NumberFormat {
  const key = `${locale}-${currency}`;
  if (!currencyFormatCache.has(key)) {
    currencyFormatCache.set(
      key,
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
      }),
    );
  }
  return currencyFormatCache.get(key)!;
}

function getCachedPercentFormat(locale: string): Intl.NumberFormat {
  if (!percentFormatCache.has(locale)) {
    percentFormatCache.set(
      locale,
      new Intl.NumberFormat(locale, {
        style: "percent",
        minimumFractionDigits: 1,
        maximumFractionDigits: 2,
      }),
    );
  }
  return percentFormatCache.get(locale)!;
}

/**
 * Clear all Intl.NumberFormat caches (useful for testing or memory management)
 */
export function clearFormatCaches(): void {
  numberFormatCache.clear();
  currencyFormatCache.clear();
  percentFormatCache.clear();
}

/**
 * Get cache statistics for debugging
 */
export function getFormatCacheStats(): {
  numberFormats: number;
  currencyFormats: number;
  percentFormats: number;
} {
  return {
    numberFormats: numberFormatCache.size,
    currencyFormats: currencyFormatCache.size,
    percentFormats: percentFormatCache.size,
  };
}

/**
 * Format currency values for display
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD",
  locale: string = "en-US",
): string {
  // Guard against NaN/Infinity
  if (!Number.isFinite(amount)) return "";
  return getCachedCurrencyFormat(locale, currency).format(amount);
}

/**
 * Format numbers with appropriate separators
 */
export function formatNumber(value: number, locale: string = "en-US"): string {
  if (!Number.isFinite(value)) return "";
  return getCachedNumberFormat(locale).format(value);
}

/**
 * Format percentages
 */
export function formatPercentage(
  value: number,
  locale: string = "en-US",
): string {
  if (!Number.isFinite(value)) return "";
  return getCachedPercentFormat(locale).format(value / 100);
}

/**
 * Format numbers in compact notation (1.2K, 3.4M, 5.6B, etc.)
 */
export function formatCompactNumber(
  value: number,
  locale: string = "en-US",
): string {
  if (!Number.isFinite(value)) return "";

  // Use native compact notation if available
  try {
    const formatter = new Intl.NumberFormat(locale, {
      notation: "compact",
      maximumFractionDigits: 1,
    });
    return formatter.format(value);
  } catch {
    // Fallback for browsers that don't support compact notation
    const absValue = Math.abs(value);
    if (absValue >= 1e12) {
      return `${(value / 1e12).toFixed(1)}T`;
    } else if (absValue >= 1e9) {
      return `${(value / 1e9).toFixed(1)}B`;
    } else if (absValue >= 1e6) {
      return `${(value / 1e6).toFixed(1)}M`;
    } else if (absValue >= 1e3) {
      return `${(value / 1e3).toFixed(1)}K`;
    } else {
      return value.toString();
    }
  }
}

/**
 * Format dates for display
 */
export function formatDate(
  date: Date | string,
  locale: string = "en-US",
  options?: Intl.DateTimeFormatOptions,
): string {
  const dateObject = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(dateObject.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  }).format(dateObject);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(
  date: Date | string,
  locale: string = "en-US",
): string {
  const dateObject = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(dateObject.getTime())) return "";
  const now = new Date();
  const diff = Math.round((dateObject.getTime() - now.getTime()) / 1000); // future: positive
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const divisions: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];
  for (const [unit, secondsInUnit] of divisions) {
    if (Math.abs(diff) >= secondsInUnit || unit === "second") {
      const value = Math.trunc(diff / secondsInUnit);
      return rtf.format(value, unit);
    }
  }
  return "";
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  function_: T,
  wait: number,
): ((...args: Parameters<T>) => void) & {
  cancel: () => void;
  flush: () => void;
} {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastArguments: Parameters<T> | null = null;
  const debounced = (...args: Parameters<T>) => {
    lastArguments = args;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(
      () => {
        timeout = null;

        function_(...lastArguments!);
      },
      Math.max(0, wait),
    );
  };
  debounced.cancel = () => {
    if (timeout) clearTimeout(timeout);
    timeout = null;
    lastArguments = null;
  };
  debounced.flush = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;

      function_(...(lastArguments as Parameters<T>));
    }
  };
  return debounced;
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  function_: T,
  limit: number,
  options: { leading?: boolean; trailing?: boolean } = {},
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastArguments: Parameters<T> | null = null;
  const leading = options.leading ?? true;
  const trailing = options.trailing ?? true;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (!lastCall && !leading) lastCall = now;
    const remaining = limit - (now - lastCall);
    lastArguments = args;
    if (remaining <= 0 || remaining > limit) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      lastCall = now;
      function_(...args);
    } else if (!timeout && trailing) {
      timeout = setTimeout(() => {
        lastCall = leading ? Date.now() : 0;
        timeout = null;
        if (lastArguments) function_(...lastArguments);
      }, remaining);
    }
  };
}

/**
 * Generate a random ID
 */
export function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback: RFC4122-ish v4
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replaceAll(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: unknown): boolean {
  if (value == undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (value instanceof Map || value instanceof Set) return value.size === 0;
  if (typeof value === "object")
    return Object.keys(value as object).length === 0;
  return false;
}

/**
 * Deep clone an object
 */
export function deepClone<T>(object: T): T {
  // Use native where available (handles Dates, Maps/Sets, typed arrays, circular refs)
  if (typeof structuredClone === "function") return structuredClone(object);
  if (object === null || typeof object !== "object") return object;
  if (object instanceof Date) return new Date(object.getTime()) as unknown as T;
  if (Array.isArray(object))
    return object.map((item) => deepClone(item)) as unknown as T;
  const cloned: Record<string, unknown> = {};
  for (const key of Object.keys(object as Record<string, unknown>)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cloned[key] = deepClone((object as any)[key]);
  }
  return cloned as T;
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  if (!isNonEmptyString(name)) return "";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!isNonEmptyString(text)) return "";
  if (maxLength <= 0) return "";
  if (text.length <= maxLength) return text;
  // Use the single-character ellipsis for better typographic quality
  return text.slice(0, Math.max(0, maxLength - 1)) + "…";
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sleep function for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  function_: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000,
): Promise<T> {
  try {
    return await function_();
  } catch (error) {
    if (retries > 0) {
      await sleep(delay);
      return retry(function_, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * Create lazy component for performance optimization
 */
export function createLazyComponent<T extends React.ComponentType<unknown>>(
  importFunction: () => Promise<{ default: T }>,
): React.LazyExoticComponent<T> {
  return React.lazy(importFunction);
}

/**
 * Create optimized rendering configuration
 */
export function createOptimizedRendering(config: {
  memo?: boolean;
  pure?: boolean;
  stable?: boolean;
}) {
  return {
    memo: config.memo ?? true,
    pure: config.pure ?? true,
    stable: config.stable ?? true,
  };
}
