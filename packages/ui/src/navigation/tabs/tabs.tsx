import {
  createPolymorphic,
  composeRefs as composeReferences,
  dataAttr as dataAttribute,
  ariaAttr as ariaAttribute,
  cn,
  createAccessibilityVariants,
  createDualModeStyles,
  createDualModeProps as createDualModeProperties,
} from "../../utils";
import * as React from "react";

/**
 * TABS COMPONENT
 * Essential tab navigation with dual-mode accessibility
 */
export interface TabsProperties {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  orientation?: "horizontal" | "vertical";
  children?: React.ReactNode;
  className?: string;
}

export interface TabsListProperties {
  children?: React.ReactNode;
  className?: string;
}

export interface TabsTriggerProperties {
  value: string;
  children?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export interface TabsContentProperties {
  value: string;
  children?: React.ReactNode;
  className?: string;
}

// Tabs Root Component
const tabsStyles = createAccessibilityVariants({
  beautiful: {
    base: "w-full",
  },
  wcagAAA: {
    base: "w-full",
  },
});

export const Tabs = createPolymorphic<"div", TabsProperties>(
  (
    {
      as,
      defaultValue,
      value,
      onValueChange,
      orientation = "horizontal",
      children,
      className,
      ...props
    },
    ref,
  ) => {
    const localReference = React.useRef<HTMLDivElement>(null);
    const composedReference = composeReferences(localReference, ref);

    const [activeTab, setActiveTab] = React.useState(defaultValue || "");

    const currentValue = value === undefined ? activeTab : value;

    const handleValueChange = (newValue: string) => {
      if (value === undefined) {
        setActiveTab(newValue);
      }
      onValueChange?.(newValue);
    };

    // Dual-mode data attributes
    const dataProperties = createDualModeProperties(
      {
        "data-tabs": "true",
        "data-orientation": orientation,
        "data-active": currentValue,
        "data-mode": "beautiful",
      },
      {
        "data-tabs": "true",
        "data-orientation": orientation,
        "data-active": currentValue,
        "data-mode": "wcag-aaa",
        "data-wcag-compliant": "true",
        role: "tablist",
      },
    );

    const Tag = (as ?? "div") as "div";

    return (
      <Tag
        ref={composedReference}
        className={cn(tabsStyles(), className)}
        {...dataProperties}
        {...props}
      >
        <TabsContext.Provider
          value={{
            activeTab: currentValue,
            onValueChange: handleValueChange,
            orientation,
          }}
        >
          {children}
        </TabsContext.Provider>
      </Tag>
    );
  },
  "Tabs",
);

// Tabs Context
interface TabsContextType {
  activeTab: string;
  onValueChange: (value: string) => void;
  orientation: "horizontal" | "vertical";
}

const TabsContext = React.createContext<TabsContextType | null>(null);

const useTabsContext = () => {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs component");
  }
  return context;
};

// Tabs List Component
const tabsListStyles = createAccessibilityVariants({
  beautiful: {
    base: "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
    variants: {
      orientation: {
        horizontal: "flex-row",
        vertical: "flex-col h-auto",
      },
    },
    defaultVariants: { orientation: "horizontal" },
  },
  wcagAAA: {
    base: "inline-flex h-12 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground border-2 border-border",
    variants: {
      orientation: {
        horizontal: "flex-row",
        vertical: "flex-col h-auto",
      },
    },
    defaultVariants: { orientation: "horizontal" },
  },
});

export const TabsList = createPolymorphic<"div", TabsListProperties>(
  ({ as, children, className, ...props }, ref) => {
    const localReference = React.useRef<HTMLDivElement>(null);
    const composedReference = composeReferences(localReference, ref);
    const { orientation } = useTabsContext();

    const Tag = (as ?? "div") as "div";

    return (
      <Tag
        ref={composedReference}
        className={cn(tabsListStyles({ orientation }), className)}
        {...props}
      >
        {children}
      </Tag>
    );
  },
  "TabsList",
);

// Tabs Trigger Component
const tabsTriggerStyles = createAccessibilityVariants({
  beautiful: {
    base: "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    variants: {
      active: {
        true: "bg-background text-foreground shadow-sm",
        false: "",
      },
    },
    defaultVariants: { active: "false" },
  },
  wcagAAA: {
    base: "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-4 py-2 text-base font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-h-[44px]",
    variants: {
      active: {
        true: "bg-background text-foreground shadow-md border-2 border-border",
        false: "",
      },
    },
    defaultVariants: { active: "false" },
  },
});

export const TabsTrigger = createPolymorphic<"button", TabsTriggerProperties>(
  ({ as, value, children, disabled = false, className, ...props }, ref) => {
    const localReference = React.useRef<HTMLButtonElement>(null);
    const composedReference = composeReferences(localReference, ref);
    const { activeTab, onValueChange } = useTabsContext();

    const isActive = activeTab === value;

    const handleClick = () => {
      if (!disabled) {
        onValueChange(value);
      }
    };

    // Dual-mode data attributes
    const dataProperties = createDualModeProperties(
      {
        "data-tab-trigger": "true",
        "data-value": value,
        "data-active": dataAttribute(isActive),
        "data-disabled": dataAttribute(disabled),
        "data-mode": "beautiful",
      },
      {
        "data-tab-trigger": "true",
        "data-value": value,
        "data-active": dataAttribute(isActive),
        "data-disabled": dataAttribute(disabled),
        "data-mode": "wcag-aaa",
        "data-wcag-compliant": "true",
        role: "tab",
        "aria-selected": isActive,
        "aria-controls": `tab-content-${value}`,
      },
    );

    const Tag = (as ?? "button") as "button";

    return (
      <Tag
        ref={composedReference}
        className={cn(
          tabsTriggerStyles({ active: isActive ? "true" : "false" }),
          className,
        )}
        onClick={handleClick}
        disabled={disabled}
        {...dataProperties}
        {...props}
      >
        {children}
      </Tag>
    );
  },
  "TabsTrigger",
);

// Tabs Content Component
const tabsContentStyles = createAccessibilityVariants({
  beautiful: {
    base: "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  },
  wcagAAA: {
    base: "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2",
  },
});

export const TabsContent = createPolymorphic<"div", TabsContentProperties>(
  ({ as, value, children, className, ...props }, ref) => {
    const localReference = React.useRef<HTMLDivElement>(null);
    const composedReference = composeReferences(localReference, ref);
    const { activeTab } = useTabsContext();

    const isActive = activeTab === value;

    if (!isActive) {
      return null;
    }

    // Dual-mode data attributes
    const dataProperties = createDualModeProperties(
      {
        "data-tab-content": "true",
        "data-value": value,
        "data-active": dataAttribute(isActive),
        "data-mode": "beautiful",
      },
      {
        "data-tab-content": "true",
        "data-value": value,
        "data-active": dataAttribute(isActive),
        "data-mode": "wcag-aaa",
        "data-wcag-compliant": "true",
        role: "tabpanel",
        id: `tab-content-${value}`,
        "aria-labelledby": `tab-trigger-${value}`,
      },
    );

    const Tag = (as ?? "div") as "div";

    return (
      <Tag
        ref={composedReference}
        className={cn(tabsContentStyles(), className)}
        {...dataProperties}
        {...props}
      >
        {children}
      </Tag>
    );
  },
  "TabsContent",
);

// Legacy export for backward compatibility
export const tabsVariants = tabsStyles;
