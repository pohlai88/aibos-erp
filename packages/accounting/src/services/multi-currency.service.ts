import { type ExchangeRateService } from './exchange-rate.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MultiCurrencyService {
  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  private static readonly DECIMALS: Record<string, number> = {
    USD: 2,
    EUR: 2,
    GBP: 2,
    SGD: 2,
    MYR: 2,
    THB: 2,
    IDR: 0,
    VND: 0,
    PHP: 2,
    JPY: 0,
    KRW: 0,
  };

  async convertAmount(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    date?: Date,
  ): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const exchangeRate = await this.exchangeRateService.getExchangeRate(
      fromCurrency,
      toCurrency,
      date,
    );

    return this.roundCurrency(amount * exchangeRate, toCurrency);
  }

  async convertJournalEntry(
    entries: ReadonlyArray<{
      accountCode: string;
      currency: string;
      debitAmount: number;
      creditAmount: number;
    }>,
    targetCurrency: string,
    date?: Date,
  ): Promise<
    Array<{
      accountCode: string;
      originalCurrency: string;
      originalDebitAmount: number;
      originalCreditAmount: number;
      currency: string;
      debitAmount: number;
      creditAmount: number;
    }>
  > {
    const convertedEntries: Array<{
      accountCode: string;
      originalCurrency: string;
      originalDebitAmount: number;
      originalCreditAmount: number;
      currency: string;
      debitAmount: number;
      creditAmount: number;
    }> = [];

    for (const entry of entries) {
      const convertedDebit =
        (entry.debitAmount ?? 0) > 0
          ? await this.convertAmount(entry.debitAmount ?? 0, entry.currency, targetCurrency, date)
          : 0;

      const convertedCredit =
        (entry.creditAmount ?? 0) > 0
          ? await this.convertAmount(entry.creditAmount ?? 0, entry.currency, targetCurrency, date)
          : 0;

      convertedEntries.push({
        ...entry,
        originalCurrency: entry.currency,
        originalDebitAmount: entry.debitAmount,
        originalCreditAmount: entry.creditAmount,
        currency: targetCurrency,
        debitAmount: convertedDebit,
        creditAmount: convertedCredit,
      });
    }

    // Ensure rounding preserves JE balance equality in target currency
    return this.rebalanceForRounding(convertedEntries, targetCurrency);
  }

  private roundCurrency(amount: number, currency: string): number {
    // Different currencies have different decimal places
    const decimalPlaces = this.getCurrencyDecimalPlaces(currency);
    const factor = Math.pow(10, decimalPlaces);
    return Math.round((amount + Number.EPSILON) * factor) / factor;
  }

  private getCurrencyDecimalPlaces(currency: string): number {
    // eslint-disable-next-line security/detect-object-injection
    return MultiCurrencyService.DECIMALS[currency] ?? 2;
  }

  /**
   * Distribute any rounding residue to the largest-magnitude line
   * to keep total debits == total credits in target currency.
   */
  private rebalanceForRounding<T extends { debitAmount: number; creditAmount: number }>(
    lines: T[],
    currency: string,
  ): T[] {
    const dp = this.getCurrencyDecimalPlaces(currency);
    const factor = Math.pow(10, dp);
    const totalDebit = lines.reduce((s, l) => s + l.debitAmount, 0);
    const totalCredit = lines.reduce((s, l) => s + l.creditAmount, 0);
    const diff = Math.round(totalDebit * factor) - Math.round(totalCredit * factor);
    if (diff === 0) return lines;

    // Pick line with largest absolute amount on the side that needs adjustment
    if (diff > 0) {
      // debits > credits → bump a credit
      let index = -1;
      let maxAbs = -1;
      for (let index_ = 0; index_ < lines.length; index_++) {
        // eslint-disable-next-line security/detect-object-injection
        const amt = lines[index_]?.creditAmount ?? 0;
        if (Math.abs(amt) > maxAbs) {
          maxAbs = Math.abs(amt);
          index = index_;
        }
      }
      // eslint-disable-next-line security/detect-object-injection
      if (index >= 0 && lines[index]) {
        // eslint-disable-next-line security/detect-object-injection
        lines[index]!.creditAmount =
          // eslint-disable-next-line security/detect-object-injection
          (Math.round(lines[index]!.creditAmount * factor) + diff) / factor;
      }
    } else {
      // credits > debits → bump a debit
      let index = -1;
      let maxAbs = -1;
      for (let index_ = 0; index_ < lines.length; index_++) {
        // eslint-disable-next-line security/detect-object-injection
        const amt = lines[index_]?.debitAmount ?? 0;
        if (Math.abs(amt) > maxAbs) {
          maxAbs = Math.abs(amt);
          index = index_;
        }
      }
      // eslint-disable-next-line security/detect-object-injection
      if (index >= 0 && lines[index]) {
        // eslint-disable-next-line security/detect-object-injection
        lines[index]!.debitAmount =
          // eslint-disable-next-line security/detect-object-injection
          (Math.round(lines[index]!.debitAmount * factor) + Math.abs(diff)) / factor;
      }
    }
    return lines;
  }
}
