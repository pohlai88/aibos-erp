import type { DomainEvent } from './domain-event';

import { BusinessRuleViolation } from '../exceptions/business-rule-violation';
import { AggregateRoot } from './aggregate-root';

export interface CreateWorkCenterCommand {
  readonly workCenterId: string;
  readonly workCenterName: string;
  readonly workCenterCode: string;
  readonly capacity: number;
  readonly efficiency: number;
  readonly tenantId: string;
}

export interface UpdateWorkCenterCapacityCommand {
  readonly workCenterId: string;
  readonly capacity: number;
  readonly tenantId: string;
}

export interface WorkCenterUtilizationReport {
  readonly workCenterId: string;
  readonly workCenterCode: string;
  readonly capacity: number;
  readonly currentLoad: number;
  readonly utilizationPercentage: number;
  readonly availableCapacity: number;
  readonly efficiency: number;
}

export class WorkCenter extends AggregateRoot {
  /* eslint-disable no-unused-vars */
  constructor(
    public readonly workCenterId: string,
    public readonly workCenterName: string,
    public readonly workCenterCode: string,
    public capacity: number,
    public currentLoad: number,
    public readonly efficiency: number,
    public isActive: boolean,
    public readonly tenantId: string,
  ) {
    super();
  }
  /* eslint-enable no-unused-vars */

  public allocateCapacity(requiredCapacity: number): void {
    this.validateCapacityAllocation(requiredCapacity);
    this.currentLoad += requiredCapacity;
    this.addEvent(
      new WorkCenterCapacityAllocatedEvent(
        this.workCenterId,
        requiredCapacity,
        this.currentLoad,
        this.tenantId,
      ),
    );
  }

  public releaseCapacity(releasedCapacity: number): void {
    this.validateCapacityRelease(releasedCapacity);
    this.currentLoad = Math.max(0, this.currentLoad - releasedCapacity);
    this.addEvent(
      new WorkCenterCapacityReleasedEvent(
        this.workCenterId,
        releasedCapacity,
        this.currentLoad,
        this.tenantId,
      ),
    );
  }

  public updateCapacity(newCapacity: number): void {
    this.validateCapacityUpdate(newCapacity);
    this.capacity = newCapacity;
    this.addEvent(
      new WorkCenterCapacityUpdatedEvent(this.workCenterId, newCapacity, this.tenantId),
    );
  }

  public activate(): void {
    if (this.isActive) {
      throw new BusinessRuleViolation('Work center is already active');
    }
    this.isActive = true;
    this.addEvent(new WorkCenterActivatedEvent(this.workCenterId, this.tenantId));
  }

  public deactivate(): void {
    if (!this.isActive) {
      throw new BusinessRuleViolation('Work center is already inactive');
    }
    if (this.currentLoad > 0) {
      throw new BusinessRuleViolation('Cannot deactivate work center with active load');
    }
    this.isActive = false;
    this.addEvent(new WorkCenterDeactivatedEvent(this.workCenterId, this.tenantId));
  }

  public getUtilizationPercentage(): number {
    return this.capacity > 0 ? (this.currentLoad / this.capacity) * 100 : 0;
  }

  public getAvailableCapacity(): number {
    return this.capacity - this.currentLoad;
  }

  private validateCapacityAllocation(requiredCapacity: number): void {
    if (!this.isActive) {
      throw new BusinessRuleViolation('Cannot allocate capacity on inactive work center');
    }
    if (requiredCapacity <= 0) {
      throw new BusinessRuleViolation('Required capacity must be positive');
    }
    if (this.currentLoad + requiredCapacity > this.capacity) {
      throw new BusinessRuleViolation(
        `Insufficient work center capacity. Available: ${this.capacity - this.currentLoad}, Required: ${requiredCapacity}`,
      );
    }
  }

  private validateCapacityRelease(releasedCapacity: number): void {
    if (releasedCapacity <= 0) {
      throw new BusinessRuleViolation('Released capacity must be positive');
    }
    if (releasedCapacity > this.currentLoad) {
      throw new BusinessRuleViolation('Cannot release more capacity than currently allocated');
    }
  }

  private validateCapacityUpdate(newCapacity: number): void {
    if (newCapacity <= 0) {
      throw new BusinessRuleViolation('Capacity must be positive');
    }
    if (newCapacity < this.currentLoad) {
      throw new BusinessRuleViolation(
        `New capacity (${newCapacity}) cannot be less than current load (${this.currentLoad})`,
      );
    }
  }
}

export class WorkCenterCapacityAllocatedEvent implements DomainEvent {
  public readonly occurredAt: Date;

  /* eslint-disable no-unused-vars */
  constructor(
    public readonly workCenterId: string,
    public readonly allocatedCapacity: number,
    public readonly currentLoad: number,
    public readonly tenantId: string,
  ) {
    this.occurredAt = new Date();
  }
  /* eslint-enable no-unused-vars */

  public getEventType(): string {
    return 'WorkCenterCapacityAllocated';
  }

  public getAggregateId(): string {
    return this.workCenterId;
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public getOccurredAt(): Date {
    return this.occurredAt;
  }
}

export class WorkCenterCapacityReleasedEvent implements DomainEvent {
  public readonly occurredAt: Date;

  /* eslint-disable no-unused-vars */
  constructor(
    public readonly workCenterId: string,
    public readonly releasedCapacity: number,
    public readonly currentLoad: number,
    public readonly tenantId: string,
  ) {
    this.occurredAt = new Date();
  }
  /* eslint-enable no-unused-vars */

  public getEventType(): string {
    return 'WorkCenterCapacityReleased';
  }

  public getAggregateId(): string {
    return this.workCenterId;
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public getOccurredAt(): Date {
    return this.occurredAt;
  }
}

export class WorkCenterCapacityUpdatedEvent implements DomainEvent {
  public readonly occurredAt: Date;

  /* eslint-disable no-unused-vars */
  constructor(
    public readonly workCenterId: string,
    public readonly newCapacity: number,
    public readonly tenantId: string,
  ) {
    this.occurredAt = new Date();
  }
  /* eslint-enable no-unused-vars */

  public getEventType(): string {
    return 'WorkCenterCapacityUpdated';
  }

  public getAggregateId(): string {
    return this.workCenterId;
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public getOccurredAt(): Date {
    return this.occurredAt;
  }
}

export class WorkCenterActivatedEvent implements DomainEvent {
  public readonly occurredAt: Date;

  /* eslint-disable no-unused-vars */
  constructor(
    public readonly workCenterId: string,
    public readonly tenantId: string,
  ) {
    this.occurredAt = new Date();
  }
  /* eslint-enable no-unused-vars */

  public getEventType(): string {
    return 'WorkCenterActivated';
  }

  public getAggregateId(): string {
    return this.workCenterId;
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public getOccurredAt(): Date {
    return this.occurredAt;
  }
}

export class WorkCenterDeactivatedEvent implements DomainEvent {
  public readonly occurredAt: Date;

  /* eslint-disable no-unused-vars */
  constructor(
    public readonly workCenterId: string,
    public readonly tenantId: string,
  ) {
    this.occurredAt = new Date();
  }
  /* eslint-enable no-unused-vars */

  public getEventType(): string {
    return 'WorkCenterDeactivated';
  }

  public getAggregateId(): string {
    return this.workCenterId;
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public getOccurredAt(): Date {
    return this.occurredAt;
  }
}
