# Repository Architecture Analysis & Refactoring Plan

**Date:** December 2024  
**Status:** 🚨 **CRITICAL ARCHITECTURE VIOLATIONS IDENTIFIED**  
**Priority:** **HIGH** - Immediate refactoring required

---

## 🚨 **Critical Issues Identified**

The current implementation violates clean monorepo architecture principles by placing business logic, domain types, and API clients directly in the `apps/web` directory. This creates tight coupling and violates separation of concerns.

---

## 📁 **Current Repository Structure**

### **Root Structure**
```
d:\aibos-erp\
├── apps/                          # Applications (Presentation Layer)
│   ├── bff/                       # ✅ Backend for Frontend
│   │   ├── src/
│   │   │   ├── app.module.ts
│   │   │   ├── common/
│   │   │   ├── config/
│   │   │   ├── health/
│   │   │   ├── main.ts
│   │   │   ├── migrations/
│   │   │   ├── modules/
│   │   │   └── seeds/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/                       # ❌ VIOLATION: Contains business logic
│       ├── src/
│       │   ├── app/               # Next.js App Router
│       │   │   ├── accounting/    # ❌ Business logic in app
│       │   │   │   ├── analytics/
│       │   │   │   ├── chart-of-accounts/
│       │   │   │   ├── journal-entries/
│       │   │   │   ├── page.tsx
│       │   │   │   └── reports/
│       │   │   ├── globals.css
│       │   │   ├── layout.tsx
│       │   │   └── page.tsx
│       │   ├── components/        # ❌ Business components in app
│       │   │   ├── accounting/    # ❌ Domain components
│       │   │   │   ├── __tests__/
│       │   │   │   ├── ChartOfAccounts.tsx
│       │   │   │   ├── FinancialDashboard.tsx
│       │   │   │   ├── JournalEntryForm.tsx
│       │   │   │   └── TrialBalance.tsx
│       │   │   └── Navigation.tsx
│       │   ├── hooks/             # ❌ Domain hooks in app
│       │   │   └── useAccounting.ts
│       │   └── lib/               # ❌ Domain logic in app
│       │       ├── accounting-api.ts
│       │       └── types.ts
│       ├── package.json
│       └── tsconfig.json
├── packages/                      # Shared Packages (Business Logic)
│   ├── accounting/                # ✅ Domain & Business Logic
│   │   ├── src/
│   │   │   ├── accounting.module.ts
│   │   │   ├── api/
│   │   │   ├── commands/
│   │   │   ├── domain/
│   │   │   ├── events/
│   │   │   ├── infrastructure/
│   │   │   ├── projections/
│   │   │   ├── services/
│   │   │   ├── tokens.ts
│   │   │   ├── types/
│   │   │   └── validation/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── contracts/                 # ✅ API Contracts
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── eventsourcing/             # ✅ Event Sourcing
│   │   ├── src/
│   │   │   ├── core/
│   │   │   ├── outbox/
│   │   │   ├── projections/
│   │   │   ├── schema/
│   │   │   ├── stores/
│   │   │   ├── streaming/
│   │   │   └── utils/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── ui/                        # ✅ Shared UI Components
│   │   ├── src/
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── utils.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── utils/                     # ✅ Utilities
│       ├── src/
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── docs/                          # Documentation
├── scripts/                       # Build & Setup Scripts
├── tests/                         # E2E Tests
├── templates/                     # Templates
├── package.json                   # Root package.json
├── pnpm-workspace.yaml           # Workspace configuration
└── tsconfig.base.json            # Base TypeScript config
```

---

## 🚨 **Architecture Violations**

### **Critical Issues:**

1. **❌ Business Logic in Apps**
   - `apps/web/src/components/accounting/` contains domain components
   - `apps/web/src/hooks/useAccounting.ts` contains domain hooks
   - `apps/web/src/lib/accounting-api.ts` contains API client logic

2. **❌ Domain Types in Apps**
   - `apps/web/src/lib/types.ts` contains accounting domain types
   - Should be in `packages/accounting` or `packages/contracts`

3. **❌ Tight Coupling**
   - Web app directly imports business logic
   - Violates separation of concerns
   - Makes testing and maintenance difficult

4. **❌ Violation of Clean Architecture**
   - Apps should only contain presentation logic
   - Business logic should be in packages
   - Domain types should be shared across packages

---

## 🎯 **Proposed Clean Architecture**

### **Target Structure:**
```
d:\aibos-erp\
├── apps/                          # Applications (Presentation Only)
│   ├── bff/                       # ✅ Backend for Frontend
│   └── web/                       # ✅ Presentation Layer Only
│       ├── src/
│       │   ├── app/               # Next.js App Router
│       │   │   ├── accounting/
│       │   │   │   └── page.tsx   # Only imports from packages
│       │   │   ├── layout.tsx
│       │   │   └── page.tsx
│       │   ├── components/        # App-specific UI only
│       │   │   └── Navigation.tsx
│       │   └── lib/               # App-specific utilities only
│       │       └── app-config.ts
│       ├── package.json
│       └── tsconfig.json
├── packages/                      # Shared Packages (Business Logic)
│   ├── accounting/                # ✅ Domain & Business Logic
│   │   ├── src/
│   │   │   ├── domain/           # Domain entities & logic
│   │   │   ├── services/         # Business services
│   │   │   ├── infrastructure/   # Data access & external services
│   │   │   ├── api/              # API controllers & routes
│   │   │   ├── events/           # Domain events
│   │   │   ├── projections/      # Read models & projections
│   │   │   ├── validation/       # Input validation
│   │   │   ├── types/            # Domain types & interfaces
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── accounting-web/            # 🆕 Web-specific components
│   │   ├── src/
│   │   │   ├── components/       # Web UI components
│   │   │   │   ├── JournalEntryForm.tsx
│   │   │   │   ├── FinancialDashboard.tsx
│   │   │   │   ├── ChartOfAccounts.tsx
│   │   │   │   └── TrialBalance.tsx
│   │   │   ├── hooks/            # React hooks
│   │   │   │   └── useAccounting.ts
│   │   │   ├── lib/              # Web-specific utilities
│   │   │   │   └── accounting-api.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── accounting-contracts/     # 🆕 API Contracts & Types
│   │   ├── src/
│   │   │   ├── types/            # Shared types
│   │   │   │   ├── journal-entry.ts
│   │   │   │   ├── chart-of-accounts.ts
│   │   │   │   ├── financial-reports.ts
│   │   │   │   └── index.ts
│   │   │   ├── api/              # API contracts
│   │   │   │   └── endpoints.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── contracts/                # ✅ API Contracts
│   ├── eventsourcing/             # ✅ Event Sourcing
│   ├── ui/                        # ✅ Shared UI Components
│   └── utils/                     # ✅ Utilities
```

---

## 🔧 **Refactoring Plan**

### **Phase 1: Create New Packages**

#### **1.1 Create `packages/accounting-web`**
```bash
mkdir packages/accounting-web
cd packages/accounting-web
```

**Package Structure:**
```
packages/accounting-web/
├── src/
│   ├── components/
│   │   ├── JournalEntryForm.tsx
│   │   ├── FinancialDashboard.tsx
│   │   ├── ChartOfAccounts.tsx
│   │   └── TrialBalance.tsx
│   ├── hooks/
│   │   └── useAccounting.ts
│   ├── lib/
│   │   └── accounting-api.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

**Dependencies:**
- `@aibos/accounting` (domain logic)
- `@aibos/ui` (UI components)
- `@aibos/contracts` (types)
- `react`, `react-dom`
- `@tanstack/react-query`
- `react-hook-form`
- `zod`

#### **1.2 Create `packages/accounting-contracts`**
```bash
mkdir packages/accounting-contracts
cd packages/accounting-contracts
```

**Package Structure:**
```
packages/accounting-contracts/
├── src/
│   ├── types/
│   │   ├── journal-entry.ts
│   │   ├── chart-of-accounts.ts
│   │   ├── financial-reports.ts
│   │   └── index.ts
│   ├── api/
│   │   └── endpoints.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

**Dependencies:**
- `zod` (for validation)
- `@aibos/accounting` (domain types)

### **Phase 2: Move Business Logic**

#### **2.1 Move Components**
```bash
# Move from apps/web/src/components/accounting/ to packages/accounting-web/src/components/
mv apps/web/src/components/accounting/* packages/accounting-web/src/components/
```

#### **2.2 Move Hooks**
```bash
# Move from apps/web/src/hooks/ to packages/accounting-web/src/hooks/
mv apps/web/src/hooks/useAccounting.ts packages/accounting-web/src/hooks/
```

#### **2.3 Move API Client**
```bash
# Move from apps/web/src/lib/ to packages/accounting-web/src/lib/
mv apps/web/src/lib/accounting-api.ts packages/accounting-web/src/lib/
```

#### **2.4 Move Types**
```bash
# Move from apps/web/src/lib/types.ts to packages/accounting-contracts/src/types/
mv apps/web/src/lib/types.ts packages/accounting-contracts/src/types/
```

### **Phase 3: Update Imports**

#### **3.1 Update `apps/web/src/app/accounting/page.tsx`**
```typescript
// Before (❌ Wrong)
import { JournalEntryForm } from '../../components/accounting/JournalEntryForm';
import { FinancialDashboard } from '../../components/accounting/FinancialDashboard';

// After (✅ Correct)
import { JournalEntryForm, FinancialDashboard } from '@aibos/accounting-web';
```

#### **3.2 Update Package Dependencies**
```json
// apps/web/package.json
{
  "dependencies": {
    "@aibos/accounting-web": "workspace:*",
    "@aibos/accounting-contracts": "workspace:*",
    "@aibos/ui": "workspace:*"
  }
}
```

### **Phase 4: Clean Apps Directory**

#### **4.1 Remove Business Logic from `apps/web`**
```bash
# Remove business logic directories
rm -rf apps/web/src/components/accounting/
rm -rf apps/web/src/hooks/
rm -rf apps/web/src/lib/accounting-api.ts
rm -rf apps/web/src/lib/types.ts
```

#### **4.2 Keep Only Presentation Logic**
```
apps/web/src/
├── app/                    # Next.js App Router
│   ├── accounting/
│   │   └── page.tsx        # Only imports from packages
│   ├── layout.tsx
│   └── page.tsx
├── components/             # App-specific UI only
│   └── Navigation.tsx
└── lib/                    # App-specific utilities only
    └── app-config.ts
```

---

## 📋 **Detailed File Migration**

### **Files to Move:**

#### **From `apps/web/src/components/accounting/` to `packages/accounting-web/src/components/`:**
- `JournalEntryForm.tsx` → `packages/accounting-web/src/components/JournalEntryForm.tsx`
- `FinancialDashboard.tsx` → `packages/accounting-web/src/components/FinancialDashboard.tsx`
- `ChartOfAccounts.tsx` → `packages/accounting-web/src/components/ChartOfAccounts.tsx`
- `TrialBalance.tsx` → `packages/accounting-web/src/components/TrialBalance.tsx`

#### **From `apps/web/src/hooks/` to `packages/accounting-web/src/hooks/`:**
- `useAccounting.ts` → `packages/accounting-web/src/hooks/useAccounting.ts`

#### **From `apps/web/src/lib/` to `packages/accounting-web/src/lib/`:**
- `accounting-api.ts` → `packages/accounting-web/src/lib/accounting-api.ts`

#### **From `apps/web/src/lib/` to `packages/accounting-contracts/src/types/`:**
- `types.ts` → `packages/accounting-contracts/src/types/index.ts`

### **Files to Update:**

#### **Import Updates Required:**
1. `apps/web/src/app/accounting/page.tsx`
2. `apps/web/src/app/layout.tsx`
3. `apps/web/src/app/page.tsx`
4. `apps/web/src/components/Navigation.tsx`

#### **Package.json Updates Required:**
1. `packages/accounting-web/package.json` (new)
2. `packages/accounting-contracts/package.json` (new)
3. `apps/web/package.json` (add dependencies)
4. Root `package.json` (add workspace references)

---

## 🎯 **Benefits of Refactoring**

### **Architecture Benefits:**
- ✅ **Separation of Concerns**: Business logic separated from presentation
- ✅ **Reusability**: Components can be used across multiple apps
- ✅ **Testability**: Business logic can be tested independently
- ✅ **Maintainability**: Changes to business logic don't affect presentation
- ✅ **Scalability**: Easy to add new apps (mobile, desktop)

### **Development Benefits:**
- ✅ **Type Safety**: Shared types across packages
- ✅ **Code Reuse**: Components shared across apps
- ✅ **Independent Development**: Teams can work on different packages
- ✅ **Version Management**: Packages can be versioned independently

### **Deployment Benefits:**
- ✅ **Independent Deployment**: Packages can be deployed separately
- ✅ **Bundle Optimization**: Only necessary code included in apps
- ✅ **Caching**: Shared packages can be cached independently

---

## 🚀 **Implementation Timeline**

### **Week 1: Package Creation**
- Day 1-2: Create `packages/accounting-web`
- Day 3-4: Create `packages/accounting-contracts`
- Day 5: Update workspace configuration

### **Week 2: Code Migration**
- Day 1-2: Move components and hooks
- Day 3-4: Move API client and types
- Day 5: Update imports and dependencies

### **Week 3: Testing & Validation**
- Day 1-2: Update tests
- Day 3-4: Validate functionality
- Day 5: Performance testing

---

## ⚠️ **Risks & Mitigation**

### **Risks:**
1. **Breaking Changes**: Import paths will change
2. **Testing**: Tests need to be updated
3. **Dependencies**: Package dependencies need to be managed
4. **Build Process**: Build configuration needs updates

### **Mitigation:**
1. **Incremental Migration**: Move packages one at a time
2. **Comprehensive Testing**: Test each step thoroughly
3. **Documentation**: Update all documentation
4. **Rollback Plan**: Keep backup of current structure

---

## 📚 **References**

- **Clean Architecture**: Robert C. Martin
- **Monorepo Best Practices**: Nx, Lerna documentation
- **Package Management**: pnpm workspace documentation
- **TypeScript**: Monorepo TypeScript configuration

---

## 🎯 **Next Steps**

1. **Review & Approve**: Review this refactoring plan
2. **Create Packages**: Start with `packages/accounting-web`
3. **Migrate Code**: Move business logic to packages
4. **Update Imports**: Update all import statements
5. **Test & Validate**: Ensure everything works correctly
6. **Document**: Update all documentation

---

**Status**: 🚨 **CRITICAL - Immediate Action Required**  
**Priority**: **HIGH** - Architecture violations must be fixed  
**Timeline**: **3 weeks** for complete refactoring

---

*This document outlines the critical architecture violations and provides a comprehensive refactoring plan to restore clean monorepo architecture.*
