import type { DomainEvent } from './domain-event';

import { BusinessRuleViolation } from '../exceptions/business-rule-violation';
import { AggregateRoot } from './aggregate-root';

/* eslint-disable no-unused-vars */
export enum InspectionType {
  INCOMING = 'INCOMING',
  IN_PROCESS = 'IN_PROCESS',
  FINAL = 'FINAL',
  FIRST_ARTICLE = 'FIRST_ARTICLE',
  RANDOM = 'RANDOM',
}
/* eslint-enable no-unused-vars */

/* eslint-disable no-unused-vars */
export enum InspectionStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}
/* eslint-enable no-unused-vars */

/* eslint-disable no-unused-vars */
export enum InspectionResultStatus {
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  CONDITIONAL_PASS = 'CONDITIONAL_PASS',
}
/* eslint-enable no-unused-vars */

export interface InspectionResult {
  readonly status: InspectionResultStatus;
  readonly failureReason?: string;
  readonly inspector: string;
  readonly inspectionDate: Date;
  readonly notes?: string;
}

export interface CreateQualityInspectionCommand {
  readonly inspectionId: string;
  readonly sku: string;
  readonly batchNumber: string;
  readonly quantity: number;
  readonly inspectionType: InspectionType;
  readonly inspector: string;
  readonly inspectionDate: Date;
  readonly tenantId: string;
}

export interface CompleteQualityInspectionCommand {
  readonly inspectionId: string;
  readonly result: InspectionResult;
  readonly tenantId: string;
}

export class QualityInspection extends AggregateRoot {
  /* eslint-disable no-unused-vars */
  constructor(
    public readonly inspectionId: string,
    public readonly sku: string,
    public readonly batchNumber: string,
    public readonly quantity: number,
    public readonly inspectionType: InspectionType,
    public status: InspectionStatus,
    public readonly inspector: string,
    public readonly inspectionDate: Date,
    public readonly tenantId: string,
  ) {
    super();
  }
  /* eslint-enable no-unused-vars */

  public startInspection(): void {
    this.validateInspectionStart();
    this.status = InspectionStatus.IN_PROGRESS;
    this.addEvent(new QualityInspectionStartedEvent(this.inspectionId, this.tenantId));
  }

  public completeInspection(result: InspectionResult): void {
    this.validateInspectionCompletion(result);

    this.addEvent(
      new QualityInspectionCompletedEvent(
        this.inspectionId,
        this.sku,
        this.batchNumber,
        result,
        this.tenantId,
      ),
    );

    this.status = InspectionStatus.COMPLETED;
  }

  public cancelInspection(reason: string): void {
    this.validateInspectionCancellation();
    this.addEvent(new QualityInspectionCancelledEvent(this.inspectionId, reason, this.tenantId));
    this.status = InspectionStatus.CANCELLED;
  }

  private validateInspectionStart(): void {
    if (this.status !== InspectionStatus.PENDING) {
      throw new BusinessRuleViolation('Only pending inspections can be started');
    }
  }

  private validateInspectionCompletion(result: InspectionResult): void {
    if (this.status !== InspectionStatus.IN_PROGRESS) {
      throw new BusinessRuleViolation('Only in-progress inspections can be completed');
    }
    if (!result.inspector) {
      throw new BusinessRuleViolation('Inspector must be specified');
    }
    if (result.status === InspectionResultStatus.FAILED && !result.failureReason) {
      throw new BusinessRuleViolation('Failure reason must be specified for failed inspections');
    }
  }

  private validateInspectionCancellation(): void {
    if (this.status === InspectionStatus.COMPLETED) {
      throw new BusinessRuleViolation('Completed inspections cannot be cancelled');
    }
  }
}

export class QualityInspectionStartedEvent implements DomainEvent {
  public readonly occurredAt: Date;

  /* eslint-disable no-unused-vars */
  constructor(
    public readonly inspectionId: string,
    public readonly tenantId: string,
  ) {
    this.occurredAt = new Date();
  }
  /* eslint-enable no-unused-vars */

  public getEventType(): string {
    return 'QualityInspectionStarted';
  }

  public getAggregateId(): string {
    return this.inspectionId;
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public getOccurredAt(): Date {
    return this.occurredAt;
  }
}

export class QualityInspectionCompletedEvent implements DomainEvent {
  public readonly occurredAt: Date;

  /* eslint-disable no-unused-vars */
  constructor(
    public readonly inspectionId: string,
    public readonly sku: string,
    public readonly batchNumber: string,
    public readonly result: InspectionResult,
    public readonly tenantId: string,
  ) {
    this.occurredAt = new Date();
  }
  /* eslint-enable no-unused-vars */

  public getEventType(): string {
    return 'QualityInspectionCompleted';
  }

  public getAggregateId(): string {
    return this.inspectionId;
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public getOccurredAt(): Date {
    return this.occurredAt;
  }
}

export class QualityInspectionCancelledEvent implements DomainEvent {
  public readonly occurredAt: Date;

  /* eslint-disable no-unused-vars */
  constructor(
    public readonly inspectionId: string,
    public readonly reason: string,
    public readonly tenantId: string,
  ) {
    this.occurredAt = new Date();
  }
  /* eslint-enable no-unused-vars */

  public getEventType(): string {
    return 'QualityInspectionCancelled';
  }

  public getAggregateId(): string {
    return this.inspectionId;
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public getOccurredAt(): Date {
    return this.occurredAt;
  }
}
