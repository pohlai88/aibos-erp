import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'outbox_events' })
export class OutboxEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  tenantId!: string;

  @Column({ type: 'text' })
  topic!: string;

  @Column({ type: 'text' })
  key!: string;

  @Column({ type: 'jsonb' })
  payload!: unknown;

  @Column({ type: 'text' })
  status!: 'READY' | 'PROCESSING' | 'PUBLISHED' | 'FAILED';

  @Column({ type: 'int', default: 0 })
  retryCount!: number;

  @Column({ type: 'timestamptz', nullable: true })
  nextAttemptAt?: Date | null;

  @Column({ type: 'text', nullable: true })
  errorReason?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  processedAt?: Date | null;
}
