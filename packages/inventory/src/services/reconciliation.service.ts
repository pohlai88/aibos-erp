/* eslint-disable no-unused-vars */
import type { EventStore } from '../infrastructure/event-store/event-store';
import type { InventoryService } from './inventory.service';

import {
  Reconciliation,
  ReconciliationStatus,
  type ReconciliationType,
} from '../domain/reconciliation';
import { Injectable, Logger } from '@nestjs/common';

export interface CreateReconciliationCommand {
  readonly reconciliationId: string;
  readonly sku: string;
  readonly location: string;
  readonly reconciliationType: ReconciliationType;
  readonly reconciledBy: string;
  readonly tenantId: string;
  readonly notes?: string;
}

export interface CompleteReconciliationCommand {
  readonly reconciliationId: string;
  readonly physicalQuantity: number;
  readonly notes?: string;
  readonly tenantId: string;
}

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(
    private readonly _eventStore: EventStore,
    private readonly _inventoryService: InventoryService,
  ) {}

  async createReconciliation(command: CreateReconciliationCommand): Promise<void> {
    this.logger.log(
      `Creating reconciliation for SKU: ${command.sku}, Location: ${command.location}`,
    );

    // Get current system quantity
    const systemQuantity = await this._inventoryService.getAvailableStockForLocation(
      command.sku,
      command.location,
      command.tenantId,
    );

    const reconciliation = new Reconciliation(
      command.reconciliationId,
      command.sku,
      command.location,
      systemQuantity,
      0, // Physical quantity will be set when completed
      command.reconciliationType,
      command.reconciledBy,
      command.tenantId,
      ReconciliationStatus.PENDING,
      command.notes,
    );

    await this._eventStore.append(
      `reconciliation-${command.reconciliationId}`,
      this.convertEvents(reconciliation.getUncommittedEvents()),
      reconciliation.getVersion(),
    );

    reconciliation.markEventsAsCommitted();
    this.logger.log(`Reconciliation created: ${command.reconciliationId}`);
  }

  async startReconciliation(reconciliationId: string, tenantId: string): Promise<void> {
    this.logger.log(`Starting reconciliation: ${reconciliationId}`);

    const reconciliation = await this.loadReconciliation(reconciliationId, tenantId);
    reconciliation.startReconciliation();

    await this._eventStore.append(
      `reconciliation-${reconciliationId}`,
      this.convertEvents(reconciliation.getUncommittedEvents()),
      reconciliation.getVersion(),
    );

    reconciliation.markEventsAsCommitted();
    this.logger.log(`Reconciliation started: ${reconciliationId}`);
  }

  async completeReconciliation(command: CompleteReconciliationCommand): Promise<void> {
    this.logger.log(`Completing reconciliation: ${command.reconciliationId}`);

    const reconciliation = await this.loadReconciliation(
      command.reconciliationId,
      command.tenantId,
    );

    // Update physical quantity
    (reconciliation as { _physicalQuantity: number })._physicalQuantity = command.physicalQuantity;

    reconciliation.completeReconciliation(command.notes);

    await this._eventStore.append(
      `reconciliation-${command.reconciliationId}`,
      this.convertEvents(reconciliation.getUncommittedEvents()),
      reconciliation.getVersion(),
    );

    reconciliation.markEventsAsCommitted();
    this.logger.log(`Reconciliation completed: ${command.reconciliationId}`);
  }

  async approveReconciliation(
    reconciliationId: string,
    approvedBy: string,
    tenantId: string,
  ): Promise<void> {
    this.logger.log(`Approving reconciliation: ${reconciliationId}`);

    const reconciliation = await this.loadReconciliation(reconciliationId, tenantId);
    reconciliation.approveReconciliation(approvedBy);

    await this._eventStore.append(
      `reconciliation-${reconciliationId}`,
      this.convertEvents(reconciliation.getUncommittedEvents()),
      reconciliation.getVersion(),
    );

    reconciliation.markEventsAsCommitted();

    // If approved, create stock adjustment for variance
    const variance = reconciliation.getVariance();
    if (variance !== 0) {
      await this.createStockAdjustmentFromReconciliation(reconciliation, variance, tenantId);
    }

    this.logger.log(`Reconciliation approved: ${reconciliationId}`);
  }

  async rejectReconciliation(
    reconciliationId: string,
    reason: string,
    tenantId: string,
  ): Promise<void> {
    this.logger.log(`Rejecting reconciliation: ${reconciliationId}`);

    const reconciliation = await this.loadReconciliation(reconciliationId, tenantId);
    reconciliation.rejectReconciliation(reason);

    await this._eventStore.append(
      `reconciliation-${reconciliationId}`,
      this.convertEvents(reconciliation.getUncommittedEvents()),
      reconciliation.getVersion(),
    );

    reconciliation.markEventsAsCommitted();
    this.logger.log(`Reconciliation rejected: ${reconciliationId}`);
  }

  async getReconciliationVarianceReport(
    tenantId: string,
    _fromDate?: Date,
    _toDate?: Date,
  ): Promise<
    Array<{
      reconciliationId: string;
      sku: string;
      location: string;
      variance: number;
      variancePercentage: number;
      status: ReconciliationStatus;
      reconciliationDate: Date;
    }>
  > {
    this.logger.log(`Generating reconciliation variance report for tenant: ${tenantId}`);

    // Implementation would query reconciliation projections
    // For now, return empty array as placeholder
    return [];
  }

  private async loadReconciliation(
    reconciliationId: string,
    _tenantId: string,
  ): Promise<Reconciliation> {
    const events = await this._eventStore.getEvents(`reconciliation-${reconciliationId}`);

    if (events.length === 0) {
      throw new Error(`Reconciliation ${reconciliationId} not found`);
    }

    // Rebuild reconciliation from events
    // This would be implemented based on the event store structure
    throw new Error('Reconciliation loading not implemented');
  }

  private async createStockAdjustmentFromReconciliation(
    reconciliation: Reconciliation,
    variance: number,
    tenantId: string,
  ): Promise<void> {
    const adjustmentType = variance > 0 ? 'INCREASE' : 'DECREASE';
    const quantity = Math.abs(variance);

    await this._inventoryService.adjustStock({
      adjustmentId: `reconciliation-${reconciliation._reconciliationId}`,
      sku: reconciliation._sku,
      quantity,
      location: reconciliation._location,
      adjustmentType,
      reason: `Reconciliation adjustment - Variance: ${variance}`,
      reference: reconciliation._reconciliationId,
      tenantId,
      userId: 'system',
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private convertEvents(events: unknown[]): any[] {
    // Convert eventsourcing events to inventory events
    // For now, return as-is since we're using mock implementation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return events as any[];
  }
}
