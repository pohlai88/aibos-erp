/**
 * Money value object using minor units (cents) with bigint precision.
 * No floating point drift; suitable for accounting.
 */
export class Money {
  private readonly cents: bigint;

  private constructor(cents: bigint) {
    this.cents = cents;
    Object.freeze(this);
  }

  /** Create from a number with up to 2 decimal places. */
  static fromNumber(amount: number): Money {
    if (!Number.isFinite(amount)) {
      throw new TypeError(`Invalid amount (not finite): ${amount}`);
    }
    // Check precision before scaling to avoid floating-point rounding issues
    const decimalPlaces = (amount.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      throw new TypeError(`Amount has more than 2 decimal places: ${amount}`);
    }
    // Scale to cents and round to handle any floating-point precision issues
    const scaled = Math.round(amount * 100);
    return new Money(BigInt(scaled));
  }

  /** Create directly from cents (minor units). */
  static fromCents(cents: bigint | number): Money {
    const v = typeof cents === 'number' ? BigInt(cents) : cents;
    return new Money(v);
  }

  /** Return as number (major units). Safe for display, not storage. */
  toNumber(): number {
    return Number(this.cents) / 100;
  }

  toCents(): bigint {
    return this.cents;
  }

  isZero(): boolean {
    return this.cmp(0n) === 0;
  }

  isPositive(): boolean {
    return this.cmp(0n) > 0;
  }

  abs(): Money {
    return new Money(this.cents < 0 ? -this.cents : this.cents);
  }

  add(other: Money): Money {
    return new Money(this.cents + other.cents);
  }

  sub(other: Money): Money {
    return new Money(this.cents - other.cents);
  }

  /** Compare to a cents value (bigint). Returns -1, 0, 1. */
  private cmp(rhs: bigint): -1 | 0 | 1 {
    if (this.cents < rhs) return -1;
    if (this.cents > rhs) return 1;
    return 0;
  }
}
