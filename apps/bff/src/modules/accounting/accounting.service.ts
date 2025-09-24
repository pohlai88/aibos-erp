import { type HttpService } from '@nestjs/axios';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import { type AxiosError } from 'axios';
import { randomUUID } from 'node:crypto';
import { firstValueFrom } from 'rxjs';

export interface Account {
  accountCode: string;
  accountName: string;
  accountType: string;
  parentAccountCode?: string;
  tenantId: string;
  balance: number;
  isActive: boolean;
}

export interface JournalEntry {
  id: string;
  tenantId: string;
  entries: Array<{
    accountCode: string;
    debitAmount: number;
    creditAmount: number;
    currency: string;
    description?: string;
  }>;
  reference?: string;
  description?: string;
  postingDate: Date;
  status: 'DRAFT' | 'POSTED' | 'REVERSED';
}

export interface FinancialReport {
  tenantId: string;
  reportType: string;
  generatedAt: Date;
  data: Record<string, unknown>;
}

export interface CreateAccountInput {
  accountCode: string;
  accountName: string;
  accountType: string;
  parentAccountCode?: string;
}

export interface PostJournalEntryInput {
  entries: Array<{
    accountCode: string;
    debitAmount: number;
    creditAmount: number;
    currency: string;
    description?: string;
  }>;
  reference?: string;
  description?: string;
  postingDate: Date;
}

@Injectable()
export class AccountingService {
  private readonly logger = new Logger(AccountingService.name);
  private readonly accountingServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.accountingServiceUrl = this.configService.get<string>(
      'ACCOUNTING_SERVICE_URL',
      'http://localhost:3001',
    );
  }

  async getAccounts(tenantId: string): Promise<Account[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.accountingServiceUrl}/api/v1/accounts`, {
          headers: { 'X-Tenant-Id': tenantId },
        }),
      );
      return response.data as Account[];
    } catch (error) {
      throw this.mapError(error, 'Unable to fetch accounts');
    }
  }

  async getAccount(accountCode: string, tenantId: string): Promise<Account | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.accountingServiceUrl}/api/v1/accounts/${accountCode}`, {
          headers: { 'X-Tenant-Id': tenantId },
        }),
      );
      return (response.data as Account) ?? null;
    } catch (error) {
      // Return null on 404, otherwise map error
      if (this.isAxiosStatus(error, 404)) return null;
      throw this.mapError(error, `Unable to fetch account ${accountCode}`);
    }
  }

  async createAccount(
    input: CreateAccountInput & { tenantId: string; userId: string },
  ): Promise<Account> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.accountingServiceUrl}/api/v1/accounts`, input, {
          headers: {
            'X-Tenant-Id': input.tenantId,
            'X-User-Id': input.userId,
          },
        }),
      );
      return response.data as Account;
    } catch (error) {
      throw this.mapError(error, 'Unable to create account');
    }
  }

  async postJournalEntry(
    input: PostJournalEntryInput & { tenantId: string; userId: string; idempotencyKey?: string },
  ): Promise<JournalEntry> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.accountingServiceUrl}/api/v1/journal-entries`, input, {
          headers: {
            'X-Tenant-Id': input.tenantId,
            'X-User-Id': input.userId,
            'Idempotency-Key': input.idempotencyKey ?? this.generateIdempotencyKey(),
          },
        }),
      );
      return response.data as JournalEntry;
    } catch (error) {
      throw this.mapError(error, 'Unable to post journal entry');
    }
  }

  async getJournalEntries(
    tenantId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<JournalEntry[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.accountingServiceUrl}/api/v1/journal-entries`, {
          headers: { 'X-Tenant-Id': tenantId },
          params: { limit, offset },
        }),
      );
      return response.data as JournalEntry[];
    } catch (error) {
      throw this.mapError(error, 'Unable to fetch journal entries');
    }
  }

  async generateTrialBalance(tenantId: string, asOfDate: Date): Promise<FinancialReport> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.accountingServiceUrl}/api/v1/reports/trial-balance`, {
          headers: { 'X-Tenant-Id': tenantId },
          params: { asOfDate: asOfDate.toISOString() },
        }),
      );
      return response.data as FinancialReport;
    } catch (error) {
      throw this.mapError(error, 'Unable to generate trial balance');
    }
  }

  async generateProfitAndLoss(
    tenantId: string,
    fromDate: Date,
    toDate: Date,
  ): Promise<FinancialReport> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.accountingServiceUrl}/api/v1/reports/profit-and-loss`, {
          headers: { 'X-Tenant-Id': tenantId },
          params: {
            fromDate: fromDate.toISOString(),
            toDate: toDate.toISOString(),
          },
        }),
      );
      return response.data as FinancialReport;
    } catch (error) {
      throw this.mapError(error, 'Unable to generate profit and loss report');
    }
  }

  async generateBalanceSheet(tenantId: string, asOfDate: Date): Promise<FinancialReport> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.accountingServiceUrl}/api/v1/reports/balance-sheet`, {
          headers: { 'X-Tenant-Id': tenantId },
          params: { asOfDate: asOfDate.toISOString() },
        }),
      );
      return response.data as FinancialReport;
    } catch (error) {
      throw this.mapError(error, 'Unable to generate balance sheet');
    }
  }

  private generateIdempotencyKey(): string {
    return randomUUID();
  }

  private isAxiosStatus(error: unknown, status: number): boolean {
    return (
      !!(error as AxiosError)?.isAxiosError && (error as AxiosError)?.response?.status === status
    );
  }

  private mapError(error: unknown, message: string): ServiceUnavailableException {
    const ax = error as AxiosError;
    if (ax?.isAxiosError) {
      const status = ax.response?.status;
      const detail = ax.response?.data ?? ax.message;
      this.logger.error(`[AccountingService] ${message} (status=${status})`, String(detail));
    } else {
      this.logger.error(`[AccountingService] ${message}`, String(error));
    }
    return new ServiceUnavailableException(message);
  }
}
