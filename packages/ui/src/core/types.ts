// Shared types across all components
export type ComponentSize = "sm" | "md" | "lg";
export type ComponentVariant =
  | "default"
  | "primary"
  | "secondary"
  | "destructive"
  | "outline"
  | "ghost";
export type ComponentState = "default" | "loading" | "disabled" | "error";

// Accessibility types
export type AccessibilityMode = "beautiful" | "wcag-aaa" | "auto";
export interface AccessibilityConfig {
  mode: AccessibilityMode;
  userPreference?: "beautiful" | "wcag-aaa";
  systemPreference?: "beautiful" | "wcag-aaa";
  forceMode?: boolean;
}

// Polymorphic component types
export type AsProp<C extends React.ElementType> = {
  as?: C;
};

export type PropsToOmit<C extends React.ElementType, P> = keyof (AsProp<C> & P);

export type PolymorphicComponentProp<
  C extends React.ElementType,
  Properties = {},
> = React.PropsWithChildren<Properties & AsProp<C>> &
  Omit<React.ComponentPropsWithoutRef<C>, PropsToOmit<C, Properties>>;

export type PolymorphicRef<C extends React.ElementType> =
  React.ComponentPropsWithRef<C>["ref"];

// Common component props
export interface BaseComponentProperties {
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
}

// Event handlers
export type EventHandler<T = void> = (event: T) => void;
export type AsyncEventHandler<T = void> = (event: T) => Promise<void>;

// Data types
export interface DataItem {
  id: string | number;
  [key: string]: unknown;
}

export interface ColumnDef<T = DataItem> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  render?: (value: unknown, record: T, index: number) => React.ReactNode;
  width?: number | string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  filterable?: boolean;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type:
    | "text"
    | "email"
    | "password"
    | "number"
    | "select"
    | "textarea"
    | "checkbox"
    | "radio"
    | "date";
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string | number }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

// API types
export interface ApiResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginationParameters {
  page: number;
  pageSize: number;
  total?: number;
}

export interface SortParameters {
  field: string;
  order: "asc" | "desc";
}

export interface FilterParameters {
  [key: string]: unknown;
}
