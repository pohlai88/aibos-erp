import { InMemoryAccountRepository } from './infrastructure/repositories/in-memory-account.repository';
import { InMemoryEventStore } from './infrastructure/repositories/in-memory-event-store.repository';
import { AccountingHealthService } from './services/accounting-health.service';
import { AccountingService } from './services/accounting.service';
import { Module } from '@nestjs/common';

@Module({
  providers: [
    AccountingService,
    AccountingHealthService,
    {
      provide: 'EventStore',
      useClass: InMemoryEventStore,
    },
    {
      provide: 'AccountRepository',
      useClass: InMemoryAccountRepository,
    },
  ],
  exports: [AccountingService, AccountingHealthService],
})
export class AccountingModule {}
