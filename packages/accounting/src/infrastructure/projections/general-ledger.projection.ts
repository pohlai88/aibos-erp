import type { DomainEvent } from '../../domain/events/domain-events';

import { type AccountRepository } from '../../domain/interfaces/repositories.interface';
import { Injectable, Logger } from '@nestjs/common';

type JournalEntryLine = {
  accountCode: string;
  debitAmount?: number;
  creditAmount?: number;
};

type JournalEntryPostedPayload = {
  eventType: 'JournalEntryPosted';
  tenantId: string;
  journalEntryId: string;
  entries: ReadonlyArray<JournalEntryLine>;
};

@Injectable()
export class GeneralLedgerProjection {
  private readonly logger = new Logger(GeneralLedgerProjection.name);
  constructor(private readonly accountRepo: AccountRepository) {}

  /**
   * Call this from your message-consumer (Kafka/Outbox processor) when a JE posted event arrives.
   */
  async onEvent(event: DomainEvent | { payload?: unknown }): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload = (event as any)?.payload ?? event;
    if (!payload || payload.eventType !== 'JournalEntryPosted') return;
    const p = payload as JournalEntryPostedPayload;

    // Validate accounts exist up-front (optional; can skip if JE command already validated)
    const codes = Array.from(new Set(p.entries.map((entry) => entry.accountCode)));
    const existing = await this.accountRepo.findAllByCodes(codes, p.tenantId);
    const ok = new Set(existing.map((a) => a.accountCode));
    const missing = codes.filter((c) => !ok.has(c));
    if (missing.length) {
      this.logger.warn(`Projection skipped; missing accounts [${missing.join(', ')}]`);
      return;
    }

    // Apply deltas
    for (const line of p.entries) {
      const delta = Number(line.debitAmount || 0) - Number(line.creditAmount || 0);
      await this.accountRepo.updateBalance(line.accountCode, delta, p.tenantId);
    }
    this.logger.debug(`GL projection applied for JE ${p.journalEntryId} (tenant ${p.tenantId})`);
  }
}
