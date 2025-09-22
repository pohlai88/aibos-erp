import { AggregateRoot } from '../core/aggregate-root';
import { DomainEvent } from '../core/domain-event';
import { MemoryEventStore } from '../stores/memory-event-store';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

const TEST_TENANT_ID = 'test-tenant-1';
const TEST_STREAM_ID = TEST_STREAM_ID;

// Test event class
class TestEvent extends DomainEvent {
    constructor(
        aggregateId: string,
        version: number,
        tenantId: string,
        public readonly message: string
    ) {
        super(aggregateId, version, tenantId);
    }

    get eventType(): string {
        return 'TestEvent';
    }

    serialize(): Record<string, unknown> {
        return { message: this.message };
    }
}

// Test aggregate class
class TestAggregate extends AggregateRoot {
    private messages: string[] = [];

    constructor(id: string, version: number = 0) {
        super(id, version);
    }

    addMessage(message: string): void {
        this.addEvent(new TestEvent(this.id, this.getVersion() + 1, TEST_TENANT_ID, message));
    }

    protected apply(event: DomainEvent): void {
        if (event instanceof TestEvent) {
            this.messages.push(event.message);
        }
    }

    getMessages(): string[] {
        return [...this.messages];
    }
}

describe('MemoryEventStore', () => {
    let eventStore: MemoryEventStore;

    beforeEach(() => {
        eventStore = new MemoryEventStore();
    });

    afterEach(() => {
        eventStore.clear();
    });

    describe('append', () => {
        it('should append events to a stream', async () => {
            const streamId = TEST_STREAM_ID;
            const events = [
                new TestEvent(streamId, 1, TEST_TENANT_ID, 'Hello'),
                new TestEvent(streamId, 2, TEST_TENANT_ID, 'World'),
            ];

            await eventStore.append(streamId, events, 0);

            const retrievedEvents = await eventStore.getEvents(streamId);
            expect(retrievedEvents).toHaveLength(2);
            expect(retrievedEvents[0].eventType).toBe('TestEvent');
            expect(retrievedEvents[1].eventType).toBe('TestEvent');
        });

        it('should throw ConcurrencyError for wrong expected version', async () => {
            const streamId = TEST_STREAM_ID;
            const events = [new TestEvent(streamId, 1, TEST_TENANT_ID, 'Hello')];

            await eventStore.append(streamId, events, 0);

            await expect(
                eventStore.append(streamId, events, 0)
            ).rejects.toThrow('Concurrency conflict');
        });
    });

    describe('getEvents', () => {
        it('should retrieve events from a stream', async () => {
            const streamId = TEST_STREAM_ID;
            const events = [
                new TestEvent(streamId, 1, TEST_TENANT_ID, 'Hello'),
                new TestEvent(streamId, 2, TEST_TENANT_ID, 'World'),
            ];

            await eventStore.append(streamId, events, 0);

            const retrievedEvents = await eventStore.getEvents(streamId);
            expect(retrievedEvents).toHaveLength(2);
        });

        it('should retrieve events from a specific version', async () => {
            const streamId = TEST_STREAM_ID;
            const events = [
                new TestEvent(streamId, 1, TEST_TENANT_ID, 'Hello'),
                new TestEvent(streamId, 2, TEST_TENANT_ID, 'World'),
                new TestEvent(streamId, 3, TEST_TENANT_ID, 'Test'),
            ];

            await eventStore.append(streamId, events, 0);

            const retrievedEvents = await eventStore.getEvents(streamId, 2);
            expect(retrievedEvents).toHaveLength(2);
            expect(retrievedEvents[0].version).toBe(2);
            expect(retrievedEvents[1].version).toBe(3);
        });
    });

    describe('snapshots', () => {
        it('should create and retrieve snapshots', async () => {
            const streamId = TEST_STREAM_ID;
            const aggregate = new TestAggregate(streamId);
            aggregate.addMessage('Hello');
            aggregate.addMessage('World');

            await eventStore.createSnapshot(streamId, aggregate);

            const snapshot = await eventStore.getSnapshot(streamId);
            expect(snapshot).toBeDefined();
            expect(snapshot?.getVersion()).toBe(2);
        });
    });

    describe('stream management', () => {
        it('should check if stream exists', async () => {
            const streamId = TEST_STREAM_ID;

            expect(await eventStore.streamExists(streamId)).toBe(false);

            const events = [new TestEvent(streamId, 1, TEST_TENANT_ID, 'Hello')];
            await eventStore.append(streamId, events, 0);

            expect(await eventStore.streamExists(streamId)).toBe(true);
        });

        it('should get stream version', async () => {
            const streamId = TEST_STREAM_ID;

            expect(await eventStore.getStreamVersion(streamId)).toBe(0);

            const events = [new TestEvent(streamId, 1, TEST_TENANT_ID, 'Hello')];
            await eventStore.append(streamId, events, 0);

            expect(await eventStore.getStreamVersion(streamId)).toBe(1);
        });

        it('should delete stream', async () => {
            const streamId = TEST_STREAM_ID;
            const events = [new TestEvent(streamId, 1, TEST_TENANT_ID, 'Hello')];

            await eventStore.append(streamId, events, 0);
            expect(await eventStore.streamExists(streamId)).toBe(true);

            await eventStore.deleteStream(streamId);
            expect(await eventStore.streamExists(streamId)).toBe(false);
        });
    });
});
