import type { EventStore } from '../infrastructure/event-store/event-store';
import type { InventoryService } from './inventory.service';

import {
  BillOfMaterials,
  BOMStatus,
  type CreateBOMCommand,
  type UpdateBOMCommand,
} from '../domain/bill-of-materials';
import { Injectable, type Logger } from '@nestjs/common';

export interface MRPResult {
  readonly bomId: string;
  readonly finishedGoodSku: string;
  readonly quantity: number;
  readonly requirements: MaterialRequirementResult[];
  readonly canProduce: boolean;
  readonly totalShortfall: number;
}

export interface MaterialRequirementResult {
  readonly sku: string;
  readonly required: number;
  readonly available: number;
  readonly shortfall: number;
}

const METHOD_NOT_IMPLEMENTED = 'Method not implemented';

@Injectable()
export class BOMManagementService {
  /* eslint-disable no-unused-vars */
  constructor(
    private readonly _inventoryService: InventoryService,
    private readonly _eventStore: EventStore,
    private readonly _logger: Logger,
  ) {}
  /* eslint-enable no-unused-vars */

  async createBOM(command: CreateBOMCommand): Promise<void> {
    this._logger.log(`Creating BOM for finished good: ${command.finishedGoodSku}`);

    const bom = new BillOfMaterials(
      command.bomId,
      command.finishedGoodSku,
      command.version,
      command.items,
      BOMStatus.DRAFT,
      command.effectiveDate,
      command.tenantId,
    );

    bom.validateBOM();

    await this._eventStore.append(
      `bom-${command.bomId}`,
      bom.getUncommittedEvents(),
      bom.getVersion(),
    );

    bom.markEventsAsCommitted();
  }

  async updateBOM(command: UpdateBOMCommand): Promise<void> {
    this._logger.log(`Updating BOM: ${command.bomId}`);

    const bom = await this.loadBOM(command.bomId, command.tenantId);

    // Update BOM properties (this would need to be implemented in the domain model)
    // For now, we'll just validate the new structure
    const updatedBom = new BillOfMaterials(
      command.bomId,
      bom.finishedGoodSku,
      command.version,
      command.items,
      bom.status,
      command.effectiveDate,
      command.tenantId,
    );

    updatedBom.validateBOM();

    await this._eventStore.append(
      `bom-${command.bomId}`,
      updatedBom.getUncommittedEvents(),
      updatedBom.getVersion(),
    );

    updatedBom.markEventsAsCommitted();
  }

  async calculateMRP(bomId: string, quantity: number, tenantId: string): Promise<MRPResult> {
    this._logger.log(`Calculating MRP for BOM: ${bomId}, Quantity: ${quantity}`);

    const bom = await this.loadBOM(bomId, tenantId);
    const requirements = bom.calculateMaterialRequirements(quantity);

    const availability = await Promise.all(
      requirements.map(async (req) => ({
        sku: req.sku,
        required: req.quantity,
        available: await this._inventoryService.getAvailableStock(req.sku, req.location, tenantId),
        shortfall: Math.max(
          0,
          req.quantity -
            (await this._inventoryService.getAvailableStock(req.sku, req.location, tenantId)),
        ),
      })),
    );

    return {
      bomId,
      finishedGoodSku: bom.finishedGoodSku,
      quantity,
      requirements: availability,
      canProduce: availability.every((req) => req.shortfall === 0),
      totalShortfall: availability.reduce((sum, req) => sum + req.shortfall, 0),
    };
  }

  async activateBOM(bomId: string, tenantId: string): Promise<void> {
    this._logger.log(`Activating BOM: ${bomId}`);

    const bom = await this.loadBOM(bomId, tenantId);
    bom.activate();

    await this._eventStore.append(`bom-${bomId}`, bom.getUncommittedEvents(), bom.getVersion());

    bom.markEventsAsCommitted();
  }

  async suspendBOM(bomId: string, tenantId: string): Promise<void> {
    this._logger.log(`Suspending BOM: ${bomId}`);

    const bom = await this.loadBOM(bomId, tenantId);
    bom.suspend();

    await this._eventStore.append(`bom-${bomId}`, bom.getUncommittedEvents(), bom.getVersion());

    bom.markEventsAsCommitted();
  }

  async obsoleteBOM(bomId: string, tenantId: string): Promise<void> {
    this._logger.log(`Obsoleting BOM: ${bomId}`);

    const bom = await this.loadBOM(bomId, tenantId);
    bom.obsolete();

    await this._eventStore.append(`bom-${bomId}`, bom.getUncommittedEvents(), bom.getVersion());

    bom.markEventsAsCommitted();
  }

  async getBOM(bomId: string, tenantId: string): Promise<BillOfMaterials> {
    return this.loadBOM(bomId, tenantId);
  }

  async getBOMsByFinishedGood(
    finishedGoodSku: string,
    tenantId: string,
  ): Promise<BillOfMaterials[]> {
    return this.getBOMsByFinishedGoodSku(finishedGoodSku, tenantId);
  }

  /* eslint-disable no-unused-vars */
  private async loadBOM(_bomId: string, _tenantId: string): Promise<BillOfMaterials> {
    // Implementation for loading BOM from event store
    throw new Error(METHOD_NOT_IMPLEMENTED);
  }
  /* eslint-enable no-unused-vars */

  /* eslint-disable no-unused-vars */
  private async getBOMsByFinishedGoodSku(
    _finishedGoodSku: string,
    _tenantId: string,
  ): Promise<BillOfMaterials[]> {
    // Implementation for getting BOMs by finished good SKU
    throw new Error(METHOD_NOT_IMPLEMENTED);
  }
  /* eslint-enable no-unused-vars */
}
