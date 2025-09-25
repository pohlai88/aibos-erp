import { BusinessRuleViolation } from '../exceptions/business-rule-violation';
import { AggregateRoot } from './aggregate-root';
import { DomainEvent } from './domain-event';

export class Batch extends AggregateRoot {
  public readonly batchId: string;
  public readonly sku: string;
  public readonly batchNumber: string;
  public readonly manufacturingDate: Date;
  public readonly expiryDate: Date;
  public readonly quantity: number;
  public readonly location: string;
  public readonly tenantId: string;

  constructor(
    batchId: string,
    sku: string,
    batchNumber: string,
    manufacturingDate: Date,
    expiryDate: Date,
    quantity: number,
    location: string,
    tenantId: string,
  ) {
    super();
    this.batchId = batchId;
    this.sku = sku;
    this.batchNumber = batchNumber;
    this.manufacturingDate = manufacturingDate;
    this.expiryDate = expiryDate;
    this.quantity = quantity;
    this.location = location;
    this.tenantId = tenantId;
  }

  public updateQuantity(newQuantity: number): void {
    if (newQuantity < 0) {
      throw new BusinessRuleViolation('Batch quantity cannot be negative');
    }

    this.addEvent(
      new BatchQuantityUpdatedEvent(
        this.batchId,
        this.quantity,
        newQuantity,
        this.tenantId,
        this.version + 1,
      ),
    );
  }

  public isExpired(): boolean {
    return new Date() > this.expiryDate;
  }

  public getDaysToExpiry(): number {
    const today = new Date();
    const timeDiff = this.expiryDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  public isExpiringSoon(daysAhead: number): boolean {
    return this.getDaysToExpiry() <= daysAhead && !this.isExpired();
  }

  public getExpiryStatus(): 'EXPIRED' | 'EXPIRING_SOON' | 'GOOD' {
    if (this.isExpired()) {
      return 'EXPIRED';
    }
    if (this.isExpiringSoon(30)) {
      return 'EXPIRING_SOON';
    }
    return 'GOOD';
  }
}

export interface ExpiringItem {
  readonly batchId: string;
  readonly sku: string;
  readonly batchNumber: string;
  readonly expiryDate: Date;
  readonly daysToExpiry: number;
  readonly quantity: number;
  readonly location: string;
}

export interface BatchSummary {
  readonly batchId: string;
  readonly sku: string;
  readonly batchNumber: string;
  readonly manufacturingDate: Date;
  readonly expiryDate: Date;
  readonly quantity: number;
  readonly location: string;
  readonly status: 'EXPIRED' | 'EXPIRING_SOON' | 'GOOD';
  readonly daysToExpiry: number;
}

// Event classes
export class BatchQuantityUpdatedEvent extends DomainEvent {
  public readonly batchId: string;
  public readonly oldQuantity: number;
  public readonly newQuantity: number;
  public readonly tenantId: string;
  public readonly version: number;

  constructor(
    batchId: string,
    oldQuantity: number,
    newQuantity: number,
    tenantId: string,
    version: number,
  ) {
    super();
    this.batchId = batchId;
    this.oldQuantity = oldQuantity;
    this.newQuantity = newQuantity;
    this.tenantId = tenantId;
    this.version = version;
  }

  getEventType(): string {
    return 'BatchQuantityUpdated';
  }

  getAggregateId(): string {
    return this.batchId;
  }

  getTenantId(): string {
    return this.tenantId;
  }

  getOccurredAt(): Date {
    return this.occurredAt;
  }
}

export class BatchCreatedEvent extends DomainEvent {
  public readonly batchId: string;
  public readonly sku: string;
  public readonly batchNumber: string;
  public readonly manufacturingDate: Date;
  public readonly expiryDate: Date;
  public readonly quantity: number;
  public readonly location: string;
  public readonly tenantId: string;
  public readonly version: number;

  constructor(
    batchId: string,
    sku: string,
    batchNumber: string,
    manufacturingDate: Date,
    expiryDate: Date,
    quantity: number,
    location: string,
    tenantId: string,
    version: number,
  ) {
    super();
    this.batchId = batchId;
    this.sku = sku;
    this.batchNumber = batchNumber;
    this.manufacturingDate = manufacturingDate;
    this.expiryDate = expiryDate;
    this.quantity = quantity;
    this.location = location;
    this.tenantId = tenantId;
    this.version = version;
  }

  getEventType(): string {
    return 'BatchCreated';
  }

  getAggregateId(): string {
    return this.batchId;
  }

  getTenantId(): string {
    return this.tenantId;
  }

  getOccurredAt(): Date {
    return this.occurredAt;
  }
}
