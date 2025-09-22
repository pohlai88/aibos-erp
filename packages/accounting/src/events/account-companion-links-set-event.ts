import { type DomainEvent } from '@aibos/eventsourcing';
import { randomUUID } from 'node:crypto';

/**
 * Companion link semantics:
 * - undefined = leave as-is (no change)
 * - null      = clear link
 * - string    = set link (must be non-empty when trimmed)
 */
export type NullableCode = string | null | undefined;

export interface AccountCompanionLinksSetPayload {
  accountCode: string;
  accumulatedDepreciationCode?: NullableCode;
  depreciationExpenseCode?: NullableCode;
  allowanceAccountCode?: NullableCode;
}

export class AccountCompanionLinksSetEvent implements DomainEvent {
  /** Single source of truth for event name */
  public static readonly TYPE = 'AccountCompanionLinksSet' as const;
  /** Event version for schema evolution */
  public static readonly EVENT_VERSION = 1;
  public readonly eventType = AccountCompanionLinksSetEvent.TYPE;

  public readonly id: string;
  public readonly aggregateId: string;
  public readonly version: number;
  public readonly occurredAt: Date;
  public readonly tenantId: string;
  public readonly correlationId?: string;
  public readonly causationId?: string;

  public readonly accountCode: string;
  public readonly accumulatedDepreciationCode?: NullableCode;
  public readonly depreciationExpenseCode?: NullableCode;
  public readonly allowanceAccountCode?: NullableCode;

  constructor(
    accountCode: string,
    aggregateId: string,
    version: number,
    tenantId: string,
    accumulatedDepreciationCode?: NullableCode,
    depreciationExpenseCode?: NullableCode,
    allowanceAccountCode?: NullableCode,
    correlationId?: string,
    causationId?: string,
    id?: string,
  ) {
    this.id = id ?? randomUUID();
    this.aggregateId = aggregateId;
    this.version = version;
    this.occurredAt = new Date();
    this.tenantId = tenantId;
    this.correlationId = correlationId;
    this.causationId = causationId;
    this.accountCode = accountCode;
    this.accumulatedDepreciationCode = accumulatedDepreciationCode;
    this.depreciationExpenseCode = depreciationExpenseCode;
    this.allowanceAccountCode = allowanceAccountCode;
    this.validate();
    Object.freeze(this);
  }

  /** Factory from a payload + meta (handy for upcasters or handlers) */
  public static from(
    payload: AccountCompanionLinksSetPayload,
    meta: { aggregateId: string; version: number; tenantId: string },
  ): AccountCompanionLinksSetEvent {
    // Validate meta parameters
    if (
      !meta.aggregateId ||
      typeof meta.aggregateId !== 'string' ||
      meta.aggregateId.trim().length === 0
    ) {
      throw new Error(
        'AccountCompanionLinksSetEvent: aggregateId is required and must be a non-empty string',
      );
    }
    if (!meta.tenantId || typeof meta.tenantId !== 'string' || meta.tenantId.trim().length === 0) {
      throw new Error(
        'AccountCompanionLinksSetEvent: tenantId is required and must be a non-empty string',
      );
    }
    if (!Number.isInteger(meta.version) || meta.version < 1) {
      throw new Error('AccountCompanionLinksSetEvent: version must be a positive integer');
    }

    return new AccountCompanionLinksSetEvent(
      payload.accountCode,
      meta.aggregateId,
      meta.version,
      meta.tenantId,
      payload.accumulatedDepreciationCode,
      payload.depreciationExpenseCode,
      payload.allowanceAccountCode,
    );
  }

  /** Which fields are explicitly changing (i.e., provided !== undefined). */
  public changedFields(): Array<
    'accumulatedDepreciationCode' | 'depreciationExpenseCode' | 'allowanceAccountCode'
  > {
    const out: Array<
      'accumulatedDepreciationCode' | 'depreciationExpenseCode' | 'allowanceAccountCode'
    > = [];
    if (this.accumulatedDepreciationCode !== undefined) out.push('accumulatedDepreciationCode');
    if (this.depreciationExpenseCode !== undefined) out.push('depreciationExpenseCode');
    if (this.allowanceAccountCode !== undefined) out.push('allowanceAccountCode');
    return out;
  }

  /** True when nothing would change (all optional fields are undefined). */
  public isNoop(): boolean {
    return this.changedFields().length === 0;
  }

  /** Deserialize from stored data */
  public static deserialize(data: Record<string, unknown>): AccountCompanionLinksSetEvent {
    // Extract and validate meta parameters from data
    const aggregateId = expectString(data.aggregateId, 'aggregateId');
    const version = expectNumber(data.version, 'version');
    const tenantId = expectString(data.tenantId, 'tenantId');
    const id = expectString(data.id, 'id');
    const occurredAtIso = expectString(data.occurredAt, 'occurredAt');
    const occurredAt = new Date(occurredAtIso);
    if (Number.isNaN(occurredAt.getTime())) {
      throw new TypeError(`occurredAt is not a valid ISO date: ${occurredAtIso}`);
    }
    const correlationId = optionalString(data.correlationId);
    const causationId = optionalString(data.causationId);

    // Validate and extract data
    const accountCode = expectString(data.accountCode, 'accountCode');
    const accumulatedDepreciationCode = optionalNullableCode(data.accumulatedDepreciationCode);
    const depreciationExpenseCode = optionalNullableCode(data.depreciationExpenseCode);
    const allowanceAccountCode = optionalNullableCode(data.allowanceAccountCode);

    return new AccountCompanionLinksSetEvent(
      accountCode,
      aggregateId,
      version,
      tenantId,
      accumulatedDepreciationCode,
      depreciationExpenseCode,
      allowanceAccountCode,
      correlationId,
      causationId,
      id,
    );
  }

  /** Minimal, undefined-free payload for storage/transport */
  serialize(): Record<string, unknown> {
    const base: Record<string, unknown> = {
      eventType: this.eventType,
      eventVersion: AccountCompanionLinksSetEvent.EVENT_VERSION,
      accountCode: this.accountCode,
    };
    if (this.accumulatedDepreciationCode !== undefined) {
      base.accumulatedDepreciationCode = this.accumulatedDepreciationCode;
    }
    if (this.depreciationExpenseCode !== undefined) {
      base.depreciationExpenseCode = this.depreciationExpenseCode;
    }
    if (this.allowanceAccountCode !== undefined) {
      base.allowanceAccountCode = this.allowanceAccountCode;
    }
    return base;
  }

  /** Helper to check if specific field is changing */
  public isFieldChanging(
    field: 'accumulatedDepreciationCode' | 'depreciationExpenseCode' | 'allowanceAccountCode',
  ): boolean {
    return this.changedFields().includes(field);
  }

  /** Clone with modifications (useful for event sourcing) */
  public withModifications(
    modifications: Partial<AccountCompanionLinksSetPayload>,
    nextVersion?: number,
  ): AccountCompanionLinksSetEvent {
    return new AccountCompanionLinksSetEvent(
      modifications.accountCode ?? this.accountCode,
      this.aggregateId,
      nextVersion ?? this.version, // Let caller/repository decide version
      this.tenantId,
      modifications.accumulatedDepreciationCode ?? this.accumulatedDepreciationCode,
      modifications.depreciationExpenseCode ?? this.depreciationExpenseCode,
      modifications.allowanceAccountCode ?? this.allowanceAccountCode,
    );
  }

  private validate(): void {
    // Prevent no-op events from being created
    if (this.isNoop()) {
      throw new Error('AccountCompanionLinksSetEvent: Event would cause no changes');
    }

    // accountCode must be non-empty
    if (!this.accountCode || this.accountCode.trim().length === 0) {
      throw new Error('AccountCompanionLinksSetEvent: accountCode is required (non-empty).');
    }

    // Helper: ensure any provided string code is non-empty after trim
    const ensureCodeOrNull = (label: string, v: NullableCode): void => {
      if (v === undefined || v === null) return;
      if (typeof v !== 'string' || v.trim().length === 0) {
        throw new Error(
          `AccountCompanionLinksSetEvent: ${label} must be a non-empty string, null, or undefined.`,
        );
      }
    };
    ensureCodeOrNull('accumulatedDepreciationCode', this.accumulatedDepreciationCode);
    ensureCodeOrNull('depreciationExpenseCode', this.depreciationExpenseCode);
    ensureCodeOrNull('allowanceAccountCode', this.allowanceAccountCode);

    // If multiple codes are provided, they must be distinct to avoid self-links.
    const provided = [
      this.accumulatedDepreciationCode,
      this.depreciationExpenseCode,
      this.allowanceAccountCode,
    ].filter((v): v is string => typeof v === 'string');
    const distinct = new Set(provided);
    if (provided.length !== distinct.size) {
      throw new Error('AccountCompanionLinksSetEvent: provided companion codes must be distinct.');
    }

    // Optional: guard against linking a code to itself (same as primary)
    const againstPrimary = (v?: NullableCode) =>
      typeof v === 'string' && v.trim() === this.accountCode.trim();
    if (
      againstPrimary(this.accumulatedDepreciationCode) ||
      againstPrimary(this.depreciationExpenseCode) ||
      againstPrimary(this.allowanceAccountCode)
    ) {
      throw new Error(
        'AccountCompanionLinksSetEvent: companion code cannot equal the primary accountCode.',
      );
    }
  }

  /** Helper methods for deserialization */
  private static expectString(v: unknown, label: string): string {
    if (typeof v !== 'string' || v.trim().length === 0) {
      throw new Error(`AccountCompanionLinksSetEvent: ${label} must be a non-empty string`);
    }
    return v.trim();
  }
}

// Helper functions
function expectString(v: unknown, label: string): string {
  if (typeof v !== 'string' || v.trim().length === 0) {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return v.trim();
}

function expectNumber(v: unknown, label: string): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    throw new TypeError(`${label} must be a finite number`);
  }
  return v;
}

function optionalString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : undefined;
}

function optionalNullableCode(v: unknown): NullableCode {
  if (v === null || v === undefined) return v;
  if (typeof v === 'string') {
    const trimmed = v.trim();
    return trimmed.length === 0 ? null : trimmed;
  }
  throw new Error(
    'AccountCompanionLinksSetEvent: companion code must be string, null, or undefined',
  );
}
