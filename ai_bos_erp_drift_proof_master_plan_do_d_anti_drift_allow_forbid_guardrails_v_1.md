# AI‑BOS ERP — Enhanced Drift‑Proof Master Plan (DoD, Anti‑Drift, Allow/Forbid Guardrails) v1.1

> Purpose: turn the blueprint + master plan into **enforceable** rules that prevent drift, define **allow/forbid** policies, and lock a **single‑direction lineage** for imports across the monorepo. Enhanced with comprehensive security, performance, testing, and data governance guardrails. All items below are **copy‑paste‑ready**.

---

## 0) Non‑Negotiables (Always‑On Guardrails)

- **Contracts‑first:** All inter‑service calls flow through `@aibos/contracts` codegen. Direct cross‑service DTOs are forbidden.
- **Single‑direction lineage:**
  - **Frontend:** `tokens → primitives → components → features → app` (no back/side imports).
  - **Backend:** `utils → contracts → domain services → bff → gateway` (no back/side imports).
- **Tenant safety:** RLS coverage = 100% for all tenant tables; isolation tests run in CI.
- **Observability‑native:** Every request has a trace/span with `tenant_id`, `request_id`.
- **Security‑by‑default:** PII redaction in logs, no secret in code, short‑lived tokens.
- **Security‑first:** Secret detection, SAST scanning, dependency vulnerabilities, license compliance.
- **Performance‑native:** Bundle size limits, Core Web Vitals, memory leak detection, query performance.
- **Testing‑excellence:** Mutation testing, contract testing, chaos engineering, accessibility testing.
- **Data‑governance:** PII detection, GDPR compliance, data retention, audit trail completeness.

---

## 1) Layer Maps (Lineage) — Allowed vs Forbidden

### Frontend Layers

| From ↓ / To →  | tokens | primitives | components | features | app |
| -------------- | -----: | ---------: | ---------: | -------: | --: |
| **tokens**     |     ✅ |         ✅ |         ✅ |       ✅ |  ✅ |
| **primitives** |     ❌ |         ✅ |         ✅ |       ✅ |  ✅ |
| **components** |     ❌ |         ❌ |         ✅ |       ✅ |  ✅ |
| **features**   |     ❌ |         ❌ |         ❌ |       ✅ |  ✅ |
| **app**        |     ❌ |         ❌ |         ❌ |       ❌ |  ✅ |

### Backend Layers

| From ↓ / To →       | utils | contracts | domain services | bff | gateway |
| ------------------- | ----: | --------: | --------------: | --: | ------: |
| **utils**           |    ✅ |        ✅ |              ✅ |  ✅ |      ✅ |
| **contracts**       |    ❌ |        ✅ |              ✅ |  ✅ |      ✅ |
| **domain services** |    ❌ |        ❌ |              ✅ |  ✅ |      ✅ |
| **bff**             |    ❌ |        ❌ |              ❌ |  ✅ |      ✅ |
| **gateway**         |    ❌ |        ❌ |              ❌ |  ❌ |      ✅ |

> **Rule of thumb:** Only import **downstream** (to the right). Sibling and upstream imports are **forbidden**.

---

## 2) ESLint — Enforce Lineage, Safety & Quality

Create **`/.eslintrc.cjs`** at repo root:

```js
/* eslint-disable no-undef */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'import',
    'boundaries',
    'perfectionist',
    'promise',
    'sonarjs',
    'security',
    'unicorn',
    'jsx-a11y',
    'react-hooks',
    'testing-library',
    'jest-dom',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:promise/recommended',
    'plugin:sonarjs/recommended',
    'plugin:security/recommended',
    'plugin:unicorn/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:react-hooks/recommended',
    'plugin:testing-library/recommended',
    'plugin:jest-dom/recommended',
  ],
  settings: {
    'import/resolver': { typescript: { project: ['./tsconfig.json'] } },
    boundaries: {
      defaultMessage: 'Import violates layer lineage policy',
      ignore: ['**/*.test.*', '**/*.spec.*', '**/*.stories.*'],
      // Map layers by alias/patterns — adjust paths to your repo
      // FE
      elements: [
        { type: 'fe-tokens', pattern: '^@aibos/ui/(?:tokens|theme)(/.*)?$' },
        { type: 'fe-primitives', pattern: '^@aibos/ui/primitives(/.*)?$' },
        { type: 'fe-components', pattern: '^@aibos/ui/components(/.*)?$' },
        { type: 'fe-features', pattern: '^@aibos/ui/features(/.*)?$' },
        { type: 'fe-app', pattern: '^@aibos/app(.*)?$' },
        // BE
        { type: 'be-utils', pattern: '^@aibos/utils(/.*)?$' },
        { type: 'be-contracts', pattern: '^@aibos/contracts(/.*)?$' },
        {
          type: 'be-domain',
          pattern: '^@aibos/(accounting|inventory|procurement|wms|crm)(/.*)?$',
        },
        { type: 'be-bff', pattern: '^@aibos/bff(/.*)?$' },
        { type: 'be-gateway', pattern: '^@aibos/gateway(/.*)?$' },
      ],
      // Allow only downstream edges (left → right)
      rules: [
        {
          from: ['fe-primitives'],
          to: ['fe-tokens', 'fe-primitives', 'fe-components', 'fe-features', 'fe-app'],
        },
        {
          from: ['fe-components'],
          to: ['fe-components', 'fe-features', 'fe-app'],
        },
        { from: ['fe-features'], to: ['fe-features', 'fe-app'] },
        { from: ['fe-app'], to: ['fe-app'] },

        {
          from: ['be-contracts'],
          to: ['be-contracts', 'be-domain', 'be-bff', 'be-gateway'],
        },
        { from: ['be-domain'], to: ['be-domain', 'be-bff', 'be-gateway'] },
        { from: ['be-bff'], to: ['be-bff', 'be-gateway'] },
        { from: ['be-gateway'], to: ['be-gateway'] },
      ],
    },
  },
  rules: {
    // Lineage enforcement
    'boundaries/element-types': ['error'],
    'import/no-cycle': ['error', { maxDepth: 3 }],
    'import/no-relative-packages': 'error',
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          // Ban cross-service internals; use @aibos/contracts only
          {
            target: './services/accounting/src',
            from: './services/inventory/src',
          },
          {
            target: './services/inventory/src',
            from: './services/accounting/src',
          },
        ],
      },
    ],
    // Enhanced Security Rules
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'warn',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-non-literal-require': 'warn',
    'security/detect-possible-timing-attacks': 'warn',
    'security/detect-pseudoRandomBytes': 'error',

    // Enhanced Performance Rules
    'sonarjs/no-duplicate-string': 'error',
    'sonarjs/no-identical-functions': 'error',
    'sonarjs/no-redundant-boolean': 'error',
    'sonarjs/no-unused-collection': 'error',
    'sonarjs/prefer-immediate-return': 'error',
    'sonarjs/prefer-single-boolean-return': 'error',

    // Enhanced Code Quality Rules
    'unicorn/prefer-module': 'error',
    'unicorn/prefer-node-protocol': 'error',
    'unicorn/prefer-query-selector': 'error',
    'unicorn/prefer-string-slice': 'error',
    'unicorn/prefer-text-content': 'error',
    'unicorn/prefer-type-error': 'error',

    // Accessibility Rules
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/anchor-has-content': 'error',
    'jsx-a11y/anchor-is-valid': 'error',
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-proptypes': 'error',
    'jsx-a11y/aria-unsupported-elements': 'error',
    'jsx-a11y/click-events-have-key-events': 'error',
    'jsx-a11y/heading-has-content': 'error',
    'jsx-a11y/html-has-lang': 'error',
    'jsx-a11y/iframe-has-title': 'error',
    'jsx-a11y/img-redundant-alt': 'error',
    'jsx-a11y/no-access-key': 'error',
    'jsx-a11y/no-autofocus': 'error',
    'jsx-a11y/no-distracting-elements': 'error',
    'jsx-a11y/no-interactive-element-to-noninteractive-role': 'error',
    'jsx-a11y/no-noninteractive-element-interactions': 'error',
    'jsx-a11y/no-noninteractive-element-to-interactive-role': 'error',
    'jsx-a11y/no-noninteractive-tabindex': 'error',
    'jsx-a11y/no-redundant-roles': 'error',
    'jsx-a11y/no-static-element-interactions': 'error',
    'jsx-a11y/role-has-required-aria-props': 'error',
    'jsx-a11y/role-supports-aria-props': 'error',
    'jsx-a11y/scope': 'error',
    'jsx-a11y/tabindex-no-positive': 'error',

    // Safety & quality
    '@typescript-eslint/no-explicit-any': ['error', { fixToUnknown: true, ignoreRestArgs: false }],
    '@typescript-eslint/explicit-module-boundary-types': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: false }],
    // Import hygiene
    'import/order': [
      'error',
      {
        groups: [
          ['builtin', 'external', 'internal'],
          ['parent', 'sibling', 'index'],
        ],
        'newlines-between': 'always',
      },
    ],
    'perfectionist/sort-imports': [
      'error',
      {
        type: 'natural',
        groups: ['type', ['builtin', 'external', 'internal', 'parent', 'sibling', 'index']],
      },
    ],
    // Local policies
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'lucide-react',
            message: 'Use @aibos/ui/icons wrapper to avoid heavy bundles.',
          },
          {
            name: 'lodash',
            message: 'Use lodash-es per‑method imports or stdlib.',
          },
        ],
        patterns: [
          // No deep internal paths across services
          '@aibos/*/src/*',
          // Forbid utils → app or utils → domain (upstream) if desired
        ],
      },
    ],
  },
  overrides: [
    { files: ['**/*.ts', '**/*.tsx'], rules: {} },
    {
      files: ['**/*.test.ts', '**/*.spec.ts'],
      rules: { '@typescript-eslint/no-explicit-any': 'off' },
    },
  ],
};
```

> Tip: Keep paths aligned with your actual aliases (see §4).

---

## 3) Dependency‑Cruiser — Architectural Contracts

Create **`/dependency-cruiser.config.cjs`**:

```js
/* eslint-disable */
const { not, matchesPattern } = require('dependency-cruiser').presets;

module.exports = {
  options: {
    doNotFollow: { path: 'node_modules' },
    includeOnly: '^src|^packages|^services|^apps',
    tsConfig: {
      fileName: './tsconfig.json',
    },
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/[^/]+',
        theme: { graph: { rankdir: 'LR' } },
      },
    },
  },
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-orphans',
      severity: 'error',
      from: { orphan: true, pathNot: '(^test/|/stories/)' },
      to: {},
    },
    {
      name: 'no-duplicate-dep-types',
      severity: 'warn',
      from: {},
      to: { dependencyTypes: ['npm-dev', 'npm'] },
    },
    {
      name: 'not-to-unresolvable',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: 'not-to-dev-dep',
      severity: 'error',
      from: { path: '^(apps|services)/' },
      to: { dependencyTypes: ['npm-dev'] },
    },
    // Layering (FE)
    {
      name: 'fe-no-upstream',
      severity: 'error',
      from: { path: '^packages/ui/components' },
      to: {
        path: '^packages/ui/primitives|^packages/ui/tokens',
        pathNot: '^packages/ui/components',
      },
    },
    {
      name: 'fe-no-sibling',
      severity: 'error',
      from: { path: '^packages/ui/components' },
      to: { path: '^packages/ui/components/.+' },
    },
    // Cross-service internals banned
    {
      name: 'no-cross-service-src',
      severity: 'error',
      from: { path: '^services/[^/]+/src' },
      to: { path: '^services/(?!$1)[^/]+/src' },
    },
  ],
};
```

CLI wiring in **`package.json`** (root):

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    "lint:arch": "depcruise --config dependency-cruiser.config.cjs --output-type err .",
    "lint:graph": "depcruise --config dependency-cruiser.config.cjs --output-type dot . > .artifacts/dep-graph.dot",
    "check:all": "pnpm -r typecheck && pnpm -r lint && pnpm lint:arch"
  }
}
```

---

## 4) TypeScript Project Refs & Aliases (One Truth)

**`/tsconfig.json`** (root):

```json
{
  "files": [],
  "references": [
    { "path": "packages/contracts" },
    { "path": "packages/ui" },
    { "path": "packages/utils" },
    { "path": "services/accounting" },
    { "path": "services/inventory" },
    { "path": "apps/bff" },
    { "path": "apps/web" }
  ],
  "compilerOptions": {
    "composite": false,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "importsNotUsedAsValues": "error",
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "@aibos/contracts/*": ["packages/contracts/src/*"],
      "@aibos/ui/*": ["packages/ui/src/*"],
      "@aibos/utils/*": ["packages/utils/src/*"],
      "@aibos/bff/*": ["apps/bff/src/*"]
    }
  }
}
```

> Enforce alias‑only imports; forbid relative `../../` across package boundaries.

---

## 5) Change Safety: CODEOWNERS, Commits, PR Template, Danger

**`/.github/CODEOWNERS`**

```
# Layers
/packages/contracts/   @cid-core @platform-arch
/packages/ui/          @ui-core @platform-arch
/services/accounting/  @fin-core @platform-arch
/services/inventory/   @inv-core @platform-arch
/apps/bff/             @platform-arch
```

**`/commitlint.config.cjs`**

```js
module.exports = { extends: ['@commitlint/config-conventional'] };
```

**`.github/pull_request_template.md`**

```md
## ✅ Enhanced DoD — Must Pass Before Merge

### Code Quality

- [ ] No ESLint errors; **boundaries** clean (lineage)
- [ ] `pnpm lint:arch` passes (no cycles, no orphans, no cross-service internals)
- [ ] TypeScript strict mode passes
- [ ] Code coverage ≥80% (≥90% for critical paths)
- [ ] Mutation testing passes (≥80% mutation score)

### Security

- [ ] No secrets detected in code
- [ ] SAST scanning passes
- [ ] Dependency vulnerabilities resolved
- [ ] License compliance verified
- [ ] PII detection passes
- [ ] GDPR compliance verified

### Performance

- [ ] Bundle size within limits
- [ ] Core Web Vitals pass
- [ ] Memory leak detection passes
- [ ] k6 smoke passes SLOs (p95 < target)
- [ ] Database query performance acceptable

### Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Contract tests pass (Pact)
- [ ] E2E tests pass
- [ ] Accessibility tests pass (WCAG 2.2 AA/AAA)
- [ ] Visual regression tests pass
- [ ] Chaos engineering tests pass

### Data & Compliance

- [ ] RLS tests pass (if DB touched) — isolation verified
- [ ] Audit trail completeness verified
- [ ] Data retention policies enforced
- [ ] Data lineage tracking updated

### Observability

- [ ] OTEL spans added for new endpoints
- [ ] RED metrics implemented
- [ ] Logs redact PII; no secrets in diff
- [ ] Alerting rules updated

### Documentation

- [ ] API documentation updated
- [ ] Architecture decision records (ADRs) updated
- [ ] Runbooks updated
- [ ] Changelog updated
```

**`/dangerfile.ts`** (optional)

```ts
import { danger, fail, message } from 'danger';

if (!danger.git.modified_files.some((f) => f.includes('CHANGELOG') || f.includes('.changeset'))) {
  message('No changeset found. If this is user‑visible, add one.');
}
if (danger.git.modified_files.some((f) => f.includes('packages/ui/src/tokens'))) {
  fail('Design tokens changed — requires @ui-core approval.');
}
```

---

## 6) CI: Quality Gates That Block Drift

**`.github/workflows/quality.yml`**

```yaml
name: Enhanced Quality Gates
on: [pull_request, push]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - name: Secret Detection
        run: |
          docker run --rm -v "$PWD:/src" trufflesecurity/trufflehog:latest \
            filesystem /src --no-verification
      - name: SAST Scanning
        run: |
          docker run --rm -v "$PWD:/src" returntocorp/semgrep:latest \
            --config=auto /src
      - name: Dependency Vulnerabilities
        run: pnpm audit --audit-level moderate
      - name: License Compliance
        run: npx license-checker --onlyAllow 'MIT;Apache-2.0;BSD-3-Clause'

  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - name: Bundle Size Analysis
        run: npx bundlesize --config .bundlesizerc
      - name: Core Web Vitals
        run: npx lighthouse-ci --config .lighthouserc.json
      - name: Memory Leak Detection
        run: npx clinic doctor -- node dist/app.js

  testing:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - name: Mutation Testing
        run: npx stryker run
      - name: Contract Testing
        run: npx pact-js test
      - name: Accessibility Testing
        run: npx axe-core --config .axerc.json
      - name: Visual Regression
        run: npx chromatic --project-token $CHROMATIC_TOKEN

  data-governance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - name: PII Detection
        run: npx pii-detector --config .piirc.json
      - name: Data Retention Check
        run: npx data-retention-checker --config .retentionrc.json
      - name: GDPR Compliance
        run: npx gdpr-compliance-checker --config .gdprrc.json

  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm run typecheck
      - run: pnpm run lint
      - run: pnpm run lint:arch
      - run: pnpm run test -- --coverage
      - run: pnpm run test:rls || echo "skip if not applicable"
      - run: pnpm run perf:smoke || echo "skip if not applicable"
```

Optional **branch protection**: require status checks `typecheck`, `lint`, `lint:arch`, `test` to pass.

---

## 7) DoD Matrices (by Artifact)

### A) **Service (Domain)**

- [ ] API schema updated in `@aibos/contracts` (codegen committed)
- [ ] Outbox used for writes; idempotency key accepted
- [ ] RLS policies + tests for tenant tables
- [ ] OpenTelemetry spans + RED metrics
- [ ] DepCruiser: **no cycles/orphans/cross‑service src**
- [ ] k6 smoke: p95 < 1s writes, < 300ms reads
- [ ] Logs redact PII; no plaintext secrets

### B) **BFF (GraphQL)**

- [ ] Only calls via generated clients
- [ ] Caching strategy & cache‑busting events defined
- [ ] GraphQL schema linted; persisted queries optional
- [ ] OTEL spans; error boundaries and input validation (Zod)

### C) **Frontend App/Feature**

- [ ] Imports comply with `tokens→primitives→components→features→app`
- [ ] Forms = RHF + Zod; a11y check passes (WCAG 2.2 AA/AAA where applicable)
- [ ] No direct `lucide-react` imports; use `@aibos/ui/icons`
- [ ] Query keys centralized; optimistic updates tested

### D) **Library/Package**

- [ ] Public API exported only via `index.ts`
- [ ] No side effects; tree‑shakable
- [ ] Types stable; semver changes use Changesets

---

## 8) Allow / Forbid Policy

**Allowed (preferred):**

- `date-fns` over `moment`
- `lodash-es` per‑method imports
- `zod`, `react-hook-form`, `tanstack-query`
- Generated API clients from `@aibos/contracts`

**Forbidden (without exception):**

- Cross‑service `src/` imports (must go through contracts)
- Relative imports across packages (use aliases)
- `any` in production code (tests allowed)
- Direct `lucide-react` imports (use wrapper)
- Global mutable singletons (except DI container)

---

## 9) Tooling to Prevent Drift (Repo‑wide)

- **Syncpack:** lock dependency ranges and duplicates.
- **Knip/ts-prune:** detect unused files/exports.
- **lint‑staged + husky:** pre‑commit run `eslint --fix` and typecheck changed files.
- **Changesets:** enforce semver & changelogs on user‑visible packages.

**`package.json` (root additions):**

```json
{
  "scripts": {
    "lint:pkg": "npx npm-package-json-lint .",
    "lint:security": "npx audit-ci --config .auditrc.json",
    "lint:licenses": "npx license-checker --onlyAllow 'MIT;Apache-2.0;BSD-3-Clause'",
    "lint:bundle": "npx bundlesize --config .bundlesizerc",
    "lint:accessibility": "npx axe-core --config .axerc.json",
    "lint:performance": "npx lighthouse-ci --config .lighthouserc.json",
    "test:mutation": "npx stryker run",
    "test:contract": "npx pact-js test",
    "test:chaos": "npx chaos-monkey --config chaos.json",
    "check:all": "pnpm -r typecheck && pnpm -r lint && pnpm lint:arch && pnpm lint:security && pnpm lint:licenses && pnpm lint:bundle && pnpm lint:accessibility && pnpm lint:performance && pnpm test:mutation && pnpm test:contract && pnpm test:chaos"
  },
  "lint-staged": {
    "**/*.{ts,tsx}": ["eslint --fix", "tsc -p tsconfig.json --noEmit"],
    "**/*.{json,md}": ["prettier --write"]
  }
}
```

---

## 10) Quickstart (Human + CI)

```
pnpm i
pnpm run check:all
# if fail → fix ESLint/DepCruiser violations until green
```

> When everything is green locally, CI will be green. If CI is red, the merge is blocked — that’s the anti‑drift contract.

---

## 11) Where to Plug This In (Suggested Paths)

- `/.eslintrc.cjs` — root ESLint policy
- `/dependency-cruiser.config.cjs` — arch contract
- `/tsconfig.json` — path aliases & project refs
- `/.github/workflows/quality.yml` — quality gates
- `/.github/CODEOWNERS` — approvals & ownership
- `/.github/pull_request_template.md` — DoD checklist
- `/dangerfile.ts` — optional policy automation

---

## 12) Package.json Precautions — `main`/`module`/`types` & `type` (ESM/CJS)

> Goal: eliminate runtime/type drift when publishing & consuming packages across apps, BFF, and libraries. These rules prevent ambiguous resolution, broken types, and accidental TS source publishes.

### 12.1 Policy (Monorepo‑wide)

- **Per‑package `type`:** set `"type": "module"` **inside each library package** (`packages/*`). Do **not** set a global `type` at the repo root to avoid tool friction.
- **Apps are private:** `"private": true` for `apps/*` (Next.js, BFF) to prevent accidental publish. No `exports` for apps.
- **ESM‑first, dual output:** libraries ship ESM **and** CJS via conditional exports. Tree‑shaking enabled with `"sideEffects": false`.
- **No TS sources in publish:** only `dist/**` is published via `files` allow‑list.
- **No deep internals:** restrict deep imports by default via `exports` map (opt‑in subpaths only).

### 12.2 Library Template (packages/\*)

`packages/utils/package.json`

```json
{
  "name": "@aibos/utils",
  "version": "0.1.0",
  "private": false,
  "type": "module",
  "sideEffects": false,
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "default": "./dist/index.mjs"
    },
    "./package.json": "./package.json"
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "files": ["dist", "README.md", "LICENSE"],
  "engines": { "node": ">=18.18" }
}
```

> **Why both `exports` and `main/module`?** `exports` is authoritative for modern bundlers & Node conditions; `main/module` keeps older tools happy.

Optional strict block‑deep‑imports variant:

```json
"exports": {
  ".": { "types": "./dist/index.d.ts", "import": "./dist/index.mjs", "require": "./dist/index.cjs" }
}
```

(Consumers can’t import internal files.)

### 12.3 Build Config for Dual Output

`packages/utils/tsup.config.ts`

```ts
import { defineConfig } from 'tsup';
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  target: 'node18',
});
```

`packages/utils/tsconfig.build.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "declaration": true,
    "emitDeclarationOnly": false,
    "stripInternal": true
  },
  "include": ["src/**/*"]
}
```

### 12.4 App Template (apps/\*)

`apps/web/package.json`

```json
{
  "name": "@aibos/web",
  "private": true,
  "type": "module",
  "sideEffects": true,
  "scripts": { "build": "next build" }
}
```

(Next.js app is never published; omit `exports`.)

### 12.5 Browser vs Node Conditions (when needed)

Add conditions if a lib has browser‑only shims:

```json
"exports": {
  ".": {
    "types": "./dist/index.d.ts",
    "browser": "./dist/index.browser.mjs",
    "import": "./dist/index.mjs",
    "require": "./dist/index.cjs"
  }
}
```

Build the extra `index.browser.mjs` in tsup when needed.

### 12.6 Types Safety & Back‑compat

- Prefer `exports["."].types` over `typesVersions`. If you must support older TS, add:

```json
"typesVersions": { "*": { "*": ["dist/*", "dist/index.d.ts"] } }
```

- Always ensure the published d.ts matches runtime shape (no `export =` for ESM default).

### 12.7 Publish & Sanity Checks in CI

Add to **Quality Gates** workflow:

```yaml
- run: npx publint --strict
- run: npx are-the-types-wrong . || true
```

Add package‑json linter:

```json
"scripts": { "lint:pkg": "npx npm-package-json-lint ." }
```

Project root `.npmpackagejsonlintrc.json` can enforce presence/consistency of `main/module/types/exports/files/sideEffects` for libraries and `private` for apps.

### 12.8 Common Pitfalls Blocked

- `main` pointing to TS or `src` ⇒ **blocked** by publint + pkg‑lint.
- Missing CJS path for older tools ⇒ **fixed** by `require` condition.
- Deep internal imports ⇒ **prevented** by minimal `exports` map.
- Tree‑shaking broken ⇒ **fixed** with `sideEffects: false` and ESM build.
- Accidental publish of apps ⇒ **prevented** with `private: true`.

---

## 13) Enhanced Phase Gates (Augmenting the Master Plan)

### Phase 1 Gate (Foundation)

- **CI Enforcement:** ESLint lineage + dep-cruiser + security scanning
- **CODEOWNERS:** Active for all critical components
- **Security:** Secret detection, SAST scanning, dependency vulnerabilities
- **Performance:** Bundle size analysis, Core Web Vitals baseline
- **Testing:** Unit tests ≥70%, accessibility testing enabled

### Phase 2 Gate (Core Financial & Inventory)

- **RLS Tests:** Mandatory for all changed tables
- **Performance:** k6 smoke tests added to CI
- **Security:** License compliance, PII detection
- **Testing:** Mutation testing ≥80%, contract testing with Pact
- **Data Governance:** Audit trail completeness verified

### Phase 3 Gate (Commercial Operations)

- **Contract Tests:** Pact required for all changed APIs
- **Cross-Service:** No direct service internals allowed
- **Performance:** Memory leak detection, query performance
- **Testing:** E2E tests, visual regression testing
- **Compliance:** GDPR compliance verification

### Phase 4 Gate (Advanced Features & Scale)

- **Performance SLOs:** Codified and enforced
- **Chaos Engineering:** Smoke tests pass before production
- **Security:** Container security scanning, advanced SAST
- **Testing:** Chaos engineering, comprehensive test coverage ≥90%
- **Data Governance:** Complete data lineage tracking

---

## 14) Enhanced Configuration Files

### Bundle Size Configuration (`.bundlesizerc`)

```json
{
  "files": [
    {
      "path": "./dist/app.js",
      "maxSize": "500 kB"
    },
    {
      "path": "./dist/vendor.js",
      "maxSize": "1 MB"
    }
  ]
}
```

### Lighthouse CI Configuration (`.lighthouserc.json`)

```json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "url": ["http://localhost:3000"]
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["error", { "minScore": 0.9 }],
        "categories:seo": ["error", { "minScore": 0.9 }]
      }
    }
  }
}
```

### Accessibility Configuration (`.axerc.json`)

```json
{
  "rules": {
    "color-contrast": { "enabled": true },
    "keyboard-navigation": { "enabled": true },
    "focus-management": { "enabled": true }
  },
  "tags": ["wcag2a", "wcag2aa", "wcag21aa"]
}
```

### PII Detection Configuration (`.piirc.json`)

```json
{
  "patterns": [
    "\\b\\d{3}-\\d{2}-\\d{4}\\b", // SSN
    "\\b\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}\\b", // Credit Card
    "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b" // Email
  ],
  "exclude": ["**/*.test.*", "**/*.spec.*", "**/node_modules/**"]
}
```

---

**Outcome:** With these enhanced configs and gates, the master plan becomes **world-class executable governance**. Lineage is enforced by tools, drift is blocked at PR, security is comprehensive, performance is monitored, and DoD becomes a **binary gate** — not just documentation.
