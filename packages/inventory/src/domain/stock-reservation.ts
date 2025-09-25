import { AggregateRoot } from './aggregate-root';
import { DomainEvent } from './domain-event';

export class StockReservation extends AggregateRoot {
  public readonly reservationId: string;
  public readonly sku: string;
  public readonly quantity: number;
  public readonly location: string;
  public readonly orderId: string;
  public readonly customerId: string;
  public readonly reservedUntil: Date;
  public readonly tenantId: string;

  constructor(
    reservationId: string,
    sku: string,
    quantity: number,
    location: string,
    orderId: string,
    customerId: string,
    reservedUntil: Date,
    tenantId: string,
  ) {
    super();
    this.reservationId = reservationId;
    this.sku = sku;
    this.quantity = quantity;
    this.location = location;
    this.orderId = orderId;
    this.customerId = customerId;
    this.reservedUntil = reservedUntil;
    this.tenantId = tenantId;
  }

  public releaseReservation(): void {
    this.addEvent(
      new ReservationReleasedEvent(
        this.reservationId,
        this.sku,
        this.quantity,
        this.location,
        this.tenantId,
        this.version + 1,
      ),
    );
  }

  public extendReservation(newExpiryDate: Date): void {
    if (newExpiryDate <= this.reservedUntil) {
      throw new Error('New expiry date must be after current expiry date');
    }

    this.addEvent(
      new ReservationExtendedEvent(
        this.reservationId,
        this.reservedUntil,
        newExpiryDate,
        this.tenantId,
        this.version + 1,
      ),
    );
  }

  public isExpired(): boolean {
    return new Date() > this.reservedUntil;
  }

  public getDaysUntilExpiry(): number {
    const today = new Date();
    const timeDiff = this.reservedUntil.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  public isExpiringSoon(daysAhead: number): boolean {
    return this.getDaysUntilExpiry() <= daysAhead && !this.isExpired();
  }
}

export interface ReservationSummary {
  readonly reservationId: string;
  readonly sku: string;
  readonly quantity: number;
  readonly location: string;
  readonly orderId: string;
  readonly customerId: string;
  readonly reservedUntil: Date;
  readonly daysUntilExpiry: number;
  readonly isExpired: boolean;
  readonly isExpiringSoon: boolean;
}

export interface ReservationReport {
  readonly totalReservations: number;
  readonly activeReservations: number;
  readonly expiredReservations: number;
  readonly expiringSoonReservations: number;
  readonly totalReservedValue: number;
  readonly reservationsBySku: Array<{
    sku: string;
    reservedQuantity: number;
    reservedValue: number;
  }>;
}

// Event classes
export class ReservationReleasedEvent extends DomainEvent {
  public readonly reservationId: string;
  public readonly sku: string;
  public readonly quantity: number;
  public readonly location: string;
  public readonly tenantId: string;
  public readonly version: number;

  constructor(
    reservationId: string,
    sku: string,
    quantity: number,
    location: string,
    tenantId: string,
    version: number,
  ) {
    super();
    this.reservationId = reservationId;
    this.sku = sku;
    this.quantity = quantity;
    this.location = location;
    this.tenantId = tenantId;
    this.version = version;
  }

  getEventType(): string {
    return 'ReservationReleased';
  }

  getAggregateId(): string {
    return this.reservationId;
  }

  getTenantId(): string {
    return this.tenantId;
  }

  getOccurredAt(): Date {
    return this.occurredAt;
  }
}

export class ReservationExtendedEvent extends DomainEvent {
  public readonly reservationId: string;
  public readonly oldExpiryDate: Date;
  public readonly newExpiryDate: Date;
  public readonly tenantId: string;
  public readonly version: number;

  constructor(
    reservationId: string,
    oldExpiryDate: Date,
    newExpiryDate: Date,
    tenantId: string,
    version: number,
  ) {
    super();
    this.reservationId = reservationId;
    this.oldExpiryDate = oldExpiryDate;
    this.newExpiryDate = newExpiryDate;
    this.tenantId = tenantId;
    this.version = version;
  }

  getEventType(): string {
    return 'ReservationExtended';
  }

  getAggregateId(): string {
    return this.reservationId;
  }

  getTenantId(): string {
    return this.tenantId;
  }

  getOccurredAt(): Date {
    return this.occurredAt;
  }
}

export class StockReservedEvent extends DomainEvent {
  public readonly reservationId: string;
  public readonly sku: string;
  public readonly quantity: number;
  public readonly location: string;
  public readonly orderId: string;
  public readonly customerId: string;
  public readonly reservedUntil: Date;
  public readonly tenantId: string;
  public readonly version: number;

  constructor(
    reservationId: string,
    sku: string,
    quantity: number,
    location: string,
    orderId: string,
    customerId: string,
    reservedUntil: Date,
    tenantId: string,
    version: number,
  ) {
    super();
    this.reservationId = reservationId;
    this.sku = sku;
    this.quantity = quantity;
    this.location = location;
    this.orderId = orderId;
    this.customerId = customerId;
    this.reservedUntil = reservedUntil;
    this.tenantId = tenantId;
    this.version = version;
  }

  getEventType(): string {
    return 'StockReserved';
  }

  getAggregateId(): string {
    return this.reservationId;
  }

  getTenantId(): string {
    return this.tenantId;
  }

  getOccurredAt(): Date {
    return this.occurredAt;
  }
}
