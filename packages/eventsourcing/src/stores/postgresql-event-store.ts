import type { AggregateRoot } from '../core/aggregate-root';
import type { DomainEvent } from '../core/domain-event';
import type { EventStore, EventStoreConfig } from '../core/event-store';
import type { Pool } from 'pg';

import { ConcurrencyError } from '../core/event-store';
import { Pool as PgPool } from 'pg';

/**
 * PostgreSQL implementation of the Event Store
 */
export class PostgreSQLEventStore implements EventStore {
  private pool: Pool;
  private schema: string;
  private tablePrefix: string;

  constructor(config: EventStoreConfig) {
    this.pool = new PgPool({
      connectionString: config.connectionString,
      max: 20,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 2000,
    });
    this.schema = config.schema || 'public';
    this.tablePrefix = config.tablePrefix || 'es';
  }

  async append(streamId: string, events: DomainEvent[], expectedVersion: number): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Check current version
      const versionResult = await client.query(
        `SELECT version FROM ${this.schema}.${this.tablePrefix}_streams WHERE stream_id = $1`,
        [streamId],
      );

      const currentVersion = versionResult.rows[0]?.version || 0;

      if (currentVersion !== expectedVersion) {
        throw new ConcurrencyError(streamId, expectedVersion, currentVersion);
      }

      // Insert events
      for (const event of events) {
        await client.query(
          `INSERT INTO ${this.schema}.${this.tablePrefix}_events 
           (id, stream_id, version, event_type, event_data, metadata, tenant_id, created_at, created_by, correlation_id, causation_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            event.id,
            streamId,
            event.version,
            event.eventType,
            JSON.stringify(event.serialize()),
            JSON.stringify({
              occurredAt: event.occurredAt,
              correlationId: event.correlationId,
              causationId: event.causationId,
            }),
            event.tenantId,
            event.occurredAt,
            'system', // TODO: Get from context
            event.correlationId,
            event.causationId,
          ],
        );
      }

      // Update stream version
      await (versionResult.rows.length === 0
        ? client.query(
            `INSERT INTO ${this.schema}.${this.tablePrefix}_streams (stream_id, version) VALUES ($1, $2)`,
            [streamId, expectedVersion + events.length],
          )
        : client.query(
            `UPDATE ${this.schema}.${this.tablePrefix}_streams SET version = $1 WHERE stream_id = $2`,
            [expectedVersion + events.length, streamId],
          ));

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getEvents(streamId: string, fromVersion?: number): Promise<DomainEvent[]> {
    const client = await this.pool.connect();

    try {
      const query = `
        SELECT id, stream_id, version, event_type, event_data, metadata, tenant_id, created_at, created_by, correlation_id, causation_id
        FROM ${this.schema}.${this.tablePrefix}_events
        WHERE stream_id = $1
        ${fromVersion ? 'AND version >= $2' : ''}
        ORDER BY version ASC
      `;

      const params = fromVersion ? [streamId, fromVersion] : [streamId];
      const result = await client.query(query, params);

      return result.rows.map((row: unknown) => this.deserializeEvent(row));
    } finally {
      client.release();
    }
  }

  async getEventsFromTimestamp(timestamp: Date): Promise<DomainEvent[]> {
    const client = await this.pool.connect();

    try {
      const result = await client.query(
        `SELECT id, stream_id, version, event_type, event_data, metadata, tenant_id, created_at, created_by, correlation_id, causation_id
         FROM ${this.schema}.${this.tablePrefix}_events
         WHERE created_at >= $1
         ORDER BY created_at ASC`,
        [timestamp],
      );

      return result.rows.map((row: unknown) => this.deserializeEvent(row));
    } finally {
      client.release();
    }
  }

  async createSnapshot(streamId: string, aggregate: AggregateRoot): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query(
        `INSERT INTO ${this.schema}.${this.tablePrefix}_snapshots 
         (stream_id, version, snapshot_data, created_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (stream_id) DO UPDATE SET
         version = EXCLUDED.version,
         snapshot_data = EXCLUDED.snapshot_data,
         created_at = EXCLUDED.created_at`,
        [streamId, aggregate.getVersion(), JSON.stringify(aggregate), new Date()],
      );
    } finally {
      client.release();
    }
  }

  async getSnapshot(streamId: string): Promise<AggregateRoot | null> {
    const client = await this.pool.connect();

    try {
      const result = await client.query(
        `SELECT version, snapshot_data FROM ${this.schema}.${this.tablePrefix}_snapshots WHERE stream_id = $1`,
        [streamId],
      );

      if (result.rows.length === 0) {
        return null;
      }

      // TODO: Implement proper deserialization based on aggregate type
      return JSON.parse(result.rows[0].snapshot_data);
    } finally {
      client.release();
    }
  }

  async getStreamVersion(streamId: string): Promise<number> {
    const client = await this.pool.connect();

    try {
      const result = await client.query(
        `SELECT version FROM ${this.schema}.${this.tablePrefix}_streams WHERE stream_id = $1`,
        [streamId],
      );

      return result.rows[0]?.version || 0;
    } finally {
      client.release();
    }
  }

  async streamExists(streamId: string): Promise<boolean> {
    const client = await this.pool.connect();

    try {
      const result = await client.query(
        `SELECT 1 FROM ${this.schema}.${this.tablePrefix}_streams WHERE stream_id = $1`,
        [streamId],
      );

      return result.rows.length > 0;
    } finally {
      client.release();
    }
  }

  async deleteStream(streamId: string): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      await client.query(
        `DELETE FROM ${this.schema}.${this.tablePrefix}_events WHERE stream_id = $1`,
        [streamId],
      );

      await client.query(
        `DELETE FROM ${this.schema}.${this.tablePrefix}_snapshots WHERE stream_id = $1`,
        [streamId],
      );

      await client.query(
        `DELETE FROM ${this.schema}.${this.tablePrefix}_streams WHERE stream_id = $1`,
        [streamId],
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private deserializeEvent(_row: unknown): DomainEvent {
    // TODO: Implement proper event deserialization based on event type
    throw new Error('Event deserialization not implemented');
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
