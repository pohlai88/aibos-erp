import { type ReceiveStockCommand } from '../commands/receive-stock-command';
import { GoodsReceiptProcessedEvent } from '../events/goods-receipt-processed-event';
import { type EventStore } from '../infrastructure/event-store/event-store';
import { type InventoryService } from '../services/inventory.service';
import {
  type GoodsReceiptNote,
  type GRNProcessingResult,
  type PurchaseOrderValidation,
} from './interfaces/procurement.interface';
import { Injectable, type Logger } from '@nestjs/common';

@Injectable()
export class ProcurementIntegrationService {
  /* eslint-disable no-unused-vars */
  constructor(
    private readonly _inventoryService: InventoryService,
    private readonly _eventStore: EventStore,
    private readonly _logger: Logger,
  ) {}
  /* eslint-enable no-unused-vars */

  async processGoodsReceipt(grn: GoodsReceiptNote): Promise<GRNProcessingResult> {
    this._logger.log(`Processing GRN: ${grn.grnId} for PO: ${grn.purchaseOrderId}`);

    const errors: string[] = [];
    let processedItems = 0;

    try {
      for (const item of grn.items) {
        try {
          const command: ReceiveStockCommand = {
            movementId: `grn-${grn.grnId}-${item.sku}`,
            sku: item.sku,
            quantity: item.quantity,
            unitCost: item.unitCost,
            location: item.location,
            reference: grn.purchaseOrderId,
            tenantId: grn.tenantId,
            userId: grn.userId,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
            serialNumbers: item.serialNumbers,
          };

          await this._inventoryService.receiveStock(command);
          processedItems++;
        } catch (error) {
          const errorMessage = `Failed to process item ${item.sku}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMessage);
          this._logger.error(errorMessage, error);
        }
      }

      // Emit GRN processed event
      await this._eventStore.append(
        `grn-${grn.grnId}`,
        [new GoodsReceiptProcessedEvent(grn.grnId, grn.purchaseOrderId, grn.tenantId)],
        0,
      );

      const status = errors.length === 0 ? 'SUCCESS' : processedItems > 0 ? 'PARTIAL' : 'FAILED';

      return {
        grnId: grn.grnId,
        status,
        processedItems,
        totalItems: grn.items.length,
        errors,
        processedAt: new Date(),
      };
    } catch (error) {
      this._logger.error(`Failed to process GRN ${grn.grnId}:`, error);
      return {
        grnId: grn.grnId,
        status: 'FAILED',
        processedItems: 0,
        totalItems: grn.items.length,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        processedAt: new Date(),
      };
    }
  }

  async validatePurchaseOrder(
    poId: string,
    sku: string,
    quantity: number,
    tenantId: string,
  ): Promise<PurchaseOrderValidation> {
    try {
      // Validate against current stock levels and business rules
      const currentStock = await this._inventoryService.getCurrentStock(sku, tenantId);
      const reservedStock = await this.getReservedStock(sku, tenantId);
      const availableStock = currentStock - reservedStock;

      const isValid = availableStock >= quantity;
      const shortfall = isValid ? 0 : quantity - availableStock;

      return {
        poId,
        sku,
        quantity,
        tenantId,
        isValid,
        availableStock,
        shortfall: shortfall > 0 ? shortfall : undefined,
      };
    } catch (error) {
      this._logger.error(`Failed to validate purchase order ${poId}:`, error);
      return {
        poId,
        sku,
        quantity,
        tenantId,
        isValid: false,
        availableStock: 0,
        shortfall: quantity,
      };
    }
  }

  /* eslint-disable no-unused-vars */
  async getPurchaseOrderStatus(
    _poId: string,
    _tenantId: string,
  ): Promise<{
    poId: string;
    status: 'PENDING' | 'PARTIALLY_RECEIVED' | 'FULLY_RECEIVED' | 'OVER_RECEIVED';
    totalQuantity: number;
    receivedQuantity: number;
    pendingQuantity: number;
    items: Array<{
      sku: string;
      orderedQuantity: number;
      receivedQuantity: number;
      pendingQuantity: number;
    }>;
  }> {
    // Implementation for getting purchase order status
    // This would typically query the procurement system or maintain local state
    throw new Error('Method not implemented');
  }
  /* eslint-enable no-unused-vars */

  /* eslint-disable no-unused-vars */
  private async getReservedStock(_sku: string, _tenantId: string): Promise<number> {
    // Implementation for getting reserved stock
    // This would typically query the reservation system
    return 0;
  }
  /* eslint-enable no-unused-vars */
}
