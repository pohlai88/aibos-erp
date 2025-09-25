import type { Action, Context, Policy } from './types';

export function can(
  actions: Action[],
  userRoles: string[],
  context: Context,
  policy: Policy,
): boolean {
  // 1) Expand role bundles per tenant policy
  const allowed = new Set(
    userRoles.flatMap((role) => {
      // eslint-disable-next-line security/detect-object-injection
      return policy.roles[role] ?? [];
    }),
  );

  // 2) Invariant SoD check (non-negotiable)
  if (violatesSoD(actions)) {
    return false;
  }

  // 3) All requested actions must be allowed by role bundle
  if (!actions.every((action) => allowed.has(action))) {
    return false;
  }

  // 4) ABAC (tenant-configurable)
  for (const action of actions) {
    // eslint-disable-next-line security/detect-object-injection
    const rule = policy.abac[action];
    if (!rule) {
      continue;
    }

    // Self-approval ban
    if (
      rule.banSelfApproval &&
      action === 'journal:approve' &&
      context.createdBy === context.currentUserId
    ) {
      return false;
    }

    // Amount thresholds - use Object.hasOwn for security
    const defaultLimit = rule.maxAmount?.default ?? Number.POSITIVE_INFINITY;
    const roleLimits = userRoles.map((role) => {
      return Object.hasOwn(rule.maxAmount ?? {}, role)
        ? // eslint-disable-next-line security/detect-object-injection
          (rule.maxAmount?.[role] ?? Number.NEGATIVE_INFINITY)
        : Number.NEGATIVE_INFINITY;
    });
    const limit = Math.max(defaultLimit, ...roleLimits);
    if ((context.amount ?? 0) > limit) {
      return false;
    }
  }

  return true;
}

function violatesSoD(actions: Action[]): boolean {
  const SOD_CONSTRAINTS: [Action, Action][] = [['journal:post', 'journal:approve']];
  return SOD_CONSTRAINTS.some(([a, b]) => actions.includes(a) && actions.includes(b));
}
