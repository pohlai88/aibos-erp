import { BaseEntity } from '../../../common/entities/base.entity';
import { Role } from './role.entity';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity('permissions')
export class Permission extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  resource: string;

  @Column()
  action: string;

  @Column({ nullable: true })
  role_id?: string;

  @ManyToOne(() => Role, (role) => role.permissions)
  @JoinColumn({ name: 'role_id' })
  role?: Role;
}
