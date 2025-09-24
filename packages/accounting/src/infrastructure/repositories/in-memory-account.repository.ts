import type { Account } from '../../domain/entities/accounting.entities';
import type { AccountRepository } from '../../domain/interfaces/repositories.interface';

export class InMemoryAccountRepository implements AccountRepository {
  private accounts: Map<string, Account> = new Map();

  async findByCode(accountCode: string, tenantId: string): Promise<Account | null> {
    const key = `${tenantId}:${accountCode}`;
    return this.accounts.get(key) || null;
  }

  async findByTenant(tenantId: string): Promise<Account[]> {
    const tenantAccounts: Account[] = [];
    for (const [key, account] of this.accounts) {
      if (key.startsWith(`${tenantId}:`)) {
        tenantAccounts.push(account);
      }
    }
    return tenantAccounts.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
  }

  async save(account: Account): Promise<void> {
    const key = `${account.tenantId}:${account.accountCode}`;
    this.accounts.set(key, account);
  }

  async updateBalance(accountCode: string, amount: number, tenantId: string): Promise<void> {
    const key = `${tenantId}:${accountCode}`;
    const account = this.accounts.get(key);
    if (account) {
      account.balance += amount;
      this.accounts.set(key, account);
    }
  }
}
