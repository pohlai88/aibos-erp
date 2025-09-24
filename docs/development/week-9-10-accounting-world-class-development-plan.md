# AI-BOS ERP Week 9-10: World-Class Accounting Module Development Plan

**Based on:** Audit Report Findings & Phase 2 Detailed Planning  
**Purpose:** Transform accounting package into production-ready, world-class module  
**Timeline:** 2 weeks (Weeks 9-10)  
**Priority:** P0 - Critical for Phase 2 Gate Review

---

## 🎯 **Executive Summary**

Based on the comprehensive audit findings, the accounting package requires significant development to achieve world-class status. Current implementation is **45% complete** with critical gaps in database integration, service connectivity, and production readiness. This plan provides a structured approach to deliver a **production-ready accounting module** that meets enterprise standards.

### **Audit Findings Summary**

- **Claimed Completeness:** 100%
- **Actual Completeness:** 45%
- **Critical Gaps:** 8 major issues identified
- **Blocking Issues:** 4 P0 items preventing production deployment

---

## 📋 **Phase Planning & Sequence**

### **Phase 1: Foundation & Infrastructure (Days 1-3)**

**Objective:** Establish solid infrastructure foundation

#### **Day 1: Database Integration & Migrations**

- ✅ Execute event store migrations
- ✅ Implement PostgreSQL connection configuration
- ✅ Create database connection pooling
- ✅ Establish RLS policies for tenant isolation

#### **Day 2: Repository Pattern Implementation**

- ✅ Implement concrete repository classes
- ✅ Add database persistence layer
- ✅ Create transaction management
- ✅ Implement optimistic concurrency control

#### **Day 3: Service Integration & Dependency Injection**

- ✅ Complete service dependency resolution
- ✅ Implement proper dependency injection
- ✅ Add service health checks
- ✅ Create service startup orchestration

### **Phase 2: Core Business Logic Enhancement (Days 4-7)**

**Objective:** Complete and enhance core accounting features

#### **Day 4: Event Sourcing Implementation**

- ✅ Complete event store integration
- ✅ Implement event replay functionality
- ✅ Add event versioning and migration
- ✅ Create event sourcing debugging tools

#### **Day 5: Advanced Financial Features**

- ✅ Enhance financial reporting calculations
- ✅ Implement multi-currency with real exchange rates
- ✅ Add tax compliance calculation logic
- ✅ Create regulatory compliance features

#### **Day 6: Outbox Pattern & Messaging**

- ✅ Complete outbox processor implementation
- ✅ Implement Kafka consumer integration
- ✅ Add message serialization/deserialization
- ✅ Create event-driven projections

#### **Day 7: Performance & Optimization**

- ✅ Implement caching strategies
- ✅ Add query optimization
- ✅ Create performance monitoring
- ✅ Implement circuit breaker patterns

### **Phase 3: Production Readiness (Days 8-10)**

**Objective:** Ensure production-ready deployment

#### **Day 8: Security & Compliance**

- ✅ Implement authentication/authorization
- ✅ Add data encryption
- ✅ Create audit trail completeness
- ✅ Implement GDPR compliance features

#### **Day 9: Testing & Quality Assurance**

- ✅ Complete unit test coverage (≥90%)
- ✅ Implement integration tests
- ✅ Add performance benchmarking
- ✅ Create chaos engineering tests

#### **Day 10: BFF Integration & Documentation**

- ✅ Complete BFF integration
- ✅ Implement GraphQL resolvers
- ✅ Create comprehensive documentation
- ✅ Conduct final validation

---

## 🏗️ **Detailed Implementation Plan**

### **1. Database Integration & Configuration**

#### **1.1 Database Connection Setup**

```typescript
// packages/accounting/src/infrastructure/database/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USERNAME'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        synchronize: false,
        logging: configService.get('NODE_ENV') === 'development',
        ssl: configService.get('NODE_ENV') === 'production',
        extra: {
          max: 20, // Connection pool size
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
```

#### **1.2 Event Store Entity Implementation**

```typescript
// packages/accounting/src/infrastructure/database/entities/accounting-event.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('acc_event')
@Index(['tenantId', 'streamId', 'version'], { unique: true })
@Index(['tenantId', 'occurredAt'])
export class AccountingEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'stream_id', type: 'uuid' })
  streamId: string;

  @Column({ type: 'integer' })
  version: number;

  @Column({ name: 'event_type', type: 'varchar', length: 255 })
  eventType: string;

  @Column({ name: 'event_data', type: 'jsonb' })
  eventData: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ name: 'occurred_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  occurredAt: Date;

  @Column({ name: 'correlation_id', type: 'uuid', nullable: true })
  correlationId: string;

  @Column({ name: 'causation_id', type: 'uuid', nullable: true })
  causationId: string;
}
```

#### **1.3 RLS Policy Implementation**

```sql
-- packages/accounting/src/infrastructure/database/migrations/002_create_rls_policies.sql
-- Enable RLS on accounting event table
ALTER TABLE acc_event ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy
CREATE POLICY acc_event_tenant_isolation ON acc_event
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Enable RLS on general ledger table
ALTER TABLE gl_entry ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy for GL
CREATE POLICY gl_entry_tenant_isolation ON gl_entry
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Create function to set tenant context
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_uuid uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.tenant_id', tenant_uuid::text, true);
END;
$$ LANGUAGE plpgsql;
```

### **3. Enhanced Service Implementation**

#### **3.1 Complete Accounting Service**

```typescript
// packages/accounting/src/services/accounting.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { EventStore } from '../domain/interfaces/event-store.interface';
import { AccountRepository } from '../domain/interfaces/account-repository.interface';`8
import { JournalEntryRepository } from '../domain/interfaces/journal-entry-repository.interface';
import { OutboxService } from './outbox. service';
import { ChartOfAccounts } from '../domain/aggregates/chart-of-accounts.aggregate';
import { JournalEntry } from '../domain/aggregates/journal-entry.aggregate';
import { CreateAccountCommand } from '../commands/create-account.command';
import { PostJournalEntryCommand } from '../commands/post-journal-entry.command';
import { CircuitBreaker } from '../infrastructure/resilience/circuit-breaker';

@Injectable()
export class AccountingService {
  private readonly logger = new Logger(AccountingService.name);
  private readonly circuitBreaker = new CircuitBreaker({
    failureThreshold: 5,
    recoveryTimeout: 30000,
    monitoringPeriod: 60000,
  });

  constructor(
    private readonly eventStore: EventStore,
    private readonly accountRepository: AccountRepository,
    private readonly journalEntryRepository: JournalEntryRepository,
    private readonly outboxService: OutboxService,
  ) {}

  async createAccount(command: CreateAccountCommand): Promise<void> {
    return this.circuitBreaker.execute(async () => {
      this.logger.log(`Creating account: ${command.accountCode} for tenant: ${command.tenantId}`);

      const chartOfAccounts = await this.loadChartOfAccounts(command.tenantId);
      chartOfAccounts.createAccount(command);

      const events = chartOfAccounts.getUncommittedEvents();
      await this.eventStore.append(
        `chart-of-accounts-${command.tenantId}`,
        events,
        chartOfAccounts.getVersion(),
        command.tenantId,
      );

      chartOfAccounts.markEventsAsCommitted();

      // Publish events via outbox
      await this.outboxService.publishEvents(events, command.tenantId);

      this.logger.log(`Account created successfully: ${command.accountCode}`);
    });
  }

  async postJournalEntry(command: PostJournalEntryCommand): Promise<void> {
    return this.circuitBreaker.execute(async () => {
      this.logger.log(
        `Posting journal entry: ${command.journalEntryId} for tenant: ${command.tenantId}`,
      );

      // Validate accounts exist
      await this.validateAccountsExist(command.entries, command.tenantId);

      const journalEntry = new JournalEntry(command.journalEntryId, command.tenantId);
      journalEntry.postEntry(command);

      const events = journalEntry.getUncommittedEvents();
      await this.eventStore.append(
        `journal-entry-${command.journalEntryId}`,
        events,
        journalEntry.getVersion(),
        command.tenantId,
      );

      journalEntry.markEventsAsCommitted();

      // Update read models
      await this.updateGeneralLedger(command);

      // Publish events via outbox
      await this.outboxService.publishEvents(events, command.tenantId);

      this.logger.log(`Journal entry posted successfully: ${command.journalEntryId}`);
    });
  }

  private async loadChartOfAccounts(tenantId: string): Promise<ChartOfAccounts> {
    const events = await this.eventStore.getEvents(
      `chart-of-accounts-${tenantId}`,
      undefined,
      tenantId,
    );

    const chartOfAccounts = new ChartOfAccounts(tenantId);
    events.forEach((event) => chartOfAccounts.loadFromHistory(event));

    return chartOfAccounts;
  }

  private async validateAccountsExist(entries: any[], tenantId: string): Promise<void> {
    const accountCodes = entries.map((entry) => entry.accountCode);
    const accounts = await Promise.all(
      accountCodes.map((code) => this.accountRepository.findByCode(code, tenantId)),
    );

    const missingAccounts = accountCodes.filter((code, index) => !accounts[index]);
    if (missingAccounts.length > 0) {
      throw new Error(`Accounts not found: ${missingAccounts.join(', ')}`);
    }
  }

  private async updateGeneralLedger(command: PostJournalEntryCommand): Promise<void> {
    for (const entry of command.entries) {
      await this.accountRepository.updateBalance(
        entry.accountCode,
        entry.debitAmount - entry.creditAmount,
        command.tenantId,
      );
    }
  }
}
```

#### **3.2 Outbox Service Implementation**

```typescript
// packages/accounting/src/services/outbox.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OutboxEventEntity } from '../infrastructure/database/entities/outbox-event.entity';
import { KafkaProducerService } from '../infrastructure/messaging/kafka-producer.service';
import { DomainEvent } from '../domain/events/domain-event.base';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(
    @InjectRepository(OutboxEventEntity)
    private readonly outboxRepository: Repository<OutboxEventEntity>,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async publishEvents(events: DomainEvent[], tenantId: string): Promise<void> {
    const outboxEvents = events.map((event) => ({
      tenantId,
      topic: this.getTopicForEvent(event),
      key: event.aggregateId,
      payload: event.toJSON(),
      status: 'READY',
    }));

    await this.outboxRepository.save(outboxEvents);
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async processOutboxEvents(): Promise<void> {
    const pendingEvents = await this.outboxRepository.find({
      where: { status: 'READY' },
      take: 100,
      order: { createdAt: 'ASC' },
    });

    if (pendingEvents.length === 0) {
      return;
    }

    this.logger.log(`Processing ${pendingEvents.length} outbox events`);

    for (const event of pendingEvents) {
      try {
        await this.kafkaProducer.send({
          topic: event.topic,
          messages: [
            {
              key: event.key,
              value: JSON.stringify(event.payload),
              headers: {
                'tenant-id': event.tenantId,
                'event-type': event.payload.eventType,
              },
            },
          ],
        });

        event.status = 'PUBLISHED';
        event.processedAt = new Date();
        await this.outboxRepository.save(event);

        this.logger.debug(`Published event ${event.id} to topic ${event.topic}`);
      } catch (error) {
        this.logger.error(`Failed to publish event ${event.id}:`, error);
        event.status = 'FAILED';
        event.retryCount = (event.retryCount || 0) + 1;
        await this.outboxRepository.save(event);
      }
    }
  }

  private getTopicForEvent(event: DomainEvent): string {
    const eventType = event.constructor.name;
    const topicMap = {
      AccountCreatedEvent: 'accounting.account.created',
      JournalEntryPostedEvent: 'accounting.journal.posted',
      // Add other event mappings
    };

    return topicMap[eventType] || 'accounting.unknown';
  }
}
```

### **4. Multi-Currency Enhancement**

#### **4.1 Exchange Rate Service**

```typescript
// packages/accounting/src/services/exchange-rate.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExchangeRateEntity } from '../infrastructure/database/entities/exchange-rate.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRepository(ExchangeRateEntity)
    private readonly exchangeRateRepository: Repository<ExchangeRateEntity>,
  ) {
    this.apiKey = this.configService.get('EXCHANGE_RATE_API_KEY');
    this.baseUrl = this.configService.get(
      'EXCHANGE_RATE_API_URL',
      'https://api.exchangerate-api.com/v4',
    );
  }

  async getExchangeRate(fromCurrency: string, toCurrency: string, date?: Date): Promise<number> {
    if (fromCurrency === toCurrency) {
      return 1.0;
    }

    const targetDate = date || new Date();

    // Try to get from cache first
    const cachedRate = await this.exchangeRateRepository.findOne({
      where: {
        fromCurrency,
        toCurrency,
        date: targetDate,
      },
    });

    if (cachedRate) {
      return cachedRate.rate;
    }

    // Fetch from external API
    const rate = await this.fetchExchangeRate(fromCurrency, toCurrency, targetDate);

    // Cache the rate
    await this.exchangeRateRepository.save({
      fromCurrency,
      toCurrency,
      rate,
      date: targetDate,
    });

    return rate;
  }

  private async fetchExchangeRate(
    fromCurrency: string,
    toCurrency: string,
    date: Date,
  ): Promise<number> {
    try {
      const response = await this.httpService.axiosRef.get(
        `${this.baseUrl}/latest/${fromCurrency}`,
        {
          params: {
            access_key: this.apiKey,
          },
        },
      );

      const rates = response.data.rates;
      if (!rates[toCurrency]) {
        throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
      }

      return rates[toCurrency];
    } catch (error) {
      this.logger.error(`Failed to fetch exchange rate for ${fromCurrency}/${toCurrency}:`, error);
      throw new Error(`Unable to fetch exchange rate for ${fromCurrency}/${toCurrency}`);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async updateExchangeRates(): Promise<void> {
    const currencies = ['USD', 'EUR', 'GBP', 'SGD', 'MYR', 'THB', 'IDR', 'VND', 'PHP'];
    const baseCurrency = 'USD';

    this.logger.log('Updating exchange rates...');

    for (const currency of currencies) {
      if (currency === baseCurrency) continue;

      try {
        const rate = await this.fetchExchangeRate(baseCurrency, currency, new Date());
        await this.exchangeRateRepository.save({
          fromCurrency: baseCurrency,
          toCurrency: currency,
          rate,
          date: new Date(),
        });
      } catch (error) {
        this.logger.error(`Failed to update rate for ${baseCurrency}/${currency}:`, error);
      }
    }

    this.logger.log('Exchange rates updated successfully');
  }
}
```

#### **4.2 Enhanced Multi-Currency Service**

```typescript
// packages/accounting/src/services/multi-currency.service.ts
import { Injectable } from '@nestjs/common';
import { ExchangeRateService } from './exchange-rate.service';

@Injectable()
export class MultiCurrencyService {
  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  async convertAmount(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    date?: Date,
  ): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const exchangeRate = await this.exchangeRateService.getExchangeRate(
      fromCurrency,
      toCurrency,
      date,
    );

    return this.roundCurrency(amount * exchangeRate, toCurrency);
  }

  async convertJournalEntry(entries: any[], targetCurrency: string, date?: Date): Promise<any[]> {
    const convertedEntries = [];

    for (const entry of entries) {
      const convertedDebit =
        entry.debitAmount > 0
          ? await this.convertAmount(entry.debitAmount, entry.currency, targetCurrency, date)
          : 0;

      const convertedCredit =
        entry.creditAmount > 0
          ? await this.convertAmount(entry.creditAmount, entry.currency, targetCurrency, date)
          : 0;

      convertedEntries.push({
        ...entry,
        originalCurrency: entry.currency,
        originalDebitAmount: entry.debitAmount,
        originalCreditAmount: entry.creditAmount,
        currency: targetCurrency,
        debitAmount: convertedDebit,
        creditAmount: convertedCredit,
      });
    }

    return convertedEntries;
  }

  private roundCurrency(amount: number, currency: string): number {
    // Different currencies have different decimal places
    const decimalPlaces = this.getCurrencyDecimalPlaces(currency);
    return Math.round(amount * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
  }

  private getCurrencyDecimalPlaces(currency: string): number {
    const currencyDecimals = {
      USD: 2,
      EUR: 2,
      GBP: 2,
      SGD: 2,
      MYR: 2,
      THB: 2,
      IDR: 0,
      VND: 0,
      PHP: 2,
      JPY: 0,
      KRW: 0,
    };

    return currencyDecimals[currency] || 2;
  }
}
```

### **5. Tax Compliance Implementation**

#### **5.1 Tax Calculation Service**

```typescript
// packages/accounting/src/services/tax-compliance.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxRuleEntity } from '../infrastructure/database/entities/tax-rule.entity';

interface TaxCalculationRequest {
  amount: number;
  taxType: string;
  country: string;
  region?: string;
  itemCategory?: string;
  customerType?: string;
  date: Date;
}

interface TaxCalculationResult {
  taxAmount: number;
  taxRate: number;
  taxCode: string;
  description: string;
  breakdown: TaxBreakdown[];
}

interface TaxBreakdown {
  taxType: string;
  rate: number;
  amount: number;
  description: string;
}

@Injectable()
export class TaxComplianceService {
  private readonly logger = new Logger(TaxComplianceService.name);

  constructor(
    @InjectRepository(TaxRuleEntity)
    private readonly taxRuleRepository: Repository<TaxRuleEntity>,
  ) {}

  async calculateTax(request: TaxCalculationRequest): Promise<TaxCalculationResult> {
    const applicableRules = await this.getApplicableTaxRules(request);

    if (applicableRules.length === 0) {
      return {
        taxAmount: 0,
        taxRate: 0,
        taxCode: 'NO_TAX',
        description: 'No applicable tax rules found',
        breakdown: [],
      };
    }

    const breakdown: TaxBreakdown[] = [];
    let totalTaxAmount = 0;
    let totalTaxRate = 0;

    for (const rule of applicableRules) {
      const taxAmount = this.calculateTaxForRule(request.amount, rule);

      breakdown.push({
        taxType: rule.taxType,
        rate: rule.rate,
        amount: taxAmount,
        description: rule.description,
      });

      totalTaxAmount += taxAmount;
      totalTaxRate += rule.rate;
    }

    return {
      taxAmount: this.roundAmount(totalTaxAmount),
      taxRate: totalTaxRate,
      taxCode: this.generateTaxCode(applicableRules),
      description: this.generateTaxDescription(applicableRules),
      breakdown,
    };
  }

  async calculateGST(
    amount: number,
    country: string,
    isInclusive: boolean = false,
  ): Promise<TaxCalculationResult> {
    const gstRates = {
      SG: 0.08, // Singapore GST 8%
      MY: 0.06, // Malaysia GST 6%
      TH: 0.07, // Thailand VAT 7%
      ID: 0.11, // Indonesia VAT 11%
      VN: 0.1, // Vietnam VAT 10%
      PH: 0.12, // Philippines VAT 12%
    };

    const rate = gstRates[country] || 0;

    if (rate === 0) {
      return {
        taxAmount: 0,
        taxRate: 0,
        taxCode: 'NO_GST',
        description: `No GST applicable for ${country}`,
        breakdown: [],
      };
    }

    let taxAmount: number;
    let taxableAmount: number;

    if (isInclusive) {
      // Tax inclusive calculation
      taxableAmount = amount / (1 + rate);
      taxAmount = amount - taxableAmount;
    } else {
      // Tax exclusive calculation
      taxableAmount = amount;
      taxAmount = amount * rate;
    }

    return {
      taxAmount: this.roundAmount(taxAmount),
      taxRate: rate,
      taxCode: `${country}_GST`,
      description: `${country} GST ${(rate * 100).toFixed(1)}%`,
      breakdown: [
        {
          taxType: 'GST',
          rate,
          amount: this.roundAmount(taxAmount),
          description: `${country} Goods and Services Tax`,
        },
      ],
    };
  }

  private async getApplicableTaxRules(request: TaxCalculationRequest): Promise<TaxRuleEntity[]> {
    const queryBuilder = this.taxRuleRepository
      .createQueryBuilder('rule')
      .where('rule.country = :country', { country: request.country })
      .andWhere('rule.effectiveFrom <= :date', { date: request.date })
      .andWhere('(rule.effectiveTo IS NULL OR rule.effectiveTo >= :date)', { date: request.date })
      .andWhere('rule.isActive = true');

    if (request.region) {
      queryBuilder.andWhere('(rule.region IS NULL OR rule.region = :region)', {
        region: request.region,
      });
    }

    if (request.itemCategory) {
      queryBuilder.andWhere('(rule.itemCategory IS NULL OR rule.itemCategory = :itemCategory)', {
        itemCategory: request.itemCategory,
      });
    }

    if (request.customerType) {
      queryBuilder.andWhere('(rule.customerType IS NULL OR rule.customerType = :customerType)', {
        customerType: request.customerType,
      });
    }

    return queryBuilder.getMany();
  }

  private calculateTaxForRule(amount: number, rule: TaxRuleEntity): number {
    switch (rule.calculationType) {
      case 'PERCENTAGE':
        return amount * rule.rate;
      case 'FIXED':
        return rule.fixedAmount || 0;
      case 'TIERED':
        return this.calculateTieredTax(amount, rule.tiers);
      default:
        return 0;
    }
  }

  private calculateTieredTax(amount: number, tiers: any[]): number {
    let totalTax = 0;
    let remainingAmount = amount;

    for (const tier of tiers.sort((a, b) => a.threshold - b.threshold)) {
      if (remainingAmount <= 0) break;

      const taxableInTier = Math.min(remainingAmount, tier.threshold);
      totalTax += taxableInTier * tier.rate;
      remainingAmount -= taxableInTier;
    }

    return totalTax;
  }

  private generateTaxCode(rules: TaxRuleEntity[]): string {
    return rules.map((rule) => rule.taxCode).join('_');
  }

  private generateTaxDescription(rules: TaxRuleEntity[]): string {
    return rules.map((rule) => rule.description).join(', ');
  }

  private roundAmount(amount: number): number {
    return Math.round(amount * 100) / 100;
  }
}
```

### **6. BFF Integration Implementation**

#### **6.1 Accounting Module for BFF**

```typescript
// apps/bff/src/modules/accounting/accounting.module.ts
import { Module } from '@nestjs/common';
import { AccountingResolver } from './accounting.resolver';
import { AccountingService } from './accounting.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [AccountingResolver, AccountingService],
})
export class AccountingModule {}
```

#### **6.2 GraphQL Resolver**

```typescript
// apps/bff/src/modules/accounting/accounting.resolver.ts
import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountingService } from './accounting.service';
import {
  Account,
  JournalEntry,
  CreateAccountInput,
  PostJournalEntryInput,
  FinancialReport,
} from './accounting.types';

@Resolver()
@UseGuards(JwtAuthGuard)
export class AccountingResolver {
  constructor(private readonly accountingService: AccountingService) {}

  @Query(() => [Account])
  async accounts(@Context() context: any): Promise<Account[]> {
    const tenantId = context.req.user.tenantId;
    return this.accountingService.getAccounts(tenantId);
  }

  @Query(() => Account, { nullable: true })
  async account(
    @Args('accountCode') accountCode: string,
    @Context() context: any,
  ): Promise<Account | null> {
    const tenantId = context.req.user.tenantId;
    return this.accountingService.getAccount(accountCode, tenantId);
  }

  @Query(() => [JournalEntry])
  async journalEntries(
    @Args('limit', { defaultValue: 50 }) limit: number,
    @Args('offset', { defaultValue: 0 }) offset: number,
    @Context() context: any,
  ): Promise<JournalEntry[]> {
    const tenantId = context.req.user.tenantId;
    return this.accountingService.getJournalEntries(tenantId, limit, offset);
  }

  @Query(() => FinancialReport)
  async trialBalance(
    @Args('asOfDate') asOfDate: Date,
    @Context() context: any,
  ): Promise<FinancialReport> {
    const tenantId = context.req.user.tenantId;
    return this.accountingService.generateTrialBalance(tenantId, asOfDate);
  }

  @Query(() => FinancialReport)
  async profitAndLoss(
    @Args('fromDate') fromDate: Date,
    @Args('toDate') toDate: Date,
    @Context() context: any,
  ): Promise<FinancialReport> {
    const tenantId = context.req.user.tenantId;
    return this.accountingService.generateProfitAndLoss(tenantId, fromDate, toDate);
  }

  @Query(() => FinancialReport)
  async balanceSheet(
    @Args('asOfDate') asOfDate: Date,
    @Context() context: any,
  ): Promise<FinancialReport> {
    const tenantId = context.req.user.tenantId;
    return this.accountingService.generateBalanceSheet(tenantId, asOfDate);
  }

  @Mutation(() => Account)
  async createAccount(
    @Args('input') input: CreateAccountInput,
    @Context() context: any,
  ): Promise<Account> {
    const tenantId = context.req.user.tenantId;
    const userId = context.req.user.userId;
    return this.accountingService.createAccount({ ...input, tenantId, userId });
  }

  @Mutation(() => JournalEntry)
  async postJournalEntry(
    @Args('input') input: PostJournalEntryInput,
    @Context() context: any,
  ): Promise<JournalEntry> {
    const tenantId = context.req.user.tenantId;
    const userId = context.req.user.userId;
    return this.accountingService.postJournalEntry({ ...input, tenantId, userId });
  }
}
```

#### **6.3 BFF Service Implementation**

```typescript
// apps/bff/src/modules/accounting/accounting.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AccountingService {
  private readonly logger = new Logger(AccountingService.name);
  private readonly accountingServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.accountingServiceUrl = this.configService.get(
      'ACCOUNTING_SERVICE_URL',
      'http://localhost:3001',
    );
  }

  async getAccounts(tenantId: string): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.accountingServiceUrl}/api/v1/accounts`, {
          headers: { 'X-Tenant-Id': tenantId },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch accounts:', error);
      throw new Error('Unable to fetch accounts');
    }
  }

  async getAccount(accountCode: string, tenantId: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.accountingServiceUrl}/api/v1/accounts/${accountCode}`, {
          headers: { 'X-Tenant-Id': tenantId },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch account ${accountCode}:`, error);
      return null;
    }
  }

  async createAccount(input: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.accountingServiceUrl}/api/v1/accounts`, input, {
          headers: {
            'X-Tenant-Id': input.tenantId,
            'X-User-Id': input.userId,
          },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create account:', error);
      throw new Error('Unable to create account');
    }
  }

  async postJournalEntry(input: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.accountingServiceUrl}/api/v1/journal-entries`, input, {
          headers: {
            'X-Tenant-Id': input.tenantId,
            'X-User-Id': input.userId,
            'Idempotency-Key': input.idempotencyKey || this.generateIdempotencyKey(),
          },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to post journal entry:', error);
      throw new Error('Unable to post journal entry');
    }
  }

  async generateTrialBalance(tenantId: string, asOfDate: Date): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.accountingServiceUrl}/api/v1/reports/trial-balance`, {
          headers: { 'X-Tenant-Id': tenantId },
          params: { asOfDate: asOfDate.toISOString() },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to generate trial balance:', error);
      throw new Error('Unable to generate trial balance');
    }
  }

  private generateIdempotencyKey(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

---

## 🧪 **Testing Strategy & Implementation**

### **Unit Tests (≥90% Coverage)**

```typescript
// packages/accounting/src/services/__tests__/accounting.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AccountingService } from '../accounting.service';
import { EventStore } from '../../domain/interfaces/event-store.interface';
import { AccountRepository } from '../../domain/interfaces/account-repository.interface';
import { CreateAccountCommand } from '../../commands/create-account.command';

describe('AccountingService', () => {
  let service: AccountingService;
  let eventStore: jest.Mocked<EventStore>;
  let accountRepository: jest.Mocked<AccountRepository>;

  beforeEach(async () => {
    const mockEventStore = {
      append: jest.fn(),
      getEvents: jest.fn(),
    };

    const mockAccountRepository = {
      findByCode: jest.fn(),
      save: jest.fn(),
      updateBalance: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountingService,
        { provide: EventStore, useValue: mockEventStore },
        { provide: AccountRepository, useValue: mockAccountRepository },
      ],
    }).compile();

    service = module.get<AccountingService>(AccountingService);
    eventStore = module.get(EventStore);
    accountRepository = module.get(AccountRepository);
  });

  describe('createAccount', () => {
    it('should create account successfully', async () => {
      const command = new CreateAccountCommand({
        accountCode: '1000',
        accountName: 'Cash',
        accountType: 'Asset',
        tenantId: 'tenant-1',
        userId: 'user-1',
      });

      eventStore.getEvents.mockResolvedValue([]);
      eventStore.append.mockResolvedValue();

      await service.createAccount(command);

      expect(eventStore.append).toHaveBeenCalledWith(
        'chart-of-accounts-tenant-1',
        expect.any(Array),
        expect.any(Number),
        'tenant-1',
      );
    });

    it('should throw error for duplicate account code', async () => {
      const command = new CreateAccountCommand({
        accountCode: '1000',
        accountName: 'Cash',
        accountType: 'Asset',
        tenantId: 'tenant-1',
        userId: 'user-1',
      });

      // Mock existing account
      eventStore.getEvents.mockResolvedValue([
        {
          eventType: 'AccountCreatedEvent',
          eventData: { accountCode: '1000' },
        } as any,
      ]);

      await expect(service.createAccount(command)).rejects.toThrow('Account code already exists');
    });
  });
});
```

### **Integration Tests**

```typescript
// packages/accounting/src/__tests__/integration/accounting.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountingModule } from '../../accounting.module';
import { AccountingService } from '../../services/accounting.service';
import { CreateAccountCommand } from '../../commands/create-account.command';

describe('Accounting Integration Tests', () => {
  let module: TestingModule;
  let service: AccountingService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localhost',
          port: 5432,
          username: 'test',
          password: 'test',
          database: 'test_accounting',
          entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
          synchronize: true,
        }),
        AccountingModule,
      ],
    }).compile();

    service = module.get<AccountingService>(AccountingService);
  });

  afterAll(async () => {
    await module.close();
  });

  it('should create account and persist to database', async () => {
    const command = new CreateAccountCommand({
      accountCode: '1000',
      accountName: 'Cash',
      accountType: 'Asset',
      tenantId: 'tenant-1',
      userId: 'user-1',
    });

    await service.createAccount(command);

    // Verify account was created
    const account = await service.getAccount('1000', 'tenant-1');
    expect(account).toBeDefined();
    expect(account.accountCode).toBe('1000');
    expect(account.accountName).toBe('Cash');
  });
});
```

---

## ✅ **Definition of Done (DoD)**

### **Phase 1 DoD (Days 1-3)**

- [ ] ✅ Database migrations executed successfully
- [ ] ✅ PostgreSQL connection established with pooling
- [ ] ✅ RLS policies implemented and tested
- [ ] ✅ Repository pattern implemented with concrete classes
- [ ] ✅ Service dependency injection working
- [ ] ✅ Health checks passing
- [ ] ✅ Unit tests ≥80% coverage for new code
- [ ] ✅ Integration tests passing

### **Phase 2 DoD (Days 4-7)**

- [ ] ✅ Event store fully operational
- [ ] ✅ Event replay functionality working
- [ ] ✅ Multi-currency with real exchange rates
- [ ] ✅ Tax compliance calculations implemented
- [ ] ✅ Outbox pattern processing events
- [ ] ✅ Kafka integration (producer & consumer)
- [ ] ✅ Performance benchmarks met (p95 < 500ms)
- [ ] ✅ Circuit breaker patterns implemented

### **Phase 3 DoD (Days 8-10)**

- [ ] ✅ Authentication/authorization implemented
- [ ] ✅ Data encryption at rest and in transit
- [ ] ✅ Audit trail completeness verified
- [ ] ✅ Unit test coverage ≥90%
- [ ] ✅ Integration tests covering all APIs
- [ ] ✅ Performance tests passing SLOs
- [ ] ✅ BFF integration complete
- [ ] ✅ GraphQL resolvers functional
- [ ] ✅ Documentation complete
- [ ] ✅ Security scan passing (0 critical issues)

### **Overall DoD**

- [ ] ✅ All P0 blocking issues resolved
- [ ] ✅ Trial balance accuracy: 100%
- [ ] ✅ Multi-tenant isolation verified
- [ ] ✅ Event sourcing patterns operational
- [ ] ✅ Financial reporting APIs functional
- [ ] ✅ Performance SLOs met
- [ ] ✅ Security compliance verified
- [ ] ✅ Production deployment ready

---

## 📊 **Success Metrics & Validation**

### **Technical Metrics**

- **API Performance:** p95 < 500ms for writes, p95 < 300ms for reads
- **Database Performance:** Connection pool utilization < 80%
- **Event Processing:** Outbox lag < 5 seconds
- **Test Coverage:** Unit tests ≥90%, Integration tests ≥80%
- **Error Rate:** < 0.1% for critical operations

### **Business Metrics**

- **Trial Balance Accuracy:** 100% (zero variance)
- **Data Integrity:** Event replay deterministic
- **Multi-Currency Accuracy:** Exchange rate variance < 0.01%
- **Tax Calculation Accuracy:** 100% for supported jurisdictions
- **Audit Trail Completeness:** 100% of operations logged

### **Quality Metrics**

- **Code Quality:** SonarQube rating A
- **Security:** Zero critical vulnerabilities
- **Documentation:** 100% API documentation coverage
- **Compliance:** GDPR/PDPA requirements met

---

## 🚀 **Deployment & Rollout Plan**

### **Pre-Deployment Checklist**

- [ ] All tests passing in CI/CD
- [ ] Security scan completed
- [ ] Performance benchmarks validated
- [ ] Database migrations tested
- [ ] Rollback procedures documented

### **Deployment Sequence**

1. **Database Migration:** Execute schema changes
2. **Service Deployment:** Deploy accounting service
3. **BFF Integration:** Deploy BFF with accounting module
4. **Smoke Tests:** Validate critical paths
5. **Monitoring:** Verify metrics and alerts

### **Post-Deployment Validation**

- [ ] Health checks passing
- [ ] Metrics within expected ranges
- [ ] Error rates below thresholds
- [ ] Performance SLOs met
- [ ] Business functionality verified

---

## 📝 **Risk Mitigation & Contingency**

### **High-Risk Areas**

1. **Database Migration Failure**
   - **Mitigation:** Test migrations in staging
   - **Contingency:** Rollback procedures documented

2. **Performance Degradation**
   - **Mitigation:** Load testing before deployment
   - **Contingency:** Circuit breakers and auto-scaling

3. **Data Integrity Issues**
   - **Mitigation:** Comprehensive testing
   - **Contingency:** Event replay capabilities

### **Rollback Procedures**

- **Database:** Point-in-time recovery available
- **Services:** Blue-green deployment strategy
- **Configuration:** Version-controlled rollback
- **Monitoring:** Real-time alerting for issues

---

This comprehensive development plan transforms the accounting package into a truly world-class module that meets enterprise standards while addressing all critical gaps identified in the audit report. The phased approach ensures systematic progress with clear validation criteria at each stage.
