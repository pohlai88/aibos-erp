import { AccountEntity } from './infrastructure/database/entities/account.entity';
import { OutboxEventEntity } from './infrastructure/database/entities/outbox-event.entity';
import { TypeormAccountRepository } from './infrastructure/database/repositories/typeorm-account.repository';
import { KafkaProducerService } from './infrastructure/messaging/kafka-producer.service';
import { InMemoryAccountRepository } from './infrastructure/repositories/in-memory-account.repository';
import { InMemoryEventStore } from './infrastructure/repositories/in-memory-event-store.repository';
import { AccountingHealthService } from './services/accounting-health.service';
import { AccountingService } from './services/accounting.service';
import { OutboxService } from './services/outbox.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([AccountEntity, OutboxEventEntity])],
  providers: [
    AccountingService,
    AccountingHealthService,
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
  exports: [AccountingService, AccountingHealthService, OutboxService],
})
export class AccountingModule {}
