/* eslint-disable no-unused-vars */
import { DomainEvent } from '@aibos/eventsourcing';

export class StockTransferEvent extends DomainEvent {
  constructor(
    public readonly sku: string,
    public readonly quantity: number,
    public readonly fromLocation: string,
    public readonly toLocation: string,
    public readonly reference: string,
    tenantId: string,
    version: number,
    public readonly unitCost?: number,
    public readonly batchNumber?: string,
    public readonly serialNumbers?: string[],
    public readonly reason?: string,
  ) {
    super(`inventory-item-${sku}-${tenantId}`, version, tenantId);
  }

  get eventType(): string {
    return 'StockTransferEvent';
  }

  serialize(): Record<string, unknown> {
    const serialized: Record<string, unknown> = {
      sku: this.sku,
      quantity: this.quantity,
      fromLocation: this.fromLocation,
      toLocation: this.toLocation,
      reference: this.reference,
    };

    // Add optional fields only if they exist
    if (this.unitCost !== undefined) {
      serialized.unitCost = this.unitCost;
    }
    if (this.batchNumber !== undefined) {
      serialized.batchNumber = this.batchNumber;
    }
    if (this.serialNumbers !== undefined) {
      serialized.serialNumbers = this.serialNumbers;
    }
    if (this.reason !== undefined) {
      serialized.reason = this.reason;
    }

    return serialized;
  }
}
