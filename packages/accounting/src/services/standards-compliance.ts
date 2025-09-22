/**
 * Standards Compliance Service
 *
 * Provides comprehensive standards compliance reporting, validation,
 * and crosswalk functionality for multi-standard accounting systems.
 */

import type {
  StandardsComplianceReport,
  StandardsValidationResult,
  TenantCoaAccount,
} from '../types/standards';

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
}
