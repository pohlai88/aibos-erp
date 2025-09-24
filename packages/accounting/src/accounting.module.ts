import { AccountEntity } from './infrastructure/database/entities/account.entity';
import { ExchangeRateEntity } from './infrastructure/database/entities/exchange-rate.entity';
import { OutboxEventEntity } from './infrastructure/database/entities/outbox-event.entity';
import { TypeormAccountRepository } from './infrastructure/database/repositories/typeorm-account.repository';
import { KafkaProducerService } from './infrastructure/messaging/kafka-producer.service';
import { InMemoryAccountRepository } from './infrastructure/repositories/in-memory-account.repository';
import { InMemoryEventStore } from './infrastructure/repositories/in-memory-event-store.repository';
import { AccountingHealthService } from './services/accounting-health.service';
import { AccountingService } from './services/accounting.service';
import { ExchangeRateService } from './services/exchange-rate.service';
import { MultiCurrencyService } from './services/multi-currency-service';
import { OutboxService } from './services/outbox.service';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccountEntity, ExchangeRateEntity, OutboxEventEntity]),
    HttpModule,
  ],
  providers: [
    AccountingService,
    AccountingHealthService,
    ExchangeRateService,
    MultiCurrencyService,
    OutboxService,
    KafkaProducerService,
    {
      provide: 'EventStore',
      useClass: InMemoryEventStore,
    },
    {
      provide: 'AccountRepository',
      useClass: TypeormAccountRepository,
    },
    {
      provide: 'JournalEntryRepository',
      useClass: InMemoryAccountRepository, // TODO: Create proper JournalEntryRepository implementation
    },
  ],
  exports: [
    AccountingService,
    AccountingHealthService,
    ExchangeRateService,
    MultiCurrencyService,
    OutboxService,
  ],
})
export class AccountingModule {}
