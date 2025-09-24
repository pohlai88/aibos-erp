import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

@Entity('account')
@Index(['tenantId', 'accountCode'], { unique: true })
@Index(['tenantId', 'parentAccountCode'])
export class AccountEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'account_code', type: 'varchar', length: 50 })
  accountCode!: string;

  @Column({ name: 'account_name', type: 'varchar', length: 255 })
  accountName!: string;

  @Column({ name: 'account_type', type: 'varchar', length: 50 })
  accountType!: string;

  @Column({ name: 'parent_account_code', type: 'varchar', length: 50, nullable: true })
  parentAccountCode?: string;

  @Column({ type: 'decimal', precision: 18, scale: 6, default: 0 })
  balance!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}
