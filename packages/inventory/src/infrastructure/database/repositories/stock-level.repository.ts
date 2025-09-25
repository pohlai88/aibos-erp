/* eslint-disable no-unused-vars */
import { type StockLevelRepository } from '../../../domain/interfaces/repositories.interface';
import { StockLevelEntity } from '../entities/stock-level.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type Repository } from 'typeorm';

@Injectable()
export class TypeOrmStockLevelRepository implements StockLevelRepository {
  constructor(
    @InjectRepository(StockLevelEntity)
    private readonly repository: Repository<StockLevelEntity>,
  ) {}

  async updateStockLevel(
    sku: string,
    location: string,
    quantityChange: number,
    movementType: string,
    tenantId: string,
  ): Promise<void> {
    const existing = await this.repository.findOne({
      where: { sku, location, tenantId },
    });

    if (existing) {
      existing.quantity += quantityChange;
      existing.totalValue = existing.quantity * existing.unitCost;
      await this.repository.save(existing);
    } else {
      // Create new stock level record
      const newStockLevel = new StockLevelEntity();
      newStockLevel.sku = sku;
      newStockLevel.location = location;
      newStockLevel.quantity = quantityChange;
      newStockLevel.unitCost = 0; // Will be updated by projection handler
      newStockLevel.totalValue = 0;
      newStockLevel.tenantId = tenantId;
      await this.repository.save(newStockLevel);
    }
  }

  async getStockLevel(sku: string, location: string, tenantId: string): Promise<number> {
    const entity = await this.repository.findOne({
      where: { sku, location, tenantId },
    });

    return entity?.quantity || 0;
  }

  async getAllStockLevels(sku: string, tenantId: string): Promise<Map<string, number>> {
    const entities = await this.repository.find({
      where: { sku, tenantId },
    });

    const stockLevels = new Map<string, number>();
    for (const entity of entities) {
      stockLevels.set(entity.location, entity.quantity);
    }

    return stockLevels;
  }
}
