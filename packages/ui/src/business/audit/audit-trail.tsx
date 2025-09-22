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

// Audit Trail Types
export interface AuditTrailComponentProperties {
  /** Audit trail data */
  auditLogs?: AuditLog[];
  /** Callback when audit log is added */
  onAuditLogAdd?: (auditLog: AuditLog) => void;
  /** Callback when audit log is updated */
  onAuditLogUpdate?: (auditLog: AuditLog) => void;
  /** Callback when audit log is deleted */
  onAuditLogDelete?: (auditLogId: string) => void;
  /** Callback when audit log is filtered */
  onAuditLogFilter?: (filters: AuditTrailFilters) => void;
  /** Callback when audit log is exported */
  onAuditLogExport?: (auditLogs: AuditLog[], format: string) => void;
  /** Audit trail configuration */
  configuration?: AuditTrailConfiguration;
  /** Whether to show filters */
  showFilters?: boolean;
  /** Whether to show export */
  showExport?: boolean;
  /** Whether to show pagination */
  showPagination?: boolean;
  /** Whether to enable real-time updates */
  enableRealTime?: boolean;
  /** Whether to enable analytics */
  enableAnalytics?: boolean;
  /** Analytics callback */
  onAnalytics?: (event: AuditTrailAnalyticsEvent) => void;
  /** Custom class name */
  className?: string;
}

export interface AuditLog {
  /** Audit log ID */
  id: string;
  /** Audit log timestamp */
  timestamp: Date;
  /** Audit log user */
  user: AuditUser;
  /** Audit log action */
  action: AuditAction;
  /** Audit log resource */
  resource: AuditResource;
  /** Audit log details */
  details: AuditDetails;
  /** Audit log metadata */
  metadata: AuditMetadata;
  /** Audit log status */
  status: AuditStatus;
  /** Audit log severity */
  severity: AuditSeverity;
  /** Audit log category */
  category: string;
  /** Audit log tags */
  tags: string[];
  /** Audit log source */
  source: AuditSource;
  /** Audit log session */
  session?: AuditSession;
  /** Audit log IP address */
  ipAddress?: string;
  /** Audit log user agent */
  userAgent?: string;
  /** Audit log location */
  location?: AuditLocation;
}

export interface AuditUser {
  /** User ID */
  id: string;
  /** User name */
  name: string;
  /** User email */
  email: string;
  /** User role */
  role: string;
  /** User department */
  department?: string;
  /** User avatar */
  avatar?: string;
}

export interface AuditAction {
  /** Action type */
  type: AuditActionType;
  /** Action name */
  name: string;
  /** Action description */
  description?: string;
  /** Action parameters */
  parameters?: Record<string, unknown>;
  /** Action result */
  result?: AuditActionResult;
}

export interface AuditActionType {
  /** Type name */
  name: string;
  /** Type category */
  category: "create" | "read" | "update" | "delete" | "login" | "logout" | "export" | "import" | "system" | "security";
  /** Type icon */
  icon?: React.ReactNode;
  /** Type color */
  color?: string;
}

export interface AuditActionResult {
  /** Result status */
  status: "success" | "failure" | "warning";
  /** Result message */
  message?: string;
  /** Result data */
  data?: Record<string, unknown>;
  /** Result error */
  error?: string;
}

export interface AuditResource {
  /** Resource type */
  type: string;
  /** Resource ID */
  id: string;
  /** Resource name */
  name: string;
  /** Resource description */
  description?: string;
  /** Resource URL */
  url?: string;
  /** Resource metadata */
  metadata?: Record<string, unknown>;
}

export interface AuditDetails {
  /** Details title */
  title: string;
  /** Details description */
  description?: string;
  /** Details data */
  data?: Record<string, unknown>;
  /** Details changes */
  changes?: AuditChange[];
  /** Details context */
  context?: Record<string, unknown>;
}

export interface AuditChange {
  /** Change field */
  field: string;
  /** Change old value */
  oldValue: unknown;
  /** Change new value */
  newValue: unknown;
  /** Change type */
  type: "added" | "modified" | "removed";
}

export interface AuditMetadata {
  /** Metadata version */
  version: string;
  /** Metadata environment */
  environment: string;
  /** Metadata application */
  application: string;
  /** Metadata module */
  module?: string;
  /** Metadata feature */
  feature?: string;
  /** Metadata custom fields */
  custom?: Record<string, unknown>;
}

export interface AuditStatus {
  /** Status name */
  name: string;
  /** Status description */
  description?: string;
  /** Status color */
  color?: string;
}

export interface AuditSeverity {
  /** Severity level */
  level: "low" | "medium" | "high" | "critical";
  /** Severity weight */
  weight: number;
  /** Severity color */
  color?: string;
}

export interface AuditSource {
  /** Source type */
  type: "web" | "mobile" | "api" | "system" | "batch" | "integration";
  /** Source name */
  name: string;
  /** Source version */
  version?: string;
  /** Source details */
  details?: Record<string, unknown>;
}

export interface AuditSession {
  /** Session ID */
  id: string;
  /** Session start time */
  startTime: Date;
  /** Session end time */
  endTime?: Date;
  /** Session duration */
  duration?: number;
  /** Session metadata */
  metadata?: Record<string, unknown>;
}

export interface AuditLocation {
  /** Location country */
  country?: string;
  /** Location region */
  region?: string;
  /** Location city */
  city?: string;
  /** Location coordinates */
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface AuditTrailConfiguration {
  /** Configuration name */
  name: string;
  /** Configuration description */
  description?: string;
  /** Configuration settings */
  settings: AuditTrailSettings;
  /** Configuration filters */
  filters: AuditTrailFilters;
  /** Configuration pagination */
  pagination: AuditTrailPagination;
  /** Configuration export */
  export: AuditTrailExport;
  /** Configuration real-time */
  realTime: AuditTrailRealTime;
}

export interface AuditTrailSettings {
  /** Settings retention period */
  retentionPeriod?: number;
  /** Settings max log size */
  maxLogSize?: number;
  /** Settings compression */
  compression?: boolean;
  /** Settings encryption */
  encryption?: boolean;
  /** Settings backup */
  backup?: boolean;
}

export interface AuditTrailFilters {
  /** Filter by user */
  userId?: string;
  /** Filter by action */
  actionType?: string;
  /** Filter by resource */
  resourceType?: string;
  /** Filter by status */
  status?: string;
  /** Filter by severity */
  severity?: string;
  /** Filter by category */
  category?: string;
  /** Filter by date range */
  dateRange?: {
    start: Date;
    end: Date;
  };
  /** Filter by tags */
  tags?: string[];
  /** Filter by source */
  source?: string;
  /** Filter by search */
  search?: string;
}

export interface AuditTrailPagination {
  /** Pagination page */
  page: number;
  /** Pagination size */
  size: number;
  /** Pagination total */
  total: number;
  /** Pagination pages */
  pages: number;
}

export interface AuditTrailExport {
  /** Export formats */
  formats: string[];
  /** Export default format */
  defaultFormat: string;
  /** Export include metadata */
  includeMetadata: boolean;
  /** Export compression */
  compression: boolean;
}

export interface AuditTrailRealTime {
  /** Real-time enabled */
  enabled: boolean;
  /** Real-time interval */
  interval: number;
  /** Real-time filters */
  filters: AuditTrailFilters;
}

export interface AuditTrailAnalyticsEvent {
  type: "audit_log_view" | "audit_log_filter" | "audit_log_export" | "audit_log_search" | "audit_log_detail";
  payload: {
    auditLogId?: string;
    filterType?: string;
    exportFormat?: string;
    searchQuery?: string;
    timestamp: number;
  };
}

// Default audit action types
export const defaultAuditActionTypes: AuditActionType[] = [
  {
    name: "create",
    category: "create",
    color: "#10b981",
  },
  {
    name: "read",
    category: "read",
    color: "#3b82f6",
  },
  {
    name: "update",
    category: "update",
    color: "#f59e0b",
  },
  {
    name: "delete",
    category: "delete",
    color: "#ef4444",
  },
  {
    name: "login",
    category: "login",
    color: "#8b5cf6",
  },
  {
    name: "logout",
    category: "logout",
    color: "#6b7280",
  },
  {
    name: "export",
    category: "export",
    color: "#06b6d4",
  },
  {
    name: "import",
    category: "import",
    color: "#84cc16",
  },
];

// Default audit severities
export const defaultAuditSeverities: AuditSeverity[] = [
  { level: "low", weight: 1, color: "#6b7280" },
  { level: "medium", weight: 2, color: "#f59e0b" },
  { level: "high", weight: 3, color: "#ef4444" },
  { level: "critical", weight: 4, color: "#dc2626" },
];

// Styles for Audit Trail
const auditTrailStyles = variants({
  base: "flex flex-col h-full bg-background border border-border rounded-lg",
  variants: {
    variant: {
      default: "border-border",
      minimal: "border-none",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const auditTrailHeaderStyles = variants({
  base: "flex items-center justify-between p-4 border-b border-border bg-muted/50",
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

const auditTrailFiltersStyles = variants({
  base: "p-4 border-b border-border bg-muted/30",
  variants: {
    variant: {
      default: "bg-muted/30",
      minimal: "bg-muted/20",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const auditTrailContentStyles = variants({
  base: "flex-1 overflow-auto",
  variants: {
    variant: {
      default: "overflow-auto",
      minimal: "overflow-hidden",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const auditTrailLogStyles = variants({
  base: "p-4 border-b border-border hover:bg-accent/50 transition-colors",
  variants: {
    severity: {
      low: "border-l-4 border-l-gray-300",
      medium: "border-l-4 border-l-yellow-300",
      high: "border-l-4 border-l-red-300",
      critical: "border-l-4 border-l-red-500 bg-red-50",
    },
    status: {
      success: "text-green-700",
      failure: "text-red-700",
      warning: "text-yellow-700",
    },
  },
  defaultVariants: {
    severity: "low",
    status: "success",
  },
});

const auditTrailLogHeaderStyles = variants({
  base: "flex items-center justify-between mb-2",
  variants: {
    variant: {
      default: "mb-2",
      compact: "mb-1",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const auditTrailLogTitleStyles = variants({
  base: "text-sm font-medium text-foreground",
  variants: {
    variant: {
      default: "text-sm",
      compact: "text-xs",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const auditTrailLogTimestampStyles = variants({
  base: "text-xs text-muted-foreground",
  variants: {
    variant: {
      default: "text-xs",
      compact: "text-xs",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const auditTrailLogDetailsStyles = variants({
  base: "text-sm text-muted-foreground",
  variants: {
    variant: {
      default: "text-sm",
      compact: "text-xs",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const auditTrailLogMetaStyles = variants({
  base: "flex items-center gap-4 mt-2 text-xs text-muted-foreground",
  variants: {
    variant: {
      default: "gap-4",
      compact: "gap-2",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const auditTrailPaginationStyles = variants({
  base: "flex items-center justify-between p-4 border-t border-border bg-muted/30",
  variants: {
    variant: {
      default: "bg-muted/30",
      minimal: "bg-muted/20",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

// Audit Trail Component
export const AuditTrail = createPolymorphic<"div", AuditTrailComponentProperties>(
  ({
    as,
    auditLogs = [],
    onAuditLogAdd,
    onAuditLogUpdate,
    onAuditLogDelete,
    onAuditLogFilter,
    onAuditLogExport,
    configuration,
    showFilters = true,
    showExport = true,
    showPagination = true,
    enableRealTime = false,
    enableAnalytics = false,
    onAnalytics,
    className,
    ...props
  }: PolymorphicProperties<"div", AuditTrailComponentProperties>, ref: PolymorphicReference<"div">) => {
    const [logs, setLogs] = React.useState<AuditLog[]>(auditLogs);
    const [filters, setFilters] = React.useState<AuditTrailFilters>({});
    const [pagination, setPagination] = React.useState<AuditTrailPagination>({
      page: 1,
      size: 20,
      total: 0,
      pages: 0,
    });
    const [searchQuery, setSearchQuery] = React.useState("");
    const [selectedLog, setSelectedLog] = React.useState<AuditLog | null>(null);

    // Update logs when prop changes
    React.useEffect(() => {
      setLogs(auditLogs);
      setPagination(prev => ({
        ...prev,
        total: auditLogs.length,
        pages: Math.ceil(auditLogs.length / prev.size),
      }));
    }, [auditLogs]);

    // Filter logs
    const filteredLogs = React.useMemo(() => {
      let filtered = logs;

      // Apply search filter
      if (searchQuery) {
        filtered = filtered.filter(log =>
          log.action.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.details.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.user.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Apply other filters
      if (filters.userId) {
        filtered = filtered.filter(log => log.user.id === filters.userId);
      }
      if (filters.actionType) {
        filtered = filtered.filter(log => log.action.type.name === filters.actionType);
      }
      if (filters.resourceType) {
        filtered = filtered.filter(log => log.resource.type === filters.resourceType);
      }
      if (filters.status) {
        filtered = filtered.filter(log => log.status.name === filters.status);
      }
      if (filters.severity) {
        filtered = filtered.filter(log => log.severity.level === filters.severity);
      }
      if (filters.category) {
        filtered = filtered.filter(log => log.category === filters.category);
      }
      if (filters.dateRange) {
        filtered = filtered.filter(log =>
          log.timestamp >= filters.dateRange!.start && log.timestamp <= filters.dateRange!.end
        );
      }
      if (filters.tags && filters.tags.length > 0) {
        filtered = filtered.filter(log =>
          filters.tags!.some(tag => log.tags.includes(tag))
        );
      }
      if (filters.source) {
        filtered = filtered.filter(log => log.source.type === filters.source);
      }

      return filtered;
    }, [logs, filters, searchQuery]);

    // Paginated logs
    const paginatedLogs = React.useMemo(() => {
      const start = (pagination.page - 1) * pagination.size;
      const end = start + pagination.size;
      return filteredLogs.slice(start, end);
    }, [filteredLogs, pagination]);

    // Update pagination
    React.useEffect(() => {
      setPagination(prev => ({
        ...prev,
        total: filteredLogs.length,
        pages: Math.ceil(filteredLogs.length / prev.size),
      }));
    }, [filteredLogs]);

    // Handle filter change
    const handleFilterChange = React.useCallback((newFilters: AuditTrailFilters) => {
      setFilters(newFilters);
      onAuditLogFilter?.(newFilters);
      
      if (enableAnalytics && onAnalytics) {
        onAnalytics({
          type: "audit_log_filter",
          payload: { filterType: Object.keys(newFilters).join(","), timestamp: Date.now() },
        });
      }
    }, [onAuditLogFilter, enableAnalytics, onAnalytics]);

    // Handle search
    const handleSearch = React.useCallback((query: string) => {
      setSearchQuery(query);
      
      if (enableAnalytics && onAnalytics) {
        onAnalytics({
          type: "audit_log_search",
          payload: { searchQuery: query, timestamp: Date.now() },
        });
      }
    }, [enableAnalytics, onAnalytics]);

    // Handle export
    const handleExport = React.useCallback((format: string) => {
      onAuditLogExport?.(filteredLogs, format);
      
      if (enableAnalytics && onAnalytics) {
        onAnalytics({
          type: "audit_log_export",
          payload: { exportFormat: format, timestamp: Date.now() },
        });
      }
    }, [filteredLogs, onAuditLogExport, enableAnalytics, onAnalytics]);

    // Handle log click
    const handleLogClick = React.useCallback((log: AuditLog) => {
      setSelectedLog(log);
      
      if (enableAnalytics && onAnalytics) {
        onAnalytics({
          type: "audit_log_detail",
          payload: { auditLogId: log.id, timestamp: Date.now() },
        });
      }
    }, [enableAnalytics, onAnalytics]);

    // Format timestamp
    const formatTimestamp = React.useCallback((timestamp: Date) => {
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(timestamp);
    }, []);

    // Get action type color
    const getActionTypeColor = React.useCallback((actionType: string) => {
      const type = defaultAuditActionTypes.find(t => t.name === actionType);
      return type?.color || "#6b7280";
    }, []);

    // Get severity color
    const getSeverityColor = React.useCallback((severity: string) => {
      const sev = defaultAuditSeverities.find(s => s.level === severity);
      return sev?.color || "#6b7280";
    }, []);

    // Render log
    const renderLog = React.useCallback((log: AuditLog) => {
      return (
        <div
          key={log.id}
          className={cn(
            auditTrailLogStyles({
              severity: log.severity.level as "low" | "medium" | "high" | "critical",
              status: log.action.result?.status as "success" | "failure" | "warning" || "success",
            })
          )}
          onClick={() => handleLogClick(log)}
        >
          <div className={cn(auditTrailLogHeaderStyles({ variant: "default" }))}>
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getActionTypeColor(log.action.type.name) }}
              />
              <div className={cn(auditTrailLogTitleStyles({ variant: "default" }))}>
                {log.action.name}
              </div>
              <span className="text-xs text-muted-foreground">on</span>
              <div className="text-sm font-medium text-foreground">
                {log.resource.name}
              </div>
            </div>
            <div className={cn(auditTrailLogTimestampStyles({ variant: "default" }))}>
              {formatTimestamp(log.timestamp)}
            </div>
          </div>
          
          <div className={cn(auditTrailLogDetailsStyles({ variant: "default" }))}>
            {log.details.title}
          </div>
          
          <div className={cn(auditTrailLogMetaStyles({ variant: "default" }))}>
            <span>User: {log.user.name}</span>
            <span>Action: {log.action.type.name}</span>
            <span>Resource: {log.resource.type}</span>
            <span>Severity: {log.severity.level}</span>
            <span>Source: {log.source.type}</span>
          </div>
        </div>
      );
    }, [handleLogClick, formatTimestamp, getActionTypeColor]);

    const Component = as || "div";

    return (
      <Component
        ref={ref}
        className={cn(auditTrailStyles({ variant: "default" }), className)}
        {...props}
      >
        {/* Header */}
        <div className={cn(auditTrailHeaderStyles({ variant: "default" }))}>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Audit Trail</h2>
            <p className="text-sm text-muted-foreground">
              {pagination.total} audit log{pagination.total !== 1 ? 's' : ''} found
            </p>
          </div>
          <div className="flex items-center gap-2">
            {showExport && (
              <select
                onChange={(e) => handleExport(e.target.value)}
                className="px-3 py-1 text-sm border border-border rounded bg-background"
              >
                <option value="">Export</option>
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
                <option value="xml">XML</option>
              </select>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className={cn(auditTrailFiltersStyles({ variant: "default" }))}>
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="Search audit logs..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-border rounded bg-background"
              />
              <select
                value={filters.actionType || ""}
                onChange={(e) => handleFilterChange({ ...filters, actionType: e.target.value || undefined })}
                className="px-3 py-2 text-sm border border-border rounded bg-background"
              >
                <option value="">All Actions</option>
                {defaultAuditActionTypes.map(type => (
                  <option key={type.name} value={type.name}>
                    {type.name.charAt(0).toUpperCase() + type.name.slice(1)}
                  </option>
                ))}
              </select>
              <select
                value={filters.severity || ""}
                onChange={(e) => handleFilterChange({ ...filters, severity: e.target.value || undefined })}
                className="px-3 py-2 text-sm border border-border rounded bg-background"
              >
                <option value="">All Severities</option>
                {defaultAuditSeverities.map(severity => (
                  <option key={severity.level} value={severity.level}>
                    {severity.level.charAt(0).toUpperCase() + severity.level.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Content */}
        <div className={cn(auditTrailContentStyles({ variant: "default" }))}>
          {paginatedLogs.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              No audit logs found
            </div>
          ) : (
            paginatedLogs.map(renderLog)
          )}
        </div>

        {/* Pagination */}
        {showPagination && pagination.pages > 1 && (
          <div className={cn(auditTrailPaginationStyles({ variant: "default" }))}>
            <div className="text-sm text-muted-foreground">
              Showing {((pagination.page - 1) * pagination.size) + 1} to {Math.min(pagination.page * pagination.size, pagination.total)} of {pagination.total} results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm border border-border rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 text-sm border border-border rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Component>
    );
  },
  "AuditTrail"
);

// Export styles for external use
export const auditTrailVariants = {
  auditTrailStyles,
  auditTrailHeaderStyles,
  auditTrailFiltersStyles,
  auditTrailContentStyles,
  auditTrailLogStyles,
  auditTrailLogHeaderStyles,
  auditTrailLogTitleStyles,
  auditTrailLogTimestampStyles,
  auditTrailLogDetailsStyles,
  auditTrailLogMetaStyles,
  auditTrailPaginationStyles,
};
