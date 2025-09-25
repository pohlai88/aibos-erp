import React, { useMemo, useRef, useState, useEffect } from 'react';
import { cn } from './utils';

export interface VirtualTableColumn<T> {
  key: keyof T | string;
  header: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  resizable?: boolean;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
  className?: string;
}

export interface VirtualTableProps<T> {
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
}

interface VirtualTableState {
  scrollTop: number;
  containerHeight: number;
  startIndex: number;
  endIndex: number;
  visibleRows: number;
}

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
 */
export function VirtualTable<T extends Record<string, unknown>>({
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
}: VirtualTableProps<T>): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(height);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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
  const handleScroll = (event: React.UIEvent<HTMLDivElement>): void => {
    const target = event.currentTarget;
    setScrollTop(target.scrollTop);
  };

  // Handle container resize
  useEffect(() => {
    const updateHeight = (): void => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerHeight(rect.height);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

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
  const renderCell = (column: VirtualTableColumn<T>, row: T, index: number): React.ReactNode => {
    if (column.render) {
      return column.render(row[column.key as keyof T] as unknown, row, index);
    }
    return String(row[column.key as keyof T]);
  };

  // Calculate total height for scrollbar
  const totalHeight = data.length * rowHeight;

  // Render visible rows
  const visibleRows = data
    .slice(virtualState.startIndex, virtualState.endIndex + 1)
    .filter((row): row is T => row !== undefined);

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ height }}>
        <div className="flex flex-col items-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ height }}>
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden rounded-lg border border-gray-200', className)}>
      {/* Header */}
      {stickyHeader && (
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white">
          <div className="flex">
            {enableRowSelection && (
              <div
                className="flex items-center justify-center border-r border-gray-200 p-2"
                style={{ width: 50 }}
              >
                <input
                  type="checkbox"
                  checked={selectedRows.size === data.length && data.length > 0}
                  onChange={(event) => handleSelectAll(event.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                    'flex items-center border-r border-gray-200 bg-gray-50 p-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500',
                    column.className,
                  )}
                  style={{ width: column.width || 150 }}
                  onClick={() => handleSort(String(column.key))}
                >
                  <span className="flex-1 truncate text-left">{column.header}</span>
                  <div className="ml-2 flex flex-col">
                    <svg
                      className={cn(
                        'h-3 w-3',
                        sortColumn === column.key && sortDirection === 'asc'
                          ? 'text-blue-600'
                          : 'text-gray-400',
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
                          ? 'text-blue-600'
                          : 'text-gray-400',
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
                    'flex items-center border-r border-gray-200 bg-gray-50 p-2 text-sm font-medium text-gray-700',
                    column.className,
                  )}
                  style={{ width: column.width || 150 }}
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
        style={{ height: stickyHeader ? height - 40 : height }}
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
            {visibleRows.map((row, index) => {
              const actualIndex = virtualState.startIndex + index;
              const isSelected = selectedRows.has(actualIndex);
              const isRowSelected = selectedRowIndex === actualIndex;

              return onRowClick ? (
                <button
                  key={actualIndex}
                  type="button"
                  className={cn(
                    'flex w-full items-center border-b border-gray-100 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500',
                    isRowSelected && 'border-blue-200 bg-blue-50',
                  )}
                  style={{ height: rowHeight }}
                  onClick={() => onRowClick(row, actualIndex)}
                >
                  {enableRowSelection && (
                    <div
                      className="flex items-center justify-center border-r border-gray-200 p-2"
                      style={{ width: 50 }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(event) => handleRowSelection(actualIndex, event.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        onClick={(event) => event.stopPropagation()}
                        aria-label={`Select row ${actualIndex + 1}`}
                      />
                    </div>
                  )}
                  {columns.map((column) => (
                    <div
                      key={String(column.key)}
                      className={cn(
                        'flex items-center border-r border-gray-200 p-2 text-sm text-gray-900',
                        column.className,
                      )}
                      style={{ width: column.width || 150 }}
                    >
                      <span className="truncate">{renderCell(column, row, actualIndex)}</span>
                    </div>
                  ))}
                </button>
              ) : (
                <div
                  key={actualIndex}
                  className={cn(
                    'flex items-center border-b border-gray-100',
                    isRowSelected && 'border-blue-200 bg-blue-50',
                  )}
                  style={{ height: rowHeight }}
                >
                  {enableRowSelection && (
                    <div
                      className="flex items-center justify-center border-r border-gray-200 p-2"
                      style={{ width: 50 }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(event) => {
                          event.stopPropagation();
                          handleRowSelection(actualIndex, event.target.checked);
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        aria-label={`Select row ${actualIndex + 1}`}
                      />
                    </div>
                  )}
                  {columns.map((column) => (
                    <div
                      key={String(column.key)}
                      className={cn(
                        'flex items-center border-r border-gray-200 p-2 text-sm text-gray-900',
                        column.className,
                      )}
                      style={{ width: column.width || 150 }}
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
    </div>
  );
}

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
