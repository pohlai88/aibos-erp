import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddOutboxResilienceFields1699999999999 implements MigrationInterface {
  name = 'AddOutboxResilienceFields1699999999999';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE outbox_events
      ADD COLUMN IF NOT EXISTS next_attempt_at timestamptz NULL,
      ADD COLUMN IF NOT EXISTS error_reason text NULL
    `);

    // Helpful indexes for the READY picker and throughput
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_outbox_status_next_created
      ON outbox_events (status, next_attempt_at, created_at)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_outbox_topic_created
      ON outbox_events (topic, created_at)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_outbox_topic_created`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_outbox_status_next_created`);
    await queryRunner.query(`
      ALTER TABLE outbox_events
      DROP COLUMN IF EXISTS next_attempt_at,
      DROP COLUMN IF EXISTS error_reason
    `);
  }
}
