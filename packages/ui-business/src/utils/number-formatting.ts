/**
 * Enterprise-grade number formatting system
 * Matches Excel/Google Sheets standards with CFO-grade features
 */

export interface NumberFormattingConfig {
  // Locale settings
  locale: string;
  currency: string;
  
  // Default decimal places
  currencyDecimals: number;
  numberDecimals: number;
  percentageDecimals: number;
  ratioDecimals: number;
  
  // Display options
  showSignForPositive: boolean;
  useCompactNotation: boolean;
  compactThreshold: number; // When to use compact notation (e.g., 1M instead of 1,000,000)
  compactDisplay?: 'short' | 'long';
  
  // Currency display
  currencySymbol: string;
  currencyPosition: 'before' | 'after';
  currencyDisplay?: 'symbol' | 'narrowSymbol' | 'code' | 'name';
  
  // Thousand separator
  thousandSeparator: string;
  decimalSeparator: string;
  
  // Percentage display
  percentageSymbol: string;
  percentagePosition: 'before' | 'after';

  // Advanced numeric behavior (optional, sensible fallbacks)
  useGrouping?: boolean; // default true
  roundingMode?: 'ceil' | 'floor' | 'expand' | 'trunc' | 'halfCeil' | 'halfFloor' | 'halfExpand' | 'halfEven' | 'halfOdd';
  trailingZeroDisplay?: 'auto' | 'stripIfInteger';
  accountingNegatives?: boolean; // (1,234.00) instead of -1,234.00
  nullDisplay?: string; // e.g., '—'
}

/**
 * Default formatting configuration for Malaysian market
 */
export const DEFAULT_MALAYSIAN_CONFIG: NumberFormattingConfig = {
  locale: 'en-MY',
  currency: 'MYR',
  currencyDecimals: 2,
  numberDecimals: 0,
  percentageDecimals: 1,
  ratioDecimals: 2,
  showSignForPositive: false,
  useCompactNotation: true,
  compactThreshold: 1000000,
  compactDisplay: 'short',
  currencySymbol: 'RM',
  currencyPosition: 'before',
  currencyDisplay: 'symbol',
  thousandSeparator: ',',
  decimalSeparator: '.',
  percentageSymbol: '%',
  percentagePosition: 'after',
  useGrouping: true,
  trailingZeroDisplay: 'auto',
  accountingNegatives: false,
  nullDisplay: '—',
};

/**
 * Default formatting configuration for US market
 */
export const DEFAULT_US_CONFIG: NumberFormattingConfig = {
  locale: 'en-US',
  currency: 'USD',
  currencyDecimals: 2,
  numberDecimals: 0,
  percentageDecimals: 1,
  ratioDecimals: 2,
  showSignForPositive: false,
  useCompactNotation: true,
  compactThreshold: 1000000,
  compactDisplay: 'short',
  currencySymbol: '$',
  currencyPosition: 'before',
  currencyDisplay: 'symbol',
  thousandSeparator: ',',
  decimalSeparator: '.',
  percentageSymbol: '%',
  percentagePosition: 'after',
  useGrouping: true,
  trailingZeroDisplay: 'auto',
  accountingNegatives: false,
  nullDisplay: '—',
};

/**
 * Default formatting configuration for European market
 */
export const DEFAULT_EUROPEAN_CONFIG: NumberFormattingConfig = {
  locale: 'en-GB',
  currency: 'EUR',
  currencyDecimals: 2,
  numberDecimals: 0,
  percentageDecimals: 1,
  ratioDecimals: 2,
  showSignForPositive: false,
  useCompactNotation: true,
  compactThreshold: 1000000,
  compactDisplay: 'short',
  currencySymbol: '€',
  currencyPosition: 'after',
  currencyDisplay: 'symbol',
  thousandSeparator: ',',
  decimalSeparator: '.',
  percentageSymbol: '%',
  percentagePosition: 'after',
  useGrouping: true,
  trailingZeroDisplay: 'auto',
  accountingNegatives: false,
  nullDisplay: '—',
};

/**
 * Predefined configurations for different markets
 */
export const MARKET_CONFIGS = {
  'malaysia': DEFAULT_MALAYSIAN_CONFIG,
  'us': DEFAULT_US_CONFIG,
  'europe': DEFAULT_EUROPEAN_CONFIG,
  'singapore': {
    ...DEFAULT_MALAYSIAN_CONFIG,
    locale: 'en-SG',
    currency: 'SGD',
    currencySymbol: 'S$',
  },
  'australia': {
    ...DEFAULT_US_CONFIG,
    locale: 'en-AU',
    currency: 'AUD',
    currencySymbol: 'A$',
  },
  // Safe eurozone preset without changing the existing `europe` key
  'eurozone': {
    ...DEFAULT_EUROPEAN_CONFIG,
    locale: 'de-DE',
    currency: 'EUR',
    // de-DE standard separators are applied via locale; keep fields for overrides
    thousandSeparator: '.',
    decimalSeparator: ',',
    currencyPosition: 'before',
  },
} as const;

export type MarketConfigKey = keyof typeof MARKET_CONFIGS;

/**
 * Number formatting settings manager
 */
export class NumberFormattingSettings {
  private config: NumberFormattingConfig;
  private listeners: Set<(config: NumberFormattingConfig) => void> = new Set();

  constructor(initialConfig?: Partial<NumberFormattingConfig> | MarketConfigKey) {
    if (typeof initialConfig === 'string') {
      // Use predefined market config
      this.config = { ...MARKET_CONFIGS[initialConfig] };
    } else {
      // Merge with default Malaysian config
      this.config = { ...DEFAULT_MALAYSIAN_CONFIG, ...initialConfig };
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): NumberFormattingConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<NumberFormattingConfig>): void {
    this.config = { ...this.config, ...updates };
    this.notifyListeners();
  }

  /**
   * Set market configuration
   */
  setMarket(market: MarketConfigKey): void {
    this.config = { ...MARKET_CONFIGS[market] };
    this.notifyListeners();
  }

  /**
   * Subscribe to configuration changes
   */
  subscribe(listener: (config: NumberFormattingConfig) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of configuration changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getConfig()));
  }

  /**
   * Reset to default configuration
   */
  reset(): void {
    this.config = { ...DEFAULT_MALAYSIAN_CONFIG };
    this.notifyListeners();
  }

  /**
   * Export configuration for persistence
   */
  export(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  import(configJson: string): void {
    try {
      const imported = JSON.parse(configJson);
      this.config = { ...DEFAULT_MALAYSIAN_CONFIG, ...imported };
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to import number formatting configuration:', error);
    }
  }
}

/**
 * Global number formatting settings instance
 * Can be customized per application or user preference
 */
export const globalNumberFormatting = new NumberFormattingSettings();

/**
 * Utility to create custom formatting configurations
 */
export function createCustomConfig(
  baseMarket: MarketConfigKey = 'malaysia',
  overrides: Partial<NumberFormattingConfig> = {}
): NumberFormattingConfig {
  return {
    ...MARKET_CONFIGS[baseMarket],
    ...overrides,
  };
}

/**
 * Validate configuration
 */
export function validateConfig(config: Partial<NumberFormattingConfig>): string[] {
  const errors: string[] = [];

  if (config.locale && typeof config.locale !== 'string') {
    errors.push('Locale must be a string');
  }

  if (config.currency && typeof config.currency !== 'string') {
    errors.push('Currency must be a string');
  }

  if (config.currencyDecimals !== undefined && (config.currencyDecimals < 0 || config.currencyDecimals > 10)) {
    errors.push('Currency decimals must be between 0 and 10');
  }

  if (config.numberDecimals !== undefined && (config.numberDecimals < 0 || config.numberDecimals > 10)) {
    errors.push('Number decimals must be between 0 and 10');
  }

  if (config.percentageDecimals !== undefined && (config.percentageDecimals < 0 || config.percentageDecimals > 4)) {
    errors.push('Percentage decimals must be between 0 and 4');
  }

  if (config.compactThreshold !== undefined && config.compactThreshold < 1000) {
    errors.push('Compact threshold must be at least 1000');
  }

  if (config.compactDisplay && !['short','long'].includes(config.compactDisplay)) {
    errors.push('compactDisplay must be "short" or "long"');
  }

  if (config.trailingZeroDisplay && !['auto','stripIfInteger'].includes(config.trailingZeroDisplay)) {
    errors.push('trailingZeroDisplay must be "auto" or "stripIfInteger"');
  }

  return errors;
}

// ------- Canonical, typed formatters (no breaking changes) -------

type NumericKind = 'number' | 'currency' | 'percent';

function buildIntlOptions(kind: NumericKind, cfg: NumberFormattingConfig, value: number): Intl.NumberFormatOptions {
  const decimals =
    kind === 'currency' ? cfg.currencyDecimals :
    kind === 'percent' ? cfg.percentageDecimals : cfg.numberDecimals;

  const useCompact = cfg.useCompactNotation && Math.abs(value) >= cfg.compactThreshold;
  const signDisplay: Intl.NumberFormatOptions['signDisplay'] = cfg.showSignForPositive ? 'always' : 'auto';

  const base: Intl.NumberFormatOptions = {
    useGrouping: cfg.useGrouping ?? true,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    signDisplay,
    notation: useCompact ? 'compact' : 'standard',
  };

  // Add optional properties only if they exist
  if (cfg.trailingZeroDisplay) {
    (base as any).trailingZeroDisplay = cfg.trailingZeroDisplay;
  }
  
  if (cfg.roundingMode) {
    (base as any).roundingMode = cfg.roundingMode;
  }

  if (useCompact && cfg.compactDisplay) {
    base.compactDisplay = cfg.compactDisplay;
  }

  if (kind === 'currency') {
    base.style = 'currency';
    base.currency = cfg.currency;
    if (cfg.currencyDisplay) {
      base.currencyDisplay = cfg.currencyDisplay;
    }
  } else if (kind === 'percent') {
    base.style = 'percent';
  }

  return base;
}

function applyCustomSeparators(
  formatted: string,
  parts: Intl.NumberFormatPart[],
  cfg: NumberFormattingConfig
): string {
  // Detect actual locale separators from parts, then replace if custom separators differ.
  const group = parts.find(p => p.type === 'group')?.value;
  const decimal = parts.find(p => p.type === 'decimal')?.value;
  let out = formatted;
  if (group && cfg.thousandSeparator && group !== cfg.thousandSeparator) {
    const re = new RegExp(escapeRegExp(group), 'g');
    out = out.replace(re, cfg.thousandSeparator);
  }
  if (decimal && cfg.decimalSeparator && decimal !== cfg.decimalSeparator) {
    const re = new RegExp(escapeRegExp(decimal), 'g');
    out = out.replace(re, cfg.decimalSeparator);
  }
  return out;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function withAccountingNegatives(s: string, cfg: NumberFormattingConfig, value: number): string {
  if (!cfg.accountingNegatives || value >= 0) return s;
  // remove a single leading minus if present, then wrap with parentheses
  return `(${s.replace(/^-/, '')})`;
}

function fmt(kind: NumericKind, value: number | null | undefined, cfg: NumberFormattingConfig): string {
  if (value === null || value === undefined || Number.isNaN(value)) return cfg.nullDisplay ?? '—';
  const options = buildIntlOptions(kind, cfg, value);
  const nf = new Intl.NumberFormat(cfg.locale, options);
  const parts = nf.formatToParts(value);
  const raw = nf.format(value);
  const replaced = applyCustomSeparators(raw, parts, cfg);
  return withAccountingNegatives(replaced, cfg, value);
}

/**
 * Format numbers with proper thousand separators
 * Matches Excel number formatting standards
 */
export function formatNumber(value: number | null | undefined, cfg?: NumberFormattingConfig): string {
  return fmt('number', value, cfg ?? globalNumberFormatting.getConfig());
}

/**
 * Format currency values with proper thousand separators
 * Matches Excel currency formatting standards
 */
export function formatCurrency(value: number | null | undefined, cfg?: NumberFormattingConfig): string {
  return fmt('currency', value, cfg ?? globalNumberFormatting.getConfig());
}

/**
 * Format percentages with proper decimal places
 * Expects value in 0..1 range for percent, like Intl does
 * Matches Excel percentage formatting standards
 */
export function formatPercent(value: number | null | undefined, cfg?: NumberFormattingConfig): string {
  return fmt('percent', value, cfg ?? globalNumberFormatting.getConfig());
}

/**
 * Format percentages with proper decimal places
 * Expects value in 0..100 range (e.g., 15.7 for 15.7%)
 * Convenience wrapper for formatPercent
 */
export function formatPercentage(value: number | null | undefined, cfg?: NumberFormattingConfig): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return (cfg ?? globalNumberFormatting.getConfig()).nullDisplay ?? '—';
  }
  return formatPercent(value / 100, cfg);
}

/**
 * Format ratios (like debt-to-equity) with proper decimal places
 * Matches Excel ratio formatting standards
 */
export function formatRatio(value: number | null | undefined, cfg?: NumberFormattingConfig): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return (cfg ?? globalNumberFormatting.getConfig()).nullDisplay ?? '—';
  }
  const c = cfg ?? globalNumberFormatting.getConfig();
  const options: Intl.NumberFormatOptions = {
    useGrouping: c.useGrouping ?? true,
    minimumFractionDigits: c.ratioDecimals,
    maximumFractionDigits: c.ratioDecimals,
  };
  
  if (c.trailingZeroDisplay) {
    (options as any).trailingZeroDisplay = c.trailingZeroDisplay;
  }
  
  const s = new Intl.NumberFormat(c.locale, options).format(value);
  const replaced = applyCustomSeparators(s, [{ type: 'group', value: ',' }, { type: 'decimal', value: '.' }] as any, c);
  return withAccountingNegatives(`${replaced}x`, c, value);
}

/**
 * Format compact numbers (K, M, B notation)
 * Matches Excel compact number formatting
 */
export function formatCompact(value: number | null | undefined, cfg?: NumberFormattingConfig): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return (cfg ?? globalNumberFormatting.getConfig()).nullDisplay ?? '—';
  }
  const c = cfg ?? globalNumberFormatting.getConfig();
  const options = buildIntlOptions('number', c, value);
  options.notation = 'compact';
  options.compactDisplay = c.compactDisplay ?? 'short';
  
  const nf = new Intl.NumberFormat(c.locale, options);
  const parts = nf.formatToParts(value);
  const raw = nf.format(value);
  const replaced = applyCustomSeparators(raw, parts, c);
  return withAccountingNegatives(replaced, c, value);
}

/**
 * Smart formatting that automatically chooses the best format
 * Based on value size and context
 */
export function formatSmart(
  value: number | null | undefined,
  options: { currency?: string; cfg?: NumberFormattingConfig } = {}
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return (options.cfg ?? globalNumberFormatting.getConfig()).nullDisplay ?? '—';
  }
  
  const config = options.cfg ?? globalNumberFormatting.getConfig();
  const absValue = Math.abs(value);

  // Currency values
  if (options.currency) {
    if (absValue >= config.compactThreshold) {
      return formatCurrency(value, { ...config, useCompactNotation: true });
    }
    return formatCurrency(value, config);
  }

  // Large numbers
  if (absValue >= config.compactThreshold) {
    return formatCompact(value, config);
  }

  // Regular numbers
  return formatNumber(value, config);
}

/**
 * Excel-style number formatting presets
 */
export const ExcelFormats = {
  // Currency formats
  currency: (value: number) => formatCurrency(value),
  currencyWithDecimals: (value: number) => formatCurrency(value, { ...globalNumberFormatting.getConfig(), currencyDecimals: 2 }),
  
  // Number formats
  number: (value: number) => formatNumber(value),
  numberWithDecimals: (value: number) => formatNumber(value, { ...globalNumberFormatting.getConfig(), numberDecimals: 2 }),
  
  // Percentage formats
  percentage: (value: number) => formatPercentage(value),
  percentageWithDecimals: (value: number) => formatPercentage(value, { ...globalNumberFormatting.getConfig(), percentageDecimals: 2 }),
  
  // Ratio formats
  ratio: (value: number) => formatRatio(value),
  
  // Compact formats
  compact: (value: number) => formatCompact(value),
  
  // Financial statement formats
  revenue: (value: number) => formatCurrency(value),
  margin: (value: number) => formatPercentage(value),
  financialRatio: (value: number) => formatRatio(value),
} as const;

/**
 * Google Sheets-style number formatting presets
 */
export const GoogleSheetsFormats = {
  // Currency formats
  currency: (value: number) => formatCurrency(value),
  currencyWithDecimals: (value: number) => formatCurrency(value, { ...globalNumberFormatting.getConfig(), currencyDecimals: 2 }),
  
  // Number formats
  number: (value: number) => formatNumber(value),
  numberWithDecimals: (value: number) => formatNumber(value, { ...globalNumberFormatting.getConfig(), numberDecimals: 2 }),
  
  // Percentage formats
  percentage: (value: number) => formatPercentage(value),
  percentageWithDecimals: (value: number) => formatPercentage(value, { ...globalNumberFormatting.getConfig(), percentageDecimals: 2 }),
  
  // Ratio formats
  ratio: (value: number) => formatRatio(value),
  
  // Compact formats
  compact: (value: number) => formatCompact(value),
} as const;