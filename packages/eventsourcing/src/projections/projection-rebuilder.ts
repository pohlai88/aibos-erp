import type { EventStore } from '../core/event-store';
import type { Projection } from './projection';

/**
 * Configuration for projection rebuilding
 */
export interface ProjectionRebuilderConfig {
    batchSize: number;
    checkpointInterval: number;
    maxRetries: number;
    retryDelayMs: number;
}

/**
 * Default configuration for projection rebuilding
 */
export const DEFAULT_REBUILDER_CONFIG: ProjectionRebuilderConfig = {
    batchSize: 1000,
    checkpointInterval: 100,
    maxRetries: 3,
    retryDelayMs: 1000,
};

/**
 * Projection rebuilder for rebuilding projections from events
 */
export class ProjectionRebuilder {
    private config: ProjectionRebuilderConfig;

    constructor(
        private eventStore: EventStore,
        config: Partial<ProjectionRebuilderConfig> = {}
    ) {
        this.config = { ...DEFAULT_REBUILDER_CONFIG, ...config };
    }

    /**
     * Rebuild a projection from all events
     */
    async rebuildProjection(projection: Projection): Promise<void> {
        console.log(`Starting rebuild of projection: ${projection.getName()}`);

        const startTime = Date.now();
        let processedCount = 0;
        let lastCheckpoint = 0;

        try {
            // Reset the projection
            await projection.reset();

            // Get all events from the beginning
            const allEvents = await this.eventStore.getEventsFromTimestamp(
                new Date('1970-01-01')
            );

            // Filter events that this projection handles
            const relevantEvents = allEvents.filter(event =>
                projection.getEventTypes().includes(event.eventType)
            );

            console.log(
                `Found ${relevantEvents.length} relevant events for projection ${projection.getName()}`
            );

            // Process events in batches
            for (let index = 0; index < relevantEvents.length; index += this.config.batchSize) {
                const batch = relevantEvents.slice(index, index + this.config.batchSize);

                for (const event of batch) {
                    await projection.process(event);
                    processedCount++;
                }

                // Checkpoint
                if (processedCount - lastCheckpoint >= this.config.checkpointInterval) {
                    console.log(
                        `Processed ${processedCount}/${relevantEvents.length} events for projection ${projection.getName()}`
                    );
                    lastCheckpoint = processedCount;
                }
            }

            const duration = Date.now() - startTime;
            console.log(
                `Completed rebuild of projection ${projection.getName()}: ${processedCount} events processed in ${duration}ms`
            );
        } catch (error) {
            console.error(
                `Failed to rebuild projection ${projection.getName()}:`,
                error
            );
            throw error;
        }
    }

    /**
     * Rebuild a projection from a specific timestamp
     */
    async rebuildProjectionFromTimestamp(
        projection: Projection,
        fromTimestamp: Date
    ): Promise<void> {
        console.log(
            `Starting rebuild of projection ${projection.getName()} from ${fromTimestamp.toISOString()}`
        );

        const startTime = Date.now();
        let processedCount = 0;

        try {
            // Get events from the timestamp
            const events = await this.eventStore.getEventsFromTimestamp(fromTimestamp);

            // Filter events that this projection handles
            const relevantEvents = events.filter(event =>
                projection.getEventTypes().includes(event.eventType)
            );

            console.log(
                `Found ${relevantEvents.length} relevant events for projection ${projection.getName()}`
            );

            // Process events
            for (const event of relevantEvents) {
                await projection.process(event);
                processedCount++;
            }

            const duration = Date.now() - startTime;
            console.log(
                `Completed rebuild of projection ${projection.getName()}: ${processedCount} events processed in ${duration}ms`
            );
        } catch (error) {
            console.error(
                `Failed to rebuild projection ${projection.getName()}:`,
                error
            );
            throw error;
        }
    }

    /**
     * Rebuild multiple projections
     */
    async rebuildProjections(projections: Projection[]): Promise<void> {
        console.log(`Starting rebuild of ${projections.length} projections`);

        const startTime = Date.now();

        for (const projection of projections) {
            await this.rebuildProjection(projection);
        }

        const duration = Date.now() - startTime;
        console.log(
            `Completed rebuild of ${projections.length} projections in ${duration}ms`
        );
    }

    /**
     * Validate projection consistency
     */
    async validateProjection(projection: Projection): Promise<boolean> {
        try {
            const state = projection.getState();

            // Basic validation - check if state is valid JSON
            JSON.stringify(state);

            console.log(`Projection ${projection.getName()} validation passed`);
            return true;
        } catch (error) {
            console.error(
                `Projection ${projection.getName()} validation failed:`,
                error
            );
            return false;
        }
    }
}
