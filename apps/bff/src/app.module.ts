import { CorrelationInterceptor } from './common/interceptors/correlation.interceptor.js';
import { createDatabaseConfig } from './config/database.config.js';
import { DatabaseService } from './config/database.service.js';
import { HealthModule } from './health/health.module.js';
import { AccountingModule } from './modules/accounting/accounting.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CFODashboardModule } from './modules/cfo-dashboard/cfo-dashboard.module.js';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService) => createDatabaseConfig(configService),
      inject: [ConfigService],
    }),
    HealthModule,
    AuthModule,
    AccountingModule,
    CFODashboardModule,
  ],
  controllers: [],
  providers: [
    DatabaseService,
    {
      provide: APP_INTERCEPTOR,
      useClass: CorrelationInterceptor,
    },
  ],
})
export class AppModule {}
