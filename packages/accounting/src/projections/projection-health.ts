export interface ProjectionHealth {
  lastEventId: string;
  checksum: string;
  materializedAt: Date;
}

export class ProjectionHealthMonitor {
  async checkHealth(tenantId: string): Promise<HealthStatus> {
    const health = await this.getProjectionHealth(tenantId);
    const lag = Date.now() - health.lastEventId.timestamp;

    // Emit metrics for monitoring
    this.metrics.emit('projection_lag_seconds', lag / 1000);
    this.metrics.emit('projection_checksums_mismatch', health.checksumMismatch ? 1 : 0);

    return {
      lagSeconds: lag / 1000,
      lastEventId: health.lastEventId,
      checksumMismatch: health.checksumMismatch,
      status: lag > 60000 ? 'stale' : 'healthy', // Alert if > 60s lag
    };
  }

  private async getProjectionHealth(_tenantId: string): Promise<ProjectionHealthData> {
    // Implementation would get projection health data
    return {
      lastEventId: { id: 'event-123', timestamp: Date.now() },
      checksumMismatch: false,
    };
  }

  private metrics = {
    emit: (metric: string, value: number): void => {
      console.log('Metric emitted', { metric, value });
    },
  };
}

interface HealthStatus {
  lagSeconds: number;
  lastEventId: { id: string; timestamp: number };
  checksumMismatch: boolean;
  status: 'healthy' | 'stale';
}

interface ProjectionHealthData {
  lastEventId: { id: string; timestamp: number };
  checksumMismatch: boolean;
}
