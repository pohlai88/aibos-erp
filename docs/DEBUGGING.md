# Debugging Guide

This document provides essential debugging guidance for the AI-BOS ERP monorepo, covering critical issues and their solutions.

## Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Critical Issues](#critical-issues)
- [Common Solutions](#common-solutions)
- [Debugging Workflow](#debugging-workflow)

## Quick Diagnostics

### Health Check Commands

```bash
# Check overall project health
pnpm dx

# Check specific package health
pnpm --filter @aibos/ui lint
pnpm --filter @aibos/web typecheck
pnpm --filter @aibos/bff test

# Check dependency consistency
pnpm syncpack list-mismatches
```

### Common Error Patterns

| Error Pattern                          | Likely Cause                | Solution                                |
| -------------------------------------- | --------------------------- | --------------------------------------- |
| `Cannot find module '@aibos/ui'`       | Package not built or linked | Run `pnpm -r build`                     |
| `Property 'children' does not exist`   | Type resolution issue       | Check UI package exports                |
| `'variable' is defined but never used` | ESLint unused vars          | Prefix with `_` or configure ESLint     |
| `Module not found`                     | Cache or linking issue      | Run `pnpm -w run clean && pnpm install` |

## Critical Issues

### 1. UI Package Type Export Issues

**⚠️ CRITICAL**: Web app treating UI components as `any` types, causing JSX errors.

**Symptoms:**

- Web app shows `any` types for UI components
- JSX errors: `Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'`
- TypeScript can't infer component props

**Root Cause:** Missing TypeScript declaration files, incorrect package exports, missing transpilePackages, or stale build cache.

**Solution:**

```bash
# 1. Clean everything
pnpm -w run clean

# 2. Ensure UI package generates types
cd packages/ui && pnpm build

# 3. Verify dist/index.d.ts exists
ls dist/index.d.ts

# 4. Rebuild in correct order
pnpm -r --filter @aibos/ui build
pnpm -r --filter @aibos/web build
```

**Configuration Checklist:**

- [ ] `packages/ui/tsup.config.ts` has `dts: true` ← **CRITICAL**
- [ ] `packages/ui/package.json` has `"types": "./dist/index.d.ts"`
- [ ] `packages/ui/package.json` has proper `exports` with `types` field
- [ ] `apps/web/package.json` has `transpilePackages: ["@aibos/ui"]`

### 2. DX Command Failure - Test Script Hell

**⚠️ CRITICAL**: The `dx` command fails due to incorrect test script configuration.

**Symptoms:**

- `dx` command exits with code 1
- Error: `No test files found, exiting with code 1`

**Root Cause:** Packages without tests using `vitest run` instead of `echo 'No tests yet'`.

**Solution:**

```bash
# Check which packages have test files
find packages -name "*.test.*" -o -name "*.spec.*"

# Check test script patterns
grep -r '"test":' packages/*/package.json

# Fix packages without tests
# Change from: "test": "vitest run"
# Change to:   "test": "echo 'No tests yet'"
```

**Pattern That Works:**

```json
// ✅ For packages WITH tests
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui"
  }
}

// ✅ For packages WITHOUT tests
{
  "scripts": {
    "test": "echo 'No tests yet'"
  }
}
```

### 3. ESLint Configuration Hell

**⚠️ CRITICAL**: ESLint configuration issues causing major debugging headaches.

**Root Cause:** Base `no-unused-vars` rule conflicts with `@typescript-eslint/no-unused-vars`.

**Solution Pattern:**

```javascript
// ✅ CORRECT - Must disable base rule first
{
  files: ['apps/bff/**/*.{ts,tsx}'],
  rules: {
    'no-unused-vars': 'off',  // ← CRITICAL: Disable base rule
    '@typescript-eslint/no-unused-vars': ['error', {
      varsIgnorePattern: '^_',
      argsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
      ignoreRestSiblings: true
    }]
  }
}
```

**NestJS Dependency Injection Pattern:**

```typescript
// ✅ Prefix unused injected dependencies with underscore
constructor(
  private readonly _databaseService: DatabaseService,  // ← _ prefix
  private readonly _logger: Logger,                    // ← _ prefix
) {}
```

### 4. TypeScript Generic Type Issues

**⚠️ CRITICAL**: Eventsourcing package had 67 ESLint errors requiring systematic fixing.

**Common Patterns:**

```typescript
// ❌ Before - Using 'any'
function processEvent(event: any) {
  return event.id;
}

// ✅ After - Use 'unknown' and narrow
function processEvent(event: unknown) {
  if (isValidEvent(event)) {
    return event.id;
  }
}

// ✅ Or use type assertions with proper casting
function processEvent(event: unknown) {
  const typedEvent = event as { id: string; type: string };
  return typedEvent.id;
}
```

**Database Client Issues:**

```typescript
// ❌ Before - Missing arguments
await client.query('BEGIN');

// ✅ After - Explicit arguments
await (client as { query: (sql: string, params: unknown[]) => Promise<unknown> }).query(
  'BEGIN',
  [],
);
```

## Common Solutions

### Build Issues

```bash
# Build in correct order
pnpm -r --filter @aibos/ui build
pnpm -r --filter @aibos/eventsourcing build
pnpm -r --filter @aibos/bff build
pnpm -r --filter @aibos/web build

# Or use turbo for dependency-aware builds
pnpm turbo build
```

### Cache Issues

```bash
# Clean all caches
pnpm -w run clean

# Clean specific caches
rm -rf .turbo
rm -rf packages/*/dist
rm -rf apps/*/dist
rm -rf apps/*/.next

# Reinstall and rebuild
pnpm install
pnpm -r build
```

### Package Resolution Issues

```bash
# Reinstall dependencies
pnpm install

# Rebuild packages
pnpm -r build

# Check workspace linking
pnpm list --depth=0

# Fix version mismatches
pnpm syncpack fix-mismatches
```

### ESLint Issues

```typescript
// Correct import order:
// 1. Type imports first
import type { ComponentPropsWithRef } from 'react';

// 2. Blank line
// 3. Value imports
import { forwardRef } from 'react';

// 4. Blank line
// 5. External libraries
import { clsx } from 'clsx';

// 6. Blank line
// 7. Internal imports
import { cn } from './utils';
```

## Debugging Workflow

### The Debugging Workflow That Works

#### Step 1: Commit Everything First

```bash
# ALWAYS commit before debugging
git add .
git commit -m "Save state before debugging"
```

#### Step 2: Run Quick Diagnostics

```bash
# Use our debug script
pnpm debug:quick

# Check specific package health
pnpm --filter @aibos/ui lint
pnpm --filter @aibos/web typecheck
```

#### Step 3: Identify the Root Cause

- **Type issues** → Check package exports and transpilePackages
- **ESLint issues** → Check rule conflicts and package-specific configs
- **Build issues** → Check build order and dependencies
- **Cache issues** → Run `pnpm -w run clean`

#### Step 4: Apply Systematic Fixes

- **One package at a time** - Don't try to fix everything at once
- **Test after each fix** - Run lint/typecheck after each change
- **Use the right tools** - ESLint config for rules, tsup for types

#### Step 5: Validate the Fix

```bash
# Test the specific package
pnpm --filter @aibos/ui lint
pnpm --filter @aibos/web typecheck

# Test the full system
pnpm dx
```

### Critical Debugging Insights

#### 1. ESLint Configuration is Fragile

- **Base rules conflict** with TypeScript rules
- **Package-specific configs** must be separate objects
- **Duplicate rules** cause parsing errors
- **Disable comments** don't work with conflicting rules

#### 2. Type Resolution is Silent

- **Missing .d.ts files** don't error, just resolve to `any`
- **Package exports** must include `types` field
- **transpilePackages** is required for workspace packages
- **Build order matters** - UI package must be built first

#### 3. Monorepo Complexity

- **Multiple config files** must be consistent
- **Workspace linking** can break silently
- **Cache issues** are common and hard to debug
- **Dependency order** is critical

### The Debugging Checklist

**Before Starting:**

- [ ] Commit current state
- [ ] Run `pnpm debug:quick`
- [ ] Identify which package has issues
- [ ] Check if it's a cache issue (`pnpm -w run clean`)

**For Type Issues:**

- [ ] Check `dts: true` in tsup config
- [ ] Verify package exports include `types`
- [ ] Check transpilePackages in Next.js config
- [ ] Build UI package before web app

**For ESLint Issues:**

- [ ] Check for rule conflicts (base vs TypeScript)
- [ ] Verify package-specific configs are separate
- [ ] Look for duplicate rules
- [ ] Test with `pnpm --filter @package lint`

**For Build Issues:**

- [ ] Check build order (UI → Eventsourcing → BFF → Web)
- [ ] Verify all dependencies are installed
- [ ] Check workspace linking
- [ ] Run `pnpm turbo build` for dependency-aware builds

**After Fixing:**

- [ ] Test the specific package
- [ ] Run `pnpm dx` for full validation
- [ ] Commit the fix
- [ ] Update this documentation if needed

### Emergency Recovery

**If Everything Breaks:**

```bash
# Nuclear option
git stash  # Save current work
git reset --hard HEAD~1  # Go back to last commit
pnpm -w run clean
pnpm install
pnpm -r build
```

**If ESLint Config Breaks:**

```bash
# Check syntax
pnpm eslint --print-config eslint.config.js

# Test specific package
pnpm --filter @aibos/ui lint

# Look for duplicate rules
grep -n "unicorn/prevent-abbreviations" eslint.config.js
```

**If Types Break:**

```bash
# Check if types are generated
ls packages/ui/dist/index.d.ts

# Check package exports
cat packages/ui/package.json | grep -A 5 exports

# Check transpilePackages
cat apps/web/package.json | grep transpilePackages
```

## Getting Help

If you encounter issues not covered in this guide:

1. **Run diagnostics first**: `pnpm debug:quick`
2. **Check this guide** for similar issues
3. **Follow the debugging workflow** above
4. **Create a detailed issue report** with:
   - Error messages (full output)
   - Steps to reproduce
   - Environment details (`node --version`, `pnpm --version`)
   - Output of `pnpm debug`
   - Relevant configuration files

### When Reporting Issues

**Include This Information:**

```bash
# Environment
node --version
pnpm --version

# Configuration
cat pnpm-workspace.yaml
cat turbo.json
cat eslint.config.js | head -20

# Package status
pnpm list --depth=0
ls packages/*/dist/
ls apps/*/dist/

# Error details
pnpm debug:quick
pnpm dx
```

---

_Last updated: December 2024_
_This guide was written after a major debugging session that taught us everything about monorepo debugging._
_For the latest version, see [docs/DEBUGGING.md](docs/DEBUGGING.md)_
