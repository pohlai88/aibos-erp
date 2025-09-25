# 🚀 Enterprise Accounting Advanced Features

**Document**: Advanced FX Risk Management & Enterprise Integration  
**Version**: 1.0  
**Status**: Ready for Implementation  
**Timeline**: Phase 3 (Week 5-6)

---

## 📋 **Overview**

This document outlines advanced enterprise features including FX risk management with hedge accounting, data retention policies, multi-tenant UI, bulk operations, and accessibility compliance.

---

## 🚀 **Phase 3: Enterprise Integration (Week 5-6)**

### **3.1 Advanced FX Risk Management**

**Files to Create:**

- `packages/accounting/src/fx-rates/hedge-accounting.ts`
- `packages/accounting-ui/src/components/FXExposureDashboard.tsx`
- `packages/accounting-ui/src/components/HedgeEffectivenessCalculator.tsx`

**Implementation:**

```typescript
// packages/accounting/src/fx-rates/hedge-accounting.ts
export class HedgeAccountingService {
  async calculateEffectiveHedge(tenantId: string, exposure: FXExposure) {
    // Support for IAS 39 hedge accounting
    const effectiveness = await this.calculateHedgeEffectiveness(
      exposure.hedgeInstrument,
      exposure.hedgedItem
    );

    if (effectiveness.ratio < 0.8 || effectiveness.ratio > 1.25) {
      throw new HedgeIneffectiveError(effectiveness);
    }

    return {
      ...effectiveness,
      journalEntries: this.generateHedgeAccountingEntries(effectiveness),
      disclosureRequirements: this.getDisclosureRequirements(effectiveness),
      auditTrail: this.generateHedgeAuditTrail(effectiveness)
    };
  }

  async generateHedgeAccountingEntries(effectiveness: HedgeEffectiveness) {
    return [
      {
        type: 'HEDGE_GAIN_LOSS',
        amount: effectiveness.gainLoss,
        account: 'FX_GAIN_LOSS',
        description: `Hedge effectiveness adjustment - Ratio: ${effectiveness.ratio}`
      },
      {
        type: 'HEDGE_RESERVE',
        amount: effectiveness.reserveAmount,
        account: 'HEDGE_RESERVE',
        description: 'Hedge reserve adjustment'
      }
    ];
  }

  async getDisclosureRequirements(effectiveness: HedgeEffectiveness) {
    return {
      hedgeInstruments: effectiveness.hedgeInstruments.map(instrument => ({
        type: instrument.type,
        fairValue: instrument.fairValue,
        effectiveness: effectiveness.ratio,
        riskManagement: instrument.riskManagementObjective
      })),
      hedgedItems: effectiveness.hedgedItems.map(item => ({
        type: item.type,
        carryingAmount: item.carryingAmount,
        fairValue: item.fairValue,
        exposure: item.exposure
      })),
      effectivenessTesting: {
        method: effectiveness.testingMethod,
        frequency: effectiveness.testingFrequency,
        results: effectiveness.testingResults
      }
    };
  }
}

// packages/accounting-ui/src/components/FXExposureDashboard.tsx
export function FXExposureDashboard({ tenantId, period }: { tenantId: string; period: string }) {
  const { exposures, hedgePositions, effectiveness } = useFXExposure(tenantId, period);

  return (
    <div className="fx-exposure-dashboard">
      <h2>FX Exposure & Hedge Accounting</h2>

      <div className="exposure-summary">
        <h3>Net FX Exposure</h3>
        {exposures.map(exposure => (
          <div key={exposure.currency} className="exposure-item">
            <span>{exposure.currency}: {exposure.amount}</span>
            <span className="risk-level">{exposure.riskLevel}</span>
          </div>
        ))}
      </div>

      <div className="hedge-effectiveness">
        <h3>Hedge Effectiveness</h3>
        {effectiveness.map(hedge => (
          <div key={hedge.id} className="hedge-item">
            <span>Hedge: {hedge.instrument}</span>
            <span className={`effectiveness ${hedge.ratio < 0.8 || hedge.ratio > 1.25 ? 'ineffective' : 'effective'}`}>
              Ratio: {hedge.ratio}
            </span>
            {hedge.ratio < 0.8 || hedge.ratio > 1.25 && (
              <Alert severity="error">
                Hedge ineffective - requires adjustment
              </Alert>
            )}
          </div>
        ))}
      </div>

      <div className="disclosure-requirements">
        <h3>IAS 39 Disclosure Requirements</h3>
        <DisclosureRequirements requirements={effectiveness.disclosureRequirements} />
      </div>

      <div className="hedge-calculator">
        <h3>Hedge Effectiveness Calculator</h3>
        <HedgeEffectivenessCalculator
          onCalculate={async (exposure) => {
            const result = await hedgeAccountingService.calculateEffectiveHedge(tenantId, exposure);
            return result;
          }}
        />
      </div>
    </div>
  );
}

// packages/accounting-ui/src/components/HedgeEffectivenessCalculator.tsx
export function HedgeEffectivenessCalculator({ onCalculate }: { onCalculate: (exposure: FXExposure) => Promise<HedgeEffectiveness> }) {
  const [exposure, setExposure] = useState<FXExposure>({
    currency: 'USD',
    amount: 0,
    hedgeInstrument: null,
    hedgedItem: null
  });
  const [result, setResult] = useState<HedgeEffectiveness | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const effectiveness = await onCalculate(exposure);
      setResult(effectiveness);
    } catch (error) {
      console.error('Hedge calculation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hedge-calculator">
      <div className="input-section">
        <label>Currency</label>
        <select value={exposure.currency} onChange={e => setExposure({...exposure, currency: e.target.value})}>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
          <option value="MYR">MYR</option>
        </select>

        <label>Exposure Amount</label>
        <input
          type="number"
          value={exposure.amount}
          onChange={e => setExposure({...exposure, amount: Number(e.target.value)})}
        />

        <button onClick={handleCalculate} disabled={loading}>
          {loading ? 'Calculating...' : 'Calculate Effectiveness'}
        </button>
      </div>

      {result && (
        <div className="result-section">
          <h4>Hedge Effectiveness Result</h4>
          <div className="effectiveness-ratio">
            <span>Effectiveness Ratio: {result.ratio}</span>
            <span className={`status ${result.ratio >= 0.8 && result.ratio <= 1.25 ? 'effective' : 'ineffective'}`}>
              {result.ratio >= 0.8 && result.ratio <= 1.25 ? 'Effective' : 'Ineffective'}
            </span>
          </div>

          <div className="journal-entries">
            <h5>Generated Journal Entries</h5>
            {result.journalEntries.map((entry, index) => (
              <div key={index} className="journal-entry">
                <span>{entry.type}: {entry.amount}</span>
                <span>{entry.description}</span>
              </div>
            ))}
          </div>

          <div className="disclosure-requirements">
            <h5>Disclosure Requirements</h5>
            <pre>{JSON.stringify(result.disclosureRequirements, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
```

### **3.2 Data Retention Policy Engine**

**Files to Create:**

- `packages/policy/src/data-retention.ts`
- `packages/accounting/src/retention/retention-orchestrator.ts`

**Implementation:**

```typescript
// packages/policy/src/data-retention.ts
export class DataRetentionPolicy {
  async applyRetentionPolicy(tenantId: string, policy: RetentionPolicy) {
    const events = await this.getEventsOlderThan(tenantId, policy.retentionYears);

    for (const event of events) {
      // Anonymize instead of delete for audit trail integrity
      await this.anonymizeEvent(event, policy.anonymizationRules);

      // But keep the event hash chain intact
      await this.preserveHashChain(event);
    }

    await this.auditRetentionAction(tenantId, events.length, policy);
  }

  async anonymizeEvent(event: DomainEvent, rules: AnonymizationRules) {
    const anonymized = { ...event };

    // Anonymize PII fields
    if (rules.anonymizeUserIds) {
      anonymized.userId = this.hashUserId(event.userId);
    }

    if (rules.anonymizeAmounts) {
      anonymized.amount = this.hashAmount(event.amount);
    }

    if (rules.anonymizeDescriptions) {
      anonymized.description = this.hashDescription(event.description);
    }

    // Preserve audit trail integrity
    anonymized.originalHash = event.hash;
    anonymized.anonymizedAt = new Date();
    anonymized.retentionPolicyVersion = rules.version;

    return anonymized;
  }

  async preserveHashChain(event: DomainEvent) {
    // Ensure the hash chain remains intact even after anonymization
    const previousHash = await this.getPreviousEventHash(event.id);
    const currentHash = this.calculateHash(event);

    await this.storeHashChain({
      eventId: event.id,
      previousHash,
      currentHash,
      anonymized: true,
      timestamp: new Date(),
    });
  }

  async auditRetentionAction(tenantId: string, eventsCount: number, policy: RetentionPolicy) {
    await this.auditLog.record('data_retention_applied', {
      tenantId,
      eventsCount,
      policyVersion: policy.version,
      retentionYears: policy.retentionYears,
      anonymizationRules: policy.anonymizationRules,
      correlationId: generateCorrelationId(),
      timestamp: new Date(),
    });
  }
}

// packages/accounting/src/retention/retention-orchestrator.ts
export class RetentionOrchestrator {
  async scheduleRetentionJobs(tenantId: string) {
    // Schedule daily retention checks
    await this.scheduler.schedule('daily-retention-check', {
      tenantId,
      cron: '0 2 * * *', // 2 AM daily
      job: async () => {
        await this.processRetentionForTenant(tenantId);
      },
    });
  }

  async processRetentionForTenant(tenantId: string) {
    const policy = await this.getRetentionPolicy(tenantId);
    if (!policy) return;

    const events = await this.getEventsOlderThan(tenantId, policy.retentionYears);

    if (events.length === 0) return;

    // Process in batches to avoid memory issues
    const batchSize = 1000;
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      await this.processBatch(batch, policy);
    }

    // Update retention metrics
    await this.updateRetentionMetrics(tenantId, events.length);
  }

  async processBatch(events: DomainEvent[], policy: RetentionPolicy) {
    const anonymizedEvents = await Promise.all(
      events.map((event) =>
        this.dataRetentionPolicy.anonymizeEvent(event, policy.anonymizationRules),
      ),
    );

    // Store anonymized events
    await this.storeAnonymizedEvents(anonymizedEvents);

    // Preserve hash chains
    await Promise.all(events.map((event) => this.dataRetentionPolicy.preserveHashChain(event)));
  }
}
```

### **3.3 Multi-tenant UI**

**Files to Create:**

- `packages/accounting-ui/src/components/TenantSelector.tsx`
- `packages/accounting-ui/src/hooks/useTenant.ts`
- `packages/accounting-ui/src/components/TenantContext.tsx`

**Implementation:**

```typescript
// packages/accounting-ui/src/components/TenantSelector.tsx
export function TenantSelector({ currentTenant, onTenantChange }: TenantSelectorProps) {
  const { tenants, loading } = useTenants();
  const [selectedTenant, setSelectedTenant] = useState(currentTenant);

  const handleTenantChange = async (tenantId: string) => {
    setSelectedTenant(tenantId);

    // Clear all cached data for previous tenant
    await queryClient.clear();

    // Update tenant context
    onTenantChange(tenantId);

    // Log tenant switch for audit
    await auditLog.record('tenant_switched', {
      fromTenant: currentTenant,
      toTenant: tenantId,
      userId: getCurrentUserId(),
      correlationId: generateCorrelationId(),
      timestamp: new Date()
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="tenant-selector">
      <label htmlFor="tenant-select">Select Tenant:</label>
      <select
        id="tenant-select"
        value={selectedTenant}
        onChange={e => handleTenantChange(e.target.value)}
        className="tenant-dropdown"
      >
        {tenants.map(tenant => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.name} ({tenant.id})
          </option>
        ))}
      </select>

      <div className="tenant-info">
        <span>Current: {tenants.find(t => t.id === selectedTenant)?.name}</span>
        <span>Status: {tenants.find(t => t.id === selectedTenant)?.status}</span>
      </div>
    </div>
  );
}

// packages/accounting-ui/src/hooks/useTenant.ts
export function useTenant() {
  const [currentTenant, setCurrentTenant] = useState<string | null>(null);
  const [tenantContext, setTenantContext] = useState<TenantContext | null>(null);

  const switchTenant = async (tenantId: string) => {
    // Validate tenant access
    const hasAccess = await validateTenantAccess(tenantId);
    if (!hasAccess) {
      throw new Error('Access denied to tenant');
    }

    // Load tenant context
    const context = await loadTenantContext(tenantId);

    setCurrentTenant(tenantId);
    setTenantContext(context);

    // Update all API calls to use new tenant
    updateAPITenantContext(tenantId);
  };

  const getTenantPolicy = () => {
    return tenantContext?.policy;
  };

  const getTenantSettings = () => {
    return tenantContext?.settings;
  };

  return {
    currentTenant,
    tenantContext,
    switchTenant,
    getTenantPolicy,
    getTenantSettings
  };
}
```

### **3.4 Bulk Operations**

**Files to Create:**

- `packages/accounting-ui/src/components/BulkOperations.tsx`
- `packages/accounting-ui/src/components/BatchProcessor.tsx`
- `packages/accounting-ui/src/hooks/useBulkOperations.ts`

**Implementation:**

```typescript
// packages/accounting-ui/src/components/BulkOperations.tsx
export function BulkOperations({ tenantId }: { tenantId: string }) {
  const [operation, setOperation] = useState<BulkOperationType>('import');
  const [file, setFile] = useState<File | null>(null);
  const [dryRun, setDryRun] = useState(true);
  const [results, setResults] = useState<BulkOperationResult | null>(null);

  const { executeBulkOperation, loading } = useBulkOperations();

  const handleExecute = async () => {
    if (!file) return;

    const result = await executeBulkOperation({
      tenantId,
      operation,
      file,
      dryRun,
      correlationId: generateCorrelationId()
    });

    setResults(result);
  };

  return (
    <div className="bulk-operations">
      <h2>Bulk Operations</h2>

      <div className="operation-selector">
        <label>Operation Type:</label>
        <select value={operation} onChange={e => setOperation(e.target.value as BulkOperationType)}>
          <option value="import">Import Journal Entries</option>
          <option value="reconcile">Reconcile Accounts</option>
          <option value="close">Close Period</option>
          <option value="revalue">FX Revaluation</option>
        </select>
      </div>

      <div className="file-upload">
        <label>Upload File:</label>
        <input
          type="file"
          accept=".csv,.xlsx,.json"
          onChange={e => setFile(e.target.files?.[0] || null)}
        />
      </div>

      <div className="options">
        <label>
          <input
            type="checkbox"
            checked={dryRun}
            onChange={e => setDryRun(e.target.checked)}
          />
          Dry Run (Preview Only)
        </label>
      </div>

      <button onClick={handleExecute} disabled={!file || loading}>
        {loading ? 'Processing...' : dryRun ? 'Preview' : 'Execute'}
      </button>

      {results && (
        <div className="results">
          <h3>Operation Results</h3>
          <div className="summary">
            <span>Total Records: {results.total}</span>
            <span>Successful: {results.successful}</span>
            <span>Failed: {results.failed}</span>
            <span>Warnings: {results.warnings}</span>
          </div>

          {results.failed > 0 && (
            <div className="failed-records">
              <h4>Failed Records</h4>
              <table>
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Error</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {results.failures.map((failure, index) => (
                    <tr key={index}>
                      <td>{failure.row}</td>
                      <td>{failure.error}</td>
                      <td>{JSON.stringify(failure.data)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {results.warnings > 0 && (
            <div className="warnings">
              <h4>Warnings</h4>
              {results.warningDetails.map((warning, index) => (
                <div key={index} className="warning">
                  Row {warning.row}: {warning.message}
                </div>
              ))}
            </div>
          )}

          {!dryRun && results.failed > 0 && (
            <div className="retry-section">
              <button onClick={() => retryFailedRecords(results.failures)}>
                Retry Failed Records Only
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// packages/accounting-ui/src/hooks/useBulkOperations.ts
export function useBulkOperations() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const executeBulkOperation = async (request: BulkOperationRequest): Promise<BulkOperationResult> => {
    setLoading(true);
    setProgress(0);

    try {
      // Upload file and start processing
      const jobId = await uploadBulkFile(request);

      // Poll for progress
      const result = await pollBulkOperation(jobId, (progress) => {
        setProgress(progress);
      });

      return result;
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const retryFailedRecords = async (failures: BulkOperationFailure[]) => {
    setLoading(true);

    try {
      const retryRequest = {
        operation: 'retry',
        failures,
        correlationId: generateCorrelationId()
      };

      const result = await executeBulkOperation(retryRequest);
      return result;
    } finally {
      setLoading(false);
    }
  };

  return {
    executeBulkOperation,
    retryFailedRecords,
    loading,
    progress
  };
}
```

### **3.5 Accessibility & Internationalization**

**Files to Create:**

- `packages/accounting-ui/src/components/AccessibleForm.tsx`
- `packages/accounting-ui/src/hooks/useI18n.ts`
- `packages/accounting-ui/src/components/LanguageSelector.tsx`

**Implementation:**

```typescript
// packages/accounting-ui/src/components/AccessibleForm.tsx
export function AccessibleForm({ children, onSubmit, ...props }: AccessibleFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await onSubmit(event);
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Accounting form"
      role="form"
      {...props}
    >
      {children}

      {errors.submit && (
        <div
          role="alert"
          aria-live="assertive"
          className="error-message"
        >
          {errors.submit}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        aria-describedby="submit-status"
      >
        {submitting ? 'Submitting...' : 'Submit'}
      </button>

      <div id="submit-status" aria-live="polite">
        {submitting && 'Form is being submitted'}
      </div>
    </form>
  );
}

// packages/accounting-ui/src/hooks/useI18n.ts
export function useI18n() {
  const [locale, setLocale] = useState('en-US');
  const [translations, setTranslations] = useState<Record<string, string>>({});

  const t = (key: string, params?: Record<string, string | number>) => {
    let translation = translations[key] || key;

    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{{${param}}}`, String(value));
      });
    }

    return translation;
  };

  const formatCurrency = (amount: number, currency: string = 'MYR') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const formatNumber = (number: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(locale, options).format(number);
  };

  const switchLocale = async (newLocale: string) => {
    const newTranslations = await loadTranslations(newLocale);
    setLocale(newLocale);
    setTranslations(newTranslations);

    // Update document language
    document.documentElement.lang = newLocale;
  };

  return {
    locale,
    t,
    formatCurrency,
    formatDate,
    formatNumber,
    switchLocale
  };
}

// packages/accounting-ui/src/components/LanguageSelector.tsx
export function LanguageSelector() {
  const { locale, switchLocale } = useI18n();
  const [changing, setChanging] = useState(false);

  const languages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'ms-MY', name: 'Bahasa Malaysia' },
    { code: 'zh-CN', name: '中文 (简体)' },
    { code: 'th-TH', name: 'ไทย' }
  ];

  const handleLanguageChange = async (newLocale: string) => {
    setChanging(true);
    try {
      await switchLocale(newLocale);
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="language-selector">
      <label htmlFor="language-select">Language:</label>
      <select
        id="language-select"
        value={locale}
        onChange={e => handleLanguageChange(e.target.value)}
        disabled={changing}
        aria-label="Select language"
      >
        {languages.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>

      {changing && (
        <span aria-live="polite" className="changing-indicator">
          Changing language...
        </span>
      )}
    </div>
  );
}
```

**DoD for Phase 3:**

- [ ] Advanced FX risk management with hedge accounting
- [ ] Data retention policy engine operational
- [ ] Multi-tenant UI functional
- [ ] Bulk operations implemented
- [ ] WCAG 2.1 AA compliance
- [ ] Internationalization support
- [ ] E2E tests for critical paths

---

## 🎯 **Business Value & Enterprise Readiness**

### **FX Risk Management**

- **IAS 39 Compliance**: Hedge effectiveness testing with 0.8-1.25 ratio requirements
- **Automated Journal Entries**: Generate hedge accounting entries automatically
- **Disclosure Requirements**: Automated IAS 39 disclosure generation
- **Risk Monitoring**: Real-time FX exposure tracking and alerts

### **Data Retention & Compliance**

- **Anonymization vs Deletion**: Preserve audit trail integrity while anonymizing PII
- **Hash Chain Preservation**: Keep event hash chains intact during retention
- **Policy-Driven**: Configurable retention policies per tenant
- **Audit Trail**: Track all retention actions with correlation IDs

### **Multi-Tenant Operations**

- **Tenant Isolation**: Complete data isolation with RLS
- **Context Switching**: Seamless tenant switching with cache management
- **Policy Per Tenant**: Individual policies and settings per tenant
- **Audit Logging**: Track tenant switches for compliance

### **Bulk Operations**

- **Idempotent Operations**: Safe retry mechanisms
- **Dry-Run Preview**: Preview changes before execution
- **Batch Processing**: Handle large datasets efficiently
- **Error Recovery**: Retry failed records only

### **Accessibility & Internationalization**

- **WCAG 2.1 AA Compliance**: Full accessibility support
- **Multi-Language**: Support for multiple locales
- **Currency Formatting**: Proper currency and number formatting
- **Screen Reader Support**: Full screen reader compatibility

---

## 📊 **Success Metrics**

### **Technical Metrics**

- **FX Variance**: Target <0.5%
- **Hedge Effectiveness**: Target 80-125% ratio
- **Bulk Processing**: Target <60s per 1000 records
- **Accessibility Score**: Target 100% WCAG compliance

### **Business Metrics**

- **Multi-Tenant Onboarding**: Target <1 day setup
- **Data Retention Compliance**: Target 100% policy adherence
- **User Satisfaction**: Target >90% accessibility rating
- **International Usage**: Target 5+ supported locales

---

## 🛠️ **Technical Implementation**

### **File Structure**

```
packages/accounting-ui/src/components/
├── FXExposureDashboard.tsx           # FX risk management
├── HedgeEffectivenessCalculator.tsx  # Hedge accounting calculator
├── TenantSelector.tsx                # Multi-tenant UI
├── BulkOperations.tsx                # Bulk operations interface
├── BatchProcessor.tsx                # Batch processing component
├── AccessibleForm.tsx                # Accessibility-compliant forms
└── LanguageSelector.tsx              # Internationalization

packages/accounting/src/
├── fx-rates/
│   └── hedge-accounting.ts           # IAS 39 hedge accounting
├── retention/
│   └── retention-orchestrator.ts    # Data retention management
└── hooks/
    ├── useBulkOperations.ts          # Bulk operations logic
    └── useI18n.ts                    # Internationalization
```

### **Dependencies**

```json
{
  "dependencies": {
    "@react-aria/button": "^3.0.0", // Accessibility primitives
    "@react-aria/select": "^3.0.0", // Accessible select components
    "react-i18next": "^13.0.0", // Internationalization
    "papaparse": "^5.4.0", // CSV parsing for bulk operations
    "xlsx": "^0.18.0" // Excel file processing
  }
}
```

---

## 🎯 **Definition of Done**

### **Phase 3 DoD:**

- [ ] Advanced FX risk management with hedge accounting
- [ ] Data retention policy engine operational
- [ ] Multi-tenant UI functional
- [ ] Bulk operations implemented
- [ ] WCAG 2.1 AA compliance
- [ ] Internationalization support
- [ ] E2E tests for critical paths

---

_This advanced features document provides enterprise-grade functionality including FX risk management, data retention, multi-tenancy, bulk operations, and accessibility compliance that positions the accounting system for global enterprise deployment._
