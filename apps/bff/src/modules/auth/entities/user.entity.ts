import { BaseEntity } from '../../../common/entities/base.entity';
import { UserRole } from './user-role.entity';
import { Exclude } from 'class-transformer';
import { Entity, Column, Index, OneToMany } from 'typeorm';

@Entity('users')
@Index(['tenant_id', 'email'], { unique: true })
@Index(['tenant_id', 'username'], { unique: true })
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  username!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  first_name!: string;

  @Column({ type: 'varchar', length: 255 })
  last_name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  middle_name?: string;

  @Exclude()
  @Column({ type: 'varchar', length: 255 })
  password_hash!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar_url?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  last_login_at?: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  last_login_ip?: string;

  @Column({ type: 'boolean', default: false })
  email_verified!: boolean;

  @Column({ type: 'boolean', default: false })
  phone_verified!: boolean;

  @Column({ type: 'boolean', default: true })
  is_enabled!: boolean;

  @Column({ type: 'boolean', default: false })
  password_reset_required!: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  password_reset_expires_at?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password_reset_token?: string;

  @Column({ type: 'jsonb', nullable: true })
  preferences?: Record<string, unknown>;

  @Column({ type: 'varchar', length: 10, default: 'en' })
  locale!: string;

  @Column({ type: 'varchar', length: 50, default: 'UTC' })
  timezone!: string;

  @Column({ type: 'uuid' })
  tenant_id!: string;

  // Relationships
  @OneToMany(() => UserRole, (userRole) => userRole.user)
  user_roles!: UserRole[];

  // Computed properties
  get full_name(): string {
    return `${this.first_name} ${this.last_name}`.trim();
  }

  get display_name(): string {
    return this.full_name || this.username;
  }
}
