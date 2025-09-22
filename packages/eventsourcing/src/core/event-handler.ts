import type { DomainEvent } from './domain-event';

/**
 * Base interface for event handlers
 */
export interface EventHandler<T extends DomainEvent = DomainEvent> {
    /**
     * Handle a domain event
     */
    handle(event: T): Promise<void>;

    /**
     * Get the event type this handler processes
     */
    getEventType(): string;

    /**
     * Check if this handler can process the event
     */
    canHandle(event: DomainEvent): boolean;
}

/**
 * Abstract base class for event handlers
 */
export abstract class BaseEventHandler<T extends DomainEvent = DomainEvent>
    implements EventHandler<T>
{
    /**
     * Handle a domain event
     */
    abstract handle(event: T): Promise<void>;

    /**
     * Get the event type this handler processes
     */
    abstract getEventType(): string;

    /**
     * Check if this handler can process the event
     */
    canHandle(event: DomainEvent): boolean {
        return event.eventType === this.getEventType();
    }
}

/**
 * Event handler registry for managing event handlers
 */
export class EventHandlerRegistry {
    private handlers: Map<string, EventHandler[]> = new Map();

    /**
     * Register an event handler
     */
    register(handler: EventHandler): void {
        const eventType = handler.getEventType();

        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, []);
        }

        this.handlers.get(eventType)!.push(handler);
    }

    /**
     * Get handlers for an event type
     */
    getHandlers(eventType: string): EventHandler[] {
        return this.handlers.get(eventType) || [];
    }

    /**
     * Get all registered event types
     */
    getEventTypes(): string[] {
        return [...this.handlers.keys()];
    }

    /**
     * Clear all handlers
     */
    clear(): void {
        this.handlers.clear();
    }

    /**
     * Get handler count for an event type
     */
    getHandlerCount(eventType: string): number {
        return this.handlers.get(eventType)?.length || 0;
    }
}
