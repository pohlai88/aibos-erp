/**
 * Safe Object Handling in TypeScript - Accounting Domain Examples
 *
 * This file demonstrates how to apply TypeScript safety principles
 * to prevent object injection and ensure type safety in accounting operations.
 */

import { Money } from './Money';

// Constants for error messages
const MONEY_DESERIALIZATION_ERROR = 'Failed to deserialize Money:';
const UNKNOWN_ERROR = 'Unknown error';

// ============================================================================
// 1. ✅ Use Interfaces or Types for Clear Contracts
// ============================================================================

/**
 * Clear contract for journal entry creation
 * Prevents unexpected properties from sneaking in
 */
export interface JournalEntryInput {
  readonly accountCode: string;
  readonly description: string;
  readonly debitAmount: number;
  readonly creditAmount: number;
  readonly reference?: string;
}

/**
 * Safe response type for API operations
 */
export interface AccountingOperationResult {
  readonly success: boolean;
  readonly data?: unknown;
  readonly error?: string;
  readonly timestamp: Date;
}

// ============================================================================
// 2. 🔍 Use Type Guards for Runtime Validation
// ============================================================================

/**
 * Type guard to validate journal entry input at runtime
 * Essential for validating external data (API requests, user input)
 */
export function isValidJournalEntryInput(object: unknown): object is JournalEntryInput {
  if (typeof object !== 'object' || object === null) return false;

  const input = object as Record<string, unknown>;

  return (
    typeof input.accountCode === 'string' &&
    input.accountCode.trim().length > 0 &&
    typeof input.description === 'string' &&
    input.description.trim().length > 0 &&
    typeof input.debitAmount === 'number' &&
    input.debitAmount >= 0 &&
    typeof input.creditAmount === 'number' &&
    input.creditAmount >= 0 &&
    (input.reference === undefined || typeof input.reference === 'string')
  );
}

/**
 * Type guard for Money object validation
 */
export function isValidMoneyObject(object: unknown): object is { cents: string } {
  if (typeof object !== 'object' || object === null) return false;

  const money = object as Record<string, unknown>;
  return typeof money.cents === 'string' && /^\d+$/.test(money.cents);
}

// ============================================================================
// 3. 🚫 Avoid eval and Dynamic Instantiation
// ============================================================================

/**
 * ❌ NEVER DO THIS - Dangerous dynamic instantiation
 */
// const createObjectFromString = (className: string, data: unknown) => {
//   return eval(`new ${className}(data)`); // CODE INJECTION RISK!
// };

/**
 * ✅ SAFE - Use factory pattern with explicit type checking
 */
export class SafeJournalEntryFactory {
  static create(input: JournalEntryInput): { accountCode: string; amount: Money } {
    // Validate input using type guard
    if (!isValidJournalEntryInput(input)) {
      throw new Error('Invalid journal entry input');
    }

    // Create safe Money objects
    const debitAmount = Money.fromNumber(input.debitAmount);
    const creditAmount = Money.fromNumber(input.creditAmount);

    return {
      accountCode: input.accountCode,
      amount: debitAmount.add(creditAmount),
    };
  }
}

// ============================================================================
// 4. 🔐 Use Record<string, unknown> for Loose Objects
// ============================================================================

/**
 * Safe handler for flexible API input
 * Uses Record<string, unknown> and validates manually
 */
export function handleFlexibleAccountingInput(
  input: Record<string, unknown>,
): AccountingOperationResult {
  const timestamp = new Date();

  // Safe property access with validation
  if (typeof input['operation'] === 'string') {
    const operation = input['operation'];

    switch (operation) {
      case 'create_journal_entry':
        if (isValidJournalEntryInput(input['data'])) {
          return {
            success: true,
            data: SafeJournalEntryFactory.create(input['data']),
            timestamp,
          };
        }
        break;

      case 'calculate_tax':
        if (typeof input['amount'] === 'number' && typeof input['rate'] === 'number') {
          const amount = Money.fromNumber(input['amount']);
          const tax = amount.multiply(input['rate']);
          return {
            success: true,
            data: { tax: tax.toJSON() },
            timestamp,
          };
        }
        break;
    }
  }

  return {
    success: false,
    error: 'Invalid operation or data',
    timestamp,
  };
}

// ============================================================================
// 5. 🧠 Schema-based Validation with Zod (Already Installed!)
// ============================================================================

import { z } from 'zod';

/**
 * Zod schema for journal entry validation
 * Provides runtime type safety and detailed error messages
 */
export const JournalEntrySchema = z.object({
  accountCode: z.string().min(1, 'Account code is required'),
  description: z.string().min(1, 'Description is required'),
  debitAmount: z.number().min(0, 'Debit amount must be non-negative'),
  creditAmount: z.number().min(0, 'Credit amount must be non-negative'),
  reference: z.string().optional(),
});

/**
 * Zod schema for Money object validation
 */
export const MoneySchema = z.object({
  cents: z.string().regex(/^\d+$/, 'Cents must be a non-negative integer string'),
});

/**
 * Zod schema for accounting operation requests
 */
export const AccountingOperationSchema = z.object({
  operation: z.enum(['create_journal_entry', 'calculate_tax', 'create_transaction']),
  data: z.unknown().optional(),
  amount: z.number().optional(),
  rate: z.number().optional(),
});

/**
 * Validate journal entry input using Zod
 * Returns detailed validation results with error messages
 */
export function validateJournalEntryWithZod(input: unknown): {
  success: boolean;
  data?: JournalEntryInput;
  errors?: z.ZodError['errors'];
} {
  const result = JournalEntrySchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error.errors };
  }
}

/**
 * Validate Money object using Zod
 */
export function validateMoneyWithZod(input: unknown): {
  success: boolean;
  data?: { cents: string };
  errors?: z.ZodError['errors'];
} {
  const result = MoneySchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error.errors };
  }
}

/**
 * Enhanced safe deserialization with Zod validation
 */
export function safeDeserializeMoneyWithZod(json: string): Money {
  try {
    const parsed = JSON.parse(json);
    const validation = validateMoneyWithZod(parsed);

    if (!validation.success) {
      throw new Error(
        `Invalid Money object: ${validation.errors?.map((error) => error.message).join(', ')}`,
      );
    }

    return Money.fromCents(BigInt(validation.data!.cents));
  } catch (error) {
    throw new Error(
      `${MONEY_DESERIALIZATION_ERROR} ${error instanceof Error ? error.message : UNKNOWN_ERROR}`,
    );
  }
}

// ============================================================================
// 6. 🛡️ Safe Object Deserialization
// ============================================================================

/**
 * Safe deserialization of Money objects from JSON
 * Prevents prototype pollution and ensures data integrity
 */
export function safeDeserializeMoney(json: string): Money {
  try {
    const parsed = JSON.parse(json);

    if (!isValidMoneyObject(parsed)) {
      throw new Error('Invalid Money object structure');
    }

    return Money.fromCents(BigInt(parsed.cents));
  } catch (error) {
    throw new Error(
      `${MONEY_DESERIALIZATION_ERROR} ${error instanceof Error ? error.message : UNKNOWN_ERROR}`,
    );
  }
}

/**
 * Safe deserialization with fallback
 */
export function safeDeserializeMoneyWithFallback(
  json: string,
  fallback: Money = Money.ZERO,
): Money {
  try {
    return safeDeserializeMoney(json);
  } catch {
    return fallback;
  }
}

// ============================================================================
// 7. 🔒 Immutable Object Patterns
// ============================================================================

/**
 * Immutable accounting transaction record
 * Uses readonly properties and Object.freeze for runtime immutability
 */
export interface ImmutableTransaction {
  readonly id: string;
  readonly amount: Money;
  readonly timestamp: Date;
  readonly description: string;
}

/**
 * Mutable version for builder pattern
 */
interface MutableTransaction {
  id?: string;
  amount?: Money;
  timestamp?: Date;
  description?: string;
}

export class SafeTransactionBuilder {
  private data: MutableTransaction = {};

  setId(id: string): this {
    if (typeof id !== 'string' || id.trim().length === 0) {
      throw new Error('Transaction ID must be a non-empty string');
    }
    this.data.id = id;
    return this;
  }

  setAmount(amount: Money): this {
    this.data.amount = amount;
    return this;
  }

  setDescription(description: string): this {
    if (typeof description !== 'string' || description.trim().length === 0) {
      throw new Error('Description must be a non-empty string');
    }
    this.data.description = description;
    return this;
  }

  build(): ImmutableTransaction {
    if (!this.data.id || !this.data.amount || !this.data.description) {
      throw new Error('Missing required transaction fields');
    }

    const transaction: ImmutableTransaction = {
      id: this.data.id,
      amount: this.data.amount,
      timestamp: this.data.timestamp || new Date(),
      description: this.data.description,
    };

    // Freeze the object to prevent runtime modification
    return Object.freeze(transaction);
  }
}

// ============================================================================
// 8. 🎯 Usage Examples
// ============================================================================

/**
 * Example of safe API endpoint handler
 */
export function handleAccountingAPI(request: Record<string, unknown>): AccountingOperationResult {
  // 1. Validate input structure
  if (typeof request !== 'object' || request === null) {
    return {
      success: false,
      error: 'Invalid request format',
      timestamp: new Date(),
    };
  }

  // 2. Use type guards for validation
  if (request.operation === 'create_journal_entry' && isValidJournalEntryInput(request.data)) {
    try {
      const result = SafeJournalEntryFactory.create(request.data);
      return {
        success: true,
        data: result,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : UNKNOWN_ERROR,
        timestamp: new Date(),
      };
    }
  }

  return {
    success: false,
    error: 'Unsupported operation or invalid data',
    timestamp: new Date(),
  };
}
