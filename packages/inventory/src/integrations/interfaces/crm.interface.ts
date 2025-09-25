/* eslint-disable no-unused-vars */
export interface CustomerInventoryView {
  readonly customerId: string;
  readonly customerName: string;
  readonly customerTier: CustomerTier;
  readonly inventoryItems: CustomerInventoryItem[];
  readonly totalValue: number;
  readonly lastUpdated: Date;
  readonly tenantId: string;
}

export interface CustomerInventoryItem {
  readonly sku: string;
  readonly description: string;
  readonly availableQuantity: number;
  readonly reservedQuantity: number;
  readonly unitPrice: number;
  readonly customerPrice: number;
  readonly discountPercentage: number;
  readonly leadTime: number;
  readonly location: string;
}

export enum CustomerTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

export interface CustomerPricingUpdate {
  readonly sku: string;
  readonly customerPrice: number;
  readonly discountPercentage: number;
}

export interface CreditImpact {
  readonly customerId: string;
  readonly sku: string;
  readonly quantity: number;
  readonly totalValue: number;
  readonly creditLimit: number;
  readonly currentCreditUsed: number;
  readonly availableCredit: number;
  readonly creditImpact: number;
  readonly canProcessOrder: boolean;
}

export interface SalesOpportunityData {
  readonly opportunityId: string;
  readonly customerId: string;
  readonly salesRepId: string;
  readonly stage: OpportunityStage;
  readonly probability: number;
  readonly expectedCloseDate: Date;
  readonly items: OpportunityItem[];
  readonly tenantId: string;
}

export interface OpportunityItem {
  readonly sku: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly location: string;
}

export enum OpportunityStage {
  LEAD = 'LEAD',
  QUALIFIED = 'QUALIFIED',
  PROPOSAL = 'PROPOSAL',
  NEGOTIATION = 'NEGOTIATION',
  CLOSED_WON = 'CLOSED_WON',
  CLOSED_LOST = 'CLOSED_LOST',
}

export interface OpportunityInventoryReport {
  readonly totalOpportunities: number;
  readonly totalAllocatedValue: number;
  readonly opportunitiesByStage: Record<OpportunityStage, number>;
  readonly inventoryAllocationBySku: Record<string, number>;
}
