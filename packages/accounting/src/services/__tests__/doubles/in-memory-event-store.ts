import type { EventStore } from '../../../domain/interfaces/repositories.interface';
import type { DomainEvent } from '@aibos/eventsourcing';
import type { EntityManager } from 'typeorm';

/**
 * In-memory EventStore implementation for testing.
 * Provides deterministic event storage with proper concurrency control
 * and event shape validation.
 */
export class InMemoryEventStore implements EventStore {
  private streams = new Map<string, DomainEvent[]>();

  reset(): void {
    this.streams.clear();
  }

  async append(
    streamId: string,
    events: DomainEvent[],
    expectedVersion: number,
    tenantId: string,
    _idempotencyKey?: string,
  ): Promise<void> {
    const key = `${tenantId}:${streamId}`;
    const current = this.streams.get(key) ?? [];

    if (current.length !== expectedVersion) {
      throw new Error(
        `ConcurrencyError: expectedVersion=${expectedVersion}, actual=${current.length}`,
      );
    }

    // Validate event shape but store original events
    events.forEach((event) => this.validateEventShape(event));
    this.streams.set(key, current.concat(events));
  }

  async appendWithTransaction(
    streamId: string,
    events: DomainEvent[],
    expectedVersion: number,
    tenantId: string,
    idempotencyKey?: string,
  ): Promise<EntityManager> {
    await this.append(streamId, events, expectedVersion, tenantId, idempotencyKey);
    return {} as EntityManager;
  }

  async getEvents(
    streamId: string,
    fromVersion?: number,
    tenantId?: string,
  ): Promise<DomainEvent[]> {
    const key = `${tenantId}:${streamId}`;
    const events = this.streams.get(key) ?? [];

    if (fromVersion !== undefined) {
      return events.filter((event) => event.version >= fromVersion);
    }

    // Return the original events, not the validated ones
    return events.slice();
  }

  /**
   * Validates that an event has the required shape for testing.
   * This ensures deterministic test behavior.
   */
  private validateEventShape(event: DomainEvent): void {
    if (!event.id || typeof event.id !== 'string') {
      throw new Error('Event must have a valid id');
    }
    if (!event.eventType || typeof event.eventType !== 'string') {
      throw new Error('Event must have a valid eventType');
    }
    if (!event.occurredAt || !(event.occurredAt instanceof Date)) {
      throw new Error('Event must have a valid occurredAt date');
    }
    if (typeof event.version !== 'number' || event.version < 0) {
      throw new Error('Event must have a valid version number');
    }
    if (!event.tenantId || typeof event.tenantId !== 'string') {
      throw new Error('Event must have a valid tenantId');
    }
  }
}
