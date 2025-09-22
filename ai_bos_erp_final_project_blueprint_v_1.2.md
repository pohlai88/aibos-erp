# AI‑BOS ERP — Final Project Blueprint (v1.2)

**Purpose:** Comprehensive blueprint merging v1.0's architectural foundation with v1.1's enhanced security, observability, testing, and operational excellence. This version provides a complete, production-ready implementation guide for a modern ERP system.

---

## 0) What's New in v1.2 (Merged from v1.0 + v1.1)

### From v1.0 (Core Architecture)

- **Modular monolith** approach with clean DDD boundaries
- **Selective Event Sourcing** for Accounting and Inventory
- **Contracts as Code** with zero-drift API generation
- **Multi-tenant safety** with PostgreSQL RLS
- **Async by default** with Outbox + Kafka/Redpanda
- **Lean data tier** with PostgreSQL + Redis + ClickHouse
- **Developer-first** ergonomics with TypeScript end-to-end

### From v1.1 (Enhanced Operations)

- **Gateway policies** with rate-limiting, retries, timeouts, JWT/OIDC verification
- **Comprehensive security** framework with encryption, secrets management, GDPR/PDPA compliance
- **Audit and soft-delete** strategies with schema implementations
- **Performance playbook** with pgBouncer, caching, CDN, autoscaling
- **Advanced observability** with OpenTelemetry, SLOs, alerts, log correlation
- **Enhanced testing** strategy with contract tests, performance testing, chaos engineering
- **Operationalized migration** with detailed runbooks and rollback procedures

---

## 1) North Star & Non‑Negotiables

- **Architecture:** Modular monolith now → split services later when SLOs demand it
- **Selective Event Sourcing (ES):** Apply **only** to **Accounting** (journals/GL) and **Inventory** (stock ledger). Others stay relational with async projections
- **Contracts as Code:** Single **contracts/** package generates OpenAPI/GraphQL types & clients; zero drift
- **Multi‑tenant Safety:** Postgres pooled tenancy with `tenant_id` + **RLS** on every table; app also enforces tenant checks
- **Async by Default:** **Outbox + Kafka/Redpanda**; **Temporal** for workflows (MRP, SLE revaluation, payroll)
- **Lean Data Tier:** **PostgreSQL + Redis + ClickHouse**. Optional **OpenSearch** later for fuzzy/global search
- **DX First:** TypeScript end‑to‑end; one‑command dev; PR preview envs; standard scaffolds; opinionated lint/test
- **Security First:** TLS everywhere, field-level encryption for PII, comprehensive audit trails
- **Observability Native:** OpenTelemetry instrumentation, RED metrics, distributed tracing
- **Testing Excellence:** Contract tests, performance benchmarks, chaos engineering, multi-tenant isolation

---

## 2) Target Tech Stack

### Frontend

- **Framework:** Next.js 14+ (App Router) + React 18+ + TypeScript
- **State Management:** TanStack Query + Zustand
- **UI:** Tailwind CSS (token-driven) + shadcn/ui components
- **Forms:** React Hook Form + Zod validation
- **Testing:** Vitest + Playwright (E2E) + Storybook
- **Charts:** Recharts for analytics dashboards

### Backend APIs

- **BFF:** NestJS (Fastify) **GraphQL** (schema-first, codegen)
- **Domain Services:** NestJS (Fastify) **REST** with OpenAPI + codegen clients
- **Gateway:** Kong/Envoy with comprehensive policies
- **Authentication:** OIDC (Keycloak/Auth0/Cognito) with JWT tokens

### Workflows & Messaging

- **Workflows:** Temporal (long-running, retries, sagas)
- **Events:** Kafka/Redpanda (domain events), Outbox pattern per write transaction
- **Caching:** Redis Cluster for distributed caching and locks

### Data Layer

- **Primary Database:** PostgreSQL 16 (RLS, partitions, PITR backups)
- **Analytics:** ClickHouse (analytics/read-heavy reports)
- **Cache:** Redis (catalog lookups, report caches, distributed locks)
- **Search:** Optional OpenSearch for fuzzy/global search

### Infrastructure & DevOps

- **Containerization:** Docker + Docker Compose
- **Orchestration:** Kubernetes (GKE/EKS/AKS) with Helm charts
- **GitOps:** Argo CD for deployment automation
- **Infrastructure:** Terraform for cloud resources
- **Observability:** OpenTelemetry → Prometheus/Grafana/Loki + Jaeger
- **Security:** External Secrets Operator + KMS, Trivy/Snyk scanning, Sigstore/Cosign

---

## 3) Multi‑Tenancy & Data Strategy

### Row Level Security (RLS)

```sql
-- Enable RLS on all tenant tables
ALTER TABLE gl_entry ENABLE ROW LEVEL SECURITY;
CREATE POLICY gl_tenant_isolation ON gl_entry
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Set tenant context per request
SET app.tenant_id = 'tenant-uuid-here';
```

### Data Partitioning & Indexing

- **Keys:** Use **ULIDs** for locality & chronological ordering
- **Monthly partitions** for `gl_entry` & time-series heavy tables
- **Covering indexes:**
  - GL: `(tenant_id, account_id, posting_ts)`
  - Inventory: `(tenant_id, item_id, warehouse_id, occurred_at)`

### Caching Strategy

- **Redis caching** for catalog lookups (Item/UOM/Price List)
- **Short-TTL report caches** (30-120s)
- **Event-driven invalidation** on data updates
- **Distributed locks** for critical operations

---

## 4) High‑Level Architecture Topology

```
Web/Mobile → GraphQL BFF ──► Domain REST Services ──► Postgres (RLS)
         ▲              ╲                 ╲            ╲
         │               ╲                 ╲            └─► Outbox table
         │                ╲                 ╲
         │                 └► Kafka (events) ──► Projectors ──► ClickHouse (BI)
         │                                           ╲
         │                                            └► OpenSearch (optional)
         └────────────── Temporal (MRP/Payroll/SLE jobs) ──► Services
```

**Key Components:**

- **API Gateway:** Kong/Envoy with rate limiting, authentication, retries
- **BFF Layer:** GraphQL aggregation with service client calls
- **Domain Services:** REST APIs with OpenAPI contracts
- **Event Streaming:** Kafka for domain events and projections
- **Workflow Engine:** Temporal for complex business processes
- **Data Storage:** PostgreSQL (OLTP) + ClickHouse (OLAP) + Redis (Cache)

---

## 5) Monorepo Layout (Split-Ready)

```
aibos-erp/
├── apps/
│   ├── web/                 # Next.js (App Router)
│   └── bff/                 # NestJS GraphQL gateway
├── services/
│   ├── iam/                 # Identity & Access Management
│   ├── catalog/             # Master Data Management
│   ├── accounting/          # Financial Accounting (ES)
│   ├── inventory/           # Inventory Management (ES)
│   ├── procurement/         # Purchase-to-Pay
│   ├── scm/                 # Supply Chain Management
│   ├── wms/                 # Warehouse Management
│   ├── crm/                 # Customer Relationship Management
│   ├── retail/              # Point of Sale
│   ├── ecommerce/           # E-commerce Platform
│   ├── manufacturing/       # Production Planning
│   ├── hr/                  # Human Resources
│   ├── quality/             # Quality Management
│   ├── service/             # Service Management
│   ├── epm/                 # Enterprise Performance Management
│   ├── sustainability-ehs/  # EHS & Sustainability
│   ├── iot-platform-integration/ # IoT Integration
│   ├── asset-management/    # Asset Management
│   ├── project-management/  # Project Management
│   ├── rnd/                 # Research & Development
│   ├── integration/         # External Integrations
│   ├── bi/                  # Business Intelligence
│   ├── fnb/                 # Food & Beverage
│   └── plantation/          # Plantation Management
├── packages/
│   ├── contracts/           # OpenAPI & GraphQL schemas; codegen outputs
│   ├── db/                  # Drizzle schemas & migrations; PG + CH adapters
│   ├── events/              # Outbox utils, event types, topic map
│   ├── ui/                  # Design system & tokens
│   └── utils/               # Shared utilities
├── infra/
│   ├── helm/                # Helm charts
│   ├── k8s/                 # Kubernetes manifests
│   └── terraform/           # Infrastructure as Code
└── .github/workflows/       # CI/CD pipelines
```

---

## 6) API Gateway & Resilience Policies

### Kong Gateway Configuration

```yaml
_format_version: '3.0'
_transform: true
services:
  - name: accounting-service
    url: http://accounting-service:3000
    routes:
      - name: accounting-routes
        paths: ['/api/v1/accounting']
        methods: [GET, POST, PUT, DELETE]
    plugins:
      - name: jwt
        config:
          secret_is_base64: false
          run_on_preflight: true
      - name: rate-limiting
        config:
          minute: 1200
          hour: 10000
          policy: local
          header_name: X-Tenant-Id
      - name: request-size-limiting
        config:
          allowed_payload_size: 2 # MB
      - name: response-ratelimiting
        config:
          limits:
            default:
              minute: 2000
      - name: proxy-cache
        config:
          strategy: memory
          cache_ttl: 30
          content_type: ['application/json']
      - name: correlation-id
        config:
          header_name: X-Request-Id
          generator: uuid
      - name: ip-restriction
        config:
          allow: ['0.0.0.0/0']
```

### Resilience Patterns

- **Timeouts:** 2s for reads, 5s for writes
- **Retries:** 3 attempts with exponential backoff (no retry on POST unless idempotent)
- **Circuit Breaker:** Resilience4j in services with configurable thresholds
- **Backpressure:** 429 responses with Retry-After headers
- **WAF:** Cloud provider or ModSecurity before gateway

---

## 7) Security & Compliance Framework

### Transport Security

- **TLS 1.2+** everywhere with perfect forward secrecy
- **Optional mTLS** inside cluster for service-to-service communication
- **Certificate rotation** automated via cert-manager

### Data Protection

- **At Rest:** Cloud KMS-managed disk encryption
- **Field-Level:** Encryption for PII using libsodium/pgcrypto
- **Token Security:** Hashed tokens (HMAC) at rest, short-lived JWTs

### Identity & Access Management

- **OIDC Provider:** Keycloak/Auth0/Cognito integration
- **Token Claims:** Include `tenant_id`, `scopes`, `org_id`
- **API Keys:** Tenant-scoped and hashed with least privilege
- **RBAC/ABAC:** OPA/Casbin policy bundles for fine-grained access control

### Compliance (GDPR/PDPA)

- **Data Subject Rights:** Export/delete endpoints with async fulfillment
- **Data Minimization:** Default policies with per-field retention
- **Pseudonymization:** Analytics sinks with anonymized data
- **Audit Trails:** Complete activity logging for compliance reporting

### Disaster Recovery & Business Continuity

- **RPO:** 5 minutes (Point-in-time recovery)
- **RTO:** 60 minutes (Recovery time objective)
- **Backup Strategy:** Postgres PITR with WAL-G to object storage
- **Testing:** Quarterly restore drills with automated verification

---

## 8) Audit & Soft-Delete Strategy

### Central Audit Log

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  actor_id UUID,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT','UPDATE','DELETE')),
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
) PARTITION BY RANGE (created_at);

-- Monthly partitions for audit log
CREATE TABLE audit_log_2024_01 PARTITION OF audit_log
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### Soft Delete Policy

- **Tombstone Tables:** For entities where historical joins matter (master data)
- **Deleted At Columns:** For simple entities with filtered queries
- **Never Purge:** Ledger and event streams remain immutable
- **Retention Policies:** Configurable per entity type

---

## 9) Performance & Scale Playbook

### Database Optimization

- **Connection Pooling:** pgBouncer in transaction mode
- **Pool Sizing:** `pool_size = cores * 2 + (spikes)` per service
- **Global Limits:** Control `max_connections` on PostgreSQL
- **Query Optimization:** Covering indexes and partition pruning

### Caching Strategy

- **Data Cache (Redis):** Key pattern `tenant:{id}:item:{id}:v1`
- **TTL:** 300s for catalog data, 30-120s for reports
- **Invalidation:** Event-driven on `catalog.item.updated`
- **Cache Warming:** Proactive loading of frequently accessed data

### CDN Configuration

- **Provider:** CloudFront/Azure CDN
- **Asset Versioning:** Immutable paths `/static/_next/<hash>`
- **Cache Policies:** Stale-while-revalidate for optimal performance
- **Edge Locations:** Global distribution for low latency

### Autoscaling Triggers

- **HPA:** CPU and memory-based scaling
- **KEDA:** Kafka lag and Temporal queue length scaling
- **Custom Metrics:** API response times and error rates
- **Scale to Zero:** Disabled for core services

### Backpressure Management

- **Gateway Rate Limiting:** Per-tenant and per-user limits
- **Service Responses:** 429 with exponential backoff hints
- **Job Quotas:** Per-tenant submission limits
- **Circuit Breakers:** Prevent cascade failures

---

## 10) Observability (OpenTelemetry-First)

### Distributed Tracing

```yaml
# OpenTelemetry Collector Configuration
receivers:
  otlp:
    protocols:
      http: {}
      grpc: {}
exporters:
  prometheus:
    endpoint: '0.0.0.0:8889'
  loki:
    endpoint: http://loki:3100/loki/api/v1/push
  jaeger:
    endpoint: jaeger-collector:14250
    tls:
      insecure: true
service:
  pipelines:
    traces:
      receivers: [otlp]
      exporters: [jaeger]
    metrics:
      receivers: [otlp]
      exporters: [prometheus]
    logs:
      receivers: [otlp]
      exporters: [loki]
```

### Metrics & Monitoring

- **RED Metrics:** Rate, Errors, Duration for all services
- **Custom Metrics:** Domain-specific (journals/min, inventory events/min)
- **Infrastructure:** Kafka lag, Temporal failures, database performance
- **Sampling:** 10% head-based in production, always sample errors

### Logging Strategy

- **Format:** Structured JSON logs
- **Fields:** Include `tenant_id`, `request_id`, `user_id`
- **PII Redaction:** Server-side redaction in logs
- **Correlation:** Trace correlation across services

### Alerting Rules

```yaml
# Prometheus Alert Rules
groups:
  - name: api-slos
    rules:
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 10m
        labels:
          severity: warning
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.02
        for: 5m
        labels:
          severity: critical
```

---

## 11) Testing Strategy (Comprehensive Pyramid)

### Test Types & Coverage

- **Unit Tests:** Vitest + NestJS testing utilities (≥80% coverage)
- **Integration Tests:** Service-to-database testing
- **Contract Tests:** Pact for BFF↔services compatibility
- **E2E Tests:** Playwright for critical user journeys
- **Performance Tests:** k6 scenarios with SLO verification
- **Chaos Tests:** Litmus experiments in staging nightly

### Multi-Tenant Isolation Testing

```typescript
describe('Multi-tenant Isolation', () => {
  it('prevents cross-tenant data access', async () => {
    const tenant1 = await seedTenant();
    const tenant2 = await seedTenant();

    const journal1 = await createJournal(tenant1.id);
    const journal2 = await createJournal(tenant2.id);

    // Should not be able to access tenant2's data with tenant1's token
    await expect(getJournal(journal2.id, tenant1.token)).rejects.toThrow(/Forbidden|RLS/);
  });
});
```

### Quality Gates

- **Coverage Threshold:** ≥80% code coverage
- **Contract Tests:** Must pass in CI
- **Performance Regression:** k6 SLO verification
- **Security Scan:** No critical vulnerabilities
- **Chaos Testing:** Nightly staging experiments

---

## 12) Core Schemas & Data Models

### Accounting (Event Sourcing)

```sql
-- Event Store
CREATE TABLE acc_event (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  stream_id UUID NOT NULL,
  seq INT NOT NULL,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, stream_id, seq)
);

-- General Ledger Projection
CREATE TABLE gl_entry (
  tenant_id UUID NOT NULL,
  id UUID PRIMARY KEY,
  journal_id UUID NOT NULL,
  company_id UUID NOT NULL,
  account_id UUID NOT NULL,
  currency CHAR(3) NOT NULL,
  debit NUMERIC(18,6) NOT NULL DEFAULT 0,
  credit NUMERIC(18,6) NOT NULL DEFAULT 0,
  posting_ts TIMESTAMPTZ NOT NULL
) PARTITION BY RANGE (posting_ts);

-- Monthly partitions
CREATE TABLE gl_entry_2024_01 PARTITION OF gl_entry
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Covering index
CREATE INDEX gl_idx1 ON gl_entry (tenant_id, account_id, posting_ts);
```

### Inventory (Event Sourcing)

```sql
-- Inventory Event Store
CREATE TABLE inv_event (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  stream_id UUID NOT NULL,
  seq INT NOT NULL,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, stream_id, seq)
);

-- Stock Snapshot
CREATE TABLE stock_bin (
  tenant_id UUID NOT NULL,
  item_id UUID NOT NULL,
  warehouse_id UUID NOT NULL,
  quantity_on_hand NUMERIC(18,6) NOT NULL,
  valuation NUMERIC(18,6) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, item_id, warehouse_id)
);

CREATE INDEX bin_idx1 ON stock_bin (tenant_id, item_id, warehouse_id);
```

### Outbox & Idempotency

```sql
-- Outbox Pattern
CREATE TABLE outbox (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  topic TEXT NOT NULL,
  key TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'READY',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Idempotency Control
CREATE TABLE idempotency (
  key TEXT PRIMARY KEY,
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 13) Module Blueprint & Rollout Tiers

### Tier-1 (Core Foundation - Phases 1-3)

| Module                          | Context Type         | Data Ownership                                       | APIs                   | Core Events                                            | Notes                                  |
| ------------------------------- | -------------------- | ---------------------------------------------------- | ---------------------- | ------------------------------------------------------ | -------------------------------------- |
| identity-access-management_iam  | Relational           | Tenants, users, roles, org units, API keys           | REST + GraphQL via BFF | `iam.user.created`, `iam.tenant.created`               | OIDC integration                       |
| catalog-master-data             | Relational           | Item, UOM, Warehouse, Customer, Supplier, Price List | REST                   | `catalog.item.updated`                                 | Heavy Redis caching                    |
| accounting                      | **ES + Projections** | `acc_event`, `gl_entry`                              | REST                   | `accounting.journal.posted`                            | Double-entry, idempotency              |
| inventory                       | **ES + Snapshot**    | `inv_event`, `stock_bin`                             | REST                   | `inventory.stock.received/issued/adjusted/transferred` | Deterministic valuation                |
| procurement                     | Relational           | Requisition, PO, Vendor Bill                         | REST                   | `procurement.po.approved/received/invoiced`            | Integrates with Inventory & Accounting |
| warehouse-management-system_wms | Relational           | Picks, packs, moves                                  | REST                   | `wms.pick.created/completed`                           | Consumes/produces Inventory events     |

### Tier-2 (Commercial Operations - Phases 4-5)

| Module                               | Context Type | Data Ownership                   | APIs | Core Events                        | Notes                            |
| ------------------------------------ | ------------ | -------------------------------- | ---- | ---------------------------------- | -------------------------------- |
| customer-relationship-management_crm | Relational   | Leads, opportunities, activities | REST | `crm.opportunity.updated`          | Omnichannel integration          |
| retail                               | Relational   | POS orders, shifts               | REST | `retail.sale.completed`            | Offline sync capability          |
| e-commerce                           | Relational   | Cart, orders, payments           | REST | `ecom.order.created/paid`          | Payment provider webhooks        |
| service-management                   | Relational   | Cases, SLAs, work orders         | REST | `service.case.created/closed`      | Inventory integration for spares |
| quality-management                   | Relational   | Inspections, NCR/CAPA            | REST | `quality.inspection.passed/failed` | Stock release gating             |

### Tier-3 (Industrial & Strategy - Phases 6-7)

| Module                                | Context Type           | Data Ownership               | APIs            | Core Events                | Notes                         |
| ------------------------------------- | ---------------------- | ---------------------------- | --------------- | -------------------------- | ----------------------------- |
| manufacturing                         | Workflows + Relational | BOM, Routing, MRP plan/jobs  | REST + Temporal | `mrp.job.*`                | Stock reservation/consumption |
| supply-chain-management_scm           | Relational             | ASN, shipments, carriers     | REST            | `scm.asn.created/received` | Planning + tracking           |
| business-intelligence-analytics_bia   | CH loaders             | Facts & dimensions           | N/A (internal)  | n/a                        | ClickHouse materializations   |
| enterprise-performance-management_epm | Relational + CH        | KPIs, scorecards             | GraphQL via BFF | `epm.kpi.updated`          | CH reads, PG writes           |
| sustainability-ehs                    | Relational             | Incidents, audits, emissions | REST            | `ehs.incident.logged`      | CH reporting                  |
| iot-platform-integration              | Ingest                 | Telemetry streams            | REST/Webhooks   | `iot.telemetry.ingested`   | CH downsampling               |

### Tier-4 (Verticals & Enablers - Phase 8+)

| Module             | Context     | Data Ownership                | Notes                              |
| ------------------ | ----------- | ----------------------------- | ---------------------------------- |
| fnb                | Vertical    | Menus, recipes, CoGS models   | Inventory/Accounting integration   |
| plantation         | Vertical    | Plots, harvests, traceability | IoT + Quality + Inventory          |
| asset-management   | Relational  | Assets, depreciation          | Accounting integration             |
| project-management | Relational  | Projects, tasks, timesheets   | Cost allocation to Accounting      |
| rnd                | Relational  | Experiments, approvals        | Minimal dependencies, CH reporting |
| mobile-platform    | BFF/Clients | Device auth, sync             | Shared IAM & GraphQL               |
| integration        | Gateways    | Partner connectors            | Payment, e-invoicing, 3PL          |

---

## 14) Event Taxonomy & Schema

### Domain Events

- `accounting.journal.posted/reversed`
- `inventory.stock.received/issued/adjusted/transferred`
- `procurement.po.created/approved/received/invoiced`
- `wms.pick.created/completed`
- `crm.opportunity.created/updated/won/lost`
- `retail.sale.completed`, `ecom.order.created/paid/shipped`
- `mrp.job.planned/started/completed`
- `quality.inspection.passed/failed`
- `hr.payroll.posted`
- `epm.kpi.updated`, `ehs.incident.logged`

### Event Envelope Schema

```typescript
interface DomainEvent {
  tenant_id: string;
  event_id: string; // ULID
  occurred_at: Date;
  source: string;
  idempotency_key: string;
  schema_version: string;
  payload: Record<string, any>;
}
```

---

## 15) API & Contract Conventions

### REST API Standards

- **Versioning:** URL-based `/v1/...`, `/v2/...`
- **Idempotency:** Every write accepts `Idempotency-Key` header
- **Authentication:** OIDC JWT → gateway → service
- **Authorization:** OPA/Casbin for fine-grained RBAC
- **Caching:** ETags and cache headers for GET requests
- **Pagination:** Cursor-based pagination for large datasets

### GraphQL BFF Schema

```graphql
type Query {
  invoiceSummary(id: ID!): InvoiceSummary!
  inventoryLevels(warehouseId: ID!): [InventoryLevel!]!
  customerOrders(customerId: ID!, limit: Int): [Order!]!
}

type Mutation {
  createJournal(input: CreateJournalInput!): Journal!
  updateInventory(input: UpdateInventoryInput!): InventoryLevel!
  processPayroll(input: ProcessPayrollInput!): Payroll!
}

type Subscription {
  inventoryUpdated(warehouseId: ID!): InventoryLevel!
  orderStatusChanged(orderId: ID!): Order!
}
```

### Contract-First Development

- **OpenAPI 3.0** specifications for all REST services
- **GraphQL Schema** definitions for BFF layer
- **Code Generation** for TypeScript clients and types
- **Contract Testing** with Pact for API compatibility
- **Schema Validation** in CI/CD pipeline

---

## 16) DevOps & CI/CD Pipeline

### GitHub Actions Workflow

```yaml
name: Quality Gates
on: [push, pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm run lint

      - name: Type check
        run: pnpm run type-check

      - name: Unit tests
        run: pnpm run test --coverage

      - name: Contract tests
        run: pnpm run test:contract

      - name: Security scan
        run: pnpm run security:scan

      - name: Performance smoke test
        run: k6 run scripts/perf/smoke.js

      - name: Build
        run: pnpm run build

      - name: E2E tests
        run: pnpm run test:e2e

      - name: Deploy to staging
        if: github.ref == 'refs/heads/main'
        run: |
          kubectl apply -f k8s/staging/
          kubectl rollout status deployment/aibos-bff-staging
```

### Quality Gates

- **Coverage:** ≥80% code coverage required
- **Contract Tests:** Must pass in CI
- **Security:** No critical vulnerabilities
- **Performance:** SLO verification with k6
- **E2E:** Critical path testing

### Deployment Strategy

- **Environments:** dev (PR previews), staging, production
- **GitOps:** Argo CD for automated deployments
- **Rolling Updates:** Zero-downtime deployments
- **Canary Deployments:** Progressive delivery with metrics
- **Rollback:** Automated rollback on SLO violations

---

## 17) Migration & Rollback Strategy

### Data Migration Runbook

1. **T0 Agreement:** Freeze backfills, export COA & stock snapshots
2. **Staging:** Import legacy data into `landing_*` schemas
3. **Transformation:** Convert to `acc_event` and `inv_event` formats
4. **Replay:** Generate `gl_entry` and `stock_bin` projections
5. **Reconciliation:** Verify Trial Balance diff ≤ 0.01%
6. **Dual Run:** 4-6 weeks parallel operation
7. **Cutover:** Switch to new system with audit trail

### Rollback Procedures

- **PITR Bookmark:** Keep T-1 recovery point
- **Idempotent Migrations:** Safe to re-run
- **DNS Switch:** Quick traffic redirection
- **Write Access:** Revoke if KPIs degrade

### Integrity Verification

```typescript
// Automated reconciliation
async function verifyDataIntegrity(tenantId: string): Promise<boolean> {
  const trialBalance = await calculateTrialBalance(tenantId);
  const stockValuation = await calculateStockValuation(tenantId);

  const tbDiff = Math.abs(trialBalance.debit - trialBalance.credit);
  const stockDiff = Math.abs(stockValuation.actual - stockValuation.expected);

  return tbDiff <= 0.01 && stockDiff <= 0.01;
}
```

---

## 18) Phased Delivery Plan (8-Week Sprint)

### Week 1-2: Platform & Developer Experience

- [ ] Turborepo scaffold with pnpm workspaces
- [ ] NestJS service templates and shared configs
- [ ] Docker Compose for local development
- [ ] GraphQL BFF skeleton with codegen
- [ ] CI/CD pipeline with quality gates
- [ ] OpenTelemetry instrumentation

### Week 3: Identity & Master Data

- [ ] IAM service with OIDC integration
- [ ] Tenant management and RLS policies
- [ ] Catalog service with Redis caching
- [ ] User management and RBAC
- [ ] API key management

### Week 4-5: Core Financial & Inventory

- [ ] Accounting service with Event Sourcing
- [ ] General Ledger projections and reporting
- [ ] Inventory service with stock management
- [ ] Journal posting with idempotency
- [ ] Outbox pattern implementation

### Week 6: Procurement & Warehouse

- [ ] Procurement service (Req→PO→GRN→AP)
- [ ] WMS service with pick/pack operations
- [ ] Inventory and Accounting integrations
- [ ] Temporal workflows for GRN revaluation
- [ ] Vendor management

### Week 7: Commercial Operations

- [ ] CRM service with opportunity management
- [ ] Retail service with POS integration
- [ ] E-commerce service with payment webhooks
- [ ] ClickHouse loaders for sales analytics
- [ ] Order management workflows

### Week 8: Manufacturing & Quality

- [ ] Manufacturing service with MRP workflows
- [ ] Quality management with inspection gates
- [ ] Temporal workflows for production planning
- [ ] SLO hardening and performance optimization
- [ ] Disaster recovery testing

---

## 19) SLOs & Error Budgets

### Service Level Objectives

- **API Performance:**
  - Reads: p95 < 300ms
  - Writes: p95 < 1s
  - Heavy Operations: Job ID returned < 500ms
- **Data Integrity:**
  - Trial Balance mismatch: 0
  - Event Sourcing replay: Deterministic
  - Inventory accuracy: Snapshot vs replay diff < 0.01%
- **System Reliability:**
  - Queue lag p95: < 5s
  - Temporal activity failure rate: < 0.1%
  - Availability: 99.9%
- **Multi-tenant Isolation:**
  - RLS policy coverage: 100%
  - Cross-tenant data leakage: 0

### Error Budget Policy

- **Progressive Delivery:** Canary deployments with metrics
- **Automatic Rollback:** On SLO violations
- **Alert Escalation:** Based on error budget consumption
- **Incident Response:** Runbook-driven with post-mortems

---

## 20) Risk Management & Mitigations

### High-Risk Areas

1. **Event Sourcing Complexity**
   - **Risk:** Team learning curve and debugging
   - **Mitigation:** Start simple, comprehensive tooling, extensive testing

2. **Multi-Tenant Data Isolation**
   - **Risk:** Data leakage between tenants
   - **Mitigation:** Automated RLS testing, canary deployments, audit trails

3. **Performance at Scale**
   - **Risk:** Database bottlenecks with high concurrency
   - **Mitigation:** Read replicas, connection pooling, query optimization

### Medium-Risk Areas

1. **Temporal Workflow Complexity**
   - **Risk:** Workflow debugging and monitoring
   - **Mitigation:** Comprehensive logging, workflow visualization tools

2. **Data Consistency**
   - **Risk:** Eventual consistency issues
   - **Mitigation:** Saga patterns, compensation logic, reconciliation

3. **Migration Complexity**
   - **Risk:** Data loss or corruption during migration
   - **Mitigation:** Comprehensive testing, dual-run period, rollback procedures

---

## 21) Ready-to-Build Checklist (v1.2)

### Infrastructure & Platform

- [ ] Turborepo scaffold with pnpm workspaces
- [ ] Kong gateway declarative config with tenant rate limiting
- [ ] OIDC provider (Keycloak/Auth0/Cognito) with RBAC policies
- [ ] PostgreSQL 16 with RLS enabled and monthly partitions
- [ ] Redis cluster for caching and distributed locks
- [ ] ClickHouse for analytics with S3-backed storage
- [ ] Kafka/Redpanda cluster for event streaming
- [ ] Temporal cluster for workflow orchestration

### Security & Compliance

- [ ] TLS certificates with automated rotation
- [ ] External Secrets Operator with KMS integration
- [ ] Audit logging enabled globally with partitioning
- [ ] DSR endpoints for GDPR/PDPA compliance
- [ ] Data encryption at rest and in transit
- [ ] Security scanning (Trivy/Snyk) in CI/CD

### Observability & Monitoring

- [ ] OpenTelemetry collector deployed
- [ ] Prometheus/Grafana dashboards with RED metrics
- [ ] Jaeger for distributed tracing
- [ ] Loki for centralized logging
- [ ] Alert rules for SLO violations
- [ ] Log correlation and PII redaction

### Development & Testing

- [ ] Contract tests (Pact) running in CI
- [ ] Performance tests (k6) with SLO verification
- [ ] Chaos engineering (Litmus) in nightly staging
- [ ] Multi-tenant isolation tests automated
- [ ] E2E tests for critical user journeys
- [ ] Code coverage ≥80% enforced

### Operations & Deployment

- [ ] Argo CD for GitOps deployment
- [ ] Helm charts for all services
- [ ] Terraform for infrastructure provisioning
- [ ] PITR backups with quarterly restore drills
- [ ] Disaster recovery runbooks documented
- [ ] Image signing with Cosign

---

## 22) Success Metrics & KPIs

### Technical Metrics

- **Performance:** API response times, throughput, error rates
- **Reliability:** Uptime, MTTR, MTBF
- **Scalability:** Resource utilization, autoscaling effectiveness
- **Security:** Vulnerability count, compliance score

### Business Metrics

- **User Adoption:** Active users, feature usage
- **Data Quality:** Accuracy, completeness, consistency
- **Operational Efficiency:** Process automation, manual intervention reduction
- **Cost Optimization:** Infrastructure costs, development velocity

### Developer Experience

- **Time to Market:** Feature delivery speed
- **Code Quality:** Maintainability, testability
- **Onboarding:** New developer productivity
- **Incident Response:** Resolution time, learning capture

---

This v1.2 blueprint represents a **production-ready, enterprise-grade ERP system** that balances architectural sophistication with operational excellence. It provides a clear path from initial development through scale-out while maintaining security, observability, and developer productivity as core principles.

The blueprint is designed to be **implementation-ready** with detailed technical specifications, operational procedures, and success criteria that enable rapid development of a modern, scalable ERP platform.
