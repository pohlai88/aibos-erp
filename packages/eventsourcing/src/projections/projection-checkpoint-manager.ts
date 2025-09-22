import type { Pool } from 'pg';

/**
 * Projection checkpoint record
 */
export interface ProjectionCheckpoint {
  projectorName: string;
  topic: string;
  partition: number;
  offset: string;
  updatedAt: Date;
}

/**
 * Projection status record
 */
export interface ProjectionStatus {
  projectorName: string;
  status: 'stopped' | 'running' | 'paused' | 'error';
  lastProcessedAt: Date | null;
  lastError: string | null;
  processedCount: number;
  errorCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Projection lag information
 */
export interface ProjectionLag {
  topic: string;
  partition: number;
  lagMs: number;
}

/**
 * Projection checkpoint manager for resumable processing
 */
export class ProjectionCheckpointManager {
  constructor(private pool: Pool) {}

  /**
   * Save checkpoint for a projector
   */
  async saveCheckpoint(checkpoint: ProjectionCheckpoint): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query(
        `
        INSERT INTO projection_checkpoint (projector_name, topic, partition, offset, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (projector_name, topic, partition)
        DO UPDATE SET
          offset = EXCLUDED.offset,
          updated_at = EXCLUDED.updated_at
      `,
        [
          checkpoint.projectorName,
          checkpoint.topic,
          checkpoint.partition,
          checkpoint.offset,
          checkpoint.updatedAt,
        ],
      );
    } finally {
      client.release();
    }
  }

  /**
   * Get checkpoint for a projector and topic-partition
   */
  async getCheckpoint(
    projectorName: string,
    topic: string,
    partition: number,
  ): Promise<ProjectionCheckpoint | null> {
    const client = await this.pool.connect();

    try {
      const result = await client.query(
        `
        SELECT projector_name, topic, partition, offset, updated_at
        FROM projection_checkpoint
        WHERE projector_name = $1 AND topic = $2 AND partition = $3
      `,
        [projectorName, topic, partition],
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        projectorName: row.projector_name,
        topic: row.topic,
        partition: row.partition,
        offset: row.offset,
        updatedAt: row.updated_at,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get all checkpoints for a projector
   */
  async getProjectorCheckpoints(projectorName: string): Promise<ProjectionCheckpoint[]> {
    const client = await this.pool.connect();

    try {
      const result = await client.query(
        `
        SELECT projector_name, topic, partition, offset, updated_at
        FROM projection_checkpoint
        WHERE projector_name = $1
        ORDER BY topic, partition
      `,
        [projectorName],
      );

      return result.rows.map((row) => ({
        projectorName: row.projector_name,
        topic: row.topic,
        partition: row.partition,
        offset: row.offset,
        updatedAt: row.updated_at,
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Reset checkpoint for a projector and topic-partition
   */
  async resetCheckpoint(projectorName: string, topic: string, partition: number): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query(
        `
        DELETE FROM projection_checkpoint
        WHERE projector_name = $1 AND topic = $2 AND partition = $3
      `,
        [projectorName, topic, partition],
      );

      // Insert reset checkpoint
      await client.query(
        `
        INSERT INTO projection_checkpoint (projector_name, topic, partition, offset, updated_at)
        VALUES ($1, $2, $3, -1, NOW())
      `,
        [projectorName, topic, partition],
      );
    } finally {
      client.release();
    }
  }

  /**
   * Update projection status
   */
  async updateProjectionStatus(
    projectorName: string,
    status: ProjectionStatus['status'],
    lastError?: string,
  ): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query(
        `
        INSERT INTO projection_status (projector_name, status, last_error, last_processed_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (projector_name)
        DO UPDATE SET
          status = EXCLUDED.status,
          last_error = EXCLUDED.last_error,
          last_processed_at = CASE 
            WHEN EXCLUDED.status = 'running' THEN NOW()
            ELSE projection_status.last_processed_at
          END,
          updated_at = NOW()
      `,
        [projectorName, status, lastError],
      );
    } finally {
      client.release();
    }
  }

  /**
   * Increment processed count
   */
  async incrementProcessedCount(projectorName: string): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query(
        `
        UPDATE projection_status
        SET processed_count = processed_count + 1,
            last_processed_at = NOW(),
            updated_at = NOW()
        WHERE projector_name = $1
      `,
        [projectorName],
      );
    } finally {
      client.release();
    }
  }

  /**
   * Increment error count
   */
  async incrementErrorCount(projectorName: string, error: string): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query(
        `
        UPDATE projection_status
        SET error_count = error_count + 1,
            last_error = $2,
            updated_at = NOW()
        WHERE projector_name = $1
      `,
        [projectorName, error],
      );
    } finally {
      client.release();
    }
  }

  /**
   * Get projection status
   */
  async getProjectionStatus(projectorName: string): Promise<ProjectionStatus | null> {
    const client = await this.pool.connect();

    try {
      const result = await client.query(
        `
        SELECT projector_name, status, last_processed_at, last_error, 
               processed_count, error_count, created_at, updated_at
        FROM projection_status
        WHERE projector_name = $1
      `,
        [projectorName],
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        projectorName: row.projector_name,
        status: row.status,
        lastProcessedAt: row.last_processed_at,
        lastError: row.last_error,
        processedCount: parseInt(row.processed_count, 10),
        errorCount: parseInt(row.error_count, 10),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get projection lag information
   */
  async getProjectionLag(projectorName: string): Promise<ProjectionLag[]> {
    const client = await this.pool.connect();

    try {
      const result = await client.query(
        `
        SELECT topic, partition, 
               EXTRACT(EPOCH FROM (NOW() - updated_at)) * 1000 as lag_ms
        FROM projection_checkpoint
        WHERE projector_name = $1
        ORDER BY topic, partition
      `,
        [projectorName],
      );

      return result.rows.map((row) => ({
        topic: row.topic,
        partition: row.partition,
        lagMs: Math.round(parseFloat(row.lag_ms)),
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Record projection metric
   */
  async recordMetric(
    projectorName: string,
    metricName: string,
    metricValue: number,
  ): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query(
        `
        INSERT INTO projection_metrics (projector_name, metric_name, metric_value, recorded_at)
        VALUES ($1, $2, $3, NOW())
      `,
        [projectorName, metricName, metricValue],
      );
    } finally {
      client.release();
    }
  }

  /**
   * Get projection metrics for a time range
   */
  async getProjectionMetrics(
    projectorName: string,
    metricName: string,
    fromDate: Date,
    toDate: Date,
  ): Promise<Array<{ value: number; timestamp: Date }>> {
    const client = await this.pool.connect();

    try {
      const result = await client.query(
        `
        SELECT metric_value, recorded_at
        FROM projection_metrics
        WHERE projector_name = $1 
          AND metric_name = $2
          AND recorded_at BETWEEN $3 AND $4
        ORDER BY recorded_at
      `,
        [projectorName, metricName, fromDate, toDate],
      );

      return result.rows.map((row) => ({
        value: parseFloat(row.metric_value),
        timestamp: row.recorded_at,
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Cleanup old metrics
   */
  async cleanupOldMetrics(retentionDays: number = 30): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query(
        `
        DELETE FROM projection_metrics
        WHERE recorded_at < NOW() - INTERVAL '1 day' * $1
      `,
        [retentionDays],
      );
    } finally {
      client.release();
    }
  }

  /**
   * Get all projector names
   */
  async getAllProjectorNames(): Promise<string[]> {
    const client = await this.pool.connect();

    try {
      const result = await client.query(`
        SELECT DISTINCT projector_name
        FROM projection_status
        ORDER BY projector_name
      `);

      return result.rows.map((row) => row.projector_name);
    } finally {
      client.release();
    }
  }

  /**
   * Get projection health summary
   */
  async getProjectionHealthSummary(): Promise<{
    totalProjectors: number;
    runningProjectors: number;
    errorProjectors: number;
    stoppedProjectors: number;
    totalProcessedEvents: number;
    totalErrors: number;
  }> {
    const client = await this.pool.connect();

    try {
      const result = await client.query(`
        SELECT 
          COUNT(*) as total_projectors,
          COUNT(CASE WHEN status = 'running' THEN 1 END) as running_projectors,
          COUNT(CASE WHEN status = 'error' THEN 1 END) as error_projectors,
          COUNT(CASE WHEN status = 'stopped' THEN 1 END) as stopped_projectors,
          SUM(processed_count) as total_processed_events,
          SUM(error_count) as total_errors
        FROM projection_status
      `);

      const row = result.rows[0];
      return {
        totalProjectors: parseInt(row.total_projectors, 10),
        runningProjectors: parseInt(row.running_projectors, 10),
        errorProjectors: parseInt(row.error_projectors, 10),
        stoppedProjectors: parseInt(row.stopped_projectors, 10),
        totalProcessedEvents: parseInt(row.total_processed_events || '0', 10),
        totalErrors: parseInt(row.total_errors || '0', 10),
      };
    } finally {
      client.release();
    }
  }
}
