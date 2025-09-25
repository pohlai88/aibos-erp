import {
  type InventoryService,
  type InventoryItem,
  type StockMovement,
  type InventorySummary,
  type ReceiveStockInput,
  type IssueStockInput,
  type TransferStockInput,
  type AdjustStockInput,
  type CycleCountInput,
  type OperationResponse,
} from './inventory.service';
import { Controller, Get, Post, Body, Param, Query, Headers, UseGuards } from '@nestjs/common';

const TENANT_ID_HEADER = 'x-tenant-id';

// Simple JWT guard - you can replace this with your actual auth guard
@UseGuards() // Add your JWT guard here
@Controller('api/v1/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // Query Endpoints
  @Get('summary')
  async getInventorySummary(
    @Headers(TENANT_ID_HEADER) tenantId: string,
  ): Promise<InventorySummary> {
    return this.inventoryService.getInventorySummary(tenantId);
  }

  @Get('items')
  async getAllInventory(@Headers(TENANT_ID_HEADER) tenantId: string): Promise<InventoryItem[]> {
    return this.inventoryService.getAllInventory(tenantId);
  }

  @Get('items/:sku')
  async getInventoryBySku(
    @Param('sku') sku: string,
    @Headers(TENANT_ID_HEADER) tenantId: string,
  ): Promise<InventoryItem | null> {
    return this.inventoryService.getInventoryBySku(sku, tenantId);
  }

  @Get('low-stock')
  async getLowStockItems(
    @Headers(TENANT_ID_HEADER) tenantId: string,
    @Query('threshold') threshold?: number,
  ): Promise<InventoryItem[]> {
    return this.inventoryService.getLowStockItems(tenantId, threshold);
  }

  @Get('out-of-stock')
  async getOutOfStockItems(@Headers(TENANT_ID_HEADER) tenantId: string): Promise<InventoryItem[]> {
    return this.inventoryService.getOutOfStockItems(tenantId);
  }

  @Get('movements/sku/:sku')
  async getStockMovementsBySku(
    @Param('sku') sku: string,
    @Headers(TENANT_ID_HEADER) tenantId: string,
  ): Promise<StockMovement[]> {
    return this.inventoryService.getStockMovementsBySku(sku, tenantId);
  }

  @Get('movements/location/:location')
  async getStockMovementsByLocation(
    @Param('location') location: string,
    @Headers(TENANT_ID_HEADER) tenantId: string,
  ): Promise<StockMovement[]> {
    return this.inventoryService.getStockMovementsByLocation(location, tenantId);
  }

  @Get('movements/date-range')
  async getStockMovementsByDateRange(
    @Headers(TENANT_ID_HEADER) tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<StockMovement[]> {
    return this.inventoryService.getStockMovementsByDateRange(
      new Date(startDate),
      new Date(endDate),
      tenantId,
    );
  }

  // Command Endpoints
  @Post('operations/receive-stock')
  async receiveStock(
    @Body() input: ReceiveStockInput,
    @Headers(TENANT_ID_HEADER) tenantId: string,
    @Headers('x-user-id') userId: string,
  ): Promise<OperationResponse> {
    return this.inventoryService.receiveStock({ ...input, tenantId, userId });
  }

  @Post('operations/issue-stock')
  async issueStock(
    @Body() input: IssueStockInput,
    @Headers(TENANT_ID_HEADER) tenantId: string,
    @Headers('x-user-id') userId: string,
  ): Promise<OperationResponse> {
    return this.inventoryService.issueStock({ ...input, tenantId, userId });
  }

  @Post('operations/transfer-stock')
  async transferStock(
    @Body() input: TransferStockInput,
    @Headers(TENANT_ID_HEADER) tenantId: string,
    @Headers('x-user-id') userId: string,
  ): Promise<OperationResponse> {
    return this.inventoryService.transferStock({ ...input, tenantId, userId });
  }

  @Post('operations/adjust-stock')
  async adjustStock(
    @Body() input: AdjustStockInput,
    @Headers(TENANT_ID_HEADER) tenantId: string,
    @Headers('x-user-id') userId: string,
  ): Promise<OperationResponse> {
    return this.inventoryService.adjustStock({ ...input, tenantId, userId });
  }

  @Post('operations/cycle-count')
  async performCycleCount(
    @Body() input: CycleCountInput,
    @Headers(TENANT_ID_HEADER) tenantId: string,
    @Headers('x-user-id') userId: string,
  ): Promise<OperationResponse> {
    return this.inventoryService.performCycleCount({ ...input, tenantId, userId });
  }
}
