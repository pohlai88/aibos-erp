import type { Policy, PolicyScenario, SimulationResult } from './types';

import { can } from './evaluator';

export function simulatePolicy(scenario: PolicyScenario, policy: Policy): SimulationResult {
  const result = can(scenario.actions, scenario.userRoles, scenario.context, policy);
  return {
    allowed: result,
    reason: result ? 'Policy allows' : 'Policy denies',
    violatedConstraints: violatesSoD(scenario.actions) ? ['SoD'] : [],
    appliedRules: extractAppliedRules(scenario, policy),
  };
}

function violatesSoD(actions: string[]): boolean {
  const SOD_CONSTRAINTS: [string, string][] = [['journal:post', 'journal:approve']];
  return SOD_CONSTRAINTS.some(([a, b]) => actions.includes(a) && actions.includes(b));
}

function extractAppliedRules(scenario: PolicyScenario, policy: Policy): string[] {
  const appliedRules: string[] = [];

  // Check role-based rules
  for (const role of scenario.userRoles) {
    // eslint-disable-next-line security/detect-object-injection
    const roleActions = policy.roles[role];
    if (roleActions) {
      appliedRules.push(`Role: ${role} -> [${roleActions.join(', ')}]`);
    }
  }

  // Check ABAC rules
  for (const action of scenario.actions) {
    // eslint-disable-next-line security/detect-object-injection
    const rule = policy.abac[action];
    if (rule) {
      if (rule.banSelfApproval) {
        appliedRules.push(`ABAC: ${action} bans self-approval`);
      }
      if (rule.maxAmount) {
        appliedRules.push(`ABAC: ${action} has amount limits`);
      }
    }
  }

  // Check workflow rules
  for (const action of scenario.actions) {
    // eslint-disable-next-line security/detect-object-injection
    const workflow = policy.workflows[action];
    if (workflow) {
      appliedRules.push(`Workflow: ${action} has ${workflow.tiers.length} tiers`);
    }
  }

  return appliedRules;
}
