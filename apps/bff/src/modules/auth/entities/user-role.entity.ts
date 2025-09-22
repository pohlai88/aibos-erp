import { BaseEntity } from "../../../common/entities/base.entity";
import { Role } from "./role.entity";
import { User } from "./user.entity";
import { Entity, Column, Index, ManyToOne, JoinColumn } from "typeorm";

@Entity("user_roles")
@Index(["tenant_id", "user_id", "role_id"], { unique: true })
export class UserRole extends BaseEntity {
  @Column({ type: "uuid" })
  user_id!: string;

  @Column({ type: "uuid" })
  role_id!: string;

  @Column({ type: "timestamp with time zone", nullable: true })
  assigned_at?: Date;

  @Column({ type: "timestamp with time zone", nullable: true })
  expires_at?: Date;

  @Column({ type: "boolean", default: true })
  override is_active: boolean = true;

  @Column({ type: "text", nullable: true })
  notes?: string;

  // Relationships
  @ManyToOne(() => User, (user) => user.user_roles, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @ManyToOne(() => Role, (role) => role.user_roles, { onDelete: "CASCADE" })
  @JoinColumn({ name: "role_id" })
  role!: Role;
}
