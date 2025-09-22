import { BaseEntity } from "../../../common/entities/base.entity";
import { Role } from "./role.entity";
import { Entity, Column, Index, ManyToOne, JoinColumn } from "typeorm";

@Entity("permissions")
@Index(["tenant_id", "resource", "action"], { unique: true })
export class Permission extends BaseEntity {
  @Column({ type: "varchar", length: 100 })
  resource!: string;

  @Column({ type: "varchar", length: 50 })
  action!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "boolean", default: false })
  is_system_permission!: boolean;

  @Column({ type: "jsonb", nullable: true })
  conditions?: Record<string, unknown>;

  @Column({ type: "uuid", nullable: true })
  role_id?: string;

  // Relationships
  @ManyToOne(() => Role, (role) => role.role_permissions, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "role_id" })
  role?: Role;

  // Computed properties
  get permission_string(): string {
    return `${this.resource}:${this.action}`;
  }
}
