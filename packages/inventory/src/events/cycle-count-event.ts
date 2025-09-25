/* eslint-disable no-unused-vars */
import { DomainEvent } from '@aibos/eventsourcing';

export class CycleCountEvent extends DomainEvent {
  constructor(
    public readonly sku: string,
    public readonly location: string,
    public readonly countedQuantity: number,
    public readonly reference: string,
    tenantId: string,
    version: number,
    public readonly countedBy: string,
    public readonly countedAt: Date,
    public readonly notes?: string,
    public readonly batchNumber?: string,
    public readonly serialNumbers?: string[],
  ) {
    super(`inventory-item-${sku}-${tenantId}`, version, tenantId);
  }

  get eventType(): string {
    return 'CycleCountEvent';
  }

  serialize(): Record<string, unknown> {
    const serialized: Record<string, unknown> = {
      sku: this.sku,
      location: this.location,
      countedQuantity: this.countedQuantity,
      reference: this.reference,
      countedBy: this.countedBy,
      countedAt: this.countedAt,
    };

    // Add optional fields only if they exist
    if (this.notes !== undefined) {
      serialized.notes = this.notes;
    }
    if (this.batchNumber !== undefined) {
      serialized.batchNumber = this.batchNumber;
    }
    if (this.serialNumbers !== undefined) {
      serialized.serialNumbers = this.serialNumbers;
    }

    return serialized;
  }
}
