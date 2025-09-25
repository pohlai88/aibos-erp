import type { DomainEvent } from '@aibos/eventsourcing';
import type { EntityManager } from 'typeorm';

export class InMemoryEventStore {
  private events: Map<string, DomainEvent[]> = new Map();

  async append(
    streamId: string,
    events: DomainEvent[],
    expectedVersion: number,
    _tenantId: string,
    _idempotencyKey?: string,
  ): Promise<void> {
    const currentEvents = this.events.get(streamId) || [];

    // Check optimistic concurrency
    if (currentEvents.length !== expectedVersion) {
      throw new Error(
        `ConcurrencyError: Expected version ${expectedVersion}, but stream has ${currentEvents.length} events`,
      );
    }

    const newEvents = [...currentEvents, ...events];
    this.events.set(streamId, newEvents);
  }

  async appendWithTransaction(
    streamId: string,
    events: DomainEvent[],
    expectedVersion: number,
    tenantId: string,
    idempotencyKey?: string,
  ): Promise<EntityManager> {
    await this.append(streamId, events, expectedVersion, tenantId, idempotencyKey);
    // Return a mock EntityManager for testing
    return {} as EntityManager;
  }

  async getEvents(
    streamId: string,
    fromVersion?: number,
    _tenantId?: string,
  ): Promise<DomainEvent[]> {
    const allEvents = this.events.get(streamId) || [];

    if (fromVersion !== undefined) {
      return allEvents.slice(fromVersion);
    }

    return allEvents;
  }
}
