/**
 * Standards Compliance Types for MFRS/IFRS Accounting
 *
 * This module defines the core types for standards tracking, template management,
 * and compliance reporting in a multi-standard accounting system.
 */

export type Jurisdiction = 'MY' | 'SG' | 'TH' | 'VN' | 'GLOBAL';

export type StandardRelation = 'equivalent' | 'broader' | 'narrower' | 'related' | 'supersedes';

export interface StandardReference {
  /** Standard identifier (e.g., 'MFRS 116', 'IAS 16', 'IFRS 10') */
  standard: string;
  /** Section within the standard (e.g., 'Recognition', 'Measurement') */
  section: string;
  /** Specific paragraphs referenced (e.g., ['7', '16', '30'] or ['59-64']) */
  paragraphs?: string[];
  /** Confidence score for automated mappings (0.0 to 1.0) */
  confidence?: number;
  /** Additional notes about this reference */
  notes?: string;
}

export interface StandardSection {
  sectionId: string;
  standardId: string;
  sectionCode: string;
  title: string;
  description?: string;
  paragraphs: string[];
  effectiveDate?: Date;
  supersededDate?: Date;
  isActive: boolean;
}

export interface StandardCrosswalk {
  fromSectionId: string;
  toSectionId: string;
  relation: StandardRelation;
  confidenceScore: number;
  notes?: string;
}

export interface CoaTemplateAccount {
  /** Account code (e.g., '1600') */
  code: string;
  /** Account name (e.g., 'Property, Plant and Equipment') */
  name: string;
  /** Account type */
  type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  /** Parent account code */
  parent?: string;
  /** Whether posting is allowed to this account */
  postingAllowed?: boolean;
  /** Special account type for advanced accounting rules */
  specialAccountType?: string;
  /** Companion account relationships */
  companions?: {
    accumulatedDepreciationCode?: string;
    depreciationExpenseCode?: string;
    allowanceAccountCode?: string;
  };
  /** Primary standard references (e.g., MFRS) */
  mfrsRefs?: StandardReference[];
  /** Secondary standard references (e.g., IFRS) */
  ifrsRefs?: StandardReference[];
  /** Additional standard references */
  otherRefs?: StandardReference[];
  /** Implementation notes */
  notes?: string;
  /** Searchable tags */
  tags?: string[];
  /** Sort order within template */
  sortOrder?: number;
}

export interface CoaTemplate {
  templateId: string;
  name: string;
  version: string;
  jurisdiction: Jurisdiction;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  accounts: CoaTemplateAccount[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantCoaAccount {
  coaId: string;
  tenantId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  parentCode?: string;
  postingAllowed: boolean;
  specialAccountType?: string;
  companions?: Record<string, string>;
  templateOrigin?: string;
  templateDiff?: Record<string, unknown>;
  isActive: boolean;
  standardLinks: StandardSection[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StandardsComplianceReport {
  tenantId: string;
  totalAccounts: number;
  compliantAccounts: number;
  compliancePercentage: number;
  standardsCoverage: {
    standard: string;
    accountsLinked: number;
    totalAccounts: number;
    percentage: number;
  }[];
  unmappedAccounts: {
    accountCode: string;
    accountName: string;
    accountType: string;
  }[];
  recommendations: {
    type: 'warning' | 'error' | 'info';
    message: string;
    accountCode?: string;
    suggestedStandard?: string;
  }[];
}

export interface TemplateImportOptions {
  /** Whether to update existing accounts */
  upsert?: boolean;
  /** Whether to preserve existing standard links */
  preserveExistingLinks?: boolean;
  /** Whether to validate all references before import */
  validateReferences?: boolean;
  /** Whether to create audit log entries */
  createAuditLog?: boolean;
}

export interface StandardsValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: {
    accountCode: string;
    suggestedStandard: string;
    confidence: number;
    reason: string;
  }[];
}

/**
 * Template bundle structure for file-based templates
 */
export interface TemplateBundle {
  /** Bundle metadata */
  metadata: {
    name: string;
    version: string;
    jurisdiction: Jurisdiction;
    description: string;
    effectiveDate: string;
    createdBy: string;
    standards: string[];
  };
  /** Account definitions */
  accounts: CoaTemplateAccount[];
  /** Standard definitions included in this bundle */
  standards: {
    code: string;
    name: string;
    version: string;
    sections: {
      sectionCode: string;
      title: string;
      description?: string;
      paragraphs: string[];
    }[];
  }[];
  /** Crosswalk mappings to other standards */
  crosswalks?: {
    fromStandard: string;
    toStandard: string;
    mappings: {
      fromSection: string;
      toSection: string;
      relation: StandardRelation;
      confidence: number;
    }[];
  }[];
}

/**
 * Standards API response types
 */
export interface StandardsApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
  metadata?: {
    totalCount?: number;
    page?: number;
    pageSize?: number;
    hasMore?: boolean;
  };
}

/**
 * Template application result
 */
export interface TemplateApplicationResult {
  templateId: string;
  tenantId: string;
  accountsCreated: number;
  accountsUpdated: number;
  accountsSkipped: number;
  standardLinksCreated: number;
  errors: string[];
  warnings: string[];
  appliedAt: Date;
}
