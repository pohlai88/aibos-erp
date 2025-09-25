import type { EventStore } from '../infrastructure/event-store/event-store';
import type { BOMManagementService } from './bom-management.service';
import type { InventoryService } from './inventory.service';

import {
  ProductionOrder,
  ProductionOrderStatus,
  type CreateProductionOrderCommand,
  type StartProductionCommand,
  type CompleteProductionCommand,
} from '../domain/production-order';
import { Injectable, type Logger } from '@nestjs/common';

export class InsufficientMaterialsError extends Error {
  public override readonly name = 'InsufficientMaterialsError' as const;

  constructor(message: string) {
    super(message);
    this.name = 'InsufficientMaterialsError';
  }
}

const METHOD_NOT_IMPLEMENTED = 'Method not implemented';

@Injectable()
export class ProductionOrderService {
  /* eslint-disable no-unused-vars */
  constructor(
    private readonly _inventoryService: InventoryService,
    private readonly _bomManagementService: BOMManagementService,
    private readonly _eventStore: EventStore,
    private readonly _logger: Logger,
  ) {}
  /* eslint-enable no-unused-vars */

  async createProductionOrder(command: CreateProductionOrderCommand): Promise<void> {
    this._logger.log(`Creating production order: ${command.productionOrderId}`);

    const productionOrder = new ProductionOrder(
      command.productionOrderId,
      command.bomId,
      command.finishedGoodSku,
      command.quantity,
      ProductionOrderStatus.PLANNED,
      command.startDate,
      command.plannedEndDate,
      command.workCenter,
      command.tenantId,
    );

    await this._eventStore.append(
      `production-order-${command.productionOrderId}`,
      productionOrder.getUncommittedEvents(),
      productionOrder.getVersion(),
    );

    productionOrder.markEventsAsCommitted();
  }

  async releaseProductionOrder(productionOrderId: string, tenantId: string): Promise<void> {
    this._logger.log(`Releasing production order: ${productionOrderId}`);

    const productionOrder = await this.loadProductionOrder(productionOrderId, tenantId);

    // Validate material availability before release
    const mrpResult = await this._bomManagementService.calculateMRP(
      productionOrder.bomId,
      productionOrder.quantity,
      tenantId,
    );

    if (!mrpResult.canProduce) {
      throw new InsufficientMaterialsError(
        `Insufficient materials for production order ${productionOrderId}. Total shortfall: ${mrpResult.totalShortfall}`,
      );
    }

    // Release the production order
    productionOrder.status = ProductionOrderStatus.RELEASED;

    await this._eventStore.append(
      `production-order-${productionOrderId}`,
      productionOrder.getUncommittedEvents(),
      productionOrder.getVersion(),
    );

    productionOrder.markEventsAsCommitted();
  }

  async startProduction(command: StartProductionCommand): Promise<void> {
    this._logger.log(`Starting production order: ${command.productionOrderId}`);

    const productionOrder = await this.loadProductionOrder(
      command.productionOrderId,
      command.tenantId,
    );

    // Validate material availability
    const mrpResult = await this._bomManagementService.calculateMRP(
      productionOrder.bomId,
      productionOrder.quantity,
      command.tenantId,
    );

    if (!mrpResult.canProduce) {
      throw new InsufficientMaterialsError(
        `Insufficient materials for production order ${command.productionOrderId}`,
      );
    }

    // Start production
    productionOrder.startProduction();

    await this._eventStore.append(
      `production-order-${command.productionOrderId}`,
      productionOrder.getUncommittedEvents(),
      productionOrder.getVersion(),
    );

    productionOrder.markEventsAsCommitted();
  }

  async completeProduction(command: CompleteProductionCommand): Promise<void> {
    this._logger.log(`Completing production order: ${command.productionOrderId}`);

    const productionOrder = await this.loadProductionOrder(
      command.productionOrderId,
      command.tenantId,
    );

    productionOrder.completeProduction(command.actualQuantity);

    await this._eventStore.append(
      `production-order-${command.productionOrderId}`,
      productionOrder.getUncommittedEvents(),
      productionOrder.getVersion(),
    );

    productionOrder.markEventsAsCommitted();
  }

  async cancelProduction(
    productionOrderId: string,
    reason: string,
    tenantId: string,
  ): Promise<void> {
    this._logger.log(`Cancelling production order: ${productionOrderId}`);

    const productionOrder = await this.loadProductionOrder(productionOrderId, tenantId);
    productionOrder.cancelProduction(reason);

    await this._eventStore.append(
      `production-order-${productionOrderId}`,
      productionOrder.getUncommittedEvents(),
      productionOrder.getVersion(),
    );

    productionOrder.markEventsAsCommitted();
  }

  async putProductionOnHold(
    productionOrderId: string,
    reason: string,
    tenantId: string,
  ): Promise<void> {
    this._logger.log(`Putting production order on hold: ${productionOrderId}`);

    const productionOrder = await this.loadProductionOrder(productionOrderId, tenantId);
    productionOrder.putOnHold(reason);

    await this._eventStore.append(
      `production-order-${productionOrderId}`,
      productionOrder.getUncommittedEvents(),
      productionOrder.getVersion(),
    );

    productionOrder.markEventsAsCommitted();
  }

  async releaseFromHold(productionOrderId: string, tenantId: string): Promise<void> {
    this._logger.log(`Releasing production order from hold: ${productionOrderId}`);

    const productionOrder = await this.loadProductionOrder(productionOrderId, tenantId);
    productionOrder.releaseFromHold();

    await this._eventStore.append(
      `production-order-${productionOrderId}`,
      productionOrder.getUncommittedEvents(),
      productionOrder.getVersion(),
    );

    productionOrder.markEventsAsCommitted();
  }

  async getProductionOrder(productionOrderId: string, tenantId: string): Promise<ProductionOrder> {
    return this.loadProductionOrder(productionOrderId, tenantId);
  }

  async getProductionOrdersByStatus(
    status: ProductionOrderStatus,
    tenantId: string,
  ): Promise<ProductionOrder[]> {
    return this.getProductionOrdersByStatusInternal(status, tenantId);
  }

  async getProductionOrdersInPeriod(
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<ProductionOrder[]> {
    return this.getProductionOrdersInDateRange(startDate, endDate, tenantId);
  }

  /* eslint-disable no-unused-vars */
  private async loadProductionOrder(
    _productionOrderId: string,
    _tenantId: string,
  ): Promise<ProductionOrder> {
    // Implementation for loading production order from event store
    throw new Error(METHOD_NOT_IMPLEMENTED);
  }
  /* eslint-enable no-unused-vars */

  /* eslint-disable no-unused-vars */
  private async getProductionOrdersByStatusInternal(
    _status: ProductionOrderStatus,
    _tenantId: string,
  ): Promise<ProductionOrder[]> {
    // Implementation for getting production orders by status
    throw new Error(METHOD_NOT_IMPLEMENTED);
  }
  /* eslint-enable no-unused-vars */

  /* eslint-disable no-unused-vars */
  private async getProductionOrdersInDateRange(
    _startDate: Date,
    _endDate: Date,
    _tenantId: string,
  ): Promise<ProductionOrder[]> {
    // Implementation for getting production orders in date range
    throw new Error(METHOD_NOT_IMPLEMENTED);
  }
  /* eslint-enable no-unused-vars */
}
