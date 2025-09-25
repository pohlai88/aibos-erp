import type { DomainEvent } from './domain-event';

import { BusinessRuleViolation } from '../exceptions/business-rule-violation';
import { AggregateRoot } from './aggregate-root';

/* eslint-disable no-unused-vars */
export enum BOMStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  OBSOLETE = 'OBSOLETE',
  SUSPENDED = 'SUSPENDED',
}
/* eslint-enable no-unused-vars */

export interface BOMItem {
  readonly componentSku: string;
  readonly quantity: number;
  readonly unitOfMeasure: string;
  readonly location: string;
  readonly leadTime: number;
  readonly isOptional: boolean;
}

export interface MaterialRequirement {
  readonly sku: string;
  readonly quantity: number;
  readonly unitOfMeasure: string;
  readonly location: string;
  readonly leadTime: number;
}

export interface CreateBOMCommand {
  readonly bomId: string;
  readonly finishedGoodSku: string;
  readonly version: string;
  readonly items: BOMItem[];
  readonly effectiveDate: Date;
  readonly tenantId: string;
}

export interface UpdateBOMCommand {
  readonly bomId: string;
  readonly version: string;
  readonly items: BOMItem[];
  readonly effectiveDate: Date;
  readonly tenantId: string;
}

export class BillOfMaterials extends AggregateRoot {
  /* eslint-disable no-unused-vars */
  constructor(
    public readonly bomId: string,
    public readonly finishedGoodSku: string,
    public readonly bomVersion: string,
    public readonly items: BOMItem[],
    public status: BOMStatus,
    public readonly effectiveDate: Date,
    public readonly tenantId: string,
  ) {
    super();
  }
  /* eslint-enable no-unused-vars */

  public calculateMaterialRequirements(quantity: number): MaterialRequirement[] {
    return this.items.map((item) => ({
      sku: item.componentSku,
      quantity: item.quantity * quantity,
      unitOfMeasure: item.unitOfMeasure,
      location: item.location,
      leadTime: item.leadTime,
    }));
  }

  public validateBOM(): void {
    this.validateBOMStructure();
    this.validateComponentAvailability();
  }

  public activate(): void {
    if (this.status !== BOMStatus.DRAFT) {
      throw new BusinessRuleViolation('Only draft BOMs can be activated');
    }
    this.status = BOMStatus.ACTIVE;
  }

  public suspend(): void {
    if (this.status !== BOMStatus.ACTIVE) {
      throw new BusinessRuleViolation('Only active BOMs can be suspended');
    }
    this.status = BOMStatus.SUSPENDED;
  }

  public obsolete(): void {
    this.status = BOMStatus.OBSOLETE;
  }

  private validateBOMStructure(): void {
    if (this.items.length === 0) {
      throw new BusinessRuleViolation('BOM must have at least one component');
    }

    const duplicateSkus = this.items.filter(
      (item, index, array) =>
        array.findIndex((index_) => index_.componentSku === item.componentSku) !== index,
    );

    if (duplicateSkus.length > 0) {
      throw new BusinessRuleViolation('BOM cannot have duplicate component SKUs');
    }
  }

  private validateComponentAvailability(): void {
    // This would typically check against inventory service
    // For now, we'll just validate the structure
    this.items.forEach((item) => {
      if (item.quantity <= 0) {
        throw new BusinessRuleViolation(
          `Component ${item.componentSku} must have positive quantity`,
        );
      }
    });
  }
}

export class BOMCreatedEvent implements DomainEvent {
  public readonly occurredAt: Date;

  /* eslint-disable no-unused-vars */
  constructor(
    public readonly bomId: string,
    public readonly finishedGoodSku: string,
    public readonly bomVersion: string,
    public readonly tenantId: string,
  ) {
    this.occurredAt = new Date();
  }
  /* eslint-enable no-unused-vars */

  public getEventType(): string {
    return 'BOMCreated';
  }

  public getAggregateId(): string {
    return this.bomId;
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public getOccurredAt(): Date {
    return this.occurredAt;
  }
}

export class BOMUpdatedEvent implements DomainEvent {
  public readonly occurredAt: Date;

  /* eslint-disable no-unused-vars */
  constructor(
    public readonly bomId: string,
    public readonly bomVersion: string,
    public readonly tenantId: string,
  ) {
    this.occurredAt = new Date();
  }
  /* eslint-enable no-unused-vars */

  public getEventType(): string {
    return 'BOMUpdated';
  }

  public getAggregateId(): string {
    return this.bomId;
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public getOccurredAt(): Date {
    return this.occurredAt;
  }
}

export class BOMStatusChangedEvent implements DomainEvent {
  public readonly occurredAt: Date;

  /* eslint-disable no-unused-vars */
  constructor(
    public readonly bomId: string,
    public readonly previousStatus: BOMStatus,
    public readonly newStatus: BOMStatus,
    public readonly tenantId: string,
  ) {
    this.occurredAt = new Date();
  }
  /* eslint-enable no-unused-vars */

  public getEventType(): string {
    return 'BOMStatusChanged';
  }

  public getAggregateId(): string {
    return this.bomId;
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public getOccurredAt(): Date {
    return this.occurredAt;
  }
}
