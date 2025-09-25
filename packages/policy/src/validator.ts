import type { Policy, ValidationResult } from './types';

export class PolicyValidator {
  validatePolicy(policy: Policy): ValidationResult {
    const errors: string[] = [];

    // Check for SoD violations in role definitions
    for (const [roleName, actions] of Object.entries(policy.roles)) {
      if (violatesSoD(actions)) {
        errors.push(`Role "${roleName}" violates SoD: cannot have both post and approve actions`);
      }
    }

    // Validate ABAC rules
    for (const [action, rule] of Object.entries(policy.abac)) {
      if (rule.maxAmount && typeof rule.maxAmount.default !== 'number') {
        errors.push(`ABAC rule for "${action}" has invalid maxAmount.default`);
      }
    }

    // Validate workflow tiers
    for (const [action, workflow] of Object.entries(policy.workflows)) {
      for (const tier of workflow.tiers) {
        if (tier.max !== 'Infinity' && typeof tier.max !== 'number') {
          errors.push(`Workflow "${action}" has invalid tier max value`);
        }
        if (!Array.isArray(tier.approvers) || tier.approvers.length === 0) {
          errors.push(`Workflow "${action}" tier must have at least one approver`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }
}

function violatesSoD(actions: string[]): boolean {
  const SOD_CONSTRAINTS: [string, string][] = [['journal:post', 'journal:approve']];
  return SOD_CONSTRAINTS.some(([a, b]) => actions.includes(a) && actions.includes(b));
}
