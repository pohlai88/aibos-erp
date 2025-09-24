import type { Account } from '../../domain/entities/accounting.entities';
import type { AccountRepository } from '../../domain/interfaces/repositories.interface';

import { AccountEntity } from '../database/entities/account.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type Repository, type DataSource } from 'typeorm';

@Injectable()
export class PostgreSQLAccountRepository implements AccountRepository {
  private readonly logger = new Logger(PostgreSQLAccountRepository.name);
  private static readonly SET_TENANT_CONTEXT_QUERY = 'SELECT set_tenant_context($1)';

  constructor(
    @InjectRepository(AccountEntity)
    private readonly accountRepository: Repository<AccountEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findByCode(accountCode: string, tenantId: string): Promise<Account | null> {
    try {
      // Set tenant context for RLS
      await this.dataSource.query(PostgreSQLAccountRepository.SET_TENANT_CONTEXT_QUERY, [tenantId]);

      const entity = await this.accountRepository.findOne({
        where: { accountCode, tenantId },
      });

      return entity ? this.toDomain(entity) : null;
    } catch (error) {
      this.logger.error(`Failed to find account by code ${accountCode}:`, error);
      throw error;
    }
  }

  async findByTenant(tenantId: string): Promise<Account[]> {
    try {
      // Set tenant context for RLS
      await this.dataSource.query(PostgreSQLAccountRepository.SET_TENANT_CONTEXT_QUERY, [tenantId]);

      const entities = await this.accountRepository.find({
        where: { tenantId },
        order: { accountCode: 'ASC' },
      });

      return entities.map(this.toDomain);
    } catch (error) {
      this.logger.error(`Failed to find accounts for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  async save(account: Account): Promise<void> {
    try {
      // Set tenant context for RLS
      await this.dataSource.query(PostgreSQLAccountRepository.SET_TENANT_CONTEXT_QUERY, [
        account.tenantId,
      ]);

      const entity = this.toEntity(account);
      await this.accountRepository.save(entity);

      this.logger.debug(`Successfully saved account ${account.accountCode}`);
    } catch (error: unknown) {
      this.logger.error(`Failed to save account ${account.accountCode}:`, error);

      // Handle specific PostgreSQL errors
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        // Unique violation
        throw new Error(`Account code ${account.accountCode} already exists`);
      }

      throw error;
    }
  }

  async updateBalance(accountCode: string, amount: number, tenantId: string): Promise<void> {
    try {
      // Set tenant context for RLS
      await this.dataSource.query(PostgreSQLAccountRepository.SET_TENANT_CONTEXT_QUERY, [tenantId]);

      const result = await this.accountRepository
        .createQueryBuilder()
        .update(AccountEntity)
        .set({
          balance: () => `balance + ${amount}`,
          updatedAt: new Date(),
        })
        .where('accountCode = :accountCode AND tenantId = :tenantId', {
          accountCode,
          tenantId,
        })
        .execute();

      if (result.affected === 0) {
        throw new Error(`Account ${accountCode} not found or not accessible`);
      }

      this.logger.debug(`Updated balance for account ${accountCode} by ${amount}`);
    } catch (error) {
      this.logger.error(`Failed to update balance for account ${accountCode}:`, error);
      throw error;
    }
  }

  private toDomain(entity: AccountEntity): Account {
    return {
      accountCode: entity.accountCode,
      accountName: entity.accountName,
      accountType: entity.accountType,
      parentAccountCode: entity.parentAccountCode,
      tenantId: entity.tenantId,
      balance: entity.balance,
      isActive: entity.isActive,
    };
  }

  private toEntity(account: Account): AccountEntity {
    const entity = new AccountEntity();
    entity.accountCode = account.accountCode;
    entity.accountName = account.accountName;
    entity.accountType = account.accountType;
    entity.parentAccountCode = account.parentAccountCode;
    entity.tenantId = account.tenantId;
    entity.balance = account.balance;
    entity.isActive = account.isActive;
    return entity;
  }
}
