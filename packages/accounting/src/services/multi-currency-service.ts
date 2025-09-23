/**
 * Multi-Currency Service for SEA Markets
 *
 * Provides comprehensive multi-currency support for:
 * - Malaysia: MYR (Malaysian Ringgit)
 * - Singapore: SGD (Singapore Dollar)
 * - Vietnam: VND (Vietnamese Dong)
 * - Indonesia: IDR (Indonesian Rupiah)
 * - Thailand: THB (Thai Baht)
 * - Philippines: PHP (Philippine Peso)
 */

export type CurrencyCode = 'MYR' | 'SGD' | 'VND' | 'IDR' | 'THB' | 'PHP' | 'USD' | 'EUR';

export interface Currency {
  code: CurrencyCode;
  name: string;
  symbol: string;
  decimalPlaces: number;
  isActive: boolean;
  jurisdiction: 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH' | 'GLOBAL';
}

export interface ExchangeRate {
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  rate: number;
  date: Date;
  source: 'MANUAL' | 'API' | 'BANK';
  isActive: boolean;
}

export interface CurrencyConversionResult {
  fromAmount: number;
  toAmount: number;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  exchangeRate: number;
  conversionDate: Date;
  precision: number;
}

export interface FXGainLoss {
  currency: CurrencyCode;
  originalAmount: number;
  convertedAmount: number;
  gainLoss: number;
  gainLossPercentage: number;
  conversionDate: Date;
}

export interface MultiCurrencyValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export class MultiCurrencyService {
  private readonly currencies: Map<CurrencyCode, Currency> = new Map();
  private readonly exchangeRates: Map<string, ExchangeRate> = new Map();

  constructor() {
    this.initializeCurrencies();
  }

  /**
   * Convert amount from one currency to another
   */
  convertCurrency(
    amount: number,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode,
    conversionDate: Date = new Date(),
  ): CurrencyConversionResult {
    if (fromCurrency === toCurrency) {
      return {
        fromAmount: amount,
        toAmount: amount,
        fromCurrency,
        toCurrency,
        exchangeRate: 1,
        conversionDate,
        precision: this.getCurrencyPrecision(toCurrency),
      };
    }

    const exchangeRate = this.getExchangeRate(fromCurrency, toCurrency, conversionDate);
    if (!exchangeRate) {
      throw new Error(
        `Exchange rate not found for ${fromCurrency} to ${toCurrency} on ${conversionDate.toISOString()}`,
      );
    }

    const toAmount = amount * exchangeRate.rate;
    const precision = this.getCurrencyPrecision(toCurrency);
    const roundedAmount = this.roundToPrecision(toAmount, precision);

    return {
      fromAmount: amount,
      toAmount: roundedAmount,
      fromCurrency,
      toCurrency,
      exchangeRate: exchangeRate.rate,
      conversionDate,
      precision,
    };
  }

  /**
   * Calculate FX gain/loss for a transaction
   */
  calculateFXGainLoss(
    originalAmount: number,
    originalCurrency: CurrencyCode,
    convertedAmount: number,
    convertedCurrency: CurrencyCode,
    conversionDate: Date = new Date(),
  ): FXGainLoss {
    if (originalCurrency === convertedCurrency) {
      return {
        currency: originalCurrency,
        originalAmount,
        convertedAmount,
        gainLoss: 0,
        gainLossPercentage: 0,
        conversionDate,
      };
    }

    const gainLoss = convertedAmount - originalAmount;
    const gainLossPercentage = originalAmount !== 0 ? (gainLoss / originalAmount) * 100 : 0;

    return {
      currency: originalCurrency,
      originalAmount,
      convertedAmount,
      gainLoss,
      gainLossPercentage,
      conversionDate,
    };
  }

  /**
   * Validate multi-currency transaction
   */
  validateMultiCurrencyTransaction(
    entries: Array<{
      amount: number;
      currency: CurrencyCode;
      accountCode: string;
    }>,
    baseCurrency: CurrencyCode,
  ): MultiCurrencyValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check if all currencies are valid
    for (const entry of entries) {
      if (!this.isValidCurrency(entry.currency)) {
        errors.push(`Invalid currency code: ${entry.currency}`);
      }
    }

    // Check for mixed currencies in same account
    const accountCurrencies = new Map<string, Set<CurrencyCode>>();
    for (const entry of entries) {
      if (!accountCurrencies.has(entry.accountCode)) {
        accountCurrencies.set(entry.accountCode, new Set());
      }
      accountCurrencies.get(entry.accountCode)!.add(entry.currency);
    }

    for (const [accountCode, currencies] of accountCurrencies.entries()) {
      if (currencies.size > 1) {
        warnings.push(
          `Account ${accountCode} has mixed currencies: ${Array.from(currencies).join(', ')}`,
        );
        suggestions.push(
          `Consider using separate accounts for different currencies or convert to base currency`,
        );
      }
    }

    // Check if base currency is used
    const hasBaseCurrency = entries.some((entry) => entry.currency === baseCurrency);
    if (!hasBaseCurrency) {
      warnings.push(`No entries in base currency ${baseCurrency}`);
      suggestions.push(`Consider including base currency entries for better reporting`);
    }

    // Check for foreign currency without exchange rate
    const foreignCurrencies = entries
      .map((entry) => entry.currency)
      .filter((currency) => currency !== baseCurrency);

    for (const currency of foreignCurrencies) {
      const exchangeRate = this.getExchangeRate(currency, baseCurrency, new Date());
      if (!exchangeRate) {
        errors.push(`Exchange rate not found for ${currency} to ${baseCurrency}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Get exchange rate between two currencies
   */
  getExchangeRate(
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode,
    date: Date = new Date(),
  ): ExchangeRate | undefined {
    if (fromCurrency === toCurrency) {
      return {
        fromCurrency,
        toCurrency,
        rate: 1,
        date,
        source: 'MANUAL',
        isActive: true,
      };
    }

    const key = `${fromCurrency}-${toCurrency}-${date.toISOString().split('T')[0]}`;
    return this.exchangeRates.get(key);
  }

  /**
   * Set exchange rate
   */
  setExchangeRate(
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode,
    rate: number,
    date: Date = new Date(),
    source: 'MANUAL' | 'API' | 'BANK' = 'MANUAL',
  ): void {
    const key = `${fromCurrency}-${toCurrency}-${date.toISOString().split('T')[0]}`;
    this.exchangeRates.set(key, {
      fromCurrency,
      toCurrency,
      rate,
      date,
      source,
      isActive: true,
    });

    // Also set reverse rate
    const reverseKey = `${toCurrency}-${fromCurrency}-${date.toISOString().split('T')[0]}`;
    this.exchangeRates.set(reverseKey, {
      fromCurrency: toCurrency,
      toCurrency: fromCurrency,
      rate: 1 / rate,
      date,
      source,
      isActive: true,
    });
  }

  /**
   * Get all supported currencies
   */
  getSupportedCurrencies(): Currency[] {
    return Array.from(this.currencies.values()).filter((currency) => currency.isActive);
  }

  /**
   * Get currencies for a jurisdiction
   */
  getCurrenciesForJurisdiction(
    jurisdiction: 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH' | 'GLOBAL',
  ): Currency[] {
    return Array.from(this.currencies.values()).filter(
      (currency) => currency.jurisdiction === jurisdiction && currency.isActive,
    );
  }

  /**
   * Check if currency is valid
   */
  isValidCurrency(currency: string): currency is CurrencyCode {
    return this.currencies.has(currency as CurrencyCode);
  }

  /**
   * Get currency precision (decimal places)
   */
  private getCurrencyPrecision(currency: CurrencyCode): number {
    const currencyInfo = this.currencies.get(currency);
    return currencyInfo?.decimalPlaces ?? 2;
  }

  /**
   * Round amount to specified precision
   */
  private roundToPrecision(amount: number, precision: number): number {
    const factor = Math.pow(10, precision);
    return Math.round(amount * factor) / factor;
  }

  /**
   * Initialize supported currencies
   */
  private initializeCurrencies(): void {
    // Malaysia
    this.addCurrency({
      code: 'MYR',
      name: 'Malaysian Ringgit',
      symbol: 'RM',
      decimalPlaces: 2,
      isActive: true,
      jurisdiction: 'MY',
    });

    // Singapore
    this.addCurrency({
      code: 'SGD',
      name: 'Singapore Dollar',
      symbol: 'S$',
      decimalPlaces: 2,
      isActive: true,
      jurisdiction: 'SG',
    });

    // Vietnam
    this.addCurrency({
      code: 'VND',
      name: 'Vietnamese Dong',
      symbol: '₫',
      decimalPlaces: 0, // VND typically doesn't use decimal places
      isActive: true,
      jurisdiction: 'VN',
    });

    // Indonesia
    this.addCurrency({
      code: 'IDR',
      name: 'Indonesian Rupiah',
      symbol: 'Rp',
      decimalPlaces: 0, // IDR typically doesn't use decimal places
      isActive: true,
      jurisdiction: 'ID',
    });

    // Thailand
    this.addCurrency({
      code: 'THB',
      name: 'Thai Baht',
      symbol: '฿',
      decimalPlaces: 2,
      isActive: true,
      jurisdiction: 'TH',
    });

    // Philippines
    this.addCurrency({
      code: 'PHP',
      name: 'Philippine Peso',
      symbol: '₱',
      decimalPlaces: 2,
      isActive: true,
      jurisdiction: 'PH',
    });

    // Global currencies
    this.addCurrency({
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      decimalPlaces: 2,
      isActive: true,
      jurisdiction: 'GLOBAL',
    });

    this.addCurrency({
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
      decimalPlaces: 2,
      isActive: true,
      jurisdiction: 'GLOBAL',
    });

    // Initialize some default exchange rates (these would typically come from an API)
    this.initializeDefaultExchangeRates();
  }

  /**
   * Add currency to the service
   */
  private addCurrency(currency: Currency): void {
    this.currencies.set(currency.code, currency);
  }

  /**
   * Initialize default exchange rates
   */
  private initializeDefaultExchangeRates(): void {
    const today = new Date();

    // Sample exchange rates (these would typically come from a real API)
    this.setExchangeRate('USD', 'MYR', 4.2, today, 'API');
    this.setExchangeRate('USD', 'SGD', 1.35, today, 'API');
    this.setExchangeRate('USD', 'VND', 24000, today, 'API');
    this.setExchangeRate('USD', 'IDR', 15000, today, 'API');
    this.setExchangeRate('USD', 'THB', 35.5, today, 'API');
    this.setExchangeRate('USD', 'PHP', 55.0, today, 'API');
    this.setExchangeRate('USD', 'EUR', 0.85, today, 'API');

    // Cross rates between SEA currencies
    this.setExchangeRate('MYR', 'SGD', 0.32, today, 'API');
    this.setExchangeRate('MYR', 'THB', 8.45, today, 'API');
    this.setExchangeRate('SGD', 'THB', 26.3, today, 'API');
  }

  /**
   * Get currency information
   */
  getCurrency(currency: CurrencyCode): Currency | undefined {
    return this.currencies.get(currency);
  }

  /**
   * Format currency amount
   */
  formatCurrency(amount: number, currency: CurrencyCode, locale: string = 'en-US'): string {
    const currencyInfo = this.getCurrency(currency);
    if (!currencyInfo) {
      return `${amount} ${currency}`;
    }

    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currencyInfo.decimalPlaces,
      maximumFractionDigits: currencyInfo.decimalPlaces,
    });

    return formatter.format(amount);
  }

  /**
   * Get exchange rate history for a currency pair
   */
  getExchangeRateHistory(
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode,
    startDate: Date,
    endDate: Date,
  ): ExchangeRate[] {
    const rates: ExchangeRate[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const rate = this.getExchangeRate(fromCurrency, toCurrency, currentDate);
      if (rate) {
        rates.push(rate);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return rates;
  }

  /**
   * Calculate average exchange rate for a period
   */
  calculateAverageExchangeRate(
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode,
    startDate: Date,
    endDate: Date,
  ): number {
    const rates = this.getExchangeRateHistory(fromCurrency, toCurrency, startDate, endDate);
    if (rates.length === 0) {
      throw new Error(
        `No exchange rates found for ${fromCurrency} to ${toCurrency} in the specified period`,
      );
    }

    const totalRate = rates.reduce((sum, rate) => sum + rate.rate, 0);
    return totalRate / rates.length;
  }
}
