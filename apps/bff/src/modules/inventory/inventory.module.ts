import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
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
        baseURL: config.get<string>('INVENTORY_SERVICE_URL', 'http://localhost:3002'),
        timeout: config.get<number>('INVENTORY_HTTP_TIMEOUT_MS', 8000),
        maxRedirects: 0,
      }),
    }),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
