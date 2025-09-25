/* eslint-disable no-unused-vars */
import { AggregateRoot, DomainEvent as EventSourcingDomainEvent } from '@aibos/eventsourcing';

export interface ReconciliationData {
  readonly reconciliationId: string;
  readonly sku: string;
  readonly location: string;
  readonly systemQuantity: number;
  readonly physicalQuantity: number;
  readonly variance: number;
  readonly variancePercentage: number;
  readonly reconciliationDate: Date;
  readonly reconciledBy: string;
  readonly status: ReconciliationStatus;
  readonly notes?: string;
  readonly tenantId: string;
}

export enum ReconciliationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum ReconciliationType {
  CYCLE_COUNT = 'CYCLE_COUNT',
  FULL_INVENTORY = 'FULL_INVENTORY',
  SPOT_CHECK = 'SPOT_CHECK',
  SYSTEM_RECONCILIATION = 'SYSTEM_RECONCILIATION',
}

export class Reconciliation extends AggregateRoot {
  constructor(
    public readonly _reconciliationId: string,
    public readonly _sku: string,
    public readonly _location: string,
    public readonly _systemQuantity: number,
    public readonly _physicalQuantity: number,
    public readonly _reconciliationType: ReconciliationType,
    public readonly _reconciledBy: string,
    public readonly _tenantId: string,
    public _status: ReconciliationStatus = ReconciliationStatus.PENDING,
    public readonly _notes?: string,
  ) {
    super(_reconciliationId, 0);
  }

  protected apply(_event: EventSourcingDomainEvent): void {
    // Apply events to aggregate state
    // This would be implemented based on specific event types
  }

  public getVariance(): number {
    return this._physicalQuantity - this._systemQuantity;
  }

  public getVariancePercentage(): number {
    if (this._systemQuantity === 0) return 0;
    return (this.getVariance() / this._systemQuantity) * 100;
  }

  public startReconciliation(): void {
    if (this._status !== ReconciliationStatus.PENDING) {
      throw new Error('Reconciliation can only be started from PENDING status');
    }
    this._status = ReconciliationStatus.IN_PROGRESS;

    this.addEvent(
      new ReconciliationStartedEvent(
        this._reconciliationId,
        this._sku,
        this._location,
        this._tenantId,
      ),
    );
  }

  public completeReconciliation(notes?: string): void {
    if (this._status !== ReconciliationStatus.IN_PROGRESS) {
      throw new Error('Reconciliation must be in progress to complete');
    }
    this._status = ReconciliationStatus.COMPLETED;

    this.addEvent(
      new ReconciliationCompletedEvent(
        this._reconciliationId,
        this._sku,
        this._location,
        this.getVariance(),
        this.getVariancePercentage(),
        this._tenantId,
        notes,
      ),
    );
  }

  public approveReconciliation(approvedBy: string): void {
    if (this._status !== ReconciliationStatus.COMPLETED) {
      throw new Error('Reconciliation must be completed before approval');
    }
    this._status = ReconciliationStatus.APPROVED;

    this.addEvent(
      new ReconciliationApprovedEvent(
        this._reconciliationId,
        this._sku,
        this._location,
        approvedBy,
        this._tenantId,
      ),
    );
  }

  public rejectReconciliation(reason: string): void {
    if (this._status !== ReconciliationStatus.COMPLETED) {
      throw new Error('Reconciliation must be completed before rejection');
    }
    this._status = ReconciliationStatus.REJECTED;

    this.addEvent(
      new ReconciliationRejectedEvent(
        this._reconciliationId,
        this._sku,
        this._location,
        reason,
        this._tenantId,
      ),
    );
  }
}

// Domain Events
export class ReconciliationStartedEvent extends EventSourcingDomainEvent {
  constructor(
    public readonly reconciliationId: string,
    public readonly sku: string,
    public readonly location: string,
    public override readonly tenantId: string,
  ) {
    super(`reconciliation-${reconciliationId}`, 0, tenantId);
  }

  get eventType(): string {
    return 'ReconciliationStarted';
  }

  serialize(): Record<string, unknown> {
    return {
      reconciliationId: this.reconciliationId,
      sku: this.sku,
      location: this.location,
    };
  }
}

export class ReconciliationCompletedEvent extends EventSourcingDomainEvent {
  constructor(
    public readonly reconciliationId: string,
    public readonly sku: string,
    public readonly location: string,
    public readonly variance: number,
    public readonly variancePercentage: number,
    public override readonly tenantId: string,
    public readonly notes?: string,
  ) {
    super(`reconciliation-${reconciliationId}`, 0, tenantId);
  }

  get eventType(): string {
    return 'ReconciliationCompleted';
  }

  serialize(): Record<string, unknown> {
    return {
      reconciliationId: this.reconciliationId,
      sku: this.sku,
      location: this.location,
      variance: this.variance,
      variancePercentage: this.variancePercentage,
      notes: this.notes,
    };
  }
}

export class ReconciliationApprovedEvent extends EventSourcingDomainEvent {
  constructor(
    public readonly reconciliationId: string,
    public readonly sku: string,
    public readonly location: string,
    public readonly approvedBy: string,
    public override readonly tenantId: string,
  ) {
    super(`reconciliation-${reconciliationId}`, 0, tenantId);
  }

  get eventType(): string {
    return 'ReconciliationApproved';
  }

  serialize(): Record<string, unknown> {
    return {
      reconciliationId: this.reconciliationId,
      sku: this.sku,
      location: this.location,
      approvedBy: this.approvedBy,
    };
  }
}

export class ReconciliationRejectedEvent extends EventSourcingDomainEvent {
  constructor(
    public readonly reconciliationId: string,
    public readonly sku: string,
    public readonly location: string,
    public readonly reason: string,
    public override readonly tenantId: string,
  ) {
    super(`reconciliation-${reconciliationId}`, 0, tenantId);
  }

  get eventType(): string {
    return 'ReconciliationRejected';
  }

  serialize(): Record<string, unknown> {
    return {
      reconciliationId: this.reconciliationId,
      sku: this.sku,
      location: this.location,
      reason: this.reason,
    };
  }
}
