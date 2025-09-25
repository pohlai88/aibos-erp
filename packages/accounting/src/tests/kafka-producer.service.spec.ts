import { KafkaProducerService } from '../services/kafka-producer.service';
import { type DomainEvent } from '@aibos/eventsourcing';
import { Test } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('KafkaProducerService', () => {
  let service: KafkaProducerService;
  let mockProducer: any;

  beforeEach(async () => {
    const mockPublishEvent = vi.fn().mockResolvedValue(undefined);
    const mockPublishEvents = vi.fn().mockResolvedValue(undefined);

    mockProducer = {
      publishEvent: mockPublishEvent,
      publishEvents: mockPublishEvents,
    };

    const module = await Test.createTestingModule({
      providers: [
        {
          provide: KafkaProducerService,
          useFactory: () => new KafkaProducerService(mockProducer),
        },
      ],
    }).compile();

    service = module.get<KafkaProducerService>(KafkaProducerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should delegate publishEvent to KafkaEventProducer', async () => {
    const mockEvent = {
      id: 'e1',
      aggregateId: 'acc-123',
      eventType: 'AccountCreatedEvent',
      version: 1,
      occurredAt: new Date(),
      tenantId: 'tenant-1',
      correlationId: 'corr-1',
      causationId: 'cause-1',
      serialize: vi.fn().mockReturnValue({ accountCode: '1000' }),
    } as unknown as DomainEvent;

    await service.publishEvent(mockEvent);

    expect(mockProducer.publishEvent).toHaveBeenCalledWith(mockEvent);
  });

  it('should delegate publishEvents to KafkaEventProducer', async () => {
    const mockEvents = [
      {
        id: 'e1',
        aggregateId: 'acc-123',
        eventType: 'AccountCreatedEvent',
        version: 1,
        occurredAt: new Date(),
        tenantId: 'tenant-1',
        serialize: vi.fn().mockReturnValue({ accountCode: '1000' }),
      },
      {
        id: 'e2',
        aggregateId: 'acc-124',
        eventType: 'AccountUpdatedEvent',
        version: 1,
        occurredAt: new Date(),
        tenantId: 'tenant-1',
        serialize: vi.fn().mockReturnValue({ accountCode: '1001' }),
      },
    ] as unknown as DomainEvent[];

    await service.publishEvents(mockEvents);

    expect(mockProducer.publishEvents).toHaveBeenCalledWith(mockEvents);
  });
});
