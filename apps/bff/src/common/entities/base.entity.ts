import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  tenant_id!: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at!: Date;

  @Column({ type: 'uuid', nullable: true })
  created_by?: string;

  @Column({ type: 'uuid', nullable: true })
  updated_by?: string;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'boolean', default: false })
  is_deleted!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @BeforeInsert()
  beforeInsert(): void {
    // Set tenant_id from context if not already set
    if (!this.tenant_id) {
      // This will be set by the tenant interceptor
      throw new Error('Tenant ID must be set before inserting entity');
    }
  }

  @BeforeUpdate()
  beforeUpdate(): void {
    // Ensure tenant_id is not changed
    if (!this.tenant_id) {
      throw new Error('Tenant ID must be set before updating entity');
    }
  }
}
