import { BusinessRuleViolation } from '../exceptions/business-rule-violation';
import { AggregateRoot } from './aggregate-root';
import { DomainEvent } from './domain-event';

export interface Address {
  readonly street: string;
  readonly city: string;
  readonly state: string;
  readonly postalCode: string;
  readonly country: string;
}

export interface CreateLocationCommand {
  readonly locationId: string;
  readonly locationCode: string;
  readonly locationName: string;
  readonly capacity: number;
  readonly locationType: LocationType;
  readonly warehouseId: string;
  readonly tenantId: string;
}

/* eslint-disable no-unused-vars */
export enum LocationType {
  RECEIVING = 'RECEIVING',
  STORAGE = 'STORAGE',
  PICKING = 'PICKING',
  SHIPPING = 'SHIPPING',
  QUARANTINE = 'QUARANTINE',
  DAMAGED = 'DAMAGED',
}
/* eslint-enable no-unused-vars */

export class Warehouse extends AggregateRoot {
  public readonly warehouseId: string;
  public readonly warehouseName: string;
  public readonly warehouseCode: string;
  public readonly address: Address;
  public readonly tenantId: string;
  public readonly isActive: boolean;

  constructor(
    warehouseId: string,
    warehouseName: string,
    warehouseCode: string,
    address: Address,
    tenantId: string,
    isActive: boolean = true,
  ) {
    super();
    this.warehouseId = warehouseId;
    this.warehouseName = warehouseName;
    this.warehouseCode = warehouseCode;
    this.address = address;
    this.tenantId = tenantId;
    this.isActive = isActive;
  }

  public createLocation(command: CreateLocationCommand): void {
    this.validateLocationCreation(command);

    this.addEvent(
      new LocationCreatedEvent(
        command.locationId,
        command.locationCode,
        command.locationName,
        command.capacity,
        command.locationType,
        this.warehouseId,
        this.tenantId,
        this.version + 1,
      ),
    );
  }

  public updateLocationCapacity(locationId: string, newCapacity: number): void {
    this.validateCapacityUpdate(newCapacity);

    this.addEvent(
      new LocationCapacityUpdatedEvent(
        locationId,
        newCapacity,
        this.warehouseId,
        this.tenantId,
        this.version + 1,
      ),
    );
  }

  public assignLocationToZone(locationId: string, zoneId: string): void {
    this.addEvent(
      new LocationAssignedToZoneEvent(
        locationId,
        zoneId,
        this.warehouseId,
        this.tenantId,
        this.version + 1,
      ),
    );
  }

  public deactivateWarehouse(): void {
    if (!this.isActive) {
      throw new BusinessRuleViolation('Warehouse is already deactivated');
    }

    this.addEvent(new WarehouseDeactivatedEvent(this.warehouseId, this.tenantId, this.version + 1));
  }

  private validateLocationCreation(command: CreateLocationCommand): void {
    if (!command.locationCode || command.locationCode.length < 3) {
      throw new BusinessRuleViolation('Location code must be at least 3 characters');
    }
    if (command.capacity <= 0) {
      throw new BusinessRuleViolation('Location capacity must be positive');
    }
  }

  private validateCapacityUpdate(newCapacity: number): void {
    if (newCapacity <= 0) {
      throw new BusinessRuleViolation('Location capacity must be positive');
    }
  }
}

// Event classes
export class LocationCreatedEvent extends DomainEvent {
  public readonly locationId: string;
  public readonly locationCode: string;
  public readonly locationName: string;
  public readonly capacity: number;
  public readonly locationType: LocationType;
  public readonly warehouseId: string;
  public readonly tenantId: string;
  public readonly version: number;

  constructor(
    locationId: string,
    locationCode: string,
    locationName: string,
    capacity: number,
    locationType: LocationType,
    warehouseId: string,
    tenantId: string,
    version: number,
  ) {
    super();
    this.locationId = locationId;
    this.locationCode = locationCode;
    this.locationName = locationName;
    this.capacity = capacity;
    this.locationType = locationType;
    this.warehouseId = warehouseId;
    this.tenantId = tenantId;
    this.version = version;
  }

  getEventType(): string {
    return 'LocationCreated';
  }

  getAggregateId(): string {
    return this.warehouseId;
  }

  getTenantId(): string {
    return this.tenantId;
  }

  getOccurredAt(): Date {
    return this.occurredAt;
  }
}

export class LocationCapacityUpdatedEvent extends DomainEvent {
  public readonly locationId: string;
  public readonly newCapacity: number;
  public readonly warehouseId: string;
  public readonly tenantId: string;
  public readonly version: number;

  constructor(
    locationId: string,
    newCapacity: number,
    warehouseId: string,
    tenantId: string,
    version: number,
  ) {
    super();
    this.locationId = locationId;
    this.newCapacity = newCapacity;
    this.warehouseId = warehouseId;
    this.tenantId = tenantId;
    this.version = version;
  }

  getEventType(): string {
    return 'LocationCapacityUpdated';
  }

  getAggregateId(): string {
    return this.warehouseId;
  }

  getTenantId(): string {
    return this.tenantId;
  }

  getOccurredAt(): Date {
    return this.occurredAt;
  }
}

export class LocationAssignedToZoneEvent extends DomainEvent {
  public readonly locationId: string;
  public readonly zoneId: string;
  public readonly warehouseId: string;
  public readonly tenantId: string;
  public readonly version: number;

  constructor(
    locationId: string,
    zoneId: string,
    warehouseId: string,
    tenantId: string,
    version: number,
  ) {
    super();
    this.locationId = locationId;
    this.zoneId = zoneId;
    this.warehouseId = warehouseId;
    this.tenantId = tenantId;
    this.version = version;
  }

  getEventType(): string {
    return 'LocationAssignedToZone';
  }

  getAggregateId(): string {
    return this.warehouseId;
  }

  getTenantId(): string {
    return this.tenantId;
  }

  getOccurredAt(): Date {
    return this.occurredAt;
  }
}

export class WarehouseDeactivatedEvent extends DomainEvent {
  public readonly warehouseId: string;
  public readonly tenantId: string;
  public readonly version: number;

  constructor(warehouseId: string, tenantId: string, version: number) {
    super();
    this.warehouseId = warehouseId;
    this.tenantId = tenantId;
    this.version = version;
  }

  getEventType(): string {
    return 'WarehouseDeactivated';
  }

  getAggregateId(): string {
    return this.warehouseId;
  }

  getTenantId(): string {
    return this.tenantId;
  }

  getOccurredAt(): Date {
    return this.occurredAt;
  }
}

// Command interfaces
export interface CreateWarehouseCommand {
  readonly warehouseId: string;
  readonly warehouseName: string;
  readonly warehouseCode: string;
  readonly address: Address;
  readonly tenantId: string;
}

export interface UpdateLocationCapacityCommand {
  readonly locationId: string;
  readonly newCapacity: number;
  readonly warehouseId: string;
  readonly tenantId: string;
}
