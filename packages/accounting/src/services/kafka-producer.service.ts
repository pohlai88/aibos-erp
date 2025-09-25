import { type KafkaEventProducer, type DomainEvent } from '@aibos/eventsourcing';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class KafkaProducerService {
  private readonly logger = new Logger(KafkaProducerService.name);

  constructor(private readonly producer: KafkaEventProducer) {}

  async publishEvent(event: DomainEvent): Promise<void> {
    this.logger.debug(`Publishing event: ${event.eventType} for aggregate ${event.aggregateId}`);
    await this.producer.publishEvent(event);
  }

  async publishEvents(events: DomainEvent[]): Promise<void> {
    this.logger.debug(`Publishing ${events.length} events`);
    await this.producer.publishEvents(events);
  }
}
