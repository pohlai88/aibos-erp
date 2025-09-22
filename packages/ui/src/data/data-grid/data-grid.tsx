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

// Data Grid Types
export interface DataGridComponentProperties {
  /** Data to display */
  data: DataGridRow[];
  /** Column definitions */
  columns: DataGridColumn[];
  /** Whether to enable sorting */
  enableSorting?: boolean;
  /** Whether to enable filtering */
  enableFiltering?: boolean;
  /** Whether to enable pagination */
  enablePagination?: boolean;
  /** Whether to enable selection */
  enableSelection?: boolean;
  /** Whether to enable resizing */
  enableResizing?: boolean;
  /** Whether to enable reordering */
  enableReordering?: boolean;
  /** Whether to enable grouping */
  enableGrouping?: boolean;
  /** Whether to enable virtualization */
  enableVirtualization?: boolean;
  /** Page size */
  pageSize?: number;
  /** Current page */
  currentPage?: number;
  /** Total pages */
  totalPages?: number;
  /** Loading state */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Custom class name */
  className?: string;
}

export interface DataGridRow {
  /** Row ID */
  id: string;
  /** Row data */
  data: Record<string, unknown>;
  /** Row selected state */
  selected?: boolean;
  /** Row disabled state */
  disabled?: boolean;
  /** Row expanded state */
  expanded?: boolean;
  /** Row level (for grouping) */
  level?: number;
  /** Row parent ID (for grouping) */
  parentId?: string;
}

export interface DataGridColumn {
  /** Column ID */
  id: string;
  /** Column header text */
  headerText: string;
  /** Column accessor key */
  accessorKey: string;
  /** Column width */
  width?: number;
  /** Column min width */
  minWidth?: number;
  /** Column max width */
  maxWidth?: number;
  /** Column sortable */
  sortable?: boolean;
  /** Column filterable */
  filterable?: boolean;
  /** Column resizable */
  resizable?: boolean;
  /** Column reorderable */
  reorderable?: boolean;
  /** Column groupable */
  groupable?: boolean;
  /** Column cell renderer */
  cell?: (value: unknown, row: DataGridRow) => React.ReactNode;
  /** Column header renderer */
  headerRenderer?: (column: DataGridColumn) => React.ReactNode;
  /** Column filter renderer */
  filter?: (column: DataGridColumn, value: unknown, onChange: (value: unknown) => void) => React.ReactNode;
  /** Column sort direction */
  sortDirection?: "asc" | "desc" | null;
  /** Column filter value */
  filterValue?: unknown;
  /** Column pinned */
  pinned?: "left" | "right" | null;
  /** Column visible */
  visible?: boolean;
}

export interface DataGridSort {
  /** Sort column */
  column: string;
  /** Sort direction */
  direction: "asc" | "desc";
}

export interface DataGridFilter {
  /** Filter column */
  column: string;
  /** Filter operator */
  operator: "equals" | "notEquals" | "contains" | "notContains" | "startsWith" | "endsWith" | "greaterThan" | "lessThan" | "between" | "in" | "notIn";
  /** Filter value */
  value: unknown;
}

export interface DataGridGroup {
  /** Group column */
  column: string;
  /** Group level */
  level: number;
  /** Group expanded */
  expanded: boolean;
}

export interface DataGridPagination {
  /** Current page */
  page: number;
  /** Page size */
  size: number;
  /** Total items */
  total: number;
  /** Total pages */
  totalPages: number;
}

export interface DataGridSelection {
  /** Selected row IDs */
  selectedRows: string[];
  /** Selection mode */
  mode: "single" | "multiple" | "none";
}

export interface DataGridAnalyticsEvent {
  type: "sort" | "filter" | "paginate" | "select" | "resize" | "reorder" | "group" | "export" | "import";
  payload: {
    column?: string;
    value?: unknown;
    page?: number;
    size?: number;
    timestamp: number;
  };
}

// Styles for Data Grid
const dataGridStyles = variants({
  base: "w-full border border-border rounded-lg overflow-hidden bg-card",
  variants: {
    variant: {
      default: "border-border",
      minimal: "border-border/50",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const dataGridHeaderStyles = variants({
  base: "bg-muted/50 border-b border-border",
  variants: {
    variant: {
      default: "bg-muted/50",
      minimal: "bg-muted/30",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const dataGridHeaderCellStyles = variants({
  base: "px-4 py-3 text-left text-sm font-medium text-foreground border-r border-border last:border-r-0",
  variants: {
    variant: {
      default: "text-foreground",
      minimal: "text-foreground/90",
    },
    sortable: {
      true: "cursor-pointer hover:bg-accent/50 select-none",
      false: "cursor-default",
    },
    sorted: {
      true: "bg-accent/50",
      false: "",
    },
  },
  defaultVariants: {
    variant: "default",
    sortable: "false",
    sorted: "false",
  },
});

const dataGridBodyStyles = variants({
  base: "divide-y divide-border",
  variants: {
    variant: {
      default: "divide-border",
      minimal: "divide-border/50",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const dataGridRowStyles = variants({
  base: "hover:bg-accent/50 transition-colors",
  variants: {
    variant: {
      default: "hover:bg-accent/50",
      minimal: "hover:bg-accent/30",
    },
    selected: {
      true: "bg-accent text-accent-foreground",
      false: "",
    },
    disabled: {
      true: "opacity-50 cursor-not-allowed",
      false: "",
    },
  },
  defaultVariants: {
    variant: "default",
    selected: "false",
    disabled: "false",
  },
});

const dataGridCellStyles = variants({
  base: "px-4 py-3 text-sm text-foreground border-r border-border last:border-r-0",
  variants: {
    variant: {
      default: "text-foreground",
      minimal: "text-foreground/90",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const dataGridFooterStyles = variants({
  base: "bg-muted/50 border-t border-border px-4 py-3",
  variants: {
    variant: {
      default: "bg-muted/50",
      minimal: "bg-muted/30",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const dataGridPaginationStyles = variants({
  base: "flex items-center justify-between",
  variants: {
    variant: {
      default: "",
      minimal: "",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const dataGridPaginationButtonStyles = variants({
  base: "inline-flex items-center px-3 py-2 text-sm font-medium border border-border rounded-md bg-background text-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed",
  variants: {
    variant: {
      default: "border-border",
      primary: "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

// Data Grid Component
export const DataGrid = createPolymorphic<"div", DataGridComponentProperties>(
  ({
    as,
    data,
    columns,
    enableSorting = true,
    enableFiltering = true,
    enablePagination = true,
    enableSelection = true,
    enableResizing = true,
    enableReordering = true,
    enableGrouping = false,
    enableVirtualization = false,
    pageSize = 10,
    currentPage = 1,
    totalPages = 1,
    loading = false,
    emptyMessage = "No data available",
    className,
    ...props
  }: PolymorphicProperties<"div", DataGridComponentProperties>, ref: PolymorphicReference<"div">) => {
    const [sort, setSort] = React.useState<DataGridSort | null>(null);
    const [filters, setFilters] = React.useState<DataGridFilter[]>([]);
    const [selection, setSelection] = React.useState<DataGridSelection>({
      selectedRows: [],
      mode: "multiple",
    });
    const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());
    const [columnWidths, setColumnWidths] = React.useState<Record<string, number>>({});
    const [columnOrder, setColumnOrder] = React.useState<string[]>(columns.map(col => col.id));

    // Process data
    const processedData = React.useMemo(() => {
      let result = [...data];

      // Apply sorting
      if (sort) {
        result.sort((a, b) => {
          const aValue = a.data[sort.column];
          const bValue = b.data[sort.column];
          
          // Convert to comparable values
          const aStr = String(aValue || "");
          const bStr = String(bValue || "");
          
          if (aStr < bStr) return sort.direction === "asc" ? -1 : 1;
          if (aStr > bStr) return sort.direction === "asc" ? 1 : -1;
          return 0;
        });
      }

      // Apply filters
      if (filters.length > 0) {
        result = result.filter(row => {
          return filters.every(filter => {
            const value = row.data[filter.column];
            switch (filter.operator) {
              case "equals":
                return value === filter.value;
              case "notEquals":
                return value !== filter.value;
              case "contains":
                return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
              case "notContains":
                return !String(value).toLowerCase().includes(String(filter.value).toLowerCase());
              case "startsWith":
                return String(value).toLowerCase().startsWith(String(filter.value).toLowerCase());
              case "endsWith":
                return String(value).toLowerCase().endsWith(String(filter.value).toLowerCase());
              case "greaterThan":
                return Number(value) > Number(filter.value);
              case "lessThan":
                return Number(value) < Number(filter.value);
              case "between":
                const [min, max] = Array.isArray(filter.value) ? filter.value : [0, 0];
                return Number(value) >= min && Number(value) <= max;
              case "in":
                return Array.isArray(filter.value) && filter.value.includes(value);
              case "notIn":
                return Array.isArray(filter.value) && !filter.value.includes(value);
              default:
                return true;
            }
          });
        });
      }

      return result;
    }, [data, sort, filters]);

    // Paginated data
    const paginatedData = React.useMemo(() => {
      if (!enablePagination) return processedData;
      
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize;
      return processedData.slice(start, end);
    }, [processedData, currentPage, pageSize, enablePagination]);

    // Handle sort
    const handleSort = React.useCallback((columnId: string) => {
      if (!enableSorting) return;
      
      const column = columns.find(col => col.id === columnId);
      if (!column?.sortable) return;
      
      setSort(prev => {
        if (prev?.column === columnId) {
          return prev.direction === "asc" 
            ? { column: columnId, direction: "desc" }
            : null;
        }
        return { column: columnId, direction: "asc" };
      });
    }, [enableSorting, columns]);

    // Handle filter
    const handleFilter = React.useCallback((columnId: string, operator: DataGridFilter["operator"], value: unknown) => {
      if (!enableFiltering) return;
      
      setFilters(prev => {
        const newFilters = prev.filter(f => f.column !== columnId);
        if (value !== null && value !== undefined && value !== "") {
          newFilters.push({ column: columnId, operator, value });
        }
        return newFilters;
      });
    }, [enableFiltering]);

    // Handle selection
    const handleSelection = React.useCallback((rowId: string, selected: boolean) => {
      if (!enableSelection) return;
      
      setSelection(prev => {
        if (selection.mode === "single") {
          return {
            ...prev,
            selectedRows: selected ? [rowId] : [],
          };
        }
        
        const newSelectedRows = selected
          ? [...prev.selectedRows, rowId]
          : prev.selectedRows.filter(id => id !== rowId);
        
        return {
          ...prev,
          selectedRows: newSelectedRows,
        };
      });
    }, [enableSelection, selection.mode]);

    // Handle select all
    const handleSelectAll = React.useCallback((selected: boolean) => {
      if (!enableSelection) return;
      
      setSelection(prev => ({
        ...prev,
        selectedRows: selected ? paginatedData.map(row => row.id) : [],
      }));
    }, [enableSelection, paginatedData]);

    // Handle row expansion
    const handleRowExpansion = React.useCallback((rowId: string) => {
      setExpandedRows(prev => {
        const newSet = new Set(prev);
        if (newSet.has(rowId)) {
          newSet.delete(rowId);
        } else {
          newSet.add(rowId);
        }
        return newSet;
      });
    }, []);

    // Handle column resize
    const handleColumnResize = React.useCallback((columnId: string, width: number) => {
      if (!enableResizing) return;
      
      setColumnWidths(prev => ({
        ...prev,
        [columnId]: width,
      }));
    }, [enableResizing]);

    // Handle column reorder
    const handleColumnReorder = React.useCallback((fromIndex: number, toIndex: number) => {
      if (!enableReordering) return;
      
      setColumnOrder(prev => {
        const newOrder = [...prev];
        const [removed] = newOrder.splice(fromIndex, 1);
        if (removed) {
          newOrder.splice(toIndex, 0, removed);
        }
        return newOrder;
      });
    }, [enableReordering]);

    // Get column width
    const getColumnWidth = React.useCallback((column: DataGridColumn) => {
      return columnWidths[column.id] || column.width || 150;
    }, [columnWidths]);

    // Render cell
    const renderCell = React.useCallback((column: DataGridColumn, row: DataGridRow) => {
      const value = row.data[column.accessorKey];
      
      if (column.cell) {
        return column.cell(value, row);
      }
      
      return (
        <div className={cn(dataGridCellStyles({ variant: "default" }))}>
          {value !== null && value !== undefined ? String(value) : ""}
        </div>
      );
    }, []);

    // Render header
    const renderHeader = React.useCallback((column: DataGridColumn) => {
      if (column.headerRenderer) {
        return column.headerRenderer(column);
      }
      
      return (
        <div className="flex items-center gap-2">
          <span>{column.headerText}</span>
          {enableSorting && column.sortable && (
            <div className="flex flex-col">
              <svg
                className={cn(
                  "h-3 w-3",
                  sort?.column === column.id && sort.direction === "asc" ? "text-primary" : "text-muted-foreground"
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              <svg
                className={cn(
                  "h-3 w-3 -mt-1",
                  sort?.column === column.id && sort.direction === "desc" ? "text-primary" : "text-muted-foreground"
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          )}
        </div>
      );
    }, [enableSorting, sort]);

    const Component = as || "div";

    return (
      <Component
        ref={ref}
        className={cn(dataGridStyles({ variant: "default" }), className)}
        {...props}
      >
        {/* Header */}
        <div className={cn(dataGridHeaderStyles({ variant: "default" }))}>
          <div className="flex">
            {enableSelection && (
              <div className="px-4 py-3 border-r border-border">
                <input
                  type="checkbox"
                  checked={selection.selectedRows.length === paginatedData.length && paginatedData.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-border"
                />
              </div>
            )}
            {columnOrder.map(columnId => {
              const column = columns.find(col => col.id === columnId);
              if (!column || !column.visible) return null;
              
              return (
                <div
                  key={column.id}
                  className={cn(
                    dataGridHeaderCellStyles({
                      variant: "default",
                      sortable: column.sortable ? "true" : "false",
                      sorted: sort?.column === column.id ? "true" : "false",
                    })
                  )}
                  style={{ width: getColumnWidth(column) }}
                  onClick={() => handleSort(column.id)}
                >
                  {renderHeader(column)}
                </div>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className={cn(dataGridBodyStyles({ variant: "default" }))}>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            paginatedData.map(row => (
              <div
                key={row.id}
                className={cn(
                  dataGridRowStyles({
                    variant: "default",
                    selected: selection.selectedRows.includes(row.id) ? "true" : "false",
                    disabled: row.disabled ? "true" : "false",
                  })
                )}
              >
                <div className="flex">
                  {enableSelection && (
                    <div className="px-4 py-3 border-r border-border">
                      <input
                        type="checkbox"
                        checked={selection.selectedRows.includes(row.id)}
                        onChange={(e) => handleSelection(row.id, e.target.checked)}
                        className="rounded border-border"
                        disabled={row.disabled}
                      />
                    </div>
                  )}
                  {columnOrder.map(columnId => {
                    const column = columns.find(col => col.id === columnId);
                    if (!column || !column.visible) return null;
                    
                    return (
                      <div
                        key={column.id}
                        className={cn(dataGridCellStyles({ variant: "default" }))}
                        style={{ width: getColumnWidth(column) }}
                      >
                        {renderCell(column, row)}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {enablePagination && (
          <div className={cn(dataGridFooterStyles({ variant: "default" }))}>
            <div className={cn(dataGridPaginationStyles({ variant: "default" }))}>
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, processedData.length)} of {processedData.length} entries
              </div>
              <div className="flex items-center gap-2">
                <button
                  className={cn(dataGridPaginationButtonStyles({ variant: "default" }))}
                  disabled={currentPage <= 1}
                >
                  Previous
                </button>
                <span className="text-sm text-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className={cn(dataGridPaginationButtonStyles({ variant: "default" }))}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </Component>
    );
  },
  "DataGrid"
);

// Export styles for external use
export const dataGridVariants = {
  dataGridStyles,
  dataGridHeaderStyles,
  dataGridHeaderCellStyles,
  dataGridBodyStyles,
  dataGridRowStyles,
  dataGridCellStyles,
  dataGridFooterStyles,
  dataGridPaginationStyles,
  dataGridPaginationButtonStyles,
};
