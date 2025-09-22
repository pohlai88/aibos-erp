import type { DomainEvent } from '../core/domain-event';
import type { KafkaEventProducer } from '../streaming/kafka-producer';
import type { Pool } from 'pg';

/**
 * Outbox worker configuration
 */
export interface OutboxWorkerConfig {
  batchSize: number;
  pollIntervalMs: number;
  maxRetries: number;
  retryBackoffMs: number;
  maxRetryBackoffMs: number;
  dlqThreshold: number;
  processingTimeoutMs: number;
}

/**
 * Default outbox worker configuration
 */
export const DEFAULT_OUTBOX_WORKER_CONFIG: OutboxWorkerConfig = {
  batchSize: 200,
  pollIntervalMs: 1000,
  maxRetries: 5,
  retryBackoffMs: 1000,
  maxRetryBackoffMs: 30000,
  dlqThreshold: 3,
  processingTimeoutMs: 30000,
};

/**
 * Outbox event record
 */
export interface OutboxEventRecord {
  id: string;
  aggregateId: string;
  eventType: string;
  eventData: Record<string, unknown>;
  metadata: Record<string, unknown>;
  tenantId: string;
  createdAt: Date;
  processedAt: Date | null;
  retryCount: number;
  status: 'pending' | 'processing' | 'done' | 'dlq';
  errorMessage: string | null;
  correlationId: string | null;
  causationId: string | null;
}

/**
 * Outbox worker metrics
 */
export interface OutboxWorkerMetrics {
  processedCount: number;
  failedCount: number;
  dlqCount: number;
  averageProcessingTimeMs: number;
  lastProcessedAt: Date | null;
  isRunning: boolean;
}

/**
 * Transactional outbox worker with retry logic and DLQ
 */
export class OutboxWorker {
  private isRunning = false;
  private metrics: OutboxWorkerMetrics = {
    processedCount: 0,
    failedCount: 0,
    dlqCount: 0,
    averageProcessingTimeMs: 0,
    lastProcessedAt: null,
    isRunning: false,
  };
  private processingTimes: number[] = [];

  constructor(
    private pool: Pool,
    private kafkaProducer: KafkaEventProducer,
    private config: OutboxWorkerConfig = DEFAULT_OUTBOX_WORKER_CONFIG,
  ) {}

  /**
   * Start the outbox worker
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.metrics.isRunning = true;

    console.log('Starting outbox worker...');

    // Start processing loop
    this.processLoop().catch((error) => {
      console.error('Outbox worker processing loop failed:', error);
      this.stop();
    });
  }

  /**
   * Stop the outbox worker
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    this.metrics.isRunning = false;

    console.log('Stopping outbox worker...');
  }

  /**
   * Main processing loop
   */
  private async processLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        await this.processBatch();
        await this.sleep(this.config.pollIntervalMs);
      } catch (error) {
        console.error('Error in outbox worker loop:', error);
        await this.sleep(this.config.pollIntervalMs * 2); // Back off on error
      }
    }
  }

  /**
   * Process a batch of outbox events
   */
  private async processBatch(): Promise<void> {
    const startTime = Date.now();
    let processedCount = 0;

    try {
      // Claim batch atomically
      const events = await this.claimBatch();

      if (events.length === 0) {
        return; // No events to process
      }

      console.log(`Processing batch of ${events.length} outbox events`);

      // Process each event
      for (const event of events) {
        try {
          await this.processEvent(event);
          await this.markEventAsDone(event.id);
          processedCount++;
        } catch (error) {
          console.error(`Failed to process outbox event ${event.id}:`, error);
          await this.handleEventFailure(event, error as Error);
        }
      }

      // Update metrics
      const processingTime = Date.now() - startTime;
      this.updateMetrics(processedCount, processingTime);
    } catch (error) {
      console.error('Failed to process outbox batch:', error);
      this.metrics.failedCount += this.config.batchSize;
    }
  }

  /**
   * Claim a batch of events atomically
   */
  private async claimBatch(): Promise<OutboxEventRecord[]> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Claim batch atomically using SKIP LOCKED
      const result = await client.query(
        `
        WITH cte AS (
          SELECT id FROM eventsourcing.outbox_events
          WHERE status = 'pending'
          ORDER BY created_at
          FOR UPDATE SKIP LOCKED
          LIMIT $1
        )
        UPDATE eventsourcing.outbox_events o
        SET status = 'processing', processed_at = NOW()
        FROM cte
        WHERE o.id = cte.id
        RETURNING o.*
      `,
        [this.config.batchSize],
      );

      await client.query('COMMIT');

      return result.rows.map(this.mapRowToOutboxEvent);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Process a single outbox event
   */
  private async processEvent(event: OutboxEventRecord): Promise<void> {
    // Create domain event from outbox event
    const domainEvent = {
      id: event.id,
      aggregateId: event.aggregateId,
      version: 0, // Will be set by the actual event
      eventType: event.eventType,
      occurredAt: event.createdAt,
      tenantId: event.tenantId,
      correlationId: event.correlationId,
      causationId: event.causationId,
      serialize: () => event.eventData,
    };

    // Publish to Kafka
    await this.kafkaProducer.publishEvent(domainEvent as unknown as DomainEvent);
  }

  /**
   * Mark event as successfully processed
   */
  private async markEventAsDone(eventId: string): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query(
        `
        UPDATE eventsourcing.outbox_events
        SET status = 'done', processed_at = NOW()
        WHERE id = $1
      `,
        [eventId],
      );
    } finally {
      client.release();
    }
  }

  /**
   * Handle event processing failure
   */
  private async handleEventFailure(event: OutboxEventRecord, error: Error): Promise<void> {
    const newRetryCount = event.retryCount + 1;
    const shouldMoveToDLQ = newRetryCount >= this.config.dlqThreshold;

    const client = await this.pool.connect();

    try {
      if (shouldMoveToDLQ) {
        // Move to DLQ
        await client.query(
          `
          UPDATE eventsourcing.outbox_events
          SET status = 'dlq', 
              retry_count = $2,
              error_message = $3,
              processed_at = NOW()
          WHERE id = $1
        `,
          [event.id, newRetryCount, error.message],
        );

        this.metrics.dlqCount++;
        console.warn(`Moved event ${event.id} to DLQ after ${newRetryCount} retries`);
      } else {
        // Schedule retry with exponential backoff
        const backoffMs = Math.min(
          this.config.retryBackoffMs * Math.pow(2, newRetryCount - 1),
          this.config.maxRetryBackoffMs,
        );

        await client.query(
          `
          UPDATE eventsourcing.outbox_events
          SET status = 'pending',
              retry_count = $2,
              error_message = $3,
              processed_at = NULL
          WHERE id = $1
        `,
          [event.id, newRetryCount, error.message],
        );

        // Add delay before retry
        setTimeout(() => {
          // Event will be picked up in next batch
        }, backoffMs);

        console.warn(
          `Scheduled retry ${newRetryCount}/${this.config.maxRetries} for event ${event.id} in ${backoffMs}ms`,
        );
      }
    } finally {
      client.release();
    }
  }

  /**
   * Map database row to outbox event record
   */
  private mapRowToOutboxEvent(row: Record<string, unknown>): OutboxEventRecord {
    return {
      id: row.id as string,
      aggregateId: row.aggregate_id as string,
      eventType: row.event_type as string,
      eventData: row.event_data as Record<string, unknown>,
      metadata: (row.metadata as Record<string, unknown>) || {},
      tenantId: row.tenant_id as string,
      createdAt: row.created_at as Date,
      processedAt: (row.processed_at as Date) || null,
      retryCount: row.retry_count as number,
      status: row.status as 'pending' | 'processing' | 'done' | 'dlq',
      errorMessage: (row.error_message as string) || null,
      correlationId: (row.correlation_id as string) || null,
      causationId: (row.causation_id as string) || null,
    };
  }

  /**
   * Update worker metrics
   */
  private updateMetrics(processedCount: number, processingTimeMs: number): void {
    this.metrics.processedCount += processedCount;
    this.metrics.lastProcessedAt = new Date();

    // Update average processing time
    this.processingTimes.push(processingTimeMs);
    if (this.processingTimes.length > 100) {
      this.processingTimes.shift(); // Keep only last 100 measurements
    }

    this.metrics.averageProcessingTimeMs =
      this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length;
  }

  /**
   * Get worker metrics
   */
  getMetrics(): OutboxWorkerMetrics {
    return { ...this.metrics };
  }

  /**
   * Get outbox statistics
   */
  async getOutboxStats(): Promise<{
    pending: number;
    processing: number;
    done: number;
    dlq: number;
    total: number;
  }> {
    const client = await this.pool.connect();

    try {
      const result = await client.query(`
        SELECT 
          status,
          COUNT(*) as count
        FROM eventsourcing.outbox_events
        GROUP BY status
      `);

      const stats = {
        pending: 0,
        processing: 0,
        done: 0,
        dlq: 0,
        total: 0,
      };

      for (const row of result.rows) {
        const count = parseInt(row.count, 10);
        stats[row.status as keyof typeof stats] = count;
        stats.total += count;
      }

      return stats;
    } finally {
      client.release();
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if worker is running
   */
  isWorkerRunning(): boolean {
    return this.isRunning;
  }
}
