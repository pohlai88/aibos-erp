import { Batch, type ExpiringItem, type BatchSummary } from '../domain/batch';
import {
  SerialNumber,
  type SerialNumberStatus,
  type SerialNumberSummary,
} from '../domain/serial-number';
import { type EventStore } from '../infrastructure/event-store/event-store';
import { Injectable, type Logger } from '@nestjs/common';

const WAREHOUSE_A = 'WAREHOUSE-A';

@Injectable()
export class BatchTrackingService {
  /* eslint-disable no-unused-vars */
  constructor(
    private readonly _eventStore: EventStore,
    private readonly _logger: Logger,
  ) {}
  /* eslint-enable no-unused-vars */

  async createBatch(command: CreateBatchCommand): Promise<void> {
    const batch = new Batch(
      command.batchId,
      command.sku,
      command.batchNumber,
      command.manufacturingDate,
      command.expiryDate,
      command.quantity,
      command.location,
      command.tenantId,
    );

    await this._eventStore.append(
      `batch-${command.batchId}`,
      batch.getUncommittedEvents(),
      batch.getVersion(),
    );

    batch.markEventsAsCommitted();
    this._logger.log(`Created batch: ${command.batchNumber} for SKU: ${command.sku}`);
  }

  async updateBatchQuantity(command: UpdateBatchQuantityCommand): Promise<void> {
    const batch = await this.loadBatch(command.batchId, command.tenantId);
    batch.updateQuantity(command.newQuantity);

    await this._eventStore.append(
      `batch-${command.batchId}`,
      batch.getUncommittedEvents(),
      batch.getVersion(),
    );

    batch.markEventsAsCommitted();
    this._logger.log(`Updated batch quantity: ${command.batchId} to ${command.newQuantity}`);
  }

  async getExpiringItems(daysAhead: number, tenantId: string): Promise<ExpiringItem[]> {
    const batches = await this.getAllBatches(tenantId);
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysAhead);

    return batches
      .filter((batch) => batch.expiryDate <= targetDate && !batch.isExpired())
      .map((batch) => ({
        batchId: batch.batchId,
        sku: batch.sku,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        daysToExpiry: batch.getDaysToExpiry(),
        quantity: batch.quantity,
        location: batch.location,
      }));
  }

  async getBatchSummary(batchId: string, tenantId: string): Promise<BatchSummary> {
    const batch = await this.loadBatch(batchId, tenantId);

    return {
      batchId: batch.batchId,
      sku: batch.sku,
      batchNumber: batch.batchNumber,
      manufacturingDate: batch.manufacturingDate,
      expiryDate: batch.expiryDate,
      quantity: batch.quantity,
      location: batch.location,
      status: batch.getExpiryStatus(),
      daysToExpiry: batch.getDaysToExpiry(),
    };
  }

  async getBatchesBySku(sku: string, tenantId: string): Promise<BatchSummary[]> {
    const batches = await this.loadBatchesBySku(sku, tenantId);

    return batches.map((batch) => ({
      batchId: batch.batchId,
      sku: batch.sku,
      batchNumber: batch.batchNumber,
      manufacturingDate: batch.manufacturingDate,
      expiryDate: batch.expiryDate,
      quantity: batch.quantity,
      location: batch.location,
      status: batch.getExpiryStatus(),
      daysToExpiry: batch.getDaysToExpiry(),
    }));
  }

  async trackSerialNumber(command: TrackSerialNumberCommand): Promise<void> {
    const serialNumber = new SerialNumber(
      command.serialNumber,
      command.sku,
      command.batchId,
      command.location,
      command.status,
      command.tenantId,
    );

    await this._eventStore.append(
      `serial-${command.serialNumber}`,
      this.convertEvents(serialNumber.getUncommittedEvents()),
      serialNumber.getVersion(),
    );

    serialNumber.markEventsAsCommitted();
    this._logger.log(`Tracked serial number: ${command.serialNumber} for SKU: ${command.sku}`);
  }

  async updateSerialNumberStatus(command: UpdateSerialNumberStatusCommand): Promise<void> {
    const serialNumber = await this.loadSerialNumber(command.serialNumber, command.tenantId);
    serialNumber.updateStatus(command.newStatus);

    await this._eventStore.append(
      `serial-${command.serialNumber}`,
      this.convertEvents(serialNumber.getUncommittedEvents()),
      serialNumber.getVersion(),
    );

    serialNumber.markEventsAsCommitted();
    this._logger.log(
      `Updated serial number status: ${command.serialNumber} to ${command.newStatus}`,
    );
  }

  async getSerialNumbersByBatch(batchId: string, tenantId: string): Promise<SerialNumberSummary[]> {
    const serialNumbers = await this.loadSerialNumbersByBatch(batchId, tenantId);

    return serialNumbers.map((sn) => ({
      serialNumber: sn._serialNumber,
      sku: sn._sku,
      batchId: sn._batchId,
      location: sn._location,
      status: sn._status,
      createdAt: new Date(), // This would come from the event store
      lastUpdated: new Date(), // This would come from the event store
    }));
  }

  private async loadBatch(batchId: string, tenantId: string): Promise<Batch> {
    this._logger.log(`Loading batch: ${batchId}`);

    const events = await this._eventStore.getEvents(`batch-${batchId}`);

    if (events.length === 0) {
      throw new Error(`Batch ${batchId} not found`);
    }

    // Rebuild batch from events
    // This would be implemented based on the event store structure
    // For now, return a mock batch
    return new Batch(
      batchId,
      'MOCK-SKU',
      'MOCK-BATCH',
      new Date(),
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      100,
      WAREHOUSE_A,
      tenantId,
    );
  }

  private async loadSerialNumber(serialNumber: string, tenantId: string): Promise<SerialNumber> {
    this._logger.log(`Loading serial number: ${serialNumber}`);

    const events = await this._eventStore.getEvents(`serial-${serialNumber}`);

    if (events.length === 0) {
      throw new Error(`Serial number ${serialNumber} not found`);
    }

    // Rebuild serial number from events
    // This would be implemented based on the event store structure
    // For now, return a mock serial number
    return new SerialNumber(
      serialNumber,
      'MOCK-SKU',
      'MOCK-BATCH',
      WAREHOUSE_A,
      'AVAILABLE' as SerialNumberStatus,
      tenantId,
    );
  }

  async getAllBatches(tenantId: string): Promise<Batch[]> {
    // For now, return mock data - in production this would query the database
    const mockBatches: Batch[] = [];

    // Create some mock batches with different expiry dates
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Batch expiring tomorrow
    const batch1 = new Batch(
      'batch-001',
      'SKU-001',
      'BATCH-001',
      now,
      tomorrow,
      100,
      WAREHOUSE_A,
      tenantId,
    );
    mockBatches.push(batch1);

    // Batch expiring next week
    const batch2 = new Batch(
      'batch-002',
      'SKU-002',
      'BATCH-002',
      now,
      nextWeek,
      50,
      WAREHOUSE_A,
      tenantId,
    );
    mockBatches.push(batch2);

    return mockBatches;
  }

  private async loadBatchesBySku(sku: string, _tenantId: string): Promise<Batch[]> {
    this._logger.log(`Loading batches for SKU: ${sku}`);
    // Suppress unused parameter warning - tenantId will be used in future implementation
    void _tenantId;

    // Implementation would query batch projections by SKU
    // For now, return empty array
    return [];
  }

  private async loadSerialNumbersByBatch(
    batchId: string,
    _tenantId: string,
  ): Promise<SerialNumber[]> {
    this._logger.log(`Loading serial numbers for batch: ${batchId}`);
    // Suppress unused parameter warning - tenantId will be used in future implementation
    void _tenantId;

    // Implementation would query serial number projections by batch
    // For now, return empty array
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private convertEvents(events: unknown[]): any[] {
    // Convert eventsourcing events to inventory events
    // For now, return as-is since we're using mock implementation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return events as any[];
  }
}

export interface CreateBatchCommand {
  readonly batchId: string;
  readonly sku: string;
  readonly batchNumber: string;
  readonly manufacturingDate: Date;
  readonly expiryDate: Date;
  readonly quantity: number;
  readonly location: string;
  readonly tenantId: string;
}

export interface UpdateBatchQuantityCommand {
  readonly batchId: string;
  readonly newQuantity: number;
  readonly tenantId: string;
}

export interface TrackSerialNumberCommand {
  readonly serialNumber: string;
  readonly sku: string;
  readonly batchId: string;
  readonly location: string;
  readonly status: SerialNumberStatus;
  readonly tenantId: string;
}

export interface UpdateSerialNumberStatusCommand {
  readonly serialNumber: string;
  readonly newStatus: SerialNumberStatus;
  readonly tenantId: string;
}
