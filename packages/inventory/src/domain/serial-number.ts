/* eslint-disable no-unused-vars */
import { AggregateRoot, DomainEvent as EventSourcingDomainEvent } from '@aibos/eventsourcing';

export interface SerialNumberData {
  readonly serialNumber: string;
  readonly sku: string;
  readonly batchId: string;
  readonly location: string;
  readonly status: SerialNumberStatus;
  readonly tenantId: string;
  readonly createdAt: Date;
  readonly lastUpdated: Date;
}

export enum SerialNumberStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  SOLD = 'SOLD',
  DEFECTIVE = 'DEFECTIVE',
  QUARANTINED = 'QUARANTINED',
  RETURNED = 'RETURNED',
  SCRAPPED = 'SCRAPPED',
}

export class SerialNumber extends AggregateRoot {
  constructor(
    public readonly _serialNumber: string,
    public readonly _sku: string,
    public readonly _batchId: string,
    public readonly _location: string,
    public _status: SerialNumberStatus,
    public readonly _tenantId: string,
  ) {
    super(_serialNumber, 0);
  }

  protected apply(_event: EventSourcingDomainEvent): void {
    // Apply events to aggregate state
    // This would be implemented based on specific event types
  }

  public updateStatus(newStatus: SerialNumberStatus): void {
    if (this._status === newStatus) {
      return; // No change needed
    }

    const oldStatus = this._status;
    this._status = newStatus;

    this.addEvent(
      new SerialNumberStatusUpdatedEvent(
        this._serialNumber,
        this._sku,
        oldStatus,
        newStatus,
        this._tenantId,
      ),
    );
  }

  public reserveSerialNumber(reservedBy: string, orderId: string): void {
    if (this._status !== SerialNumberStatus.AVAILABLE) {
      throw new Error(`Serial number ${this._serialNumber} is not available for reservation`);
    }

    this._status = SerialNumberStatus.RESERVED;

    this.addEvent(
      new SerialNumberReservedEvent(
        this._serialNumber,
        this._sku,
        reservedBy,
        orderId,
        this._tenantId,
      ),
    );
  }

  public sellSerialNumber(soldBy: string, orderId: string): void {
    if (this._status !== SerialNumberStatus.RESERVED) {
      throw new Error(`Serial number ${this._serialNumber} must be reserved before sale`);
    }

    this._status = SerialNumberStatus.SOLD;

    this.addEvent(
      new SerialNumberSoldEvent(this._serialNumber, this._sku, soldBy, orderId, this._tenantId),
    );
  }

  public quarantineSerialNumber(reason: string): void {
    if (this._status === SerialNumberStatus.SOLD) {
      throw new Error('Cannot quarantine sold serial number');
    }

    this._status = SerialNumberStatus.QUARANTINED;

    this.addEvent(
      new SerialNumberQuarantinedEvent(this._serialNumber, this._sku, reason, this._tenantId),
    );
  }

  public returnSerialNumber(returnedBy: string, reason: string): void {
    if (this._status !== SerialNumberStatus.SOLD) {
      throw new Error('Only sold serial numbers can be returned');
    }

    this._status = SerialNumberStatus.RETURNED;

    this.addEvent(
      new SerialNumberReturnedEvent(
        this._serialNumber,
        this._sku,
        returnedBy,
        reason,
        this._tenantId,
      ),
    );
  }

  public scrapSerialNumber(reason: string): void {
    this._status = SerialNumberStatus.SCRAPPED;

    this.addEvent(
      new SerialNumberScrappedEvent(this._serialNumber, this._sku, reason, this._tenantId),
    );
  }

  public releaseFromQuarantine(): void {
    if (this._status !== SerialNumberStatus.QUARANTINED) {
      throw new Error('Only quarantined serial numbers can be released');
    }

    this._status = SerialNumberStatus.AVAILABLE;

    this.addEvent(
      new SerialNumberReleasedFromQuarantineEvent(this._serialNumber, this._sku, this._tenantId),
    );
  }
}

export interface SerialNumberSummary {
  readonly serialNumber: string;
  readonly sku: string;
  readonly batchId: string;
  readonly location: string;
  readonly status: SerialNumberStatus;
  readonly createdAt: Date;
  readonly lastUpdated: Date;
}

// Domain Events
export class SerialNumberStatusUpdatedEvent extends EventSourcingDomainEvent {
  constructor(
    public readonly serialNumber: string,
    public readonly sku: string,
    public readonly oldStatus: SerialNumberStatus,
    public readonly newStatus: SerialNumberStatus,
    public override readonly tenantId: string,
  ) {
    super(`serial-${serialNumber}`, 0, tenantId);
  }

  get eventType(): string {
    return 'SerialNumberStatusUpdated';
  }

  serialize(): Record<string, unknown> {
    return {
      serialNumber: this.serialNumber,
      sku: this.sku,
      oldStatus: this.oldStatus,
      newStatus: this.newStatus,
    };
  }
}

export class SerialNumberReservedEvent extends EventSourcingDomainEvent {
  constructor(
    public readonly serialNumber: string,
    public readonly sku: string,
    public readonly reservedBy: string,
    public readonly orderId: string,
    public override readonly tenantId: string,
  ) {
    super(`serial-${serialNumber}`, 0, tenantId);
  }

  get eventType(): string {
    return 'SerialNumberReserved';
  }

  serialize(): Record<string, unknown> {
    return {
      serialNumber: this.serialNumber,
      sku: this.sku,
      reservedBy: this.reservedBy,
      orderId: this.orderId,
    };
  }
}

export class SerialNumberSoldEvent extends EventSourcingDomainEvent {
  constructor(
    public readonly serialNumber: string,
    public readonly sku: string,
    public readonly soldBy: string,
    public readonly orderId: string,
    public override readonly tenantId: string,
  ) {
    super(`serial-${serialNumber}`, 0, tenantId);
  }

  get eventType(): string {
    return 'SerialNumberSold';
  }

  serialize(): Record<string, unknown> {
    return {
      serialNumber: this.serialNumber,
      sku: this.sku,
      soldBy: this.soldBy,
      orderId: this.orderId,
    };
  }
}

export class SerialNumberQuarantinedEvent extends EventSourcingDomainEvent {
  constructor(
    public readonly serialNumber: string,
    public readonly sku: string,
    public readonly reason: string,
    public override readonly tenantId: string,
  ) {
    super(`serial-${serialNumber}`, 0, tenantId);
  }

  get eventType(): string {
    return 'SerialNumberQuarantined';
  }

  serialize(): Record<string, unknown> {
    return {
      serialNumber: this.serialNumber,
      sku: this.sku,
      reason: this.reason,
    };
  }
}

export class SerialNumberReturnedEvent extends EventSourcingDomainEvent {
  constructor(
    public readonly serialNumber: string,
    public readonly sku: string,
    public readonly returnedBy: string,
    public readonly reason: string,
    public override readonly tenantId: string,
  ) {
    super(`serial-${serialNumber}`, 0, tenantId);
  }

  get eventType(): string {
    return 'SerialNumberReturned';
  }

  serialize(): Record<string, unknown> {
    return {
      serialNumber: this.serialNumber,
      sku: this.sku,
      returnedBy: this.returnedBy,
      reason: this.reason,
    };
  }
}

export class SerialNumberScrappedEvent extends EventSourcingDomainEvent {
  constructor(
    public readonly serialNumber: string,
    public readonly sku: string,
    public readonly reason: string,
    public override readonly tenantId: string,
  ) {
    super(`serial-${serialNumber}`, 0, tenantId);
  }

  get eventType(): string {
    return 'SerialNumberScrapped';
  }

  serialize(): Record<string, unknown> {
    return {
      serialNumber: this.serialNumber,
      sku: this.sku,
      reason: this.reason,
      eventType: 'SerialNumberScrapped',
    };
  }
}

export class SerialNumberReleasedFromQuarantineEvent extends EventSourcingDomainEvent {
  constructor(
    public readonly serialNumber: string,
    public readonly sku: string,
    public override readonly tenantId: string,
  ) {
    super(`serial-${serialNumber}`, 0, tenantId);
  }

  get eventType(): string {
    return 'SerialNumberReleasedFromQuarantine';
  }

  serialize(): Record<string, unknown> {
    return {
      serialNumber: this.serialNumber,
      sku: this.sku,
    };
  }
}
