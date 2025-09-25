/* eslint-disable no-unused-vars */
import type { AdjustStockCommand } from '../commands/adjust-stock-command';
import type { CycleCountCommand } from '../commands/cycle-count-command';
import type { IssueStockCommand } from '../commands/issue-stock-command';
import type { ReceiveStockCommand } from '../commands/receive-stock-command';
import type { TransferStockCommand } from '../commands/transfer-stock-command';

import { type CreateWarehouseCommand } from '../domain/warehouse';
import { type CrmIntegrationService } from '../integrations/crm-integration.service';
import {
  type GoodsReceiptNoteDto,
  type PurchaseOrderValidationDto,
} from '../integrations/dto/goods-receipt.dto';
import { type VendorInventoryDataDto } from '../integrations/dto/vendor-data.dto';
import { type OrderManagementIntegrationService } from '../integrations/order-management-integration.service';
import { type ProcurementIntegrationService } from '../integrations/procurement-integration.service';
import { type QualityIntegrationService } from '../integrations/quality-integration.service';
import { type SalesPipelineIntegrationService } from '../integrations/sales-pipeline-integration.service';
import { type VendorIntegrationService } from '../integrations/vendor-integration.service';
import { type BatchTrackingService } from '../services/batch-tracking.service';
import { type CreateBatchCommand } from '../services/batch-tracking.service';
import { type BOMManagementService } from '../services/bom-management.service';
import { type ExpiryTrackingService } from '../services/expiry-tracking.service';
import { type InventoryService } from '../services/inventory.service';
import { type NCRManagementService } from '../services/ncr-management.service';
import { type OrderFulfillmentService } from '../services/order-fulfillment.service';
import { type ProductionOrderService } from '../services/production-order.service';
import { type ReconciliationService } from '../services/reconciliation.service';
import { type ReservationManagementService } from '../services/reservation-management.service';
import { type ReserveStockCommand } from '../services/reservation-management.service';
import { type SerialNumberManagementService } from '../services/serial-number-management.service';
import { type WarehouseManagementService } from '../services/warehouse-management.service';
import { type WorkCenterManagementService } from '../services/work-center-management.service';
import { Controller, Post, Body, HttpStatus, HttpException, Get, Param } from '@nestjs/common';

const RECEIVE_STOCK_ERROR = 'Failed to receive stock:';
const UNKNOWN_ERROR = 'Unknown error';
const DEFAULT_TENANT = 'default-tenant';

export interface ReceiveStockDto {
  readonly movementId: string;
  readonly sku: string;
  readonly quantity: number;
  readonly unitCost: number;
  readonly location: string;
  readonly reference: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly batchNumber?: string;
  readonly expiryDate?: string;
  readonly serialNumbers?: string[];
}

export interface IssueStockDto {
  readonly movementId: string;
  readonly sku: string;
  readonly quantity: number;
  readonly location: string;
  readonly reference: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly batchNumber?: string;
  readonly serialNumbers?: string[];
}

export interface TransferStockDto {
  readonly transferId: string;
  readonly sku: string;
  readonly quantity: number;
  readonly fromLocation: string;
  readonly toLocation: string;
  readonly reference: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly batchNumber?: string;
  readonly serialNumbers?: string[];
  readonly reason?: string;
}

export interface AdjustStockDto {
  readonly adjustmentId: string;
  readonly sku: string;
  readonly quantity: number;
  readonly location: string;
  readonly adjustmentType: 'INCREASE' | 'DECREASE';
  readonly reason: string;
  readonly reference: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly unitCost?: number;
  readonly batchNumber?: string;
  readonly serialNumbers?: string[];
}

export interface CycleCountDto {
  readonly cycleCountId: string;
  readonly sku: string;
  readonly location: string;
  readonly countedQuantity: number;
  readonly reference: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly countedBy: string;
  readonly countedAt: string;
  readonly notes?: string;
  readonly batchNumber?: string;
  readonly serialNumbers?: string[];
}

export interface OperationResponseDto {
  readonly success: boolean;
  readonly message: string;
  readonly operationId: string;
  readonly timestamp: Date;
}

@Controller('inventory/operations')
export class InventoryOperationsController {
  constructor(
    private readonly _inventoryService: InventoryService,
    private readonly procurementIntegrationService: ProcurementIntegrationService,
    private readonly vendorIntegrationService: VendorIntegrationService,
    private readonly warehouseManagementService: WarehouseManagementService,
    private readonly batchTrackingService: BatchTrackingService,
    private readonly reservationManagementService: ReservationManagementService,
    private readonly bomManagementService: BOMManagementService,
    private readonly productionOrderService: ProductionOrderService,
    private readonly workCenterManagementService: WorkCenterManagementService,
    private readonly qualityIntegrationService: QualityIntegrationService,
    private readonly ncrManagementService: NCRManagementService,
    private readonly crmIntegrationService: CrmIntegrationService,
    private readonly salesPipelineIntegrationService: SalesPipelineIntegrationService,
    private readonly orderManagementIntegrationService: OrderManagementIntegrationService,
    private readonly orderFulfillmentService: OrderFulfillmentService,
    private readonly reconciliationService: ReconciliationService,
    private readonly expiryTrackingService: ExpiryTrackingService,
    private readonly serialNumberManagementService: SerialNumberManagementService,
  ) {}

  @Post('receive-stock')
  async receiveStock(@Body() dto: ReceiveStockDto): Promise<OperationResponseDto> {
    try {
      const command: ReceiveStockCommand = {
        ...dto,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      };

      await this._inventoryService.receiveStock(command);

      return {
        success: true,
        message: 'Stock received successfully',
        operationId: command.movementId,
        timestamp: new Date(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(`${RECEIVE_STOCK_ERROR} ${message}`, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('issue-stock')
  async issueStock(@Body() dto: IssueStockDto): Promise<OperationResponseDto> {
    try {
      const command: IssueStockCommand = dto;

      await this._inventoryService.issueStock(command);

      return {
        success: true,
        message: 'Stock issued successfully',
        operationId: command.movementId,
        timestamp: new Date(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(`Failed to issue stock: ${message}`, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('transfer-stock')
  async transferStock(@Body() dto: TransferStockDto): Promise<OperationResponseDto> {
    try {
      const command: TransferStockCommand = dto;

      await this._inventoryService.transferStock(command);

      return {
        success: true,
        message: 'Stock transferred successfully',
        operationId: command.transferId,
        timestamp: new Date(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(`Failed to transfer stock: ${message}`, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('adjust-stock')
  async adjustStock(@Body() dto: AdjustStockDto): Promise<OperationResponseDto> {
    try {
      const command: AdjustStockCommand = dto;

      await this._inventoryService.adjustStock(command);

      return {
        success: true,
        message: 'Stock adjusted successfully',
        operationId: command.adjustmentId,
        timestamp: new Date(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(`Failed to adjust stock: ${message}`, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('cycle-count')
  async performCycleCount(@Body() dto: CycleCountDto): Promise<OperationResponseDto> {
    try {
      const command: CycleCountCommand = {
        ...dto,
        countedAt: new Date(dto.countedAt),
      };

      await this._inventoryService.performCycleCount(command);

      return {
        success: true,
        message: 'Cycle count completed successfully',
        operationId: command.cycleCountId,
        timestamp: new Date(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(`Failed to perform cycle count: ${message}`, HttpStatus.BAD_REQUEST);
    }
  }

  // Procurement Integration Endpoints
  @Post('process-grn')
  async processGoodsReceipt(@Body() dto: GoodsReceiptNoteDto): Promise<unknown> {
    try {
      // Convert DTO to domain object
      const grn = {
        ...dto,
        receivedDate: new Date(dto.receivedDate),
        items: dto.items.map((item) => ({
          ...item,
          expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
        })),
      };
      return await this.procurementIntegrationService.processGoodsReceipt(grn);
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(`Failed to process GRN: ${message}`, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('validate-purchase-order')
  async validatePurchaseOrder(@Body() dto: PurchaseOrderValidationDto): Promise<unknown> {
    try {
      return await this.procurementIntegrationService.validatePurchaseOrder(
        dto.poId,
        dto.sku,
        dto.quantity,
        dto.tenantId,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(
        `Failed to validate purchase order: ${message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Vendor Integration Endpoints
  @Post('update-vendor-inventory')
  async updateVendorInventory(@Body() dto: VendorInventoryDataDto): Promise<void> {
    try {
      // Convert DTO to domain object
      const vendorData = {
        ...dto,
        priceBreaks: dto.priceBreaks.map((priceBreak) => ({
          ...priceBreak,
          effectiveDate: new Date(priceBreak.effectiveDate),
        })),
      };
      await this.vendorIntegrationService.updateVendorInventory(vendorData);
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(
        `Failed to update vendor inventory: ${message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('vendor-inventory/:vendorId/:tenantId')
  async getVendorInventory(
    @Param('vendorId') vendorId: string,
    @Param('tenantId') tenantId: string,
  ): Promise<unknown[]> {
    try {
      return await this.vendorIntegrationService.getVendorInventory(vendorId, tenantId);
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(`Failed to get vendor inventory: ${message}`, HttpStatus.BAD_REQUEST);
    }
  }

  // Warehouse Management Endpoints
  @Post('create-warehouse')
  async createWarehouse(@Body() dto: CreateWarehouseCommand): Promise<void> {
    try {
      await this.warehouseManagementService.createWarehouse(dto);
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(`Failed to create warehouse: ${message}`, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('warehouse-utilization/:warehouseId/:tenantId')
  async getWarehouseUtilization(
    @Param('warehouseId') warehouseId: string,
    @Param('tenantId') tenantId: string,
  ): Promise<unknown> {
    try {
      return await this.warehouseManagementService.getLocationUtilization(warehouseId, tenantId);
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(
        `Failed to get warehouse utilization: ${message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Batch Tracking Endpoints
  @Post('create-batch')
  async createBatch(@Body() dto: CreateBatchCommand): Promise<void> {
    try {
      await this.batchTrackingService.createBatch(dto);
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(`Failed to create batch: ${message}`, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('expiring-items/:daysAhead/:tenantId')
  async getExpiringItems(
    @Param('daysAhead') daysAhead: string,
    @Param('tenantId') tenantId: string,
  ): Promise<unknown[]> {
    try {
      return await this.batchTrackingService.getExpiringItems(parseInt(daysAhead), tenantId);
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(`Failed to get expiring items: ${message}`, HttpStatus.BAD_REQUEST);
    }
  }

  // Reservation Management Endpoints
  @Post('reserve-stock')
  async reserveStock(@Body() dto: ReserveStockCommand): Promise<void> {
    try {
      await this.reservationManagementService.reserveStock(dto);
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(`Failed to reserve stock: ${message}`, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('release-reservation/:reservationId/:tenantId')
  async releaseReservation(
    @Param('reservationId') reservationId: string,
    @Param('tenantId') tenantId: string,
  ): Promise<void> {
    try {
      await this.reservationManagementService.releaseReservation(reservationId, tenantId);
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(`Failed to release reservation: ${message}`, HttpStatus.BAD_REQUEST);
    }
  }

  // Manufacturing Integration Endpoints
  @Post('create-bom')
  async createBOM(@Body() dto: unknown): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await this.bomManagementService.createBOM(dto as any);
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(`Failed to create BOM: ${message}`, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('calculate-mrp/:bomId/:quantity/:tenantId')
  async calculateMRP(
    @Param('bomId') bomId: string,
    @Param('quantity') quantity: number,
    @Param('tenantId') tenantId: string,
  ): Promise<unknown> {
    try {
      return await this.bomManagementService.calculateMRP(bomId, quantity, tenantId);
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(`Failed to calculate MRP: ${message}`, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('create-production-order')
  async createProductionOrder(@Body() dto: unknown): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await this.productionOrderService.createProductionOrder(dto as any);
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(
        `Failed to create production order: ${message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('start-production/:productionOrderId/:tenantId')
  async startProduction(
    @Param('productionOrderId') productionOrderId: string,
    @Param('tenantId') tenantId: string,
  ): Promise<void> {
    try {
      await this.productionOrderService.startProduction({ productionOrderId, tenantId });
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(`Failed to start production: ${message}`, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('complete-production/:productionOrderId/:actualQuantity/:tenantId')
  async completeProduction(
    @Param('productionOrderId') productionOrderId: string,
    @Param('actualQuantity') actualQuantity: number,
    @Param('tenantId') tenantId: string,
  ): Promise<void> {
    try {
      await this.productionOrderService.completeProduction({
        productionOrderId,
        actualQuantity,
        tenantId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(`Failed to complete production: ${message}`, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('create-work-center')
  async createWorkCenter(@Body() dto: unknown): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await this.workCenterManagementService.createWorkCenter(dto as any);
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(`Failed to create work center: ${message}`, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('work-center-utilization/:tenantId')
  async getWorkCenterUtilization(@Param('tenantId') tenantId: string): Promise<unknown> {
    try {
      return await this.workCenterManagementService.getWorkCenterUtilization(tenantId);
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(
        `Failed to get work center utilization: ${message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Quality Management Endpoints
  @Post('create-quality-inspection')
  async createQualityInspection(@Body() dto: unknown): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await this.qualityIntegrationService.createQualityInspection(dto as any);
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(
        `Failed to create quality inspection: ${message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('complete-quality-inspection')
  async completeQualityInspection(@Body() dto: unknown): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await this.qualityIntegrationService.completeQualityInspection(dto as any);
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(
        `Failed to complete quality inspection: ${message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('create-ncr')
  async createNCR(@Body() dto: unknown): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await this.ncrManagementService.createNCR(dto as any);
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(`Failed to create NCR: ${message}`, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('implement-corrective-action')
  async implementCorrectiveAction(@Body() dto: unknown): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await this.ncrManagementService.implementCorrectiveAction(dto as any);
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(
        `Failed to implement corrective action: ${message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // CRM Integration Endpoints
  @Get('customer-inventory/:customerId')
  async getCustomerInventory(
    @Param('customerId') customerId: string,
    @Body() dto: unknown,
  ): Promise<unknown> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tenantId = (dto as any).tenantId || DEFAULT_TENANT;
      return await this.crmIntegrationService.getCustomerInventoryView(customerId, tenantId);
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(
        `Failed to get customer inventory: ${message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('update-customer-pricing')
  async updateCustomerPricing(@Body() dto: unknown): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { customerId, pricingUpdates, tenantId } = dto as any;
      await this.crmIntegrationService.updateCustomerPricing(customerId, pricingUpdates, tenantId);
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(
        `Failed to update customer pricing: ${message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('validate-customer-order')
  async validateCustomerOrder(@Body() dto: unknown): Promise<unknown> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { customerId, items, tenantId } = dto as any;
      return await this.crmIntegrationService.validateCustomerOrder(customerId, items, tenantId);
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(
        `Failed to validate customer order: ${message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Sales Pipeline Integration Endpoints
  @Post('allocate-opportunity-inventory')
  async allocateOpportunityInventory(@Body() dto: unknown): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { opportunityId, tenantId } = dto as any;
      await this.salesPipelineIntegrationService.allocateInventoryForOpportunity(
        opportunityId,
        tenantId,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(
        `Failed to allocate opportunity inventory: ${message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('update-opportunity-stage')
  async updateOpportunityStage(@Body() dto: unknown): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { opportunityId, newStage, tenantId } = dto as any;
      await this.salesPipelineIntegrationService.updateOpportunityStage(
        opportunityId,
        newStage,
        tenantId,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(
        `Failed to update opportunity stage: ${message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('opportunity-inventory-report')
  async getOpportunityInventoryReport(@Body() dto: unknown): Promise<unknown> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tenantId = (dto as any).tenantId || DEFAULT_TENANT;
      return await this.salesPipelineIntegrationService.getOpportunityInventoryReport(tenantId);
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(
        `Failed to get opportunity inventory report: ${message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Order Management Integration Endpoints
  @Post('process-order')
  async processOrder(@Body() dto: unknown): Promise<unknown> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await this.orderManagementIntegrationService.processOrder(dto as any);
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(`Failed to process order: ${message}`, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('start-order-fulfillment')
  async startOrderFulfillment(@Body() dto: unknown): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { orderId, tenantId } = dto as any;
      await this.orderManagementIntegrationService.startOrderFulfillment(orderId, tenantId);
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(
        `Failed to start order fulfillment: ${message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('cancel-order')
  async cancelOrder(@Body() dto: unknown): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { orderId, tenantId } = dto as any;
      await this.orderManagementIntegrationService.cancelOrder(orderId, tenantId);
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(`Failed to cancel order: ${message}`, HttpStatus.BAD_REQUEST);
    }
  }

  // Order Fulfillment Endpoints
  @Post('start-fulfillment')
  async startFulfillment(@Body() dto: unknown): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await this.orderFulfillmentService.startFulfillment(dto as any);
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(`Failed to start fulfillment: ${message}`, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('complete-fulfillment')
  async completeFulfillment(@Body() dto: unknown): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { fulfillmentId, tenantId } = dto as any;
      await this.orderFulfillmentService.completeFulfillment(fulfillmentId, tenantId);
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(`Failed to complete fulfillment: ${message}`, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('track-fulfillment/:fulfillmentId')
  async trackFulfillment(
    @Param('fulfillmentId') fulfillmentId: string,
    @Body() dto: unknown,
  ): Promise<unknown> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tenantId = (dto as any).tenantId || DEFAULT_TENANT;
      return await this.orderFulfillmentService.trackFulfillment(fulfillmentId, tenantId);
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(`Failed to track fulfillment: ${message}`, HttpStatus.BAD_REQUEST);
    }
  }

  // Reconciliation endpoints
  @Post('reconciliation/create')
  async createReconciliation(@Body() dto: unknown): Promise<void> {
    try {
      const { reconciliationId, sku, location, reconciliationType, reconciledBy, tenantId, notes } =
        dto as {
          reconciliationId: string;
          sku: string;
          location: string;
          reconciliationType: string;
          reconciledBy: string;
          tenantId: string;
          notes?: string;
        };
      await this.reconciliationService.createReconciliation({
        reconciliationId,
        sku,
        location,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        reconciliationType: reconciliationType as any,
        reconciledBy,
        tenantId: tenantId || DEFAULT_TENANT,
        notes,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(
        `Failed to create reconciliation: ${message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('reconciliation/start')
  async startReconciliation(@Body() dto: unknown): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { reconciliationId, tenantId } = dto as any;
      await this.reconciliationService.startReconciliation(
        reconciliationId,
        tenantId || DEFAULT_TENANT,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(`Failed to start reconciliation: ${message}`, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('reconciliation/complete')
  async completeReconciliation(@Body() dto: unknown): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { reconciliationId, physicalQuantity, notes, tenantId } = dto as any;
      await this.reconciliationService.completeReconciliation({
        reconciliationId,
        physicalQuantity,
        notes,
        tenantId: tenantId || DEFAULT_TENANT,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(
        `Failed to complete reconciliation: ${message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('reconciliation/approve')
  async approveReconciliation(@Body() dto: unknown): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { reconciliationId, approvedBy, tenantId } = dto as any;
      await this.reconciliationService.approveReconciliation(
        reconciliationId,
        approvedBy,
        tenantId || DEFAULT_TENANT,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(
        `Failed to approve reconciliation: ${message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('reconciliation/reject')
  async rejectReconciliation(@Body() dto: unknown): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { reconciliationId, reason, tenantId } = dto as any;
      await this.reconciliationService.rejectReconciliation(
        reconciliationId,
        reason,
        tenantId || DEFAULT_TENANT,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(
        `Failed to reject reconciliation: ${message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Expiry tracking endpoints
  @Get('expiry/alerts')
  async getExpiryAlerts(@Body() dto: unknown): Promise<unknown> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { tenantId, daysAhead } = dto as any;
      return await this.expiryTrackingService.getExpiryAlerts(
        tenantId || DEFAULT_TENANT,
        daysAhead || 30,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(`Failed to get expiry alerts: ${message}`, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('expiry/report')
  async getExpiryReport(@Body() dto: unknown): Promise<unknown> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { tenantId } = dto as any;
      return await this.expiryTrackingService.getExpiryReport(tenantId || DEFAULT_TENANT);
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(`Failed to get expiry report: ${message}`, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('expiry/notifications/schedule')
  async scheduleExpiryNotifications(@Body() dto: unknown): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { tenantId } = dto as any;
      await this.expiryTrackingService.scheduleExpiryNotifications(tenantId || DEFAULT_TENANT);
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(
        `Failed to schedule expiry notifications: ${message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Serial Number Management endpoints
  @Post('serial-numbers/create')
  async createSerialNumber(@Body() dto: unknown): Promise<void> {
    try {
      const { serialNumber, sku, batchId, location, tenantId } = dto as {
        serialNumber: string;
        sku: string;
        batchId: string;
        location: string;
        tenantId: string;
      };
      await this.serialNumberManagementService.createSerialNumber({
        serialNumber,
        sku,
        batchId,
        location,
        tenantId: tenantId || DEFAULT_TENANT,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(`Failed to create serial number: ${message}`, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('serial-numbers/reserve')
  async reserveSerialNumber(@Body() dto: unknown): Promise<void> {
    try {
      const { serialNumber, reservedBy, orderId, tenantId } = dto as {
        serialNumber: string;
        reservedBy: string;
        orderId: string;
        tenantId: string;
      };
      await this.serialNumberManagementService.reserveSerialNumber({
        serialNumber,
        reservedBy,
        orderId,
        tenantId: tenantId || DEFAULT_TENANT,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(
        `Failed to reserve serial number: ${message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('serial-numbers/sell')
  async sellSerialNumber(@Body() dto: unknown): Promise<void> {
    try {
      const { serialNumber, soldBy, orderId, tenantId } = dto as {
        serialNumber: string;
        soldBy: string;
        orderId: string;
        tenantId: string;
      };
      await this.serialNumberManagementService.sellSerialNumber({
        serialNumber,
        soldBy,
        orderId,
        tenantId: tenantId || DEFAULT_TENANT,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(`Failed to sell serial number: ${message}`, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('serial-numbers/quarantine')
  async quarantineSerialNumber(@Body() dto: unknown): Promise<void> {
    try {
      const { serialNumber, reason, tenantId } = dto as {
        serialNumber: string;
        reason: string;
        tenantId: string;
      };
      await this.serialNumberManagementService.quarantineSerialNumber({
        serialNumber,
        reason,
        tenantId: tenantId || DEFAULT_TENANT,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(
        `Failed to quarantine serial number: ${message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('serial-numbers/return')
  async returnSerialNumber(@Body() dto: unknown): Promise<void> {
    try {
      const { serialNumber, returnedBy, reason, tenantId } = dto as {
        serialNumber: string;
        returnedBy: string;
        reason: string;
        tenantId: string;
      };
      await this.serialNumberManagementService.returnSerialNumber({
        serialNumber,
        returnedBy,
        reason,
        tenantId: tenantId || DEFAULT_TENANT,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(`Failed to return serial number: ${message}`, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('serial-numbers/scrap')
  async scrapSerialNumber(@Body() dto: unknown): Promise<void> {
    try {
      const { serialNumber, reason, tenantId } = dto as {
        serialNumber: string;
        reason: string;
        tenantId: string;
      };
      await this.serialNumberManagementService.scrapSerialNumber({
        serialNumber,
        reason,
        tenantId: tenantId || DEFAULT_TENANT,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(`Failed to scrap serial number: ${message}`, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('serial-numbers/release-from-quarantine')
  async releaseFromQuarantine(@Body() dto: unknown): Promise<void> {
    try {
      const { serialNumber, tenantId } = dto as {
        serialNumber: string;
        tenantId: string;
      };
      await this.serialNumberManagementService.releaseFromQuarantine(
        serialNumber,
        tenantId || DEFAULT_TENANT,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(
        `Failed to release serial number from quarantine: ${message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('serial-numbers/by-sku/:sku')
  async getSerialNumbersBySku(@Param('sku') sku: string, @Body() dto: unknown): Promise<unknown> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { tenantId } = dto as any;
      return await this.serialNumberManagementService.getSerialNumbersBySku(
        sku,
        tenantId || DEFAULT_TENANT,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(
        `Failed to get serial numbers by SKU: ${message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('serial-numbers/by-batch/:batchId')
  async getSerialNumbersByBatch(
    @Param('batchId') batchId: string,
    @Body() dto: unknown,
  ): Promise<unknown> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { tenantId } = dto as any;
      return await this.serialNumberManagementService.getSerialNumbersByBatch(
        batchId,
        tenantId || DEFAULT_TENANT,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(
        `Failed to get serial numbers by batch: ${message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('serial-numbers/traceability/:serialNumber')
  async getSerialNumberTraceability(
    @Param('serialNumber') serialNumber: string,
    @Body() dto: unknown,
  ): Promise<unknown> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { tenantId } = dto as any;
      return await this.serialNumberManagementService.getSerialNumberTraceability(
        serialNumber,
        tenantId || DEFAULT_TENANT,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(
        `Failed to get serial number traceability: ${message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('serial-numbers/report')
  async getSerialNumberReport(@Body() dto: unknown): Promise<unknown> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { tenantId } = dto as any;
      return await this.serialNumberManagementService.getSerialNumberReport(
        tenantId || DEFAULT_TENANT,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : UNKNOWN_ERROR;
      throw new HttpException(
        `Failed to get serial number report: ${message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
