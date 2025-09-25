import { AccountEntity } from './infrastructure/database/entities/account.entity';
import { ExchangeRateEntity } from './infrastructure/database/entities/exchange-rate.entity';
import { JournalEntryEntity } from './infrastructure/database/entities/journal-entry.entity';
import { OutboxEventEntity } from './infrastructure/database/entities/outbox-event.entity';
import { TypeormAccountRepository } from './infrastructure/database/repositories/typeorm-account.repository';
import { TypeormJournalEntryRepository } from './infrastructure/database/repositories/typeorm-journal-entry.repository';
import { InMemoryEventStore } from './infrastructure/repositories/in-memory-event-store.repository';
import { GeneralLedgerProjection } from './projections/general-ledger-projection';
import { AccountingHealthService } from './services/accounting-health.service';
import { AccountingService } from './services/accounting.service';
import { ExchangeRateService } from './services/exchange-rate.service';
import { FinancialReportingService } from './services/financial-reporting.service';
import { KafkaProducerService } from './services/kafka-producer.service';
import { MultiCurrencyService } from './services/multi-currency.service';
import { OutboxService } from './services/outbox.service';
import { DefaultTaxAccountsMap } from './services/tax-account.mapper';
import { TaxComplianceService } from './services/tax-compliance.service';
import { TaxLineCalculatorService } from './services/tax-line-calculator.service';
import { TrialBalanceService } from './services/trial-balance.service';
import { EVENT_STORE, ACCOUNT_REPOSITORY, JOURNAL_ENTRY_REPOSITORY } from './tokens';
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
    GeneralLedgerProjection,
    KafkaEventProducer,
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
    GeneralLedgerProjection,
  ],
})
export class AccountingModule {}
