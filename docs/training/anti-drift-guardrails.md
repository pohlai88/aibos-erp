# Anti-Drift Guardrails Training

## Overview

This training covers the comprehensive anti-drift guardrails implemented in the AI-BOS ERP platform. These guardrails ensure code quality, maintainability, and consistency across the entire codebase.

---

## 🎯 Learning Objectives

By the end of this training, you will understand:

1. **What are anti-drift guardrails** and why they're important
2. **How to use ESLint** for code quality enforcement
3. **How to use dependency-cruiser** for architecture enforcement
4. **How to work with TypeScript** strict mode
5. **How to use pre-commit hooks** for automated quality gates
6. **How to troubleshoot** common guardrail issues

---

## 🛡️ What Are Anti-Drift Guardrails?

Anti-drift guardrails are automated systems that prevent code quality degradation over time. They ensure:

- **Consistency**: All code follows the same standards
- **Quality**: Code meets enterprise-grade requirements
- **Security**: Vulnerabilities are caught early
- **Maintainability**: Code remains readable and maintainable
- **Architecture**: System architecture is preserved

### Key Components

1. **ESLint**: Code quality and security rules
2. **dependency-cruiser**: Architecture enforcement
3. **TypeScript**: Type safety and compile-time checks
4. **Pre-commit Hooks**: Automated quality gates
5. **CI/CD Pipeline**: Continuous quality enforcement

---

## 🔧 ESLint Configuration

### Overview

ESLint is configured with enterprise-grade rules for:

- **Code Quality**: Consistent formatting and best practices
- **Security**: Vulnerability detection and prevention
- **Performance**: Performance anti-patterns
- **Accessibility**: WCAG compliance

### Key Rules

#### Code Quality Rules

```json
{
  "rules": {
    "no-console": "error",
    "no-debugger": "error",
    "no-unused-vars": "error",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

#### Security Rules

```json
{
  "rules": {
    "security/detect-object-injection": "error",
    "security/detect-non-literal-regexp": "error",
    "security/detect-unsafe-regex": "error"
  }
}
```

#### Import Rules

```json
{
  "rules": {
    "perfectionist/sort-imports": "error",
    "import/order": "error",
    "import/no-unresolved": "error"
  }
}
```

### Running ESLint

```bash
# Lint all files
pnpm lint

# Lint specific file
pnpm lint src/utils.ts

# Fix auto-fixable issues
pnpm lint --fix

# Lint specific package
pnpm --filter @aibos/ui lint
```

### Common ESLint Issues

#### Import Order Issues

```typescript
// ❌ Wrong order
import { clsx } from 'clsx';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';

// ✅ Correct order
import type { ComponentProps } from 'react';

import { forwardRef } from 'react';
import { clsx } from 'clsx';
```

#### Security Issues

```typescript
// ❌ Object injection vulnerability
const result = config[key][value];

// ✅ Safe Map lookup
const result = configMap.get(key)?.get(value);
```

---

## 🏗️ Dependency-Cruiser Configuration

### Overview

Dependency-cruiser enforces architectural rules and prevents:

- **Circular Dependencies**: Prevents dependency cycles
- **Architecture Violations**: Enforces architectural boundaries
- **Unused Dependencies**: Identifies dead code
- **Dependency Drift**: Prevents dependency version drift

### Key Rules

#### Architecture Enforcement

```json
{
  "rules": {
    "apps/bff/src/**": {
      "forbidden": ["packages/ui/src/**"],
      "comment": "BFF should not import UI components directly"
    },
    "packages/ui/src/**": {
      "forbidden": ["apps/**"],
      "comment": "UI package should not import app-specific code"
    }
  }
}
```

#### Circular Dependency Prevention

```json
{
  "rules": {
    "no-circular": "error",
    "no-orphans": "error",
    "no-deprecated-core": "error"
  }
}
```

### Running Dependency-Cruiser

```bash
# Check all dependencies
pnpm check:deps

# Check specific package
pnpm --filter @aibos/ui check:deps

# Generate dependency graph
pnpm check:deps --output-type dot | dot -T svg > deps.svg
```

### Common Dependency Issues

#### Circular Dependencies

```typescript
// ❌ Circular dependency
// fileA.ts
import { funcB } from './fileB';
export const funcA = () => funcB();

// fileB.ts
import { funcA } from './fileA';
export const funcB = () => funcA();
```

#### Architecture Violations

```typescript
// ❌ BFF importing UI components
// apps/bff/src/auth/auth.service.ts
import { Button } from '@aibos/ui'; // Violates architecture

// ✅ BFF using contracts only
// apps/bff/src/auth/auth.service.ts
import { User } from '@aibos/contracts'; // Correct
```

---

## 📝 TypeScript Configuration

### Overview

TypeScript is configured with strict mode for:

- **Type Safety**: Catch type errors at compile time
- **Code Quality**: Enforce best practices
- **Maintainability**: Improve code readability
- **Performance**: Optimize runtime performance

### Key Settings

#### Strict Mode

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

#### Module Resolution

```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true
  }
}
```

### Running TypeScript

```bash
# Type check all files
pnpm typecheck

# Type check specific package
pnpm --filter @aibos/ui typecheck

# Watch mode
pnpm typecheck --watch
```

### Common TypeScript Issues

#### Type Safety Issues

```typescript
// ❌ Implicit any
function processData(data) {
  return data.map((item) => item.value);
}

// ✅ Explicit types
function processData(data: Array<{ value: string }>) {
  return data.map((item) => item.value);
}
```

#### Null Safety Issues

```typescript
// ❌ Potential null reference
function getName(user: User | null) {
  return user.name; // Error: user might be null
}

// ✅ Null check
function getName(user: User | null) {
  return user?.name ?? 'Unknown';
}
```

---

## 🪝 Pre-commit Hooks

### Overview

Pre-commit hooks automatically run quality checks before commits:

- **Formatting**: Ensure consistent code formatting
- **Linting**: Run ESLint checks
- **Type Checking**: Run TypeScript checks
- **Testing**: Run relevant tests
- **Dependencies**: Check dependency rules

### Configuration

#### Husky Setup

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  }
}
```

#### Lint-staged Configuration

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write", "git add"],
    "*.{js,jsx}": ["eslint --fix", "prettier --write", "git add"]
  }
}
```

### Working with Pre-commit Hooks

```bash
# Commit with hooks (automatic)
git commit -m "feat: add new feature"

# Skip hooks (not recommended)
git commit -m "feat: add new feature" --no-verify

# Run hooks manually
pnpm lint-staged
```

---

## 🚀 CI/CD Pipeline

### Overview

The CI/CD pipeline enforces quality gates:

- **Code Quality**: ESLint and dependency-cruiser
- **Type Safety**: TypeScript compilation
- **Testing**: Unit, integration, and E2E tests
- **Security**: SAST scanning and dependency checks
- **Performance**: Bundle size and performance tests

### Pipeline Stages

#### Quality Gates

```yaml
quality-gates:
  - name: 'Code Quality'
    commands:
      - pnpm lint
      - pnpm typecheck
      - pnpm check:deps

  - name: 'Testing'
    commands:
      - pnpm test
      - pnpm test:e2e
      - pnpm test:contract

  - name: 'Security'
    commands:
      - pnpm audit
      - pnpm check:security
```

#### Build and Deploy

```yaml
build-deploy:
  - name: 'Build'
    commands:
      - pnpm build

  - name: 'Deploy'
    commands:
      - pnpm deploy
```

---

## 🔍 Troubleshooting

### Common Issues

#### ESLint Errors

```bash
# Clear ESLint cache
rm -rf .eslintcache
pnpm lint

# Fix auto-fixable issues
pnpm lint --fix

# Check specific rule
pnpm lint --rule "no-console"
```

#### Dependency-Cruiser Errors

```bash
# Clear dependency-cruiser cache
rm -rf .dependency-cruiser-cache
pnpm check:deps

# Check specific rule
pnpm check:deps --rule "no-circular"
```

#### TypeScript Errors

```bash
# Clear TypeScript cache
rm -rf node_modules/.cache
pnpm typecheck

# Check specific file
pnpm typecheck src/utils.ts
```

### Debugging Tips

1. **Read Error Messages**: ESLint and TypeScript provide detailed error messages
2. **Check Configuration**: Verify configuration files are correct
3. **Clear Caches**: Clear caches when experiencing issues
4. **Incremental Fixes**: Fix issues one at a time
5. **Ask for Help**: Don't hesitate to ask the team for assistance

---

## 📚 Best Practices

### Code Quality

1. **Follow ESLint Rules**: Don't disable rules without good reason
2. **Use TypeScript Strictly**: Avoid `any` types
3. **Write Tests**: Maintain high test coverage
4. **Document Code**: Add comments for complex logic
5. **Review Code**: Always review code before merging

### Architecture

1. **Respect Boundaries**: Don't violate architectural boundaries
2. **Avoid Circular Dependencies**: Keep dependencies acyclic
3. **Use Contracts**: Share types through contracts package
4. **Minimize Dependencies**: Only import what you need
5. **Keep Packages Focused**: Each package should have a single responsibility

### Development Workflow

1. **Run Quality Checks**: Always run `pnpm dx` before committing
2. **Fix Issues Early**: Don't let issues accumulate
3. **Use Pre-commit Hooks**: Let automation handle quality checks
4. **Follow Conventions**: Use conventional commits and naming
5. **Keep Dependencies Updated**: Regularly update dependencies

---

## 🎯 Exercises

### Exercise 1: Fix ESLint Issues

1. Create a file with ESLint violations
2. Run `pnpm lint` to see the errors
3. Fix the issues using `pnpm lint --fix`
4. Verify the fixes work

### Exercise 2: Fix Dependency Issues

1. Create a circular dependency
2. Run `pnpm check:deps` to see the error
3. Refactor to remove the circular dependency
4. Verify the fix works

### Exercise 3: Fix TypeScript Issues

1. Create a file with TypeScript errors
2. Run `pnpm typecheck` to see the errors
3. Fix the type issues
4. Verify the fixes work

---

## 📞 Support

### Getting Help

- **Documentation**: Check this guide and other docs
- **Issues**: Open a GitHub issue for bugs
- **Discussions**: Use GitHub Discussions for questions
- **Team**: Contact the development team directly

### Resources

- [ESLint Documentation](https://eslint.org/docs/)
- [Dependency-Cruiser Documentation](https://github.com/sverweij/dependency-cruiser)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Husky Documentation](https://typicode.github.io/husky/)

---

**Congratulations! You've completed the Anti-Drift Guardrails training! 🎉**

You now have the knowledge and skills to work effectively with the AI-BOS ERP platform's quality enforcement systems.
