import { AccountType, SpecialAccountType } from '../domain/account.domain';

export interface CreateAccountCommandProperties {
  readonly accountCode: string;
  readonly accountName: string;
  readonly accountType: AccountType;
  readonly parentAccountCode?: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly specialAccountType?: SpecialAccountType;
  readonly postingAllowed?: boolean;
  readonly companionLinks?: {
    accumulatedDepreciationCode?: string;
    depreciationExpenseCode?: string;
    allowanceAccountCode?: string;
  };
}

export class CreateAccountCommand {
  public readonly accountCode: string;
  public readonly accountName: string;
  public readonly accountType: AccountType;
  public readonly parentAccountCode?: string;
  public readonly tenantId: string;
  public readonly userId: string;
  public readonly specialAccountType: SpecialAccountType;
  public readonly postingAllowed: boolean;
  public readonly companionLinks?: {
    accumulatedDepreciationCode?: string;
    depreciationExpenseCode?: string;
    allowanceAccountCode?: string;
  };

  constructor(properties: CreateAccountCommandProperties) {
    // Normalize once; validate against trimmed values
    this.accountCode = properties.accountCode?.trim();
    this.accountName = properties.accountName?.trim();
    this.accountType = properties.accountType;
    this.parentAccountCode = properties.parentAccountCode?.trim();
    this.tenantId = properties.tenantId?.trim();
    this.userId = properties.userId?.trim();
    this.specialAccountType = properties.specialAccountType ?? SpecialAccountType.NONE;
    this.postingAllowed = properties.postingAllowed ?? true;
    this.companionLinks = properties.companionLinks;
    // Enforce invariants on construction
    this.validate();
    // Prevent post-construct mutation
    Object.freeze(this);
  }

  public validate(): void {
    if (!isNonEmpty(this.accountCode)) {
      throw new Error('Account code is required');
    }

    if (!isNonEmpty(this.accountName)) {
      throw new Error('Account name is required');
    }

    if (!isValidAccountType(this.accountType)) {
      throw new Error('Invalid account type');
    }

    if (!isNonEmpty(this.tenantId)) {
      throw new Error('Tenant ID is required');
    }

    if (!isNonEmpty(this.userId)) {
      throw new Error('User ID is required');
    }

    // Validate account code format (alphanumeric, 4-10 characters)
    if (!/^[A-Z0-9]{4,10}$/.test(this.accountCode)) {
      throw new Error('Account code must be 4-10 alphanumeric characters');
    }

    // Defensive: parent cannot equal self (avoid trivial cycles)
    if (this.parentAccountCode && this.parentAccountCode === this.accountCode) {
      throw new Error('Parent account code cannot be the same as account code');
    }

    // Basic sanity for companions (if partially provided)
    const links = this.companionLinks;
    if (links) {
      const hasAccumulatorDep = !!links.accumulatedDepreciationCode;
      const hasDepExp = !!links.depreciationExpenseCode;
      if (hasAccumulatorDep !== hasDepExp) {
        throw new Error(
          'Both accumulatedDepreciationCode and depreciationExpenseCode must be provided together',
        );
      }
    }
  }
}

// ---- Local helpers (kept minimal to avoid drift) ----
function isNonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isValidAccountType(value: unknown): value is AccountType {
  // Works for both string and numeric enums
  return (
    Object.prototype.hasOwnProperty.call(AccountType, value as PropertyKey) ||
    Object.values(AccountType as unknown as Record<string, unknown>).includes(value as never)
  );
}
