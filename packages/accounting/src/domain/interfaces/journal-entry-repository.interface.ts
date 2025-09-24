export interface JournalEntryRepository {
  findByCode(journalEntryId: string, tenantId: string): Promise<unknown | null>;
  findByTenant(tenantId: string): Promise<unknown[]>;
  save(journalEntry: unknown): Promise<void>;
  updateStatus(journalEntryId: string, status: string, tenantId: string): Promise<void>;
}
