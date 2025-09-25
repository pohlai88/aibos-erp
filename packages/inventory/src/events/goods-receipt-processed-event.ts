import { DomainEvent } from '../domain/domain-event';

export class GoodsReceiptProcessedEvent extends DomainEvent {
  public readonly grnId: string;
  public readonly purchaseOrderId: string;
  public readonly tenantId: string;
  public override readonly occurredAt: Date;

  constructor(
    grnId: string,
    purchaseOrderId: string,
    tenantId: string,
    occurredAt: Date = new Date(),
  ) {
    super();
    this.grnId = grnId;
    this.purchaseOrderId = purchaseOrderId;
    this.tenantId = tenantId;
    this.occurredAt = occurredAt;
  }

  getEventType(): string {
    return 'GoodsReceiptProcessed';
  }

  getAggregateId(): string {
    return this.grnId;
  }

  getTenantId(): string {
    return this.tenantId;
  }

  getOccurredAt(): Date {
    return this.occurredAt;
  }
}
