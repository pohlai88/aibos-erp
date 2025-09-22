import type { DomainEvent } from "../core/domain-event";

/**
 * Event serialization interface
 */
export interface EventSerializer {
  serialize(event: DomainEvent): string;
  deserialize<T extends DomainEvent>(eventType: string, data: string): T;
}

/**
 * JSON-based event serializer
 */
export class JsonEventSerializer implements EventSerializer {
  private eventTypes: Map<string, new (...args: unknown[]) => DomainEvent> =
    new Map();

  /**
   * Register an event type for deserialization
   */
  registerEventType(
    eventType: string,
    eventClass: new (...args: unknown[]) => DomainEvent,
  ): void {
    this.eventTypes.set(eventType, eventClass);
  }

  /**
   * Serialize an event to JSON
   */
  serialize(event: DomainEvent): string {
    const data = {
      id: event.id,
      aggregateId: event.aggregateId,
      version: event.version,
      eventType: event.eventType,
      occurredAt: event.occurredAt,
      tenantId: event.tenantId,
      correlationId: event.correlationId,
      causationId: event.causationId,
      data: event.serialize(),
    };

    return JSON.stringify(data);
  }

  /**
   * Deserialize an event from JSON
   */
  deserialize<T extends DomainEvent>(eventType: string, data: string): T {
    const parsed = JSON.parse(data);

    const EventClass = this.eventTypes.get(eventType);
    if (!EventClass) {
      throw new Error(`Unknown event type: ${eventType}`);
    }

    // Create event instance
    const event = new EventClass(
      parsed.aggregateId,
      parsed.version,
      parsed.tenantId,
      parsed.correlationId,
      parsed.causationId,
    );

    // Set additional properties
    (event as unknown as { id: string }).id = parsed.id;
    (event as unknown as { occurredAt: Date }).occurredAt = new Date(
      parsed.occurredAt,
    );

    return event as T;
  }

  /**
   * Get registered event types
   */
  getRegisteredEventTypes(): string[] {
    return [...this.eventTypes.keys()];
  }

  /**
   * Check if an event type is registered
   */
  isEventTypeRegistered(eventType: string): boolean {
    return this.eventTypes.has(eventType);
  }
}

/**
 * Default event serializer instance
 */
export const defaultEventSerializer = new JsonEventSerializer();
