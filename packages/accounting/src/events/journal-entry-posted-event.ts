import type { DomainEvent } from '@aibos/eventsourcing';

import { JournalEntryLine } from '../domain/journal-entry-line';
import { randomUUID } from 'node:crypto';

export class JournalEntryPostedEvent implements DomainEvent {
  public static readonly TYPE = 'JournalEntryPosted' as const;
  /** Event schema version for future migrations */
  public static readonly EVENT_SCHEMA_VERSION = 1;
  public readonly eventType = JournalEntryPostedEvent.TYPE;

  public readonly id: string;
  public readonly aggregateId: string;
  public readonly version: number;
  public readonly occurredAt: Date;
  public readonly tenantId: string;
  public readonly correlationId?: string;
  public readonly causationId?: string;

  public readonly journalEntryId: string;
  public readonly entries: ReadonlyArray<JournalEntryLine>;
  public readonly reference: string;
  public readonly description: string;
  public readonly postedBy: string;

  /** Event payload schema version (for safe evolution) */
  public readonly schemaVersion: number = JournalEntryPostedEvent.EVENT_SCHEMA_VERSION;
  /** GL posting date (may differ from occurredAt/event time) */
  public readonly postingDate?: Date;
  /** Ledger/book identifier (e.g., PRIMARY, TAX, STAT) */
  public readonly book?: string;
  // NOTE: Removed unused `eventId` to prevent confusion; `id` is the event id.

  /** Optional creation options for forward-compat and idempotency */
  public static CreateOpts = {} as {
    /** Override auto-generated id (e.g., supply ULID for idempotency) */
    id?: string;
    /** Payload schema version; defaults to 1 */
    schemaVersion?: number;
    /** GL posting date */
    postingDate?: Date;
    /** Ledger/book code */
    book?: string;
  };

  // Cached totals to avoid recomputation
  private readonly _totalDebitCents: bigint;
  private readonly _totalCreditCents: bigint;

  constructor(
    journalEntryId: string,
    entries: JournalEntryLine[],
    reference: string,
    description: string,
    postedBy: string,
    tenantId: string,
    version: number,
    correlationId?: string,
    causationId?: string,
    options?: {
      id?: string;
      schemaVersion?: number;
      postingDate?: Date;
      book?: string;
    },
  ) {
    this.id = options?.id ?? randomUUID();
    this.aggregateId = `journal-entry-${journalEntryId}`;
    this.version = version;
    this.occurredAt = new Date();
    this.tenantId = tenantId;
    this.correlationId = correlationId;
    this.causationId = causationId;
    if (options?.schemaVersion !== undefined) this.schemaVersion = options.schemaVersion;
    if (options?.postingDate) this.postingDate = new Date(options.postingDate);
    if (options?.book) this.book = options.book;

    this.journalEntryId = journalEntryId;
    this.entries = entries;
    // Normalize strings to keep store clean
    this.reference = reference.trim();
    this.description = description.trim();
    this.postedBy = postedBy.trim();

    // Convention guard (constructor path is always consistent, but keep it explicit)
    assertJournalAggregateId(this.aggregateId, this.journalEntryId);

    // Cache totals on construction
    this._totalDebitCents = this.entries.reduce(
      (accumulator, entry) => accumulator + toCents(entry.debitAmount),
      0n,
    );
    this._totalCreditCents = this.entries.reduce(
      (accumulator, entry) => accumulator + toCents(entry.creditAmount),
      0n,
    );

    this.validate();
    // Freeze shallow + entries array (assumes JournalEntryLine is already immutable)
    Object.freeze(this.entries);
    Object.freeze(this);
  }

  public serialize(): Record<string, unknown> {
    return {
      id: this.id,
      aggregateId: this.aggregateId,
      version: this.version,
      occurredAt: this.occurredAt.toISOString(),
      tenantId: this.tenantId,
      eventType: this.eventType,
      schemaVersion: this.schemaVersion,
      ...(this.correlationId ? { correlationId: this.correlationId } : {}),
      ...(this.causationId ? { causationId: this.causationId } : {}),
      journalEntryId: this.journalEntryId,
      entries: this.entries.map((entry) => ({
        accountCode: entry.accountCode,
        description: entry.description,
        debitAmount: entry.debitAmount, // legacy major units
        creditAmount: entry.creditAmount, // legacy major units
        // precision-safe cents for new readers
        debitCents: toCents(entry.debitAmount).toString(),
        creditCents: toCents(entry.creditAmount).toString(),
        ...(entry.reference ? { reference: entry.reference } : {}),
      })),
      reference: this.reference,
      description: this.description,
      postedBy: this.postedBy,
      // Totals in both representations for quick auditing
      totalDebit: this.totalDebit(), // number
      totalCredit: this.totalCredit(), // number
      totalDebitCents: this.totalDebitCents().toString(),
      totalCreditCents: this.totalCreditCents().toString(),
      ...(this.postingDate ? { postingDate: this.postingDate.toISOString().slice(0, 10) } : {}),
      ...(this.book ? { book: this.book } : {}),
    };
  }

  public static deserialize(data: Record<string, unknown>): JournalEntryPostedEvent {
    // Validate event type first
    if (data.eventType !== JournalEntryPostedEvent.TYPE) {
      throw new TypeError(
        `Expected eventType "${JournalEntryPostedEvent.TYPE}", got "${data.eventType}"`,
      );
    }

    // schemaVersion: default 1; require integer >= 1 if provided (forward-lenient)
    const rawSchema = (data as Record<string, unknown>).schemaVersion;
    const schemaVersion =
      rawSchema === undefined
        ? 1
        : Number.isInteger(rawSchema as number) && (rawSchema as number) >= 1
          ? (rawSchema as number)
          : (() => {
              throw new TypeError('schemaVersion must be a positive integer');
            })();

    const id = expectString(data.id, 'id');
    const aggregateId = expectString(data.aggregateId, 'aggregateId');
    const version = expectNumber(data.version, 'version');
    const occurredAtIso = expectString(data.occurredAt, 'occurredAt');
    const occurredAt = new Date(occurredAtIso);
    if (Number.isNaN(occurredAt.getTime()))
      throw new TypeError(`occurredAt invalid ISO: ${occurredAtIso}`);
    const tenantId = expectString(data.tenantId, 'tenantId');
    const eventSchemaVersion = schemaVersion;
    const postingDateString = optionalString((data as Record<string, unknown>).postingDate);
    const postingDate = postingDateString ? new Date(postingDateString) : undefined;
    if (postingDate && Number.isNaN(postingDate.getTime()))
      throw new TypeError(`postingDate invalid: ${postingDateString}`);
    const book = optionalString((data as Record<string, unknown>).book);

    const journalEntryId = expectString(data.journalEntryId, 'journalEntryId');
    const reference = expectString(data.reference, 'reference');
    const description = expectString(data.description, 'description');
    const postedBy = expectString(data.postedBy, 'postedBy');
    const correlationId = optionalString(data.correlationId);
    const causationId = optionalString(data.causationId);

    const rawEntries = Array.isArray(data.entries) ? (data.entries as unknown[]) : [];
    if (rawEntries.length === 0) throw new TypeError('entries must be a non-empty array');
    const entries = rawEntries.map((row) => {
      const r = row as Record<string, unknown>;
      // Prefer cents if provided (precision-safe); else fall back to numbers.
      const debitCentsString = optionalString(r.debitCents);
      const creditCentsString = optionalString(r.creditCents);
      const debitAmount =
        debitCentsString !== undefined
          ? centsToNumber(BigInt(debitCentsString))
          : expectNumber(r.debitAmount ?? 0, 'entries[].debitAmount');
      const creditAmount =
        creditCentsString !== undefined
          ? centsToNumber(BigInt(creditCentsString))
          : expectNumber(r.creditAmount ?? 0, 'entries[].creditAmount');
      return new JournalEntryLine({
        accountCode: expectString(r.accountCode, 'entries[].accountCode'),
        description: expectString(r.description, 'entries[].description'),
        debitAmount,
        creditAmount,
        reference: optionalString(r.reference),
      });
    });

    // Hydrate without constructor so we preserve id/aggregateId/occurredAt exactly
    const event = Object.create(JournalEntryPostedEvent.prototype) as JournalEntryPostedEvent;

    // Cache totals for deserialized events
    const totalDebitCents = entries.reduce(
      (accumulator, entry) => accumulator + toCents(entry.debitAmount),
      0n,
    );
    const totalCreditCents = entries.reduce(
      (accumulator, entry) => accumulator + toCents(entry.creditAmount),
      0n,
    );

    Object.assign(event, {
      id,
      aggregateId,
      version,
      occurredAt,
      tenantId,
      correlationId,
      causationId,
      eventType: JournalEntryPostedEvent.TYPE,
      schemaVersion: eventSchemaVersion,
      postingDate,
      book,
      journalEntryId,
      entries,
      reference,
      description,
      postedBy,
      _totalDebitCents: totalDebitCents,
      _totalCreditCents: totalCreditCents,
    });
    // Convention guard before validate()
    assertJournalAggregateId(event.aggregateId, event.journalEntryId);
    event.validate();
    // Freeze shallow + entries array (assumes JournalEntryLine is already immutable)
    Object.freeze(event.entries);
    Object.freeze(event);
    return event;
  }

  /** Sum helpers (major units) */
  public totalDebit(): number {
    return centsToNumber(this.totalDebitCents());
  }
  public totalCredit(): number {
    return centsToNumber(this.totalCreditCents());
  }
  /** Precision-safe sums in cents (bigint) - uses cached values */
  public totalDebitCents(): bigint {
    return this._totalDebitCents;
  }
  public totalCreditCents(): bigint {
    return this._totalCreditCents;
  }

  private validate(): void {
    const nonEmpty = (v: string, label: string) => {
      if (typeof v !== 'string' || v.trim().length === 0)
        throw new TypeError(`${label} must be a non-empty string`);
    };
    nonEmpty(this.tenantId, 'tenantId');
    nonEmpty(this.journalEntryId, 'journalEntryId');
    nonEmpty(this.reference, 'reference');
    nonEmpty(this.description, 'description');
    nonEmpty(this.postedBy, 'postedBy');
    if (!Array.isArray(this.entries) || this.entries.length === 0) {
      throw new TypeError('entries must be a non-empty array');
    }

    // Balanced check: exact equality in cents
    const deb = this.totalDebitCents();
    const cre = this.totalCreditCents();
    if (deb !== cre) {
      throw new TypeError(
        `journal entry not balanced: totalDebitCents=${deb} totalCreditCents=${cre}`,
      );
    }

    // Non-zero journal total
    if (deb === 0n) {
      throw new TypeError('journal entry total must be > 0');
    }

    // Per-line constraint: at most one side positive
    for (const [index, entry] of this.entries.entries()) {
      const debitCents = toCents(entry.debitAmount);
      const creditCents = toCents(entry.creditAmount);
      if (debitCents > 0n && creditCents > 0n) {
        throw new TypeError(`entries[${index}] cannot have both debit and credit > 0`);
      }
    }

    // AggregateId convention check (strict equality)
    assertJournalAggregateId(this.aggregateId, this.journalEntryId);
    // Version rules
    if (!Number.isInteger(this.version) || this.version < 1) {
      throw new TypeError(`version must be a positive integer, got: ${this.version}`);
    }
    // schemaVersion rules
    if (!Number.isInteger(this.schemaVersion) || this.schemaVersion < 1) {
      throw new TypeError(`schemaVersion must be a positive integer, got: ${this.schemaVersion}`);
    }
    // postingDate sanity (if present): ISO date (YYYY-MM-DD) semantics are caller's job;
    // here we only validate Date-ness; advanced rules can be added (period locks, etc.)
    if (this.postingDate && Number.isNaN(this.postingDate.getTime())) {
      throw new TypeError('postingDate must be a valid Date when provided');
    }
    if (this.book !== undefined) {
      if (typeof this.book !== 'string' || this.book.trim().length === 0) {
        throw new TypeError('book must be a non-empty string when provided');
      }
    }
    // occurredAt sanity
    if (!(this.occurredAt instanceof Date) || Number.isNaN(this.occurredAt.getTime())) {
      throw new TypeError('occurredAt must be a valid Date');
    }
  }
}

// -------- helpers ----------
function assertJournalAggregateId(aggregateId: string, journalEntryId: string): void {
  const expected = `journal-entry-${journalEntryId}`;
  if (aggregateId !== expected) {
    throw new TypeError(
      `aggregateId "${aggregateId}" must equal "${expected}" (journalEntryId bound)`,
    );
  }
}

function expectString(v: unknown, label: string): string {
  if (typeof v !== 'string' || v.trim().length === 0)
    throw new TypeError(`${label} must be a non-empty string`);
  return v.trim();
}
function expectNumber(v: unknown, label: string): number {
  if (typeof v !== 'number' || !Number.isFinite(v))
    throw new TypeError(`${label} must be a finite number`);
  return v;
}
function optionalString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : undefined;
}
function toCents(amount: number): bigint {
  // enforce <= 2dp by construction; JournalEntryLine already validates.
  return BigInt(Math.round(amount * 100));
}
function centsToNumber(cents: bigint): number {
  return Number(cents) / 100;
}
