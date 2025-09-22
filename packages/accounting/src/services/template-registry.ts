import type {
  CoaTemplate,
  CoaTemplateAccount,
  Jurisdiction,
  TemplateBundle,
} from '../types/standards';

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { parse as parseYaml } from 'yaml';

/**
 * Manages the loading and parsing of Chart of Accounts template bundles
 * from the file system. These templates define standard COA structures
 * aligned with various accounting standards (e.g., MFRS, IFRS).
 */
export class TemplateRegistry {
  private static readonly TEMPLATE_BASE_PATH = path.join(process.cwd(), 'templates', 'coa');

  /**
   * Loads a specific template bundle by jurisdiction and version.
   * @param jurisdiction - The jurisdiction code (e.g., 'MFRS', 'IFRS').
   * @param version - The version of the template (e.g., '2024.09').
   * @returns A Promise that resolves to the loaded TemplateBundle.
   * @throws Error if the template bundle cannot be found or parsed.
   */
  public async loadTemplateBundle(
    jurisdiction: Jurisdiction,
    version: string,
  ): Promise<TemplateBundle> {
    const bundlePath = path.join(
      TemplateRegistry.TEMPLATE_BASE_PATH,
      jurisdiction.toLowerCase(),
      version,
    );
    const indexPath = path.join(bundlePath, 'index.yaml');

    try {
      const indexContent = await fs.readFile(indexPath, 'utf8');
      const template = parseYaml(indexContent) as CoaTemplate;

      const accountsDirectory = path.join(bundlePath, 'accounts');
      const accountFiles = await fs.readdir(accountsDirectory);

      const accountPromises = accountFiles
        .filter((file) => file.endsWith('.yaml'))
        .map(async (file) => {
          const filePath = path.join(accountsDirectory, file);
          const fileContent = await fs.readFile(filePath, 'utf8');
          return this.normalizeAccount(parseYaml(fileContent));
        });

      const accounts = await Promise.all(accountPromises);

      // Placeholder for standards and crosswalks, would be loaded from separate files or DB
      const standards: Array<{
        code: string;
        name: string;
        version: string;
        sections: Array<{
          sectionCode: string;
          title: string;
          description?: string;
          paragraphs: string[];
        }>;
      }> = [];
      const crosswalks: Array<{
        fromStandard: string;
        toStandard: string;
        mappings: Array<{
          fromSection: string;
          toSection: string;
          relation: 'equivalent' | 'broader' | 'narrower' | 'related';
          confidence: number;
        }>;
      }> = [];

      return {
        metadata: {
          name: template.name,
          version: template.version,
          jurisdiction: template.jurisdiction,
          description: template.description || '',
          effectiveDate: new Date().toISOString().split('T')[0] || '2024-01-01',
          createdBy: 'system',
          standards: this.extractStandardsFromTemplate(template),
        },
        accounts: accounts.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
        standards: standards,
        crosswalks: crosswalks,
      };
    } catch (error) {
      throw new Error(`Failed to load template bundle ${jurisdiction}/${version}: ${error}`);
    }
  }

  /**
   * Lists all available template bundles.
   * @returns A Promise that resolves to an array of metadata for available bundles.
   */
  public async listAvailableBundles(): Promise<
    Array<{ jurisdiction: Jurisdiction; version: string; name: string; description?: string }>
  > {
    const bundles: Array<{
      jurisdiction: Jurisdiction;
      version: string;
      name: string;
      description?: string;
    }> = [];
    const jurisdictions = await fs.readdir(TemplateRegistry.TEMPLATE_BASE_PATH);

    for (const jurisdiction of jurisdictions) {
      const jurisdictionPath = path.join(TemplateRegistry.TEMPLATE_BASE_PATH, jurisdiction);
      const versions = await fs.readdir(jurisdictionPath);

      for (const version of versions) {
        const indexPath = path.join(jurisdictionPath, version, 'index.yaml');
        try {
          const indexContent = await fs.readFile(indexPath, 'utf8');
          const template = parseYaml(indexContent) as CoaTemplate;
          bundles.push({
            jurisdiction: template.jurisdiction,
            version: template.version,
            name: template.name,
            description: template.description,
          });
        } catch (error) {
          console.warn(
            `Could not load index.yaml for ${jurisdiction}/${version}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    }
    return bundles;
  }

  /**
   * Retrieves the default template bundle for a given jurisdiction.
   * Assumes 'index.yaml' contains an 'isDefault: true' flag or similar logic.
   * For simplicity, this example just picks the latest version.
   * @param jurisdiction - The jurisdiction code.
   * @returns A Promise that resolves to the default TemplateBundle.
   */
  public async getDefaultTemplateBundle(jurisdiction: Jurisdiction): Promise<TemplateBundle> {
    const jurisdictionPath = path.join(
      TemplateRegistry.TEMPLATE_BASE_PATH,
      jurisdiction.toLowerCase(),
    );
    const versions = await fs.readdir(jurisdictionPath);
    if (versions.length === 0) {
      throw new Error(`No template versions found for jurisdiction ${jurisdiction}`);
    }
    // Simple logic: pick the latest version lexicographically
    const latestVersion = versions.sort().pop();
    if (!latestVersion) {
      throw new Error(`Could not determine latest version for jurisdiction ${jurisdiction}`);
    }
    return this.loadTemplateBundle(jurisdiction, latestVersion);
  }

  /**
   * Extracts unique standard codes from a CoaTemplate.
   */
  private extractStandardsFromTemplate(template: CoaTemplate): string[] {
    const standards = new Set<string>();
    template.accounts.forEach((account) => {
      account.mfrsRefs?.forEach((ref) => standards.add(ref.standard));
      account.ifrsRefs?.forEach((ref) => standards.add(ref.standard));
      account.otherRefs?.forEach((ref) => standards.add(ref.standard));
    });
    return Array.from(standards);
  }

  /**
   * Normalize account data from template files
   */
  private normalizeAccount(account: Record<string, unknown>): CoaTemplateAccount {
    return {
      code: account.code as string,
      name: account.name as string,
      type: account.type as 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense',
      parent: account.parent as string | undefined,
      postingAllowed: (account.postingAllowed as boolean) ?? true,
      specialAccountType: account.specialAccountType as string | undefined,
      companions: account.companions as Record<string, string> | undefined,
      mfrsRefs: (account.mfrs_refs || account.mfrsRefs) as
        | Array<{
            standard: string;
            section: string;
            paragraphs?: string[];
          }>
        | undefined,
      ifrsRefs: (account.ifrs_refs || account.ifrsRefs) as
        | Array<{
            standard: string;
            section: string;
            paragraphs?: string[];
          }>
        | undefined,
      otherRefs: (account.other_refs || account.otherRefs) as
        | Array<{
            standard: string;
            section: string;
            paragraphs?: string[];
          }>
        | undefined,
      notes: account.notes as string | undefined,
      tags: (account.tags as string[]) || [],
      sortOrder: (account.sortOrder as number) || 0,
    };
  }

  /**
   * Create a template bundle from a template
   */
  createTemplateBundle(template: CoaTemplate): TemplateBundle {
    return {
      metadata: {
        name: template.name,
        version: template.version,
        jurisdiction: template.jurisdiction,
        description: template.description || '',
        effectiveDate: new Date().toISOString().split('T')[0] || '2024-01-01',
        createdBy: 'system',
        standards: this.extractStandardsFromTemplate(template),
      },
      accounts: template.accounts,
      standards: [], // Would be populated from database
      crosswalks: [], // Would be populated from database
    };
  }
}
