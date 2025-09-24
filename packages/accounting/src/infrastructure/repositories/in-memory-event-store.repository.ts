import type { DomainEvent } from '../../domain/events/domain-events';
import type { EventStore } from '../../domain/interfaces/repositories.interface';

export class InMemoryEventStore implements EventStore {
  private events: Map<string, DomainEvent[]> = new Map();

  async append(
    streamId: string,
    events: DomainEvent[],
    expectedVersion: number,
    tenantId: string,
  ): Promise<void> {
    const key = `${tenantId}:${streamId}`;
    const existingEvents = this.events.get(key) || [];

    // Check optimistic concurrency
    if (existingEvents.length !== expectedVersion) {
      throw new Error(
        `Concurrency conflict. Expected version ${expectedVersion}, but current version is ${existingEvents.length}`,
      );
    }

    // Add new events
    const newEvents = [...existingEvents, ...events];
    this.events.set(key, newEvents);
  }

  async getEvents(
    streamId: string,
    fromVersion?: number,
    tenantId?: string,
  ): Promise<DomainEvent[]> {
    const key = `${tenantId}:${streamId}`;
    const events = this.events.get(key) || [];

    if (fromVersion !== undefined) {
      return events.filter((event) => event.version >= fromVersion);
    }

    return events;
  }
}
