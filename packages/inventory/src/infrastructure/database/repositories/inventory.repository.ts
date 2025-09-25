/* eslint-disable no-unused-vars */
import { type InventoryRepository } from '../../../domain/interfaces/repositories.interface';
import { InventoryItem } from '../../../domain/inventory-item';
import { ValuationMethodValidator } from '../../../domain/value-objects/valuation-method';
import { InventoryItemEntity } from '../entities/inventory-item.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type Repository } from 'typeorm';

@Injectable()
export class TypeOrmInventoryRepository implements InventoryRepository {
  constructor(
    @InjectRepository(InventoryItemEntity)
    private readonly repository: Repository<InventoryItemEntity>,
  ) {}

  async save(inventoryItem: InventoryItem): Promise<void> {
    const entity = this.mapToEntity(inventoryItem);
    await this.repository.save(entity);
  }

  async findById(id: string, tenantId: string): Promise<InventoryItem | null> {
    const entity = await this.repository.findOne({
      where: { id, tenantId },
    });

    return entity ? this.mapToDomain(entity) : null;
  }

  async findBySku(sku: string, tenantId: string): Promise<InventoryItem | null> {
    const entity = await this.repository.findOne({
      where: { sku, tenantId },
    });

    return entity ? this.mapToDomain(entity) : null;
  }

  async findAll(tenantId: string): Promise<InventoryItem[]> {
    const entities = await this.repository.find({
      where: { tenantId },
    });

    return entities.map((entity) => this.mapToDomain(entity));
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.repository.delete({ id, tenantId });
  }

  private mapToEntity(inventoryItem: InventoryItem): InventoryItemEntity {
    const entity = new InventoryItemEntity();
    entity.id = inventoryItem.getId();
    entity.sku = inventoryItem.getSku();
    entity.description = inventoryItem.getDescription();
    entity.unitOfMeasure = inventoryItem.getUnitOfMeasure();
    entity.valuationMethod = inventoryItem.getValuationMethod();
    entity.tenantId = inventoryItem.getId().split('-')[2] || 'unknown'; // Extract tenantId from aggregate ID
    entity.version = inventoryItem.getVersion();
    return entity;
  }

  private mapToDomain(entity: InventoryItemEntity): InventoryItem {
    // This is a simplified mapping - in a real implementation,
    // you would need to reconstruct the aggregate from events
    return new InventoryItem(
      entity.id,
      entity.sku,
      entity.description,
      entity.unitOfMeasure,
      ValuationMethodValidator.validate(entity.valuationMethod),
      entity.tenantId,
      entity.version,
    );
  }
}
