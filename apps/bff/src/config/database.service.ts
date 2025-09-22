import type { DataSource } from "typeorm";

import { Injectable, type OnModuleInit } from "@nestjs/common";
import { type ConfigService } from "@nestjs/config";

@Injectable()
export class DatabaseService implements OnModuleInit {
  constructor(
    private readonly _dataSource: DataSource,
    private readonly _configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      // Test database connection
      await this._dataSource.initialize();
      console.log("✅ Database connection established");

      // Run migrations if in development
      if (this._configService.get("NODE_ENV") === "development") {
        await this.runMigrations();
        await this.seedDevelopmentData();
      }
    } catch (error) {
      console.error("❌ Database connection failed:", (error as Error).message);
      throw error;
    }
  }

  private async runMigrations(): Promise<void> {
    try {
      const pendingMigrations = await this._dataSource.showMigrations();
      if (pendingMigrations) {
        console.log("🔄 Running pending migrations...");
        await this._dataSource.runMigrations();
        console.log("✅ Migrations completed");
      } else {
        console.log("✅ Database is up to date");
      }
    } catch (error) {
      console.error("❌ Migration failed:", (error as Error).message);
      throw error;
    }
  }

  private async seedDevelopmentData(): Promise<void> {
    try {
      // Check if data already exists
      const tenantCount = await this._dataSource.query(
        "SELECT COUNT(*) FROM tenants",
      );
      if (tenantCount[0].count > 0) {
        console.log("✅ Development data already exists");
        return;
      }

      console.log("🌱 Seeding development data...");
      const { seedDevelopmentData } = await import("../seeds/development.seed");
      await seedDevelopmentData(this._dataSource);
    } catch (error) {
      console.error("❌ Seeding failed:", (error as Error).message);
      // Don't throw error for seeding failures in development
      console.log("⚠️ Continuing without seed data...");
    }
  }

  async setTenantContext(tenantId: string): Promise<void> {
    await this._dataSource.query(`SET app.current_tenant_id = '${tenantId}'`);
  }

  async clearTenantContext(): Promise<void> {
    await this._dataSource.query(`SET app.current_tenant_id = NULL`);
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      await this._dataSource.query("SELECT 1");
      return {
        status: "healthy",
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
      };
    }
  }
}
