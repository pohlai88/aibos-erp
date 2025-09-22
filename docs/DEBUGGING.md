# Debugging Guide

This document provides comprehensive debugging guidance for the AI-BOS ERP monorepo, covering common issues and their solutions.

## Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Build Issues](#build-issues)
- [TypeScript Issues](#typescript-issues)
- [ESLint Issues](#eslint-issues)
- [Package Resolution Issues](#package-resolution-issues)
- [Cache Issues](#cache-issues)
- [Dependency Issues](#dependency-issues)
- [Development Workflow](#development-workflow)
- [Troubleshooting Commands](#troubleshooting-commands)

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

## Build Issues

### UI Package Type Export Issues

**Symptoms:**

- Web app shows `any` types for UI components
- JSX errors: `Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'`

**Root Cause:**

- Missing TypeScript declaration files (`.d.ts`)
- Incorrect package exports configuration
- Missing `transpilePackages` in Next.js config

**Solution:**

```bash
# 1. Ensure UI package generates types
cd packages/ui
pnpm build

# 2. Verify dist/index.d.ts exists
ls dist/index.d.ts

# 3. Check package.json exports
cat package.json | grep -A 10 '"exports"'

# 4. Clean and rebuild
pnpm -w run clean
pnpm -r --filter @aibos/ui build
pnpm -r --filter @aibos/web build
```

**Configuration Checklist:**

- [ ] `packages/ui/tsup.config.ts` has `dts: true`
- [ ] `packages/ui/package.json` has `"types": "./dist/index.d.ts"`
- [ ] `packages/ui/package.json` has proper `exports` with `types` field
- [ ] `apps/web/package.json` has `transpilePackages: ["@aibos/ui"]`

### Monorepo Build Order Issues

**Symptoms:**

- Build failures due to missing dependencies
- TypeScript can't find workspace packages

**Solution:**

```bash
# Build in correct order
pnpm -r --filter @aibos/ui build
pnpm -r --filter @aibos/eventsourcing build
pnpm -r --filter @aibos/bff build
pnpm -r --filter @aibos/web build

# Or use turbo for dependency-aware builds
pnpm turbo build
```

## TypeScript Issues

### Type Resolution Problems

**Symptoms:**

- `TS2307: Cannot find module '@aibos/ui'`
- `TS2322: Type '{ children: string }' is not assignable`

**Debugging Steps:**

```bash
# 1. Check TypeScript configuration
pnpm -C apps/web tsc --showConfig

# 2. Verify module resolution
pnpm -C apps/web tsc --traceResolution | grep @aibos

# 3. Check if types are generated
ls packages/ui/dist/index.d.ts

# 4. Verify workspace linking
ls apps/web/node_modules/@aibos/ui
```

**Common Fixes:**

```json
// tsconfig.json - Ensure proper module resolution
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "paths": {
      "@aibos/*": ["packages/*/src"]
    }
  }
}
```

### Generic Type Issues

**Symptoms:**

- `TS2571: Object is of type 'unknown'`
- `TS2345: Argument of type 'number' is not assignable to parameter of type 'string'`

**Solution:**

```typescript
// Instead of 'any', use 'unknown' and narrow
function processEvent(event: unknown) {
  if (isValidEvent(event)) {
    // event is now typed
    return event.id;
  }
}

// Use type assertions with proper casting
const typedEvent = event as { id: string; type: string };
```

## ESLint Issues

### Unused Variables in NestJS (BFF)

**Symptoms:**

- `'databaseService' is defined but never used`
- Constructor parameters flagged as unused

**Solution:**

```typescript
// Prefix unused injected dependencies with underscore
constructor(
  private readonly _databaseService: DatabaseService,
  private readonly _logger: Logger,
) {}

// Update ESLint config to ignore _ prefixed vars
{
  files: ['apps/bff/**/*.{ts,tsx}'],
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', {
      varsIgnorePattern: '^_',
      argsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
      ignoreRestSiblings: true
    }]
  }
}
```

### Import Order Issues

**Symptoms:**

- `perfectionist/sort-imports` errors
- Import statements in wrong order

**Solution:**

```typescript
// Correct import order:
// 1. Type imports first
import type { ComponentPropsWithRef } from "react";

// 2. Blank line
// 3. Value imports
import { forwardRef } from "react";

// 4. Blank line
// 5. External libraries
import { clsx } from "clsx";

// 6. Blank line
// 7. Internal imports
import { cn } from "./utils";
```

### HTML Element Globals

**Symptoms:**

- `'HTMLButtonElement' is not defined`
- `'HTMLElement' is not defined`

**Solution:**

```javascript
// Add to eslint.config.js globals
globals: {
  HTMLInputElement: 'readonly',
  HTMLElement: 'readonly',
  HTMLSpanElement: 'readonly',
  HTMLButtonElement: 'readonly',
  HTMLDivElement: 'readonly',
  HTMLHeadingElement: 'readonly',
}
```

## Package Resolution Issues

### Workspace Package Not Found

**Symptoms:**

- `Cannot resolve dependency '@aibos/ui'`
- Module resolution errors

**Debugging:**

```bash
# Check workspace configuration
cat pnpm-workspace.yaml

# Verify package exists
ls packages/ui/package.json

# Check if package is built
ls packages/ui/dist/

# Verify linking
ls apps/web/node_modules/@aibos/ui
```

**Solution:**

```bash
# Reinstall dependencies
pnpm install

# Rebuild packages
pnpm -r build

# Check workspace linking
pnpm list --depth=0
```

### Version Mismatches

**Symptoms:**

- Dependency version conflicts
- Peer dependency warnings

**Solution:**

```bash
# Check for version mismatches
pnpm syncpack list-mismatches

# Fix version mismatches
pnpm syncpack fix-mismatches

# Update lockfile
pnpm install
```

## Cache Issues

### Stale Build Cache

**Symptoms:**

- Changes not reflected in builds
- Outdated type definitions
- Inconsistent build results

**Solution:**

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

### TypeScript Build Info

**Symptoms:**

- TypeScript incremental builds failing
- Stale type checking results

**Solution:**

```bash
# Remove TypeScript build info
rm -rf **/tsconfig.tsbuildinfo

# Clear TypeScript cache
pnpm -r exec tsc --build --clean
```

## Dependency Issues

### Peer Dependency Warnings

**Symptoms:**

- `WARN: unmet peer dependency`
- Version conflicts

**Solution:**

```bash
# Check peer dependencies
pnpm list --depth=0

# Install missing peer dependencies
pnpm add -D react@^18 react-dom@^18

# Update to compatible versions
pnpm update
```

### Lock File Issues

**Symptoms:**

- `ERR_PNPM_OUTDATED_LOCKFILE`
- Dependency resolution failures

**Solution:**

```bash
# Update lockfile
pnpm install

# Force update
pnpm install --force

# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## Development Workflow

### Pre-commit Hook Failures

**Symptoms:**

- Git hooks failing
- ESLint/TypeScript errors in hooks

**Debugging:**

```bash
# Run hooks manually
pnpm simple-git-hooks

# Check hook configuration
cat .simple-git-hooks.json

# Skip hooks temporarily
git commit --no-verify -m "message"
```

### Pre-push Hook Failures

**Symptoms:**

- Push blocked by dependency cruiser
- Architecture constraint violations

**Solution:**

```bash
# Check dependency rules
pnpm depcruise --validate --config .dependency-cruiser.js src

# Update dependency cruiser config
# Edit .dependency-cruiser.js
```

## Troubleshooting Commands

### Diagnostic Scripts

```bash
# Full project health check
pnpm dx

# Package-specific checks
pnpm --filter @aibos/ui lint
pnpm --filter @aibos/web typecheck
pnpm --filter @aibos/bff test

# Dependency analysis
pnpm syncpack list-mismatches
pnpm list --depth=0

# Cache management
pnpm -w run clean
pnpm store prune

# Build verification
pnpm -r build
pnpm turbo build
```

### Environment Debugging

```bash
# Check Node.js version
node --version

# Check pnpm version
pnpm --version

# Check workspace configuration
cat pnpm-workspace.yaml

# Check package.json scripts
cat package.json | grep -A 20 '"scripts"'
```

### Log Analysis

```bash
# Verbose build output
pnpm build --verbose

# TypeScript verbose output
pnpm tsc --verbose

# ESLint debug output
pnpm eslint --debug src/
```

## Common Solutions Summary

| Issue                | Quick Fix                                    |
| -------------------- | -------------------------------------------- |
| UI types not working | `pnpm -w run clean && pnpm -r build`         |
| ESLint unused vars   | Prefix with `_` or configure ESLint          |
| Import order errors  | Reorder imports or disable perfectionist     |
| Cache issues         | `pnpm -w run clean`                          |
| Dependency conflicts | `pnpm syncpack fix-mismatches`               |
| Build failures       | Check build order and dependencies           |
| Type resolution      | Verify package exports and transpilePackages |

## Getting Help

If you encounter issues not covered in this guide:

1. Check the [Issues](https://github.com/your-org/aibos-erp/issues) page
2. Run diagnostic commands above
3. Check package-specific documentation
4. Verify environment setup
5. Create a detailed issue report with:
   - Error messages
   - Steps to reproduce
   - Environment details
   - Diagnostic command outputs

---

_Last updated: $(date)_
_For the latest version, see [docs/DEBUGGING.md](docs/DEBUGGING.md)_
