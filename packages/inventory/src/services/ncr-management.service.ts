import type { EventStore } from '../infrastructure/event-store/event-store';
import type { InventoryService } from './inventory.service';

import {
  NonConformanceReport,
  NCRStatus,
  type IssueType,
  SeverityLevel,
  type CreateNCRCommand,
  type ImplementCorrectiveActionCommand,
} from '../domain/non-conformance-report';
import { Injectable, type Logger } from '@nestjs/common';

export interface NCRQuarantineInventoryCommand {
  readonly sku: string;
  readonly batchNumber: string;
  readonly quantity: number;
  readonly reason: string;
  readonly ncrId: string;
  readonly tenantId: string;
}

const METHOD_NOT_IMPLEMENTED = 'Method not implemented';

@Injectable()
export class NCRManagementService {
  /* eslint-disable no-unused-vars */
  constructor(
    private readonly _inventoryService: InventoryService,
    private readonly _eventStore: EventStore,
    private readonly _logger: Logger,
  ) {}
  /* eslint-enable no-unused-vars */

  async createNCR(command: CreateNCRCommand): Promise<void> {
    this._logger.log(`Creating NCR for SKU: ${command.sku}, Batch: ${command.batchNumber}`);

    const ncr = new NonConformanceReport(
      command.ncrId,
      command.sku,
      command.batchNumber,
      command.issueType,
      command.severity,
      command.description,
      command.reportedBy,
      command.reportedDate,
      NCRStatus.OPEN,
      command.tenantId,
    );

    // Quarantine affected inventory
    await this._inventoryService.quarantineInventory({
      sku: command.sku,
      batchNumber: command.batchNumber,
      quantity: command.quantity,
      reason: `NCR: ${command.description}`,
      ncrId: command.ncrId,
      tenantId: command.tenantId,
    });

    await this._eventStore.append(
      `ncr-${command.ncrId}`,
      ncr.getUncommittedEvents(),
      ncr.getVersion(),
    );

    ncr.markEventsAsCommitted();
  }

  async startInvestigation(ncrId: string, investigator: string, tenantId: string): Promise<void> {
    this._logger.log(`Starting investigation for NCR: ${ncrId}`);

    const ncr = await this.loadNCR(ncrId, tenantId);
    ncr.startInvestigation(investigator);

    await this._eventStore.append(`ncr-${ncrId}`, ncr.getUncommittedEvents(), ncr.getVersion());

    ncr.markEventsAsCommitted();
  }

  async completeInvestigation(
    ncrId: string,
    investigationResults: string,
    tenantId: string,
  ): Promise<void> {
    this._logger.log(`Completing investigation for NCR: ${ncrId}`);

    const ncr = await this.loadNCR(ncrId, tenantId);
    ncr.completeInvestigation(investigationResults);

    await this._eventStore.append(`ncr-${ncrId}`, ncr.getUncommittedEvents(), ncr.getVersion());

    ncr.markEventsAsCommitted();
  }

  async implementCorrectiveAction(command: ImplementCorrectiveActionCommand): Promise<void> {
    this._logger.log(`Implementing corrective action for NCR: ${command.ncrId}`);

    const ncr = await this.loadNCR(command.ncrId, command.tenantId);
    ncr.implementCorrectiveAction(command.action);

    await this._eventStore.append(
      `ncr-${command.ncrId}`,
      ncr.getUncommittedEvents(),
      ncr.getVersion(),
    );

    ncr.markEventsAsCommitted();
  }

  async closeNCR(ncrId: string, closureReason: string, tenantId: string): Promise<void> {
    this._logger.log(`Closing NCR: ${ncrId}`);

    const ncr = await this.loadNCR(ncrId, tenantId);
    ncr.closeNCR(closureReason);

    await this._eventStore.append(`ncr-${ncrId}`, ncr.getUncommittedEvents(), ncr.getVersion());

    ncr.markEventsAsCommitted();
  }

  async cancelNCR(ncrId: string, reason: string, tenantId: string): Promise<void> {
    this._logger.log(`Cancelling NCR: ${ncrId}`);

    const ncr = await this.loadNCR(ncrId, tenantId);
    ncr.cancelNCR(reason);

    await this._eventStore.append(`ncr-${ncrId}`, ncr.getUncommittedEvents(), ncr.getVersion());

    ncr.markEventsAsCommitted();
  }

  async getNCR(ncrId: string, tenantId: string): Promise<NonConformanceReport> {
    return this.loadNCR(ncrId, tenantId);
  }

  async getNCRsBySku(sku: string, tenantId: string): Promise<NonConformanceReport[]> {
    return this.getNCRsBySkuInternal(sku, tenantId);
  }

  async getNCRsByBatch(batchNumber: string, tenantId: string): Promise<NonConformanceReport[]> {
    return this.getNCRsByBatchInternal(batchNumber, tenantId);
  }

  async getNCRsByStatus(status: NCRStatus, tenantId: string): Promise<NonConformanceReport[]> {
    return this.getNCRsByStatusInternal(status, tenantId);
  }

  async getNCRsBySeverity(
    severity: SeverityLevel,
    tenantId: string,
  ): Promise<NonConformanceReport[]> {
    return this.getNCRsBySeverityInternal(severity, tenantId);
  }

  async getNCRsByIssueType(
    issueType: IssueType,
    tenantId: string,
  ): Promise<NonConformanceReport[]> {
    return this.getNCRsByIssueTypeInternal(issueType, tenantId);
  }

  async getOpenNCRs(tenantId: string): Promise<NonConformanceReport[]> {
    return this.getNCRsByStatus(NCRStatus.OPEN, tenantId);
  }

  async getCriticalNCRs(tenantId: string): Promise<NonConformanceReport[]> {
    return this.getNCRsBySeverity(SeverityLevel.CRITICAL, tenantId);
  }

  /* eslint-disable no-unused-vars */
  private async loadNCR(_ncrId: string, _tenantId: string): Promise<NonConformanceReport> {
    // Implementation for loading NCR from event store
    throw new Error(METHOD_NOT_IMPLEMENTED);
  }
  /* eslint-enable no-unused-vars */

  /* eslint-disable no-unused-vars */
  private async getNCRsBySkuInternal(
    _sku: string,
    _tenantId: string,
  ): Promise<NonConformanceReport[]> {
    // Implementation for getting NCRs by SKU
    throw new Error(METHOD_NOT_IMPLEMENTED);
  }
  /* eslint-enable no-unused-vars */

  /* eslint-disable no-unused-vars */
  private async getNCRsByBatchInternal(
    _batchNumber: string,
    _tenantId: string,
  ): Promise<NonConformanceReport[]> {
    // Implementation for getting NCRs by batch
    throw new Error(METHOD_NOT_IMPLEMENTED);
  }
  /* eslint-enable no-unused-vars */

  /* eslint-disable no-unused-vars */
  private async getNCRsByStatusInternal(
    _status: NCRStatus,
    _tenantId: string,
  ): Promise<NonConformanceReport[]> {
    // Implementation for getting NCRs by status
    throw new Error(METHOD_NOT_IMPLEMENTED);
  }
  /* eslint-enable no-unused-vars */

  /* eslint-disable no-unused-vars */
  private async getNCRsBySeverityInternal(
    _severity: SeverityLevel,
    _tenantId: string,
  ): Promise<NonConformanceReport[]> {
    // Implementation for getting NCRs by severity
    throw new Error(METHOD_NOT_IMPLEMENTED);
  }
  /* eslint-enable no-unused-vars */

  /* eslint-disable no-unused-vars */
  private async getNCRsByIssueTypeInternal(
    _issueType: IssueType,
    _tenantId: string,
  ): Promise<NonConformanceReport[]> {
    // Implementation for getting NCRs by issue type
    throw new Error(METHOD_NOT_IMPLEMENTED);
  }
  /* eslint-enable no-unused-vars */
}
