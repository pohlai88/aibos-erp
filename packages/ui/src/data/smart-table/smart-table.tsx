import {
  createPolymorphic,
  composeRefs as composeReferences,
  dataAttr as dataAttribute,
  ariaAttr as ariaAttribute,
  cn,
  createAccessibilityVariants,
  createDualModeStyles,
  createDualModeProps as createDualModeProperties,
  formatNumber,
  formatCurrency,
  formatDate,
} from "../../utils";
import * as React from "react";

/**
 * 📊 SMART TABLE/GRID UTILITIES
 * Core ERP function - 80% of ERP usage is data tables
 * Fast, smart tables = happy users = retention
 */

// Table configuration types
export interface SmartTableColumnDef<T = unknown> {
  key: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  align?: "left" | "center" | "right";
  format?: "text" | "number" | "currency" | "date" | "boolean";
}

export interface TableConfig {
  sortable?: boolean;
  filterable?: boolean;
  selectable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  virtualized?: boolean;
  responsive?: boolean;
}

export interface FilterConfig {
  field: string;
  operator:
    | "equals"
    | "contains"
    | "startsWith"
    | "endsWith"
    | "gt"
    | "lt"
    | "gte"
    | "lte";
  value: unknown;
}

export interface VirtualConfig {
  itemHeight: number;
  overscan?: number;
  threshold?: number;
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

// Smart Table Component
export interface SmartTableProperties<T = unknown> {
  data: T[];
  columns: SmartTableColumnDef<T>[];
  config?: TableConfig;
  filters?: FilterConfig[];
  onSort?: (field: string, direction: "asc" | "desc") => void;
  onFilter?: (filters: FilterConfig[]) => void;
  onSelect?: (selectedRows: T[]) => void;
  loading?: boolean;
  className?: string;
}

const tableStyles = createAccessibilityVariants({
  beautiful: {
    base: "w-full border-collapse bg-card border border-border rounded-lg shadow-sm",
    variants: {
      responsive: {
        true: "overflow-x-auto",
        false: "",
      },
    },
    defaultVariants: { responsive: "true" },
  },
  wcagAAA: {
    base: "w-full border-collapse bg-card border-2 border-border rounded-lg shadow-md",
    variants: {
      responsive: {
        true: "overflow-x-auto",
        false: "",
      },
    },
    defaultVariants: { responsive: "true" },
  },
});

const headerStyles = createAccessibilityVariants({
  beautiful: {
    base: "bg-muted text-muted-foreground font-medium text-sm border-b border-border",
  },
  wcagAAA: {
    base: "bg-muted text-muted-foreground font-semibold text-base border-b-2 border-border",
  },
});

const cellStyles = createAccessibilityVariants({
  beautiful: {
    base: "px-4 py-3 text-sm border-b border-border",
  },
  wcagAAA: {
    base: "px-4 py-4 text-base border-b border-border min-h-[44px]",
  },
});

export const SmartTable = createPolymorphic<"div", SmartTableProperties>(
  (
    {
      as,
      data,
      columns,
      config = {},
      filters = [],
      onSort,
      onFilter,
      onSelect,
      loading = false,
      className,
      ...props
    },
    ref,
  ) => {
    const localReference = React.useRef<HTMLDivElement>(null);
    const composedReference = composeReferences(localReference, ref);

    const [sortField, setSortField] = React.useState<string>("");
    const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">(
      "asc",
    );
    const [selectedRows, setSelectedRows] = React.useState<Set<number>>(
      new Set(),
    );

    // Sort data
    const sortedData = React.useMemo(() => {
      if (!sortField) return data;

      return [...data].sort((a, b) => {
        const aValue = (a as Record<string, unknown>)[sortField];
        const bValue = (b as Record<string, unknown>)[sortField];

        // Handle comparison with proper type checking
        const aString = String(aValue || "");
        const bString = String(bValue || "");

        if (aString < bString) return sortDirection === "asc" ? -1 : 1;
        if (aString > bString) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }, [data, sortField, sortDirection]);

    // Handle sort
    const handleSort = (field: string) => {
      if (!config.sortable) return;

      const newDirection =
        sortField === field && sortDirection === "asc" ? "desc" : "asc";
      setSortField(field);
      setSortDirection(newDirection);
      onSort?.(field, newDirection);
    };

    // Handle selection
    const handleSelectAll = (checked: boolean) => {
      if (!config.selectable) return;

      const newSelection = checked
        ? new Set(data.map((_, index) => index))
        : new Set<number>();
      setSelectedRows(newSelection);
      onSelect?.(checked ? data : []);
    };

    const handleSelectRow = (index: number, checked: boolean) => {
      if (!config.selectable) return;

      const newSelection = new Set(selectedRows);
      if (checked) {
        newSelection.add(index);
      } else {
        newSelection.delete(index);
      }
      setSelectedRows(newSelection);
      onSelect?.(data.filter((_, index_) => newSelection.has(index_)));
    };

    // Format cell value
    const formatCellValue = (value: unknown, format?: string) => {
      if (value === null || value === undefined) return "";

      switch (format) {
        case "number": {
          return formatNumber(value as number);
        }
        case "currency": {
          return formatCurrency(value as number);
        }
        case "date": {
          return formatDate(value as string | Date);
        }
        case "boolean": {
          return value ? "Yes" : "No";
        }
        default: {
          return value.toString();
        }
      }
    };

    // Dual-mode data attributes
    const dataProperties = createDualModeProperties(
      {
        "data-table": "smart",
        "data-rows": data.length.toString(),
        "data-columns": columns.length.toString(),
        "data-loading": dataAttribute(loading),
      },
      {
        "data-table": "smart",
        "data-rows": data.length.toString(),
        "data-columns": columns.length.toString(),
        "data-loading": dataAttribute(loading),
        "data-wcag-compliant": "true",
        role: "table",
        "aria-label": "Data table",
      },
    );

    const Tag = (as ?? "div") as "div";

    return (
      <Tag
        ref={composedReference}
        className={cn(
          tableStyles({ responsive: config.responsive ? "true" : "false" }),
          className,
        )}
        {...dataProperties}
        {...props}
      >
        <table className="w-full">
          <thead>
            <tr className={headerStyles()}>
              {config.selectable && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedRows.size === data.length && data.length > 0
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-border"
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-3 text-left",
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right",
                    column.sortable && "cursor-pointer hover:bg-muted/50",
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                  style={{ width: column.width }}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable && sortField === column.key && (
                      <span className="text-xs">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (config.selectable ? 1 : 0)}
                  className="px-4 py-8 text-center"
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      Loading...
                    </span>
                  </div>
                </td>
              </tr>
            ) : (sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (config.selectable ? 1 : 0)}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No data available
                </td>
              </tr>
            ) : (
              sortedData.map((row, index) => (
                <tr key={index} className="hover:bg-muted/50 transition-colors">
                  {config.selectable && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(index)}
                        onChange={(e) =>
                          handleSelectRow(index, e.target.checked)
                        }
                        className="rounded border-border"
                        aria-label={`Select row ${index + 1}`}
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        cellStyles(),
                        column.align === "center" && "text-center",
                        column.align === "right" && "text-right",
                      )}
                    >
                      {column.cell
                        ? column.cell(
                            (row as Record<string, unknown>)[
                              column.accessorKey || column.key
                            ] || (row as Record<string, unknown>)[column.key],
                            row,
                          )
                        : formatCellValue(
                            (row as Record<string, unknown>)[
                              column.accessorKey || column.key
                            ] || (row as Record<string, unknown>)[column.key],
                            column.format,
                          )}
                    </td>
                  ))}
                </tr>
              ))
            ))}
          </tbody>
        </table>
      </Tag>
    );
  },
  "SmartTable",
);

// Pagination Component
export interface PaginationProperties {
  config: PaginationConfig;
  className?: string;
}

const paginationStyles = createAccessibilityVariants({
  beautiful: {
    base: "flex items-center justify-between px-4 py-3 bg-card border-t border-border",
  },
  wcagAAA: {
    base: "flex items-center justify-between px-4 py-4 bg-card border-t-2 border-border",
  },
});

export const SmartTablePagination = createPolymorphic<
  "div",
  PaginationProperties
>(({ as, config, className, ...props }, ref) => {
  const localReference = React.useRef<HTMLDivElement>(null);
  const composedReference = composeReferences(localReference, ref);

  const { page, pageSize, total, onPageChange, onPageSizeChange } = config;
  const totalPages = Math.ceil(total / pageSize);
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  // Dual-mode data attributes
  const dataProperties = createDualModeProperties(
    {
      "data-pagination": "true",
      "data-page": page,
      "data-total-pages": totalPages,
    },
    {
      "data-pagination": "true",
      "data-page": page,
      "data-total-pages": totalPages,
      "data-wcag-compliant": "true",
      role: "navigation",
      "aria-label": "Table pagination",
    },
  );

  const Tag = (as ?? "div") as "div";

  return (
    <Tag
      ref={composedReference}
      className={cn(paginationStyles(), className)}
      {...dataProperties}
      {...props}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Showing {startItem} to {endItem} of {total} results
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          Previous
        </button>

        <span className="px-3 py-1 text-sm">
          Page {page} of {totalPages}
        </span>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          Next
        </button>
      </div>
    </Tag>
  );
}, "Pagination");

/**
 * USAGE EXAMPLES:
 *
 * // Basic table
 * <SmartTable
 *   data={tableData}
 *   columns={[
 *     { key: "name", header: "Name", sortable: true },
 *     { key: "email", header: "Email", sortable: true },
 *     { key: "amount", header: "Amount", format: "currency", align: "right" }
 *   ]}
 *   config={{ sortable: true, selectable: true }}
 * />
 *
 * // With pagination
 * <SmartTable
 *   data={paginatedData}
 *   columns={columns}
 *   config={{ pagination: true, pageSize: 10 }}
 * />
 * <Pagination config={paginationConfig} />
 */
