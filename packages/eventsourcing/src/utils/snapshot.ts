import type { AggregateRoot } from '../core/aggregate-root';
import type { EventStore } from '../core/event-store';

/**
 * Snapshot configuration
 */
export interface SnapshotConfig {
    snapshotThreshold: number;
    compressionEnabled: boolean;
    encryptionEnabled: boolean;
}

/**
 * Default snapshot configuration
 */
export const DEFAULT_SNAPSHOT_CONFIG: SnapshotConfig = {
    snapshotThreshold: 100,
    compressionEnabled: false,
    encryptionEnabled: false,
};

/**
 * Snapshot manager for creating and managing aggregate snapshots
 */
export class SnapshotManager {
    private config: SnapshotConfig;

    constructor(
        private eventStore: EventStore,
        config: Partial<SnapshotConfig> = {}
    ) {
        this.config = { ...DEFAULT_SNAPSHOT_CONFIG, ...config };
    }

    /**
     * Create a snapshot if needed
     */
    async createSnapshotIfNeeded(
        streamId: string,
        aggregate: AggregateRoot
    ): Promise<void> {
        const currentVersion = aggregate.getVersion();

        if (currentVersion > 0 && currentVersion % this.config.snapshotThreshold === 0) {
            await this.createSnapshot(streamId, aggregate);
        }
    }

    /**
     * Create a snapshot
     */
    async createSnapshot(
        streamId: string,
        aggregate: AggregateRoot
    ): Promise<void> {
        console.log(`Creating snapshot for stream ${streamId} at version ${aggregate.getVersion()}`);

        try {
            await this.eventStore.createSnapshot(streamId, aggregate);
            console.log(`Snapshot created successfully for stream ${streamId}`);
        } catch (error) {
            console.error(`Failed to create snapshot for stream ${streamId}:`, error);
            throw error;
        }
    }

    /**
     * Get a snapshot
     */
    async getSnapshot(streamId: string): Promise<AggregateRoot | null> {
        try {
            return await this.eventStore.getSnapshot(streamId);
        } catch (error) {
            console.error(`Failed to get snapshot for stream ${streamId}:`, error);
            return undefined;
        }
    }

    /**
     * Rebuild aggregate from snapshot and events
     */
    async rebuildAggregate<T extends AggregateRoot>(
        streamId: string,
        aggregateClass: new (id: string, version: number) => T
    ): Promise<T> {
        // Try to get snapshot first
        const snapshot = await this.getSnapshot(streamId);

        if (snapshot) {
            console.log(`Rebuilding aggregate ${streamId} from snapshot at version ${snapshot.getVersion()}`);

            // Get events after snapshot
            const events = await this.eventStore.getEvents(
                streamId,
                snapshot.getVersion() + 1
            );

      // Apply events to snapshot
      return (aggregateClass as unknown).fromEvents(
        streamId,
        events
      ) as T;
        } else {
            console.log(`No snapshot found for stream ${streamId}, rebuilding from all events`);

      // Rebuild from all events
      const events = await this.eventStore.getEvents(streamId);
      return (aggregateClass as unknown).fromEvents(streamId, events) as T;
        }
    }

    /**
     * Check if snapshot exists
     */
    async hasSnapshot(streamId: string): Promise<boolean> {
        const snapshot = await this.getSnapshot(streamId);
        return snapshot !== null;
    }

    /**
     * Get snapshot statistics
     */
    async getSnapshotStatistics(streamId: string): Promise<{
        hasSnapshot: boolean;
        snapshotVersion?: number;
        eventsAfterSnapshot?: number;
    }> {
        const snapshot = await this.getSnapshot(streamId);

        if (!snapshot) {
            return { hasSnapshot: false };
        }

        const events = await this.eventStore.getEvents(
            streamId,
            snapshot.getVersion() + 1
        );

        return {
            hasSnapshot: true,
            snapshotVersion: snapshot.getVersion(),
            eventsAfterSnapshot: events.length,
        };
    }

    /**
     * Clean up old snapshots
     */
    async cleanupOldSnapshots(keepLatest: number = 5): Promise<void> {
        // This would be implemented based on the specific event store implementation
        console.log(`Cleaning up old snapshots, keeping latest ${keepLatest}`);
    }
}
