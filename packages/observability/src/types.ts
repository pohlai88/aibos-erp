export interface AuditEvent {
  userId: string;
  tenantId: string;
  action: string;
  resource: string;
  details: Record<string, unknown>;
  timestamp: Date;
}

export interface BusinessMetrics {
  periodCloseTime: number; // days
  auditPrepTime: number; // hours
  unmappedAccounts: number;
  fxVariance: number; // percentage
  approvalSLA: number; // percentage
  bulkProcessingTime: number; // seconds per 1000 records
}

export interface PerformanceMetrics {
  operation: string;
  durationMs: number;
  correlationId: string;
  metadata?: Record<string, unknown>;
}

export interface ErrorLog {
  message: string;
  stack?: string;
  correlationId: string;
  context?: Record<string, unknown>;
  timestamp: Date;
}
