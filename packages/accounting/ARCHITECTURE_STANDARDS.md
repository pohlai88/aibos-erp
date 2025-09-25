# Accounting Package Architecture Standards

## 🚨 **MANDATORY COMPLIANCE - NO EXCEPTIONS**

This document defines **NON-NEGOTIABLE** standards for the accounting package. Every developer MUST follow these standards exactly. No deviations, no "creative interpretations", no exceptions.

---

## 📁 **DIRECTORY STRUCTURE STANDARDS**

### **REQUIRED STRUCTURE:**

```
packages/accounting/src/
├── services/              # ALL business services
├── domain/               # Domain models (FLAT - no subdirectories)
├── infrastructure/       # External dependencies
│   ├── database/         # Database entities, migrations
│   ├── repositories/     # Data access layer
│   └── resilience/       # Circuit breakers, retry logic
├── api/                 # Controllers, routes (FLAT - no subdirectories)
├── events/              # Domain events
├── commands/             # Command objects
├── projections/          # Read models
├── validation/           # Schemas
├── constants/            # Injection tokens, constants
└── tests/               # ALL test files
```

### **FORBIDDEN PATTERNS:**

- ❌ NO nested subdirectories in `api/`, `domain/`, `events/`
- ❌ NO duplicate repository locations
- ❌ NO scattered test files
- ❌ NO documentation in source directories

---

## 📝 **FILE NAMING STANDARDS**

### **SERVICES (Business Logic):**

```typescript
// Pattern: {purpose}.service.ts
accounting.service.ts;
error - handling.service.ts;
financial - reporting.service.ts;
```

### **FACTORIES (Object Creation):**

```typescript
// Pattern: {purpose}.factory.ts
depreciable - asset - bundle.factory.ts;
group - coa.factory.ts;
```

### **MAPPERS (Data Transformation):**

```typescript
// Pattern: {purpose}.mapper.ts
tax - account.mapper.ts;
```

### **UTILITIES (Helper Functions):**

```typescript
// Pattern: {purpose}.util.ts
template - importer.util.ts;
template - registry.util.ts;
```

### **DOMAIN MODELS:**

```typescript
// Pattern: {model-name}.ts (lowercase)
account.ts;
journal - entry.ts;
money.ts; // NOT Money.ts
safe - objects.ts;
```

### **INFRASTRUCTURE:**

```typescript
// Pattern: {purpose}.{type}.ts
account.entity.ts;
typeorm - account.repository.ts;
circuit - breaker.ts;
```

### **TESTS:**

```typescript
// Pattern: {file-under-test}.test.ts
accounting.service.test.ts;
error - handling.service.test.ts;
accounting - controller.test.ts;
```

---

## 🏗️ **ARCHITECTURAL STANDARDS**

### **DEPENDENCY INJECTION:**

- ALL services MUST be registered in `accounting.module.ts`
- ALL services MUST have proper `@Injectable()` decorator
- ALL dependencies MUST be injected via constructor
- NO direct instantiation of services

### **EXPORTS:**

- ALL public APIs MUST be exported in `index.ts`
- Exports MUST be organized by category
- NO internal implementation details exposed

### **ERROR HANDLING:**

- ALL errors MUST go through `ErrorHandlingService`
- NO direct error throwing without context
- ALL errors MUST have correlation IDs

### **RESILIENCE:**

- ALL external calls MUST use `ResilienceManager`
- ALL projections MUST use circuit breakers
- NO direct external service calls

---

## 🧪 **TESTING STANDARDS**

### **TEST ORGANIZATION:**

- ALL tests in `tests/` directory
- Test files MUST mirror source structure
- NO tests scattered in source directories

### **TEST NAMING:**

```typescript
// Pattern: {source-file}.test.ts
accounting.service.test.ts;
error - handling.service.test.ts;
```

### **TEST STRUCTURE:**

```typescript
describe('ServiceName', () => {
  describe('methodName', () => {
    it('should do something when condition', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

---

## 📦 **MODULE STANDARDS**

### **SERVICE REGISTRATION:**

```typescript
@Module({
  providers: [
    // Core Services
    AccountingService,
    ErrorHandlingService,

    // Infrastructure
    ResilienceManager,

    // Repositories
    { provide: ACCOUNT_REPOSITORY, useClass: TypeormAccountRepository },
  ],
  exports: [
    // Only export what other modules need
    AccountingService,
    ErrorHandlingService,
  ],
})
export class AccountingModule {}
```

---

## 🚫 **FORBIDDEN PATTERNS**

### **NEVER DO THIS:**

- ❌ Mix naming conventions
- ❌ Create unnecessary subdirectories
- ❌ Scatter related files
- ❌ Use inconsistent test patterns
- ❌ Skip dependency injection
- ❌ Export internal implementations
- ❌ Create duplicate services
- ❌ Ignore error handling standards

---

## ✅ **COMPLIANCE CHECKLIST**

Before submitting any code:

- [ ] File names follow exact patterns
- [ ] Directory structure matches requirements
- [ ] Services properly registered in module
- [ ] Tests in correct location with correct naming
- [ ] Exports properly organized
- [ ] Error handling follows standards
- [ ] Resilience patterns implemented
- [ ] No forbidden patterns used

---

## 🔍 **CODE REVIEW REQUIREMENTS**

Every PR MUST be reviewed for:

1. **Naming Convention Compliance**
2. **Directory Structure Compliance**
3. **Architectural Pattern Compliance**
4. **Test Organization Compliance**

**NO EXCEPTIONS. NO "IT'S JUST A SMALL CHANGE".**

---

## 📊 **METRICS & MONITORING**

We track:

- File naming compliance rate
- Directory structure violations
- Test coverage by category
- Module registration completeness
- Export organization quality

**Target: 100% compliance. No exceptions.**

---

## 🎯 **ENFORCEMENT**

- **Automated**: Linting rules enforce naming
- **Manual**: Code reviews check structure
- **CI/CD**: Build fails on violations
- **Documentation**: This README is the source of truth

**Violations result in PR rejection. Period.**
