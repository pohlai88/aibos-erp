import {
  EVENT_STORE,
  ACCOUNT_REPOSITORY,
  JOURNAL_ENTRY_REPOSITORY,
} from './constants/injection.tokens';
import { AccountEntity } from './infrastructure/account.entity';
import { ExchangeRateEntity } from './infrastructure/exchange-rate.entity';
import { InMemoryEventStore } from './infrastructure/in-memory-event-store.repository';
import { JournalEntryEntity } from './infrastructure/journal-entry.entity';
import { OutboxEventEntity } from './infrastructure/outbox-event.entity';
import { ResilienceManager } from './infrastructure/resilience-manager.infrastructure';
import { TypeormAccountRepository } from './infrastructure/typeorm-account.repository';
import { TypeormJournalEntryRepository } from './infrastructure/typeorm-journal-entry.repository';
import {
  ProjectionCircuitBreaker,
  ProjectionHealthService,
} from './projections/circuit-breaker.utility';
import { GeneralLedgerProjection } from './projections/general-ledger.projection';
import { AccountingHealthService } from './services/accounting-health.service';
import { AccountingService } from './services/accounting.service';
import { ErrorHandlingService } from './services/error-handling.service';
import { ExchangeRateService } from './services/exchange-rate.service';
import { FinancialReportingService } from './services/financial-reporting.service';
import { KafkaProducerService } from './services/kafka-producer.service';
import { MultiCurrencyService } from './services/multi-currency.service';
import { OutboxService } from './services/outbox.service';
import { DefaultTaxAccountsMap } from './services/tax-account.mapper';
import { TaxComplianceService } from './services/tax-compliance.service';
import { TaxLineCalculatorService } from './services/tax-line-calculator.service';
import { TrialBalanceService } from './services/trial-balance.service';
import { KafkaEventProducer } from '@aibos/eventsourcing';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AccountEntity,
      ExchangeRateEntity,
      OutboxEventEntity,
      JournalEntryEntity,
    ]),
    HttpModule,
  ],
  providers: [
    // Core Services
    AccountingService,
    AccountingHealthService,
    ExchangeRateService,
    MultiCurrencyService,
    OutboxService,
    TaxComplianceService,
    TaxLineCalculatorService,
    DefaultTaxAccountsMap,
    KafkaProducerService,
    FinancialReportingService,
    TrialBalanceService,

    // Resilience & Error Handling
    ErrorHandlingService,
    ResilienceManager,
    ProjectionCircuitBreaker,
    ProjectionHealthService,

    // Projections
    GeneralLedgerProjection,
    KafkaEventProducer,

    // Repositories
    {
      provide: EVENT_STORE,
      useClass: InMemoryEventStore,
    },
    {
      provide: ACCOUNT_REPOSITORY,
      useClass: TypeormAccountRepository,
    },
    {
      provide: JOURNAL_ENTRY_REPOSITORY,
      useClass: TypeormJournalEntryRepository,
    },
  ],
  exports: [
    // Core Services
    AccountingService,
    AccountingHealthService,
    ExchangeRateService,
    MultiCurrencyService,
    OutboxService,
    TaxComplianceService,
    TaxLineCalculatorService,
    DefaultTaxAccountsMap,
    FinancialReportingService,
    TrialBalanceService,

    // Resilience & Error Handling
    ErrorHandlingService,
    ResilienceManager,
    ProjectionCircuitBreaker,
    ProjectionHealthService,

    // Projections
    GeneralLedgerProjection,
  ],
})
export class AccountingModule {}
