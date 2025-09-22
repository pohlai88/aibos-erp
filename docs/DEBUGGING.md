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

### UI Package Type Export Issues - The Complete Hell

**⚠️ CRITICAL**: This was one of the most painful debugging sessions. The web app was treating UI components as `any` types, causing JSX errors.

**Symptoms:**

- Web app shows `any` types for UI components
- JSX errors: `Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'`
- TypeScript can't infer component props
- Components appear as bare ref-only components

**Root Cause Analysis:**

The issue was a **perfect storm** of configuration problems:

1. **Missing TypeScript declaration files** (`.d.ts`) - `tsup.config.ts` had `dts: false`
2. **Incorrect package exports** - Missing `types` field in exports
3. **Missing transpilePackages** - Next.js wasn't processing the UI package
4. **Stale build cache** - Old builds were cached

**The Complete Solution:**

```bash
# 1. Nuclear option - clean everything
pnpm -w run clean

# 2. Ensure UI package generates types
cd packages/ui
pnpm build

# 3. Verify dist/index.d.ts exists
ls dist/index.d.ts

# 4. Check package.json exports
cat package.json | grep -A 10 '"exports"'

# 5. Rebuild in correct order
pnpm -r --filter @aibos/ui build
pnpm -r --filter @aibos/web build
```

**Configuration Checklist - Every Single Item:**

- [ ] `packages/ui/tsup.config.ts` has `dts: true` ← **CRITICAL**
- [ ] `packages/ui/package.json` has `"types": "./dist/index.d.ts"`
- [ ] `packages/ui/package.json` has proper `exports` with `types` field
- [ ] `apps/web/package.json` has `transpilePackages: ["@aibos/ui"]`
- [ ] `packages/ui/tsconfig.json` has `"jsx": "react-jsx"`
- [ ] `packages/ui/tsconfig.json` has `"declaration": true`

**The Exact Configuration That Works:**

```typescript
// packages/ui/tsup.config.ts
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true, // ← CRITICAL: Generate .d.ts files
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  skipNodeModulesBundle: true,
  minify: false,
  target: "es2022",
});
```

```json
// packages/ui/package.json
{
  "name": "@aibos/ui",
  "types": "./dist/index.d.ts", // ← CRITICAL
  "exports": {
    ".": {
      "types": "./dist/index.d.ts", // ← CRITICAL
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

```json
// apps/web/package.json
{
  "next": {
    "transpilePackages": ["@aibos/ui"] // ← CRITICAL
  }
}
```

**Why This Was So Painful:**

1. **Silent failures** - TypeScript didn't error, just resolved to `any`
2. **Cache issues** - Old builds were cached and not cleared
3. **Multiple config files** - Had to fix 4 different configuration files
4. **Build order** - UI package had to be built before web app
5. **No clear error messages** - The error was cryptic JSX prop errors

**Debugging Commands:**

```bash
# Check if types are actually generated
ls packages/ui/dist/index.d.ts

# Verify TypeScript can find the types
pnpm -C apps/web tsc --showConfig | grep @aibos

# Check if web app can resolve UI package
ls apps/web/node_modules/@aibos/ui/dist/index.d.ts

# Test type resolution
pnpm -C apps/web tsc --noEmit
```

**Prevention:**

- Always run `pnpm -w run clean` before debugging type issues
- Verify `dts: true` in tsup configs
- Check package exports include `types` field
- Ensure transpilePackages includes workspace packages
- Build UI package before web app

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

### Generic Type Issues - Eventsourcing Package Hell

**⚠️ CRITICAL**: The Eventsourcing package had 67 ESLint errors that required systematic fixing.

**What We Encountered:**

1. **67 ESLint errors** - Mix of unused variables and `any` types
2. **Type assertion issues** - `(aggregate as any).version` patterns
3. **Missing return types** - Decorator functions without explicit returns
4. **Client query issues** - Missing arguments in database calls

**The Systematic Fix Pattern:**

#### Step 1: Fix Unused Variables

```typescript
// ❌ Before - ESLint errors
export function Idempotent(requestIdExtractor: (...args: unknown[]) => string) {
  return function (
    target: unknown,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const method = descriptor.value;
    descriptor.value = async function (...args: unknown[]) {
      const requestId = requestIdExtractor(...args);
      const middleware = new IdempotencyMiddleware();
      const key = await middleware.createIdempotencyKey(requestId); // ← unused
      // ...
    };
  };
}

// ✅ After - Prefix unused with underscore
export function Idempotent(requestIdExtractor: (...args: unknown[]) => string) {
  return function (
    target: unknown,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const method = descriptor.value;
    descriptor.value = async function (...args: unknown[]) {
      const requestId = requestIdExtractor(...args);
      const middleware = new IdempotencyMiddleware();
      const _key = await middleware.createIdempotencyKey(requestId); // ← _ prefix
      // ...
    };
    return descriptor; // ← Explicit return type
  };
}
```

#### Step 2: Replace `any` with `unknown` and Narrow

```typescript
// ❌ Before - Using 'any'
function processEvent(event: any) {
  return event.id;
}

// ✅ After - Use 'unknown' and narrow
function processEvent(event: unknown) {
  if (isValidEvent(event)) {
    return event.id; // Now properly typed
  }
}

// ✅ Or use type assertions with proper casting
function processEvent(event: unknown) {
  const typedEvent = event as { id: string; type: string };
  return typedEvent.id;
}
```

#### Step 3: Fix Database Client Issues

```typescript
// ❌ Before - Missing arguments
await client.query("BEGIN");
await client.query("SELECT * FROM events");

// ✅ After - Explicit arguments
await (
  client as { query: (sql: string, params: unknown[]) => Promise<unknown> }
).query("BEGIN", []);
await (
  client as { query: (sql: string, params: unknown[]) => Promise<unknown> }
).query("SELECT * FROM events", []);
```

#### Step 4: Fix Property Access on Unknown Objects

```typescript
// ❌ Before - Unsafe property access
const rowData = row as any;
event.id = rowData.id;

// ✅ After - Safe property access with casting
const rowData = row as Record<string, unknown>;
(event as unknown as { id: string }).id = rowData.id as string;
```

**The Complete Eventsourcing Fix Pattern:**

```typescript
// ✅ Complete example of proper type handling
export async function processEvent(
  client: unknown,
  event: unknown,
  handler: { canHandle: (event: DomainEvent) => boolean },
): Promise<void> {
  // Type narrow the client
  const dbClient = client as {
    query: (sql: string, params: unknown[]) => Promise<unknown>;
  };

  // Type narrow the event
  const domainEvent = event as DomainEvent;

  if (!handler.canHandle(domainEvent)) {
    return;
  }

  try {
    await dbClient.query("BEGIN", []);
    // Process the event...
    await dbClient.query("COMMIT", []);
  } catch (error) {
    await dbClient.query("ROLLBACK", []);
    throw error;
  }
}
```

**Why This Was Painful:**

1. **67 errors** - Had to fix each one systematically
2. **Type assertions** - Required careful casting to avoid `any`
3. **Database patterns** - Had to fix client.query calls throughout
4. **Decorator complexity** - Required explicit return types
5. **Unknown vs any** - Had to understand when to use each

**Prevention:**

- Use `unknown` instead of `any` at boundaries
- Always provide explicit return types for decorators
- Prefix unused variables with `_`
- Use proper type assertions with casting
- Test database client calls with explicit arguments

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

### ESLint Configuration Hell - Critical Insights

**⚠️ CRITICAL**: This section documents the ESLint configuration issues that caused major debugging headaches. Read this carefully to avoid future pain.

#### The Unused Variables Nightmare

**What Happened:**

- ESLint was flagging unused injected dependencies in NestJS constructors
- Disable comments (`// eslint-disable-line no-unused-vars`) weren't working
- Multiple packages had different ESLint configurations causing inconsistency

**Root Cause:**
The base `no-unused-vars` rule was still active alongside `@typescript-eslint/no-unused-vars`, causing conflicts.

**The Solution Pattern:**

```javascript
// ❌ WRONG - This doesn't work
{
  files: ['apps/bff/**/*.{ts,tsx}'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', {
      varsIgnorePattern: '^_',
      argsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
      ignoreRestSiblings: true
    }]
  }
}

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

#### NestJS Dependency Injection Pattern

**The Problem:**
NestJS injects dependencies that might not be used immediately, causing ESLint errors.

**The Solution:**

```typescript
// ✅ Prefix unused injected dependencies with underscore
constructor(
  private readonly _databaseService: DatabaseService,  // ← _ prefix
  private readonly _logger: Logger,                    // ← _ prefix
) {}

// Then update all references to use the new names
async someMethod() {
  return this._databaseService.getData();  // ← Use _ prefixed name
}
```

#### Package-Specific ESLint Configuration

**Critical Pattern for Monorepos:**

```javascript
// BFF package (NestJS) - handle injected dependencies
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
},

// Eventsourcing package - handle unused vars and any types
{
  files: ['packages/eventsourcing/**/*.{ts,tsx}'],
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', {
      varsIgnorePattern: '^_',
      argsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
      ignoreRestSiblings: true
    }]
  }
},

// UI package - disable perfectionist and allow utils filename
{
  files: ['packages/ui/**/*.{ts,tsx}'],
  rules: {
    'perfectionist/sort-imports': 'off',
    'unicorn/prevent-abbreviations': ['error', {
      allowList: {
        utils: true,  // ← Allow utils.ts filename
        Props: true,
        Ref: true,
        // ... other abbreviations
      }
    }],
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

#### Duplicate Rule Prevention

**The Problem:**
ESLint config had duplicate `unicorn/prevent-abbreviations` rules causing errors.

**The Solution:**

```javascript
// ❌ WRONG - Duplicate rules
rules: {
  'unicorn/prevent-abbreviations': ['error', { allowList: { Props: true } }],
  'unicorn/prevent-abbreviations': ['error', { allowList: { utils: true } }], // ← Duplicate!
}

// ✅ CORRECT - Merge into single rule
rules: {
  'unicorn/prevent-abbreviations': ['error', {
    allowList: {
      Props: true,
      utils: true,  // ← Merged
      // ... other abbreviations
    }
  }]
}
```

#### Disable Comments That Don't Work

**Common Mistake:**

```typescript
// ❌ This doesn't work when base rule is active
constructor(
  private readonly databaseService: DatabaseService, // eslint-disable-line no-unused-vars
) {}
```

**Better Approach:**

```typescript
// ✅ Use underscore prefix + ESLint config
constructor(
  private readonly _databaseService: DatabaseService,
) {}
```

#### ESLint Flat Config Gotchas

**Critical Points:**

1. **Always disable base rule** when using TypeScript-specific rules
2. **Package-specific configs** must be separate objects in the array
3. **Duplicate rules** will cause parsing errors
4. **Disable comments** don't work reliably with conflicting rules

**Validation Commands:**

```bash
# Check ESLint config syntax
pnpm eslint --print-config eslint.config.js

# Test specific package
pnpm --filter @aibos/ui lint

# Debug ESLint issues
pnpm eslint --debug packages/ui/src/utils.ts
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

## Debugging Workflow - Lessons Learned

**⚠️ CRITICAL**: This section documents the debugging workflow that saved us from hours of pain.

### The Debugging Session That Taught Us Everything

**What We Debugged:**

1. **UI Package Type Resolution** - Web app treating components as `any`
2. **ESLint Configuration Hell** - 67 errors across multiple packages
3. **NestJS Dependency Injection** - Unused constructor parameters
4. **Eventsourcing Type Safety** - `any` types and missing return types
5. **Monorepo Build Order** - Packages not building in correct sequence

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

#### 4. NestJS Patterns

- **Injected dependencies** are often unused initially
- **Underscore prefix** is the cleanest solution
- **ESLint config** must handle `_` prefixed variables
- **Constructor parameters** need special handling

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
4. **Check the [Issues](https://github.com/your-org/aibos-erp/issues) page**
5. **Create a detailed issue report** with:
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
