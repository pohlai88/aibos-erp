import { z } from 'zod';

export type Action = 'journal:post' | 'journal:approve' | 'report:view' | 'bulk:import';
export type Role = string; // Tenant-configurable roles

export interface Policy {
  version: string;
  roles: Record<string, Action[]>;
  abac: Record<Action, ABACRule>;
  workflows: Record<Action, WorkflowRule>;
}

export interface ABACRule {
  maxAmount?: { default: number; [role: string]: number };
  banSelfApproval?: boolean;
  entityScope?: string[];
}

export interface WorkflowRule {
  tiers: WorkflowTier[];
}

export interface WorkflowTier {
  max: number | 'Infinity';
  approvers: string[];
  requiresTwoManRule?: boolean;
}

export interface Context {
  tenantId: string;
  currentUserId: string;
  createdBy?: string;
  amount?: number;
  entityScope?: Record<string, string>;
}

export interface PolicyDecisionRequest {
  actions: Action[];
  userRoles: string[];
  context: Context;
  correlationId: string;
}

export interface PolicyDecision {
  id: string;
  allowed: boolean;
  reason: string;
  policyVersion: string;
  correlationId: string;
  timestamp: Date;
}

export interface PolicyScenario {
  actions: Action[];
  userRoles: string[];
  context: Context;
}

export interface SimulationResult {
  allowed: boolean;
  reason: string;
  violatedConstraints: string[];
  appliedRules: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Invariant SoD constraints (non-negotiable)
export const SOD_CONSTRAINTS: [Action, Action][] = [['journal:post', 'journal:approve']];

export function violatesSoD(actions: Action[]): boolean {
  return SOD_CONSTRAINTS.some(([a, b]) => actions.includes(a) && actions.includes(b));
}

// Zod schemas for validation
export const ActionSchema = z.enum([
  'journal:post',
  'journal:approve',
  'report:view',
  'bulk:import',
]);

export const ABACRuleSchema = z.object({
  maxAmount: z.record(z.string(), z.number()).optional(),
  banSelfApproval: z.boolean().optional(),
  entityScope: z.array(z.string()).optional(),
});

export const WorkflowTierSchema = z.object({
  max: z.union([z.number(), z.literal('Infinity')]),
  approvers: z.array(z.string()),
  requiresTwoManRule: z.boolean().optional(),
});

export const WorkflowRuleSchema = z.object({
  tiers: z.array(WorkflowTierSchema),
});

export const PolicySchema = z.object({
  version: z.string(),
  roles: z.record(z.string(), z.array(ActionSchema)),
  abac: z.record(ActionSchema, ABACRuleSchema),
  workflows: z.record(ActionSchema, WorkflowRuleSchema),
});

export const ContextSchema = z.object({
  tenantId: z.string(),
  currentUserId: z.string(),
  createdBy: z.string().optional(),
  amount: z.number().optional(),
  entityScope: z.record(z.string(), z.string()).optional(),
});

export const PolicyDecisionRequestSchema = z.object({
  actions: z.array(ActionSchema),
  userRoles: z.array(z.string()),
  context: ContextSchema,
  correlationId: z.string(),
});
