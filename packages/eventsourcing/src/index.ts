// Event Sourcing Core
export * from './core/domain-event';
export * from './core/aggregate-root';
export * from './core/event-store';
export * from './core/command';
export * from './core/event-handler';

// Event Store Implementations
export * from './stores/postgresql-event-store';
export * from './stores/memory-event-store';

// Outbox Pattern
export * from './outbox/outbox-event';
export * from './outbox/outbox-processor';
export * from './outbox/outbox-worker';

// Idempotency
export * from './idempotency/idempotency-key';
export * from './idempotency/idempotency-middleware';

// Projections
export * from './projections/projection';
export * from './projections/projection-rebuilder';
export * from './projections/projection-checkpoint-manager';

// Streaming (Kafka/Redpanda)
export * from './streaming/kafka-producer';
export * from './streaming/kafka-consumer';

// Schema Registry & Evolution
export * from './schema/schema-registry';
export * from './schema/upcaster';

// CLI Tools
export * from './cli/replay-cli';

// Utilities
export * from './utils/event-replay';
export * from './utils/snapshot';
export * from './utils/event-serializer';
