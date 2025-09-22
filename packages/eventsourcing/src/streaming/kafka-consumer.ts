import type { DomainEvent } from '../core/domain-event';
import type { EventHandler } from '../core/event-handler';
import type { Consumer, EachMessagePayload } from 'kafkajs';

import { Kafka } from 'kafkajs';

/**
 * Kafka consumer configuration
 */
export interface KafkaConsumerConfig {
  brokers: string[];
  clientId: string;
  groupId: string;
  topics: string[];
  retry?: {
    retries: number;
    initialRetryTime: number;
    maxRetryTime: number;
  };
  sessionTimeout?: number;
  heartbeatInterval?: number;
  maxBytesPerPartition?: number;
  maxWaitTimeInMs?: number;
}

/**
 * Consumer checkpoint for resumable processing
 */
export interface ConsumerCheckpoint {
  topic: string;
  partition: number;
  offset: string;
  timestamp: Date;
}

/**
 * Kafka consumer for processing domain events
 */
export class KafkaEventConsumer {
  private consumer: Consumer;
  private isRunning = false;
  private checkpoints = new Map<string, ConsumerCheckpoint>();

  constructor(
    private config: KafkaConsumerConfig,
    private eventHandlers: EventHandler[],
  ) {
    const kafka = new Kafka({
      clientId: config.clientId,
      brokers: config.brokers,
      retry: config.retry || {
        retries: 5,
        initialRetryTime: 100,
        maxRetryTime: 30000,
      },
    });

    this.consumer = kafka.consumer({
      groupId: config.groupId,
      sessionTimeout: config.sessionTimeout || 30000,
      heartbeatInterval: config.heartbeatInterval || 3000,
      maxBytesPerPartition: config.maxBytesPerPartition || 1048576,
      maxWaitTimeInMs: config.maxWaitTimeInMs || 5000,
    });
  }

  /**
   * Connect and start consuming messages
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    try {
      await this.consumer.connect();
      await this.consumer.subscribe({
        topics: this.config.topics,
        fromBeginning: false,
      });

      await this.consumer.run({
        eachMessage: this.handleMessage.bind(this),
      });

      this.isRunning = true;
      console.log(`Kafka consumer started for topics: ${this.config.topics.join(', ')}`);
    } catch (error) {
      console.error('Failed to start Kafka consumer:', error);
      throw error;
    }
  }

  /**
   * Stop consuming messages
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      await this.consumer.disconnect();
      this.isRunning = false;
      console.log('Kafka consumer stopped');
    } catch (error) {
      console.error('Failed to stop Kafka consumer:', error);
      throw error;
    }
  }

  /**
   * Handle individual message
   */
  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;
    const checkpointKey = `${topic}-${partition}`;

    try {
      // Parse message
      const eventData = this.parseMessage(message);
      if (!eventData) {
        console.warn(`Skipping invalid message in topic ${topic}, partition ${partition}`);
        return;
      }

      // Find relevant handlers
      const relevantHandlers = this.eventHandlers.filter((handler) => handler.canHandle(eventData));

      if (relevantHandlers.length === 0) {
        console.warn(`No handlers found for event type ${eventData.eventType}`);
        this.updateCheckpoint(checkpointKey, {
          topic,
          partition,
          offset: message.offset,
          timestamp: new Date(),
        });
        return;
      }

      // Process with handlers
      for (const handler of relevantHandlers) {
        try {
          await handler.handle(eventData);
        } catch (error) {
          console.error(
            `Handler ${handler.getEventType()} failed for event ${eventData.id}:`,
            error,
          );
          // Continue with other handlers, but log the error
        }
      }

      // Update checkpoint on success
      this.updateCheckpoint(checkpointKey, {
        topic,
        partition,
        offset: message.offset,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error(`Failed to process message in topic ${topic}, partition ${partition}:`, error);
      // Don't update checkpoint on error - will retry
      throw error;
    }
  }

  /**
   * Parse message from Kafka
   */
  private parseMessage(message: {
    key?: Buffer | null;
    value?: Buffer | null;
    headers?: Record<string, string | Buffer | (string | Buffer)[] | undefined>;
  }): DomainEvent | null {
    try {
      if (!message.value) {
        return null;
      }

      const data = JSON.parse(message.value.toString());

      // Validate required fields
      if (!data.id || !data.eventType || !data.aggregateId || !data.tenantId) {
        console.warn('Message missing required fields:', data);
        return null;
      }

      // Create domain event (simplified - in real implementation, you'd use proper deserialization)
      return {
        id: data.id,
        aggregateId: data.aggregateId,
        version: data.version || 0,
        eventType: data.eventType,
        occurredAt: new Date(data.occurredAt),
        tenantId: data.tenantId,
        correlationId: data.correlationId,
        causationId: data.causationId,
        serialize: () => data.data || {},
      } as DomainEvent;
    } catch (error) {
      console.error('Failed to parse message:', error);
      return null;
    }
  }

  /**
   * Update checkpoint for a partition
   */
  private updateCheckpoint(key: string, checkpoint: ConsumerCheckpoint): void {
    this.checkpoints.set(key, checkpoint);
  }

  /**
   * Get current checkpoints
   */
  getCheckpoints(): ConsumerCheckpoint[] {
    return Array.from(this.checkpoints.values());
  }

  /**
   * Get checkpoint for specific topic-partition
   */
  getCheckpoint(topic: string, partition: number): ConsumerCheckpoint | undefined {
    const key = `${topic}-${partition}`;
    return this.checkpoints.get(key);
  }

  /**
   * Check if consumer is running
   */
  isConsumerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get consumer metrics
   */
  async getMetrics(): Promise<{
    running: boolean;
    topics: string[];
    checkpoints: number;
  }> {
    return {
      running: this.isRunning,
      topics: this.config.topics,
      checkpoints: this.checkpoints.size,
    };
  }

  /**
   * Pause consumption for specific partitions
   */
  async pausePartitions(topic: string, partitions: number[]): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Consumer not running');
    }

    try {
      await this.consumer.pause([{ topic, partitions }]);
      console.log(`Paused partitions ${partitions.join(', ')} for topic ${topic}`);
    } catch (error) {
      console.error(`Failed to pause partitions for topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Resume consumption for specific partitions
   */
  async resumePartitions(topic: string, partitions: number[]): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Consumer not running');
    }

    try {
      await this.consumer.resume([{ topic, partitions }]);
      console.log(`Resumed partitions ${partitions.join(', ')} for topic ${topic}`);
    } catch (error) {
      console.error(`Failed to resume partitions for topic ${topic}:`, error);
      throw error;
    }
  }
}
