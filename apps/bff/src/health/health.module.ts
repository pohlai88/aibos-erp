import { DatabaseService } from "../config/database.service";
import { HealthController } from "./health.controller";
import { Module } from "@nestjs/common";

@Module({
  controllers: [HealthController],
  providers: [DatabaseService],
})
export class HealthModule {}
