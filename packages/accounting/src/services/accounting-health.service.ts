import { Injectable, Logger } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import { type DataSource } from 'typeorm';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: Date;
  checks: {
    database: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
    tenantContext: {
      status: 'up' | 'down';
      error?: string;
    };
  };
}

@Injectable()
export class AccountingHealthService {
  private readonly logger = new Logger(AccountingHealthService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async checkHealth(): Promise<HealthCheckResult> {
    const _startTime = Date.now();
    const checks: HealthCheckResult['checks'] = {
      database: { status: 'down' },
      tenantContext: { status: 'down' },
    };

    // Check database connectivity
    try {
      const dbStartTime = Date.now();
      await this.dataSource.query('SELECT 1');
      checks.database = {
        status: 'up',
        responseTime: Date.now() - dbStartTime,
      };
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      checks.database = {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown database error',
      };
    }

    // Check tenant context function
    try {
      await this.dataSource.query('SELECT set_tenant_context(gen_random_uuid())');
      checks.tenantContext = { status: 'up' };
    } catch (error) {
      this.logger.error('Tenant context health check failed:', error);
      checks.tenantContext = {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown tenant context error',
      };
    }

    const overallStatus =
      checks.database.status === 'up' && checks.tenantContext.status === 'up'
        ? 'healthy'
        : 'unhealthy';

    return {
      status: overallStatus,
      timestamp: new Date(),
      checks,
    };
  }

  async checkDatabaseConnection(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch (error) {
      this.logger.error('Database connection check failed:', error);
      return false;
    }
  }

  async checkTenantIsolation(): Promise<boolean> {
    try {
      // Test tenant context setting
      await this.dataSource.query('SELECT set_tenant_context(gen_random_uuid())');
      return true;
    } catch (error) {
      this.logger.error('Tenant isolation check failed:', error);
      return false;
    }
  }
}
