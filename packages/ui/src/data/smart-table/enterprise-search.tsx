import {
  createPolymorphic,
  composeRefs as composeReferences,
  dataAttr as dataAttribute,
  ariaAttr as ariaAttribute,
  cn,
  createAccessibilityVariants,
  createDualModeStyles,
  createDualModeProps as createDualModeProperties,
  debounce,
  throttle,
} from "../../utils";
import * as React from "react";

/**
 * 🔍 ENTERPRISE SEARCH & FILTERING
 * Data discovery for massive ERP datasets
 * Fast search = productivity = competitive advantage
 */

// Search configuration types
export interface SearchIndex {
  fields: string[];
  weights?: Record<string, number>;
  threshold?: number;
}

export interface Facet {
  field: string;
  label: string;
  type: "text" | "number" | "date" | "boolean" | "select";
  options?: Array<{ value: string; label: string; count: number }>;
}

export interface SearchSuggestion {
  text: string;
  type: "recent" | "popular" | "autocomplete";
  count?: number;
}

export interface SearchQuery {
  text: string;
  filters: Record<string, unknown>;
  facets: Record<string, string[]>;
  sort?: { field: string; direction: "asc" | "desc" };
  page?: number;
  pageSize?: number;
}

export interface SearchResult<T = unknown> {
  items: T[];
  total: number;
  facets: Record<
    string,
    Array<{ value: string; label: string; count: number }>
  >;
  suggestions: SearchSuggestion[];
  query: SearchQuery;
}

// Enterprise Search Component
export interface EnterpriseSearchProperties {
  placeholder?: string;
  onSearch: (query: string) => void;
  onFilterChange?: (filters: Record<string, unknown>) => void;
  suggestions?: SearchSuggestion[];
  loading?: boolean;
  className?: string;
}

const searchStyles = createAccessibilityVariants({
  beautiful: {
    base: "relative w-full",
    variants: {
      size: {
        sm: "h-8",
        md: "h-10",
        lg: "h-12",
      },
    },
    defaultVariants: { size: "md" },
  },
  wcagAAA: {
    base: "relative w-full",
    variants: {
      size: {
        sm: "h-10",
        md: "h-12",
        lg: "h-14",
      },
    },
    defaultVariants: { size: "md" },
  },
});

const inputStyles = createAccessibilityVariants({
  beautiful: {
    base: "w-full h-full px-4 pr-10 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  },
  wcagAAA: {
    base: "w-full h-full px-4 pr-12 text-base border-2 border-input bg-background rounded-md focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2 min-h-[44px]",
  },
});

export const EnterpriseSearch = createPolymorphic<
  "div",
  EnterpriseSearchProperties
>(
  (
    {
      as,
      placeholder = "Search...",
      onSearch,
      onFilterChange,
      suggestions = [],
      loading = false,
      className,
      ...props
    },
    ref,
  ) => {
    const localReference = React.useRef<HTMLDivElement>(null);
    const inputReference = React.useRef<HTMLInputElement>(null);
    const composedReference = composeReferences(localReference, ref);

    const [query, setQuery] = React.useState("");
    const [showSuggestions, setShowSuggestions] = React.useState(false);
    const [selectedIndex, setSelectedIndex] = React.useState(-1);

    // Debounced search
    const debouncedSearch = React.useMemo(
      () =>
        debounce((...args: unknown[]) => {
          const searchQuery = args[0] as string;
          onSearch(searchQuery);
        }, 300),
      [onSearch],
    );

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      setShowSuggestions(value.length > 0);
      setSelectedIndex(-1);
      debouncedSearch(value);
    };

    // Handle suggestion selection
    const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
      setQuery(suggestion.text);
      setShowSuggestions(false);
      setSelectedIndex(-1);
      onSearch(suggestion.text);
      inputReference.current?.focus();
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!showSuggestions || suggestions.length === 0) return;

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          setSelectedIndex((previous) =>
            previous < suggestions.length - 1 ? previous + 1 : previous,
          );
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          setSelectedIndex((previous) => (previous > 0 ? previous - 1 : -1));
          break;
        }
        case "Enter": {
          e.preventDefault();
          if (selectedIndex >= 0 && suggestions[selectedIndex]) {
            handleSuggestionSelect(suggestions[selectedIndex]);
          } else {
            onSearch(query);
            setShowSuggestions(false);
          }
          break;
        }
        case "Escape": {
          setShowSuggestions(false);
          setSelectedIndex(-1);
          break;
        }
      }
    };

    // Dual-mode data attributes
    const dataProperties = createDualModeProperties(
      {
        "data-search": "enterprise",
        "data-loading": dataAttribute(loading),
      },
      {
        "data-search": "enterprise",
        "data-loading": dataAttribute(loading),
        "data-wcag-compliant": "true",
        role: "search",
      },
    );

    const Tag = (as ?? "div") as "div";

    return (
      <Tag
        ref={composedReference}
        className={cn(searchStyles(), className)}
        {...dataProperties}
        {...props}
      >
        <div className="relative">
          <input
            ref={inputReference}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(query.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={placeholder}
            className={inputStyles()}
            aria-label="Search input"
            aria-expanded={showSuggestions}
            aria-haspopup="listbox"
            aria-autocomplete="list"
          />

          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {loading ? (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                className="w-4 h-4 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            )}
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className={cn(
                    "w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors",
                    index === selectedIndex && "bg-muted",
                  )}
                  aria-label={`Search suggestion: ${suggestion.text}`}
                >
                  <div className="flex items-center justify-between">
                    <span>{suggestion.text}</span>
                    {suggestion.count && (
                      <span className="text-xs text-muted-foreground">
                        {suggestion.count}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </Tag>
    );
  },
  "EnterpriseSearch",
);

// Advanced Filter Component
export interface AdvancedFilterProperties {
  facets: Facet[];
  filters: Record<string, unknown>;
  onFilterChange: (filters: Record<string, unknown>) => void;
  className?: string;
}

const filterStyles = createAccessibilityVariants({
  beautiful: {
    base: "bg-card border border-border rounded-lg p-4 shadow-sm",
  },
  wcagAAA: {
    base: "bg-card border-2 border-border rounded-lg p-4 shadow-md",
  },
});

export const AdvancedFilter = createPolymorphic<
  "div",
  AdvancedFilterProperties
>(({ as, facets, filters, onFilterChange, className, ...props }, ref) => {
  const localReference = React.useRef<HTMLDivElement>(null);
  const composedReference = composeReferences(localReference, ref);

  // Handle filter change
  const handleFilterChange = (field: string, value: unknown) => {
    const newFilters = { ...filters, [field]: value };
    onFilterChange(newFilters);
  };

  // Clear all filters
  const clearAllFilters = () => {
    onFilterChange({});
  };

  // Dual-mode data attributes
  const dataProperties = createDualModeProperties(
    {
      "data-filter": "advanced",
      "data-facets": facets.length,
    },
    {
      "data-filter": "advanced",
      "data-facets": facets.length,
      "data-wcag-compliant": "true",
      role: "region",
      "aria-label": "Advanced filters",
    },
  );

  const Tag = (as ?? "div") as "div";

  return (
    <Tag
      ref={composedReference}
      className={cn(filterStyles(), className)}
      {...dataProperties}
      {...props}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Filters</h3>
        <button
          onClick={clearAllFilters}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Clear all
        </button>
      </div>

      <div className="space-y-4">
        {facets.map((facet) => (
          <div key={facet.field}>
            <label className="block text-sm font-medium text-foreground mb-2">
              {facet.label}
            </label>

            {facet.type === "select" && facet.options ? (
              <select
                value={(filters[facet.field] as string) || ""}
                onChange={(e) =>
                  handleFilterChange(facet.field, e.target.value)
                }
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All</option>
                {facet.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.count})
                  </option>
                ))}
              </select>
            ) : (facet.type === "boolean" ? (
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={facet.field}
                    value=""
                    checked={!filters[facet.field]}
                    onChange={() => handleFilterChange(facet.field, null)}
                    className="rounded border-border"
                  />
                  <span className="text-sm">All</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={facet.field}
                    value="true"
                    checked={filters[facet.field] === true}
                    onChange={() => handleFilterChange(facet.field, true)}
                    className="rounded border-border"
                  />
                  <span className="text-sm">Yes</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={facet.field}
                    value="false"
                    checked={filters[facet.field] === false}
                    onChange={() => handleFilterChange(facet.field, false)}
                    className="rounded border-border"
                  />
                  <span className="text-sm">No</span>
                </label>
              </div>
            ) : (
              <input
                type={
                  facet.type === "number"
                    ? "number"
                    : (facet.type === "date"
                      ? "date"
                      : "text")
                }
                value={(filters[facet.field] as string) || ""}
                onChange={(e) =>
                  handleFilterChange(facet.field, e.target.value)
                }
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder={`Filter by ${facet.label.toLowerCase()}`}
              />
            ))}
          </div>
        ))}
      </div>
    </Tag>
  );
}, "AdvancedFilter");

/**
 * USAGE EXAMPLES:
 *
 * // Enterprise Search
 * <EnterpriseSearch
 *   placeholder="Search customers, orders, products..."
 *   onSearch={handleSearch}
 *   suggestions={searchSuggestions}
 *   loading={isSearching}
 * />
 *
 * // Advanced Filter
 * <AdvancedFilter
 *   facets={filterFacets}
 *   filters={currentFilters}
 *   onFilterChange={handleFilterChange}
 * />
 */
