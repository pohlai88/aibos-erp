import type { AuditEvent, BusinessMetrics } from './types';

export class AccountingObservability {
  static logAuditEvent(event: AuditEvent, correlationId: string): void {
    // Structured logging for audit events
    console.info('AUDIT_EVENT', {
      ...event,
      correlationId,
      timestamp: new Date().toISOString(),
      userId: event.userId, // From JWT
      tenantId: event.tenantId, // From RLS context
    });
  }

  static trackProjectionLag(tenantId: string, lagMs: number): void {
    // Track projection lag metrics
    console.info('PROJECTION_LAG', {
      tenantId,
      lagMs,
      timestamp: new Date().toISOString(),
    });
  }

  static trackJournalVolume(tenantId: string, count: number, totalAmount: number): void {
    // Track journal entry volume metrics
    console.info('JOURNAL_VOLUME', {
      tenantId,
      count,
      totalAmount,
      timestamp: new Date().toISOString(),
    });
  }

  static trackBusinessMetrics(tenantId: string, metrics: BusinessMetrics): void {
    // CFO Value Metrics
    console.info('BUSINESS_METRICS', {
      tenantId,
      periodCloseTime: metrics.periodCloseTime,
      auditPrepTime: metrics.auditPrepTime,
      unmappedAccounts: metrics.unmappedAccounts,
      fxVariance: metrics.fxVariance,
      // Operational Metrics
      approvalSLA: metrics.approvalSLA,
      bulkProcessingTime: metrics.bulkProcessingTime,
      timestamp: new Date().toISOString(),
    });
  }

  static logError(error: Error, correlationId: string, context?: Record<string, unknown>): void {
    console.error('ERROR', {
      message: error.message,
      stack: error.stack,
      correlationId,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  static logPerformance(
    operation: string,
    durationMs: number,
    correlationId: string,
    metadata?: Record<string, unknown>,
  ): void {
    console.info('PERFORMANCE', {
      operation,
      durationMs,
      correlationId,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }
}
