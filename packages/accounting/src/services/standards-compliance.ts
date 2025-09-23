/**
 * Standards Compliance Service
 *
 * Provides comprehensive standards compliance reporting, validation,
 * and crosswalk functionality for multi-standard accounting systems.
 * Enhanced with regulatory reporting capabilities for SEA markets.
 */

import type {
  StandardsComplianceReport,
  StandardsValidationResult,
  TenantCoaAccount,
} from '../types/standards';

export interface RegulatoryReport {
  reportId: string;
  reportType: 'TAX_RETURN' | 'AUDIT_PACKAGE' | 'STATISTICAL' | 'COMPLIANCE';
  jurisdiction: 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH';
  reportingPeriod: string; // "2024-01", "2024-Q1", "2024"
  generatedAt: Date;
  status: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'SUBMITTED';
  data: Record<string, unknown>;
  attachments: string[];
}

export interface TaxFormData {
  formType: string;
  jurisdiction: 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH';
  reportingPeriod: string;
  companyInfo: {
    name: string;
    registrationNumber: string;
    address: string;
    contactInfo: string;
  };
  financialData: Record<string, number>;
  taxCalculations: Record<string, number>;
  supportingDocuments: string[];
}

export interface AuditPackage {
  packageId: string;
  jurisdiction: 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH';
  reportingPeriod: string;
  generatedAt: Date;
  includes: {
    trialBalance: boolean;
    generalLedger: boolean;
    journalEntries: boolean;
    supportingDocuments: boolean;
    complianceReports: boolean;
  };
  files: Array<{
    fileName: string;
    fileType: string;
    size: number;
    checksum: string;
  }>;
}

export class StandardsComplianceService {
  /**
   * Generate comprehensive compliance report for a tenant
   */
  async generateComplianceReport(
    tenantId: string,
    accounts: TenantCoaAccount[],
  ): Promise<StandardsComplianceReport> {
    const totalAccounts = accounts.length;
    const compliantAccounts = accounts.filter((account) => account.standardLinks.length > 0).length;
    const compliancePercentage = totalAccounts > 0 ? (compliantAccounts / totalAccounts) * 100 : 0;

    // Group by standard
    const standardsCoverage = this.calculateStandardsCoverage(accounts);

    // Find unmapped accounts
    const unmappedAccounts = accounts
      .filter((account) => account.standardLinks.length === 0)
      .map((account) => ({
        accountCode: account.accountCode,
        accountName: account.accountName,
        accountType: account.accountType,
      }));

    // Generate recommendations
    const recommendations = this.generateRecommendations(accounts);

    return {
      tenantId,
      totalAccounts,
      compliantAccounts,
      compliancePercentage,
      standardsCoverage,
      unmappedAccounts,
      recommendations,
    };
  }

  /**
   * Validate standards compliance for an account
   */
  validateAccountCompliance(
    account: TenantCoaAccount,
    _standards: unknown[],
  ): StandardsValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: Array<{
      accountCode: string;
      suggestedStandard: string;
      confidence: number;
      reason: string;
    }> = [];

    // Check if account has any standard links
    if (account.standardLinks.length === 0) {
      warnings.push(`Account ${account.accountCode} has no standards references`);

      // Suggest standards based on account type and name
      const suggestedStandards = this.suggestStandardsForAccount(account);
      suggestions.push(...suggestedStandards);
    }

    // Validate special account types have appropriate standards
    if (account.specialAccountType) {
      const requiredStandards = this.getRequiredStandardsForSpecialType(account.specialAccountType);
      const currentStandards = account.standardLinks.map((link) => link.sectionCode);

      for (const required of requiredStandards) {
        if (!currentStandards.some((current) => current.includes(required))) {
          errors.push(
            `Account ${account.accountCode} (${account.specialAccountType}) should reference ${required}`,
          );
        }
      }
    }

    // Validate companion relationships
    if (account.companions) {
      this.validateCompanionRelationships(account, errors, warnings);
    }

    // Check for outdated standards references
    const outdatedReferences = this.findOutdatedReferences(account.standardLinks);
    if (outdatedReferences.length > 0) {
      warnings.push(
        `Account ${account.accountCode} has outdated standards references: ${outdatedReferences.join(', ')}`,
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Calculate standards coverage statistics
   */
  private calculateStandardsCoverage(accounts: TenantCoaAccount[]): Array<{
    standard: string;
    accountsLinked: number;
    totalAccounts: number;
    percentage: number;
  }> {
    const standardMap = new Map<string, { accountsLinked: number; totalAccounts: number }>();

    // Initialize all known standards
    const knownStandards = [
      'MFRS 1',
      'MFRS 3',
      'MFRS 7',
      'MFRS 9',
      'MFRS 10',
      'MFRS 15',
      'MFRS 16',
      'MFRS 21',
      'MFRS 28',
      'MFRS 102',
      'MFRS 121',
      'MFRS 123',
      'MFRS 128',
      'MFRS 136',
    ];

    for (const standard of knownStandards) {
      standardMap.set(standard, { accountsLinked: 0, totalAccounts: accounts.length });
    }

    // Count linked accounts
    for (const account of accounts) {
      for (const link of account.standardLinks) {
        const standard = this.extractStandardFromSectionCode(link.sectionCode);
        if (standard) {
          const current = standardMap.get(standard);
          if (current) {
            current.accountsLinked++;
          }
        }
      }
    }

    // Convert to array format
    return Array.from(standardMap.entries()).map(([standard, data]) => ({
      standard,
      accountsLinked: data.accountsLinked,
      totalAccounts: data.totalAccounts,
      percentage: data.totalAccounts > 0 ? (data.accountsLinked / data.totalAccounts) * 100 : 0,
    }));
  }

  /**
   * Generate compliance recommendations
   */
  private generateRecommendations(accounts: TenantCoaAccount[]): Array<{
    type: 'warning' | 'error' | 'info';
    message: string;
    accountCode?: string;
    suggestedStandard?: string;
  }> {
    const recommendations: Array<{
      type: 'warning' | 'error' | 'info';
      message: string;
      accountCode?: string;
      suggestedStandard?: string;
    }> = [];

    // Check for accounts without standards
    const unmappedAccounts = accounts.filter((account) => account.standardLinks.length === 0);
    if (unmappedAccounts.length > 0) {
      recommendations.push({
        type: 'warning',
        message: `${unmappedAccounts.length} accounts have no standards references`,
      });
    }

    // Check for special accounts missing required standards
    for (const account of accounts) {
      if (account.specialAccountType) {
        const requiredStandards = this.getRequiredStandardsForSpecialType(
          account.specialAccountType,
        );
        const currentStandards = account.standardLinks.map((link) => link.sectionCode);

        for (const required of requiredStandards) {
          if (!currentStandards.some((current) => current.includes(required))) {
            recommendations.push({
              type: 'error',
              message: `Account ${account.accountCode} should reference ${required}`,
              accountCode: account.accountCode,
              suggestedStandard: required,
            });
          }
        }
      }
    }

    // Check for potential IFRS crosswalk opportunities
    const mfrsAccounts = accounts.filter((account) =>
      account.standardLinks.some((link) => link.sectionCode.includes('MFRS')),
    );

    if (mfrsAccounts.length > 0) {
      recommendations.push({
        type: 'info',
        message: `${mfrsAccounts.length} accounts have MFRS references. Consider adding IFRS crosswalk for international compliance.`,
      });
    }

    return recommendations;
  }

  /**
   * Suggest standards for an unmapped account
   */
  private suggestStandardsForAccount(account: TenantCoaAccount): Array<{
    accountCode: string;
    suggestedStandard: string;
    confidence: number;
    reason: string;
  }> {
    const suggestions: Array<{
      accountCode: string;
      suggestedStandard: string;
      confidence: number;
      reason: string;
    }> = [];

    // Suggest based on account type
    switch (account.accountType) {
      case 'Asset':
        if (account.accountName.toLowerCase().includes('cash')) {
          suggestions.push({
            accountCode: account.accountCode,
            suggestedStandard: 'MFRS 7',
            confidence: 0.9,
            reason: 'Cash accounts should reference MFRS 7 (Statement of Cash Flows)',
          });
        } else if (account.accountName.toLowerCase().includes('receivable')) {
          suggestions.push({
            accountCode: account.accountCode,
            suggestedStandard: 'MFRS 9',
            confidence: 0.9,
            reason: 'Receivables should reference MFRS 9 (Financial Instruments)',
          });
        } else if (
          account.accountName.toLowerCase().includes('equipment') ||
          account.accountName.toLowerCase().includes('plant')
        ) {
          suggestions.push({
            accountCode: account.accountCode,
            suggestedStandard: 'MFRS 116',
            confidence: 0.9,
            reason: 'PPE accounts should reference MFRS 116 (Property, Plant and Equipment)',
          });
        }
        break;
      case 'Liability':
        if (account.accountName.toLowerCase().includes('payable')) {
          suggestions.push({
            accountCode: account.accountCode,
            suggestedStandard: 'MFRS 9',
            confidence: 0.8,
            reason: 'Payables should reference MFRS 9 (Financial Instruments)',
          });
        }
        break;
      case 'Revenue':
        suggestions.push({
          accountCode: account.accountCode,
          suggestedStandard: 'MFRS 15',
          confidence: 0.9,
          reason:
            'Revenue accounts should reference MFRS 15 (Revenue from Contracts with Customers)',
        });
        break;
    }

    return suggestions;
  }

  /**
   * Get required standards for special account types
   */
  private getRequiredStandardsForSpecialType(specialType: string): string[] {
    switch (specialType) {
      case 'AccumulatedDepreciation':
      case 'DepreciationExpense':
        return ['MFRS 116'];
      case 'Goodwill':
        return ['MFRS 3', 'MFRS 136'];
      case 'NciEquity':
        return ['MFRS 10'];
      case 'CtaEquity':
        return ['MFRS 121'];
      case 'Contra':
        return ['MFRS 9'];
      default:
        return [];
    }
  }

  /**
   * Validate companion relationships
   */
  private validateCompanionRelationships(
    account: TenantCoaAccount,
    errors: string[],
    warnings: string[],
  ): void {
    if (
      account.companions?.accumulatedDepreciationCode &&
      account.companions?.depreciationExpenseCode
    ) {
      // This is a depreciable asset - should have MFRS 116 references
      const hasMfrs116 = account.standardLinks.some((link) =>
        link.sectionCode.includes('MFRS 116'),
      );
      if (!hasMfrs116) {
        warnings.push(`Depreciable asset ${account.accountCode} should reference MFRS 116`);
      }
    }
  }

  /**
   * Find outdated standards references
   */
  private findOutdatedReferences(standardLinks: Array<{ sectionCode: string }>): string[] {
    const outdated: string[] = [];

    // This would check against a database of current standards versions
    // For now, we'll just check for obviously outdated references
    for (const link of standardLinks) {
      if (link.sectionCode.includes('MFRS 2009') || link.sectionCode.includes('FRS 2009')) {
        outdated.push(link.sectionCode);
      }
    }

    return outdated;
  }

  /**
   * Extract standard code from section code
   */
  private extractStandardFromSectionCode(sectionCode: string): string | null {
    const match = sectionCode.match(/^(MFRS|IFRS|IAS)\s+\d+/);
    return match ? match[0] : null;
  }

  /**
   * Generate crosswalk suggestions for IFRS compliance
   */
  async generateIfrsCrosswalkSuggestions(
    accounts: TenantCoaAccount[],
  ): Promise<Map<string, string[]>> {
    const crosswalkMap = new Map<string, string[]>();

    // MFRS to IFRS mappings - static mapping for security
    const mfrsToIfrsMap: Record<string, string[]> = {
      'MFRS 1': ['IAS 1'],
      'MFRS 3': ['IFRS 3'],
      'MFRS 7': ['IAS 7'],
      'MFRS 9': ['IFRS 9'],
      'MFRS 10': ['IFRS 10'],
      'MFRS 15': ['IFRS 15'],
      'MFRS 16': ['IAS 16'],
      'MFRS 21': ['IAS 21'],
      'MFRS 28': ['IAS 28'],
      'MFRS 102': ['IAS 1'],
      'MFRS 121': ['IAS 21'],
      'MFRS 123': ['IAS 23'],
      'MFRS 128': ['IAS 28'],
      'MFRS 136': ['IAS 36'],
    };

    for (const account of accounts) {
      const ifrsSuggestions: string[] = [];

      for (const link of account.standardLinks) {
        const standard = this.extractStandardFromSectionCode(link.sectionCode);
        if (standard && Object.prototype.hasOwnProperty.call(mfrsToIfrsMap, standard)) {
          const mappedStandards = Object.getOwnPropertyDescriptor(mfrsToIfrsMap, standard)?.value;
          if (Array.isArray(mappedStandards)) {
            ifrsSuggestions.push(...mappedStandards);
          }
        }
      }

      if (ifrsSuggestions.length > 0) {
        crosswalkMap.set(account.accountCode, ifrsSuggestions);
      }
    }

    return crosswalkMap;
  }

  /**
   * Generate tax form data for Malaysian SST
   */
  async generateMalaysianSSTForm(
    tenantId: string,
    reportingPeriod: string,
    companyInfo: TaxFormData['companyInfo'],
  ): Promise<TaxFormData> {
    // This would typically fetch data from the accounting system
    const financialData = await this.getFinancialDataForPeriod(tenantId, reportingPeriod);
    const taxCalculations = this.calculateSSTTax(financialData);

    return {
      formType: 'SST-02',
      jurisdiction: 'MY',
      reportingPeriod,
      companyInfo,
      financialData,
      taxCalculations,
      supportingDocuments: [],
    };
  }

  /**
   * Generate Singapore GST form
   */
  async generateSingaporeGSTForm(
    tenantId: string,
    reportingPeriod: string,
    companyInfo: TaxFormData['companyInfo'],
  ): Promise<TaxFormData> {
    const financialData = await this.getFinancialDataForPeriod(tenantId, reportingPeriod);
    const taxCalculations = this.calculateGSTTax(financialData);

    return {
      formType: 'GST-03',
      jurisdiction: 'SG',
      reportingPeriod,
      companyInfo,
      financialData,
      taxCalculations,
      supportingDocuments: [],
    };
  }

  /**
   * Generate audit package for compliance
   */
  async generateAuditPackage(
    tenantId: string,
    reportingPeriod: string,
    jurisdiction: 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH',
  ): Promise<AuditPackage> {
    const packageId = `audit-${tenantId}-${reportingPeriod}-${Date.now()}`;

    // Generate various audit files
    const files = await this.generateAuditFiles(tenantId, reportingPeriod, jurisdiction);

    return {
      packageId,
      jurisdiction,
      reportingPeriod,
      generatedAt: new Date(),
      includes: {
        trialBalance: true,
        generalLedger: true,
        journalEntries: true,
        supportingDocuments: true,
        complianceReports: true,
      },
      files,
    };
  }

  /**
   * Generate regulatory compliance report
   */
  async generateRegulatoryReport(
    tenantId: string,
    reportType: 'TAX_RETURN' | 'AUDIT_PACKAGE' | 'STATISTICAL' | 'COMPLIANCE',
    jurisdiction: 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH',
    reportingPeriod: string,
  ): Promise<RegulatoryReport> {
    const reportId = `${reportType.toLowerCase()}-${tenantId}-${reportingPeriod}-${Date.now()}`;

    let data: Record<string, unknown> = {};

    switch (reportType) {
      case 'TAX_RETURN':
        data = await this.generateTaxReturnData(tenantId, jurisdiction, reportingPeriod);
        break;
      case 'AUDIT_PACKAGE':
        data = await this.generateAuditPackageData(tenantId, jurisdiction, reportingPeriod);
        break;
      case 'STATISTICAL':
        data = await this.generateStatisticalData(tenantId, jurisdiction, reportingPeriod);
        break;
      case 'COMPLIANCE':
        data = await this.generateComplianceData(tenantId, jurisdiction, reportingPeriod);
        break;
    }

    return {
      reportId,
      reportType,
      jurisdiction,
      reportingPeriod,
      generatedAt: new Date(),
      status: 'DRAFT',
      data,
      attachments: [],
    };
  }

  /**
   * Get financial data for a specific period
   */
  private async getFinancialDataForPeriod(
    _tenantId: string,
    _reportingPeriod: string,
  ): Promise<Record<string, number>> {
    // This would typically query the accounting database
    // For now, return mock data
    return {
      totalRevenue: 100000,
      totalExpenses: 80000,
      netProfit: 20000,
      totalAssets: 500000,
      totalLiabilities: 300000,
      totalEquity: 200000,
    };
  }

  /**
   * Calculate SST tax for Malaysian compliance
   */
  private calculateSSTTax(financialData: Record<string, number>): Record<string, number> {
    const taxableRevenue = (financialData.totalRevenue ?? 0) * 0.8; // Assume 80% is taxable
    const sstRate = 0.06; // 6% SST rate
    const sstAmount = taxableRevenue * sstRate;

    return {
      taxableRevenue,
      sstRate,
      sstAmount,
      exemptRevenue: (financialData.totalRevenue ?? 0) * 0.2,
    };
  }

  /**
   * Calculate GST tax for Singapore compliance
   */
  private calculateGSTTax(financialData: Record<string, number>): Record<string, number> {
    const taxableRevenue = (financialData.totalRevenue ?? 0) * 0.9; // Assume 90% is taxable
    const gstRate = 0.07; // 7% GST rate
    const gstAmount = taxableRevenue * gstRate;

    return {
      taxableRevenue,
      gstRate,
      gstAmount,
      zeroRatedRevenue: (financialData.totalRevenue ?? 0) * 0.1,
    };
  }

  /**
   * Generate audit files
   */
  private async generateAuditFiles(
    _tenantId: string,
    reportingPeriod: string,
    _jurisdiction: 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH',
  ): Promise<Array<{ fileName: string; fileType: string; size: number; checksum: string }>> {
    // This would generate actual audit files
    return [
      {
        fileName: `trial-balance-${reportingPeriod}.xlsx`,
        fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 1024000,
        checksum: 'sha256:abc123...',
      },
      {
        fileName: `general-ledger-${reportingPeriod}.pdf`,
        fileType: 'application/pdf',
        size: 2048000,
        checksum: 'sha256:def456...',
      },
      {
        fileName: `journal-entries-${reportingPeriod}.csv`,
        fileType: 'text/csv',
        size: 512000,
        checksum: 'sha256:ghi789...',
      },
    ];
  }

  /**
   * Generate tax return data
   */
  private async generateTaxReturnData(
    tenantId: string,
    jurisdiction: 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH',
    reportingPeriod: string,
  ): Promise<Record<string, unknown>> {
    const financialData = await this.getFinancialDataForPeriod(tenantId, reportingPeriod);

    switch (jurisdiction) {
      case 'MY':
        return this.calculateSSTTax(financialData);
      case 'SG':
        return this.calculateGSTTax(financialData);
      default:
        return financialData;
    }
  }

  /**
   * Generate audit package data
   */
  private async generateAuditPackageData(
    tenantId: string,
    jurisdiction: 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH',
    reportingPeriod: string,
  ): Promise<Record<string, unknown>> {
    return {
      trialBalance: await this.getTrialBalance(tenantId, reportingPeriod),
      generalLedger: await this.getGeneralLedger(tenantId, reportingPeriod),
      journalEntries: await this.getJournalEntries(tenantId, reportingPeriod),
      complianceStatus: await this.getComplianceStatus(tenantId, jurisdiction),
    };
  }

  /**
   * Generate statistical data
   */
  private async generateStatisticalData(
    tenantId: string,
    jurisdiction: 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH',
    reportingPeriod: string,
  ): Promise<Record<string, unknown>> {
    return {
      revenueByMonth: await this.getRevenueByMonth(tenantId, reportingPeriod),
      expenseByCategory: await this.getExpenseByCategory(tenantId, reportingPeriod),
      assetBreakdown: await this.getAssetBreakdown(tenantId, reportingPeriod),
      liabilityBreakdown: await this.getLiabilityBreakdown(tenantId, reportingPeriod),
    };
  }

  /**
   * Generate compliance data
   */
  private async generateComplianceData(
    tenantId: string,
    _jurisdiction: 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH',
    _reportingPeriod: string,
  ): Promise<Record<string, unknown>> {
    const accounts = await this.getTenantAccounts(tenantId);
    const complianceReport = await this.generateComplianceReport(tenantId, accounts);

    return {
      compliancePercentage: complianceReport.compliancePercentage,
      standardsCoverage: complianceReport.standardsCoverage,
      unmappedAccounts: complianceReport.unmappedAccounts,
      recommendations: complianceReport.recommendations,
    };
  }

  // Mock methods for data retrieval (these would typically query the database)
  private async getTrialBalance(_tenantId: string, _reportingPeriod: string): Promise<unknown> {
    return { mock: 'trial balance data' };
  }

  private async getGeneralLedger(_tenantId: string, _reportingPeriod: string): Promise<unknown> {
    return { mock: 'general ledger data' };
  }

  private async getJournalEntries(_tenantId: string, _reportingPeriod: string): Promise<unknown> {
    return { mock: 'journal entries data' };
  }

  private async getComplianceStatus(_tenantId: string, _jurisdiction: string): Promise<unknown> {
    return { mock: 'compliance status data' };
  }

  private async getRevenueByMonth(_tenantId: string, _reportingPeriod: string): Promise<unknown> {
    return { mock: 'revenue by month data' };
  }

  private async getExpenseByCategory(
    _tenantId: string,
    _reportingPeriod: string,
  ): Promise<unknown> {
    return { mock: 'expense by category data' };
  }

  private async getAssetBreakdown(_tenantId: string, _reportingPeriod: string): Promise<unknown> {
    return { mock: 'asset breakdown data' };
  }

  private async getLiabilityBreakdown(
    _tenantId: string,
    _reportingPeriod: string,
  ): Promise<unknown> {
    return { mock: 'liability breakdown data' };
  }

  private async getTenantAccounts(_tenantId: string): Promise<TenantCoaAccount[]> {
    return []; // Mock empty array
  }
}
