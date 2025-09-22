import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../auth/entities/user.entity';
import { Entity, Column, Index, OneToMany } from 'typeorm';

@Entity('tenants')
@Index(['subdomain'], { unique: true })
@Index(['domain'], { unique: true })
export class Tenant extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 50 })
  subdomain!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  domain?: string;

  @Column({ type: 'varchar', length: 255 })
  company_name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  company_logo?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  company_address?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  company_phone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  company_email?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  company_website?: string;

  @Column({ type: 'varchar', length: 50, default: 'en' })
  default_locale!: string;

  @Column({ type: 'varchar', length: 50, default: 'UTC' })
  default_timezone!: string;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  default_currency!: string;

  @Column({ type: 'varchar', length: 10, default: 'MM/DD/YYYY' })
  date_format!: string;

  @Column({ type: 'varchar', length: 10, default: '12' })
  time_format!: string;

  @Column({ type: 'jsonb', nullable: true })
  settings?: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  features?: string[];

  @Column({ type: 'timestamp with time zone', nullable: true })
  subscription_expires_at?: Date;

  @Column({ type: 'varchar', length: 50, default: 'trial' })
  subscription_plan!: string;

  @Column({ type: 'boolean', default: true })
  override is_active: boolean = true;

  @Column({ type: 'boolean', default: false })
  is_suspended!: boolean;

  @Column({ type: 'text', nullable: true })
  suspension_reason?: string;

  // Relationships
  @OneToMany(() => User, (user) => user.tenant_id)
  users!: User[];

  // Computed properties
  get display_name(): string {
    return this.company_name || this.name;
  }

  get is_subscription_active(): boolean {
    if (!this.subscription_expires_at) return true;
    return this.subscription_expires_at > new Date();
  }
}
