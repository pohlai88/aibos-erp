import { BaseEntity } from "../../../common/entities/base.entity";
import { Permission } from "./permission.entity";
import { UserRole } from "./user-role.entity";
import { Entity, Column, Index, OneToMany } from "typeorm";

@Entity("roles")
@Index(["tenant_id", "name"], { unique: true })
@Index(["tenant_id", "code"], { unique: true })
export class Role extends BaseEntity {
  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "varchar", length: 50 })
  code!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "boolean", default: true })
  is_system_role!: boolean;

  @Column({ type: "integer", default: 0 })
  sort_order!: number;

  @Column({ type: "jsonb", nullable: true })
  permissions?: string[];

  // Relationships
  @OneToMany(() => UserRole, (userRole) => userRole.role)
  user_roles!: UserRole[];

  @OneToMany(() => Permission, (permission) => permission.role)
  role_permissions!: Permission[];
}
