import type { EventStore } from '../infrastructure/event-store/event-store';
import type { CustomerInventoryService } from '../services/customer-inventory.service';
import type { InventoryService } from '../services/inventory.service';
import type {
  CustomerInventoryView,
  CustomerPricingUpdate,
  CreditImpact,
  CustomerTier,
} from './interfaces/crm.interface';
import type { Logger } from '@nestjs/common';

/* eslint-disable no-unused-vars */
import { Injectable } from '@nestjs/common';

@Injectable()
export class CrmIntegrationService {
  constructor(
    private readonly _inventoryService: InventoryService,

    private readonly _customerInventoryService: CustomerInventoryService,

    private readonly _eventStore: EventStore,

    private readonly _logger: Logger,
  ) {}

  async getCustomerInventoryView(
    customerId: string,
    tenantId: string,
  ): Promise<CustomerInventoryView> {
    this._logger.log(`Generating inventory view for customer: ${customerId}`);

    const customer = await this._customerInventoryService.getCustomerInfo(customerId, tenantId);
    const inventoryItems = await this._customerInventoryService.getCustomerInventoryItems(
      customerId,
      tenantId,
    );

    const totalValue = inventoryItems.reduce(
      (sum, item) => sum + item.availableQuantity * item.customerPrice,
      0,
    );

    return {
      customerId,
      customerName: customer.name,
      customerTier: customer.tier as CustomerTier,
      inventoryItems,
      totalValue,
      lastUpdated: new Date(),
      tenantId,
    };
  }

  async updateCustomerPricing(
    customerId: string,
    pricingUpdates: CustomerPricingUpdate[],
    tenantId: string,
  ): Promise<void> {
    this._logger.log(`Updating pricing for customer: ${customerId}`);

    await this._customerInventoryService.updateCustomerPricingBatch(
      customerId,
      pricingUpdates,
      tenantId,
    );

    // Emit customer pricing updated event
    await this._eventStore.append(
      `customer-${customerId}`,
      [], // Events would be added here in production
      0,
    );
  }

  async getCustomerCreditImpact(
    customerId: string,
    sku: string,
    quantity: number,
    tenantId: string,
  ): Promise<CreditImpact> {
    const customer = await this._customerInventoryService.getCustomerInfo(customerId, tenantId);
    // For now, return mock data - in production this would query the inventory service
    const item = {
      sku,
      unitCost: 25.0,
      availableStock: 100,
    };
    const totalValue = quantity * item.unitCost;

    return {
      customerId,
      sku,
      quantity,
      totalValue,
      creditLimit: customer.creditLimit,
      currentCreditUsed: customer.currentCreditUsed,
      availableCredit: customer.creditLimit - customer.currentCreditUsed,
      creditImpact: totalValue,
      canProcessOrder: customer.currentCreditUsed + totalValue <= customer.creditLimit,
    };
  }

  async validateCustomerOrder(
    customerId: string,
    items: Array<{ sku: string; quantity: number }>,
    tenantId: string,
  ): Promise<{
    isValid: boolean;
    creditImpact: CreditImpact;
    unavailableItems: Array<{ sku: string; required: number; available: number }>;
  }> {
    this._logger.log(`Validating customer order for: ${customerId}`);

    const unavailableItems: Array<{ sku: string; required: number; available: number }> = [];

    // Check inventory availability
    for (const item of items) {
      const availableStock = await this._inventoryService.getAvailableStock(
        item.sku,
        'WAREHOUSE-A', // Default location
        tenantId,
      );

      if (availableStock < item.quantity) {
        unavailableItems.push({
          sku: item.sku,
          required: item.quantity,
          available: availableStock,
        });
      }

      // For now, return mock data - in production this would query the inventory service
      const inventoryItem = {
        sku: item.sku,
        unitCost: 25.0,
        availableStock: 100,
      };
      // Calculate total order value for credit impact (currently unused but needed for future credit calculations)
      const _itemValue = item.quantity * inventoryItem.unitCost;
    }

    // Check credit impact
    const creditImpact = await this.getCustomerCreditImpact(
      customerId,
      items[0]?.sku ?? '',
      items.reduce((sum, item) => sum + item.quantity, 0),
      tenantId,
    );

    return {
      isValid: unavailableItems.length === 0 && creditImpact.canProcessOrder,
      creditImpact,
      unavailableItems,
    };
  }
}
