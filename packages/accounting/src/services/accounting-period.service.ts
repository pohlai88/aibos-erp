/**
 * Accounting Period Management Service
 *
 * Provides comprehensive accounting period management with MFRS compliance:
 * - Period creation and validation
 * - Period status management (OPEN, CLOSED, LOCKED, FINALIZED)
 * - Period-based workflow controls
 * - Multi-fiscal year support
 * - SEA market compliance
 */

export type PeriodStatus = 'OPEN' | 'CLOSED' | 'LOCKED' | 'FINALIZED';

export type FiscalYearEnd = 'DEC' | 'MAR' | 'JUN' | 'SEP';

export interface AccountingPeriod {
  periodId: string; // Format: "2024-01", "2024-Q1", "2024"
  periodName: string; // "January 2024", "Q1 2024", "FY 2024"
  fiscalYear: number;
  periodType: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  status: PeriodStatus;
  startDate: Date;
  endDate: Date;
  lockDate?: Date;
  finalizeDate?: Date;
  allowAdjustments: boolean;
  allowClosingEntries: boolean;
  jurisdiction: 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH';
  reportingStandard: 'MFRS' | 'IFRS' | 'GAAP' | 'LOCAL';
  createdAt: Date;
  updatedAt: Date;
}

export interface PeriodValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  canPost: boolean;
  requiresAdjustingEntry: boolean;
  requiresClosingEntry: boolean;
}

export interface PeriodWorkflowOptions {
  allowAdjustments: boolean;
  allowClosingEntries: boolean;
  autoLockAfterDays: number;
  requireApprovalForAdjustments: boolean;
  requireApprovalForClosing: boolean;
}

export class AccountingPeriodService {
  private readonly periods: Map<string, AccountingPeriod> = new Map();
  private readonly workflowOptions: Map<string, PeriodWorkflowOptions> = new Map();

  constructor() {
    this.initializeDefaultWorkflowOptions();
  }

  /**
   * Create a new accounting period
   */
  createPeriod(
    fiscalYear: number,
    periodType: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL',
    periodNumber: number,
    jurisdiction: 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH' = 'MY',
    reportingStandard: 'MFRS' | 'IFRS' | 'GAAP' | 'LOCAL' = 'MFRS',
  ): AccountingPeriod {
    const periodId = this.generatePeriodId(fiscalYear, periodType, periodNumber);
    const periodName = this.generatePeriodName(fiscalYear, periodType, periodNumber);
    const { startDate, endDate } = this.calculatePeriodDates(
      fiscalYear,
      periodType,
      periodNumber,
      jurisdiction,
    );

    const period: AccountingPeriod = {
      periodId,
      periodName,
      fiscalYear,
      periodType,
      status: 'OPEN',
      startDate,
      endDate,
      allowAdjustments: true,
      allowClosingEntries: false,
      jurisdiction,
      reportingStandard,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.periods.set(periodId, period);
    return period;
  }

  /**
   * Get accounting period by ID
   */
  getPeriod(periodId: string): AccountingPeriod | undefined {
    return this.periods.get(periodId);
  }

  /**
   * Get current accounting period for a date
   */
  getCurrentPeriod(
    date: Date,
    jurisdiction: 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH' = 'MY',
  ): AccountingPeriod | undefined {
    const fiscalYear = this.getFiscalYear(date, jurisdiction);
    const periodType = 'MONTHLY';
    const periodNumber = this.getPeriodNumber(date, jurisdiction);

    const periodId = this.generatePeriodId(fiscalYear, periodType, periodNumber);
    return this.getPeriod(periodId);
  }

  /**
   * Validate if posting is allowed to a period
   */
  validatePosting(
    periodId: string,
    isAdjustingEntry: boolean = false,
    isClosingEntry: boolean = false,
  ): PeriodValidationResult {
    const period = this.getPeriod(periodId);
    if (!period) {
      return {
        isValid: false,
        errors: [`Period ${periodId} not found`],
        warnings: [],
        canPost: false,
        requiresAdjustingEntry: false,
        requiresClosingEntry: false,
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    let canPost = true;
    let requiresAdjustingEntry = false;
    let requiresClosingEntry = false;

    // Check period status
    switch (period.status) {
      case 'OPEN':
        // Can post normally
        break;
      case 'CLOSED':
        if (!isAdjustingEntry) {
          errors.push(`Period ${periodId} is closed. Adjusting entries only.`);
          requiresAdjustingEntry = true;
          canPost = false;
        } else if (!period.allowAdjustments) {
          errors.push(`Period ${periodId} does not allow adjustments.`);
          canPost = false;
        }
        break;
      case 'LOCKED':
        errors.push(`Period ${periodId} is locked and cannot accept any entries.`);
        canPost = false;
        break;
      case 'FINALIZED':
        errors.push(`Period ${periodId} is finalized and cannot accept any entries.`);
        canPost = false;
        break;
    }

    // Check closing entry requirements
    if (isClosingEntry && !period.allowClosingEntries) {
      errors.push(`Period ${periodId} does not allow closing entries.`);
      canPost = false;
    }

    // Check workflow options
    const workflowOptions = this.workflowOptions.get(period.jurisdiction);
    if (workflowOptions) {
      if (isAdjustingEntry && workflowOptions.requireApprovalForAdjustments) {
        warnings.push('Adjusting entries require approval for this period.');
      }
      if (isClosingEntry && workflowOptions.requireApprovalForClosing) {
        warnings.push('Closing entries require approval for this period.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      canPost,
      requiresAdjustingEntry,
      requiresClosingEntry,
    };
  }

  /**
   * Update period status
   */
  updatePeriodStatus(periodId: string, status: PeriodStatus, _updatedBy: string): AccountingPeriod {
    const period = this.getPeriod(periodId);
    if (!period) {
      throw new Error(`Period ${periodId} not found`);
    }

    // Validate status transition
    this.validateStatusTransition(period.status, status);

    const updatedPeriod: AccountingPeriod = {
      ...period,
      status,
      updatedAt: new Date(),
    };

    // Set lock/finalize dates
    if (status === 'LOCKED' && !period.lockDate) {
      updatedPeriod.lockDate = new Date();
    }
    if (status === 'FINALIZED' && !period.finalizeDate) {
      updatedPeriod.finalizeDate = new Date();
    }

    this.periods.set(periodId, updatedPeriod);
    return updatedPeriod;
  }

  /**
   * Get periods for a fiscal year
   */
  getPeriodsForFiscalYear(
    fiscalYear: number,
    jurisdiction: 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH' = 'MY',
  ): AccountingPeriod[] {
    return Array.from(this.periods.values()).filter(
      (period) => period.fiscalYear === fiscalYear && period.jurisdiction === jurisdiction,
    );
  }

  /**
   * Get all periods for a jurisdiction
   */
  getPeriodsForJurisdiction(
    jurisdiction: 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH',
  ): AccountingPeriod[] {
    return Array.from(this.periods.values()).filter(
      (period) => period.jurisdiction === jurisdiction,
    );
  }

  /**
   * Generate period ID
   */
  private generatePeriodId(
    fiscalYear: number,
    periodType: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL',
    periodNumber: number,
  ): string {
    switch (periodType) {
      case 'MONTHLY':
        return `${fiscalYear}-${periodNumber.toString().padStart(2, '0')}`;
      case 'QUARTERLY':
        return `${fiscalYear}-Q${periodNumber}`;
      case 'ANNUAL':
        return `${fiscalYear}`;
      default:
        throw new Error(`Invalid period type: ${periodType}`);
    }
  }

  /**
   * Generate period name
   */
  private generatePeriodName(
    fiscalYear: number,
    periodType: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL',
    periodNumber: number,
  ): string {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    switch (periodType) {
      case 'MONTHLY':
        return `${monthNames[periodNumber - 1]} ${fiscalYear}`;
      case 'QUARTERLY':
        return `Q${periodNumber} ${fiscalYear}`;
      case 'ANNUAL':
        return `FY ${fiscalYear}`;
      default:
        throw new Error(`Invalid period type: ${periodType}`);
    }
  }

  /**
   * Calculate period dates based on jurisdiction
   */
  private calculatePeriodDates(
    fiscalYear: number,
    periodType: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL',
    periodNumber: number,
    jurisdiction: 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH',
  ): { startDate: Date; endDate: Date } {
    const fiscalYearStart = this.getFiscalYearStart(fiscalYear, jurisdiction);

    switch (periodType) {
      case 'MONTHLY': {
        const startDate = new Date(fiscalYearStart);
        startDate.setMonth(startDate.getMonth() + periodNumber - 1);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0); // Last day of the month
        return { startDate, endDate };
      }
      case 'QUARTERLY': {
        const startDate = new Date(fiscalYearStart);
        startDate.setMonth(startDate.getMonth() + (periodNumber - 1) * 3);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 3);
        endDate.setDate(0); // Last day of the quarter
        return { startDate, endDate };
      }
      case 'ANNUAL': {
        const startDate = new Date(fiscalYearStart);
        const endDate = new Date(fiscalYearStart);
        endDate.setFullYear(endDate.getFullYear() + 1);
        endDate.setDate(endDate.getDate() - 1); // Last day of the fiscal year
        return { startDate, endDate };
      }
      default:
        throw new Error(`Invalid period type: ${periodType}`);
    }
  }

  /**
   * Get fiscal year for a date based on jurisdiction
   */
  private getFiscalYear(
    date: Date,
    _jurisdiction: 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH',
  ): number {
    const year = date.getFullYear();
    const _month = date.getMonth() + 1;

    // Most jurisdictions use calendar year (January to December)
    // Some use different fiscal years
    switch (_jurisdiction) {
      case 'MY': // Malaysia: Calendar year
      case 'SG': // Singapore: Calendar year
      case 'VN': // Vietnam: Calendar year
      case 'ID': // Indonesia: Calendar year
      case 'TH': // Thailand: Calendar year
      case 'PH': // Philippines: Calendar year
        return year;
      default:
        return year;
    }
  }

  /**
   * Get fiscal year start date
   */
  private getFiscalYearStart(
    fiscalYear: number,
    _jurisdiction: 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH',
  ): Date {
    // Most jurisdictions start fiscal year in January
    return new Date(fiscalYear, 0, 1); // January 1st
  }

  /**
   * Get period number for a date
   */
  private getPeriodNumber(
    date: Date,
    _jurisdiction: 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH',
  ): number {
    return date.getMonth() + 1;
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(currentStatus: PeriodStatus, newStatus: PeriodStatus): void {
    const validTransitions: Record<PeriodStatus, PeriodStatus[]> = {
      OPEN: ['CLOSED', 'LOCKED'],
      CLOSED: ['OPEN', 'LOCKED'],
      LOCKED: ['FINALIZED'],
      FINALIZED: [], // Cannot transition from finalized
    };

    // Safe access to prevent object injection
    let allowedTransitions: PeriodStatus[];
    switch (currentStatus) {
      case 'OPEN':
        allowedTransitions = validTransitions.OPEN;
        break;
      case 'CLOSED':
        allowedTransitions = validTransitions.CLOSED;
        break;
      case 'LOCKED':
        allowedTransitions = validTransitions.LOCKED;
        break;
      case 'FINALIZED':
        allowedTransitions = validTransitions.FINALIZED;
        break;
      default:
        throw new Error(`Invalid current status: ${currentStatus}`);
    }

    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }

  /**
   * Initialize default workflow options for each jurisdiction
   */
  private initializeDefaultWorkflowOptions(): void {
    // Malaysia (MFRS)
    this.workflowOptions.set('MY', {
      allowAdjustments: true,
      allowClosingEntries: true,
      autoLockAfterDays: 30,
      requireApprovalForAdjustments: true,
      requireApprovalForClosing: true,
    });

    // Singapore (IFRS)
    this.workflowOptions.set('SG', {
      allowAdjustments: true,
      allowClosingEntries: true,
      autoLockAfterDays: 45,
      requireApprovalForAdjustments: true,
      requireApprovalForClosing: true,
    });

    // Vietnam (VAS)
    this.workflowOptions.set('VN', {
      allowAdjustments: true,
      allowClosingEntries: true,
      autoLockAfterDays: 30,
      requireApprovalForAdjustments: true,
      requireApprovalForClosing: true,
    });

    // Indonesia (PSAK)
    this.workflowOptions.set('ID', {
      allowAdjustments: true,
      allowClosingEntries: true,
      autoLockAfterDays: 30,
      requireApprovalForAdjustments: true,
      requireApprovalForClosing: true,
    });

    // Thailand (TFRS)
    this.workflowOptions.set('TH', {
      allowAdjustments: true,
      allowClosingEntries: true,
      autoLockAfterDays: 30,
      requireApprovalForAdjustments: true,
      requireApprovalForClosing: true,
    });

    // Philippines (PFRS)
    this.workflowOptions.set('PH', {
      allowAdjustments: true,
      allowClosingEntries: true,
      autoLockAfterDays: 30,
      requireApprovalForAdjustments: true,
      requireApprovalForClosing: true,
    });
  }

  /**
   * Set workflow options for a jurisdiction
   */
  setWorkflowOptions(
    jurisdiction: 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH',
    options: PeriodWorkflowOptions,
  ): void {
    this.workflowOptions.set(jurisdiction, options);
  }

  /**
   * Get workflow options for a jurisdiction
   */
  getWorkflowOptions(
    jurisdiction: 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH',
  ): PeriodWorkflowOptions | undefined {
    return this.workflowOptions.get(jurisdiction);
  }
}
