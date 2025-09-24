import { AccountingController } from './accounting.controller';
import { AccountingService } from './accounting.service';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        baseURL: config.get<string>('ACCOUNTING_SERVICE_URL', 'http://localhost:3001'),
        timeout: config.get<number>('ACCOUNTING_HTTP_TIMEOUT_MS', 8000),
        maxRedirects: 0,
      }),
    }),
  ],
  controllers: [AccountingController],
  providers: [AccountingService],
})
export class AccountingModule {}
