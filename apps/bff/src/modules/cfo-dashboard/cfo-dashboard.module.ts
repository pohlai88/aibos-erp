import { CFODashboardController } from './cfo-dashboard.controller';
import { Module } from '@nestjs/common';

@Module({
  controllers: [CFODashboardController],
  providers: [],
  exports: [],
})
export class CFODashboardModule {}
