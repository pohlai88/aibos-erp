import type { DomainEvent } from '../domain/events/domain-events';

import { OutboxEventEntity } from '../infrastructure/database/entities/outbox-event.entity';
import { type KafkaProducerService } from '../infrastructure/messaging/kafka-producer.service';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { type Repository, type EntityManager } from 'typeorm';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(
    @InjectRepository(OutboxEventEntity)
    private readonly outboxRepository: Repository<OutboxEventEntity>,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  /**
   * If provided, `manager` will be used to save outbox rows within an existing DB transaction.
   */
  async publishEvents(
    events: DomainEvent[],
    tenantId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const now = new Date();
    const outboxEvents = events.map((event) => {
      if (manager) {
        return manager.create(OutboxEventEntity, {
          tenantId,
          topic: this.getTopicForEvent(event),
          key: event.aggregateId,
          payload: event.toJSON(),
          status: 'READY',
          retryCount: 0,
          createdAt: now,
        });
      } else {
        return this.outboxRepository.create({
          tenantId,
          topic: this.getTopicForEvent(event),
          key: event.aggregateId,
          payload: event.toJSON(),
          status: 'READY',
          retryCount: 0,
          createdAt: now,
        });
      }
    });

    if (manager) {
      await manager.save(OutboxEventEntity, outboxEvents);
    } else {
      await this.outboxRepository.save(outboxEvents);
    }
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async processOutboxEvents(): Promise<void> {
    // Lease a batch with SKIP LOCKED to support parallel workers safely.
    const pendingEvents: OutboxEventEntity[] = await this.outboxRepository.manager.query(
      `
      UPDATE outbox_events
      SET status = 'PROCESSING', processed_at = NOW()
      WHERE id IN (
        SELECT id
        FROM outbox_events
        WHERE status = 'READY'
          AND (next_attempt_at IS NULL OR next_attempt_at <= NOW())
        ORDER BY created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 100
      )
      RETURNING *;
      `,
    );

    if (pendingEvents.length === 0) {
      return;
    }

    this.logger.log(`Processing ${pendingEvents.length} outbox events`);

    for (const event of pendingEvents) {
      try {
        await this.kafkaProducer.send({
          topic: event.topic,
          messages: [
            {
              key: event.key,
              value: JSON.stringify(event.payload),
              headers: {
                'tenant-id': String(event.tenantId),
                'event-type': String(
                  (event.payload as Record<string, unknown>).eventType ?? 'unknown',
                ),
              },
            },
          ],
        });

        await this.outboxRepository.update(event.id, {
          status: 'PUBLISHED',
          processedAt: new Date(),
        });

        this.logger.debug(`Published event ${event.id} to topic ${event.topic}`);
      } catch (error) {
        this.logger.error(`Failed to publish event ${event.id}:`, error);
        const retries = (event.retryCount ?? 0) + 1;
        const backoffMs = Math.min(60000, 2000 * retries) + Math.floor(Math.random() * 500);
        await this.outboxRepository.update(event.id, {
          status: 'READY',
          retryCount: retries,
          nextAttemptAt: new Date(Date.now() + backoffMs),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          errorReason: String((error as any)?.message ?? 'unknown'),
        });
      }
    }
  }

  private getTopicForEvent(event: DomainEvent): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventType = (event as any).eventType ?? event.constructor.name;
    const topicMap = {
      AccountCreatedEvent: 'accounting.account.created',
      JournalEntryPostedEvent: 'accounting.journal.posted',
      // Add other event mappings
    };

    return topicMap[eventType as keyof typeof topicMap] || 'accounting.unknown';
  }
}
