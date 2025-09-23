# Troubleshooting Checklist

Quick reference for common issues and their solutions.

## 🚨 Emergency Fixes

### Build Completely Broken

```bash
# Nuclear option - clean everything
pnpm -w run clean
pnpm install
pnpm -r build
```

### TypeScript Errors Everywhere

```bash
# Clear TypeScript cache
rm -rf **/tsconfig.tsbuildinfo
pnpm -r exec tsc --build --clean
pnpm -r typecheck
```

### ESLint Errors Everywhere

```bash
# Check ESLint config
pnpm eslint --print-config eslint.config.js
# Fix common issues
pnpm -r lint --fix
```

## 🔍 Quick Diagnostics

### Run Health Check

```bash
pnpm debug:quick
```

### Check Specific Package

```bash
# UI package
pnpm --filter @aibos/ui lint
pnpm --filter @aibos/ui typecheck
pnpm --filter @aibos/ui build

# Web app
pnpm --filter @aibos/web lint
pnpm --filter @aibos/web typecheck
pnpm --filter @aibos/web build

# BFF
pnpm --filter @aibos/bff lint
pnpm --filter @aibos/bff typecheck
pnpm --filter @aibos/bff test
```

## 📋 Issue-Specific Checklists

### UI Package Type Issues

- [ ] `packages/ui/dist/index.d.ts` exists
- [ ] `packages/ui/package.json` has `"types": "./dist/index.d.ts"`
- [ ] `packages/ui/package.json` has proper `exports` with `types`
- [ ] `apps/web/package.json` has `transpilePackages: ["@aibos/ui"]`
- [ ] `packages/ui/tsup.config.ts` has `dts: true`

### ESLint Issues

- [ ] `eslint.config.js` exists and is valid
- [ ] Package-specific rules are configured
- [ ] Unused variables prefixed with `_`
- [ ] Import order follows perfectionist rules
- [ ] HTML element globals are defined

### Dependency Issues

- [ ] `pnpm-workspace.yaml` is correct
- [ ] All packages have `package.json`
- [ ] No version mismatches: `pnpm syncpack list-mismatches`
- [ ] Workspace packages are linked: `pnpm list --depth=0`

### Build Issues

- [ ] Build order: UI → Eventsourcing → BFF → Web
- [ ] All dependencies are installed: `pnpm install`
- [ ] No stale cache: `pnpm -w run clean`
- [ ] Turbo config is valid: `turbo.json`

## 🛠️ Common Commands

### Cache Management

```bash
# Clean all caches
pnpm -w run clean

# Clean specific caches
rm -rf .turbo
rm -rf packages/*/dist
rm -rf apps/*/.next
rm -rf **/tsconfig.tsbuildinfo
```

### Dependency Management

```bash
# Check for issues
pnpm syncpack list-mismatches
pnpm list --depth=0

# Fix issues
pnpm syncpack fix-mismatches
pnpm install
```

### Build Management

```bash
# Build all packages
pnpm -r build

# Build specific package
pnpm --filter @aibos/ui build

# Build with dependencies
pnpm turbo build
```

### Linting & Type Checking

```bash
# Run all checks
pnpm dx

# Run specific checks
pnpm -r lint
pnpm -r typecheck
pnpm -r test
```

## 🎯 Specific Error Solutions

### "Cannot find module '@aibos/ui'"

1. Check if UI package is built: `ls packages/ui/dist/`
2. Rebuild UI package: `pnpm --filter @aibos/ui build`
3. Check workspace linking: `ls apps/web/node_modules/@aibos/ui`

### "Property 'children' does not exist"

1. Check UI package exports: `cat packages/ui/package.json | grep exports`
2. Verify types are generated: `ls packages/ui/dist/index.d.ts`
3. Check transpilePackages: `cat apps/web/package.json | grep transpilePackages`

### "'variable' is defined but never used"

1. Prefix with underscore: `_variable`
2. Check ESLint config for `varsIgnorePattern: '^_'`
3. Use disable comment: `// eslint-disable-line no-unused-vars`

### "perfectionist/sort-imports" errors

1. Reorder imports: types first, then values, then externals
2. Disable for specific package in `eslint.config.js`
3. Use `// eslint-disable-line perfectionist/sort-imports`

### "HTMLButtonElement is not defined"

1. Add to ESLint globals in `eslint.config.js`
2. Check if HTML element globals are defined
3. Verify UI package ESLint configuration

## 📞 Getting Help

### Before Asking for Help

1. Run `pnpm debug` for diagnostics
2. Check this troubleshooting guide
3. Verify environment setup
4. Try common fixes above

### When Reporting Issues

Include:

- Error messages (full output)
- Steps to reproduce
- Environment details (`node --version`, `pnpm --version`)
- Output of `pnpm debug`
- Relevant configuration files

### Useful Debug Information

```bash
# Environment
node --version
pnpm --version
cat package.json | grep version

# Configuration
cat pnpm-workspace.yaml
cat turbo.json
cat eslint.config.js | head -20

# Package status
pnpm list --depth=0
ls packages/*/dist/
ls apps/*/dist/
```

---

_Keep this checklist handy for quick reference during development!_
