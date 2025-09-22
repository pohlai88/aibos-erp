import type { DomainEvent } from '../core/domain-event';

/**
 * Base interface for projections
 */
export interface Projection {
  /**
   * Get the projection name
   */
  getName(): string;

  /**
   * Get the event types this projection handles
   */
  getEventTypes(): string[];

  /**
   * Process a domain event
   */
  process(event: DomainEvent): Promise<void>;

  /**
   * Rebuild the projection from events
   */
  rebuild(events: DomainEvent[]): Promise<void>;

  /**
   * Get the current state of the projection
   */
  getState(): Record<string, unknown>;

  /**
   * Reset the projection
   */
  reset(): Promise<void>;
}

/**
 * Abstract base class for projections
 */
export abstract class BaseProjection implements Projection {
  protected state: Record<string, unknown> = {};

  /**
   * Get the projection name
   */
  abstract getName(): string;

  /**
   * Get the event types this projection handles
   */
  abstract getEventTypes(): string[];

  /**
   * Process a domain event
   */
  abstract process(event: DomainEvent): Promise<void>;

  /**
   * Rebuild the projection from events
   */
  async rebuild(events: DomainEvent[]): Promise<void> {
    this.reset();

    for (const event of events) {
      if (this.getEventTypes().includes(event.eventType)) {
        await this.process(event);
      }
    }
  }

  /**
   * Get the current state of the projection
   */
  getState(): Record<string, unknown> {
    return { ...this.state };
  }

  /**
   * Reset the projection
   */
  async reset(): Promise<void> {
    this.state = {};
  }

  /**
   * Check if this projection can handle the event
   */
  canHandle(event: DomainEvent): boolean {
    return this.getEventTypes().includes(event.eventType);
  }
}
