/* eslint-disable no-unused-vars */
import { DomainEvent } from '@aibos/eventsourcing';

export class StockAdjustmentEvent extends DomainEvent {
  constructor(
    public readonly sku: string,
    public readonly quantity: number,
    public readonly location: string,
    public readonly adjustmentType: 'INCREASE' | 'DECREASE',
    public readonly reason: string,
    public readonly reference: string,
    tenantId: string,
    version: number,
    public readonly unitCost?: number,
    public readonly batchNumber?: string,
    public readonly serialNumbers?: string[],
  ) {
    super(`inventory-item-${sku}-${tenantId}`, version, tenantId);
  }

  get eventType(): string {
    return 'StockAdjustmentEvent';
  }

  serialize(): Record<string, unknown> {
    const serialized: Record<string, unknown> = {
      sku: this.sku,
      quantity: this.quantity,
      location: this.location,
      adjustmentType: this.adjustmentType,
      reason: this.reason,
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

    return serialized;
  }
}
