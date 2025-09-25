import type { DomainEvent } from './domain-event';

import { BusinessRuleViolation } from '../exceptions/business-rule-violation';
import { AggregateRoot } from './aggregate-root';

/* eslint-disable no-unused-vars */
export enum ProductionOrderStatus {
  PLANNED = 'PLANNED',
  RELEASED = 'RELEASED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ON_HOLD = 'ON_HOLD',
}
/* eslint-enable no-unused-vars */

export interface CreateProductionOrderCommand {
  readonly productionOrderId: string;
  readonly bomId: string;
  readonly finishedGoodSku: string;
  readonly quantity: number;
  readonly startDate: Date;
  readonly plannedEndDate: Date;
  readonly workCenter: string;
  readonly tenantId: string;
}

export interface StartProductionCommand {
  readonly productionOrderId: string;
  readonly tenantId: string;
}

export interface CompleteProductionCommand {
  readonly productionOrderId: string;
  readonly actualQuantity: number;
  readonly tenantId: string;
}

export class ProductionOrder extends AggregateRoot {
  /* eslint-disable no-unused-vars */
  constructor(
    public readonly productionOrderId: string,
    public readonly bomId: string,
    public readonly finishedGoodSku: string,
    public readonly quantity: number,
    public status: ProductionOrderStatus,
    public readonly startDate: Date,
    public readonly plannedEndDate: Date,
    public readonly workCenter: string,
    public readonly tenantId: string,
  ) {
    super();
  }
  /* eslint-enable no-unused-vars */

  public startProduction(): void {
    this.validateProductionStart();
    this.addEvent(new ProductionOrderStartedEvent(this.productionOrderId, this.tenantId));
    this.status = ProductionOrderStatus.IN_PROGRESS;
  }

  public completeProduction(actualQuantity: number): void {
    this.validateProductionCompletion(actualQuantity);
    this.addEvent(
      new ProductionOrderCompletedEvent(this.productionOrderId, actualQuantity, this.tenantId),
    );
    this.status = ProductionOrderStatus.COMPLETED;
  }

  public cancelProduction(reason: string): void {
    this.validateProductionCancellation();
    this.addEvent(new ProductionOrderCancelledEvent(this.productionOrderId, reason, this.tenantId));
    this.status = ProductionOrderStatus.CANCELLED;
  }

  public putOnHold(reason: string): void {
    this.validateProductionHold();
    this.addEvent(new ProductionOrderOnHoldEvent(this.productionOrderId, reason, this.tenantId));
    this.status = ProductionOrderStatus.ON_HOLD;
  }

  public releaseFromHold(): void {
    if (this.status !== ProductionOrderStatus.ON_HOLD) {
      throw new BusinessRuleViolation('Only orders on hold can be released');
    }
    this.addEvent(new ProductionOrderReleasedEvent(this.productionOrderId, this.tenantId));
    this.status = ProductionOrderStatus.IN_PROGRESS;
  }

  private validateProductionStart(): void {
    if (this.status !== ProductionOrderStatus.RELEASED) {
      throw new BusinessRuleViolation('Only released production orders can be started');
    }
  }

  private validateProductionCompletion(actualQuantity: number): void {
    if (this.status !== ProductionOrderStatus.IN_PROGRESS) {
      throw new BusinessRuleViolation('Only in-progress production orders can be completed');
    }
    if (actualQuantity <= 0) {
      throw new BusinessRuleViolation('Actual quantity must be positive');
    }
  }

  private validateProductionCancellation(): void {
    if (this.status === ProductionOrderStatus.COMPLETED) {
      throw new BusinessRuleViolation('Completed production orders cannot be cancelled');
    }
  }

  private validateProductionHold(): void {
    if (this.status !== ProductionOrderStatus.IN_PROGRESS) {
      throw new BusinessRuleViolation('Only in-progress production orders can be put on hold');
    }
  }
}

export class ProductionOrderStartedEvent implements DomainEvent {
  public readonly occurredAt: Date;

  /* eslint-disable no-unused-vars */
  constructor(
    public readonly productionOrderId: string,
    public readonly tenantId: string,
  ) {
    this.occurredAt = new Date();
  }
  /* eslint-enable no-unused-vars */

  public getEventType(): string {
    return 'ProductionOrderStarted';
  }

  public getAggregateId(): string {
    return this.productionOrderId;
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public getOccurredAt(): Date {
    return this.occurredAt;
  }
}

export class ProductionOrderCompletedEvent implements DomainEvent {
  public readonly occurredAt: Date;

  /* eslint-disable no-unused-vars */
  constructor(
    public readonly productionOrderId: string,
    public readonly actualQuantity: number,
    public readonly tenantId: string,
  ) {
    this.occurredAt = new Date();
  }
  /* eslint-enable no-unused-vars */

  public getEventType(): string {
    return 'ProductionOrderCompleted';
  }

  public getAggregateId(): string {
    return this.productionOrderId;
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public getOccurredAt(): Date {
    return this.occurredAt;
  }
}

export class ProductionOrderCancelledEvent implements DomainEvent {
  public readonly occurredAt: Date;

  /* eslint-disable no-unused-vars */
  constructor(
    public readonly productionOrderId: string,
    public readonly reason: string,
    public readonly tenantId: string,
  ) {
    this.occurredAt = new Date();
  }
  /* eslint-enable no-unused-vars */

  public getEventType(): string {
    return 'ProductionOrderCancelled';
  }

  public getAggregateId(): string {
    return this.productionOrderId;
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public getOccurredAt(): Date {
    return this.occurredAt;
  }
}

export class ProductionOrderOnHoldEvent implements DomainEvent {
  public readonly occurredAt: Date;

  /* eslint-disable no-unused-vars */
  constructor(
    public readonly productionOrderId: string,
    public readonly reason: string,
    public readonly tenantId: string,
  ) {
    this.occurredAt = new Date();
  }
  /* eslint-enable no-unused-vars */

  public getEventType(): string {
    return 'ProductionOrderOnHold';
  }

  public getAggregateId(): string {
    return this.productionOrderId;
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public getOccurredAt(): Date {
    return this.occurredAt;
  }
}

export class ProductionOrderReleasedEvent implements DomainEvent {
  public readonly occurredAt: Date;

  /* eslint-disable no-unused-vars */
  constructor(
    public readonly productionOrderId: string,
    public readonly tenantId: string,
  ) {
    this.occurredAt = new Date();
  }
  /* eslint-enable no-unused-vars */

  public getEventType(): string {
    return 'ProductionOrderReleased';
  }

  public getAggregateId(): string {
    return this.productionOrderId;
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public getOccurredAt(): Date {
    return this.occurredAt;
  }
}
