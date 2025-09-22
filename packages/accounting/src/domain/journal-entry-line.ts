export interface JournalEntryLineProperties {
  readonly accountCode: string;
  readonly description: string;
  readonly debitAmount: number;
  readonly creditAmount: number;
  readonly reference?: string;
}

export class JournalEntryLine {
  public readonly accountCode: string;
  public readonly description: string;
  public readonly debitAmount: number;
  public readonly creditAmount: number;
  public readonly reference?: string;

  constructor(properties: JournalEntryLineProperties) {
    this.accountCode = properties.accountCode;
    this.description = properties.description;
    this.debitAmount = properties.debitAmount;
    this.creditAmount = properties.creditAmount;
    this.reference = properties.reference;

    this.validate();
  }

  private validate(): void {
    if (!this.accountCode || this.accountCode.trim().length === 0) {
      throw new Error('Account code is required');
    }

    if (!this.description || this.description.trim().length === 0) {
      throw new Error('Description is required');
    }

    if (this.debitAmount < 0) {
      throw new Error('Debit amount cannot be negative');
    }

    if (this.creditAmount < 0) {
      throw new Error('Credit amount cannot be negative');
    }

    if (this.debitAmount > 0 && this.creditAmount > 0) {
      throw new Error('Cannot have both debit and credit amounts');
    }

    if (this.debitAmount === 0 && this.creditAmount === 0) {
      throw new Error('Must have either debit or credit amount');
    }

    // Validate precision (2 decimal places)
    const debitPrecision = (this.debitAmount.toString().split('.')[1] || '').length;
    const creditPrecision = (this.creditAmount.toString().split('.')[1] || '').length;

    if (debitPrecision > 2) {
      throw new Error('Debit amount cannot have more than 2 decimal places');
    }

    if (creditPrecision > 2) {
      throw new Error('Credit amount cannot have more than 2 decimal places');
    }
  }

  public getNetAmount(): number {
    return this.debitAmount - this.creditAmount;
  }

  public isDebit(): boolean {
    return this.debitAmount > 0;
  }

  public isCredit(): boolean {
    return this.creditAmount > 0;
  }

  public getAmount(): number {
    return this.isDebit() ? this.debitAmount : this.creditAmount;
  }
}
