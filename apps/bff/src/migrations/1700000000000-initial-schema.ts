import type { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1700000000000 implements MigrationInterface {
  name = "InitialSchema1700000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create tenants table
    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "subdomain" character varying(50) NOT NULL,
        "domain" character varying(255),
        "company_name" character varying(255) NOT NULL,
        "company_logo" character varying(255),
        "company_address" character varying(500),
        "company_phone" character varying(100),
        "company_email" character varying(255),
        "company_website" character varying(100),
        "default_locale" character varying(50) NOT NULL DEFAULT 'en',
        "default_timezone" character varying(50) NOT NULL DEFAULT 'UTC',
        "default_currency" character varying(10) NOT NULL DEFAULT 'USD',
        "date_format" character varying(10) NOT NULL DEFAULT 'MM/DD/YYYY',
        "time_format" character varying(10) NOT NULL DEFAULT '12',
        "settings" jsonb,
        "features" jsonb,
        "subscription_expires_at" TIMESTAMP WITH TIME ZONE,
        "subscription_plan" character varying(50) NOT NULL DEFAULT 'trial',
        "is_active" boolean NOT NULL DEFAULT true,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "is_suspended" boolean NOT NULL DEFAULT false,
        "suspension_reason" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid,
        "metadata" jsonb,
        CONSTRAINT "PK_tenants" PRIMARY KEY ("id")
      )
    `);

    // Create unique indexes for tenants
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_tenants_subdomain" ON "tenants" ("subdomain")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_tenants_domain" ON "tenants" ("domain") WHERE "domain" IS NOT NULL`,
    );

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "username" character varying(255) NOT NULL,
        "email" character varying(255) NOT NULL,
        "first_name" character varying(255) NOT NULL,
        "last_name" character varying(255) NOT NULL,
        "middle_name" character varying(255),
        "password_hash" character varying(255) NOT NULL,
        "phone" character varying(20),
        "avatar_url" character varying(500),
        "last_login_at" TIMESTAMP WITH TIME ZONE,
        "last_login_ip" character varying(45),
        "email_verified" boolean NOT NULL DEFAULT false,
        "phone_verified" boolean NOT NULL DEFAULT false,
        "is_enabled" boolean NOT NULL DEFAULT true,
        "password_reset_required" boolean NOT NULL DEFAULT false,
        "password_reset_expires_at" TIMESTAMP WITH TIME ZONE,
        "password_reset_token" character varying(255),
        "preferences" jsonb,
        "locale" character varying(10) NOT NULL DEFAULT 'en',
        "timezone" character varying(50) NOT NULL DEFAULT 'UTC',
        "is_active" boolean NOT NULL DEFAULT true,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid,
        "metadata" jsonb,
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // Create unique indexes for users
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_users_tenant_email" ON "users" ("tenant_id", "email")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_users_tenant_username" ON "users" ("tenant_id", "username")`,
    );

    // Create roles table
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "name" character varying(100) NOT NULL,
        "code" character varying(50) NOT NULL,
        "description" text,
        "is_system_role" boolean NOT NULL DEFAULT true,
        "sort_order" integer NOT NULL DEFAULT 0,
        "permissions" jsonb,
        "is_active" boolean NOT NULL DEFAULT true,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid,
        "metadata" jsonb,
        CONSTRAINT "PK_roles" PRIMARY KEY ("id")
      )
    `);

    // Create unique indexes for roles
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_roles_tenant_name" ON "roles" ("tenant_id", "name")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_roles_tenant_code" ON "roles" ("tenant_id", "code")`,
    );

    // Create user_roles table
    await queryRunner.query(`
      CREATE TABLE "user_roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "role_id" uuid NOT NULL,
        "assigned_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        "expires_at" TIMESTAMP WITH TIME ZONE,
        "is_active" boolean NOT NULL DEFAULT true,
        "notes" text,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid,
        "metadata" jsonb,
        CONSTRAINT "PK_user_roles" PRIMARY KEY ("id")
      )
    `);

    // Create unique index for user_roles
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_user_roles_tenant_user_role" ON "user_roles" ("tenant_id", "user_id", "role_id")`,
    );

    // Create permissions table
    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "resource" character varying(100) NOT NULL,
        "action" character varying(50) NOT NULL,
        "description" text,
        "is_system_permission" boolean NOT NULL DEFAULT false,
        "conditions" jsonb,
        "role_id" uuid,
        "is_active" boolean NOT NULL DEFAULT true,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid,
        "metadata" jsonb,
        CONSTRAINT "PK_permissions" PRIMARY KEY ("id")
      )
    `);

    // Create unique index for permissions
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_permissions_tenant_resource_action" ON "permissions" ("tenant_id", "resource", "action")`,
    );

    // Add foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_users_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD CONSTRAINT "FK_roles_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "FK_user_roles_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "FK_user_roles_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "FK_user_roles_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" ADD CONSTRAINT "FK_permissions_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" ADD CONSTRAINT "FK_permissions_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Enable Row Level Security
    await queryRunner.query(`ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "users" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(
      `ALTER TABLE "user_roles" ENABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" ENABLE ROW LEVEL SECURITY`,
    );

    // Create RLS policies
    await queryRunner.query(
      `CREATE POLICY "tenant_isolation" ON "tenants" FOR ALL USING (true)`,
    );
    await queryRunner.query(
      `CREATE POLICY "user_tenant_isolation" ON "users" FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid)`,
    );
    await queryRunner.query(
      `CREATE POLICY "role_tenant_isolation" ON "roles" FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid)`,
    );
    await queryRunner.query(
      `CREATE POLICY "user_role_tenant_isolation" ON "user_roles" FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid)`,
    );
    await queryRunner.query(
      `CREATE POLICY "permission_tenant_isolation" ON "permissions" FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE "permissions"`);
    await queryRunner.query(`DROP TABLE "user_roles"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "tenants"`);
  }
}
