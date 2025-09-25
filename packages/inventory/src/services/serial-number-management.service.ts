/* eslint-disable no-unused-vars */
import type { EventStore } from '../infrastructure/event-store/event-store';

import {
  SerialNumber,
  SerialNumberStatus,
  type SerialNumberSummary,
} from '../domain/serial-number';
import { Injectable, Logger } from '@nestjs/common';

const WAREHOUSE_A = 'WAREHOUSE-A';

export interface CreateSerialNumberCommand {
  readonly serialNumber: string;
  readonly sku: string;
  readonly batchId: string;
  readonly location: string;
  readonly tenantId: string;
}

export interface ReserveSerialNumberCommand {
  readonly serialNumber: string;
  readonly reservedBy: string;
  readonly orderId: string;
  readonly tenantId: string;
}

export interface SellSerialNumberCommand {
  readonly serialNumber: string;
  readonly soldBy: string;
  readonly orderId: string;
  readonly tenantId: string;
}

export interface QuarantineSerialNumberCommand {
  readonly serialNumber: string;
  readonly reason: string;
  readonly tenantId: string;
}

export interface ReturnSerialNumberCommand {
  readonly serialNumber: string;
  readonly returnedBy: string;
  readonly reason: string;
  readonly tenantId: string;
}

export interface ScrapSerialNumberCommand {
  readonly serialNumber: string;
  readonly reason: string;
  readonly tenantId: string;
}

export interface SerialNumberTraceability {
  readonly serialNumber: string;
  readonly sku: string;
  readonly batchId: string;
  readonly location: string;
  readonly status: SerialNumberStatus;
  readonly history: Array<{
    readonly action: string;
    readonly performedBy: string;
    readonly timestamp: Date;
    readonly notes?: string;
  }>;
  readonly tenantId: string;
}

@Injectable()
export class SerialNumberManagementService {
  private readonly logger = new Logger(SerialNumberManagementService.name);

  constructor(private readonly _eventStore: EventStore) {}

  async createSerialNumber(command: CreateSerialNumberCommand): Promise<void> {
    this.logger.log(`Creating serial number: ${command.serialNumber} for SKU: ${command.sku}`);

    const serialNumber = new SerialNumber(
      command.serialNumber,
      command.sku,
      command.batchId,
      command.location,
      SerialNumberStatus.AVAILABLE,
      command.tenantId,
    );

    await this._eventStore.append(
      `serial-${command.serialNumber}`,
      this.convertEvents(serialNumber.getUncommittedEvents()),
      serialNumber.getVersion(),
    );

    serialNumber.markEventsAsCommitted();
    this.logger.log(`Serial number created: ${command.serialNumber}`);
  }

  async reserveSerialNumber(command: ReserveSerialNumberCommand): Promise<void> {
    this.logger.log(`Reserving serial number: ${command.serialNumber}`);

    const serialNumber = await this.loadSerialNumber(command.serialNumber, command.tenantId);
    serialNumber.reserveSerialNumber(command.reservedBy, command.orderId);

    await this._eventStore.append(
      `serial-${command.serialNumber}`,
      this.convertEvents(serialNumber.getUncommittedEvents()),
      serialNumber.getVersion(),
    );

    serialNumber.markEventsAsCommitted();
    this.logger.log(`Serial number reserved: ${command.serialNumber}`);
  }

  async sellSerialNumber(command: SellSerialNumberCommand): Promise<void> {
    this.logger.log(`Selling serial number: ${command.serialNumber}`);

    const serialNumber = await this.loadSerialNumber(command.serialNumber, command.tenantId);
    serialNumber.sellSerialNumber(command.soldBy, command.orderId);

    await this._eventStore.append(
      `serial-${command.serialNumber}`,
      this.convertEvents(serialNumber.getUncommittedEvents()),
      serialNumber.getVersion(),
    );

    serialNumber.markEventsAsCommitted();
    this.logger.log(`Serial number sold: ${command.serialNumber}`);
  }

  async quarantineSerialNumber(command: QuarantineSerialNumberCommand): Promise<void> {
    this.logger.log(`Quarantining serial number: ${command.serialNumber}`);

    const serialNumber = await this.loadSerialNumber(command.serialNumber, command.tenantId);
    serialNumber.quarantineSerialNumber(command.reason);

    await this._eventStore.append(
      `serial-${command.serialNumber}`,
      this.convertEvents(serialNumber.getUncommittedEvents()),
      serialNumber.getVersion(),
    );

    serialNumber.markEventsAsCommitted();
    this.logger.log(`Serial number quarantined: ${command.serialNumber}`);
  }

  async returnSerialNumber(command: ReturnSerialNumberCommand): Promise<void> {
    this.logger.log(`Returning serial number: ${command.serialNumber}`);

    const serialNumber = await this.loadSerialNumber(command.serialNumber, command.tenantId);
    serialNumber.returnSerialNumber(command.returnedBy, command.reason);

    await this._eventStore.append(
      `serial-${command.serialNumber}`,
      this.convertEvents(serialNumber.getUncommittedEvents()),
      serialNumber.getVersion(),
    );

    serialNumber.markEventsAsCommitted();
    this.logger.log(`Serial number returned: ${command.serialNumber}`);
  }

  async scrapSerialNumber(command: ScrapSerialNumberCommand): Promise<void> {
    this.logger.log(`Scrapping serial number: ${command.serialNumber}`);

    const serialNumber = await this.loadSerialNumber(command.serialNumber, command.tenantId);
    serialNumber.scrapSerialNumber(command.reason);

    await this._eventStore.append(
      `serial-${command.serialNumber}`,
      this.convertEvents(serialNumber.getUncommittedEvents()),
      serialNumber.getVersion(),
    );

    serialNumber.markEventsAsCommitted();
    this.logger.log(`Serial number scrapped: ${command.serialNumber}`);
  }

  async releaseFromQuarantine(serialNumber: string, tenantId: string): Promise<void> {
    this.logger.log(`Releasing serial number from quarantine: ${serialNumber}`);

    const serialNumberAggregate = await this.loadSerialNumber(serialNumber, tenantId);
    serialNumberAggregate.releaseFromQuarantine();

    await this._eventStore.append(
      `serial-${serialNumber}`,
      this.convertEvents(serialNumberAggregate.getUncommittedEvents()),
      serialNumberAggregate.getVersion(),
    );

    serialNumberAggregate.markEventsAsCommitted();
    this.logger.log(`Serial number released from quarantine: ${serialNumber}`);
  }

  async getSerialNumberStatus(serialNumber: string, tenantId: string): Promise<SerialNumberStatus> {
    this.logger.log(`Getting status for serial number: ${serialNumber}`);

    const serialNumberAggregate = await this.loadSerialNumber(serialNumber, tenantId);
    return serialNumberAggregate._status;
  }

  async getSerialNumbersBySku(sku: string, tenantId: string): Promise<SerialNumberSummary[]> {
    this.logger.log(`Getting serial numbers for SKU: ${sku}`);

    // Implementation would query serial number projections by SKU
    // For now, return mock data
    return this.getMockSerialNumbersBySku(sku, tenantId);
  }

  async getSerialNumbersByBatch(batchId: string, tenantId: string): Promise<SerialNumberSummary[]> {
    this.logger.log(`Getting serial numbers for batch: ${batchId}`);

    // Implementation would query serial number projections by batch
    // For now, return mock data
    return this.getMockSerialNumbersByBatch(batchId, tenantId);
  }

  async getSerialNumbersByStatus(
    status: SerialNumberStatus,
    tenantId: string,
  ): Promise<SerialNumberSummary[]> {
    this.logger.log(`Getting serial numbers with status: ${status}`);

    // Implementation would query serial number projections by status
    // For now, return mock data
    return this.getMockSerialNumbersByStatus(status, tenantId);
  }

  async getSerialNumberTraceability(
    serialNumber: string,
    tenantId: string,
  ): Promise<SerialNumberTraceability> {
    this.logger.log(`Getting traceability for serial number: ${serialNumber}`);

    const serialNumberAggregate = await this.loadSerialNumber(serialNumber, tenantId);

    // Implementation would query event history for traceability
    return {
      serialNumber: serialNumberAggregate._serialNumber,
      sku: serialNumberAggregate._sku,
      batchId: serialNumberAggregate._batchId,
      location: serialNumberAggregate._location,
      status: serialNumberAggregate._status,
      history: [], // Would be populated from event history
      tenantId: serialNumberAggregate._tenantId,
    };
  }

  async getAvailableSerialNumbers(
    sku: string,
    location: string,
    tenantId: string,
  ): Promise<SerialNumberSummary[]> {
    this.logger.log(`Getting available serial numbers for SKU: ${sku} at location: ${location}`);

    const allSerialNumbers = await this.getSerialNumbersBySku(sku, tenantId);
    return allSerialNumbers.filter(
      (sn) => sn.status === SerialNumberStatus.AVAILABLE && sn.location === location,
    );
  }

  async getQuarantinedSerialNumbers(tenantId: string): Promise<SerialNumberSummary[]> {
    this.logger.log(`Getting quarantined serial numbers for tenant: ${tenantId}`);

    return await this.getSerialNumbersByStatus(SerialNumberStatus.QUARANTINED, tenantId);
  }

  async getSerialNumberReport(tenantId: string): Promise<{
    readonly totalSerialNumbers: number;
    readonly available: number;
    readonly reserved: number;
    readonly sold: number;
    readonly quarantined: number;
    readonly returned: number;
    readonly scrapped: number;
  }> {
    this.logger.log(`Generating serial number report for tenant: ${tenantId}`);

    // Implementation would query all serial number projections
    // For now, return mock data
    return {
      totalSerialNumbers: 100,
      available: 50,
      reserved: 20,
      sold: 25,
      quarantined: 3,
      returned: 1,
      scrapped: 1,
    };
  }

  private async loadSerialNumber(serialNumber: string, tenantId: string): Promise<SerialNumber> {
    this.logger.log(`Loading serial number: ${serialNumber}`);

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
      SerialNumberStatus.AVAILABLE,
      tenantId,
    );
  }

  private async getMockSerialNumbersBySku(
    sku: string,
    _tenantId: string,
  ): Promise<SerialNumberSummary[]> {
    // Mock data for testing
    return [
      {
        serialNumber: `SN-${sku}-001`,
        sku,
        batchId: 'BATCH-001',
        location: WAREHOUSE_A,
        status: SerialNumberStatus.AVAILABLE,
        createdAt: new Date(),
        lastUpdated: new Date(),
      },
      {
        serialNumber: `SN-${sku}-002`,
        sku,
        batchId: 'BATCH-001',
        location: WAREHOUSE_A,
        status: SerialNumberStatus.RESERVED,
        createdAt: new Date(),
        lastUpdated: new Date(),
      },
    ];
  }

  private async getMockSerialNumbersByBatch(
    batchId: string,
    _tenantId: string,
  ): Promise<SerialNumberSummary[]> {
    // Mock data for testing
    return [
      {
        serialNumber: `SN-BATCH-${batchId}-001`,
        sku: 'MOCK-SKU',
        batchId,
        location: WAREHOUSE_A,
        status: SerialNumberStatus.AVAILABLE,
        createdAt: new Date(),
        lastUpdated: new Date(),
      },
    ];
  }

  private async getMockSerialNumbersByStatus(
    status: SerialNumberStatus,
    _tenantId: string,
  ): Promise<SerialNumberSummary[]> {
    // Mock data for testing
    return [
      {
        serialNumber: `SN-${status}-001`,
        sku: 'MOCK-SKU',
        batchId: 'MOCK-BATCH',
        location: WAREHOUSE_A,
        status,
        createdAt: new Date(),
        lastUpdated: new Date(),
      },
    ];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private convertEvents(events: unknown[]): any[] {
    // Convert eventsourcing events to inventory events
    // For now, return as-is since we're using mock implementation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return events as any[];
  }
}
