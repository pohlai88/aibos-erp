import type { DatabaseService } from '../config/database.service';

import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  constructor(private readonly _databaseService: DatabaseService) {}

  @Get()
  async check(): Promise<{
    status: string;
    timestamp: string;
    database: { status: string; timestamp: string };
  }> {
    const databaseHealth = await this._databaseService.healthCheck();

    return {
      status: databaseHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: databaseHealth,
    };
  }

  @Get('ready')
  async readiness(): Promise<{ status: string; timestamp: string }> {
    const databaseHealth = await this._databaseService.healthCheck();

    return {
      status: databaseHealth.status === 'healthy' ? 'ready' : 'not ready',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  async liveness(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }
}
