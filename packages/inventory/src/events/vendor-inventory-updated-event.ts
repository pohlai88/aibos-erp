import { DomainEvent } from '../domain/domain-event';

export class VendorInventoryUpdatedEvent extends DomainEvent {
  public readonly vendorId: string;
  public readonly sku: string;
  public readonly vendorSku: string;
  public readonly vendorName: string;
  public readonly tenantId: string;
  public override readonly occurredAt: Date;

  constructor(
    vendorId: string,
    sku: string,
    vendorSku: string,
    vendorName: string,
    tenantId: string,
    occurredAt: Date = new Date(),
  ) {
    super();
    this.vendorId = vendorId;
    this.sku = sku;
    this.vendorSku = vendorSku;
    this.vendorName = vendorName;
    this.tenantId = tenantId;
    this.occurredAt = occurredAt;
  }

  getEventType(): string {
    return 'VendorInventoryUpdated';
  }

  getAggregateId(): string {
    return this.vendorId;
  }

  getTenantId(): string {
    return this.tenantId;
  }

  getOccurredAt(): Date {
    return this.occurredAt;
  }
}
