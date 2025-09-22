import type { AggregateRoot } from '../core/aggregate-root';
import type { DomainEvent } from '../core/domain-event';
import type { EventStore } from '../core/event-store';

import { ConcurrencyError } from '../core/event-store';

/**
 * In-memory implementation of the Event Store for testing
 */
export class MemoryEventStore implements EventStore {
    private events: Map<string, DomainEvent[]> = new Map();
    private streams: Map<string, number> = new Map();
    private snapshots: Map<string, AggregateRoot> = new Map();

    async append(
        streamId: string,
        events: DomainEvent[],
        expectedVersion: number
    ): Promise<void> {
        const currentVersion = this.streams.get(streamId) || 0;

        if (currentVersion !== expectedVersion) {
            throw new ConcurrencyError(streamId, expectedVersion, currentVersion);
        }

        if (!this.events.has(streamId)) {
            this.events.set(streamId, []);
        }

        this.events.get(streamId)!.push(...events);
        this.streams.set(streamId, expectedVersion + events.length);
    }

    async getEvents(streamId: string, fromVersion?: number): Promise<DomainEvent[]> {
        const events = this.events.get(streamId) || [];

        if (fromVersion) {
            return events.filter(event => event.version >= fromVersion);
        }

        return [...events];
    }

    async getEventsFromTimestamp(timestamp: Date): Promise<DomainEvent[]> {
        const allEvents: DomainEvent[] = [];

        for (const events of this.events.values()) {
            allEvents.push(...events);
        }

        return allEvents
            .filter(event => event.occurredAt >= timestamp)
            .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
    }

    async createSnapshot(streamId: string, aggregate: AggregateRoot): Promise<void> {
        this.snapshots.set(streamId, aggregate);
    }

    async getSnapshot(streamId: string): Promise<AggregateRoot | null> {
        return this.snapshots.get(streamId) || undefined;
    }

    async getStreamVersion(streamId: string): Promise<number> {
        return this.streams.get(streamId) || 0;
    }

    async streamExists(streamId: string): Promise<boolean> {
        return this.streams.has(streamId);
    }

    async deleteStream(streamId: string): Promise<void> {
        this.events.delete(streamId);
        this.streams.delete(streamId);
        this.snapshots.delete(streamId);
    }

    /**
     * Clear all data (for testing)
     */
    clear(): void {
        this.events.clear();
        this.streams.clear();
        this.snapshots.clear();
    }

    /**
     * Get all stream IDs
     */
    getAllStreamIds(): string[] {
        return [...this.streams.keys()];
    }

    /**
     * Get total event count
     */
    getTotalEventCount(): number {
        let total = 0;
        for (const events of this.events.values()) {
            total += events.length;
        }
        return total;
    }
}
