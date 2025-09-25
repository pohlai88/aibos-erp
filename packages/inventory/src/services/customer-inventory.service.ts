import type { EventStore } from '../infrastructure/event-store/event-store';
import type {
  CustomerInventoryItem,
  CustomerPricingUpdate,
} from '../integrations/interfaces/crm.interface';
import type { InventoryService } from './inventory.service';
import type { Logger } from '@nestjs/common';

/* eslint-disable no-unused-vars */
import { Injectable } from '@nestjs/common';

@Injectable()
export class CustomerInventoryService {
  constructor(
    private readonly _inventoryService: InventoryService,

    private readonly _eventStore: EventStore,

    private readonly _logger: Logger,
  ) {}

  async getCustomerInventoryItems(
    customerId: string,
    _tenantId: string,
  ): Promise<CustomerInventoryItem[]> {
    this._logger.log(`Getting inventory items for customer: ${customerId}`);

    // For now, return mock data - in production this would query the database
    const mockItems: CustomerInventoryItem[] = [
      {
        sku: 'SKU-001',
        description: 'Product A',
        availableQuantity: 100,
        reservedQuantity: 10,
        unitPrice: 50.0,
        customerPrice: 45.0,
        discountPercentage: 10,
        leadTime: 5,
        location: 'WAREHOUSE-A',
      },
      {
        sku: 'SKU-002',
        description: 'Product B',
        availableQuantity: 50,
        reservedQuantity: 5,
        unitPrice: 75.0,
        customerPrice: 67.5,
        discountPercentage: 10,
        leadTime: 7,
        location: 'WAREHOUSE-A',
      },
    ];

    return mockItems;
  }

  async updateCustomerPricing(command: {
    customerId: string;
    sku: string;
    customerPrice: number;
    discountPercentage: number;
    tenantId: string;
  }): Promise<void> {
    this._logger.log(`Updating pricing for customer: ${command.customerId}, SKU: ${command.sku}`);

    // In production, this would update the customer-specific pricing in the database
    // For now, we'll just log the update
    this._logger.log(
      `Updated pricing - Customer: ${command.customerId}, SKU: ${command.sku}, Price: ${command.customerPrice}, Discount: ${command.discountPercentage}%`,
    );
  }

  async getCustomerInfo(
    customerId: string,
    _tenantId: string,
  ): Promise<{
    name: string;
    tier: string;
    creditLimit: number;
    currentCreditUsed: number;
  }> {
    this._logger.log(`Getting customer info for: ${customerId}`);

    // For now, return mock data - in production this would query the CRM system
    return {
      name: `Customer ${customerId}`,
      tier: 'GOLD',
      creditLimit: 100000,
      currentCreditUsed: 25000,
    };
  }

  async updateCustomerPricingBatch(
    customerId: string,
    pricingUpdates: CustomerPricingUpdate[],
    _tenantId: string,
  ): Promise<void> {
    this._logger.log(`Updating batch pricing for customer: ${customerId}`);

    for (const update of pricingUpdates) {
      await this.updateCustomerPricing({
        customerId,
        sku: update.sku,
        customerPrice: update.customerPrice,
        discountPercentage: update.discountPercentage,
        tenantId: _tenantId,
      });
    }
  }
}
