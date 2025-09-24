import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('acc_event')
@Index(['tenantId', 'streamId', 'version'], { unique: true })
@Index(['tenantId', 'occurredAt'])
@Index(['tenantId', 'eventType'])
@Index(['idempotencyKey'], { unique: true, where: '"idempotency_key" IS NOT NULL' })
export class AccountingEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'stream_id', type: 'uuid' })
  streamId!: string;

  @Column({ type: 'integer' })
  version!: number;

  @Column({ name: 'event_type', type: 'varchar', length: 255 })
  eventType!: string;

  @Column({ name: 'event_data', type: 'jsonb' })
  eventData!: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ name: 'occurred_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  occurredAt!: Date;

  @Column({ name: 'correlation_id', type: 'uuid', nullable: true })
  correlationId?: string | null;

  @Column({ name: 'causation_id', type: 'uuid', nullable: true })
  causationId?: string | null;

  @Column({ name: 'idempotency_key', type: 'varchar', length: 128, nullable: true })
  idempotencyKey?: string | null;
}
