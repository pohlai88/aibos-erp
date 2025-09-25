import type { ExecutionContext, CallHandler, NestInterceptor } from '@nestjs/common';
import type { Observable } from 'rxjs';

import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { tap } from 'rxjs/operators';

export interface CorrelationContext {
  correlationId: string;
  causationId?: string;
  userId?: string;
  tenantId?: string;
  operation?: string;
}

/**
 * Correlation ID interceptor for request tracing
 * Automatically generates and tracks correlation IDs across requests
 */
@Injectable()
export class CorrelationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CorrelationInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Extract or generate correlation ID
    const correlationId = this.extractCorrelationId(request);
    const causationId = this.generateCausationId(correlationId);

    // Add correlation context to request
    const correlationContext: CorrelationContext = {
      correlationId,
      causationId,
      userId: this.extractUserId(request),
      tenantId: this.extractTenantId(request),
      operation: this.extractOperation(request),
    };

    // Attach to request for use in services
    (request as Record<string, unknown>).correlationContext = correlationContext;

    // Add correlation ID to response headers
    response.setHeader('X-Correlation-ID', correlationId);
    response.setHeader('X-Causation-ID', causationId);

    // Log request start
    this.logger.log(`Request started: ${request.method} ${request.url}`, {
      correlationId,
      causationId,
      userId: correlationContext.userId,
      tenantId: correlationContext.tenantId,
      operation: correlationContext.operation,
      userAgent: request.headers?.['user-agent'],
      ip: request.ip,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          // Log successful completion
          this.logger.log(`Request completed: ${request.method} ${request.url}`, {
            correlationId,
            causationId,
            statusCode: response.statusCode,
            duration: Date.now() - Date.now(), // Would calculate actual duration
          });
        },
        error: (error: Error) => {
          // Log error with correlation context
          this.logger.error(`Request failed: ${request.method} ${request.url}`, {
            correlationId,
            causationId,
            error: error.message,
            stack: error.stack,
            statusCode: response.statusCode,
          });
        },
      }),
    );
  }

  private extractCorrelationId(request: Record<string, unknown>): string {
    // Check for existing correlation ID in headers
    const existingId =
      request.headers?.['x-correlation-id'] ||
      request.headers?.['x-request-id'] ||
      request.headers?.['x-trace-id'];

    if (existingId) {
      return existingId;
    }

    // Generate new correlation ID
    return randomUUID();
  }

  private generateCausationId(correlationId: string): string {
    return `${correlationId}-${randomUUID()}`;
  }

  private extractUserId(request: Record<string, unknown>): string | undefined {
    // Extract from JWT token or session
    const headers = request.headers as Record<string, unknown>;
    const authHeader = headers?.authorization as string;
    if (authHeader?.startsWith('Bearer ')) {
      // In a real implementation, decode JWT to get user ID
      // For now, return undefined
      return undefined;
    }
    return undefined;
  }

  private extractTenantId(request: Record<string, unknown>): string | undefined {
    // Extract from headers or JWT token
    return request.headers?.['x-tenant-id'] || undefined;
  }

  private extractOperation(request: Record<string, unknown>): string {
    // Generate operation name from method and path
    const method = request.method;
    const path = request.url || request.path;
    return `${method}:${path}`;
  }
}

/**
 * Decorator to inject correlation context into service methods
 */
export function CorrelationContextDecorator(): ParameterDecorator {
  return (_target: unknown, _propertyKey: string | symbol | undefined, _parameterIndex: number) => {
    // In a real implementation, this would use a custom parameter decorator
    // For now, services can access correlation context from the request
  };
}
