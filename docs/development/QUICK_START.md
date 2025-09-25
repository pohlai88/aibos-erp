# Quick Start Guide - Accounting Top-Up Implementation

## 🚀 **Immediate Start (5 Minutes)**

### **Step 1: Run Setup Script**

**Windows:**

```bash
scripts\setup-accounting-topup.bat
```

**Linux/Mac:**

```bash
chmod +x scripts/setup-accounting-topup.sh
./scripts/setup-accounting-topup.sh
```

### **Step 2: Start Development Environment**

**Option A: Using Docker Compose (Recommended)**

```bash
docker-compose -f docker-compose.dev.yml up -d
```

**Option B: Using Development Script**

```bash
# Windows
scripts\dev-accounting.bat

# Linux/Mac
./scripts/dev-accounting.sh
```

### **Step 3: Verify Setup**

```bash
# Check services are running
curl http://localhost:3001/health
curl http://localhost:3000

# Run tests
pnpm test

# Check linting
pnpm lint
```

## 🎯 **Phase 1: Start with Journal Entry Form**

### **Immediate Implementation (30 Minutes)**

1. **Create API Client** (`apps/web/src/lib/accounting-api.ts`)
2. **Create React Hooks** (`apps/web/src/hooks/useAccounting.ts`)
3. **Create Journal Entry Form** (`apps/web/src/components/accounting/JournalEntryForm.tsx`)
4. **Add to Main Page** (`apps/web/src/app/accounting/page.tsx`)

### **Code Templates Ready to Use**

#### **API Client Template**

```typescript
// apps/web/src/lib/accounting-api.ts
export interface JournalEntry {
  id: string;
  reference: string;
  description: string;
  entries: JournalEntryLine[];
  status: 'DRAFT' | 'POSTED' | 'REVERSED';
}

export interface JournalEntryLine {
  accountCode: string;
  debitAmount: number;
  creditAmount: number;
  description?: string;
}

class AccountingApiClient {
  private baseUrl = '/api/v1/accounting';

  async createJournalEntry(data: any): Promise<JournalEntry> {
    const response = await fetch(`${this.baseUrl}/journal-entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }
}

export const accountingApi = new AccountingApiClient();
```

#### **React Hooks Template**

```typescript
// apps/web/src/hooks/useAccounting.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountingApi } from '@/lib/accounting-api';

export function useAccounting() {
  const queryClient = useQueryClient();

  const postJournalEntry = useMutation({
    mutationFn: accountingApi.createJournalEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
    },
  });

  return { postJournalEntry };
}
```

#### **Journal Entry Form Template**

```typescript
// apps/web/src/components/accounting/JournalEntryForm.tsx
import { useForm } from 'react-hook-form';
import { useAccounting } from '@/hooks/useAccounting';

export function JournalEntryForm() {
  const { postJournalEntry } = useAccounting();
  const form = useForm();

  const onSubmit = async (data: any) => {
    await postJournalEntry.mutateAsync(data);
    form.reset();
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('reference')} placeholder="Reference" />
      <textarea {...form.register('description')} placeholder="Description" />
      <button type="submit">Post Journal Entry</button>
    </form>
  );
}
```

## 📋 **Daily Development Checklist**

### **Morning Routine (5 minutes)**

- [ ] Start development environment
- [ ] Check service health
- [ ] Review yesterday's progress
- [ ] Plan today's tasks

### **Development Workflow**

- [ ] Create feature branch: `git checkout -b feature/journal-entry-form`
- [ ] Implement feature following templates
- [ ] Write tests
- [ ] Run linting and tests
- [ ] Commit changes
- [ ] Create pull request

### **Evening Routine (5 minutes)**

- [ ] Commit all changes
- [ ] Update progress in documentation
- [ ] Plan next day's tasks
- [ ] Stop development environment

## 🎯 **Week 1 Focus Areas**

### **Day 1: Foundation**

- [ ] Complete setup
- [ ] Create API client
- [ ] Implement basic journal entry form
- [ ] Add form validation

### **Day 2: Enhancement**

- [ ] Add error handling
- [ ] Implement loading states
- [ ] Create responsive design
- [ ] Add accessibility features

### **Day 3: Integration**

- [ ] Connect to backend API
- [ ] Test end-to-end flow
- [ ] Add success notifications
- [ ] Implement form reset

### **Day 4: Polish**

- [ ] Add comprehensive tests
- [ ] Optimize performance
- [ ] Add keyboard navigation
- [ ] Review code quality

### **Day 5: Validation**

- [ ] Run full test suite
- [ ] Performance testing
- [ ] User acceptance testing
- [ ] Documentation update

## 🚨 **Common Issues & Solutions**

### **Issue: Dependencies not installing**

```bash
# Solution: Clear cache and reinstall
pnpm store prune
pnpm install
```

### **Issue: Database connection failed**

```bash
# Solution: Check Docker containers
docker ps
docker logs aibos-postgres-dev
```

### **Issue: Port already in use**

```bash
# Solution: Kill processes using ports
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### **Issue: Tests failing**

```bash
# Solution: Check test setup
pnpm test --verbose
pnpm test --coverage
```

## 📊 **Progress Tracking**

### **Phase 1 Progress (Week 13)**

- [ ] **Day 1**: API client and basic form (20%)
- [ ] **Day 2**: Form validation and error handling (40%)
- [ ] **Day 3**: Backend integration (60%)
- [ ] **Day 4**: UI polish and accessibility (80%)
- [ ] **Day 5**: Testing and documentation (100%)

### **Success Metrics**

- [ ] Journal entry form functional
- [ ] Form validation working
- [ ] Error handling implemented
- [ ] Responsive design complete
- [ ] Tests passing (≥90% coverage)
- [ ] No linting errors
- [ ] Documentation updated

## 🎉 **Next Steps After Phase 1**

1. **Phase 2**: Advanced Analytics (Week 14)
2. **Phase 3**: Documentation & Tools (Week 15)
3. **Production Deployment**: Week 16
4. **User Training**: Week 17

## 📞 **Support**

### **Immediate Help**

- **Technical Issues**: Check troubleshooting guide
- **Setup Problems**: Run setup script again
- **Code Questions**: Refer to technical implementation guide

### **Documentation**

- **Development Plan**: `docs/development/accounting-top-up-development-plan-v2.md`
- **Technical Guide**: `docs/development/technical-implementation-guide.md`
- **Preparation Guide**: `docs/development/DEVELOPMENT_PREPARATION.md`

---

**🚀 Ready to start? Run the setup script and begin Phase 1 implementation!**
