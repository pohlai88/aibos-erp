import type { DomainEvent } from './domain-event';

import { BusinessRuleViolation } from '../exceptions/business-rule-violation';
import { AggregateRoot } from './aggregate-root';

/* eslint-disable no-unused-vars */
export enum IssueType {
  MATERIAL_DEFECT = 'MATERIAL_DEFECT',
  PROCESS_DEFECT = 'PROCESS_DEFECT',
  DESIGN_DEFECT = 'DESIGN_DEFECT',
  SUPPLIER_DEFECT = 'SUPPLIER_DEFECT',
  WORKMANSHIP_DEFECT = 'WORKMANSHIP_DEFECT',
}
/* eslint-enable no-unused-vars */

/* eslint-disable no-unused-vars */
export enum SeverityLevel {
  CRITICAL = 'CRITICAL',
  MAJOR = 'MAJOR',
  MINOR = 'MINOR',
  COSMETIC = 'COSMETIC',
}
/* eslint-enable no-unused-vars */

/* eslint-disable no-unused-vars */
export enum NCRStatus {
  OPEN = 'OPEN',
  INVESTIGATION_IN_PROGRESS = 'INVESTIGATION_IN_PROGRESS',
  INVESTIGATION_COMPLETE = 'INVESTIGATION_COMPLETE',
  CORRECTIVE_ACTION_IMPLEMENTED = 'CORRECTIVE_ACTION_IMPLEMENTED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}
/* eslint-enable no-unused-vars */

export interface CorrectiveAction {
  readonly actionId: string;
  readonly description: string;
  readonly implementedBy: string;
  readonly implementationDate: Date;
  readonly effectiveness?: string;
}

export interface CreateNCRCommand {
  readonly ncrId: string;
  readonly sku: string;
  readonly batchNumber: string;
  readonly quantity: number;
  readonly issueType: IssueType;
  readonly severity: SeverityLevel;
  readonly description: string;
  readonly reportedBy: string;
  readonly reportedDate: Date;
  readonly tenantId: string;
}

export interface ImplementCorrectiveActionCommand {
  readonly ncrId: string;
  readonly action: CorrectiveAction;
  readonly tenantId: string;
}

export class NonConformanceReport extends AggregateRoot {
  /* eslint-disable no-unused-vars */
  constructor(
    public readonly ncrId: string,
    public readonly sku: string,
    public readonly batchNumber: string,
    public readonly issueType: IssueType,
    public readonly severity: SeverityLevel,
    public readonly description: string,
    public readonly reportedBy: string,
    public readonly reportedDate: Date,
    public status: NCRStatus,
    public readonly tenantId: string,
  ) {
    super();
  }
  /* eslint-enable no-unused-vars */

  public startInvestigation(investigator: string): void {
    this.validateInvestigationStart();
    this.status = NCRStatus.INVESTIGATION_IN_PROGRESS;
    this.addEvent(new NCRInvestigationStartedEvent(this.ncrId, investigator, this.tenantId));
  }

  public completeInvestigation(investigationResults: string): void {
    this.validateInvestigationCompletion();
    this.status = NCRStatus.INVESTIGATION_COMPLETE;
    this.addEvent(
      new NCRInvestigationCompletedEvent(this.ncrId, investigationResults, this.tenantId),
    );
  }

  public implementCorrectiveAction(action: CorrectiveAction): void {
    this.validateCorrectiveAction(action);

    this.addEvent(
      new CorrectiveActionImplementedEvent(
        this.ncrId,
        action.actionId,
        action.description,
        action.implementedBy,
        this.tenantId,
      ),
    );

    this.status = NCRStatus.CORRECTIVE_ACTION_IMPLEMENTED;
  }

  public closeNCR(closureReason: string): void {
    this.validateNCRClosure();
    this.status = NCRStatus.CLOSED;
    this.addEvent(new NCRClosedEvent(this.ncrId, closureReason, this.tenantId));
  }

  public cancelNCR(reason: string): void {
    this.validateNCRCancellation();
    this.status = NCRStatus.CANCELLED;
    this.addEvent(new NCRCancelledEvent(this.ncrId, reason, this.tenantId));
  }

  private validateInvestigationStart(): void {
    if (this.status !== NCRStatus.OPEN) {
      throw new BusinessRuleViolation('Only open NCRs can start investigation');
    }
  }

  private validateInvestigationCompletion(): void {
    if (this.status !== NCRStatus.INVESTIGATION_IN_PROGRESS) {
      throw new BusinessRuleViolation('Only NCRs under investigation can be completed');
    }
  }

  private validateCorrectiveAction(action: CorrectiveAction): void {
    if (this.status !== NCRStatus.INVESTIGATION_COMPLETE) {
      throw new BusinessRuleViolation(
        'Corrective action can only be implemented after investigation is complete',
      );
    }
    if (!action.description) {
      throw new BusinessRuleViolation('Corrective action description is required');
    }
  }

  private validateNCRClosure(): void {
    if (this.status !== NCRStatus.CORRECTIVE_ACTION_IMPLEMENTED) {
      throw new BusinessRuleViolation(
        'NCR can only be closed after corrective action is implemented',
      );
    }
  }

  private validateNCRCancellation(): void {
    if (this.status === NCRStatus.CLOSED) {
      throw new BusinessRuleViolation('Closed NCRs cannot be cancelled');
    }
  }
}

export class NCRInvestigationStartedEvent implements DomainEvent {
  public readonly occurredAt: Date;

  /* eslint-disable no-unused-vars */
  constructor(
    public readonly ncrId: string,
    public readonly investigator: string,
    public readonly tenantId: string,
  ) {
    this.occurredAt = new Date();
  }
  /* eslint-enable no-unused-vars */

  public getEventType(): string {
    return 'NCRInvestigationStarted';
  }

  public getAggregateId(): string {
    return this.ncrId;
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public getOccurredAt(): Date {
    return this.occurredAt;
  }
}

export class NCRInvestigationCompletedEvent implements DomainEvent {
  public readonly occurredAt: Date;

  /* eslint-disable no-unused-vars */
  constructor(
    public readonly ncrId: string,
    public readonly investigationResults: string,
    public readonly tenantId: string,
  ) {
    this.occurredAt = new Date();
  }
  /* eslint-enable no-unused-vars */

  public getEventType(): string {
    return 'NCRInvestigationCompleted';
  }

  public getAggregateId(): string {
    return this.ncrId;
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public getOccurredAt(): Date {
    return this.occurredAt;
  }
}

export class CorrectiveActionImplementedEvent implements DomainEvent {
  public readonly occurredAt: Date;

  /* eslint-disable no-unused-vars */
  constructor(
    public readonly ncrId: string,
    public readonly actionId: string,
    public readonly description: string,
    public readonly implementedBy: string,
    public readonly tenantId: string,
  ) {
    this.occurredAt = new Date();
  }
  /* eslint-enable no-unused-vars */

  public getEventType(): string {
    return 'CorrectiveActionImplemented';
  }

  public getAggregateId(): string {
    return this.ncrId;
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public getOccurredAt(): Date {
    return this.occurredAt;
  }
}

export class NCRClosedEvent implements DomainEvent {
  public readonly occurredAt: Date;

  /* eslint-disable no-unused-vars */
  constructor(
    public readonly ncrId: string,
    public readonly closureReason: string,
    public readonly tenantId: string,
  ) {
    this.occurredAt = new Date();
  }
  /* eslint-enable no-unused-vars */

  public getEventType(): string {
    return 'NCRClosed';
  }

  public getAggregateId(): string {
    return this.ncrId;
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public getOccurredAt(): Date {
    return this.occurredAt;
  }
}

export class NCRCancelledEvent implements DomainEvent {
  public readonly occurredAt: Date;

  /* eslint-disable no-unused-vars */
  constructor(
    public readonly ncrId: string,
    public readonly reason: string,
    public readonly tenantId: string,
  ) {
    this.occurredAt = new Date();
  }
  /* eslint-enable no-unused-vars */

  public getEventType(): string {
    return 'NCRCancelled';
  }

  public getAggregateId(): string {
    return this.ncrId;
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public getOccurredAt(): Date {
    return this.occurredAt;
  }
}
