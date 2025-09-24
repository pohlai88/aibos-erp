import {
  type AccountingService,
  type Account,
  type JournalEntry,
  type FinancialReport,
  type CreateAccountInput,
  type PostJournalEntryInput,
} from './accounting.service';
import { Controller, Get, Post, Body, Param, Query, Headers, UseGuards } from '@nestjs/common';

const TENANT_ID_HEADER = 'x-tenant-id';

// Simple JWT guard - you can replace this with your actual auth guard
@UseGuards() // Add your JWT guard here
@Controller('api/v1/accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Get('accounts')
  async getAccounts(@Headers(TENANT_ID_HEADER) tenantId: string): Promise<Account[]> {
    return this.accountingService.getAccounts(tenantId);
  }

  @Get('accounts/:accountCode')
  async getAccount(
    @Param('accountCode') accountCode: string,
    @Headers(TENANT_ID_HEADER) tenantId: string,
  ): Promise<Account | null> {
    return this.accountingService.getAccount(accountCode, tenantId);
  }

  @Post('accounts')
  async createAccount(
    @Body() input: CreateAccountInput,
    @Headers(TENANT_ID_HEADER) tenantId: string,
    @Headers('x-user-id') userId: string,
  ): Promise<Account> {
    return this.accountingService.createAccount({ ...input, tenantId, userId });
  }

  @Get('journal-entries')
  async getJournalEntries(
    @Headers(TENANT_ID_HEADER) tenantId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<JournalEntry[]> {
    return this.accountingService.getJournalEntries(tenantId, limit, offset);
  }

  @Post('journal-entries')
  async postJournalEntry(
    @Body() input: PostJournalEntryInput,
    @Headers(TENANT_ID_HEADER) tenantId: string,
    @Headers('x-user-id') userId: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<JournalEntry> {
    return this.accountingService.postJournalEntry({
      ...input,
      tenantId,
      userId,
      idempotencyKey,
    });
  }

  @Get('reports/trial-balance')
  async getTrialBalance(
    @Headers(TENANT_ID_HEADER) tenantId: string,
    @Query('asOfDate') asOfDate: string,
  ): Promise<FinancialReport> {
    return this.accountingService.generateTrialBalance(tenantId, new Date(asOfDate));
  }

  @Get('reports/profit-and-loss')
  async getProfitAndLoss(
    @Headers(TENANT_ID_HEADER) tenantId: string,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ): Promise<FinancialReport> {
    return this.accountingService.generateProfitAndLoss(
      tenantId,
      new Date(fromDate),
      new Date(toDate),
    );
  }

  @Get('reports/balance-sheet')
  async getBalanceSheet(
    @Headers(TENANT_ID_HEADER) tenantId: string,
    @Query('asOfDate') asOfDate: string,
  ): Promise<FinancialReport> {
    return this.accountingService.generateBalanceSheet(tenantId, new Date(asOfDate));
  }
}
