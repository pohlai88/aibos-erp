# 💼 Enterprise Accounting Business Features

**Document**: Advanced Business Features & MFRS/IFRS Differentiation  
**Version**: 1.0  
**Status**: Ready for Implementation  
**Timeline**: Phase 2 (Week 3-4)

---

## 📋 **Overview**

This document outlines advanced business features that provide competitive differentiation through MFRS/IFRS-aware UI, smart approval workflows, tamper-evident audit trails, and automated audit package generation.

---

## 🚀 **Phase 2: Advanced Business Features (Week 3-4)**

### **2.1 MFRS/IFRS-Aware UI (Differentiator)**
**Files to Create:**
- `packages/accounting-ui/src/components/AccountInspector.tsx`
- `packages/accounting-ui/src/components/JournalRulePreview.tsx`
- `packages/accounting-ui/src/components/DisclosureReadyReports.tsx`
- `packages/accounting/src/services/mfrs-mapping.service.ts`
- `packages/accounting/src/services/fx-rates.service.ts`

**Implementation:**
```typescript
// packages/accounting-ui/src/components/AccountInspector.tsx
export function AccountInspector({ accountId }: { accountId: string }) {
  const { account, mfrsMapping, disclosureNotes, unmappedWarning } = useAccountDetails(accountId);
  
  return (
    <div className="account-inspector">
      <h3>{account.code} - {account.name}</h3>
      
      {unmappedWarning && (
        <div className="warning-banner">
          ⚠️ Account not mapped to MFRS/IFRS - requires mapping before period close
        </div>
      )}
      
      <div className="mfrs-section">
        <h4>MFRS/IFRS References</h4>
        <ul>
          {mfrsMapping.map(ref => (
            <li key={ref.id}>
              <a href={ref.url} target="_blank" rel="noopener">
                {ref.standard} v{ref.version} - {ref.section}
              </a>
              <span className="disclosure-line">→ {ref.disclosureLine}</span>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="disclosure-mapping">
        <h4>Disclosure Mapping</h4>
        <p>{disclosureNotes}</p>
        <div className="note-linkage">
          <strong>Note Linkage:</strong> {account.noteLinkage || 'Not specified'}
        </div>
      </div>
      
      <div className="fx-policy">
        <h4>FX Rate Policy</h4>
        <p>Transaction Rate: {account.fxPolicy?.transactionRate || 'Default'}</p>
        <p>Period-End Rate: {account.fxPolicy?.periodEndRate || 'Default'}</p>
        <p>Average Rate: {account.fxPolicy?.averageRate || 'Default'}</p>
      </div>
    </div>
  );
}

// packages/accounting-ui/src/components/JournalRulePreview.tsx
export function JournalRulePreview({ journalEntry }: { journalEntry: TJournalEntry }) {
  const { impacts, warnings } = useJournalImpacts(journalEntry);
  
  return (
    <div className="rule-preview">
      <h4>Derived Impacts</h4>
      <ul>
        {impacts.fxTranslation && <li>FX Translation: {impacts.fxTranslation}</li>}
        {impacts.taxObligations && <li>Tax Obligations: {impacts.taxObligations}</li>}
        {impacts.consolidationEliminations && <li>Consolidation Eliminations: {impacts.consolidationEliminations}</li>}
      </ul>
      {warnings.length > 0 && (
        <div className="warnings">
          <h4>SoD Checks</h4>
          {warnings.map(warning => (
            <div key={warning.id} className="warning">
              {warning.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// packages/accounting/src/services/fx-rates.service.ts
export class FXRatesService {
  async getRate(currency: string, rateType: 'transaction' | 'period-end' | 'average', date: Date) {
    const rate = await this.fetchRate(currency, rateType, date);
    
    return {
      currency,
      rateType,
      rate,
      source: rate.source, // e.g., 'Central Bank', 'Bloomberg'
      lockedAt: rate.lockedAt, // null if not locked
      policyVersion: rate.policyVersion
    };
  }
  
  async lockRatesForPeriod(tenantId: string, periodId: string, lockedBy: string) {
    // Lock all rates used in period close
    const rates = await this.getPeriodRates(tenantId, periodId);
    
    for (const rate of rates) {
      await this.lockRate(rate.id, {
        lockedBy,
        lockedAt: new Date(),
        periodId,
        correlationId: generateCorrelationId()
      });
    }
  }
}
```

### **2.2 Smart Approval Workflows with SLA Timers**
**Files to Create:**
- `packages/accounting-ui/src/components/ApprovalWorkflow.tsx`
- `packages/accounting-ui/src/components/WorkflowSteps.tsx`
- `packages/accounting-ui/src/components/SLATimer.tsx`
- `packages/accounting-ui/src/hooks/useApprovalWorkflow.ts`

**Implementation:**
```typescript
// packages/accounting-ui/src/components/ApprovalWorkflow.tsx
export function ApprovalWorkflow({ 
  journalEntry, 
  currentUser, 
  policy 
}: Props) {
  const { workflow, submitForApproval, approve, reject } = useApprovalWorkflow();
  const { can } = usePolicy();
  
  const handleSubmitForApproval = async () => {
    // Use policy engine to determine approvers
    const approvers = policy.workflows['journal:approve'].tiers
      .find(tier => journalEntry.totalAmount <= tier.max)
      ?.approvers || [];
    
    await submitForApproval(journalEntry.id, {
      approvers,
      currentUser: currentUser.id,
      slaHours: 48 // Auto-escalate after 48h
    });
  };
  
  return (
    <div className="approval-workflow">
      <WorkflowSteps 
        steps={workflow?.steps || []}
        currentStep={workflow?.currentStep}
        onApprove={approve}
        onReject={reject}
      />
      {workflow?.currentStep && (
        <SLATimer 
          startTime={workflow.currentStep.startedAt}
          slaHours={48}
          onEscalate={() => escalateApproval(workflow.id)}
        />
      )}
      {!workflow && (
        <button 
          onClick={handleSubmitForApproval}
          disabled={!can(['journal:post'], currentUser.roles, {
            tenantId: journalEntry.tenantId,
            amount: journalEntry.totalAmount,
            currentUserId: currentUser.id
          }, policy)}
        >
          Submit for Approval
        </button>
      )}
    </div>
  );
}

// packages/accounting-ui/src/components/SLATimer.tsx
export function SLATimer({ 
  startTime, 
  slaHours, 
  onEscalate 
}: { 
  startTime: Date; 
  slaHours: number; 
  onEscalate: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsedMs = Date.now() - startTime.getTime();
      const elapsedHours = elapsedMs / (1000 * 60 * 60);
      setElapsed(elapsedHours);
      
      if (elapsedHours > slaHours) {
        onEscalate();
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [startTime, slaHours, onEscalate]);
  
  const isOverdue = elapsed > slaHours;
  const isWarning = elapsed > slaHours * 0.8;
  
  return (
    <div className={`sla-timer ${isOverdue ? 'overdue' : isWarning ? 'warning' : 'normal'}`}>
      <span>Elapsed: {Math.floor(elapsed)}h</span>
      {isOverdue && <span className="overdue-badge">OVERDUE</span>}
      {isWarning && !isOverdue && <span className="warning-badge">APPROACHING SLA</span>}
    </div>
  );
}
```

### **2.3 Automated Audit Package Generator**
**Files to Create:**
- `packages/accounting/src/audit/audit-package-generator.ts`
- `packages/accounting/src/audit/audit-package-signer.ts`
- `packages/accounting-ui/src/components/AuditTrail.tsx`
- `packages/accounting-ui/src/components/AuditLogEntry.tsx`
- `packages/accounting-ui/src/components/AuditFilters.tsx`
- `packages/accounting-ui/src/hooks/useAuditTrail.ts`

**Implementation:**
```typescript
// packages/accounting/src/audit/audit-package-generator.ts
export class AuditPackageGenerator {
  async generateAuditPackage(tenantId: string, period: string, auditor: AuditorRequest) {
    const package = {
      metadata: {
        generatedAt: new Date(),
        period,
        tenantId,
        auditorFirm: auditor.firm,
        merkleRoot: await this.getPeriodMerkleRoot(tenantId, period),
        policyVersion: await this.getPolicyVersion(tenantId, period)
      },
      financials: {
        trialBalance: await this.getTrialBalance(tenantId, period),
        generalLedger: await this.getGeneralLedger(tenantId, period),
        journalEntries: await this.getJournalEntries(tenantId, period),
        fxRateAuditTrail: await this.getFXRateAuditTrail(tenantId, period)
      },
      compliance: {
        sodReports: await this.getSODComplianceReport(tenantId, period),
        mfrsMapping: await this.getMFRSMappingReport(tenantId, period),
        unmappedAccounts: await this.getUnmappedAccounts(tenantId, period)
      },
      verification: {
        tamperEvidence: await this.verifyPeriodIntegrity(tenantId, period),
        projectionParity: await this.verifyProjectionParity(tenantId, period),
        eventHashChain: await this.getEventHashChain(tenantId, period)
      }
    };
    
    // Sign the package for tamper evidence
    package.signature = await this.signAuditPackage(package);
    
    return package;
  }
  
  async exportAuditPackage(package: AuditPackage, format: 'json' | 'csv' | 'pdf') {
    switch (format) {
      case 'json':
        return this.exportAsJSON(package);
      case 'csv':
        return this.exportAsCSV(package);
      case 'pdf':
        return this.exportAsPDF(package);
    }
  }
}

// packages/accounting/src/audit/audit-package-signer.ts
export class AuditPackageSigner {
  async signAuditPackage(package: AuditPackage): Promise<string> {
    const content = JSON.stringify(package, null, 2);
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    
    // Sign with private key (in production, use proper key management)
    const signature = crypto.sign('sha256', Buffer.from(hash), {
      key: this.getPrivateKey(),
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING
    });
    
    return signature.toString('base64');
  }
  
  async verifyAuditPackage(package: AuditPackage): Promise<boolean> {
    const { signature, ...content } = package;
    const contentHash = crypto.createHash('sha256').update(JSON.stringify(content)).digest('hex');
    
    return crypto.verify('sha256', Buffer.from(contentHash), {
      key: this.getPublicKey(),
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING
    }, Buffer.from(signature, 'base64'));
  }
}
```

### **2.4 Tamper-Evident Audit Trail UI**
**Implementation:**
```typescript
// packages/accounting-ui/src/components/AuditTrail.tsx
export function AuditTrail({ entityId, entityType }: Props) {
  const { auditLogs, loading, error, filters, setFilters } = useAuditTrail(entityId, entityType);
  const { verifyIntegrity } = useAuditVerification();
  
  const handleVerifyIntegrity = async () => {
    const result = await verifyIntegrity(entityId, entityType);
    if (!result.verified) {
      alert(`Tamper detected! Inconsistency at event ${result.inconsistentEventId}`);
    }
  };
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div className="audit-trail">
      <div className="audit-header">
        <h3 className="text-lg font-semibold">Audit Trail</h3>
        <div className="audit-controls">
          <button 
            onClick={handleVerifyIntegrity}
            className="verify-button"
          >
            🔒 Verify Integrity
          </button>
          <AuditFilters filters={filters} onFiltersChange={setFilters} />
        </div>
      </div>
      
      <div className="audit-logs">
        {auditLogs.map(log => (
          <AuditLogEntry 
            key={log.id} 
            log={log}
            correlationId={log.correlationId}
            showTamperEvidence={true}
          />
        ))}
      </div>
      
      <div className="audit-footer">
        <button onClick={() => exportAuditTrail(entityId, entityType, 'csv')}>
          Export CSV
        </button>
        <button onClick={() => exportAuditTrail(entityId, entityType, 'json')}>
          Export JSON with Signature
        </button>
      </div>
    </div>
  );
}

// packages/accounting-ui/src/components/AuditLogEntry.tsx
export function AuditLogEntry({ 
  log, 
  correlationId, 
  showTamperEvidence 
}: { 
  log: AuditLog; 
  correlationId?: string;
  showTamperEvidence?: boolean;
}) {
  return (
    <div className="audit-log-entry">
      <div className="log-header">
        <span className="timestamp">{formatDate(log.timestamp)}</span>
        <span className="user">{log.userId}</span>
        <span className="action">{log.action}</span>
        {correlationId && (
          <span className="correlation-id">
            Correlation: <code>{correlationId}</code>
          </span>
        )}
      </div>
      <div className="log-details">
        <pre>{JSON.stringify(log.details, null, 2)}</pre>
      </div>
      {showTamperEvidence && (
        <div className="tamper-evidence">
          <span className="verified-badge">✅ Tamper-Evident Verified</span>
          <span className="hash">Hash: {log.eventHash}</span>
        </div>
      )}
    </div>
  );
}
```

### **2.5 Advanced Reporting**
**Files to Create:**
- `packages/accounting-ui/src/components/FinancialReportBuilder.tsx`
- `packages/accounting-ui/src/components/ReportFilters.tsx`
- `packages/accounting-ui/src/components/ReportVisualization.tsx`

**DoD for Phase 2:**
- [ ] MFRS/IFRS-aware UI components operational
- [ ] Smart approval workflows with SLA timers functional
- [ ] Tamper-evident audit trail UI operational
- [ ] Policy simulator working for tenant testing
- [ ] Automated audit package generator operational
- [ ] Integration tests ≥90% coverage

---

## 🎯 **Business Value & Competitive Differentiation**

### **MFRS/IFRS Differentiation**
- **Account Inspector**: Shows linked MFRS/IFRS references and disclosure mapping
- **Journal Rule Preview**: Shows derived impacts (FX translation, tax obligations, consolidation eliminations)
- **Disclosure-Ready Reports**: Export includes disclosure mapping & notes
- **Unmapped Account Warnings**: Flag accounts requiring MFRS mapping before period close

### **Auditor Delight Features**
- **Automated Audit Package**: Complete audit packages with tamper-evident signatures
- **Tamper-Evident Verification**: Real-time integrity checks with Merkle root verification
- **Correlation ID Tracking**: End-to-end traceability for audit trails
- **Export with Signature**: CSV/JSON/PDF with cryptographic signatures

### **Smart Approval Workflows**
- **Policy-Driven Approvers**: Dynamic approver selection based on amount tiers
- **SLA Timers**: Visual indicators for approaching/overdue SLAs
- **Auto-Escalation**: Automatic escalation after 48h
- **Two-Man Rule**: High-value transactions require dual approval

---

## 📊 **Success Metrics**

### **Business Value Metrics**
- **Period Close Time**: Target <3 days
- **Audit Prep Time**: Target <8 hours
- **Unmapped Accounts**: Target 0
- **FX Variance**: Target <0.5%

### **Operational Metrics**
- **Journal Approval SLA**: Target >95%
- **Projection Lag**: Target <30s
- **Bulk Processing**: Target <60s per 1000 records

### **Security Metrics**
- **SoD Violations Prevented**: Track blocked violations
- **Tamper Attempts Detected**: Monitor integrity breaches
- **Policy Decisions**: Track decision capacity

---

## 🛠️ **Technical Implementation**

### **File Structure**
```
packages/accounting-ui/src/components/
├── AccountInspector.tsx              # MFRS/IFRS account details
├── JournalRulePreview.tsx            # Journal impact preview
├── DisclosureReadyReports.tsx        # Disclosure-ready exports
├── ApprovalWorkflow.tsx              # Smart approval workflows
├── SLATimer.tsx                      # SLA monitoring
├── AuditTrail.tsx                    # Tamper-evident audit UI
├── AuditLogEntry.tsx                 # Individual audit log entries
├── AuditFilters.tsx                  # Audit trail filtering
├── FinancialReportBuilder.tsx        # Advanced reporting
├── ReportFilters.tsx                  # Report filtering
└── ReportVisualization.tsx           # Report charts/graphs

packages/accounting/src/
├── services/
│   ├── mfrs-mapping.service.ts       # MFRS mapping management
│   └── fx-rates.service.ts           # FX rate management
├── audit/
│   ├── audit-package-generator.ts    # Automated audit packages
│   └── audit-package-signer.ts       # Cryptographic signing
└── hooks/
    └── useAuditTrail.ts              # Audit trail data fetching
```

### **Dependencies**
```json
{
  "dependencies": {
    "crypto": "^1.0.1",               // Cryptographic signing
    "recharts": "^2.8.0",             // Report visualization
    "date-fns": "^2.30.0",            // Date formatting
    "lodash": "^4.17.21"              // Data manipulation
  }
}
```

---

## 🎯 **Definition of Done**

### **Phase 2 DoD:**
- [ ] MFRS/IFRS-aware UI components operational
- [ ] Smart approval workflows with SLA timers functional
- [ ] Tamper-evident audit trail UI operational
- [ ] Policy simulator working for tenant testing
- [ ] Automated audit package generator operational
- [ ] Integration tests ≥90% coverage

---

*This business features document provides advanced functionality that differentiates the accounting system through MFRS/IFRS awareness, smart workflows, and audit-grade features that delight both CFOs and auditors.*
