# 🏗️ Enterprise Accounting Foundation

**Document**: Foundation Architecture & Core Infrastructure  
**Version**: 1.0  
**Status**: Ready for Implementation  
**Timeline**: Phase 0.5 (1-2 days) + Phase 1 (Week 1-2)

---

## 📋 **Overview**

This document outlines the foundational architecture and core infrastructure required for enterprise-grade accounting systems. It focuses on policy-as-code, observability, CQRS projections, and security foundations.

---

## 🎯 **Phase 0.5: Hardening Sprint (1-2 days) - DO FIRST**

### **0.5.1 Architecture Foundation**

**Files to Create:**

- `packages/policy/` - Policy-as-Code SDK (types, validator, evaluator, simulator)
- `packages/observability/` - Structured logging, metrics, audit tracing
- `packages/accounting/src/projections/` - CQRS read models with health monitoring
- `packages/accounting/src/period-close/` - Period close engine with snapshots
- `packages/accounting/src/fx-rates/` - FX policy with three-rate model
- `packages/accounting/src/migration/` - Zero-downtime migration orchestrator
- `apps/web/src/app/providers/QueryProvider.tsx` - TanStack Query setup
- `apps/web/src/middleware.ts` - Enhanced security headers & CSP

**Implementation:**

```typescript
// packages/policy/src/types.ts
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

// Invariant SoD constraints (non-negotiable)
export const SOD_CONSTRAINTS: [Action, Action][] = [['journal:post', 'journal:approve']];

export function violatesSoD(actions: Action[]): boolean {
  return SOD_CONSTRAINTS.some(([a, b]) => actions.includes(a) && actions.includes(b));
}
```

### **0.5.2 CQRS Read Models with Health Monitoring**

**Files to Create:**

- `packages/accounting/src/projections/gl-balances-daily.ts`
- `packages/accounting/src/projections/approval-queue.ts`
- `packages/accounting/src/projections/audit-view.ts`
- `packages/accounting/src/projections/projection-health.ts`

**Implementation:**

```typescript
// packages/accounting/src/projections/gl-balances-daily.ts
export class GLBalancesDailyProjection {
  async materialize(tenantId: string, asOfDate: Date) {
    // Materialize daily balances from events
    // Track lastEventId and checksum for health monitoring
    const result = await this.processEvents(tenantId, asOfDate);
    await this.updateProjectionHealth(tenantId, {
      lastEventId: result.lastEventId,
      checksum: result.checksum,
      materializedAt: new Date(),
    });
  }

  async getTrialBalance(tenantId: string, asOfDate: Date) {
    // Fast read from materialized view
    // Tag with source: "projection" for UI clarity
    const data = await this.readProjection(tenantId, asOfDate);
    return { ...data, source: 'projection', asOf: asOfDate };
  }

  async verifyProjectionParity(tenantId: string, asOfDate: Date) {
    // Daily parity check: projection vs raw event replay
    const projectionSum = await this.getProjectionSum(tenantId, asOfDate);
    const eventSum = await this.replayEventsSum(tenantId, asOfDate);
    return { matches: projectionSum === eventSum, delta: projectionSum - eventSum };
  }
}

// packages/accounting/src/projections/projection-health.ts
export class ProjectionHealthMonitor {
  async checkHealth(tenantId: string) {
    const health = await this.getProjectionHealth(tenantId);
    const lag = Date.now() - health.lastEventId.timestamp;

    // Emit metrics for monitoring
    this.metrics.emit('projection_lag_seconds', lag / 1000);
    this.metrics.emit('projection_checksums_mismatch', health.checksumMismatch ? 1 : 0);

    return {
      lagSeconds: lag / 1000,
      lastEventId: health.lastEventId,
      checksumMismatch: health.checksumMismatch,
      status: lag > 60000 ? 'stale' : 'healthy', // Alert if > 60s lag
    };
  }
}
```

### **0.5.3 TanStack Query Setup**

**Files to Create:**

- `apps/web/src/app/providers/QueryProvider.tsx`
- `packages/accounting-ui/src/hooks/useAccountingQueries.ts`

**Implementation:**

```typescript
// apps/web/src/app/providers/QueryProvider.tsx
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const client = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 2,
      refetchOnWindowFocus: false
    },
    mutations: { retry: 1 },
  },
});

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={client}>
      {children}
      {process.env.NODE_ENV !== 'production' && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}
```

### **0.5.4 Server-Side Policy Authority**

**Files to Create:**

- `packages/accounting/src/api/policy-decide.controller.ts`
- `packages/accounting/src/services/policy-decision.service.ts`

**Implementation:**

```typescript
// packages/accounting/src/api/policy-decide.controller.ts
@Controller('policy')
export class PolicyDecisionController {
  constructor(private readonly policyService: PolicyDecisionService) {}

  @Post('decide')
  async decidePolicy(@Body() request: PolicyDecisionRequest) {
    const decision = await this.policyService.evaluate(request);

    // Store decision for audit trail
    await this.policyService.storeDecision({
      ...decision,
      correlationId: request.correlationId,
      timestamp: new Date(),
    });

    return {
      allowed: decision.allowed,
      reason: decision.reason,
      decisionId: decision.id,
      policyVersion: decision.policyVersion,
    };
  }
}

// packages/accounting-ui/src/hooks/usePolicy.ts
export function usePolicy() {
  const can = async (actions: Action[], context: Context) => {
    const response = await fetch('/api/policy/decide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actions,
        context,
        correlationId: generateCorrelationId(),
      }),
    });

    const decision = await response.json();
    return decision.allowed;
  };

  return { can };
}
```

### **0.5.5 Period Close Engine**

**Files to Create:**

- `packages/accounting/src/period-close/period-close.service.ts`
- `packages/accounting/src/period-close/period-snapshot.service.ts`

**Implementation:**

```typescript
// packages/accounting/src/period-close/period-close.service.ts
export class PeriodCloseService {
  async closePeriod(tenantId: string, periodId: string, closedBy: string) {
    // 1. Validate period is closeable
    await this.validatePeriodCloseable(tenantId, periodId);

    // 2. Create snapshot of read models
    const snapshot = await this.createPeriodSnapshot(tenantId, periodId);

    // 3. Lock period
    await this.lockPeriod(tenantId, periodId, 'hard_closed');

    // 4. Store snapshot with Merkle root
    await this.storeSnapshot(snapshot);

    return { snapshotId: snapshot.id, merkleRoot: snapshot.merkleRoot };
  }

  async reopenPeriod(tenantId: string, periodId: string, reason: string, reopenedBy: string) {
    // Requires elevated approver + reason + correlation ID
    await this.validateReopenPermissions(reopenedBy);

    await this.unlockPeriod(tenantId, periodId, 'open');
    await this.auditLog.record('period_reopened', {
      periodId,
      reason,
      reopenedBy,
      correlationId: generateCorrelationId(),
    });
  }
}
```

### **0.5.6 Observability Foundation**

**Files to Create:**

- `packages/observability/src/structured-logger.ts`
- `packages/observability/src/metrics-collector.ts`
- `packages/observability/src/audit-tracer.ts`
- `packages/observability/src/performance-monitor.ts`

**Implementation:**

```typescript
// packages/observability/src/structured-logger.ts
export class AccountingObservability {
  static logAuditEvent(event: AuditEvent, correlationId: string) {
    logger.info('AUDIT_EVENT', {
      ...event,
      correlationId,
      timestamp: new Date().toISOString(),
      userId: event.userId, // From JWT
      tenantId: event.tenantId, // From RLS context
    });
  }

  static trackProjectionLag(tenantId: string, lagMs: number) {
    metrics.gauge('projection_lag_ms', lagMs, { tenantId });
  }

  static trackJournalVolume(tenantId: string, count: number, totalAmount: number) {
    metrics.gauge('journal_volume', count, { tenantId });
    metrics.gauge('journal_amount', totalAmount, { tenantId });
  }

  static trackBusinessMetrics(tenantId: string, metrics: BusinessMetrics) {
    // CFO Value Metrics
    metrics.gauge('period_close_time_days', metrics.periodCloseTime, { tenantId });
    metrics.gauge('audit_prep_hours', metrics.auditPrepTime, { tenantId });
    metrics.gauge('unmapped_accounts_count', metrics.unmappedAccounts, { tenantId });
    metrics.gauge('fx_variance_percent', metrics.fxVariance, { tenantId });

    // Operational Metrics
    metrics.gauge('journal_approval_sla_met_percent', metrics.approvalSLA, { tenantId });
    metrics.gauge('bulk_processing_seconds_per_1000', metrics.bulkProcessingTime, { tenantId });
  }
}

// packages/accounting/src/migration/migration-orchestrator.ts
export class MigrationOrchestrator {
  async safeMigration(version: string, steps: MigrationStep[]) {
    // 1. Pre-flight checks
    await this.verifyReadiness(version);

    // 2. Dual-write during migration window
    await this.enableDualWrites();

    // 3. Backfill projections
    await this.backfillProjections();

    // 4. Verify data parity
    const parity = await this.verifyDataParity();
    if (!parity.ok) throw new MigrationParityError(parity.deltas);

    // 5. Cut-over
    await this.cutoverToNewSchema();

    // 6. Cleanup old data (after retention period)
    await this.scheduleCleanup();
  }
}

// apps/web/src/middleware.ts - Enhanced security
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomBytes(16)).toString('base64');

  // Content Security Policy with nonce
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    frame-ancestors 'none';
    form-action 'self';
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, ' ')
    .trim();

  const response = NextResponse.next();
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}
```

**DoD for Phase 0.5:**

- [ ] Policy SDK with SoD invariants
- [ ] Server-side policy decisions with audit trail
- [ ] CQRS read models with health monitoring
- [ ] Period close engine with snapshots
- [ ] Observability foundation with structured logging
- [ ] Migration safety framework operational
- [ ] Enhanced security headers & CSP active
- [ ] TanStack Query integrated
- [ ] RLS cross-tenant tests pass
- [ ] Bundle budget CI checks active
- [ ] Projection parity checks operational

---

## 🚀 **Phase 1: Critical Enterprise Features (Week 1-2)**

### **1.1 Error Handling & Resilience**

**Files to Create:**

- `packages/accounting-ui/src/components/ErrorBoundary.tsx`
- `packages/accounting-ui/src/components/LoadingStates.tsx`

**Implementation:**

```typescript
// packages/accounting-ui/src/components/ErrorBoundary.tsx
'use client';
import React from 'react';

export class AccountingErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error; id?: string }
> {
  state = { hasError: false, error: undefined, id: undefined };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error) {
    const id = crypto.randomUUID();
    // send to logger with id
    console.error('ERR', id, error);
    this.setState({ id });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" aria-live="assertive">
          <p className="font-semibold">Something went wrong.</p>
          <p>Error ID: <code>{this.state.id}</code></p>
          <button onClick={() => this.setState({ hasError: false, error: undefined, id: undefined })}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### **1.2 Smart-Flex RBAC with Policy Engine**

**Files to Create:**

- `packages/policy/src/evaluator.ts` - Policy evaluator with SoD invariants
- `packages/policy/src/simulator.ts` - Policy simulator for testing
- `packages/policy/src/validator.ts` - Policy JSON schema validation
- `packages/accounting-ui/src/components/SecureJournalEntryForm.tsx`
- `packages/accounting-ui/src/hooks/usePolicy.ts`
- `packages/accounting-ui/src/components/PolicyEditor.tsx`
- `packages/accounting/src/tests/sod-negative-tests.spec.ts` - SoD test pack

**Implementation:**

```typescript
// packages/policy/src/evaluator.ts
export function can(actions: Action[], userRoles: string[], ctx: Context, policy: Policy): boolean {
  // 1) Expand role bundles per tenant policy
  const allowed = new Set(userRoles.flatMap((r) => policy.roles[r] ?? []));

  // 2) Invariant SoD check (non-negotiable)
  if (violatesSoD(actions)) return false;

  // 3) All requested actions must be allowed by role bundle
  if (!actions.every((a) => allowed.has(a))) return false;

  // 4) ABAC (tenant-configurable)
  for (const action of actions) {
    const rule = policy.abac[action];
    if (!rule) continue;

    // Self-approval ban
    if (rule.banSelfApproval && action === 'journal:approve' && ctx.createdBy === ctx.currentUserId)
      return false;

    // Amount thresholds
    const limit = Math.max(
      rule.maxAmount?.default ?? Infinity,
      ...userRoles.map((r) => rule.maxAmount?.[r] ?? -Infinity),
    );
    if ((ctx.amount ?? 0) > limit) return false;
  }

  return true;
}

// packages/policy/src/simulator.ts
export function simulatePolicy(scenario: PolicyScenario, policy: Policy): SimulationResult {
  const result = can(scenario.actions, scenario.userRoles, scenario.context, policy);
  return {
    allowed: result,
    reason: result ? 'Policy allows' : 'Policy denies',
    violatedConstraints: violatesSoD(scenario.actions) ? ['SoD'] : [],
    appliedRules: extractAppliedRules(scenario, policy),
  };
}
```

**Policy Validator & Linter:**

```typescript
// packages/policy/src/validator.ts
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

    return { valid: errors.length === 0, errors };
  }
}

// packages/accounting/src/tests/sod-negative-tests.spec.ts
describe('SoD Negative Tests', () => {
  test('same user cannot post and approve', async () => {
    const user = { id: 'user1', roles: ['AP.Clerk', 'AP.Approver'] };
    const context = { tenantId: 't1', currentUserId: 'user1' };

    const canPost = await policyService.can(['journal:post'], user.roles, context);
    const canApprove = await policyService.can(['journal:approve'], user.roles, context);

    expect(canPost).toBe(true);
    expect(canApprove).toBe(true);

    // But cannot do both in same transaction
    const canBoth = await policyService.can(
      ['journal:post', 'journal:approve'],
      user.roles,
      context,
    );
    expect(canBoth).toBe(false);
  });

  test('cross-tenant read fails', async () => {
    const user = { id: 'user1', roles: ['GL.Accountant'], tenantId: 't1' };
    const context = { tenantId: 't2', currentUserId: 'user1' }; // Different tenant

    const canRead = await policyService.can(['report:view'], user.roles, context);
    expect(canRead).toBe(false);
  });

  test('self-approval denied', async () => {
    const user = { id: 'user1', roles: ['GL.Controller'] };
    const context = {
      tenantId: 't1',
      currentUserId: 'user1',
      createdBy: 'user1', // Same user created the entry
      amount: 10000,
    };

    const canApprove = await policyService.can(['journal:approve'], user.roles, context);
    expect(canApprove).toBe(false);
  });
});
```

**Tenant Policy Example:**

```json
// Tenant-configurable policy (versioned)
{
  "version": "2025-01-15T00:00:00Z",
  "roles": {
    "AP.Clerk": ["journal:post", "report:view"],
    "AP.Approver": ["journal:approve", "report:view"],
    "GL.Controller": ["journal:approve", "report:view", "bulk:import"],
    "Custom.FinanceManager": ["journal:post", "journal:approve", "report:view"]
  },
  "abac": {
    "journal:approve": {
      "maxAmount": {
        "default": 50000,
        "GL.Controller": 250000,
        "Custom.FinanceManager": 100000
      },
      "banSelfApproval": true,
      "entityScope": ["companyId", "departmentId"]
    }
  },
  "workflows": {
    "journal:approve": {
      "tiers": [
        { "max": 50000, "approvers": ["AP.Approver"] },
        { "max": 250000, "approvers": ["GL.Controller"] },
        {
          "max": "Infinity",
          "approvers": ["GL.Controller", "GL.Admin"],
          "requiresTwoManRule": true
        }
      ]
    }
  }
}
```

### **1.3 CFO Dashboard & Business Value**

**Files to Create:**

- `packages/accounting-ui/src/components/CFODashboard.tsx`
- `packages/accounting-ui/src/components/KPICard.tsx`
- `packages/accounting-ui/src/components/ComplianceChecklist.tsx`
- `packages/accounting-ui/src/hooks/useRealTimeMetrics.ts`

**Implementation:**

```typescript
// packages/accounting-ui/src/components/CFODashboard.tsx
export function CFODashboard({ tenantId, period }: { tenantId: string; period: string }) {
  const { metrics, loading } = useRealTimeMetrics(tenantId, period);

  return (
    <div className="cfodashboard">
      <div className="kpi-grid">
        <KPICard
          title="Cash Position"
          value={metrics.cashPosition}
          trend={metrics.cashTrend}
          format="currency"
        />
        <KPICard
          title="AR Aging >90d"
          value={metrics.arAging}
          trend={metrics.arTrend}
          format="percentage"
          alertThreshold={0.15}
        />
        <KPICard
          title="FX Exposure"
          value={metrics.fxExposure}
          format="currency"
          drilldown="/fx-exposure-detail"
        />
        <KPICard
          title="Period Close Time"
          value={metrics.periodCloseTime}
          format="days"
          target={3}
        />
      </div>

      <div className="compliance-status">
        <h3>Period Close Readiness</h3>
        <ComplianceChecklist checks={metrics.periodCloseChecks} />
        {metrics.unmappedAccounts > 0 && (
          <Alert severity="warning">
            {metrics.unmappedAccounts} accounts require MFRS mapping before close
          </Alert>
        )}
      </div>

      <div className="audit-readiness">
        <h3>Audit Preparation</h3>
        <div className="audit-metrics">
          <span>Audit Prep Time: {metrics.auditPrepTime}h</span>
          <span>FX Variance: {metrics.fxVariance}%</span>
          <span>Approval SLA: {metrics.approvalSLA}%</span>
        </div>
      </div>
    </div>
  );
}

// packages/accounting-ui/src/components/KPICard.tsx
export function KPICard({
  title,
  value,
  trend,
  format,
  alertThreshold,
  target,
  drilldown
}: KPICardProps) {
  const isAlert = alertThreshold && value > alertThreshold;
  const isTargetMet = target && value <= target;

  return (
    <div className={`kpi-card ${isAlert ? 'alert' : ''} ${isTargetMet ? 'target-met' : ''}`}>
      <h4>{title}</h4>
      <div className="value">
        {formatValue(value, format)}
        {trend && <TrendIndicator trend={trend} />}
      </div>
      {target && (
        <div className="target">
          Target: {formatValue(target, format)}
        </div>
      )}
      {drilldown && (
        <button onClick={() => navigate(drilldown)}>
          View Details
        </button>
      )}
    </div>
  );
}
```

### **1.4 Data Management & Performance**

**Files to Create:**

- `packages/accounting-ui/src/hooks/useAccountingData.ts`
- `packages/accounting-ui/src/components/DataTable.tsx`
- `packages/accounting/src/projections/projection-circuit-breaker.ts`

**DoD for Phase 1:**

- [ ] Error boundaries prevent crashes with correlation IDs
- [ ] Loading states improve UX
- [ ] Smart-Flex RBAC with policy engine functional
- [ ] Data pagination with virtual scrolling works
- [ ] CFO dashboard with business value metrics
- [ ] Unit tests ≥80% coverage

---

## 🛠️ **Technical Implementation**

### **Dependencies Required**

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.0.0", // Data fetching & caching
    "@tanstack/react-table": "^8.0.0", // Advanced data tables
    "react-hook-form": "^7.48.0", // Form management
    "@hookform/resolvers": "^3.3.0", // Form validation
    "recharts": "^2.8.0", // Data visualization
    "lucide-react": "^0.294.0", // Icons
    "date-fns": "^2.30.0", // Date utilities
    "lodash": "^4.17.21", // Data manipulation
    "localforage": "^1.10.0", // Offline storage
    "react-aria": "^3.0.0", // Accessibility primitives
    "next": "^14.0.0" // Dynamic imports for icons
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0", // Component testing
    "@testing-library/jest-dom": "^6.0.0", // DOM testing utilities
    "jest-axe": "^8.0.0", // Accessibility testing
    "storybook": "^7.0.0", // Component documentation
    "@axe-core/playwright": "^4.0.0", // E2E accessibility testing
    "webpack-bundle-analyzer": "^4.0.0" // Bundle size analysis
  }
}
```

### **File Structure**

```
packages/
├── policy/                           # Policy-as-Code SDK
│   ├── src/
│   │   ├── types.ts                  # Policy types & SoD invariants
│   │   ├── evaluator.ts              # Policy evaluation engine
│   │   ├── simulator.ts              # Policy simulation & testing
│   │   ├── validator.ts              # Policy validation
│   │   └── index.ts
│   └── package.json
├── observability/                    # NEW: Structured logging & metrics
│   ├── src/
│   │   ├── structured-logger.ts
│   │   ├── metrics-collector.ts
│   │   ├── audit-tracer.ts
│   │   ├── performance-monitor.ts
│   │   └── index.ts
│   └── package.json
├── accounting-ui/                    # Renamed from accounting-web
│   ├── src/
│   │   ├── components/
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── LoadingStates.tsx
│   │   │   ├── SecureJournalEntryForm.tsx
│   │   │   ├── CFODashboard.tsx      # NEW: CFO business value
│   │   │   ├── KPICard.tsx           # NEW: KPI visualization
│   │   │   └── PolicyEditor.tsx
│   │   ├── hooks/
│   │   │   ├── useErrorHandler.ts
│   │   │   ├── usePolicy.ts
│   │   │   ├── useAccountingQueries.ts
│   │   │   ├── useRealTimeMetrics.ts  # NEW: CFO metrics
│   │   │   └── useI18n.ts
│   │   ├── lib/
│   │   │   ├── accounting-api.ts (enhanced)
│   │   │   ├── audit-logger.ts
│   │   │   ├── correlation-id.ts
│   │   │   └── i18n.ts
│   │   └── __tests__/
│   │       ├── components/
│   │       ├── hooks/
│   │       └── lib/
│   └── package.json
├── accounting/
│   └── src/
│       ├── projections/              # CQRS read models
│       │   ├── gl-balances-daily.ts
│       │   ├── approval-queue.ts
│       │   ├── audit-view.ts
│       │   ├── aging-ar-ap.ts
│       │   └── projection-circuit-breaker.ts # NEW: Circuit breaker
│       ├── period-close/             # NEW: Period close engine
│       │   ├── period-close.service.ts
│       │   └── period-snapshot.service.ts
│       ├── fx-rates/                 # NEW: FX risk management
│       │   ├── fx-rates.service.ts
│       └── migration/                # NEW: Zero-downtime migration
│           ├── migration-orchestrator.ts
│           ├── dual-write-manager.ts
│           └── data-parity-verifier.ts
└── accounting-contracts/
    └── src/
        ├── auth/
        │   └── permissions.ts         # SoD constraints
        └── intl/
            └── localization.ts        # Money/number/date tokens
```

---

## 📊 **Quality Assurance**

### **Testing Strategy**

- **Unit Tests**: Policy evaluation, projection health, SoD constraints
- **Integration Tests**: CQRS projections, period close, migration safety
- **E2E Tests**: Critical user flows, cross-tenant isolation
- **Performance Tests**: Projection lag, bundle size, API response times

### **Success Metrics**

- **Technical**: Projection lag < 30s, bundle size < 250KB, API P95 < 400ms
- **Business**: Period close time < 3 days, audit prep < 8 hours, unmapped accounts = 0
- **Security**: SoD violations prevented, tamper attempts detected, policy decisions tracked

---

## 🎯 **Definition of Done**

### **Phase 0.5 DoD:**

- [ ] Policy SDK with SoD invariants operational
- [ ] CQRS read models materializing correctly
- [ ] TanStack Query integrated with proper cache keys
- [ ] RLS cross-tenant negative tests pass
- [ ] Bundle budget CI checks active

### **Phase 1 DoD:**

- [ ] Error boundaries prevent crashes with correlation IDs
- [ ] Loading states improve UX
- [ ] Smart-Flex RBAC with policy engine functional
- [ ] Data pagination with virtual scrolling works
- [ ] CFO dashboard with business value metrics
- [ ] Unit tests ≥80% coverage

---

_This foundation document provides the core infrastructure required for enterprise-grade accounting systems. It focuses on policy-as-code, observability, CQRS projections, and security foundations that enable all other enterprise features._
