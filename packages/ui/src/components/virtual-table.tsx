import React, { useMemo, useRef, useState, useEffect, useCallback, type ReactNode, type HTMLAttributes, type ElementType } from 'react';
import { cn, variants, createPolymorphic, type PolymorphicReference } from '../utils';

export interface VirtualTableColumn<T> {
  key: keyof T | string;
  header: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  resizable?: boolean;
  render?: (value: unknown, row: T, index: number) => ReactNode;
  className?: string;
}

export interface VirtualTableProps<T> extends HTMLAttributes<HTMLDivElement> {
  data: T[];
  columns: VirtualTableColumn<T>[];
  height?: number;
  rowHeight?: number;
  overscan?: number;
  className?: string;
  onRowClick?: (row: T, index: number) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  loading?: boolean;
  emptyMessage?: string;
  selectedRowIndex?: number;
  stickyHeader?: boolean;
  enableRowSelection?: boolean;
  onSelectionChange?: (selectedRows: T[]) => void;
  variant?: 'default' | 'bordered' | 'striped';
  size?: 'sm' | 'md' | 'lg';
  as?: ElementType;
}

interface VirtualTableState {
  scrollTop: number;
  containerHeight: number;
  startIndex: number;
  endIndex: number;
  visibleRows: number;
}

const virtualTableVariants = variants({
  base: 'relative overflow-hidden rounded-lg border border-semantic-border',
  variants: {
    variant: {
      default: 'border-semantic-border',
      bordered: 'border-2 border-semantic-border',
      striped: 'border-semantic-border',
    },
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    },
  },
  defaultVariants: { variant: 'default', size: 'md' },
  strict: true,
});

const tableHeaderVariants = variants({
  base: 'sticky top-0 z-10 border-b border-semantic-border bg-semantic-background',
  variants: {
    size: {
      sm: 'p-1',
      md: 'p-2',
      lg: 'p-3',
    },
  },
  defaultVariants: { size: 'md' },
  strict: true,
});

const tableRowVariants = variants({
  base: 'flex items-center border-b border-semantic-border transition-colors',
  variants: {
    variant: {
      default: 'hover:bg-semantic-muted',
      bordered: 'hover:bg-semantic-muted border-l-2 border-r-2',
      striped: 'hover:bg-semantic-muted',
    },
    size: {
      sm: 'h-8',
      md: 'h-10',
      lg: 'h-12',
    },
    state: {
      default: '',
      selected: 'border-semantic-primary bg-semantic-accent',
      hover: 'bg-semantic-muted',
    },
  },
  defaultVariants: { variant: 'default', size: 'md', state: 'default' },
  strict: true,
});

const tableCellVariants = variants({
  base: 'flex items-center border-r border-semantic-border text-semantic-foreground',
  variants: {
    size: {
      sm: 'p-1 text-xs',
      md: 'p-2 text-sm',
      lg: 'p-3 text-base',
    },
  },
  defaultVariants: { size: 'md' },
  strict: true,
});

const sortButtonVariants = variants({
  base: 'flex items-center border-r border-semantic-border bg-semantic-muted text-sm font-medium text-semantic-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-semantic-primary',
  variants: {
    size: {
      sm: 'p-1',
      md: 'p-2',
      lg: 'p-3',
    },
    state: {
      default: 'hover:bg-semantic-muted/80',
      active: 'bg-semantic-accent',
    },
  },
  defaultVariants: { size: 'md', state: 'default' },
  strict: true,
});

/**
 * Virtual Table Component for Large Datasets
 *
 * Provides efficient rendering of large datasets (100k+ rows) using virtual scrolling.
 * Only renders visible rows plus a small buffer for smooth scrolling.
 *
 * Features:
 * - Virtual scrolling for performance
 * - Column resizing and sorting
 * - Row selection
 * - Sticky headers
 * - Loading states
 * - Accessibility support
 * - Enhanced styling with variants
 */
export const VirtualTable = createPolymorphic<'div', VirtualTableProps<any>>(
  <T extends Record<string, unknown>>({
    as: Component = 'div',
    data,
    columns,
    height = 400,
    rowHeight = 40,
    overscan = 5,
    className,
    onRowClick,
    onSort,
    loading = false,
    emptyMessage = 'No data available',
    selectedRowIndex,
    stickyHeader = true,
    enableRowSelection = false,
    onSelectionChange,
    variant = 'default',
    size = 'md',
    ...props
  }: VirtualTableProps<T>, ref: PolymorphicReference<'div'>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(height);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const rafId = useRef<number | null>(null);

  // Calculate virtual scrolling parameters
  const virtualState = useMemo((): VirtualTableState => {
    const totalRows = data.length;
    const visibleRows = Math.ceil(containerHeight / rowHeight);
    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const endIndex = Math.min(totalRows - 1, startIndex + visibleRows + overscan * 2);

    return {
      scrollTop,
      containerHeight,
      startIndex,
      endIndex,
      visibleRows,
    };
  }, [scrollTop, containerHeight, rowHeight, data.length, overscan]);

  // Handle scroll events
  const handleScroll = useCallback((_event: React.UIEvent<HTMLDivElement>): void => {
    const el = containerRef.current;
    if (!el) return;
    if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      setScrollTop(el.scrollTop);
      rafId.current = null;
    });
  }, []);

  // Handle container resize
  useEffect(() => {
    const compute = (): void => {
      const headerH = stickyHeader ? (headerRef.current?.offsetHeight ?? 0) : 0;
      setContainerHeight(Math.max(0, height - headerH));
    };
    compute();
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined' && headerRef.current) {
      ro = new ResizeObserver(() => compute());
      ro.observe(headerRef.current);
    }
    return () => {
      ro?.disconnect();
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, [height, stickyHeader, size]);

  // Handle sorting
  const handleSort = (columnKey: string): void => {
    if (!onSort) return;

    const newDirection = sortColumn === columnKey && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(columnKey);
    setSortDirection(newDirection);
    onSort(columnKey, newDirection);
  };

  // Handle row selection
  const handleRowSelection = (index: number, checked: boolean): void => {
    if (!enableRowSelection || !onSelectionChange) return;

    const newSelection = new Set(selectedRows);
    if (checked) {
      newSelection.add(index);
    } else {
      newSelection.delete(index);
    }
    setSelectedRows(newSelection);

    const selectedData = Array.from(newSelection)
      .map((index_) => data.at(index_))
      .filter((item): item is T => item !== undefined);

    onSelectionChange(selectedData);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean): void => {
    if (!enableRowSelection || !onSelectionChange) return;

    const newSelection = checked ? new Set(data.map((_, index) => index)) : new Set<number>();
    setSelectedRows(newSelection);
    onSelectionChange(checked ? data : []);
  };

  // Render cell content
  const renderCell = (column: VirtualTableColumn<T>, row: T, index: number): ReactNode => {
    if (column.render) {
      return column.render(row[column.key as keyof T] as unknown, row, index);
    }
    const value = row[column.key as keyof T];
    return value == null ? '' : String(value);
  };

  // Calculate total height for scrollbar
  const totalHeight = data.length * rowHeight;

  // Render visible rows
  const visibleData = data
    .slice(virtualState.startIndex, virtualState.endIndex + 1)
    .filter((row): row is T => row !== undefined);

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ height }} {...props}>
        <div className="flex flex-col items-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-semantic-primary border-t-transparent" />
          <p className="text-sm text-semantic-muted-foreground">Loading data...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ height }} {...props}>
        <p className="text-sm text-semantic-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <Component
      ref={ref}
      className={cn(
        virtualTableVariants({ 
          variant: variant as 'default' | 'bordered' | 'striped' | undefined,
          size: size as 'sm' | 'md' | 'lg' | undefined
        }),
        className
      )}
      role="grid"
      aria-rowcount={data.length}
      aria-colcount={columns.length + (enableRowSelection ? 1 : 0)}
      aria-multiselectable={enableRowSelection || undefined}
      {...props}
    >
      {/* Header */}
      {stickyHeader && (
        <div ref={headerRef} className={cn(tableHeaderVariants({ size: size as 'sm' | 'md' | 'lg' | undefined }))} role="row">
          <div className="flex">
            {enableRowSelection && (
              <div
                className="flex items-center justify-center border-r border-semantic-border p-2"
                style={{ width: 50 }}
              >
                <input
                  type="checkbox"
                  checked={selectedRows.size === data.length && data.length > 0}
                  onChange={(event) => handleSelectAll(event.target.checked)}
                  className="rounded border-semantic-border text-semantic-primary focus:ring-semantic-primary"
                  aria-label="Select all rows"
                />
              </div>
            )}
            {columns.map((column) =>
              column.sortable ? (
                  <button
                    key={String(column.key)}
                    type="button"
                    className={cn(
                      sortButtonVariants({ 
                        size: size as 'sm' | 'md' | 'lg' | undefined,
                        state: (sortColumn === column.key ? 'active' : 'default') as 'default' | 'active' | undefined
                      }),
                      column.className,
                    )}
                    style={{ width: column.width || 150 }}
                    onClick={() => handleSort(String(column.key))}
                    role="columnheader"
                    aria-sort={
                      sortColumn === column.key
                        ? (sortDirection === 'asc' ? 'ascending' : 'descending')
                        : 'none'
                    }
                  >
                  <span className="flex-1 truncate text-left">{column.header}</span>
                  <div className="ml-2 flex flex-col">
                    <svg
                      className={cn(
                        'h-3 w-3',
                        sortColumn === column.key && sortDirection === 'asc'
                          ? 'text-semantic-primary'
                          : 'text-semantic-muted-foreground',
                      )}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                    <svg
                      className={cn(
                        '-mt-1 h-3 w-3',
                        sortColumn === column.key && sortDirection === 'desc'
                          ? 'text-semantic-primary'
                          : 'text-semantic-muted-foreground',
                      )}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
                    </svg>
                  </div>
                </button>
              ) : (
                <div
                  key={String(column.key)}
                  className={cn(
                    tableCellVariants({ size: size as 'sm' | 'md' | 'lg' | undefined }),
                    'bg-semantic-muted font-medium',
                    column.className,
                  )}
                  style={{ width: column.width || 150 }}
                  role="columnheader"
                  aria-sort="none"
                >
                  <span className="flex-1 truncate">{column.header}</span>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {/* Virtual Scrolling Container */}
        <div
          ref={containerRef}
          className="overflow-auto"
          style={{ height: containerHeight }}
          onScroll={handleScroll}
        >
        {/* Virtual spacer for total height */}
        <div style={{ height: totalHeight, position: 'relative' }}>
          {/* Visible rows */}
          <div
            style={{
              transform: `translateY(${virtualState.startIndex * rowHeight}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
            }}
          >
            {visibleData.map((row, index) => {
              const actualIndex = virtualState.startIndex + index;
              const isSelected = selectedRows.has(actualIndex);
              const isRowSelected = selectedRowIndex === actualIndex;

              return onRowClick ? (
                <div
                  key={actualIndex}
                  className={cn(
                    tableRowVariants({
                      variant: variant as 'default' | 'bordered' | 'striped' | undefined,
                      size: size as 'sm' | 'md' | 'lg' | undefined,
                      state: (isRowSelected ? 'selected' : 'default') as 'default' | 'selected' | 'hover' | undefined
                    }),
                    'w-full focus:outline-none focus:ring-2 focus:ring-semantic-primary',
                  )}
                  style={{ height: rowHeight }}
                  role="row"
                  aria-selected={isRowSelected || undefined}
                  tabIndex={0}
                  onClick={() => onRowClick(row, actualIndex)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onRowClick(row, actualIndex);
                    }
                  }}
                >
                  {enableRowSelection && (
                    <div
                      className="flex items-center justify-center border-r border-semantic-border p-2"
                      style={{ width: 50 }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(event) => handleRowSelection(actualIndex, event.target.checked)}
                        className="rounded border-semantic-border text-semantic-primary focus:ring-semantic-primary"
                        onClick={(event) => event.stopPropagation()}
                        aria-label={`Select row ${actualIndex + 1}`}
                      />
                    </div>
                  )}
                  {columns.map((column) => (
                    <div
                      key={String(column.key)}
                      className={cn(
                        tableCellVariants({ size: size as 'sm' | 'md' | 'lg' | undefined }),
                        column.className,
                      )}
                      style={{ width: column.width || 150 }}
                    >
                      <span className="truncate">{renderCell(column, row, actualIndex)}</span>
                    </div>
                  ))}
                </div>
                ) : (
                  <div
                    key={actualIndex}
                    className={cn(
                      tableRowVariants({
                        variant: variant as 'default' | 'bordered' | 'striped' | undefined,
                        size: size as 'sm' | 'md' | 'lg' | undefined,
                        state: (isRowSelected ? 'selected' : 'default') as 'default' | 'selected' | 'hover' | undefined
                      }),
                    )}
                    style={{ height: rowHeight }}
                    role="row"
                    aria-selected={isRowSelected || undefined}
                  >
                  {enableRowSelection && (
                    <div
                      className="flex items-center justify-center border-r border-semantic-border p-2"
                      style={{ width: 50 }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(event) => {
                          event.stopPropagation();
                          handleRowSelection(actualIndex, event.target.checked);
                        }}
                        className="rounded border-semantic-border text-semantic-primary focus:ring-semantic-primary"
                        aria-label={`Select row ${actualIndex + 1}`}
                      />
                    </div>
                  )}
                    {columns.map((column) => (
                      <div
                        key={String(column.key)}
                        className={cn(
                          tableCellVariants({ size: size as 'sm' | 'md' | 'lg' | undefined }),
                          column.className,
                        )}
                        style={{ width: column.width || 150 }}
                        role="gridcell"
                      >
                        <span className="truncate">{renderCell(column, row, actualIndex)}</span>
                      </div>
                    ))}
                  </div>
              );
            })}
          </div>
        </div>
      </div>
    </Component>
  );
  },
  'VirtualTable'
);

export interface VirtualTableHeaderProps extends HTMLAttributes<HTMLDivElement> {
  columns: VirtualTableColumn<any>[];
  enableRowSelection?: boolean;
  selectedRows?: Set<number>;
  dataLength?: number;
  onSelectAll?: (checked: boolean) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  as?: ElementType;
}

/**
 * Virtual table header component with enhanced styling
 */
export const VirtualTableHeader = createPolymorphic<'div', VirtualTableHeaderProps>(
  ({
    as: Component = 'div',
    columns,
    enableRowSelection = false,
    selectedRows = new Set(),
    dataLength = 0,
    onSelectAll,
    onSort,
    sortColumn,
    sortDirection = 'asc',
    size = 'md',
    className,
    ...props
  }, ref) => {
  return (
    <Component
      ref={ref}
      className={cn(tableHeaderVariants({ size: size as 'sm' | 'md' | 'lg' | undefined }), className)}
      {...props}
    >
      <div className="flex">
        {enableRowSelection && (
          <div
            className="flex items-center justify-center border-r border-semantic-border p-2"
            style={{ width: 50 }}
          >
            <input
              type="checkbox"
              checked={selectedRows.size === dataLength && dataLength > 0}
              onChange={(event) => onSelectAll?.(event.target.checked)}
              className="rounded border-semantic-border text-semantic-primary focus:ring-semantic-primary"
              aria-label="Select all rows"
            />
          </div>
        )}
        {columns.map((column) =>
          column.sortable ? (
            <button
              key={String(column.key)}
              type="button"
              className={cn(
                sortButtonVariants({ 
                  size: size as 'sm' | 'md' | 'lg' | undefined,
                  state: (sortColumn === column.key ? 'active' : 'default') as 'default' | 'active' | undefined
                }),
                column.className,
              )}
              style={{ width: column.width || 150 }}
              onClick={() => onSort?.(String(column.key), sortColumn === column.key && sortDirection === 'asc' ? 'desc' : 'asc')}
            >
              <span className="flex-1 truncate text-left">{column.header}</span>
              <div className="ml-2 flex flex-col">
                <svg
                  className={cn(
                    'h-3 w-3',
                    sortColumn === column.key && sortDirection === 'asc'
                      ? 'text-semantic-primary'
                      : 'text-semantic-muted-foreground',
                  )}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
                <svg
                  className={cn(
                    '-mt-1 h-3 w-3',
                    sortColumn === column.key && sortDirection === 'desc'
                      ? 'text-semantic-primary'
                      : 'text-semantic-muted-foreground',
                  )}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
                </svg>
              </div>
            </button>
          ) : (
            <div
              key={String(column.key)}
              className={cn(
                tableCellVariants({ size: size as 'sm' | 'md' | 'lg' | undefined }),
                'bg-semantic-muted font-medium',
                column.className,
              )}
              style={{ width: column.width || 150 }}
            >
              <span className="flex-1 truncate">{column.header}</span>
            </div>
          ),
        )}
      </div>
    </Component>
  );
  },
  'VirtualTableHeader'
);

export interface VirtualTableRowProps<T> extends HTMLAttributes<HTMLDivElement> {
  row: T;
  index: number;
  columns: VirtualTableColumn<T>[];
  isSelected?: boolean;
  isRowSelected?: boolean;
  enableRowSelection?: boolean;
  onRowClick?: (row: T, index: number) => void;
  onRowSelection?: (index: number, checked: boolean) => void;
  variant?: 'default' | 'bordered' | 'striped';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  as?: ElementType;
}

/**
 * Virtual table row component with enhanced styling
 */
export const VirtualTableRow = createPolymorphic<'div', VirtualTableRowProps<any>>(
  <T extends Record<string, unknown>>({
    as: Component = 'div',
    row,
    index,
    columns,
    isSelected = false,
    isRowSelected = false,
    enableRowSelection = false,
    onRowClick,
    onRowSelection,
    variant = 'default',
    size = 'md',
    className,
    ...props
  }: VirtualTableRowProps<T>, ref: PolymorphicReference<'div'>) => {
  // Render cell content
  const renderCell = (column: VirtualTableColumn<T>, row: T, index: number): ReactNode => {
    if (column.render) {
      return column.render(row[column.key as keyof T] as unknown, row, index);
    }
    return String(row[column.key as keyof T]);
  };

  const rowContent = (
    <>
      {enableRowSelection && (
        <div
          className="flex items-center justify-center border-r border-semantic-border p-2"
          style={{ width: 50 }}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(event) => {
              event.stopPropagation();
              onRowSelection?.(index, event.target.checked);
            }}
            className="rounded border-semantic-border text-semantic-primary focus:ring-semantic-primary"
            aria-label={`Select row ${index + 1}`}
          />
        </div>
      )}
      {columns.map((column) => (
        <div
          key={String(column.key)}
          className={cn(
            tableCellVariants({ size: size as 'sm' | 'md' | 'lg' | undefined }),
            column.className,
          )}
          style={{ width: column.width || 150 }}
        >
          <span className="truncate">{renderCell(column, row, index)}</span>
        </div>
      ))}
    </>
  );

  if (onRowClick) {
    return (
      <Component
        ref={ref}
        type="button"
        className={cn(
          tableRowVariants({
            variant: variant as 'default' | 'bordered' | 'striped' | undefined,
            size: size as 'sm' | 'md' | 'lg' | undefined,
            state: (isRowSelected ? 'selected' : 'default') as 'default' | 'selected' | 'hover' | undefined
          }),
          'w-full focus:outline-none focus:ring-2 focus:ring-semantic-primary',
          className,
        )}
        onClick={() => onRowClick(row, index)}
        {...props}
      >
        {rowContent}
      </Component>
    );
  }

  return (
    <Component
      ref={ref}
      className={cn(
        tableRowVariants({
          variant: variant as 'default' | 'bordered' | 'striped' | undefined,
          size: size as 'sm' | 'md' | 'lg' | undefined,
          state: (isRowSelected ? 'selected' : 'default') as 'default' | 'selected' | 'hover' | undefined
        }),
        className,
      )}
      {...props}
    >
      {rowContent}
    </Component>
  );
  },
  'VirtualTableRow'
);

/**
 * Hook for virtual table data management
 */
export function useVirtualTable<T>(
  data: T[],
  options: {
    pageSize?: number;
    sortColumn?: string;
    sortDirection?: 'asc' | 'desc';
    filter?: (row: T) => boolean;
  } = {},
): {
  data: T[];
  totalRows: number;
  filteredRows: number;
} {
  const { sortColumn, sortDirection = 'asc', filter } = options;

  const processedData = useMemo(() => {
    let result = [...data];

    // Apply filter
    if (filter) {
      result = result.filter(filter);
    }

    // Apply sorting
    if (sortColumn) {
      result.sort((a, b) => {
        const aValue = a[sortColumn as keyof T];
        const bValue = b[sortColumn as keyof T];

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, sortColumn, sortDirection, filter]);

  return {
    data: processedData,
    totalRows: data.length,
    filteredRows: processedData.length,
  };
}