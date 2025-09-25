import { VendorInventoryUpdatedEvent } from '../events/vendor-inventory-updated-event';
import { type EventStore } from '../infrastructure/event-store/event-store';
import { type InventoryService } from '../services/inventory.service';
import { type VendorInventoryData } from './interfaces/procurement.interface';
import { Injectable, type Logger } from '@nestjs/common';

@Injectable()
export class VendorIntegrationService {
  /* eslint-disable no-unused-vars */
  constructor(
    private readonly _inventoryService: InventoryService,
    private readonly _eventStore: EventStore,
    private readonly _logger: Logger,
  ) {}
  /* eslint-enable no-unused-vars */

  async updateVendorInventory(vendorData: VendorInventoryData): Promise<void> {
    this._logger.log(
      `Updating vendor inventory for vendor: ${vendorData.vendorId}, SKU: ${vendorData.sku}`,
    );

    try {
      // Update inventory item with vendor information
      await this._inventoryService.updateVendorInformation({
        sku: vendorData.sku,
        vendorId: vendorData.vendorId,
        vendorSku: vendorData.vendorSku,
        vendorName: vendorData.vendorName,
        leadTime: vendorData.leadTime,
        minimumOrderQuantity: vendorData.minimumOrderQuantity,
        tenantId: vendorData.tenantId,
      });

      // Emit vendor inventory updated event
      await this._eventStore.append(
        `vendor-${vendorData.vendorId}`,
        [
          new VendorInventoryUpdatedEvent(
            vendorData.vendorId,
            vendorData.sku,
            vendorData.vendorSku,
            vendorData.vendorName,
            vendorData.tenantId,
          ),
        ],
        0,
      );

      this._logger.log(`Successfully updated vendor inventory for vendor: ${vendorData.vendorId}`);
    } catch (error) {
      this._logger.error(
        `Failed to update vendor inventory for vendor ${vendorData.vendorId}:`,
        error,
      );
      throw error;
    }
  }

  async getVendorInventory(vendorId: string, tenantId: string): Promise<VendorInventoryData[]> {
    try {
      return (await this._inventoryService.getInventoryByVendor(
        vendorId,
        tenantId,
      )) as VendorInventoryData[];
    } catch (error) {
      this._logger.error(`Failed to get vendor inventory for vendor ${vendorId}:`, error);
      throw error;
    }
  }

  /* eslint-disable no-unused-vars */
  async getVendorPerformance(
    _vendorId: string,
    _tenantId: string,
  ): Promise<{
    vendorId: string;
    vendorName: string;
    totalOrders: number;
    onTimeDelivery: number;
    qualityRating: number;
    averageLeadTime: number;
    lastOrderDate?: Date;
  }> {
    // Implementation for getting vendor performance metrics
    // This would typically query the procurement system or maintain local state
    throw new Error('Method not implemented');
  }
  /* eslint-enable no-unused-vars */

  async updateVendorPricing(
    vendorId: string,
    pricingUpdates: Array<{
      sku: string;
      customerPrice: number;
      discountPercentage: number;
    }>,
    tenantId: string,
  ): Promise<void> {
    this._logger.log(`Updating vendor pricing for vendor: ${vendorId}`);

    try {
      for (const update of pricingUpdates) {
        await this._inventoryService.updateVendorPricing({
          sku: update.sku,
          vendorId,
          customerPrice: update.customerPrice,
          discountPercentage: update.discountPercentage,
          tenantId,
        });
      }

      this._logger.log(`Successfully updated vendor pricing for vendor: ${vendorId}`);
    } catch (error) {
      this._logger.error(`Failed to update vendor pricing for vendor ${vendorId}:`, error);
      throw error;
    }
  }

  async getVendorLeadTime(
    vendorId: string,
    sku: string,
    quantity: number,
    tenantId: string,
  ): Promise<{
    vendorId: string;
    sku: string;
    quantity: number;
    leadTime: number;
    canMeetQuantity: boolean;
    suggestedQuantity?: number;
  }> {
    try {
      const vendorData = (await this._inventoryService.getVendorData(
        vendorId,
        sku,
        tenantId,
      )) as unknown;

      if (!vendorData) {
        throw new Error(`Vendor data not found for vendor ${vendorId} and SKU ${sku}`);
      }

      const vendorDataTyped = vendorData as { minimumOrderQuantity: number; leadTime: number };
      const canMeetQuantity = quantity >= vendorDataTyped.minimumOrderQuantity;
      const suggestedQuantity = canMeetQuantity ? quantity : vendorDataTyped.minimumOrderQuantity;

      return {
        vendorId,
        sku,
        quantity,
        leadTime: vendorDataTyped.leadTime,
        canMeetQuantity,
        suggestedQuantity: canMeetQuantity ? undefined : suggestedQuantity,
      };
    } catch (error) {
      this._logger.error(`Failed to get vendor lead time for vendor ${vendorId}:`, error);
      throw error;
    }
  }
}
