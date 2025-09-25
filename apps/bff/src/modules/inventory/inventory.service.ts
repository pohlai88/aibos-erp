import { type HttpService } from '@nestjs/axios';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import { type AxiosError } from 'axios';
import { randomUUID } from 'node:crypto';
import { firstValueFrom } from 'rxjs';

export interface InventoryItem {
  sku: string;
  description: string;
  unitOfMeasure: string;
  valuationMethod: string;
  totalStock: number;
  totalValue: number;
  averageCost: number;
  locations: Array<{
    location: string;
    quantity: number;
    unitCost: number;
    totalValue: number;
  }>;
}

export interface StockMovement {
  movementId: string;
  sku: string;
  quantity: number;
  unitCost: number;
  location: string;
  movementType: string;
  reference: string;
  timestamp: Date;
}

export interface InventorySummary {
  totalItems: number;
  totalStock: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  lastUpdated: Date;
}

export interface ReceiveStockInput {
  movementId: string;
  sku: string;
  quantity: number;
  unitCost: number;
  location: string;
  reference: string;
  batchNumber?: string;
  expiryDate?: string;
  serialNumbers?: string[];
}

export interface IssueStockInput {
  movementId: string;
  sku: string;
  quantity: number;
  location: string;
  reference: string;
  batchNumber?: string;
  serialNumbers?: string[];
}

export interface TransferStockInput {
  transferId: string;
  sku: string;
  quantity: number;
  fromLocation: string;
  toLocation: string;
  reference: string;
  batchNumber?: string;
  serialNumbers?: string[];
  reason?: string;
}

export interface AdjustStockInput {
  adjustmentId: string;
  sku: string;
  quantity: number;
  location: string;
  adjustmentType: 'INCREASE' | 'DECREASE';
  reason: string;
  reference: string;
  unitCost?: number;
  batchNumber?: string;
  serialNumbers?: string[];
}

export interface CycleCountInput {
  cycleCountId: string;
  sku: string;
  location: string;
  countedQuantity: number;
  reference: string;
  countedBy: string;
  countedAt: string;
  notes?: string;
  batchNumber?: string;
  serialNumbers?: string[];
}

export interface OperationResponse {
  success: boolean;
  message: string;
  operationId: string;
  timestamp: Date;
}

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);
  private readonly inventoryServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.inventoryServiceUrl = this.configService.get<string>(
      'INVENTORY_SERVICE_URL',
      'http://localhost:3002',
    );
  }

  // Query Operations
  async getInventorySummary(tenantId: string): Promise<InventorySummary> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.inventoryServiceUrl}/inventory/summary/${tenantId}`),
      );
      return response.data as InventorySummary;
    } catch (error) {
      throw this.mapError(error, 'Unable to fetch inventory summary');
    }
  }

  async getAllInventory(tenantId: string): Promise<InventoryItem[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.inventoryServiceUrl}/inventory/items/${tenantId}`),
      );
      return response.data as InventoryItem[];
    } catch (error) {
      throw this.mapError(error, 'Unable to fetch inventory items');
    }
  }

  async getInventoryBySku(sku: string, tenantId: string): Promise<InventoryItem | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.inventoryServiceUrl}/inventory/items/${tenantId}/${sku}`),
      );
      return (response.data as InventoryItem) ?? null;
    } catch (error) {
      if (this.isAxiosStatus(error, 404)) return null;
      throw this.mapError(error, `Unable to fetch inventory item ${sku}`);
    }
  }

  async getLowStockItems(tenantId: string, threshold?: number): Promise<InventoryItem[]> {
    try {
      const params = threshold ? { threshold: threshold.toString() } : {};
      const response = await firstValueFrom(
        this.httpService.get(`${this.inventoryServiceUrl}/inventory/low-stock/${tenantId}`, {
          params,
        }),
      );
      return response.data as InventoryItem[];
    } catch (error) {
      throw this.mapError(error, 'Unable to fetch low stock items');
    }
  }

  async getOutOfStockItems(tenantId: string): Promise<InventoryItem[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.inventoryServiceUrl}/inventory/out-of-stock/${tenantId}`),
      );
      return response.data as InventoryItem[];
    } catch (error) {
      throw this.mapError(error, 'Unable to fetch out of stock items');
    }
  }

  async getStockMovementsBySku(sku: string, tenantId: string): Promise<StockMovement[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.inventoryServiceUrl}/inventory/movements/${tenantId}/${sku}`),
      );
      return response.data as StockMovement[];
    } catch (error) {
      throw this.mapError(error, `Unable to fetch stock movements for SKU ${sku}`);
    }
  }

  async getStockMovementsByLocation(location: string, tenantId: string): Promise<StockMovement[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.inventoryServiceUrl}/inventory/movements/${tenantId}/location/${location}`,
        ),
      );
      return response.data as StockMovement[];
    } catch (error) {
      throw this.mapError(error, `Unable to fetch stock movements for location ${location}`);
    }
  }

  async getStockMovementsByDateRange(
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<StockMovement[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.inventoryServiceUrl}/inventory/movements/${tenantId}/date-range`,
          {
            params: {
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
            },
          },
        ),
      );
      return response.data as StockMovement[];
    } catch (error) {
      throw this.mapError(error, 'Unable to fetch stock movements by date range');
    }
  }

  // Command Operations
  async receiveStock(
    input: ReceiveStockInput & { tenantId: string; userId: string },
  ): Promise<OperationResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.inventoryServiceUrl}/inventory/operations/receive-stock`, {
          ...input,
          tenantId: input.tenantId,
          userId: input.userId,
        }),
      );
      return response.data as OperationResponse;
    } catch (error) {
      throw this.mapError(error, 'Unable to receive stock');
    }
  }

  async issueStock(
    input: IssueStockInput & { tenantId: string; userId: string },
  ): Promise<OperationResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.inventoryServiceUrl}/inventory/operations/issue-stock`, {
          ...input,
          tenantId: input.tenantId,
          userId: input.userId,
        }),
      );
      return response.data as OperationResponse;
    } catch (error) {
      throw this.mapError(error, 'Unable to issue stock');
    }
  }

  async transferStock(
    input: TransferStockInput & { tenantId: string; userId: string },
  ): Promise<OperationResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.inventoryServiceUrl}/inventory/operations/transfer-stock`, {
          ...input,
          tenantId: input.tenantId,
          userId: input.userId,
        }),
      );
      return response.data as OperationResponse;
    } catch (error) {
      throw this.mapError(error, 'Unable to transfer stock');
    }
  }

  async adjustStock(
    input: AdjustStockInput & { tenantId: string; userId: string },
  ): Promise<OperationResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.inventoryServiceUrl}/inventory/operations/adjust-stock`, {
          ...input,
          tenantId: input.tenantId,
          userId: input.userId,
        }),
      );
      return response.data as OperationResponse;
    } catch (error) {
      throw this.mapError(error, 'Unable to adjust stock');
    }
  }

  async performCycleCount(
    input: CycleCountInput & { tenantId: string; userId: string },
  ): Promise<OperationResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.inventoryServiceUrl}/inventory/operations/cycle-count`, {
          ...input,
          tenantId: input.tenantId,
          userId: input.userId,
        }),
      );
      return response.data as OperationResponse;
    } catch (error) {
      throw this.mapError(error, 'Unable to perform cycle count');
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
      this.logger.error(`[InventoryService] ${message} (status=${status})`, String(detail));
    } else {
      this.logger.error(`[InventoryService] ${message}`, String(error));
    }
    return new ServiceUnavailableException(message);
  }
}
