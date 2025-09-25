import type { EventStore } from '../infrastructure/event-store/event-store';
import type { InventoryService } from '../services/inventory.service';
import type {
  SalesOpportunityData,
  OpportunityInventoryReport,
  OpportunityStage,
} from './interfaces/crm.interface';
import type { Logger } from '@nestjs/common';

import { SalesOpportunity } from '../domain/sales-opportunity';
import { InsufficientStockError } from '../exceptions/insufficient-stock-error';
/* eslint-disable no-unused-vars */
import { Injectable } from '@nestjs/common';

const WAREHOUSE_A = 'WAREHOUSE-A';

@Injectable()
export class SalesPipelineIntegrationService {
  constructor(
    private readonly _inventoryService: InventoryService,

    private readonly _eventStore: EventStore,

    private readonly _logger: Logger,
  ) {}

  async allocateInventoryForOpportunity(opportunityId: string, tenantId: string): Promise<void> {
    this._logger.log(`Allocating inventory for opportunity: ${opportunityId}`);

    const opportunity = await this._loadOpportunity(opportunityId, tenantId);

    // Check inventory availability for all items
    for (const item of opportunity._items) {
      const availableStock = await this._inventoryService.getAvailableStock(
        item.sku,
        item.location,
        tenantId,
      );

      if (availableStock < item.quantity) {
        throw new InsufficientStockError(
          `Insufficient stock for opportunity ${opportunityId}. SKU: ${item.sku}, Available: ${availableStock}, Required: ${item.quantity}`,
        );
      }
    }

    // Allocate inventory
    opportunity.allocateInventory();

    await this._eventStore.append(
      `opportunity-${opportunityId}`,
      opportunity.getUncommittedEvents(),
      opportunity.getVersion(),
    );

    opportunity.markEventsAsCommitted();
  }

  async releaseInventoryForOpportunity(opportunityId: string, tenantId: string): Promise<void> {
    this._logger.log(`Releasing inventory for opportunity: ${opportunityId}`);

    const opportunity = await this._loadOpportunity(opportunityId, tenantId);

    // Release all allocated inventory
    opportunity.releaseInventory();

    await this._eventStore.append(
      `opportunity-${opportunityId}`,
      opportunity.getUncommittedEvents(),
      opportunity.getVersion(),
    );

    opportunity.markEventsAsCommitted();
  }

  async updateOpportunityStage(
    opportunityId: string,
    newStage: OpportunityStage,
    tenantId: string,
  ): Promise<void> {
    this._logger.log(`Updating opportunity stage: ${opportunityId} to ${newStage}`);

    const opportunity = await this._loadOpportunity(opportunityId, tenantId);
    opportunity.updateStage(newStage);

    await this._eventStore.append(
      `opportunity-${opportunityId}`,
      opportunity.getUncommittedEvents(),
      opportunity.getVersion(),
    );

    opportunity.markEventsAsCommitted();
  }

  async getOpportunityInventoryReport(tenantId: string): Promise<OpportunityInventoryReport> {
    this._logger.log('Generating opportunity inventory report');

    const opportunities = await this._getAllActiveOpportunities(tenantId);
    const totalAllocatedValue = opportunities.reduce((sum, opp) => {
      return (
        sum +
        opp._items.reduce(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (itemSum: number, item: any) => itemSum + item.quantity * item.unitPrice,
          0,
        )
      );
    }, 0);

    return {
      totalOpportunities: opportunities.length,
      totalAllocatedValue,
      opportunitiesByStage: this._groupOpportunitiesByStage(opportunities),
      inventoryAllocationBySku: this._getInventoryAllocationBySku(opportunities),
    };
  }

  private async _loadOpportunity(
    opportunityId: string,
    tenantId: string,
  ): Promise<SalesOpportunity> {
    // For now, return mock data - in production this would load from event store
    const mockOpportunityData: SalesOpportunityData = {
      opportunityId,
      customerId: 'customer-001',
      salesRepId: 'salesrep-001',
      stage: 'PROPOSAL' as OpportunityStage,
      probability: 0.7,
      expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      items: [
        {
          sku: 'SKU-001',
          quantity: 50,
          unitPrice: 45.0,
          location: WAREHOUSE_A,
        },
        {
          sku: 'SKU-002',
          quantity: 25,
          unitPrice: 67.5,
          location: WAREHOUSE_A,
        },
      ],
      tenantId,
    };

    return new SalesOpportunity(
      mockOpportunityData.opportunityId,
      mockOpportunityData.customerId,
      mockOpportunityData.salesRepId,
      mockOpportunityData.stage,
      mockOpportunityData.probability,
      mockOpportunityData.expectedCloseDate,
      mockOpportunityData.items,
      mockOpportunityData.tenantId,
    );
  }

  private async _getAllActiveOpportunities(tenantId: string): Promise<SalesOpportunity[]> {
    // For now, return mock data - in production this would query the database
    const mockOpportunities: SalesOpportunity[] = [];

    const opportunity1 = new SalesOpportunity(
      'opp-001',
      'customer-001',
      'salesrep-001',
      'PROPOSAL' as OpportunityStage,
      0.7,
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      [
        {
          sku: 'SKU-001',
          quantity: 50,
          unitPrice: 45.0,
          location: WAREHOUSE_A,
        },
      ],
      tenantId,
    );

    const opportunity2 = new SalesOpportunity(
      'opp-002',
      'customer-002',
      'salesrep-002',
      'NEGOTIATION' as OpportunityStage,
      0.8,
      new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      [
        {
          sku: 'SKU-002',
          quantity: 25,
          unitPrice: 67.5,
          location: WAREHOUSE_A,
        },
      ],
      tenantId,
    );

    mockOpportunities.push(opportunity1, opportunity2);
    return mockOpportunities;
  }

  private _groupOpportunitiesByStage(
    opportunities: SalesOpportunity[],
  ): Record<OpportunityStage, number> {
    const grouped: Record<OpportunityStage, number> = {
      LEAD: 0,
      QUALIFIED: 0,
      PROPOSAL: 0,
      NEGOTIATION: 0,
      CLOSED_WON: 0,
      CLOSED_LOST: 0,
    };

    for (const opportunity of opportunities) {
      grouped[opportunity._stage]++;
    }

    return grouped;
  }

  private _getInventoryAllocationBySku(opportunities: SalesOpportunity[]): Record<string, number> {
    const allocation: Record<string, number> = {};

    for (const opportunity of opportunities) {
      for (const item of opportunity._items) {
        allocation[item.sku] = (allocation[item.sku] ?? 0) + item.quantity;
      }
    }

    return allocation;
  }
}
