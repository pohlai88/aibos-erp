/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */
import type { InventoryQueryService } from '../services/inventory-query.service';

import { Controller, Get, Param, Query, HttpStatus, HttpException } from '@nestjs/common';

const INTERNAL_SERVER_ERROR = 'Internal server error';

export interface InventoryQueryDto {
  readonly sku?: string;
  readonly location?: string;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly threshold?: number;
}

export interface InventoryResponseDto {
  readonly sku: string;
  readonly description: string;
  readonly unitOfMeasure: string;
  readonly valuationMethod: string;
  readonly totalStock: number;
  readonly totalValue: number;
  readonly averageCost: number;
  readonly locations: Array<{
    readonly location: string;
    readonly quantity: number;
    readonly unitCost: number;
    readonly totalValue: number;
  }>;
}

export interface StockMovementResponseDto {
  readonly movementId: string;
  readonly sku: string;
  readonly quantity: number;
  readonly unitCost: number;
  readonly location: string;
  readonly movementType: string;
  readonly reference: string;
  readonly timestamp: Date;
}

export interface InventorySummaryResponseDto {
  readonly totalItems: number;
  readonly totalStock: number;
  readonly totalValue: number;
  readonly lowStockItems: number;
  readonly outOfStockItems: number;
  readonly lastUpdated: Date;
}

@Controller('inventory')
export class InventoryController {
  constructor(private readonly _inventoryQueryService: InventoryQueryService) {}

  @Get('summary/:tenantId')
  async getInventorySummary(
    @Param('tenantId') tenantId: string,
  ): Promise<InventorySummaryResponseDto> {
    try {
      const summary = await this._inventoryQueryService.getInventorySummary(tenantId);

      if (!summary) {
        throw new HttpException('Inventory summary not found', HttpStatus.NOT_FOUND);
      }

      return summary;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(INTERNAL_SERVER_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('items/:tenantId')
  async getAllInventory(@Param('tenantId') tenantId: string): Promise<InventoryResponseDto[]> {
    try {
      return await this._inventoryQueryService.getAllInventory(tenantId);
    } catch (_error) {
      throw new HttpException(INTERNAL_SERVER_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('items/:tenantId/:sku')
  async getInventoryBySku(
    @Param('tenantId') tenantId: string,
    @Param('sku') sku: string,
  ): Promise<InventoryResponseDto> {
    try {
      const inventory = await this._inventoryQueryService.getInventoryBySku(sku, tenantId);

      if (!inventory) {
        throw new HttpException('Inventory item not found', HttpStatus.NOT_FOUND);
      }

      return inventory;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(INTERNAL_SERVER_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('low-stock/:tenantId')
  async getLowStockItems(
    @Param('tenantId') tenantId: string,
    @Query('threshold') threshold?: string,
  ): Promise<InventoryResponseDto[]> {
    try {
      const thresholdValue = threshold ? parseInt(threshold, 10) : 10;
      return await this._inventoryQueryService.getLowStockItems(thresholdValue, tenantId);
    } catch (_error) {
      throw new HttpException(INTERNAL_SERVER_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('out-of-stock/:tenantId')
  async getOutOfStockItems(@Param('tenantId') tenantId: string): Promise<InventoryResponseDto[]> {
    try {
      return await this._inventoryQueryService.getOutOfStockItems(tenantId);
    } catch (_error) {
      throw new HttpException(INTERNAL_SERVER_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('movements/:tenantId/:sku')
  async getStockMovementsBySku(
    @Param('tenantId') tenantId: string,
    @Param('sku') sku: string,
  ): Promise<StockMovementResponseDto[]> {
    try {
      return await this._inventoryQueryService.getStockMovementsBySku(sku, tenantId);
    } catch (_error) {
      throw new HttpException(INTERNAL_SERVER_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('movements/:tenantId/location/:location')
  async getStockMovementsByLocation(
    @Param('tenantId') tenantId: string,
    @Param('location') location: string,
  ): Promise<StockMovementResponseDto[]> {
    try {
      return await this._inventoryQueryService.getStockMovementsByLocation(location, tenantId);
    } catch (_error) {
      throw new HttpException(INTERNAL_SERVER_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('movements/:tenantId/date-range')
  async getStockMovementsByDateRange(
    @Param('tenantId') tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<StockMovementResponseDto[]> {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new HttpException('Invalid date format', HttpStatus.BAD_REQUEST);
      }

      return await this._inventoryQueryService.getStockMovementsByDateRange(start, end, tenantId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(INTERNAL_SERVER_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
