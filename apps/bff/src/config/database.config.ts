import type { TypeOrmModuleOptions } from "@nestjs/typeorm";

import { type ConfigService } from "@nestjs/config";

export const createDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: "postgres",
  host: configService.get("DB_HOST", "localhost"),
  port: configService.get("DB_PORT", 5432),
  username: configService.get("DB_USERNAME", "postgres"),
  password: configService.get("DB_PASSWORD", "password"),
  database: configService.get("DB_DATABASE", "aibos_erp"),
  entities: [__dirname + "/../**/*.entity{.ts,.js}"],
  synchronize: configService.get("NODE_ENV") === "development",
  logging: configService.get("NODE_ENV") === "development",
  ssl:
    configService.get("NODE_ENV") === "production"
      ? { rejectUnauthorized: false }
      : false,
  // Multi-tenancy configuration
  extra: {
    // Enable Row Level Security
    statement_timeout: 30_000,
    query_timeout: 30_000,
  },
});
