// Constants used across all components
export const COMPONENT_SIZES = {
  sm: "sm",
  md: "md",
  lg: "lg",
} as const;

export const COMPONENT_VARIANTS = {
  default: "default",
  primary: "primary",
  secondary: "secondary",
  destructive: "destructive",
  outline: "outline",
  ghost: "ghost",
} as const;

export const COMPONENT_STATES = {
  default: "default",
  loading: "loading",
  disabled: "disabled",
  error: "error",
} as const;

// Accessibility constants
export const ACCESSIBILITY_MODES = {
  beautiful: "beautiful",
  wcagAAA: "wcag-aaa",
  auto: "auto",
} as const;

// Breakpoints
export const BREAKPOINTS = {
  xs: "0px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

// Spacing scale
export const SPACING = {
  0: "0px",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  7: "28px",
  8: "32px",
  9: "36px",
  10: "40px",
  11: "44px",
  12: "48px",
  14: "56px",
  16: "64px",
  20: "80px",
  24: "96px",
  28: "112px",
  32: "128px",
  36: "144px",
  40: "160px",
  44: "176px",
  48: "192px",
  52: "208px",
  56: "224px",
  60: "240px",
  64: "256px",
  72: "288px",
  80: "320px",
  96: "384px",
} as const;

// Animation durations
export const ANIMATION_DURATIONS = {
  fast: "150ms",
  normal: "200ms",
  slow: "300ms",
  slower: "500ms",
} as const;

// Z-index scale
export const Z_INDEX = {
  hide: -1,
  auto: "auto",
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

// Touch target sizes (WCAG AAA compliance)
export const TOUCH_TARGETS = {
  minimum: "44px",
  comfortable: "48px",
  large: "56px",
} as const;

// Color contrast ratios
export const CONTRAST_RATIOS = {
  AA: 4.5,
  AAA: 7,
} as const;

// Default pagination
export const DEFAULT_PAGINATION = {
  pageSize: 10,
  pageSizeOptions: [10, 20, 50, 100],
  showSizeChanger: true,
  showQuickJumper: true,
} as const;

// Default table configuration
export const DEFAULT_TABLE_CONFIG = {
  pagination: DEFAULT_PAGINATION,
  scroll: { x: "max-content" },
  size: "middle" as const,
  bordered: false,
  showHeader: true,
} as const;

// Default form configuration
export const DEFAULT_FORM_CONFIG = {
  layout: "vertical" as const,
  size: "middle" as const,
  colon: true,
  requiredMark: true,
} as const;
