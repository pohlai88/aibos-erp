import { createDatabaseConfig } from "./config/database.config.js";
import { DatabaseService } from "./config/database.service.js";
import { HealthModule } from "./health/health.module.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService) => createDatabaseConfig(configService),
      inject: [ConfigService],
    }),
    HealthModule,
    AuthModule,
  ],
  controllers: [],
  providers: [DatabaseService],
})
export class AppModule {}
